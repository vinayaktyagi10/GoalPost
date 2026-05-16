import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default async function GoalDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: goal } = await supabase
    .from('goals')
    .select('*, achievements(*)')
    .eq('id', id)
    .single()

  if (!goal) return <div className="p-10">Goal not found.</div>

  const { data: comments } = await supabase
    .from('checkin_comments')
    .select('*, users(name)')
    .eq('goal_id', id)
    .order('created_at', { ascending: false })

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">{goal.title}</h1>
          <GoalStatusBadge status={goal.status} />
        </div>
        <p className="text-muted-foreground">{goal.thrust_area}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Goal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-semibold">Description:</span>
              <p className="text-muted-foreground mt-1">{goal.description || 'No description provided.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">UoM Type:</span>
                <p className="text-muted-foreground">{goal.uom_type}</p>
              </div>
              <div>
                <span className="font-semibold">Target:</span>
                <p className="text-muted-foreground">{goal.target || 'N/A'}</p>
              </div>
              <div>
                <span className="font-semibold">Weightage:</span>
                <p className="text-muted-foreground">{goal.weightage}%</p>
              </div>
              <div>
                <span className="font-semibold">Target Date:</span>
                <p className="text-muted-foreground">{goal.target_date ? format(new Date(goal.target_date), 'PP') : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Achievement History</h2>
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actual Value</TableHead>
                  <TableHead>Computed Score</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quarters.map((q) => {
                  const achievement = goal.achievements?.find((a: any) => a.quarter === q)
                  return (
                    <TableRow key={q}>
                      <TableCell className="font-medium">{q}</TableCell>
                      <TableCell>{achievement?.progress_status || 'Not Started'}</TableCell>
                      <TableCell>{achievement?.actual_value || achievement?.actual_date || '-'}</TableCell>
                      <TableCell>
                        {achievement?.computed_score !== undefined 
                          ? `${achievement.computed_score.toFixed(1)}%` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {achievement?.updated_at 
                          ? format(new Date(achievement.updated_at), 'MMM d, yyyy') 
                          : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Manager Feedback</h2>
          <div className="space-y-4">
            {!comments || comments.length === 0 ? (
              <p className="text-muted-foreground">No manager feedback yet.</p>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-semibold">{comment.users?.name}</CardTitle>
                        <CardDescription>{format(new Date(comment.created_at), 'PPp')}</CardDescription>
                      </div>
                      <Badge variant="secondary">{comment.quarter}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
