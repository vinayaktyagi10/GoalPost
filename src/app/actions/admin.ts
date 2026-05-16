'use server'

import { createClient } from '@/lib/supabase/server'
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
