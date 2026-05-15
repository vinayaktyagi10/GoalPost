import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  locked: { label: "Locked", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  returned: { label: "Returned", color: "bg-red-500/10 text-red-500 border-red-500/20" },
}

interface GoalStatusBadgeProps {
  status: keyof typeof statusConfig
}

export function GoalStatusBadge({ status }: GoalStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft
  
  return (
    <Badge variant="outline" className={cn("font-medium", config.color)}>
      {config.label}
    </Badge>
  )
}
