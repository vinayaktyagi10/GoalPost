'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addCheckinComment } from '@/app/actions/manager'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface ManagerCheckinCommentProps {
  goalId: string
  quarter: string
  existingComments?: any[]
}

export function ManagerCheckinComment({ goalId, quarter, existingComments = [] }: ManagerCheckinCommentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [comment, setComment] = useState('')

  const quarterComments = existingComments.filter((c: any) => c.quarter === quarter)

  async function handleSave() {
    if (!comment.trim()) return

    setIsLoading(true)
    const result = await addCheckinComment({ goalId, quarter, comment })
    if (result.success) {
      toast.success('Comment added successfully')
      setComment('')
    } else {
      toast.error(result.error || 'Failed to add comment')
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-3 mt-4 border-t pt-4">
      {quarterComments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Previous Comments:</h4>
          {quarterComments.map((c: any) => (
            <div key={c.id} className="bg-muted p-2 rounded-md text-sm">
              {c.comment}
            </div>
          ))}
        </div>
      )}
      
      <div className="space-y-2">
        <Textarea 
          placeholder={`Add a comment for ${quarter}...`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isLoading}
          className="min-h-[80px]"
        />
        <Button size="sm" onClick={handleSave} disabled={isLoading || !comment.trim()}>
          <Save className="mr-2 h-4 w-4" />
          Add Comment
        </Button>
      </div>
    </div>
  )
}
