'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function unlockGoal(goalId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Get current goal data for audit log
  const { data: oldGoal } = await supabase
    .from('goals')
    .select('*')
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
    changed_by: user.id,
    action: 'unlock',
    field_changed: 'status',
    old_value: oldGoal?.status,
    new_value: 'draft'
  })
  
  revalidatePath('/admin/dashboard')
  return { success: true }
}
