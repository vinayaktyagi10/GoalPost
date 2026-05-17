import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'

const navItems = [
  { title: 'My Goals', href: '/employee/goals' },
  { title: 'Check-in', href: '/employee/checkin' },
]

export default async function EmployeeLayout({
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
        title="Employee Portal" 
        user={userData || undefined}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
