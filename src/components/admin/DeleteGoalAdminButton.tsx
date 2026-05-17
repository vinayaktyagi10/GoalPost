'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteGoal } from '@/app/actions/admin'
import { toast } from 'sonner'

interface DeleteGoalAdminButtonProps {
  goalId: string
  goalTitle: string
}

export function DeleteGoalAdminButton({ goalId, goalTitle }: DeleteGoalAdminButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the goal "${goalTitle}"? This will also remove all achievements and comments associated with it.`)) {
      return
    }

    setIsDeleting(true)
    const result = await deleteGoal(goalId)
    
    if (result.success) {
      toast.success('Goal and all related data deleted')
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
      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
      title="Delete Goal"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
