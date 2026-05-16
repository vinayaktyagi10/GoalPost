'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentQuarter } from '@/lib/utils/calculator'

export async function approveGoal(goalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('goals')
    .update({ status: 'locked' })
    .eq('id', goalId)

  if (error) return { error: error.message }

  // Log to audit_log
  await supabase.from('audit_log').insert({
    goal_id: goalId,
    changed_by: user.id,
    action: 'goal_approved',
    field_changed: 'status',
    old_value: 'submitted',
    new_value: 'locked'
  })
  
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

  // 3. Log to audit_log
  await supabase.from('audit_log').insert({
    goal_id: goalId,
    changed_by: user.id,
    action: 'goal_returned',
    field_changed: 'status',
    old_value: 'submitted',
    new_value: 'returned'
  })
  
  revalidatePath('/manager/team')
  return { success: true }
}

export async function editGoalInline(formData: { goalId: string, newTarget: number | null, newWeightage: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Fetch current goal and employee's total weightage
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', formData.goalId)
    .single()

  if (goalError || !goal) return { error: goalError?.message || 'Goal not found' }

  const { data: allGoals } = await supabase
    .from('goals')
    .select('weightage')
    .eq('employee_id', goal.employee_id)

  const currentTotal = allGoals?.reduce((sum, g) => sum + Number(g.weightage), 0) || 0
  const newTotal = currentTotal - Number(goal.weightage) + formData.newWeightage

  if (newTotal > 100) {
    return { error: `Total weightage would exceed 100% (Current: ${newTotal}%)` }
  }

  // 2. Update goal
  const { error: updateError } = await supabase
    .from('goals')
    .update({
      target: formData.newTarget,
      weightage: formData.newWeightage
    })
    .eq('id', formData.goalId)

  if (updateError) return { error: updateError.message }

  // 3. Log to audit_log
  const auditEntries = []
  if (Number(goal.target) !== formData.newTarget) {
    auditEntries.push({
      goal_id: formData.goalId,
      changed_by: user.id,
      action: 'manager_edit',
      field_changed: 'target',
      old_value: goal.target?.toString(),
      new_value: formData.newTarget?.toString()
    })
  }
  if (Number(goal.weightage) !== formData.newWeightage) {
    auditEntries.push({
      goal_id: formData.goalId,
      changed_by: user.id,
      action: 'manager_edit',
      field_changed: 'weightage',
      old_value: goal.weightage.toString(),
      new_value: formData.newWeightage.toString()
    })
  }

  if (auditEntries.length > 0) {
    await supabase.from('audit_log').insert(auditEntries)
  }

  revalidatePath(`/manager/goals/${goal.employee_id}`)
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
