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
  /** Colored icon-wrapper classes (Radix step-3 bg + step-11 text), e.g.
   *  "bg-twblue-3 text-twblue-11". Locked/stub cards keep the default
   *  bg-muted text-muted-foreground wrapper. */
  iconClassName?: string
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
  iconClassName,
}: ToolCardProps) {
  const content = (
    <>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          iconClassName ?? 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold">{name}</span>
        <span className="text-muted-foreground text-sm">{description}</span>
        <span className="text-muted-foreground text-xs">{state}</span>
      </div>
    </>
  )

  const className = cn(
    'border-border flex items-start gap-3 rounded-lg border bg-card p-4',
    'motion-safe:transition-colors motion-safe:duration-200',
    locked
      ? 'cursor-default focus-visible:border-primary focus-visible:outline-none'
      : 'hover:border-primary focus-visible:border-primary focus-visible:outline-none',
  )

  if (locked || !href) {
    // tabIndex=0 keeps it reachable by keyboard — aria-disabled (unlike the
    // native `disabled` attribute) is meant to keep a control discoverable
    // so its state can be announced, not remove it from the tab order.
    return (
      <div role="link" aria-disabled="true" tabIndex={0} className={className}>
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
