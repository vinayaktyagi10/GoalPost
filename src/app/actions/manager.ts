'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveGoal(goalId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('goals')
    .update({ status: 'approved' })
    .eq('id', goalId)

  if (error) return { error: error.message }
  
  revalidatePath('/manager/team')
  revalidatePath(`/manager/goals`)
  return { success: true }
}

export async function returnGoal(goalId: string, comment: string) {
  const supabase = await createClient()
  
  // 1. Update goal status
  const { error: goalError } = await supabase
    .from('goals')
    .update({ status: 'returned' })
    .eq('id', goalId)

  if (goalError) return { error: goalError.message }

  // 2. Add comment (assuming we use checkin_comments or a new table for goal feedback)
  // For now, let's just update the status. If we want feedback, we should use a specific table.
  
  revalidatePath('/manager/team')
  return { success: true }
}

export async function lockGoal(goalId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('goals')
    .update({ status: 'locked' })
    .eq('id', goalId)

  if (error) return { error: error.message }
  revalidatePath('/manager/team')
  return { success: true }
}
