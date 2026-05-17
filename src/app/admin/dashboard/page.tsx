import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CompletionChart } from '@/components/admin/AnalyticsCharts'
import { AdminGoalManagement } from '@/components/admin/AdminGoalManagement'
import { Users, Target, Clock, CheckCircle2 } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 1. Get Org Stats
  const { data: allGoalsData } = await supabase
    .from('goals')
    .select('*, users!employee_id(name, email, department)')
    .order('created_at', { ascending: false })

  const { data: allUsers } = await supabase.from('users').select('id')
  
  const totalGoals = allGoalsData?.length || 0
  const pendingApprovals = allGoalsData?.filter(g => g.status === 'submitted').length || 0
  const approvedGoals = allGoalsData?.filter(g => g.status === 'approved' || g.status === 'locked').length || 0
  const completionRate = totalGoals > 0 ? (approvedGoals / totalGoals) * 100 : 0

  // 2. Get Employee Completion Status for Chart
  const { data: employees } = await supabase
    .from('users')
    .select('id, name, email, department, goals(status)')
    .eq('role', 'employee')

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Organization Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Central hub for goal monitoring and compliance.</p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allUsers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalGoals}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingApprovals}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Team Completion Rates (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <CompletionChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Goal Management</h2>
          <Badge variant="outline" className="text-xs font-mono">{totalGoals} Total Records</Badge>
        </div>
        
        <AdminGoalManagement initialGoals={allGoalsData as any || []} />
      </section>
    </div>
  )
}
