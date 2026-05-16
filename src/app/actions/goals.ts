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
  redirect('/employee/goals')
}
