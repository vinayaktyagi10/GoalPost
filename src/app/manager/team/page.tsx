import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ManagerTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get direct reports
  const { data: reports } = await supabase
    .from('users')
    .select('id, name, email, department')
    .eq('manager_id', user?.id)

  // Get goal stats for each report
  const reportsWithStats = await Promise.all((reports || []).map(async (report) => {
    const { data: goals } = await supabase
      .from('goals')
      .select('status')
      .eq('employee_id', report.id)

    const total = goals?.length || 0
    const submitted = goals?.filter(g => g.status === 'submitted').length || 0
    const approved = goals?.filter(g => g.status === 'approved' || g.status === 'locked').length || 0

    return { ...report, total, submitted, approved }
  }))

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team Overview</h1>
        <p className="text-muted-foreground mt-1">Review and manage your direct reports' goals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reportsWithStats.reduce((sum, r) => sum + r.submitted, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Goal Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportsWithStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  No direct reports found.
                </TableCell>
              </TableRow>
            ) : (
              reportsWithStats.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-xs text-muted-foreground">{report.email}</div>
                  </TableCell>
                  <TableCell>{report.department}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline">{report.approved}/{report.total} Approved</Badge>
                      {report.submitted > 0 && (
                        <Badge className="bg-blue-500">{report.submitted} Pending</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/manager/goals/${report.id}`}>
                      <Button variant="outline" size="sm">Review Goals</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
