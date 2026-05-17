import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserRoleSelector } from '@/components/admin/UserRoleSelector'

export default async function UserManagementPage() {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Fetch public users
  const { data: publicUsers } = await adminClient
    .from('users')
    .select('*')
    .order('name')

  // 2. Fetch auth users to check SSO status
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers()

  const usersWithSSO = publicUsers?.map(user => {
    const authUser = authUsers.find(au => au.id === user.id)
    const isSSO = authUser?.app_metadata?.provider === 'azure' || 
                 authUser?.identities?.some(id => id.provider === 'azure')
    
    return { ...user, isSSO }
  })

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage user roles and monitor sign-in methods.</p>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Microsoft SSO</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersWithSSO?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.department || '-'}</TableCell>
                <TableCell>
                  {user.isSSO ? (
                    <Badge className="bg-blue-500 hover:bg-blue-600">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <UserRoleSelector userId={user.id} currentRole={user.role} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
