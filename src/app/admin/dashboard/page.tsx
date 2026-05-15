import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 1. Get Org Stats
  const { data: allGoals } = await supabase.from('goals').select('status')
  const { data: allUsers } = await supabase.from('users').select('id')
  
  const totalGoals = allGoals?.length || 0
  const approvedGoals = allGoals?.filter(g => g.status === 'approved' || g.status === 'locked').length || 0
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

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Organization Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of goal completion across the company.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedGoals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
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
    </div>
  )
}
