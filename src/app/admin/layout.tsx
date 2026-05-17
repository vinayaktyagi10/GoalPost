import { Sidebar } from '@/components/layout/Sidebar'

const navItems = [
  { title: 'Dashboard', href: '/admin/dashboard' },
  { title: 'User Management', href: '/admin/users' },
  { title: 'Analytics', href: '/admin/analytics' },
  { title: 'Reports', href: '/admin/reports' },
  { title: 'Audit Log', href: '/admin/audit-log' },
  { title: 'Shared Goals', href: '/admin/shared-goals' },
  { title: 'Escalations', href: '/admin/escalations' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} title="Admin Portal" />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
