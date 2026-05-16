'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateProgressScore, UomType, isQuarterlyWindowActive } from '@/lib/utils/calculator'

export async function upsertAchievement(formData: {
  goalId: string
  quarter: string
  actualValue?: number
  actualDate?: string
  progressStatus: string
}) {
  const supabase = await createClient()

  // 0. Enforce active window
  if (!isQuarterlyWindowActive(formData.quarter)) {
    return { error: `Achievement logging for ${formData.quarter} is currently closed.` }
  }

  // 1. Get the goal details to compute the score
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('uom_type, target, target_date, is_shared, parent_shared_goal_id')
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

  // 3. Upsert achievement for the current goal
  const { error } = await supabase
    .from('achievements')
    .upsert({
      goal_id: formData.goalId,
      quarter: formData.quarter,
      actual_value: formData.actualValue,
      actual_date: formData.actualDate,
      progress_status: formData.progressStatus,
      computed_score: computedScore,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'goal_id,quarter'
    })

  if (error) return { error: error.message }

  // 4. Sync shared goals if applicable
  if (goal.is_shared) {
    const parentIdToMatch = goal.parent_shared_goal_id || formData.goalId
    
    // Find all other linked goals
    const { data: linkedGoals } = await supabase
      .from('goals')
      .select('id')
      .or(`id.eq.${parentIdToMatch},parent_shared_goal_id.eq.${parentIdToMatch}`)
      .neq('id', formData.goalId)

    if (linkedGoals && linkedGoals.length > 0) {
      const achievementsToSync = linkedGoals.map((linkedGoal: any) => ({
        goal_id: linkedGoal.id,
        quarter: formData.quarter,
        actual_value: formData.actualValue,
        actual_date: formData.actualDate,
        progress_status: formData.progressStatus,
        computed_score: computedScore,
        updated_at: new Date().toISOString()
      }))

      await supabase.from('achievements').upsert(achievementsToSync, { onConflict: 'goal_id,quarter' })
    }
  }

  revalidatePath('/employee/checkin')
  return { success: true, score: computedScore }
}
