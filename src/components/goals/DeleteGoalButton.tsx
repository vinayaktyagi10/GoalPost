'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteGoal } from '@/app/actions/goals'
import { toast } from 'sonner'

interface DeleteGoalButtonProps {
  goalId: string
}

export function DeleteGoalButton({ goalId }: DeleteGoalButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft goal?')) return

    setIsDeleting(true)
    const result = await deleteGoal(goalId)
    
    if (result.success) {
      toast.success('Goal deleted')
    } else {
      toast.error(result.error || 'Failed to delete goal')
      setIsDeleting(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
