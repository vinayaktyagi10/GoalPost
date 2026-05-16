'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

export function AuditLogFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams(searchParams)
    
    const search = formData.get('search') as string
    const from = formData.get('from') as string
    const to = formData.get('to') as string

    if (search) params.set('search', search)
    else params.delete('search')

    if (from) params.set('from', from)
    else params.delete('from')

    if (to) params.set('to', to)
    else params.delete('to')

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
      <div className="space-y-2">
        <Label htmlFor="search">Search Action / User</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            id="search" 
            name="search" 
            placeholder="e.g. manager_edit" 
            className="pl-9 w-[250px]"
            defaultValue={searchParams.get('search') || ''}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="from">From Date</Label>
        <Input 
          id="from" 
          name="from" 
          type="date" 
          className="w-[180px]"
          defaultValue={searchParams.get('from') || ''}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="to">To Date</Label>
        <Input 
          id="to" 
          name="to" 
          type="date" 
          className="w-[180px]"
          defaultValue={searchParams.get('to') || ''}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Filter</Button>
        <Button type="button" variant="outline" size="icon" onClick={clearFilters} title="Clear Filters">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
