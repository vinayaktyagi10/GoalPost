import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ManagerCheckinComment } from '@/components/goals/ManagerCheckinComment'

export default async function ManagerCheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get direct reports and their approved/locked goals, achievements, and comments
  const { data: reports } = await supabase
    .from('users')
    .select(`
      id, 
      name, 
      goals (
        id, 
        title, 
        target, 
        uom_type, 
        status,
        achievements (quarter, actual_value, computed_score),
        checkin_comments (id, quarter, comment)
      )
    `)
    .eq('manager_id', user?.id)

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team Check-ins</h1>
        <p className="text-muted-foreground mt-1">Review your team's quarterly progress and provide feedback.</p>
      </div>

      <div className="space-y-12">
        {reports?.length === 0 ? (
          <p className="text-muted-foreground">No direct reports found.</p>
        ) : (
          reports?.map((report) => (
            <div key={report.id} className="space-y-6">
              <h2 className="text-2xl font-bold border-b pb-2">{report.name}</h2>
              
              {report.goals?.filter(g => g.status === 'approved' || g.status === 'locked').length === 0 ? (
                <p className="text-muted-foreground">No approved goals to check in on.</p>
              ) : (
                report.goals
                  ?.filter((g: any) => g.status === 'approved' || g.status === 'locked')
                  .map((goal: any) => (
                    <Card key={goal.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Target: {goal.target || 'N/A'} ({goal.uom_type})
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {quarters.map(quarter => {
                            const achievement = goal.achievements?.find((a: any) => a.quarter === quarter)
                            return (
                              <div key={quarter} className="border p-4 rounded-md bg-muted/20">
                                <h4 className="font-semibold mb-2">{quarter}</h4>
                                <div className="space-y-1 mb-4 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Actual:</span>
                                    <span className="font-medium">{achievement?.actual_value ?? '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Score:</span>
                                    <span className="font-medium">
                                      {achievement?.computed_score !== undefined 
                                        ? `${achievement.computed_score.toFixed(1)}%` 
                                        : '-'}
                                    </span>
                                  </div>
                                </div>
                                <ManagerCheckinComment 
                                  goalId={goal.id} 
                                  quarter={quarter}
                                  existingComments={goal.checkin_comments || []}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
