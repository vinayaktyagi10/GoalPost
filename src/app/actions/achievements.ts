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

  // 1. Get the goal details and existing achievement
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('status, uom_type, target, target_date, is_shared, parent_shared_goal_id')
    .eq('id', formData.goalId)
    .single()

  if (goalError) return { error: goalError.message }

  const { data: oldAchievement } = await supabase
    .from('achievements')
    .select('actual_value, actual_date')
    .eq('goal_id', formData.goalId)
    .eq('quarter', formData.quarter)
    .single()

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

  // 4. Log to audit_log if goal is locked
  if (goal.status === 'locked') {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const newValue = formData.actualValue?.toString() || formData.actualDate || ''
      const oldValue = oldAchievement?.actual_value?.toString() || oldAchievement?.actual_date || ''
      
      if (newValue !== oldValue) {
        await supabase.from('audit_log').insert({
          goal_id: formData.goalId,
          changed_by: user.id,
          action: 'achievement_update',
          field_changed: formData.actualDate ? 'actual_date' : 'actual_value',
          old_value: oldValue,
          new_value: newValue
        })
      }
    }
  }

  // 5. Sync shared goals if applicable
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
