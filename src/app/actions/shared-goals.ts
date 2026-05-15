'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function pushSharedGoal(formData: {
  thrust_area: string
  title: string
  description: string
  uom_type: string
  target: string
  target_date: string
  employeeIds: string[]
}) {
  const supabase = await createClient()

  const goalsToInsert = formData.employeeIds.map(empId => ({
    employee_id: empId,
    thrust_area: formData.thrust_area,
    title: formData.title,
    description: formData.description,
    uom_type: formData.uom_type,
    target: formData.target,
    target_date: formData.target_date,
    weightage: 10, // Default minimum weightage
    status: 'draft',
    is_shared: true
  }))

  const { error } = await supabase.from('goals').insert(goalsToInsert)

  if (error) return { error: error.message }

  revalidatePath('/admin/shared-goals')
  return { success: true }
}
