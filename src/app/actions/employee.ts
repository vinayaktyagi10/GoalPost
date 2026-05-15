'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitGoal(goalId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('goals')
    .update({ status: 'submitted' })
    .eq('id', goalId)

  if (error) return { error: error.message }
  
  revalidatePath('/employee/goals')
  return { success: true }
}
