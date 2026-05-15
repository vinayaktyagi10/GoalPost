import { createClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default async function AuditLogPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_log')
    .select('*, users(name), goals(title)')
    .order('timestamp', { ascending: false })

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground mt-1">Track all system actions and goal modifications.</p>
      </div>

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
                  No audit entries found.
                </TableCell>
              </TableRow>
            ) : (
              logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell className="font-medium">{log.users?.name || 'System'}</TableCell>
                  <TableCell>{log.action}</TableCell>
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
