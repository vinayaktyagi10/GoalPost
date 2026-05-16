import { Sidebar } from '@/components/layout/Sidebar'

const navItems = [
  { title: 'My Goals', href: '/employee/goals' },
  { title: 'Check-in', href: '/employee/checkin' },
]

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} title="Employee Portal" />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
