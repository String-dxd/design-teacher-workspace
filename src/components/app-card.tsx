import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

import type { AppColor } from '@/data/apps'
import { cn } from '@/lib/utils'

const iconHoverColorVariants: Record<AppColor, string> = {
  pink: 'group-hover:text-pink-500',
  blue: 'group-hover:text-twblue-9',
  orange: 'group-hover:text-orange-500',
  green: 'group-hover:text-green-500',
  purple: 'group-hover:text-purple-500',
}

function AppBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-twblue-3 px-2 py-0.5 text-xs font-medium text-twblue-9">
      {label}
    </span>
  )
}

interface AppIconProps {
  icon: LucideIcon | string
  color: AppColor
  className?: string
}

export function AppIcon({ icon, color, className }: AppIconProps) {
  if (typeof icon === 'string') {
    return (
      <div
        className={cn(
          'relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border bg-white p-2',
          className,
        )}
      >
        <img src={icon} alt="" className="h-full w-full object-contain" />
        <div className="pointer-events-none absolute inset-0 bg-[#0064ff] mix-blend-color transition-opacity duration-200 will-change-[opacity] group-hover:opacity-0" />
      </div>
    )
  }

  const Icon = icon
  return (
    <div
      className={cn(
        'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border bg-white',
        className,
      )}
    >
      <Icon
        className={cn(
          'size-8 text-[#0064ff] transition-colors duration-200',
          iconHoverColorVariants[color],
        )}
      />
    </div>
  )
}

interface AppCardProps {
  name: string
  description: string
  icon: LucideIcon | string
  color: AppColor
  href: string
  badge?: string
  onClick?: () => void
  className?: string
}

export function AppCard({
  name,
  description,
  icon,
  color,
  href,
  badge,
  onClick,
  className,
}: AppCardProps) {
  const cardClassName = cn(
    'group flex min-w-0 flex-col gap-4 rounded-[14px] border bg-background p-4 transition-colors hover:bg-muted/50 text-left',
    className,
  )

  const content = (
    <>
      <AppIcon icon={icon} color={color} />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{name}</h3>
          {badge && <AppBadge label={badge} />}
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        {content}
      </button>
    )
  }

  if (href.startsWith('http')) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClassName}
      >
        {content}
      </a>
    )
  }

  return (
    <Link to={href} className={cardClassName}>
      {content}
    </Link>
  )
}

interface FeaturedAppCardProps {
  name: string
  description: string
  icon: LucideIcon | string
  color: AppColor
  href: string
  badge?: string
  className?: string
}

export function FeaturedAppCard({
  name,
  description,
  icon,
  color,
  href,
  badge,
  className,
}: FeaturedAppCardProps) {
  const featuredClassName = cn(
    'group flex h-[132px] items-center gap-4 rounded-[14px] border border-[#C8C8C8] bg-white p-4 transition-colors hover:bg-muted/50',
    className,
  )

  const featuredContent = (
    <>
      <AppIcon icon={icon} color={color} />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{name}</h3>
          {badge && <AppBadge label={badge} />}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </>
  )

  if (href.startsWith('http')) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={featuredClassName}
      >
        {featuredContent}
      </a>
    )
  }

  return (
    <Link to={href} className={featuredClassName}>
      {featuredContent}
    </Link>
  )
}
