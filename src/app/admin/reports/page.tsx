import { createClient } from '@/lib/supabase/server'
import { ExportButton } from '@/components/admin/ExportButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ReportsPage() {
  const supabase = await createClient()

  // Fetch all achievements with goal and user info
  const { data: reportData } = await supabase
    .from('achievements')
    .select(`
      quarter,
      actual_value,
      computed_score,
      goals (
        title,
        thrust_area,
        target,
        weightage,
        users (
          name,
          email,
          department
        )
      )
    `)

  const formattedData = (reportData || []).map((row: any) => ({
    Employee: row.goals?.users?.name,
    Email: row.goals?.users?.email,
    Department: row.goals?.users?.department,
    Goal: row.goals?.title,
    ThrustArea: row.goals?.thrust_area,
    Weightage: row.goals?.weightage,
    Quarter: row.quarter,
    Target: row.goals?.target ?? 
      (row.goals?.uom_type === 'timeline' ? row.goals?.target_date : 'N/A'),
    Actual: row.actual_value ?? 
      (row.actual_date || 'Not logged'),
    Score: row.computed_score,
    Status: row.progress_status
  }))

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Reports</h1>
        <p className="text-muted-foreground mt-1">Generate and download performance data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Achievement Report</CardTitle>
            <CardDescription>
              A comprehensive list of all employee achievements and computed scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton 
              data={formattedData} 
              filename={`Achievement_Report_${new Date().toISOString().split('T')[0]}.csv`} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
