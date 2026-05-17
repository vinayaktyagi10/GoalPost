'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { approveGoal, returnGoal } from '@/app/actions/manager'
import { toast } from 'sonner'
import { CheckCircle, RotateCcw } from 'lucide-react'

interface GoalReviewActionsProps {
  goalId: string
  status: string
}

export function GoalReviewActions({ goalId, status }: GoalReviewActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showReturnInput, setShowReturnInput] = useState(false)
  const [returnComment, setReturnComment] = useState('')
  const router = useRouter()

  if (status !== 'submitted') return null

  async function handleApprove() {
    setIsLoading(true)
    const result = await approveGoal(goalId)
    if (result.success) {
      toast.success('Goal approved & locked')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to approve goal')
    }
    setIsLoading(false)
  }

  async function handleReturn() {
    if (!returnComment.trim()) {
      toast.error('Please provide a reason for returning this goal')
      return
    }
    setIsLoading(true)
    const result = await returnGoal(goalId, returnComment)
    if (result.success) {
      toast.success('Goal returned to employee')
      setShowReturnInput(false)
      setReturnComment('')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to return goal')
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setShowReturnInput(!showReturnInput)}
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
      {showReturnInput && (
        <div className="space-y-2 pt-2">
          <Textarea
            placeholder="Reason for returning..."
            value={returnComment}
            onChange={(e) => setReturnComment(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReturn}
            disabled={isLoading || !returnComment.trim()}
          >
            Confirm Return
          </Button>
        </div>
      )}
    </div>
  )
}
