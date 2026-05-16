'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge'
import { GoalReviewActions } from '@/components/goals/GoalReviewActions'
import { WeightageBar } from '@/components/goals/WeightageBar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { editGoalInline } from '@/app/actions/manager'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface Goal {
  id: string
  title: string
  thrust_area: string
  target: number | null
  uom_type: string
  weightage: number
  status: string
}

export default function EmployeeGoalReviewPage({
  employee,
  initialGoals,
}: {
  employee: { name: string; email: string }
  initialGoals: Goal[]
}) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage), 0)

  const handleInputChange = (goalId: string, field: 'target' | 'weightage', value: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return { 
          ...g, 
          [field]: field === 'target' ? (value === '' ? null : Number(value)) : Number(value) 
        }
      }
      return g
    }))
  }

  const handleSave = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    setIsSaving(goalId)
    const result = await editGoalInline({
      goalId,
      newTarget: goal.target,
      newWeightage: goal.weightage
    })

    if (result.success) {
      toast.success('Goal updated successfully')
    } else {
      toast.error(result.error || 'Failed to update goal')
    }
    setIsSaving(null)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{employee.name}'s Goals</h1>
        <p className="text-muted-foreground mt-1">Review, edit, or approve employee goals.</p>
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
            {goals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No goals found for this employee.
                </TableCell>
              </TableRow>
            ) : (
              goals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>
                    <div className="font-medium">{goal.title}</div>
                    <div className="text-xs text-muted-foreground">{goal.uom_type}</div>
                  </TableCell>
                  <TableCell>{goal.thrust_area}</TableCell>
                  <TableCell>
                    {goal.status === 'submitted' ? (
                      <Input
                        type="number"
                        className="w-24 h-8"
                        value={goal.target ?? ''}
                        onChange={(e) => handleInputChange(goal.id, 'target', e.target.value)}
                      />
                    ) : (
                      goal.target || 'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {goal.status === 'submitted' ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="w-20 h-8"
                          value={goal.weightage}
                          onChange={(e) => handleInputChange(goal.id, 'weightage', e.target.value)}
                        />
                        <span className="text-xs">%</span>
                      </div>
                    ) : (
                      `${goal.weightage}%`
                    )}
                  </TableCell>
                  <TableCell>
                    <GoalStatusBadge status={goal.status as any} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-2">
                      {goal.status === 'submitted' && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="h-8"
                          onClick={() => handleSave(goal.id)}
                          disabled={!!isSaving}
                        >
                          <Save className="mr-1 h-3 w-3" />
                          {isSaving === goal.id ? 'Saving...' : 'Save Edits'}
                        </Button>
                      )}
                      <GoalReviewActions goalId={goal.id} status={goal.status} />
                    </div>
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
