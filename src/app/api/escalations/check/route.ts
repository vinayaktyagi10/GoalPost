import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentQuarter } from '@/lib/utils/calculator'
import { sendEmail } from '@/lib/email'

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
        .select('id, name, manager:users!manager_id(email), goals!inner(id, title, status, created_at)')
        .eq('role', 'employee')

      for (const emp of (employees || [])) {
        const drafts = (emp as any).goals.filter((g: any) => g.status === 'draft')
        const overdueDrafts = drafts.filter((g: any) => new Date(g.created_at) < thresholdDate)
        
        if (overdueDrafts.length > 0) {
          for (const g of overdueDrafts) {
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

            // Notify Manager
            const managerEmail = (emp.manager as any)?.email
            if (managerEmail) {
              await sendEmail(
                managerEmail,
                'Escalation Alert: Action Required',
                `<p><strong>${emp.name}</strong> has not submitted the goal "<strong>${g.title}</strong>" for review (Overdue by ${daysOverdue} days).</p>`
              )
            }
          }
        }
      }
    }

    if (rule.trigger_event === 'goal_not_approved') {
      // Find submitted goals where updated_at > threshold
      const { data: pendingGoals } = await supabase
        .from('goals')
        .select(`
          id, 
          title, 
          updated_at, 
          users!employee_id (
            id, 
            name, 
            manager:users!manager_id(email)
          )
        `)
        .eq('status', 'submitted')
        .lt('updated_at', thresholdDate.toISOString())

      for (const g of (pendingGoals || [])) {
        const daysOverdue = Math.floor((now.getTime() - new Date(g.updated_at).getTime()) / (1000 * 3600 * 24))
        const user = g.users as any
        
        violations.push({
          employee: user?.name,
          goal: g.title,
          rule: rule.rule_name,
          daysOverdue,
          employee_id: user?.id,
          goal_id: g.id,
          rule_id: rule.id
        })
        logs.push({ rule_id: rule.id, goal_id: g.id, employee_id: user?.id })

        // Notify Manager (the manager who needs to approve)
        const managerEmail = user?.manager?.email
        if (managerEmail) {
          await sendEmail(
            managerEmail,
            'Escalation Alert: Action Required',
            `<p>A goal submitted by <strong>${user?.name}</strong> has been awaiting your approval for ${daysOverdue} days.</p>`
          )
        }
      }
    }

    if (rule.trigger_event === 'checkin_not_completed') {
      // Find locked goals with no achievement for current quarter
      const { data: lockedGoals } = await supabase
        .from('goals')
        .select(`
          id, 
          title, 
          users!employee_id (
            id, 
            name, 
            manager:users!manager_id(email)
          ), 
          achievements(quarter)
        `)
        .eq('status', 'locked')

      for (const g of (lockedGoals || [])) {
        const hasCheckin = (g as any).achievements?.some((a: any) => a.quarter === currentQuarter)
        if (!hasCheckin) {
          const user = g.users as any

          violations.push({
            employee: user?.name,
            goal: g.title,
            rule: rule.rule_name,
            daysOverdue: 'N/A', // Quarterly check
            employee_id: user?.id,
            goal_id: g.id,
            rule_id: rule.id
          })
          logs.push({ rule_id: rule.id, goal_id: g.id, employee_id: user?.id })

          // Notify Manager
          const managerEmail = user?.manager?.email
          if (managerEmail) {
            await sendEmail(
              managerEmail,
              'Escalation Alert: Action Required',
              `<p><strong>${user?.name}</strong> has not completed their <strong>${currentQuarter}</strong> check-in for the goal "<strong>${g.title}</strong>".</p>`
            )
          }
        }
      }
    }
  }

  // 2. Batch log violations to escalation_log
  if (logs.length > 0) {
    await supabase.from('escalation_log').insert(logs)
  }

  return NextResponse.json({ violations })
}
