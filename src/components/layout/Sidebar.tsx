// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/login/actions'  // ADD THIS

interface NavItem {
  title: string
  href: string
}

interface SidebarProps {
  items: NavItem[]
  title: string
}

export function Sidebar({ items, title }: SidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/40 h-[calc(100vh)] sticky top-0 flex flex-col p-4">
      <div className="mb-6 px-2">
        <h2 className="text-xl font-bold tracking-tight">⚽ GoalPost</h2>
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
      </div>
      <nav className="space-y-2 flex-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" className="w-full justify-start">
              {item.title}
            </Button>
          </Link>
        ))}
      </nav>
      <form action={logout}>
        <Button
          type="submit"
          variant="outline"
          className="w-full justify-start text-destructive"
        >
          Logout
        </Button>
      </form>
    </div>
  )
}
