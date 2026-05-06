import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Minus,
  Plus,
  Search,
  User,
  Users,
  X,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GroupType =
  | 'class'
  | 'level'
  | 'school'
  | 'cca'
  | 'teaching'
  | 'custom'
  | 'department'
  | 'staff-group'

export interface MemberDetail {
  name: string
  sublabel?: string // e.g. "3A · tanml@school.edu.sg" for staff
  badge?: string // right-aligned label (e.g. NRIC for students)
  isNew?: boolean // recently added by a criteria update (live groups only)
}

export interface EntityItem {
  id: string
  label: string
  sublabel?: string
  badge?: string // right-aligned label on the name row (e.g. NRIC for students)
  type: 'group' | 'individual'
  count?: number
  memberNames?: Array<string> // plain names for chip tooltips
  memberDetails?: Array<MemberDetail> // richer per-member info for expanded list
  groupType?: GroupType
  listType?: 'static' | 'live' // criteria-based groups auto-update membership
  criteria?: string // human-readable criteria label (live groups only)
}

export interface SelectedEntity {
  id: string
  label: string
  type: 'group' | 'individual'
  count: number
  groupType?: GroupType
  memberNames?: Array<string>
  excludedMemberNames?: Array<string>
}

export interface ScopeSection {
  label: string
  items: Array<EntityItem>
}

export interface EntityScope {
  id: string
  label: string
  items: Array<EntityItem>
  sections?: Array<ScopeSection>
  createHref?: string
  createLabel?: string
}

export interface SearchResults {
  groups: Array<EntityItem>
  individuals: Array<EntityItem>
}

