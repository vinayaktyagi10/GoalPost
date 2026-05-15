import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge'
import { GoalReviewActions } from '@/components/goals/GoalReviewActions'
import { WeightageBar } from '@/components/goals/WeightageBar'

export default async function EmployeeGoalReviewPage({
  params,
}: {
  params: Promise<{ employeeId: string }>
}) {
  const { employeeId } = await params
  const supabase = await createClient()

  // Get employee details
  const { data: employee } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', employeeId)
    .single()

  // Get goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  const totalWeightage = goals?.reduce((sum, g) => sum + Number(g.weightage), 0) || 0

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{employee?.name}'s Goals</h1>
        <p className="text-muted-foreground mt-1">Review, approve, or return goals for revision.</p>
      </div>

      <WeightageBar currentTotal={totalWeightage} className="max-w-md mb-8" />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Thrust Area</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Weightage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goals?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No goals found for this employee.
                </TableCell>
              </TableRow>
            ) : (
              goals?.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell className="font-medium">{goal.title}</TableCell>
                  <TableCell>{goal.thrust_area}</TableCell>
                  <TableCell>{goal.target || 'N/A'} ({goal.uom_type})</TableCell>
                  <TableCell>{goal.weightage}%</TableCell>
                  <TableCell>
                    <GoalStatusBadge status={goal.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <GoalReviewActions goalId={goal.id} status={goal.status} />
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
