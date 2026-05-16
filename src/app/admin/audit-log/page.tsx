import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { AuditLogFilters } from './AuditLogFilters'

interface AuditLogPageProps {
  searchParams: Promise<{
    search?: string
    from?: string
    to?: string
  }>
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('audit_log')
    .select('*, users(name), goals(title)')
    .order('timestamp', { ascending: false })

  if (params.search) {
    query = query.or(`action.ilike.%${params.search}%,users.name.ilike.%${params.search}%`)
  }

  if (params.from) {
    query = query.gte('timestamp', `${params.from}T00:00:00`)
  }

  if (params.to) {
    query = query.lte('timestamp', `${params.to}T23:59:59`)
  }

  const { data: logs } = await query

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground mt-1">Track all system actions and goal modifications.</p>
      </div>

      <AuditLogFilters />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Old Value</TableHead>
              <TableHead>New Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(logs || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No audit entries found matching the filters.
                </TableCell>
              </TableRow>
            ) : (
              logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell className="font-medium">{log.users?.name || 'System'}</TableCell>
                  <TableCell className="text-sm font-semibold">{log.action}</TableCell>
                  <TableCell>{log.goals?.title || 'N/A'}</TableCell>
                  <TableCell className="text-xs font-mono">{log.field_changed || '-'}</TableCell>
                  <TableCell className="text-xs text-red-600 truncate max-w-[100px]">{log.old_value || '-'}</TableCell>
                  <TableCell className="text-xs text-green-600 truncate max-w-[100px]">{log.new_value || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
