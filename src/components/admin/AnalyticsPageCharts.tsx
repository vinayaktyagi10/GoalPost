'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts'

interface AnalyticsPageChartsProps {
  qoqData: { name: string, score: number }[]
  pieData: { name: string, value: number }[]
  employees: any[]
  managerData: {
    name: string
    reports: number
    approved: number
    returned: number
    comments: number
  }[]
  quarters: string[]
}

export function AnalyticsPageCharts({ 
  qoqData, 
  pieData, 
  employees, 
  managerData, 
  quarters 
}: AnalyticsPageChartsProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: QoQ Trends */}
        <Card>
          <CardHeader>
            <CardTitle>QoQ Achievement Trends (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qoqData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section 2: Goal Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Goals by Thrust Area</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Completion Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 border bg-muted/50 w-48">Employee</th>
                  {quarters.map(q => (
                    <th key={q} className="p-2 border bg-muted/50">{q}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees?.map(emp => {
                  const allAchievements = emp.goals?.flatMap(
                    (g: any) => g.achievements || []
                  ) || []

                  return (
                    <tr key={emp.id}>
                      <td className="p-2 border font-medium text-sm">{emp.name}</td>
                      {quarters.map(q => {
                        const achievement = allAchievements.find(
                          (a: any) => a.quarter === q
                        )
                        const status = achievement?.progress_status
                        
                        let colorClass = "bg-gray-100" // No record
                        if (status === 'completed') colorClass = "bg-green-500"
                        if (status === 'on_track') colorClass = "bg-yellow-400"
                        if (status === 'not_started') colorClass = "bg-red-400"

                        return (
                          <td key={q} className="p-2 border text-center">
                            <div className={`w-6 h-6 rounded-sm mx-auto ${colorClass}`} title={status || 'No data'} />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-sm" /> Completed</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-400 rounded-sm" /> On Track</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-400 rounded-sm" /> Not Started</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-100 rounded-sm" /> No Record</div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Manager Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle>Manager Effectiveness Metrics</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={managerData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="reports" name="Direct Reports" fill="#94a3b8" />
              <Bar dataKey="approved" name="Goals Approved" fill="#22c55e" />
              <Bar dataKey="returned" name="Goals Returned" fill="#ef4444" />
              <Bar dataKey="comments" name="Comments Given" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
