import { createClient } from '@/lib/supabase/server'
import GoalReviewClient from './GoalReviewClient'

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

  if (!employee) return <div className="p-10 text-center">Employee not found.</div>

  return (
    <GoalReviewClient 
      employee={employee} 
      initialGoals={goals || []} 
    />
  )
}
