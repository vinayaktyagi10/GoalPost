import { createClient } from '@/lib/supabase/server'
import { getWeightageSum } from '@/app/actions/goals'
import { GoalForm } from '@/components/goals/GoalForm'

export default async function NewGoalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const currentWeightageTotal = user ? await getWeightageSum(user.id) : 0

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Goal Setting</h1>
        <p className="text-muted-foreground mt-1">Define your KPIs for the current cycle.</p>
      </div>
      
      <GoalForm currentWeightageTotal={currentWeightageTotal} />
    </div>
  )
}
