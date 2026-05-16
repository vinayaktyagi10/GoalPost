'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createEscalationRule, toggleEscalationRule, deleteEscalationRule } from '@/app/actions/escalations'
import { toast } from 'sonner'
import { AlertCircle, Plus, Play, Trash2, Send } from 'lucide-react'

export default function EscalationsPage() {
  const [rules, setRules] = useState<any[]>([])
  const [violations, setViolations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const fetchRules = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('escalation_rules').select('*').order('created_at', { ascending: false })
    setRules(data || [])
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleCreateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createEscalationRule({
      rule_name: formData.get('rule_name') as string,
      trigger_event: formData.get('trigger_event') as any,
      days_threshold: Number(formData.get('days_threshold')),
      is_active: true
    })

    if (result.success) {
      toast.success('Escalation rule created')
      fetchRules()
      ;(e.target as HTMLFormElement).reset()
    } else {
      toast.error(result.error || 'Failed to create rule')
    }
    setIsLoading(false)
  }

  const handleToggle = async (id: string, current: boolean) => {
    const result = await toggleEscalationRule(id, !current)
    if (result.success) {
      toast.success('Rule status updated')
      fetchRules()
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteEscalationRule(id)
    if (result.success) {
      toast.success('Rule deleted')
      fetchRules()
    }
  }

  const runCheck = async () => {
    setIsChecking(true)
    try {
      const res = await fetch('/api/escalations/check')
      const data = await res.json()
      setViolations(data.violations || [])
      toast.success(`Check complete: ${data.violations?.length || 0} violations found`)
    } catch (error) {
      toast.error('Failed to run escalation check')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escalation Management</h1>
          <p className="text-muted-foreground mt-1">Configure automated rules to monitor compliance.</p>
        </div>
        <Button onClick={runCheck} disabled={isChecking}>
          {isChecking ? 'Running...' : 'Run Escalation Check'}
          <Play className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create New Rule</CardTitle>
            <CardDescription>Define a compliance trigger</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rule_name">Rule Name</Label>
                <Input id="rule_name" name="rule_name" placeholder="e.g. Early Draft Reminder" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger_event">Trigger Event</Label>
                <Select name="trigger_event" defaultValue="goal_not_submitted">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goal_not_submitted">Goal Not Submitted</SelectItem>
                    <SelectItem value="goal_not_approved">Goal Not Approved</SelectItem>
                    <SelectItem value="checkin_not_completed">Check-in Not Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="days_threshold">Days Threshold</Label>
                <Input id="days_threshold" name="days_threshold" type="number" defaultValue={7} required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Existing Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No rules configured.</TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.rule_name}</TableCell>
                      <TableCell className="text-xs uppercase font-semibold text-muted-foreground">{rule.trigger_event.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{rule.days_threshold} days</TableCell>
                      <TableCell>
                        <Switch 
                          checked={rule.is_active} 
                          onCheckedChange={() => handleToggle(rule.id, rule.is_active)} 
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {violations.length > 0 && (
        <Card className="border-red-200 bg-red-50/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-red-700 text-xl">
                <AlertCircle className="mr-2 h-5 w-5" />
                Active Violations Detected
              </CardTitle>
              <CardDescription className="text-red-600/80">Employees or managers missing deadlines based on active rules.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-red-900">Employee</TableHead>
                  <TableHead className="text-red-900">Goal / Context</TableHead>
                  <TableHead className="text-red-900">Rule Triggered</TableHead>
                  <TableHead className="text-red-900">Overdue By</TableHead>
                  <TableHead className="text-right text-red-900">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.map((v, i) => (
                  <TableRow key={i} className="hover:bg-red-100/20 border-red-100">
                    <TableCell className="font-semibold">{v.employee}</TableCell>
                    <TableCell>{v.goal}</TableCell>
                    <TableCell className="text-xs font-bold uppercase">{v.rule}</TableCell>
                    <TableCell>{v.daysOverdue} days</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-200 text-red-700 hover:bg-red-100"
                        onClick={() => toast.success(`Notification sent to ${v.employee}`)}
                      >
                        <Send className="mr-2 h-3 w-3" />
                        Notify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
