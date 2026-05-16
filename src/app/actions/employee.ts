'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'

export async function submitGoal(goalId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Check total weightage for all goals
  const { data: goals } = await supabase
    .from('goals')
    .select('weightage')
    .eq('employee_id', user.id)

  const total = goals?.reduce((sum, g) => sum + Number(g.weightage), 0) || 0
  
  if (total !== 100) {
    return { error: `Total weightage must be exactly 100%. Current total: ${total}%` }
  }

  // 2. Update status
  const { error } = await supabase
    .from('goals')
    .update({ status: 'submitted' })
    .eq('id', goalId)

  if (error) return { error: error.message }

  // 3. Notify manager
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('name, manager:users!manager_id(email)')
      .eq('id', user.id)
      .single()

    if (userData?.manager) {
      const managerEmail = (userData.manager as any).email
      if (managerEmail) {
        await sendEmail(
          managerEmail,
          'New Goal Awaiting Your Approval',
          `<p><strong>${userData.name}</strong> has submitted goals for your review.</p>`
        )
      }
    }
  } catch (err) {
    console.error('Notification error:', err)
  }
  
  revalidatePath('/employee/goals')
  return { success: true }
}
