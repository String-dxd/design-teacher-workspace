import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  icon: LucideIcon
  name: string
  description: string
  state: string
  href?: string
  locked?: boolean
}

// Locked ≠ dimmed, locked ≠ hidden: locked cards keep full opacity and
// render as a non-interactive div with aria-disabled instead of a Link
// (plan 028 design constraint). Hover is a border-color shift only — no
// scale/shadow bloom.
export function ToolCard({
  icon: Icon,
  name,
  description,
  state,
  href,
  locked,
}: ToolCardProps) {
  const content = (
    <>
      <Icon className="text-muted-foreground size-5 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-muted-foreground text-sm">{description}</span>
        <span className="text-muted-foreground text-xs">{state}</span>
      </div>
    </>
  )

  const className = cn(
    'border-border flex items-start gap-3 rounded-lg border bg-card p-4',
    'motion-safe:transition-colors motion-safe:duration-200',
    locked
      ? 'cursor-default'
      : 'hover:border-primary focus-visible:border-primary focus-visible:outline-none',
  )

  if (locked || !href) {
    return (
      <div role="link" aria-disabled="true" className={className}>
        {content}
      </div>
    )
  }

  return (
    <Link to={href} className={className}>
      {content}
    </Link>
  )
}
