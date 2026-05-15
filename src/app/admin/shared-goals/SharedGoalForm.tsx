'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { pushSharedGoal } from '@/app/actions/shared-goals'
import { toast } from 'sonner'

const sharedGoalSchema = z.object({
  thrust_area: z.string().min(1, 'Thrust area is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  uom_type: z.enum(['min', 'max', 'timeline', 'zero']),
  target: z.string().optional(),
  target_date: z.string().optional(),
  employeeIds: z.array(z.string()).min(1, 'Select at least one employee'),
})

type SharedGoalValues = z.infer<typeof sharedGoalSchema>

interface SharedGoalFormProps {
  employees: { id: string, name: string, department: string }[]
}

export function SharedGoalForm({ employees }: SharedGoalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<SharedGoalValues>({
    resolver: zodResolver(sharedGoalSchema),
    defaultValues: {
      uom_type: 'min',
      employeeIds: [],
    }
  })

  async function onSubmit(data: SharedGoalValues) {
    setIsLoading(true)
    const result = await pushSharedGoal(data as any)
    if (result?.success) {
      toast.success('Shared goals pushed successfully')
      form.reset()
    } else {
      toast.error(result?.error || 'Failed to push goals')
    }
    setIsLoading(false)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Define Organization-wide Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thrust Area</Label>
              <Input {...form.register('thrust_area')} />
            </div>
            <div className="space-y-2">
              <Label>Goal Title</Label>
              <Input {...form.register('title')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>UoM Type</Label>
              <Controller
                control={form.control}
                name="uom_type"
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || 'min'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="min">Min</SelectItem>
                      <SelectItem value="max">Max</SelectItem>
                      <SelectItem value="timeline">Timeline</SelectItem>
                      <SelectItem value="zero">Zero</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Value / Date</Label>
              <Input {...form.register('target')} />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base">Target Employees</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto border p-4 rounded-md">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={emp.id}
                    checked={form.watch('employeeIds').includes(emp.id)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('employeeIds')
                      if (checked) {
                        form.setValue('employeeIds', [...current, emp.id])
                      } else {
                        form.setValue('employeeIds', current.filter(id => id !== emp.id))
                      }
                    }}
                  />
                  <label htmlFor={emp.id} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {emp.name} ({emp.department})
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            Push Goal to Selected Employees
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
