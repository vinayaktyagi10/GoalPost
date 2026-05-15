'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertAchievement } from '@/app/actions/achievements'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface QuarterlyInputProps {
  goalId: string
  uomType: string
  quarter: string
  initialValue?: number
  initialDate?: string
  initialScore?: number
}

export function QuarterlyInput({ 
  goalId, 
  uomType, 
  quarter, 
  initialValue, 
  initialDate,
  initialScore
}: QuarterlyInputProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [value, setValue] = useState(initialValue?.toString() || '')
  const [date, setDate] = useState(initialDate || '')
  const [score, setScore] = useState(initialScore || 0)

  async function handleSave() {
    setIsLoading(true)
    const result = await upsertAchievement({
      goalId,
      quarter,
      actualValue: uomType !== 'timeline' ? Number(value) : undefined,
      actualDate: uomType === 'timeline' ? date : undefined,
    })

    if (result.success) {
      toast.success(`Achievement saved for ${quarter}`)
      if (result.score !== undefined) setScore(result.score)
    } else {
      toast.error(result.error || 'Failed to save achievement')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex items-end gap-4 p-4 border rounded-lg bg-card">
      <div className="flex-1 space-y-2">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">
          {quarter} Achievement
        </Label>
        
        {uomType === 'timeline' ? (
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            disabled={isLoading}
          />
        ) : (
          <Input 
            type="number" 
            placeholder="Actual Value" 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
          />
        )}
      </div>

      <div className="text-center px-4 border-l border-r">
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Score</div>
        <div className="text-lg font-bold">{score.toFixed(1)}%</div>
      </div>

      <Button size="sm" onClick={handleSave} disabled={isLoading}>
        <Save className="h-4 w-4 mr-2" />
        Save
      </Button>
    </div>
  )
}
