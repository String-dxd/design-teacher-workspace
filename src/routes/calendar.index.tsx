import { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STORAGE_KEY = 'calendar_gcal_ids'
const TZ = 'Asia%2FSingapore'

type CalendarEntry = { id: string; label: string }

const DEFAULT_CALENDARS: CalendarEntry[] = [
  { id: 'en.singapore#holiday@group.v.calendar.google.com', label: 'Fruits Primary School' },
]

function buildEmbedUrl(entries: CalendarEntry[]) {
  const params = new URLSearchParams({ ctz: decodeURIComponent(TZ), showTitle: '0', showNav: '1', showDate: '1', showPrint: '0', showTabs: '0', showCalendars: '0', showTz: '0' })
  const srcs = entries.map((e) => `src=${encodeURIComponent(e.id)}`).join('&')
  return `https://calendar.google.com/calendar/embed?${srcs}&${params.toString()}`
}

export const Route = createFileRoute('/calendar/')({
  component: CalendarPage,
})

function CalendarPage() {
  useSetBreadcrumbs([{ label: 'Calendar', href: '/calendar' }])

  const [calendars, setCalendars] = useState<CalendarEntry[]>([])
  const [newId, setNewId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCalendars(JSON.parse(saved))
      else persist(DEFAULT_CALENDARS)
    } catch {}
  }, [])

  function persist(next: CalendarEntry[]) {
    setCalendars(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function handleAdd() {
    const id = newId.trim()
    if (!id) return
    if (calendars.some((c) => c.id === id)) {
      toast.error('This calendar ID is already added.')
      return
    }
    persist([{ id, label: id }])
    setNewId('')
    toast.success('Calendar added.')
  }

  function handleRemove(id: string) {
    persist(calendars.filter((c) => c.id !== id))
    toast('Calendar removed.')
  }

  const hasCalendars = calendars.length > 0
  const embedUrl = hasCalendars ? buildEmbedUrl(calendars) : null

  return (
    <div className="flex flex-col">
      <div className="shrink-0 space-y-5 pt-6">

        {/* Title */}
        <div className="border-b px-6 pb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Calendar</h1>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900">
              Concept
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Add Google Calendar IDs to sync events to the Parent Gateway calendar for parents to see.
          </p>
        </div>

        <div className="px-6 pb-8 space-y-4">

          <section className="rounded-xl border bg-white p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Calendar sources
              </p>
            </div>

            {hasCalendars ? (
              /* Connected state */
              <div className="divide-y rounded-lg border">
                {calendars.map((cal) => (
                  <div key={cal.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{cal.label}</p>
                      {cal.label !== cal.id && (
                        <p className="truncate font-mono text-xs text-muted-foreground">{cal.id}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(cal.id)}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state — description + inline form */
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Keep parents updated about school events in the Parents Gateway app. Schools will need to set their Google Calendar to "public" before configuring the calendar ID below.{' '}
                  <a href="#" className="text-primary underline-offset-2 hover:underline">Need help?</a>
                </p>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="e.g. example@gmail.com"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className="font-mono text-xs"
                  />
                  <Button onClick={handleAdd} disabled={!newId.trim()} className="shrink-0">
                    Add calendar
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Embedded Google Calendar */}
          {embedUrl && (
            <section className="rounded-xl border bg-white overflow-hidden">
              <iframe
                src={embedUrl}
                className="w-full"
                style={{ height: 600, border: 0 }}
                title="Google Calendar"
              />
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
