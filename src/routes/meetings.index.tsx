import { useMemo } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { CalendarDays, Check, Clock, Grid3x3, Plus, Users } from 'lucide-react'

import type { MeetingEvent } from '@/data/mock-meetings'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mockMeetings } from '@/data/mock-meetings'

export const Route = createFileRoute('/meetings/')({
  component: MeetingsPage,
})

const TODAY = new Date().toISOString().slice(0, 10)

function getMeetingStatus(m: MeetingEvent): 'ongoing' | 'upcoming' | 'past' {
  const first = m.meetingDays.at(0)?.date ?? ''
  const last = m.meetingDays.at(-1)?.date ?? ''
  if (last < TODAY) return 'past'
  if (first > TODAY) return 'upcoming'
  return 'ongoing'
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    month: d.toLocaleDateString('en-SG', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
  }
}

function getBookingStatusLabel(m: MeetingEvent): string {
  const now = new Date().toISOString()
  if (now < m.bookingOpens) {
    const d = new Date(m.bookingOpens)
    return `Booking opens ${d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  if (now > m.bookingCloses) return 'Booking period has ended'
  const d = new Date(m.bookingCloses)
  return `Booking closes ${d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

function MeetingCard({
  meeting,
  status,
}: {
  meeting: MeetingEvent
  status: 'ongoing' | 'upcoming' | 'past'
}) {
  const firstDay = meeting.meetingDays.at(0)
  const lastDay = meeting.meetingDays.at(-1)
  const isMultiDay = meeting.meetingDays.length > 1
  const start = firstDay ? formatShortDate(firstDay.date) : null
  const end = lastDay && isMultiDay ? formatShortDate(lastDay.date) : null
  const bookingLabel = getBookingStatusLabel(meeting)

  return (
    <div
      className={cn(
        'flex items-start gap-5 rounded-xl border p-5',
        status === 'ongoing' ? 'border-green-200 bg-green-50' : 'bg-card',
      )}
    >
      {/* Date range */}
      {start && (
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {start.month}
            </p>
            <p className="text-xl font-bold leading-tight">{start.day}</p>
          </div>
          {end && (
            <>
              <span className="text-sm text-muted-foreground">
                {status === 'ongoing' ? '|' : '—'}
              </span>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {end.month}
                </p>
                <p className="text-xl font-bold leading-tight">{end.day}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Details */}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{meeting.title}</p>
        <div className="mt-1.5 space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {meeting.meetingDays.length} meeting day
            {meeting.meetingDays.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {meeting.durationMinutes} min per slot
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Grid3x3 className="h-3.5 w-3.5 shrink-0" />
            {meeting.maxPerSlot} slot{meeting.maxPerSlot !== 1 ? 's' : ''} per
            timing
          </div>
        </div>
        <p className="mt-2 text-xs italic text-muted-foreground">
          {bookingLabel}
        </p>
      </div>

      {/* Stats */}
      <div className="flex shrink-0 items-center text-center">
        <div className="px-4">
          <p className="text-[10px] text-muted-foreground">Available</p>
          <p className="font-semibold">{meeting.available}</p>
        </div>
        <div className="px-4">
          <p className="flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
            <Check className="h-3 w-3" />
            Booked
          </p>
          <p className="font-semibold">{meeting.booked}</p>
        </div>
        <div className="px-4">
          <p className="text-[10px] text-muted-foreground">? Pending</p>
          <p className="font-semibold">{meeting.pending}</p>
        </div>
        <div className="ml-1 border-l pl-4">
          <Users className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="font-semibold">{meeting.invitedCount}</p>
        </div>
      </div>
    </div>
  )
}

function MeetingsPage() {
  useSetBreadcrumbs([{ label: 'Meetings', href: '/meetings' }])

  const { ongoing, upcoming, past } = useMemo(() => {
    const ongoing: Array<MeetingEvent> = []
    const upcoming: Array<MeetingEvent> = []
    const past: Array<MeetingEvent> = []
    for (const m of mockMeetings) {
      const s = getMeetingStatus(m)
      if (s === 'ongoing') ongoing.push(m)
      else if (s === 'upcoming') upcoming.push(m)
      else past.push(m)
    }
    return { ongoing, upcoming, past }
  }, [])

  const hasAny = ongoing.length + upcoming.length + past.length > 0

  return (
    <div className="flex flex-col">
      <div className="shrink-0 space-y-4 pt-6">
        <div className="flex items-start justify-between px-6">
          <div>
            <h1 className="text-2xl font-semibold">Meetings</h1>
            <p className="mt-1 hidden text-sm text-muted-foreground lg:block">
              Invite parents to book a slot for parent-teacher meetings.
            </p>
          </div>
          <Button size="sm" render={<Link to="/meetings/new" />}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Meeting
          </Button>
        </div>
        <div className="border-b" />
      </div>

      <div className="px-6 py-6">
        {!hasAny ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No meeting events yet.</p>
            <Button className="mt-4" render={<Link to="/meetings/new" />}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create your first meeting
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {ongoing.length > 0 && (
              <section>
                <h2 className="mb-3 font-semibold">Ongoing meeting events</h2>
                <div className="space-y-2">
                  {ongoing.map((m) => (
                    <MeetingCard key={m.id} meeting={m} status="ongoing" />
                  ))}
                </div>
              </section>
            )}
            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-3 font-semibold">Upcoming meeting events</h2>
                <div className="space-y-2">
                  {upcoming.map((m) => (
                    <MeetingCard key={m.id} meeting={m} status="upcoming" />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="mb-3 font-semibold">Past meeting events</h2>
                <div className="space-y-2">
                  {past.map((m) => (
                    <MeetingCard key={m.id} meeting={m} status="past" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
