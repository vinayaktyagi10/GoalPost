'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentQuarter } from '@/lib/utils/calculator'

export async function approveGoal(goalId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('goals')
    .update({ status: 'locked' })
    .eq('id', goalId)

  if (error) return { error: error.message }
  
  revalidatePath('/manager/team')
  revalidatePath(`/manager/goals`)
  return { success: true }
}

export async function returnGoal(goalId: string, comment: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  // 1. Update goal status
  const { error: goalError } = await supabase
    .from('goals')
    .update({ status: 'returned' })
    .eq('id', goalId)

  if (goalError) return { error: goalError.message }

  // 2. Add comment
  if (comment) {
    const { error: commentError } = await supabase
      .from('checkin_comments')
      .insert({
        goal_id: goalId,
        manager_id: user.id,
        quarter: getCurrentQuarter(),
        comment: comment
      })
    if (commentError) return { error: commentError.message }
  }
  
  revalidatePath('/manager/team')
  return { success: true }
}

export async function addCheckinComment(formData: { goalId: string, quarter: string, comment: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('checkin_comments')
    .insert({
      goal_id: formData.goalId,
      manager_id: user.id,
      quarter: formData.quarter,
      comment: formData.comment
    })

  if (error) return { error: error.message }
  
  revalidatePath('/manager/checkin')
  return { success: true }
}
