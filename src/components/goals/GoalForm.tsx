'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
}

export function GoalForm({ currentWeightageTotal }: GoalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      thrust_area: '',
      title: '',
      description: '',
      uom_type: 'min',
      target: '',
      target_date: '',
      weightage: 10,
    }
  })

  const watchedWeightage = form.watch('weightage')
  const totalWeightage = currentWeightageTotal + (Number(watchedWeightage) || 0)

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
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <WeightageBar currentTotal={totalWeightage} className="mb-6" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thrust_area">Thrust Area</Label>
              <Input id="thrust_area" {...form.register('thrust_area')} placeholder="e.g. Sales, Product" />
              {form.formState.errors.thrust_area && <p className="text-xs text-destructive">{form.formState.errors.thrust_area.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input id="title" {...form.register('title')} placeholder="e.g. Increase Revenue" />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register('description')} placeholder="Detail the goal..." />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uom_type">UoM Type</Label>
              <Select onValueChange={(val: any) => form.setValue('uom_type', val)} defaultValue="min">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target Value</Label>
              <Input id="target" {...form.register('target')} placeholder="e.g. 100000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightage">Weightage (%)</Label>
              <Input id="weightage" type="number" {...form.register('weightage', { valueAsNumber: true })} />
              {form.formState.errors.weightage && <p className="text-xs text-destructive">{form.formState.errors.weightage.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date</Label>
            <Input id="target_date" type="date" {...form.register('target_date')} />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Goal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
