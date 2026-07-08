import { useState } from 'react'
import { CalendarIcon, Filter, RotateCcw } from 'lucide-react'
import { format, parse } from 'date-fns'
import type { PGOwnership, PGStatus } from '@/types/pg-announcement'
import type { ResponseType } from '@/types/form'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface AnnouncementFilters {
  statuses: Array<PGStatus>
  ownerships: Array<PGOwnership>
  responseTypes: Array<ResponseType>
  dateFrom: string
  dateTo: string
}

export const EMPTY_ANNOUNCEMENT_FILTERS: AnnouncementFilters = {
  statuses: [],
  ownerships: [],
  responseTypes: [],
  dateFrom: '',
  dateTo: '',
}

function countActiveFilters(filters: AnnouncementFilters): number {
  return (
    filters.statuses.length +
    filters.ownerships.length +
    filters.responseTypes.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0)
  )
}

const RESPONSE_TYPE_OPTIONS: Array<{ value: ResponseType; label: string }> = [
  { value: 'view-only', label: 'Read-only' },
  { value: 'acknowledge', label: 'Acknowledge' },
  { value: 'yes-no', label: 'Yes / no' },
]

interface AnnouncementFilterBarProps {
  filters: AnnouncementFilters
  onChange: (filters: AnnouncementFilters) => void
}

const STATUS_OPTIONS: Array<{ value: PGStatus; label: string }> = [
  { value: 'posted', label: 'Posted' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
]

const OWNERSHIP_OPTIONS: Array<{ value: PGOwnership; label: string }> = [
  { value: 'mine', label: 'Created by me' },
  { value: 'shared', label: 'Shared with me' },
]

export function AnnouncementFilterBar({
  filters,
  onChange,
}: AnnouncementFilterBarProps) {
  const [open, setOpen] = useState(false)
  const activeCount = countActiveFilters(filters)

  function toggleStatus(status: PGStatus) {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status]
    onChange({ ...filters, statuses: next })
  }

  function toggleOwnership(ownership: PGOwnership) {
    const next = filters.ownerships.includes(ownership)
      ? filters.ownerships.filter((o) => o !== ownership)
      : [...filters.ownerships, ownership]
    onChange({ ...filters, ownerships: next })
  }

  function toggleResponseType(rt: ResponseType) {
    const next = filters.responseTypes.includes(rt)
      ? filters.responseTypes.filter((r) => r !== rt)
      : [...filters.responseTypes, rt]
    onChange({ ...filters, responseTypes: next })
  }

  function handleReset() {
    onChange(EMPTY_ANNOUNCEMENT_FILTERS)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="h-9 gap-2 aria-expanded:bg-card"
          />
        }
      >
        <Filter className="h-4 w-4" />
        Filter
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {activeCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-[460px] gap-0 p-0" align="start">
        {/* Header */}
        <div className="px-5 pb-3 pt-4">
          <h3 className="text-sm font-semibold">Show posts</h3>
        </div>

        {/* Filter rows */}
        <div className="space-y-3 px-5 pb-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-medium">Status</span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <Toggle
                  key={opt.value}
                  variant="outline"
                  size="sm"
                  pressed={filters.statuses.includes(opt.value)}
                  onPressedChange={() => toggleStatus(opt.value)}
                  className="aria-pressed:border-primary aria-pressed:bg-twblue-2 aria-pressed:text-twblue-9"
                >
                  {opt.label}
                </Toggle>
              ))}
            </div>
          </div>

          {/* Ownership */}
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-medium">Ownership</span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {OWNERSHIP_OPTIONS.map((opt) => (
                <Toggle
                  key={opt.value}
                  variant="outline"
                  size="sm"
                  pressed={filters.ownerships.includes(opt.value)}
                  onPressedChange={() => toggleOwnership(opt.value)}
                  className="aria-pressed:border-primary aria-pressed:bg-twblue-2 aria-pressed:text-twblue-9"
                >
                  {opt.label}
                </Toggle>
              ))}
            </div>
          </div>

          {/* Response Type */}
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-medium">Response</span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {RESPONSE_TYPE_OPTIONS.map((opt) => (
                <Toggle
                  key={opt.value}
                  variant="outline"
                  size="sm"
                  pressed={filters.responseTypes.includes(opt.value)}
                  onPressedChange={() => toggleResponseType(opt.value)}
                  className="aria-pressed:border-primary aria-pressed:bg-twblue-2 aria-pressed:text-twblue-9"
                >
                  {opt.label}
                </Toggle>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-medium">Date</span>
            <div className="flex flex-1 items-center gap-1.5">
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        'h-9 flex-1 justify-start gap-2 text-sm font-normal',
                        !filters.dateFrom && 'text-muted-foreground',
                      )}
                    />
                  }
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {filters.dateFrom
                    ? format(
                        parse(filters.dateFrom, 'yyyy-MM-dd', new Date()),
                        'dd MMM yyyy',
                      )
                    : 'From'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      filters.dateFrom
                        ? parse(filters.dateFrom, 'yyyy-MM-dd', new Date())
                        : undefined
                    }
                    onSelect={(date) =>
                      onChange({
                        ...filters,
                        dateFrom: date ? format(date, 'yyyy-MM-dd') : '',
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
              <span className="shrink-0 text-sm text-muted-foreground">–</span>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        'h-9 flex-1 justify-start gap-2 text-sm font-normal',
                        !filters.dateTo && 'text-muted-foreground',
                      )}
                    />
                  }
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {filters.dateTo
                    ? format(
                        parse(filters.dateTo, 'yyyy-MM-dd', new Date()),
                        'dd MMM yyyy',
                      )
                    : 'To'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      filters.dateTo
                        ? parse(filters.dateTo, 'yyyy-MM-dd', new Date())
                        : undefined
                    }
                    onSelect={(date) =>
                      onChange({
                        ...filters,
                        dateTo: date ? format(date, 'yyyy-MM-dd') : '',
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={activeCount === 0}
            className="gap-2 text-sm font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
