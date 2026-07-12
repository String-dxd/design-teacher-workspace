import { format, parse } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import type { Matcher } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TIME_SLOTS } from '@/lib/time-slots'
import { cn } from '@/lib/utils'

// The design system's date/time inputs: a Calendar popover and a time-slot
// Select, replacing native <input type="date|time"> (which render
// differently per browser and can't be themed). Values stay plain strings —
// 'yyyy-MM-dd' and 'HH:mm' — so callers keep their existing state shape.

interface DateFieldProps {
  value: string // 'yyyy-MM-dd' or ''
  onChange: (value: string) => void
  /** Block days before today (deadlines, schedules). */
  disablePast?: boolean
  /** Latest selectable day (e.g. a 21-day scheduling window). */
  maxDate?: Date
  placeholder?: string
  id?: string
  className?: string
}

export function DateField({
  value,
  onChange,
  disablePast = false,
  maxDate,
  placeholder = 'Pick a date',
  id,
  className,
}: DateFieldProps) {
  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Separate matchers, not one object — `{ before, after }` together means
  // a date *interval* to react-day-picker, which is the opposite intent.
  const disabledMatchers: Array<Matcher> = []
  if (disablePast) disabledMatchers.push({ before: today })
  if (maxDate) disabledMatchers.push({ after: maxDate })
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'bg-background justify-start font-normal',
              !value && 'text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {selected ? format(selected, 'dd MMM yyyy') : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
        />
      </PopoverContent>
    </Popover>
  )
}

interface TimeFieldProps {
  value: string // 'HH:mm' or ''
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TimeField({
  value,
  onChange,
  placeholder = 'Time',
  className,
}: TimeFieldProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
      <SelectTrigger size="sm" className={cn('bg-background', className)}>
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {TIME_SLOTS.map((slot) => (
          <SelectItem key={slot.value} value={slot.value}>
            {slot.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
