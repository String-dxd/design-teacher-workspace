import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'

import { DateRangePicker } from './date-range-picker'
import type {
  FilterCriterion,
  FilterField,
  FilterOperator,
  FilterRangeValue,
} from '@/types/student'
import type { FilterFieldOption } from '@/data/filter-config'
import {
  LATEST_PERIOD,
  filterFieldConfigs,
  formatPeriodValue,
  groupLabels,
  groupOrder,
  isFilterComplete,
} from '@/data/filter-config'
import { useFeatureFlags } from '@/lib/feature-flags'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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

// Plain-text operator labels matching the screenshot
const numericOperatorOptions = [
  { value: 'gt' as FilterOperator, label: 'greater than' },
  { value: 'gte' as FilterOperator, label: 'greater than or equal to' },
  { value: 'lt' as FilterOperator, label: 'less than' },
  { value: 'lte' as FilterOperator, label: 'less than or equal to' },
  { value: 'eq' as FilterOperator, label: 'equals' },
  { value: 'neq' as FilterOperator, label: 'not equal to' },
  { value: 'between' as FilterOperator, label: 'between' },
  { value: 'not_between' as FilterOperator, label: 'not between' },
]

const booleanOperatorOptions = [
  { value: 'is' as FilterOperator, label: 'is' },
  { value: 'is_not' as FilterOperator, label: 'is not' },
]

const multiselectOperatorOptions = [
  { value: 'is' as FilterOperator, label: 'is' },
]

const periodOperatorOptions = [{ value: 'is' as FilterOperator, label: 'is' }]

const textOperatorOptions = [
  { value: 'contains' as FilterOperator, label: 'contains' },
  { value: 'not_contains' as FilterOperator, label: 'does not contain' },
  { value: 'is' as FilterOperator, label: 'is' },
  { value: 'is_not' as FilterOperator, label: 'is not' },
  { value: 'is_empty' as FilterOperator, label: 'is empty' },
  { value: 'is_not_empty' as FilterOperator, label: 'is not empty' },
]

interface FilterFieldOption2 extends Omit<FilterFieldOption, 'operators'> {
  operators: Array<{ value: FilterOperator; label: string }>
}

const filterFieldOptions: Array<FilterFieldOption2> = filterFieldConfigs.map(
  (config) => ({
    ...config,
    operators:
      config.type === 'numeric'
        ? numericOperatorOptions
        : config.type === 'multiselect'
          ? multiselectOperatorOptions
          : config.type === 'period'
            ? periodOperatorOptions
            : config.type === 'boolean' || config.type === 'enum'
              ? booleanOperatorOptions
              : textOperatorOptions,
  }),
)

interface MultiFilterPopoverProps {
  filters: Array<FilterCriterion>
  onFiltersChange: (filters: Array<FilterCriterion>) => void
  importedFields?: Array<{ id: string; label: string }>
  matchedCount?: number
  totalCount?: number
  className?: string
}

let filterIdCounter = 0
const generateId = () => `filter-${++filterIdCounter}`

