import { createClient } from '@/lib/supabase/server'
import { SharedGoalForm } from './SharedGoalForm'

export default async function SharedGoalsPage() {
  const supabase = await createClient()

  const { data: employees } = await supabase
    .from('users')
    .select('id, name, department')
    .eq('role', 'employee')

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Shared KPI Goals</h1>
        <p className="text-muted-foreground mt-1">Push common targets to multiple employees at once.</p>
      </div>

      <SharedGoalForm employees={employees || []} />
    </div>
  )
}
