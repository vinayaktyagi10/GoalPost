import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      </div>
      <nav className="space-y-2 flex-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" className="w-full justify-start text-left">
              {item.title}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <form action="/login" method="POST">
          {/* Will need a proper logout action, assuming /login/actions.ts logout exists. For now, simple redirect or form */}
          <Link href="/login">
            <Button variant="outline" className="w-full justify-start text-left text-destructive">
              Logout
            </Button>
          </Link>
        </form>
      </div>
    </div>
  )
}
