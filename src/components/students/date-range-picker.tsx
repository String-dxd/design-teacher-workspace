import { useState } from 'react'

import type { ReactElement } from 'react'
import { LATEST_LABEL, LATEST_PERIOD, periodYears } from '@/data/filter-config'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DateRangePickerProps {
  /** Currently selected period values, e.g. ['latest'] or ['2025-T1', ...] */
  value: Array<string>
  onChange: (value: Array<string>) => void
  /**
   * The element used as the popover trigger. Rendered via Base UI's `render`
   * prop, so its own children (label, chevron, etc.) are preserved.
   */
  trigger: ReactElement
  align?: 'start' | 'center' | 'end'
}

/**
 * Hierarchical year/term date-range picker shared by the main filter popover
 * and the quick "Date" selector. "Latest available (Recommended)" is mutually
 * exclusive with specific terms; selecting a year toggles all of its terms.
 */
export function DateRangePicker({
  value: selected,
  onChange,
  trigger,
  align = 'start',
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const isLatest = selected.includes(LATEST_PERIOD)

  // Selecting "Latest available" clears any pinned terms
  const selectLatest = () => onChange([LATEST_PERIOD])
  // Toggling a term drops "Latest"; an empty selection becomes "Select option"
  const toggleTerm = (v: string) => {
    const base = selected.filter((s) => s !== LATEST_PERIOD)
    const next = base.includes(v) ? base.filter((s) => s !== v) : [...base, v]
    onChange(next)
  }
  // Toggling a year selects/clears all of its terms
  const toggleYear = (termVals: Array<string>) => {
    const base = selected.filter((s) => s !== LATEST_PERIOD)
    const allOn = termVals.every((v) => base.includes(v))
    const next = allOn
      ? base.filter((v) => !termVals.includes(v))
      : [...new Set([...base, ...termVals])]
    onChange(next)
  }

  const renderCheck = (
    key: string,
    label: string,
    checked: boolean,
    onClick: () => void,
    indented: boolean,
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 py-2 text-left text-sm hover:bg-accent',
        indented ? 'pl-9 pr-3' : 'px-3',
      )}
    >
      <Checkbox checked={checked} className="pointer-events-none" />
      {label}
    </button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent className="w-[260px] gap-0 p-3" align={align}>
        <div className="px-3 pb-1 pt-1 text-sm font-medium">Date range</div>
        <ScrollArea className="max-h-[260px]">
          <div className="py-1">
            {renderCheck('latest', LATEST_LABEL, isLatest, selectLatest, false)}
            {periodYears.map((year) => {
              const termVals = year.terms.map((t) => t.value)
              const yearChecked = termVals.every((v) => selected.includes(v))
              return (
                <div key={year.year}>
                  {renderCheck(
                    `year-${year.year}`,
                    String(year.year),
                    yearChecked,
                    () => toggleYear(termVals),
                    false,
                  )}
                  {year.terms.map((t) =>
                    renderCheck(
                      t.value,
                      t.label,
                      selected.includes(t.value),
                      () => toggleTerm(t.value),
                      true,
                    ),
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