export interface EntitySelectorProps {
  value: Array<SelectedEntity>
  onChange: (entities: Array<SelectedEntity>) => void
  scopes?: Array<EntityScope>
  searchFn: (query: string) => SearchResults
  multiSelect?: boolean
  placeholder?: string
  searchPlaceholder?: string
  noResultsText?: string
  emptyTabText?: string
  maxScrollHeight?: string
  /** When set, collapses chips beyond this count behind a "+N more" badge. */
  maxVisibleTokens?: number
  /** Optional slot rendered inside each selected chip, after the label. */
  renderChipExtra?: (entity: SelectedEntity) => React.ReactNode
  /** When true, selected chips render below the search input instead of inline. */
  chipsBelow?: boolean
  /** When true, suppresses chip rendering entirely (use when the parent already shows selections elsewhere). */
  hideChips?: boolean
  /** When false, focusing the input won't open the dropdown — the user must type first. Defaults to true. */
  openOnFocus?: boolean
  /** When true, the dropdown opens immediately on mount (e.g. empty dialog). */
  autoOpen?: boolean
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

// Returns the unit label for a group's member count.
// Student-oriented groups use "student(s)"; staff/generic groups use "member(s)".
function getCountUnit(groupType: GroupType | undefined, count: number): string {
  const studentTypes: Array<GroupType> = [
    'class',
    'level',
    'school',
    'cca',
    'teaching',
    'custom',
  ]
  if (groupType && studentTypes.includes(groupType)) {
    return count === 1 ? 'student' : 'students'
  }
  return count === 1 ? 'member' : 'members'
}

export function computeSummary(
  entities: Array<SelectedEntity>,
  summaryLabel: string,
  summaryLabelPlural: string,
): string {
  if (entities.length === 0) return ''

  const groups = entities.filter((e) => e.type === 'group')
  const individuals = entities.filter((e) => e.type === 'individual')
  const totalCount = entities.reduce((sum, e) => sum + e.count, 0)
  const hasGroups = groups.length > 0

  const byType = new Map<string, number>()
  for (const g of groups) {
    const key = g.groupType ?? 'staff-group'
    byType.set(key, (byType.get(key) ?? 0) + 1)
  }

  const typeOrder: Array<GroupType> = [
    'school',
    'level',
    'class',
    'cca',
    'teaching',
    'custom',
    'department',
    'staff-group',
  ]
  const typeLabels: Record<string, [string, string]> = {
    school: ['school', 'schools'],
    level: ['level', 'levels'],
    class: ['class', 'classes'],
    cca: ['CCA', 'CCAs'],
    teaching: ['teaching group', 'teaching groups'],
    custom: ['custom group', 'custom groups'],
    department: ['dept', 'depts'],
    'staff-group': ['group', 'groups'],
  }

  const parts: Array<string> = []

  for (const type of typeOrder) {
    const count = byType.get(type) ?? 0
    if (count === 0) continue
    const pair = typeLabels[type] ?? [type, `${type}s`]
    parts.push(`${count} ${count === 1 ? pair[0] : pair[1]}`)
  }

  if (individuals.length > 0) {
    parts.push(
      `${individuals.length} individual${individuals.length !== 1 ? 's' : ''}`,
    )
  }

  const countStr = `${hasGroups ? '~' : ''}${totalCount} ${totalCount === 1 ? summaryLabel : summaryLabelPlural}`
  return [...parts, countStr].join(' · ')
}

export function detectOverlaps(
  entities: Array<SelectedEntity>,
  overlapMap: Record<string, Array<string>>,
): Array<{ childLabel: string; parentLabel: string }> {
  const selectedIds = new Set(entities.map((e) => e.id))
  const warnings: Array<{ childLabel: string; parentLabel: string }> = []

  for (const [parentId, childIds] of Object.entries(overlapMap)) {
    if (!selectedIds.has(parentId)) continue
    const parent = entities.find((e) => e.id === parentId)
    if (!parent) continue
    for (const childId of childIds) {
      if (!selectedIds.has(childId)) continue
      const child = entities.find((e) => e.id === childId)
      if (!child) continue
      warnings.push({ childLabel: child.label, parentLabel: parent.label })
    }
  }

  return warnings
}

function toSelectedEntity(item: EntityItem): SelectedEntity {
  return {
    id: item.id,
    label: item.label,
    type: item.type,
    count: item.count ?? 1,
    groupType: item.groupType,
    memberNames: item.memberNames,
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ResultRowProps {
  item: EntityItem
  isSelected: boolean
  onToggle: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
  selectedIndividualNames?: Set<string>
  excludedMemberNames?: Set<string>
  onMemberToggle?: (name: string) => void
}

function ResultRow({
  item,
  isSelected,
  onToggle,
  isExpanded = false,
  onToggleExpand,
  selectedIndividualNames = new Set<string>(),
  excludedMemberNames = new Set(),
  onMemberToggle,
}: ResultRowProps) {
  const hasMembers =
    item.type === 'group' &&
    ((item.memberDetails?.length ?? 0) > 0 ||
      (item.memberNames?.length ?? 0) > 0)

  return (
    <>
      {/* Row: selection area + expand chevron as siblings inside a flex div */}
      <div
        className={cn(
          'flex w-full transition-colors',
          isSelected ? 'bg-twblue-1' : 'hover:bg-slate-100',
        )}
      >
        {/* Selection toggle — takes all available space */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggle}
          aria-pressed={isSelected}
          className="flex flex-1 items-center gap-3 px-3 py-2 text-left text-sm"
        >
          {/* Checkbox */}
          <span
            className={cn(
              'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors',
              isSelected
                ? 'border-primary bg-primary text-white'
                : 'border-slate-300 bg-white',
            )}
          >
            {isSelected && excludedMemberNames.size === 0 && (
              <Check className="h-3 w-3" />
            )}
            {isSelected && excludedMemberNames.size > 0 && (
              <Minus className="h-3 w-3" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-semibold">
              <span className="truncate">{item.label}</span>
              {item.listType === 'live' && (
                <span className="shrink-0 rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-[9px] font-semibold text-primary">
                  Criteria
                </span>
              )}
            </p>
            {item.sublabel && (
              <p className="truncate text-xs text-muted-foreground">
                {item.sublabel}
              </p>
            )}
          </div>
          {item.type === 'group' && item.count !== undefined && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {isSelected && excludedMemberNames.size > 0 ? (
                <>
                  <span className="font-medium text-blue-600">
                    {item.count - excludedMemberNames.size}
                  </span>
                  /{item.count}
                </>
              ) : (
                item.count - excludedMemberNames.size
              )}{' '}
              {getCountUnit(
                item.groupType,
                item.count - excludedMemberNames.size,
              )}
            </span>
          )}
          {item.badge && (
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {item.badge}
            </span>
          )}
        </button>

        {/* Expand chevron — only for groups with member names */}
        {hasMembers && (
          <button
            type="button"
            aria-label={isExpanded ? 'Hide members' : 'Show members'}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onToggleExpand?.()}
            className={cn(
              'flex shrink-0 items-center px-2 transition-colors',
              isSelected ? 'hover:bg-twblue-3' : 'hover:bg-slate-100',
            )}
          >
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150',
                isExpanded && 'rotate-180',
              )}
            />
          </button>
        )}
      </div>

      {/* Expanded member list */}
      {isExpanded && hasMembers && (
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 pb-3 pt-2.5">
          {/* Header: member count + criteria note */}
          {(() => {
            const total = item.memberDetails?.length ?? item.memberNames!.length
            const newCount =
              item.memberDetails?.filter((d) => d.isNew).length ?? 0
            return (
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {`${total} ${getCountUnit(item.groupType, total)}`}
                {newCount > 0 && (
                  <span className="ml-1.5 normal-case font-normal text-emerald-600">
                    · {newCount} new
                  </span>
                )}
              </p>
            )
          })()}

          {/* Scrollable numbered list */}
          <div
            className="max-h-[200px] overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {(
              item.memberDetails ??
              item.memberNames!.map((name): MemberDetail => ({ name }))
            ).map((detail, index) => {
              const isMemberIncluded =
                isSelected && !excludedMemberNames.has(detail.name)
              return (
                <button
                  key={detail.name}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onMemberToggle?.(detail.name)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-blue-50"
                >
                  <span
                    className={cn(
                      'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors',
                      isMemberIncluded
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-300 bg-white',
                    )}
                  >
                    {isMemberIncluded && <Check className="h-3 w-3" />}
                  </span>
                  <span className="w-5 shrink-0 text-right text-[10px] tabular-nums text-slate-400">
                    #{index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span
                      className={cn(
                        'font-medium',
                        isMemberIncluded ? 'text-slate-700' : 'text-slate-400',
                      )}
                    >
                      {detail.name}
                    </span>
                    {detail.sublabel && detail.sublabel !== item.label && (
                      <span className="ml-1 shrink-0 rounded bg-slate-200 px-1 py-px text-[9px] font-medium text-slate-500">
                        {detail.sublabel}
                      </span>
                    )}
                    {detail.isNew && (
                      <span className="ml-1 shrink-0 rounded bg-emerald-100 px-1 py-px text-[9px] font-semibold text-emerald-700">
                        New
                      </span>
                    )}
                  </span>
                  {detail.badge && (
                    <span className="shrink-0 font-mono text-[10px] text-slate-400">
                      {detail.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Note when roster is incomplete (data not available in preview) */}
          {(() => {
            const shown = item.memberDetails?.length ?? item.memberNames!.length
            return (
              item.count !== undefined &&
              item.count > shown && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Full roster not available in this preview (+
                  {item.count - shown} more)
                </p>
              )
            )
          })()}
        </div>
      )}
    </>
  )
}

function EntityChip({
  entity,
  onRemove,
  extra,
  large = false,
  onChipClick,
}: {
  entity: SelectedEntity
  onRemove: () => void
  extra?: React.ReactNode
  large?: boolean
  onChipClick?: () => void
}) {
  const names = entity.memberNames ?? []
  const tooltipTitle =
    names.length > 0
      ? names.length > 12
        ? `${names.slice(0, 12).join(', ')} and ${names.length - 12} more`
        : names.join(', ')
      : undefined

  return (
    <span
      title={tooltipTitle}
      role={onChipClick ? 'button' : undefined}
      tabIndex={onChipClick ? 0 : undefined}
      onMouseDown={onChipClick ? (e) => e.preventDefault() : undefined}
      onClick={onChipClick}
      onKeyDown={
        onChipClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChipClick()
              }
            }
          : undefined
      }
      className={cn(
        'inline-flex shrink-0 items-center rounded-md font-medium',
        large
          ? 'gap-2 border border-input bg-background px-3 py-1.5 text-sm text-slate-700'
          : cn(
              'gap-1 bg-twblue-2 px-2 py-0.5 text-xs text-twblue-9',
              extra ? 'max-w-[260px]' : 'max-w-[180px]',
            ),
        onChipClick && 'cursor-pointer hover:bg-slate-50',
      )}
    >
      {entity.type === 'group' ? (
        <Users
          className={cn(
            'shrink-0',
            large ? 'h-3.5 w-3.5 text-slate-400' : 'h-3 w-3',
          )}
        />
      ) : (
        <User
          className={cn(
            'shrink-0',
            large ? 'h-3.5 w-3.5 text-slate-400' : 'h-3 w-3',
          )}
        />
      )}
      <span className="truncate">{entity.label}</span>
      {entity.type === 'group' && (
        <span
          className={cn('shrink-0', large ? 'text-slate-400' : 'opacity-60')}
        >
          · {entity.count}
        </span>
      )}
      {extra != null && (
        <span
          className={cn('flex shrink-0 items-center', large ? 'ml-2' : 'ml-1')}
        >
          {extra}
        </span>
      )}
      <button
        type="button"
        aria-label={`Remove ${entity.label}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onRemove}
        className={cn(
          'shrink-0 rounded-full',
          large
            ? 'ml-1 p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            : 'ml-0.5 p-0.5 hover:bg-twblue-4 hover:text-twblue-9',
        )}
      >
        <X className={cn(large ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
      </button>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EntitySelector({
  value,
  onChange,
  scopes,
  searchFn,
  multiSelect = true,
  placeholder = 'Search…',
  searchPlaceholder = 'Search…',
  noResultsText = 'No results found',
  emptyTabText = 'No items in this category',
  maxScrollHeight = '240px',
  maxVisibleTokens,
  renderChipExtra,
  chipsBelow = false,
  hideChips = false,
  openOnFocus = true,
  autoOpen = false,
}: EntitySelectorProps) {
  const [isOpen, setIsOpen] = useState(autoOpen)
  const [query, setQuery] = useState('')
  const [activeScope, setActiveScope] = useState(scopes?.[0]?.id ?? '')
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [groupExclusions, setGroupExclusions] = useState<
    Map<string, Set<string>>
  >(new Map())
  const [chipsExpanded, setChipsExpanded] = useState(false)

  // Auto-collapse when enough chips have been removed
  useEffect(() => {
    if (maxVisibleTokens != null && value.length <= maxVisibleTokens) {
      setChipsExpanded(false)
    }
  }, [value.length, maxVisibleTokens])

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  // Derived: names of individually-selected entities (for member expansion highlights)
  const selectedIndividualNames = useMemo(
    () =>
      new Set(value.filter((e) => e.type === 'individual').map((e) => e.label)),
    [value],
  )

  // Sync activeScope when scopes change
  useEffect(() => {
    if (
      scopes &&
      scopes.length > 0 &&
      !scopes.find((s) => s.id === activeScope)
    ) {
      setActiveScope(scopes[0].id)
    }
  }, [scopes, activeScope])

  // Collapse expanded group when query changes (group may disappear from results)
  useEffect(() => {
    setExpandedGroupId(null)
  }, [query])

  // Outside-click to close (desktop only — Sheet handles its own dismissal)
  useEffect(() => {
    if (isMobile) return
    function handleMouseDown(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isMobile])

  function handleToggle(item: EntityItem) {
    const isSelected = value.some((e) => e.id === item.id)
    if (isSelected) {
      onChange(value.filter((e) => e.id !== item.id))
      // Clear any member exclusions for this group
      if (groupExclusions.has(item.id)) {
        const next = new Map(groupExclusions)
        next.delete(item.id)
        setGroupExclusions(next)
      }
    } else if (multiSelect) {
      onChange([...value, toSelectedEntity(item)])
    } else {
      onChange([toSelectedEntity(item)])
      setIsOpen(false)
      setQuery('')
    }
  }

  function handleMemberToggle(item: EntityItem, memberName: string) {
    const groupId = item.id
    const allNames = item.memberNames ?? []
    const isGroupSelected = value.some((e) => e.id === groupId)

    if (!isGroupSelected) {
      // Group not yet selected: add it, excluding all members except the clicked one
      const exclusions = new Set(allNames.filter((n) => n !== memberName))
      const next = new Map(groupExclusions)
      if (exclusions.size > 0) next.set(groupId, exclusions)
      setGroupExclusions(next)
      const entity = toSelectedEntity(item)
      onChange([
        ...value,
        {
          ...entity,
          excludedMemberNames:
            exclusions.size > 0 ? [...exclusions] : undefined,
        },
      ])
      return
    }

    // Group already selected: toggle this individual member
    const currentExcl = groupExclusions.get(groupId) ?? new Set<string>()
    const newExcl = new Set(currentExcl)
    if (newExcl.has(memberName))
      newExcl.delete(memberName) // re-include
    else newExcl.add(memberName) // exclude

    // If all members are now excluded, remove the group entirely
    if (allNames.length > 0 && newExcl.size >= allNames.length) {
      onChange(value.filter((e) => e.id !== groupId))
      const next = new Map(groupExclusions)
      next.delete(groupId)
      setGroupExclusions(next)
      return
    }

    const next = new Map(groupExclusions)
    if (newExcl.size === 0) next.delete(groupId)
    else next.set(groupId, newExcl)
    setGroupExclusions(next)
    const updatedValue = value.map((e) =>
      e.id === groupId
        ? {
            ...e,
            excludedMemberNames: newExcl.size > 0 ? [...newExcl] : undefined,
          }
        : e,
    )
    onChange(updatedValue)
  }

  function handleRemove(entity: SelectedEntity) {
    onChange(value.filter((e) => e.id !== entity.id))
    // Clear exclusions if removed
    if (groupExclusions.has(entity.id)) {
      const next = new Map(groupExclusions)
      next.delete(entity.id)
      setGroupExclusions(next)
    }
  }

  function closePanel() {
    setIsOpen(false)
    setQuery('')
  }

  /** Open the dropdown and expand the given group so the user can (de)select members. */
  function openGroup(entity: SelectedEntity) {
    // Find which scope contains this group and switch to it
    const owningScope = scopes?.find(
      (s) =>
        s.items?.some((item) => item.id === entity.id) ||
        s.sections?.some((sec) =>
          sec.items.some((item) => item.id === entity.id),
        ),
    )
    if (owningScope) setActiveScope(owningScope.id)
    setExpandedGroupId(entity.id)
    setQuery('') // switch to browse mode, not search
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // When no scopes (staff/search-only mode): always call searchFn so staff panel
  // shows all groups + individuals immediately on open (searchFn('') returns all).
  // When scopes exist: only call searchFn when there's a query; browse tabs handle
  // the empty-query state.
  const searchResults =
    !scopes || query ? searchFn(query) : { groups: [], individuals: [] }

  function renderSectionHeader(title: string) {
    return (
      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
        {title}
      </div>
    )
  }

  function renderBrowseTab() {
    const scope = scopes?.find((s) => s.id === activeScope)
    if (!scope) return null

    const renderItems = (items: Array<EntityItem>) =>
      items.map((item) => (
        <ResultRow
          key={item.id}
          item={item}
          isSelected={value.some((e) => e.id === item.id)}
          onToggle={() => handleToggle(item)}
          isExpanded={expandedGroupId === item.id}
          onToggleExpand={() =>
            setExpandedGroupId((prev) => (prev === item.id ? null : item.id))
          }
          selectedIndividualNames={selectedIndividualNames}
          excludedMemberNames={groupExclusions.get(item.id)}
          onMemberToggle={(name) => handleMemberToggle(item, name)}
        />
      ))

    const content = scope.sections
      ? scope.sections.map((section) => (
          <div key={section.label}>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {section.label}
            </div>
            {renderItems(section.items)}
          </div>
        ))
      : renderItems(scope.items)

    const createLink = scope.createHref && (
      <Link
        to={scope.createHref}
        className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-slate-50"
      >
        <Plus className="h-4 w-4" />
        {scope.createLabel ?? 'Create'}
      </Link>
    )

    if (!scope.sections && scope.items.length === 0 && !scope.createHref) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {emptyTabText}
        </p>
      )
    }

    return (
      <>
        {content}
        {createLink}
      </>
    )
  }

  function renderSearchResults() {
    const { groups, individuals } = searchResults
    if (groups.length === 0 && individuals.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {noResultsText}
        </p>
      )
    }
    return (
      <>
        {groups.length > 0 && (
          <>
            {renderSectionHeader('Groups')}
            {groups.map((item) => (
              <ResultRow
                key={item.id}
                item={item}
                isSelected={value.some((e) => e.id === item.id)}
                onToggle={() => handleToggle(item)}
                isExpanded={expandedGroupId === item.id}
                onToggleExpand={() =>
                  setExpandedGroupId((prev) =>
                    prev === item.id ? null : item.id,
                  )
                }
                selectedIndividualNames={selectedIndividualNames}
                excludedMemberNames={groupExclusions.get(item.id)}
                onMemberToggle={(name) => handleMemberToggle(item, name)}
              />
            ))}
          </>
        )}
        {groups.length > 0 && individuals.length > 0 && (
          <div className="mx-3 my-0.5 border-t" />
        )}
        {individuals.length > 0 && (
          <>
            {renderSectionHeader('Individuals')}
            {individuals.map((item) => (
              <ResultRow
                key={item.id}
                item={item}
                isSelected={value.some((e) => e.id === item.id)}
                onToggle={() => handleToggle(item)}
                isExpanded={expandedGroupId === item.id}
                onToggleExpand={() =>
                  setExpandedGroupId((prev) =>
                    prev === item.id ? null : item.id,
                  )
                }
                selectedIndividualNames={selectedIndividualNames}
                excludedMemberNames={groupExclusions.get(item.id)}
                onMemberToggle={(name) => handleMemberToggle(item, name)}
              />
            ))}
          </>
        )}
      </>
    )
  }

  // Scope tab bar — rendered above the field on desktop, inside the Sheet on mobile
  const scopeTabs = scopes && scopes.length > 0 && (
    <div className="flex gap-1 overflow-x-auto scrollbar-none">
      {scopes.map((scope) => (
        <button
          key={scope.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setActiveScope(scope.id)
            setQuery('')
            if (!isMobile) {
              setIsOpen(true)
              inputRef.current?.focus()
            }
          }}
          className={cn(
            'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            activeScope === scope.id
              ? 'bg-twblue-2 text-twblue-9'
              : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground',
          )}
        >
          {scope.label}
        </button>
      ))}
    </div>
  )

  // Panel content — shared between desktop dropdown and mobile Sheet
  // (does NOT contain a search input — desktop search is inline in the token
  //  container; mobile Sheet adds its own search input above this)
  const panelBody = (
    <>
      {/* Browse tabs — top of the dropdown panel, visible when scopes exist and not searching */}
      {scopes && scopes.length > 0 && !query && (
        <div className="border-b px-2 py-1.5">{scopeTabs}</div>
      )}

      {/* Results */}
      <div style={{ maxHeight: maxScrollHeight, overflowY: 'auto' }}>
        {!scopes || query ? renderSearchResults() : renderBrowseTab()}
      </div>
    </>
  )

  // Token input container — replaces the old single-line trigger button.
  // Selected chips are always visible here; desktop search input lives here too.
  const tokenContainer = (
    <div
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      onClick={() => {
        if (!isMobile) {
          setIsOpen(true)
          inputRef.current?.focus()
        } else {
          setIsOpen(true)
        }
      }}
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-[var(--radius-input)] border border-input bg-background px-2.5 py-1.5 transition-colors',
        'cursor-text hover:border-ring',
        isOpen && 'border-ring ring-[3px] ring-ring/50',
      )}
    >
      {/* Selected chips (inline mode only — skipped when chipsBelow) */}
      {!chipsBelow &&
        (maxVisibleTokens != null &&
        !chipsExpanded &&
        value.length > maxVisibleTokens
          ? value.slice(0, maxVisibleTokens)
          : value
        ).map((entity) => (
          <EntityChip
            key={entity.id}
            entity={entity}
            onRemove={() => handleRemove(entity)}
            extra={renderChipExtra?.(entity)}
          />
        ))}

      {/* "+N more" overflow badge (inline mode only) */}
      {!chipsBelow &&
        maxVisibleTokens != null &&
        !chipsExpanded &&
        value.length > maxVisibleTokens && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              setChipsExpanded(true)
            }}
            className="inline-flex shrink-0 cursor-pointer items-center rounded-md border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
          >
            +{value.length - maxVisibleTokens} more
          </button>
        )}

      {/* Desktop: inline search input (always present, flex-1 expands to fill row) */}
      {!isMobile && (
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={
            value.length === 0 || chipsBelow ? placeholder : undefined
          }
          onChange={(e) => {
            setQuery(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => {
            if (openOnFocus) setIsOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              if (query) setQuery('')
              else closePanel()
            }
            // Backspace on empty input removes the last chip (inline mode only)
            if (
              !chipsBelow &&
              e.key === 'Backspace' &&
              !query &&
              value.length > 0
            ) {
              handleRemove(value[value.length - 1])
            }
          }}
          className="min-w-[100px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      )}

      {/* Clear all — visible when ≥1 chip is selected (inline mode only) */}
      {!chipsBelow && value.length > 0 && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange([])}
          className="ml-auto shrink-0 text-xs text-muted-foreground transition-colors hover:text-rose-500"
        >
          Clear all
        </button>
      )}

      {/* Mobile: placeholder text + chevron (input is inside the Sheet) */}
      {isMobile && (
        <>
          {value.length === 0 && (
            <span className="flex-1 text-sm text-muted-foreground">
              {placeholder}
            </span>
          )}
          <ChevronDown
            className={cn(
              'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </>
      )}
    </div>
  )

  return (
    <>
      <div ref={wrapperRef} className="relative">
        {tokenContainer}

        {/* Desktop: inline dropdown panel */}
        {!isMobile && isOpen && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow-md">
            {panelBody}
          </div>
        )}

        {/* Mobile: bottom Sheet */}
        {isMobile && (
          <Sheet
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) setQuery('')
            }}
          >
            <SheetContent
              side="bottom"
              showCloseButton={false}
              className="max-h-[85vh] rounded-t-xl px-0 pt-0"
            >
              {/* Drag handle + title bar */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex flex-col gap-1">
                  <div className="mx-auto h-1 w-12 rounded-full bg-slate-200" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {placeholder}
                </span>
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-md p-1 hover:bg-slate-100"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Search input inside Sheet */}
              <div className="relative border-b">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      if (query) setQuery('')
                      else closePanel()
                    }
                  }}
                  autoFocus
                  className="w-full border-0 bg-transparent py-2.5 pl-9 pr-8 text-sm outline-none placeholder:text-muted-foreground"
                />
                {query && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-slate-100"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Panel body (tabs + results) */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: 'calc(85vh - 108px)' }}
              >
                {panelBody}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Chips below area — rendered outside the relative wrapper so it's never clipped */}
      {chipsBelow && !hideChips && value.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {value.map((entity) => (
            <EntityChip
              key={entity.id}
              entity={entity}
              onRemove={() => handleRemove(entity)}
              extra={renderChipExtra?.(entity)}
              large
              onChipClick={
                entity.type === 'group' ? () => openGroup(entity) : undefined
              }
            />
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange([])}
            className="ml-auto shrink-0 text-xs text-muted-foreground transition-colors hover:text-rose-500"
          >
            Clear all
          </button>
        </div>
      )}
    </>
  )
}
