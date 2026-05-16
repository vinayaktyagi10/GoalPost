import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuarterlyInput } from '@/components/goals/QuarterlyInput'
import { getCurrentQuarter } from '@/lib/utils/calculator'

export default async function EmployeeCheckinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const currentQuarter = getCurrentQuarter()

  // Get only approved/locked goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*, achievements(*)')
    .eq('employee_id', user?.id)
    .in('status', ['approved', 'locked'])

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Quarterly Check-in</h1>
        <p className="text-muted-foreground mt-1">
          Log your achievements for {currentQuarter}.
        </p>
      </div>

      <div className="space-y-8">
        {(goals || []).length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              You don't have any approved goals yet. Only approved goals can be tracked for achievements.
            </CardContent>
          </Card>
        ) : (
          goals?.map((goal) => {
            const achievement = goal.achievements?.find((a: any) => a.quarter === currentQuarter)
            
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{goal.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Target: {goal.target || 'N/A'} {goal.uom_type === 'timeline' ? `by ${goal.target_date}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">Weightage: {goal.weightage}%</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <QuarterlyInput 
                    goalId={goal.id}
                    uomType={goal.uom_type}
                    quarter={currentQuarter}
                    initialValue={achievement?.actual_value}
                    initialDate={achievement?.actual_date}
                    initialScore={achievement?.computed_score}
                    initialStatus={achievement?.progress_status}
                  />
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
