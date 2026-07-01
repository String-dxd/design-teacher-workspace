import { Link } from '@tanstack/react-router'

import type { Announcement } from '@/types/announcement'
import { cn } from '@/lib/utils'

interface AnnouncementCardProps {
  announcement: Announcement
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`
  }

  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  }

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  }

  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  }

  return date.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <Link
      to="/announcements/$id"
      params={{ id: announcement.id }}
      className="flex gap-4 rounded-3xl border bg-background p-4 transition-colors hover:bg-muted/50"
    >
      {!announcement.isRead && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-crimson-9" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3
          className={cn(
            'line-clamp-2 text-foreground',
            !announcement.isRead ? 'font-semibold' : 'font-medium',
          )}
        >
          {announcement.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {announcement.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTimestamp(announcement.createdAt)}
        </p>
      </div>
    </Link>
  )
}
