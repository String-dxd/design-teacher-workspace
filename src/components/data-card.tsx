import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

type Trend = 'improving' | 'declining' | 'stable'

interface DataCardProps {
  label: string
  value: string | number
  description: string
  trend?: Trend
  className?: string
}

function TrendBadge({ trend }: { trend: Trend }) {
  if (trend === 'declining') {
    return (
      <div className="flex items-center gap-1 text-crimson-11">
        <TrendingDown className="h-3 w-3" />
        <span className="text-xs font-medium">Declining</span>
      </div>
    )
  }
  if (trend === 'improving') {
    return (
      <div className="flex items-center gap-1 text-lime-11">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs font-medium">Improving</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 text-foreground">
      <Minus className="h-3 w-3" />
      <span className="text-xs font-medium">Stable</span>
    </div>
  )
}

export function DataCard({
  label,
  value,
  description,
  trend,
  className,
}: DataCardProps) {
  return (
    <Card size="sm" className={cn('', className)}>
      <CardContent className="space-y-1">
        <div className="flex items-start justify-between">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
          {trend && <TrendBadge trend={trend} />}
        </div>
        <div className="text-3xl font-semibold">{value}</div>
        <span className="text-muted-foreground text-sm">{description}</span>
      </CardContent>
    </Card>
  )
}
