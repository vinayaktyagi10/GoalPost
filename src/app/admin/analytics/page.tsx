import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts'
import { Badge } from '@/components/ui/badge'

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
    .select('id, name, achievements(quarter, progress_status)')
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

  // --- Data Processing ---

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
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: QoQ Trends */}
        <Card>
          <CardHeader>
            <CardTitle>QoQ Achievement Trends (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qoqData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section 2: Goal Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Goals by Thrust Area</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Completion Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 border bg-muted/50 w-48">Employee</th>
                  {quarters.map(q => (
                    <th key={q} className="p-2 border bg-muted/50">{q}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees?.map(emp => (
                  <tr key={emp.id}>
                    <td className="p-2 border font-medium text-sm">{emp.name}</td>
                    {quarters.map(q => {
                      const achievement = (emp as any).achievements?.find((a: any) => a.quarter === q)
                      const status = achievement?.progress_status
                      
                      let colorClass = "bg-gray-100" // No record
                      if (status === 'completed') colorClass = "bg-green-500"
                      if (status === 'on_track') colorClass = "bg-yellow-400"
                      if (status === 'not_started') colorClass = "bg-red-400"

                      return (
                        <td key={q} className="p-2 border text-center">
                          <div className={`w-6 h-6 rounded-sm mx-auto ${colorClass}`} title={status || 'No data'} />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-sm" /> Completed</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-400 rounded-sm" /> On Track</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-400 rounded-sm" /> Not Started</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-100 rounded-sm" /> No Record</div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Manager Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle>Manager Effectiveness Metrics</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={managerData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="reports" name="Direct Reports" fill="#94a3b8" />
              <Bar dataKey="approved" name="Goals Approved" fill="#22c55e" />
              <Bar dataKey="returned" name="Goals Returned" fill="#ef4444" />
              <Bar dataKey="comments" name="Comments Given" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
