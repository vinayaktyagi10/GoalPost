'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { submitGoal } from '@/app/actions/employee'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

interface GoalSubmitActionProps {
  goalId: string
  status: string
}

export function GoalSubmitAction({ goalId, status }: GoalSubmitActionProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (status !== 'draft' && status !== 'returned') return null

  async function handleSubmit() {
    setIsLoading(true)
    const result = await submitGoal(goalId)
    if (result.success) {
      toast.success('Goal submitted for approval')
    } else {
      toast.error(result.error || 'Failed to submit goal')
    }
    setIsLoading(false)
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSubmit}
      disabled={isLoading}
    >
      <Send className="mr-2 h-4 w-4" />
      {status === 'returned' ? 'Resubmit' : 'Submit'}
    </Button>
  )
}
