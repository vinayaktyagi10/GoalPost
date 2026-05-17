import { createClient } from '@/lib/supabase/server'
import { getWeightageSum } from '@/app/actions/goals'
import { GoalForm } from '@/components/goals/GoalForm'
import { redirect } from 'next/navigation'

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: goal } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()

  if (!goal) return <div className="p-10 text-center">Goal not found.</div>

  // Access Control: Only draft or returned goals can be edited by the owner
  if (goal.employee_id !== user.id) redirect('/employee/goals')
  if (!['draft', 'returned'].includes(goal.status)) {
    redirect(`/employee/goals/${id}`)
  }

  const currentWeightageTotal = await getWeightageSum(user.id)

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Goal</h1>
        <p className="text-muted-foreground mt-1">
          {goal.is_shared 
            ? 'Adjust your weightage for this shared KPI.' 
            : 'Update your goal details before submission.'}
        </p>
      </div>
      
      <GoalForm 
        currentWeightageTotal={currentWeightageTotal} 
        initialData={goal}
        isShared={goal.is_shared}
      />
    </div>
  )
}
