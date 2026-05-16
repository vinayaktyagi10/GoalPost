import { Sidebar } from '@/components/layout/Sidebar'

const navItems = [
  { title: 'Team Overview', href: '/manager/team' },
  { title: 'Check-in', href: '/manager/checkin' },
]

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} title="Manager Portal" />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
