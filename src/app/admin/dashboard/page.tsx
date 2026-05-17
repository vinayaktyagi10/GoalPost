import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CompletionChart } from '@/components/admin/AnalyticsCharts'
import { DeleteGoalAdminButton } from '@/components/admin/DeleteGoalAdminButton'
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 1. Get Org Stats
  const { data: allGoalsData } = await supabase
    .from('goals')
    .select('*, users!employee_id(name, email)')
    .order('created_at', { ascending: false })

  const { data: allUsers } = await supabase.from('users').select('id')
  
  const totalGoals = allGoalsData?.length || 0
  const approvedGoals = allGoalsData?.filter(g => g.status === 'approved' || g.status === 'locked').length || 0
  const completionRate = totalGoals > 0 ? (approvedGoals / totalGoals) * 100 : 0

  // 2. Get Employee Completion Status
  const { data: employees } = await supabase
    .from('users')
    .select('id, name, email, department, goals(status)')
    .eq('role', 'employee')

  const employeeStats = (employees || []).map(emp => {
    const goals = emp.goals || []
    const total = goals.length
    const approved = goals.filter((g: any) => g.status === 'approved' || g.status === 'locked').length
    return { ...emp, total, approved }
  })

  const chartData = (employees || []).map(emp => {
    const goals = emp.goals || []
    const total = goals.length
    const approved = goals.filter((g: any) => g.status === 'approved' || g.status === 'locked').length
    return {
      name: emp.name.split(' ')[0],
      rate: total > 0 ? Math.round((approved / total) * 100) : 0
    }
  })

  return (
    <div className="container mx-auto py-10 px-4 space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Organization Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of goal completion across the company.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Team Completion Rates (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <CompletionChart data={chartData} />
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Org Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{completionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{approvedGoals}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Goal Management</h2>
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Goal Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weightage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(allGoalsData || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No goals found.</TableCell>
                </TableRow>
              ) : (
                allGoalsData?.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <div className="font-medium">{(goal.users as any)?.name}</div>
                      <div className="text-xs text-muted-foreground">{(goal.users as any)?.email}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={goal.title}>{goal.title}</TableCell>
                    <TableCell><GoalStatusBadge status={goal.status} /></TableCell>
                    <TableCell>{goal.weightage}%</TableCell>
                    <TableCell className="text-right">
                      <DeleteGoalAdminButton goalId={goal.id} goalTitle={goal.title} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Employee Completion Stats</h2>
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Goal Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeStats.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">{emp.email}</div>
                  </TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>
                    {emp.approved} / {emp.total} Approved
                  </TableCell>
                  <TableCell>
                    {emp.approved === emp.total && emp.total > 0 ? (
                      <Badge className="bg-green-500">100% Complete</Badge>
                    ) : (
                      <Badge variant="outline">In Progress</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
