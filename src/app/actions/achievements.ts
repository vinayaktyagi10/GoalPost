'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateProgressScore, UomType } from '@/lib/utils/calculator'

export async function upsertAchievement(formData: {
  goalId: string
  quarter: string
  actualValue?: number
  actualDate?: string
}) {
  const supabase = await createClient()

  // 1. Get the goal details to compute the score
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('uom_type, target, target_date')
    .eq('id', formData.goalId)
    .single()

  if (goalError) return { error: goalError.message }

  // 2. Compute the score
  const computedScore = calculateProgressScore(
    goal.uom_type as UomType,
    goal.target,
    formData.actualValue ?? null,
    goal.target_date,
    formData.actualDate ?? null
  )

  // 3. Upsert achievement
  const { error } = await supabase
    .from('achievements')
    .upsert({
      goal_id: formData.goalId,
      quarter: formData.quarter,
      actual_value: formData.actualValue,
      actual_date: formData.actualDate,
      progress_status: computedScore === 100 ? 'completed' : 'on_track',
      computed_score: computedScore,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'goal_id,quarter'
    })

  if (error) return { error: error.message }

  revalidatePath('/employee/checkin')
  return { success: true, score: computedScore }
}
