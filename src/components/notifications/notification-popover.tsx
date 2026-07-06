import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { Bell } from 'lucide-react'

import type { Announcement } from '@/types/announcement'
import { getUnreadCount, mockAnnouncements } from '@/data/mock-announcements'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

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

interface NotificationItemProps {
  announcement: Announcement
  onSelect: () => void
}

function NotificationItem({ announcement, onSelect }: NotificationItemProps) {
  return (
    <Link
      to="/announcements/$id"
      params={{ id: announcement.id }}
      onClick={onSelect}
      className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      {!announcement.isRead && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-crimson-9" />
      )}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1',
          announcement.isRead && 'pl-5',
        )}
      >
        <h4
          className={cn(
            'truncate text-sm text-foreground',
            !announcement.isRead ? 'font-semibold' : 'font-medium',
          )}
        >
          {announcement.title}
        </h4>
        <p className="truncate text-xs text-muted-foreground">
          {announcement.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTimestamp(announcement.createdAt)}
        </p>
      </div>
    </Link>
  )
}

export function NotificationPopover() {
  const [open, setOpen] = React.useState(false)
  const unreadCount = getUnreadCount()

  // Sort announcements: unread first, then by date
  const sortedAnnouncements = React.useMemo(() => {
    return [...mockAnnouncements]
      .sort((a, b) => {
        if (a.isRead !== b.isRead) {
          return a.isRead ? 1 : -1
        }
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
      .slice(0, 10)
  }, [])

  const handleSelect = () => {
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Notifications"
            className="relative"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-twblue-9 ring-2 ring-background" />
        )}
      </PopoverTrigger>

      <PopoverContent className="w-96 gap-0 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="divide-y">
            {sortedAnnouncements.map((announcement) => (
              <NotificationItem
                key={announcement.id}
                announcement={announcement}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
