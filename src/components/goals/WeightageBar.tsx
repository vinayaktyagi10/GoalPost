'use client'

import { cn } from "@/lib/utils"

interface WeightageBarProps {
  currentTotal: number
  className?: string
}

export function WeightageBar({ currentTotal, className }: WeightageBarProps) {
  const isError = currentTotal > 100
  const isComplete = currentTotal === 100

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between text-sm font-medium">
        <span>Total Weightage</span>
        <span className={cn(
          isError ? "text-destructive" : isComplete ? "text-green-600" : "text-muted-foreground"
        )}>
          {currentTotal}% / 100%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isError ? "bg-destructive" : isComplete ? "bg-green-600" : "bg-primary"
          )}
          style={{ width: `${Math.min(currentTotal, 100)}%` }}
        />
      </div>
      {isError && (
        <p className="text-xs text-destructive font-medium">
          Total weightage cannot exceed 100%
        </p>
      )}
    </div>
  )
}
