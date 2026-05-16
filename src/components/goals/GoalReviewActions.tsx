'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { approveGoal, returnGoal } from '@/app/actions/manager'
import { toast } from 'sonner'
import { CheckCircle, RotateCcw } from 'lucide-react'

interface GoalReviewActionsProps {
  goalId: string
  status: string
}

export function GoalReviewActions({ goalId, status }: GoalReviewActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (status !== 'submitted') return null

  async function handleApprove() {
    setIsLoading(true)
    const result = await approveGoal(goalId)
    if (result.success) {
      toast.success('Goal approved & locked')
    } else {
      toast.error(result.error || 'Failed to approve goal')
    }
    setIsLoading(false)
  }

  async function handleReturn() {
    setIsLoading(true)
    const result = await returnGoal(goalId, 'Returned for revision')
    if (result.success) {
      toast.success('Goal returned to employee')
    } else {
      toast.error(result.error || 'Failed to return goal')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleReturn}
        disabled={isLoading}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Return
      </Button>
      <Button 
        size="sm" 
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={handleApprove}
        disabled={isLoading}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Approve & Lock
      </Button>
    </div>
  )
}
