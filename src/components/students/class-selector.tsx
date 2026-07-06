import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { groupedClassOptions } from '@/data/mock-students'

interface ClassItem {
  value: string
  label: string
}

interface ClassSelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

function classLabel(level: string, classValue: string): string {
  // Primary values are already descriptive (P1-A); secondary values embed the
  // level digit (3A) — strip it so "Secondary 3" + "3A" reads "Secondary 3A".
  if (classValue.startsWith('P')) return `${level} · ${classValue}`
  return `${level}${classValue.replace(/^\d+/, '')}`
}

// One flat, searchable list: "All classes", then each level and its classes.
// Search finds anything across levels, so no Primary/Secondary toggle is needed.
const CLASS_ITEMS: Array<ClassItem> = [
  { value: 'all', label: 'All classes' },
  ...groupedClassOptions.flatMap((group) => [
    { value: group.level, label: group.level },
    ...group.classes.map((c) => ({
      value: c.value,
      label: classLabel(group.level, c.value),
    })),
  ]),
]

export function ClassSelector({
  value,
  onValueChange,
  className,
}: ClassSelectorProps) {
  const selected = useMemo(
    () => CLASS_ITEMS.find((i) => i.value === value) ?? CLASS_ITEMS[0],
    [value],
  )

  return (
    <Combobox
      items={CLASS_ITEMS}
      value={selected}
      onValueChange={(item) => onValueChange(item?.value ?? 'all')}
      itemToStringLabel={(item) => item.label}
      isItemEqualToValue={(a, b) =>
        (a as ClassItem | null)?.value === (b as ClassItem | null)?.value
      }
    >
      <ComboboxInput
        placeholder="Search classes"
        aria-label="Select class"
        className={cn('w-56', className)}
      />
      <ComboboxContent>
        <ComboboxEmpty>No classes found.</ComboboxEmpty>
        <ComboboxList>
          {(item: ClassItem) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