export function MultiFilterPopover({
  filters,
  onFiltersChange,
  importedFields = [],
  matchedCount,
  totalCount,
  className,
}: MultiFilterPopoverProps) {
  const { isEnabled } = useFeatureFlags()
  const isStudentInsightsView =
    !isEnabled('student-analytics') && !isEnabled('student-analytics-basic')
  const msfUpliftEnabled = isEnabled('msf-uplift-data')
  const dateRangeFilterEnabled = isEnabled('date-range-filter')
  const overallPercentageEnabled = isEnabled('overall-percentage')
  const socialLinksEnabled = isEnabled('social-links')
  const [open, setOpen] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Per-row field selector combobox state
  const [openFieldSelectorIndex, setOpenFieldSelectorIndex] = useState<
    number | null
  >(null)
  const [fieldSelectorQuery, setFieldSelectorQuery] = useState('')
  const fieldSelectorSearchRef = useRef<HTMLInputElement>(null)

  // Per-row multiselect value dropdown state
  const [openMultiselectIndex, setOpenMultiselectIndex] = useState<
    number | null
  >(null)
  const [multiselectQuery, setMultiselectQuery] = useState('')
  const multiselectSearchRef = useRef<HTMLInputElement>(null)

  // Auto-open selector when popover opens (only if no filters yet)
  useEffect(() => {
    if (open) {
      if (filters.length === 0) setSelectorOpen(true)
    } else {
      setSelectorOpen(false)
      setSearchQuery('')
      setOpenFieldSelectorIndex(null)
      setFieldSelectorQuery('')
      setOpenMultiselectIndex(null)
      setMultiselectQuery('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus search when "Select filter" selector opens
  useEffect(() => {
    if (selectorOpen) {
      const t = setTimeout(() => searchRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [selectorOpen])

  // Focus search when per-row field selector opens
  useEffect(() => {
    if (openFieldSelectorIndex !== null) {
      const t = setTimeout(() => fieldSelectorSearchRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [openFieldSelectorIndex])

  // Focus search when multiselect dropdown opens
  useEffect(() => {
    if (openMultiselectIndex !== null) {
      const t = setTimeout(() => multiselectSearchRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [openMultiselectIndex])

  const importedFieldOptions = useMemo(
    () =>
      importedFields.map((f) => ({
        field: f.id as FilterField,
        label: f.label,
        type: 'text' as const,
        group: 'general' as const,
        operators: textOperatorOptions,
        defaultOperator: 'contains' as FilterOperator,
        defaultValue: '',
      })),
    [importedFields],
  )

  const visibleFilterFieldOptions = useMemo(() => {
    let opts = filterFieldOptions
    if (isStudentInsightsView) {
      opts = opts.filter(
        (opt) =>
          opt.field !== 'approvedMtl' &&
          opt.field !== 'postSecEligibility' &&
          opt.field !== 'commuterStatus' &&
          opt.field !== 'afterSchoolArrangement',
      )
    }
    if (!msfUpliftEnabled) {
      opts = opts.filter(
        (opt) =>
          opt.field !== 'supportedByComLink' &&
          opt.field !== 'supportedByFsc' &&
          opt.field !== 'parentsConsideringDivorce' &&
          opt.field !== 'nonIntactFamily',
      )
    }
    if (!dateRangeFilterEnabled) {
      opts = opts.filter((opt) => opt.field !== 'dateRange')
    }
    if (!overallPercentageEnabled) {
      opts = opts.filter((opt) => opt.field !== 'overallPercentage')
    }
    if (!socialLinksEnabled) {
      opts = opts.filter((opt) => opt.field !== 'socialLinks')
    }
    return opts
  }, [
    isStudentInsightsView,
    msfUpliftEnabled,
    dateRangeFilterEnabled,
    overallPercentageEnabled,
    socialLinksEnabled,
  ])

  const allFieldOptions = useMemo(
    () => [...visibleFilterFieldOptions, ...importedFieldOptions],
    [importedFieldOptions, visibleFilterFieldOptions],
  )

  const activeFields = useMemo(
    () => new Set(filters.map((f) => f.field)),
    [filters],
  )
  const availableFields = useMemo(
    () => allFieldOptions.filter((opt) => !activeFields.has(opt.field)),
    [activeFields, allFieldOptions],
  )

  const filteredFields = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return availableFields
    return availableFields.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [availableFields, searchQuery])

  const availableImported = useMemo(
    () => importedFieldOptions.filter((opt) => !activeFields.has(opt.field)),
    [importedFieldOptions, activeFields],
  )
  const filteredImported = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return availableImported
    return availableImported.filter((opt) =>
      opt.label.toLowerCase().includes(q),
    )
  }, [availableImported, searchQuery])

  const groupedFields = useMemo(() => {
    const standardFields = filteredFields.filter(
      (f) => !importedFields.some((i) => i.id === f.field),
    )
    const groups = groupOrder
      .map((group) => ({
        group,
        label: groupLabels[group],
        fields: standardFields.filter((f) => f.group === group),
      }))
      .filter((g) => g.fields.length > 0)
    if (filteredImported.length > 0) {
      groups.push({
        group: 'imported' as never,
        label: 'Imported data',
        fields: filteredImported,
      })
    }
    return groups
  }, [filteredFields, filteredImported, importedFields])

  const handleAddFilter = (field: FilterField | string) => {
    const fieldOption = allFieldOptions.find((opt) => opt.field === field)
    if (!fieldOption) return
    const operator = fieldOption.defaultOperator
    const value =
      fieldOption.type === 'numeric'
        ? ''
        : fieldOption.type === 'multiselect'
          ? []
          : fieldOption.type === 'period'
            ? []
            : fieldOption.defaultValue
    onFiltersChange([
      ...filters,
      {
        id: generateId(),
        field,
        operator,
        value,
      },
    ])
    setSelectorOpen(false)
    setSearchQuery('')
  }

  const handleRemoveFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index))
  }

  const handleFieldChange = (index: number, field: FilterField | string) => {
    const fieldOption = allFieldOptions.find((opt) => opt.field === field)
    if (!fieldOption) return
    const operator = fieldOption.defaultOperator
    const value =
      fieldOption.type === 'numeric'
        ? ''
        : fieldOption.type === 'multiselect'
          ? []
          : fieldOption.type === 'period'
            ? []
            : fieldOption.defaultValue
    const newFilters = [...filters]
    newFilters[index] = {
      ...newFilters[index],
      field,
      operator,
      value,
    }
    onFiltersChange(newFilters)
  }

  const handleOperatorChange = (index: number, operator: FilterOperator) => {
    const newFilters = [...filters]
    const prev = newFilters[index]
    let value = prev.value
    if (operator === 'between' || operator === 'not_between') {
      // switching to range — seed from current single value if possible
      const num = typeof value === 'number' ? value : 0
      value = { min: num, max: num }
    } else if (prev.operator === 'between' || prev.operator === 'not_between') {
      // switching away from range — use min as the single value
      value =
        typeof value === 'object' && !Array.isArray(value) ? value.min : ''
    } else if (operator === 'is_empty' || operator === 'is_not_empty') {
      value = ''
    }
    newFilters[index] = { ...prev, operator, value }
    onFiltersChange(newFilters)
  }

  const handleValueChange = (
    index: number,
    value: string | number | FilterRangeValue | Array<string>,
  ) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], value }
    onFiltersChange(newFilters)
  }

  const handleReset = () => {
    onFiltersChange([])
    setSelectorOpen(true)
    setSearchQuery('')
  }

  const getFieldOption = (field: FilterField | string) =>
    allFieldOptions.find((opt) => opt.field === field)

  const needsValueInput = (operator: FilterOperator) =>
    !['is_empty', 'is_not_empty'].includes(operator)

  const isRangeOperator = (operator: FilterOperator) =>
    operator === 'between' || operator === 'not_between'

  const showCount =
    filters.filter(isFilterComplete).length > 0 &&
    matchedCount !== undefined &&
    totalCount !== undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn('gap-2 aria-expanded:bg-white', className)}
            aria-label="Filter students"
            aria-expanded={open}
          />
        }
      >
        <Filter className="h-4 w-4" />
        Filter
        {filters.filter(isFilterComplete).length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {filters.filter(isFilterComplete).length}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="w-[660px] gap-0 p-0" align="start">
        {/* Header */}
        <div className="px-5 pb-3 pt-4">
          <h3 className="text-sm font-semibold">
            Show records
            {showCount && (
              <span className="ml-1.5 font-normal text-muted-foreground">
                ({matchedCount} of {totalCount} found)
              </span>
            )}
          </h3>
        </div>

        {/* Active filter rows */}
        {filters.length > 0 && (
          <div className="space-y-2 px-5 pb-3">
            {filters.map((filter, index) => {
              const fieldOption = getFieldOption(filter.field)
              return (
                <div key={filter.id} className="flex items-center gap-2">
                  {/* Where / and label */}
                  <span className="w-12 shrink-0 text-sm text-muted-foreground">
                    {index === 0 ? 'Where' : 'and'}
                  </span>

                  {/* Field selector – same combobox as "Select filter" */}
                  {(() => {
                    const isOpen = openFieldSelectorIndex === index
                    const rowFields = allFieldOptions.filter(
                      (opt) =>
                        opt.field === filter.field ||
                        !activeFields.has(opt.field),
                    )
                    const q = fieldSelectorQuery.trim().toLowerCase()
                    const visibleFields = q
                      ? rowFields.filter((opt) =>
                          opt.label.toLowerCase().includes(q),
                        )
                      : rowFields
                    const rowGroupedFields = (() => {
                      const standard = visibleFields.filter(
                        (f) => !importedFields.some((i) => i.id === f.field),
                      )
                      const groups = groupOrder
                        .map((g) => ({
                          group: g,
                          label: groupLabels[g],
                          fields: standard.filter((f) => f.group === g),
                        }))
                        .filter((g) => g.fields.length > 0)
                      const importedVisible = visibleFields.filter((f) =>
                        importedFields.some((i) => i.id === f.field),
                      )
                      if (importedVisible.length > 0) {
                        groups.push({
                          group: 'imported' as never,
                          label: 'Imported data',
                          fields: importedVisible,
                        })
                      }
                      return groups
                    })()
                    return (
                      <Popover
                        open={isOpen}
                        onOpenChange={(v) => {
                          setOpenFieldSelectorIndex(v ? index : null)
                          if (!v) setFieldSelectorQuery('')
                        }}
                      >
                        <PopoverTrigger
                          render={
                            <button
                              type="button"
                              className="border-input flex h-9 w-[152px] shrink-0 items-center justify-between gap-1.5 rounded-[14px] border bg-white px-3 text-sm outline-none"
                            />
                          }
                        >
                          <span className="flex-1 truncate text-left">
                            {fieldOption?.label}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[480px] gap-0 p-3"
                          align="start"
                        >
                          <div className="mb-1 flex items-center gap-2 rounded-lg border border-blue-400 px-3 py-2 focus-within:border-blue-500">
                            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <input
                              ref={fieldSelectorSearchRef}
                              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                              placeholder="Search options"
                              value={fieldSelectorQuery}
                              onChange={(e) =>
                                setFieldSelectorQuery(e.target.value)
                              }
                            />
                          </div>
                          <ScrollArea className="h-[220px]">
                            <div className="py-1">
                              {rowGroupedFields.map(
                                ({ group, label, fields }, gi) => (
                                  <div key={group}>
                                    {gi > 0 && (
                                      <div className="my-1 border-t border-[var(--slate-6)]" />
                                    )}
                                    {label && (
                                      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {label}
                                      </div>
                                    )}
                                    {fields.map((opt) => (
                                      <button
                                        key={opt.field}
                                        type="button"
                                        onClick={() => {
                                          handleFieldChange(index, opt.field)
                                          setOpenFieldSelectorIndex(null)
                                          setFieldSelectorQuery('')
                                        }}
                                        className={cn(
                                          'w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                                          opt.field === filter.field &&
                                            'font-medium',
                                        )}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                ),
                              )}
                              {visibleFields.length === 0 && (
                                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                  No filters found
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    )
                  })()}

                  {/* Operator selector */}
                  <Select
                    value={filter.operator}
                    onValueChange={(value) =>
                      handleOperatorChange(index, value as FilterOperator)
                    }
                  >
                    <SelectTrigger className="w-[104px] shrink-0 rounded-[14px] bg-white">
                      <SelectValue>
                        {
                          fieldOption?.operators.find(
                            (o) => o.value === filter.operator,
                          )?.label
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      className="min-w-max"
                      align="start"
                      alignItemWithTrigger={false}
                    >
                      {fieldOption?.operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value input */}
                  <div className="w-[240px] shrink-0">
                    {needsValueInput(filter.operator) && (
                      <>
                        {fieldOption?.type === 'period' ? (
                          // Date range (period) picker — hierarchical year/term
                          (() => {
                            const selected = Array.isArray(filter.value)
                              ? filter.value
                              : []
                            const triggerLabel = selected.includes(
                              LATEST_PERIOD,
                            )
                              ? formatPeriodValue(LATEST_PERIOD)
                              : selected.length === 0
                                ? 'Select option'
                                : selected.length === 1
                                  ? formatPeriodValue(selected[0])
                                  : `${selected.length} selected`
                            return (
                              <DateRangePicker
                                value={selected}
                                onChange={(v) => handleValueChange(index, v)}
                                trigger={
                                  <button
                                    type="button"
                                    className={cn(
                                      'border-input flex h-9 w-full items-center justify-between gap-1.5 rounded-[14px] border bg-white px-3 text-sm outline-none',
                                      selected.length === 0 &&
                                        'text-muted-foreground',
                                    )}
                                  >
                                    <span className="flex-1 truncate text-left">
                                      {triggerLabel}
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  </button>
                                }
                              />
                            )
                          })()
                        ) : fieldOption?.type === 'multiselect' ? (
                          // Multi-select dropdown
                          (() => {
                            const isOpen = openMultiselectIndex === index
                            const selectedValues = Array.isArray(filter.value)
                              ? filter.value
                              : []
                            const q = multiselectQuery.trim().toLowerCase()
                            const sortedEnumValues = [
                              ...((fieldOption.enumValues ?? []).includes('-')
                                ? ['-']
                                : []),
                              ...(fieldOption.enumValues ?? []).filter(
                                (v) => v !== '-',
                              ),
                            ]
                            const visibleOptions = q
                              ? sortedEnumValues.filter((v) =>
                                  v.toLowerCase().includes(q),
                                )
                              : sortedEnumValues
                            const allSelected =
                              visibleOptions.length > 0 &&
                              visibleOptions.every((v) =>
                                selectedValues.includes(v),
                              )
                            const toggleValue = (v: string) => {
                              const next = selectedValues.includes(v)
                                ? selectedValues.filter((s) => s !== v)
                                : [...selectedValues, v]
                              handleValueChange(index, next)
                            }
                            const toggleAll = () => {
                              if (allSelected) {
                                handleValueChange(
                                  index,
                                  selectedValues.filter(
                                    (v) => !visibleOptions.includes(v),
                                  ),
                                )
                              } else {
                                const next = [
                                  ...new Set([
                                    ...selectedValues,
                                    ...visibleOptions,
                                  ]),
                                ]
                                handleValueChange(index, next)
                              }
                            }
                            return (
                              <Popover
                                open={isOpen}
                                onOpenChange={(v) => {
                                  setOpenMultiselectIndex(v ? index : null)
                                  if (!v) setMultiselectQuery('')
                                }}
                              >
                                <PopoverTrigger
                                  render={
                                    <button
                                      type="button"
                                      className={cn(
                                        'border-input flex h-9 w-full items-center justify-between gap-1.5 rounded-[14px] border bg-white px-3 text-sm outline-none',
                                        selectedValues.length === 0 &&
                                          'text-muted-foreground',
                                      )}
                                    />
                                  }
                                >
                                  <span className="flex-1 truncate text-left">
                                    {selectedValues.length === 0
                                      ? 'Select option'
                                      : selectedValues.length === 1
                                        ? selectedValues[0]
                                        : `${selectedValues.length} selected`}
                                  </span>
                                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[260px] gap-0 p-3"
                                  align="start"
                                >
                                  {/* Search */}
                                  <div className="mb-1 flex items-center gap-2 rounded-lg border border-blue-400 px-3 py-2 focus-within:border-blue-500">
                                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <input
                                      ref={multiselectSearchRef}
                                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                      placeholder="Search filters"
                                      value={multiselectQuery}
                                      onChange={(e) =>
                                        setMultiselectQuery(e.target.value)
                                      }
                                    />
                                  </div>
                                  {/* Field label */}
                                  <div className="px-3 pt-2 pb-1 text-sm font-medium">
                                    {fieldOption.label}
                                  </div>
                                  <ScrollArea className="max-h-[220px]">
                                    <div className="py-1">
                                      {visibleOptions.length > 0 && (
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
                                            {allSelected && (
                                              <Check className="h-3 w-3" />
                                            )}
                                          </div>
                                          Select all
                                        </button>
                                      )}
                                      {visibleOptions.map((v) => {
                                        const checked =
                                          selectedValues.includes(v)
                                        return (
                                          <button
                                            key={v}
                                            type="button"
                                            onClick={() => toggleValue(v)}
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
                                              {checked && (
                                                <Check className="h-3 w-3" />
                                              )}
                                            </div>
                                            {v}
                                          </button>
                                        )
                                      })}
                                      {visibleOptions.length === 0 && (
                                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                          No options found
                                        </div>
                                      )}
                                    </div>
                                  </ScrollArea>
                                </PopoverContent>
                              </Popover>
                            )
                          })()
                        ) : fieldOption?.type === 'numeric' ? (
                          isRangeOperator(filter.operator) ? (
                            // Numerical - range
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                value={
                                  typeof filter.value === 'object' &&
                                  !Array.isArray(filter.value)
                                    ? filter.value.min
                                    : 0
                                }
                                onChange={(e) =>
                                  handleValueChange(index, {
                                    ...(typeof filter.value === 'object' &&
                                    !Array.isArray(filter.value)
                                      ? filter.value
                                      : { min: 0, max: 0 }),
                                    min: Number(e.target.value),
                                  })
                                }
                                placeholder="Enter number"
                                className="w-full rounded-[14px]"
                              />
                              <span className="shrink-0 text-sm text-muted-foreground">
                                –
                              </span>
                              <Input
                                type="number"
                                value={
                                  typeof filter.value === 'object' &&
                                  !Array.isArray(filter.value)
                                    ? filter.value.max
                                    : 0
                                }
                                onChange={(e) =>
                                  handleValueChange(index, {
                                    ...(typeof filter.value === 'object' &&
                                    !Array.isArray(filter.value)
                                      ? filter.value
                                      : { min: 0, max: 0 }),
                                    max: Number(e.target.value),
                                  })
                                }
                                placeholder="Enter number"
                                className="w-full rounded-[14px]"
                              />
                            </div>
                          ) : filter.field === 'riskIndicators' ? (
                            // Numerical - TCI indicators (with " / 5 indicators" suffix)
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                min={0}
                                max={5}
                                value={
                                  typeof filter.value === 'number'
                                    ? filter.value
                                    : ''
                                }
                                onChange={(e) =>
                                  handleValueChange(
                                    index,
                                    e.target.value === ''
                                      ? ''
                                      : Number(e.target.value),
                                  )
                                }
                                placeholder="Enter number"
                                className="w-full rounded-[14px]"
                              />
                              <span className="shrink-0 text-sm text-muted-foreground">
                                / 5 indicators
                              </span>
                            </div>
                          ) : (
                            // Numerical - not range
                            <Input
                              type="number"
                              value={
                                typeof filter.value === 'number'
                                  ? filter.value
                                  : ''
                              }
                              onChange={(e) =>
                                handleValueChange(
                                  index,
                                  e.target.value === ''
                                    ? ''
                                    : Number(e.target.value),
                                )
                              }
                              placeholder="Enter number"
                              className="w-full rounded-[14px]"
                            />
                          )
                        ) : fieldOption?.type === 'boolean' ||
                          fieldOption?.type === 'enum' ? (
                          // Fixed option dropdown
                          <Select
                            value={String(filter.value)}
                            onValueChange={(value) =>
                              handleValueChange(index, value)
                            }
                          >
                            <SelectTrigger className="w-full rounded-[14px] bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldOption.enumValues?.map((v) => (
                                <SelectItem key={v} value={v}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          // Free text
                          <Input
                            type="text"
                            value={String(filter.value)}
                            onChange={(e) =>
                              handleValueChange(index, e.target.value)
                            }
                            placeholder="Enter value"
                            className="w-full rounded-[14px]"
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFilter(index)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Select filter row – shown when no filters or when adding */}
        {(filters.length === 0 || selectorOpen) && (
          <div className={cn('px-5 pb-3', filters.length > 0 && 'pt-1')}>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-sm text-muted-foreground">
                {filters.length === 0 ? 'Where' : 'and'}
              </span>
              <div className="w-[152px] shrink-0">
                <Popover
                  open={selectorOpen}
                  onOpenChange={(v) => {
                    setSelectorOpen(v)
                    if (!v) setSearchQuery('')
                  }}
                >
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-[14px] border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
                      />
                    }
                  >
                    Select filter
                    {selectorOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-[582px] gap-0 p-3" align="start">
                    {/* Search */}
                    <div className="mb-1 flex items-center gap-2 rounded-lg border border-blue-400 px-3 py-2 focus-within:border-blue-500">
                      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <input
                        ref={searchRef}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Search options"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* List */}
                    <ScrollArea className="h-[220px]">
                      <div className="py-1">
                        {groupedFields.map(({ group, label, fields }, gi) => (
                          <div key={group}>
                            {gi > 0 && (
                              <div className="my-1 border-t border-[var(--slate-6)]" />
                            )}
                            {label && (
                              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {label}
                              </div>
                            )}
                            {fields.map((opt) => (
                              <button
                                key={opt.field}
                                type="button"
                                onClick={() => handleAddFilter(opt.field)}
                                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        ))}
                        {filteredFields.length === 0 &&
                          filteredImported.length === 0 && (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                              No filters found
                            </div>
                          )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3">
          {availableFields.length > 0 && !selectorOpen ? (
            <Button
              variant="secondary"
              size="sm"
              className="-ml-2 gap-1.5 font-semibold"
              onClick={() => setSelectorOpen(true)}
            >
              <Plus className="h-4 w-4 text-[var(--slate-11)]" />
              Add filter
            </Button>
          ) : (
            <div />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={filters.length === 0}
            className="gap-2 text-sm font-medium text-[var(--slate-12)]"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
