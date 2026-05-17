'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getWeightageSum(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('goals')
    .select('weightage')
    .eq('employee_id', userId)

  if (error) return 0
  return data.reduce((sum, goal) => sum + Number(goal.weightage), 0)
}

export async function createGoal(formData: any) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const currentSum = await getWeightageSum(user.id)
  const newWeightage = Number(formData.weightage)

  const { count, error: countError } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', user.id)

  if (countError) return { error: countError.message }
  if (count && count >= 8) {
    return { error: 'Maximum of 8 goals allowed per employee.' }
  }

  if (currentSum + newWeightage > 100) {
    return { error: 'Total weightage would exceed 100%' }
  }

  const { error } = await supabase.from('goals').insert({
    employee_id: user.id,
    thrust_area: formData.thrust_area,
    title: formData.title,
    description: formData.description || null,
    uom_type: formData.uom_type,
    target: formData.target ? Number(formData.target) : null,
    target_date: formData.target_date || null,
    weightage: newWeightage,
    status: 'draft'
  })

  if (error) return { error: error.message }

  revalidatePath('/employee/goals')
  return { success: true }
}

export async function updateGoal(goalId: string, formData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Fetch current goal
  const { data: goal } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single()

  if (!goal) return { error: 'Goal not found' }
  if (goal.employee_id !== user.id) return { error: 'Unauthorized' }
  if (!['draft', 'returned'].includes(goal.status)) {
    return { error: 'Only draft or returned goals can be edited.' }
  }

  // 2. Validate total weightage
  const currentSum = await getWeightageSum(user.id)
  const newWeightage = Number(formData.weightage)
  const weightageDiff = newWeightage - Number(goal.weightage)

  if (currentSum + weightageDiff > 100) {
    return { error: `Total weightage would exceed 100% (Current: ${currentSum + weightageDiff}%)` }
  }

  // 3. Prepare update data
  let updateData: any = {
    weightage: newWeightage,
    updated_at: new Date().toISOString()
  }

  // Only allow updating other fields if NOT a shared goal
  if (!goal.is_shared) {
    updateData = {
      ...updateData,
      thrust_area: formData.thrust_area,
      title: formData.title,
      description: formData.description || null,
      uom_type: formData.uom_type,
      target: formData.target ? Number(formData.target) : null,
      target_date: formData.target_date || null,
    }
  }

  const { error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', goalId)

  if (error) return { error: error.message }

  revalidatePath('/employee/goals')
  revalidatePath(`/employee/goals/${goalId}`)
  return { success: true }
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Check goal exists and is in 'draft' status
  const { data: goal } = await supabase
    .from('goals')
    .select('status, employee_id')
    .eq('id', goalId)
    .single()

  if (!goal) return { error: 'Goal not found' }
  if (goal.employee_id !== user.id) return { error: 'Unauthorized' }
  if (goal.status !== 'draft') return { error: 'Only draft goals can be deleted.' }

  // 2. Delete
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)

  if (error) return { error: error.message }

  revalidatePath('/employee/goals')
  return { success: true }
}
