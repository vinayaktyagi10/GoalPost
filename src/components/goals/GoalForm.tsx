'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WeightageBar } from './WeightageBar'
import { createGoal } from '@/app/actions/goals'
import { toast } from 'sonner'

const goalSchema = z.object({
  thrust_area: z.string().min(1, 'Thrust area is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  uom_type: z.enum(['min', 'max', 'timeline', 'zero']),
  target: z.string(),
  target_date: z.string(),
  weightage: z.number().min(10, 'Minimum weightage is 10%').max(100),
})

type GoalFormValues = z.infer<typeof goalSchema>

interface GoalFormProps {
  currentWeightageTotal: number
  initialData?: any
  isShared?: boolean
}

export function GoalForm({ currentWeightageTotal, initialData, isShared }: GoalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      thrust_area: initialData?.thrust_area || '',
      title: initialData?.title || '',
      description: initialData?.description || '',
      uom_type: initialData?.uom_type || 'min',
      target: initialData?.target || '',
      target_date: initialData?.target_date || '',
      weightage: initialData?.weightage || 10,
    }
  })

  const watchedWeightage = form.watch('weightage')
  const totalWeightage = currentWeightageTotal + (Number(watchedWeightage) || 0) - (initialData?.weightage || 0)

  async function onSubmit(data: GoalFormValues) {
    if (totalWeightage > 100) {
      toast.error('Total weightage across all goals cannot exceed 100%')
      return
    }

    setIsLoading(true)
    const result = await createGoal(data)
    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
      return
    }

    router.push('/employee/goals')
    // Note: No setIsLoading(false) here to allow the redirect to take over
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Goal' : 'Create New Goal'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <WeightageBar currentTotal={totalWeightage} className="mb-6" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thrust_area">Thrust Area</Label>
              <Input id="thrust_area" {...form.register('thrust_area')} placeholder="e.g. Sales, Product" disabled={isShared} />
              {form.formState.errors.thrust_area && <p className="text-xs text-destructive">{form.formState.errors.thrust_area.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input id="title" {...form.register('title')} placeholder="e.g. Increase Revenue" disabled={isShared} />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register('description')} placeholder="Detail the goal..." disabled={isShared} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uom_type">UoM Type</Label>
              <Controller
                control={form.control}
                name="uom_type"
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || 'min'}
                    disabled={isShared}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="min">Min (Numeric)</SelectItem>
                      <SelectItem value="max">Max (Numeric)</SelectItem>
                      <SelectItem value="timeline">Timeline (Date)</SelectItem>
                      <SelectItem value="zero">Zero (Target 0)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target Value</Label>
              <Input id="target" {...form.register('target')} placeholder="e.g. 100000" disabled={isShared} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightage">Weightage (%)</Label>
              <Input id="weightage" type="number" {...form.register('weightage', { valueAsNumber: true })} />
              {form.formState.errors.weightage && <p className="text-xs text-destructive">{form.formState.errors.weightage.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date</Label>
            <Input id="target_date" type="date" {...form.register('target_date')} disabled={isShared} />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Goal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
