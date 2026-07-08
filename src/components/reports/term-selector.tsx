import type { Term } from '@/types/report'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { TERMS } from '@/data/mock-reports'

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
  const displayValue = value || 'All terms'

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
        {TERMS.map((term) => (
          <SelectItem key={term} value={term}>
            {term}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
