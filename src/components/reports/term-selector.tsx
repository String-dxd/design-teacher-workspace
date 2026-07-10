import type { Term } from '@/types/report'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { CURRENT_TERM, TERMS } from '@/data/mock-reports'

// Latest term first — matches how a teacher thinks about the year (most
// recent/relevant first), and puts the current term at the top of the list.
const TERMS_DESCENDING = [...TERMS].reverse()

interface TermSelectorProps {
  value: Term | ''
  onValueChange: (value: Term | '') => void
  className?: string
}

export function TermSelector({
  value,
  onValueChange,
  className,
}: TermSelectorProps) {
  const displayValue =
    value === CURRENT_TERM
      ? `${value} (Current)`
      : value || 'All terms'

  return (
    <Select
      value={value || 'all'}
      onValueChange={(val) => onValueChange(val === 'all' ? '' : (val as Term))}
    >
      <SelectTrigger className={cn('w-[140px]', className)}>
        {displayValue}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All terms</SelectItem>
        {TERMS_DESCENDING.map((term) => (
          <SelectItem key={term} value={term}>
            {term === CURRENT_TERM ? `${term} (Current)` : term}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
