'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/login/actions'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
}

interface SidebarProps {
  items: NavItem[]
  title: string
  user?: {
    name: string
    role: string
    email: string
  }
}

export function Sidebar({ items, title, user }: SidebarProps) {
  const pathname = usePathname()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const roleColors: Record<string, string> = {
    employee: 'bg-blue-500',
    manager: 'bg-purple-500',
    admin: 'bg-orange-500',
  }

  return (
    <div className="w-64 border-r bg-muted/40 h-[calc(100vh)] sticky top-0 flex flex-col p-4">
      <div className="mb-4 px-2">
        <h2 className="text-xl font-bold tracking-tight">⚽ GoalPost</h2>
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
      </div>

      {user && (
        <>
          <div className="px-2 py-4 border-y my-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm",
                roleColors[user.role] || 'bg-gray-500'
              )}>
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate leading-none">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-1">{user.email}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0 h-5">
              {user.role}
            </Badge>
          </div>
        </>
      )}

      <nav className="space-y-1 flex-1 mt-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button 
                variant={isActive ? "secondary" : "ghost"} 
                className="w-full justify-start font-medium h-9"
              >
                {item.title}
              </Button>
            </Link>
          )
        })}
      </nav>
      
      <div className="pt-4 border-t">
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            className="w-full justify-start text-destructive h-9"
          >
            Logout
          </Button>
        </form>
      </div>
    </div>
  )
}
