'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateUserRole } from '@/app/actions/admin'
import { toast } from 'sonner'

interface UserRoleSelectorProps {
  userId: string
  currentRole: string
}

export function UserRoleSelector({ userId, currentRole }: UserRoleSelectorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState(currentRole)

  const handleRoleChange = async (newRole: string | null) => {
    if (!newRole) return
    setIsLoading(true)
    const result = await updateUserRole(userId, newRole)
    
    if (result.success) {
      setRole(newRole)
      toast.success('User role updated')
    } else {
      toast.error(result.error || 'Failed to update role')
    }
    setIsLoading(false)
  }

  return (
    <Select value={role} onValueChange={handleRoleChange} disabled={isLoading}>
      <SelectTrigger className="w-[130px] h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="employee">Employee</SelectItem>
        <SelectItem value="manager">Manager</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  )
}
