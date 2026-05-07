import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'

import type {
  FilterCriterion,
  FilterField,
  FilterOperator,
} from '@/types/student'
import {
  filterFieldConfigs,
  groupLabels,
  groupOrder,
} from '@/data/filter-config'
import { useFeatureFlags } from '@/lib/feature-flags'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const numericOperators: Array<{ value: FilterOperator; label: string }> = [
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater than or equal to' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less than or equal to' },
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equal to' },
]

const equalityOperators: Array<{ value: FilterOperator; label: string }> = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
]

const textOperators: Array<{ value: FilterOperator; label: string }> = [
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]

function getOperatorsForField(field: string) {
  const config = filterFieldConfigs.find((c) => c.field === field)
  if (!config) return textOperators
  if (config.type === 'numeric') return numericOperators
  if (config.type === 'multiselect' || config.type === 'enum')
    return equalityOperators
  return textOperators
}

interface ProfileGroupCriteriaRowProps {
  index: number
  criterion: FilterCriterion
  /** Other rows' field ids — used to grey-out already-selected fields */
  takenFields: Array<string>
  onChange: (next: FilterCriterion) => void
  onRemove: () => void
}

export function ProfileGroupCriteriaRow({
  index,
  criterion,
  takenFields,
  onChange,
  onRemove,
}: ProfileGroupCriteriaRowProps) {
  const { isEnabled } = useFeatureFlags()
  const isStudentInsightsView =
    !isEnabled('student-analytics') && !isEnabled('student-analytics-basic')
  const msfUpliftEnabled = isEnabled('msf-uplift-data')

  const visibleFields = filterFieldConfigs.filter((f) => {
    if (
      isStudentInsightsView &&
      (f.field === 'approvedMtl' ||
        f.field === 'postSecEligibility' ||
        f.field === 'commuterStatus' ||
        f.field === 'afterSchoolArrangement')
    )
      return false
    if (
      !msfUpliftEnabled &&
      (f.field === 'supportedByComLink' ||
        f.field === 'supportedByFsc' ||
        f.field === 'nonIntactFamily')
    )
      return false
    return true
  })

  const fieldConfig = filterFieldConfigs.find(
    (c) => c.field === criterion.field,
  )
  const operators = getOperatorsForField(criterion.field)
  const hasField = !!criterion.field

  const [fieldOpen, setFieldOpen] = useState(false)
  const [fieldQuery, setFieldQuery] = useState('')
  const fieldSearchRef = useRef<HTMLInputElement>(null)

  const [multiOpen, setMultiOpen] = useState(false)
  const [multiQuery, setMultiQuery] = useState('')
  const multiSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (fieldOpen) {
      const t = setTimeout(() => fieldSearchRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    setFieldQuery('')
  }, [fieldOpen])

  useEffect(() => {
    if (multiOpen) {
      const t = setTimeout(() => multiSearchRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    setMultiQuery('')
  }, [multiOpen])

  const handleFieldChange = (field: string) => {
    const newConfig = filterFieldConfigs.find((c) => c.field === field)
    if (!newConfig) return
    const value = newConfig.type === 'numeric' ? '' : newConfig.defaultValue
    onChange({
      ...criterion,
      field,
      operator: newConfig.defaultOperator,
      value,
    })
    setFieldOpen(false)
  }

  const handleOperatorChange = (operator: FilterOperator) => {
    onChange({ ...criterion, operator })
  }

  const handleValueChange = (value: string | number | Array<string>) => {
    onChange({ ...criterion, value })
  }

  const needsValueInput =
    criterion.operator !== 'is_empty' && criterion.operator !== 'is_not_empty'

  const q = fieldQuery.trim().toLowerCase()
  const groupedFields = groupOrder
    .map((g) => ({
      group: g,
      label: groupLabels[g],
      fields: visibleFields.filter(
        (f) =>
          f.group === g && (q ? f.label.toLowerCase().includes(q) : true),
      ),
    }))
    .filter((g) => g.fields.length > 0)

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-sm text-muted-foreground">
        {index === 0 ? 'Where' : 'or'}
      </span>

      {/* Field selector */}
      <Popover open={fieldOpen} onOpenChange={setFieldOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                'border-input flex h-9 w-[180px] shrink-0 items-center justify-between gap-1.5 rounded-[14px] border bg-white px-3 text-sm outline-none',
                !hasField && 'text-muted-foreground',
              )}
              aria-expanded={fieldOpen}
            />
          }
        >
          <span className="flex-1 truncate text-left">
            {fieldConfig?.label ?? 'Select field'}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-[420px] gap-0 p-3" align="start">
          <div className="mb-1 flex items-center gap-2 rounded-lg border border-blue-400 px-3 py-2 focus-within:border-blue-500">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={fieldSearchRef}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search..."
              value={fieldQuery}
              onChange={(e) => setFieldQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[260px]">
            <div className="py-1">
              {groupedFields.map(({ group, label, fields }, gi) => (
                <div key={group}>
                  {gi > 0 && (
                    <div className="my-1 border-t border-[var(--slate-6)]" />
                  )}
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </div>
                  {fields.map((opt) => {
                    const isCurrent = opt.field === criterion.field
                    const isTaken =
                      !isCurrent && takenFields.includes(opt.field)
                    return (
                      <button
                        key={opt.field}
                        type="button"
                        disabled={isTaken}
                        onClick={() =>
                          handleFieldChange(opt.field as FilterField)
                        }
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                          isCurrent && 'font-medium',
                          isTaken &&
                            'cursor-not-allowed text-muted-foreground hover:bg-transparent',
                        )}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              ))}
              {groupedFields.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No options found
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Operator */}
      <Select
        value={hasField ? criterion.operator : undefined}
        onValueChange={(v) => handleOperatorChange(v as FilterOperator)}
        disabled={!hasField}
      >
        <SelectTrigger
          className={cn(
            'h-9 w-[160px] shrink-0 rounded-[14px] bg-white',
            !hasField && 'text-muted-foreground',
          )}
        >
          <SelectValue placeholder="Operator">
            {hasField
              ? (operators.find((o) => o.value === criterion.operator)?.label ??
                criterion.operator)
              : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value */}
      <div className="w-[200px] shrink-0">
        {!hasField ? (
          <Input
            disabled
            placeholder="Enter value"
            className="h-9 rounded-[14px] bg-white"
          />
        ) : (
          needsValueInput &&
          (fieldConfig?.type === 'multiselect' ? (
            <MultiselectValue
              fieldLabel={fieldConfig.label}
              options={fieldConfig.enumValues ?? []}
              selected={
                Array.isArray(criterion.value)
                  ? criterion.value
                  : typeof criterion.value === 'string' && criterion.value
                    ? [criterion.value]
                    : []
              }
              onChange={(next) => handleValueChange(next)}
              open={multiOpen}
              onOpenChange={setMultiOpen}
              query={multiQuery}
              onQueryChange={setMultiQuery}
              searchRef={multiSearchRef}
            />
          ) : fieldConfig?.type === 'enum' ? (
            <Select
              value={typeof criterion.value === 'string' ? criterion.value : ''}
              onValueChange={(v) => handleValueChange(v ?? '')}
            >
              <SelectTrigger
                className={cn(
                  'h-9 w-full rounded-[14px] bg-white',
                  !criterion.value && 'text-muted-foreground',
                )}
              >
                <SelectValue placeholder="Select option">
                  {typeof criterion.value === 'string' && criterion.value
                    ? criterion.value
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.enumValues?.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : fieldConfig?.type === 'numeric' ? (
            <Input
              type="number"
              value={
                typeof criterion.value === 'number' ||
                typeof criterion.value === 'string'
                  ? criterion.value
                  : ''
              }
              onChange={(e) =>
                handleValueChange(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              placeholder="Enter number"
              className="h-9 rounded-[14px] bg-white"
            />
          ) : (
            <Input
              type="text"
              value={
                typeof criterion.value === 'string' ||
                typeof criterion.value === 'number'
                  ? String(criterion.value)
                  : ''
              }
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Enter value"
              className="h-9 rounded-[14px] bg-white"
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="ml-auto shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
        aria-label="Remove criterion"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface MultiselectValueProps {
  fieldLabel: string
  options: Array<string>
  selected: Array<string>
  onChange: (next: Array<string>) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  onQueryChange: (q: string) => void
  searchRef: React.RefObject<HTMLInputElement | null>
}

function MultiselectValue({
  fieldLabel,
  options,
  selected,
  onChange,
  open,
  onOpenChange,
  query,
  onQueryChange,
  searchRef,
}: MultiselectValueProps) {
  const sortedOptions = [
    ...(options.includes('-') ? ['-'] : []),
    ...options.filter((v) => v !== '-'),
  ]
  const q = query.trim().toLowerCase()
  const visible = q
    ? sortedOptions.filter((v) => v.toLowerCase().includes(q))
    : sortedOptions
  const allSelected =
    visible.length > 0 && visible.every((v) => selected.includes(v))

  const toggle = (v: string) => {
    onChange(
      selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v],
    )
  }
  const toggleAll = () => {
    if (allSelected) {
      onChange(selected.filter((v) => !visible.includes(v)))
    } else {
      onChange([...new Set([...selected, ...visible])])
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              'border-input flex h-9 w-full items-center justify-between gap-1.5 rounded-[14px] border bg-white px-3 text-sm outline-none',
              selected.length === 0 && 'text-muted-foreground',
            )}
          />
        }
      >
        <span className="flex-1 truncate text-left">
          {selected.length === 0
            ? 'Select option'
            : selected.length === 1
              ? selected[0]
              : `${selected.length} selected`}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-[260px] gap-0 p-3" align="start">
        <div className="mb-1 flex items-center gap-2 rounded-lg border border-blue-400 px-3 py-2 focus-within:border-blue-500">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={searchRef}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search filters"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        <div className="px-3 pt-2 pb-1 text-sm font-medium">{fieldLabel}</div>
        <ScrollArea className="max-h-[220px]">
          <div className="py-1">
            {visible.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <div
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    allSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input',
                  )}
                >
                  {allSelected && <Check className="h-3 w-3" />}
                </div>
                Select all
              </button>
            )}
            {visible.map((v) => {
              const checked = selected.includes(v)
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggle(v)}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent',
                    checked && 'bg-accent/50',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input',
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </div>
                  {v}
                </button>
              )
            })}
            {visible.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No options found
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
