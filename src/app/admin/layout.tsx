import { createClient } from '@/lib/supabase/server'
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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  const { data: userData } = await supabase
    .from('users')
    .select('name, role, email')
    .eq('id', authUser?.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        items={navItems} 
        title="Admin Portal" 
        user={userData || undefined}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
