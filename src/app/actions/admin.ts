'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'

export async function unlockGoal(goalId: string) {
  const supabase = await createClient()
  
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) throw new Error('Not authenticated')

  // 1. Get current goal and employee email
  const { data: goal } = await supabase
    .from('goals')
    .select('*, users!employee_id(email)')
    .eq('id', goalId)
    .single()

  // 2. Update status
  const { error } = await supabase
    .from('goals')
    .update({ status: 'draft' }) // Unlocking resets to draft for editing
    .eq('id', goalId)

  if (error) return { error: error.message }

  // 3. Log to audit_log
  await supabase.from('audit_log').insert({
    goal_id: goalId,
    changed_by: adminUser.id,
    action: 'unlock',
    field_changed: 'status',
    old_value: goal?.status,
    new_value: 'draft'
  })

  // 4. Notify employee
  const employeeEmail = (goal?.users as any)?.email
  if (employeeEmail) {
    await sendEmail(
      employeeEmail,
      'Your Goal Has Been Unlocked for Editing',
      '<p>Your goal has been unlocked by an admin. Please update and resubmit it for approval.</p>'
    )
  }
  
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) throw new Error('Not authenticated')

  // Use admin client to bypass RLS for user management
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Get current role for audit log
  const { data: user } = await adminClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (!user) return { error: 'User not found' }

  // 2. Update role
  const { error } = await adminClient
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: error.message }

  // 3. Log to audit_log
  await adminClient.from('audit_log').insert({
    changed_by: adminUser.id,
    action: 'role_change',
    field_changed: 'role',
    old_value: user.role,
    new_value: newRole
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Delete achievements first (foreign key)
  await supabase
    .from('achievements')
    .delete()
    .eq('goal_id', goalId)

  // 2. Delete checkin_comments
  await supabase
    .from('checkin_comments')
    .delete()
    .eq('goal_id', goalId)

  // 3. Delete audit_log entries
  await supabase
    .from('audit_log')
    .delete()
    .eq('goal_id', goalId)

  // 4. Delete the goal
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)

  if (error) return { error: error.message }

  // 5. Log the deletion
  await supabase.from('audit_log').insert({
    changed_by: user.id,
    action: 'goal_deleted',
    old_value: goalId
  })

  revalidatePath('/admin/dashboard')
  return { success: true }
}
