'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEscalationRule(formData: {
  rule_name: string
  trigger_event: 'goal_not_submitted' | 'goal_not_approved' | 'checkin_not_completed'
  days_threshold: number
  is_active: boolean
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('escalation_rules')
    .insert({
      rule_name: formData.rule_name,
      trigger_event: formData.trigger_event,
      days_threshold: formData.days_threshold,
      is_active: formData.is_active
    })

  if (error) return { error: error.message }
  
  revalidatePath('/admin/escalations')
  return { success: true }
}

export async function toggleEscalationRule(id: string, isActive: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('escalation_rules')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/escalations')
  return { success: true }
}

export async function deleteEscalationRule(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('escalation_rules')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/escalations')
  return { success: true }
}
