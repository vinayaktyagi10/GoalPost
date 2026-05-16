import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentQuarter } from '@/lib/utils/calculator'

export async function GET() {
  const supabase = await createClient()
  const currentQuarter = getCurrentQuarter()
  const now = new Date()

  // 1. Get active rules
  const { data: rules } = await supabase
    .from('escalation_rules')
    .select('*')
    .eq('is_active', true)

  if (!rules) return NextResponse.json({ violations: [] })

  const violations: any[] = []
  const logs: any[] = []

  for (const rule of rules) {
    const thresholdDate = new Date(now.getTime() - rule.days_threshold * 24 * 60 * 60 * 1000)

    if (rule.trigger_event === 'goal_not_submitted') {
      // Find employees where goals exist but all are still 'draft' and created long ago
      const { data: employees } = await supabase
        .from('users')
        .select('id, name, goals!inner(id, title, status, created_at)')
        .eq('role', 'employee')

      for (const emp of (employees || [])) {
        const drafts = emp.goals.filter((g: any) => g.status === 'draft')
        const overdueDrafts = drafts.filter((g: any) => new Date(g.created_at) < thresholdDate)
        
        if (overdueDrafts.length > 0) {
          overdueDrafts.forEach((g: any) => {
            const daysOverdue = Math.floor((now.getTime() - new Date(g.created_at).getTime()) / (1000 * 3600 * 24))
            violations.push({
              employee: emp.name,
              goal: g.title,
              rule: rule.rule_name,
              daysOverdue,
              employee_id: emp.id,
              goal_id: g.id,
              rule_id: rule.id
            })
            logs.push({ rule_id: rule.id, goal_id: g.id, employee_id: emp.id })
          })
        }
      }
    }

    if (rule.trigger_event === 'goal_not_approved') {
      // Find submitted goals where updated_at > threshold
      const { data: pendingGoals } = await supabase
        .from('goals')
        .select('id, title, updated_at, users(id, name)')
        .eq('status', 'submitted')
        .lt('updated_at', thresholdDate.toISOString())

      pendingGoals?.forEach((g: any) => {
        const daysOverdue = Math.floor((now.getTime() - new Date(g.updated_at).getTime()) / (1000 * 3600 * 24))
        violations.push({
          employee: g.users?.name,
          goal: g.title,
          rule: rule.rule_name,
          daysOverdue,
          employee_id: g.users?.id,
          goal_id: g.id,
          rule_id: rule.id
        })
        logs.push({ rule_id: rule.id, goal_id: g.id, employee_id: g.users?.id })
      })
    }

    if (rule.trigger_event === 'checkin_not_completed') {
      // Find locked goals with no achievement for current quarter
      const { data: lockedGoals } = await supabase
        .from('goals')
        .select('id, title, users(id, name), achievements(quarter)')
        .eq('status', 'locked')

      lockedGoals?.forEach((g: any) => {
        const hasCheckin = g.achievements?.some((a: any) => a.quarter === currentQuarter)
        if (!hasCheckin) {
          violations.push({
            employee: g.users?.name,
            goal: g.title,
            rule: rule.rule_name,
            daysOverdue: 'N/A', // Quarterly check
            employee_id: g.users?.id,
            goal_id: g.id,
            rule_id: rule.id
          })
          logs.push({ rule_id: rule.id, goal_id: g.id, employee_id: g.users?.id })
        }
      })
    }
  }

  // 2. Batch log violations to escalation_log
  if (logs.length > 0) {
    await supabase.from('escalation_log').insert(logs)
  }

  return NextResponse.json({ violations })
}
