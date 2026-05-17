'use client'

import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GoalStatusBadge } from '@/components/goals/GoalStatusBadge'
import { Button } from '@/components/ui/button'
import { Trash2, LockOpen, Search, Filter } from 'lucide-react'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { deleteGoal, unlockGoal } from '@/app/actions/admin'
import { toast } from 'sonner'

interface Goal {
  id: string
  title: string
  status: string
  weightage: number
  employee_id: string
  users: {
    name: string
    email: string
    department: string | null
  }
}

interface AdminGoalManagementProps {
  initialGoals: Goal[]
}

export function AdminGoalManagement({ initialGoals }: AdminGoalManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isProcessing, setIsChecking] = useState<string | null>(null)

  const filteredGoals = useMemo(() => {
    return initialGoals.filter(goal => {
      const matchesSearch = goal.users.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           goal.users.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || goal.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [initialGoals, searchTerm, statusFilter])

  const groupedByEmployee = useMemo(() => {
    const groups: Record<string, { employee: any, goals: Goal[], totalWeightage: number }> = {}
    
    filteredGoals.forEach(goal => {
      if (!groups[goal.employee_id]) {
        groups[goal.employee_id] = {
          employee: goal.users,
          goals: [],
          totalWeightage: 0
        }
      }
      groups[goal.employee_id].goals.push(goal)
      groups[goal.employee_id].totalWeightage += Number(goal.weightage)
    })
    
    return Object.entries(groups)
  }, [filteredGoals])

  const handleDelete = async (goalId: string) => {
    setIsChecking(goalId)
    const result = await deleteGoal(goalId)
    if (result.success) {
      toast.success('Goal deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete goal')
    }
    setIsChecking(null)
  }

  const handleUnlock = async (goalId: string) => {
    setIsChecking(goalId)
    const result = await unlockGoal(goalId)
    if (result.success) {
      toast.success('Goal unlocked and reset to draft')
    } else {
      toast.error(result.error || 'Failed to unlock goal')
    }
    setIsChecking(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-sm font-medium">Search Employee</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2 w-full md:w-[200px]">
          <label className="text-sm font-medium">Filter Status</label>
          <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-8">
        {groupedByEmployee.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">
            No goals matching your filters.
          </div>
        ) : (
          groupedByEmployee.map(([empId, data]) => (
            <div key={empId} className="border rounded-xl bg-card shadow-sm overflow-hidden">
              <div className="bg-muted/50 p-4 border-b flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-lg">{data.employee.name}</h3>
                  <p className="text-sm text-muted-foreground">{data.employee.email} • {data.employee.department || 'No Department'}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
                  <div className="flex justify-between text-xs font-semibold w-full md:w-48">
                    <span>Total Weightage</span>
                    <span className={data.totalWeightage === 100 ? "text-green-600" : "text-amber-600"}>
                      {data.totalWeightage}%
                    </span>
                  </div>
                  <div className="h-2 w-full md:w-48 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${data.totalWeightage === 100 ? "bg-green-500" : "bg-amber-500"}`}
                      style={{ width: `${Math.min(data.totalWeightage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Goal Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Weightage</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.goals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell className="pl-4 font-medium max-w-[300px] truncate" title={goal.title}>
                        {goal.title}
                      </TableCell>
                      <TableCell>
                        <GoalStatusBadge status={goal.status as any} />
                      </TableCell>
                      <TableCell>{goal.weightage}%</TableCell>
                      <TableCell className="text-right pr-4 space-x-1">
                        {goal.status === 'locked' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleUnlock(goal.id)}
                            disabled={!!isProcessing}
                            title="Unlock Goal"
                          >
                            <LockOpen className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={!!isProcessing}
                                title="Delete Goal"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the goal <strong>"{goal.title}"</strong> and remove all associated quarterly achievements and comments. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(goal.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Goal
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
