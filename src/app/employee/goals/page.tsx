import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge'
import { PlusCircle } from 'lucide-react'
import { WeightageBar } from '@/components/goals/WeightageBar'
import { GoalSubmitAction } from '@/components/goals/GoalSubmitAction'
import { DeleteGoalButton } from '@/components/goals/DeleteGoalButton'

export default async function EmployeeGoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('employee_id', user?.id)
    .order('created_at', { ascending: false })

  const totalWeightage = goals?.reduce((sum, g) => sum + Number(g.weightage), 0) || 0

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Goals</h1>
          <p className="text-muted-foreground mt-1">Manage and track your performance goals.</p>
        </div>
        <Link href="/employee/goals/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </Link>
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
                  No goals found. Create your first goal to get started.
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
                  <TableCell className="text-right space-x-2">
                    {goal.status === 'draft' && <DeleteGoalButton goalId={goal.id} />}
                    <GoalSubmitAction goalId={goal.id} status={goal.status} />
                    {['draft', 'returned'].includes(goal.status) && (
                      <Link href={`/employee/goals/${goal.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                    )}
                    <Link href={`/employee/goals/${goal.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
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
