import { createClient } from '@/lib/supabase/server'
import { AnalyticsPageCharts } from '@/components/admin/AnalyticsPageCharts'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // --- Data Fetching ---
  
  // 1. Achievements for QoQ Trends
  const { data: achievements } = await supabase
    .from('achievements')
    .select('quarter, computed_score')

  // 2. Goals for Thrust Area Distribution
  const { data: goals } = await supabase
    .from('goals')
    .select('thrust_area, status, employee_id')

  // 3. Employees and their achievements for Heatmap
  const { data: employees } = await supabase
    .from('users')
    .select('id, name, goals(achievements(quarter, progress_status))')
    .eq('role', 'employee')

  // 4. Managers data for Effectiveness
  const { data: managers } = await supabase
    .from('users')
    .select(`
      id, 
      name, 
      managed_reports:users!manager_id(id),
      checkin_comments(id)
    `)
    .eq('role', 'manager')

  // 5. Audit logs for Approved vs Returned stats
  const { data: auditLogs } = await supabase
    .from('audit_log')
    .select('action, changed_by')
    .in('action', ['goal_approved', 'goal_returned'])

  // --- Data Processing (Server Side) ---

  // Section 1: QoQ Trends
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
  const qoqData = quarters.map(q => {
    const qAchievements = achievements?.filter(a => a.quarter === q) || []
    const avgScore = qAchievements.length > 0 
      ? qAchievements.reduce((sum, a) => sum + Number(a.computed_score), 0) / qAchievements.length 
      : 0
    return { name: q, score: Math.round(avgScore) }
  })

  // Section 2: Thrust Area Distribution
  const thrustAreaMap: Record<string, number> = {}
  goals?.forEach(g => {
    thrustAreaMap[g.thrust_area] = (thrustAreaMap[g.thrust_area] || 0) + 1
  })
  const pieData = Object.entries(thrustAreaMap).map(([name, value]) => ({ name, value }))

  // Section 4: Manager Effectiveness
  const managerData = managers?.map(m => {
    const approved = auditLogs?.filter(l => l.changed_by === m.id && l.action === 'goal_approved').length || 0
    const returned = auditLogs?.filter(l => l.changed_by === m.id && l.action === 'goal_returned').length || 0
    return {
      name: m.name.split(' ')[0],
      reports: (m as any).managed_reports?.length || 0,
      approved,
      returned,
      comments: (m as any).checkin_comments?.length || 0
    }
  }) || []

  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Organizational Analytics</h1>
        <p className="text-muted-foreground mt-1">Real-time performance metrics and trends.</p>
      </div>

      <AnalyticsPageCharts 
        qoqData={qoqData}
        pieData={pieData}
        employees={employees || []}
        managerData={managerData}
        quarters={quarters}
      />
    </div>
  )
}
