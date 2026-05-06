import { EntitySelector } from './entity-selector'
import type React from 'react'
import type {
  EntityItem,
  EntityScope,
  MemberDetail,
  SearchResults,
  SelectedEntity,
} from './entity-selector'
import { MOCK_STAFF, MOCK_STAFF_GROUPS } from '@/data/mock-staff'
import { stripSalutation } from '@/lib/utils'

// Backward-compatible type alias
export type { SelectedEntity as SelectedStaff }

interface StaffSelectorProps {
  value: Array<SelectedEntity>
  onChange: (staff: Array<SelectedEntity>) => void
  renderChipExtra?: (entity: SelectedEntity) => React.ReactNode
  hideChips?: boolean
  openOnFocus?: boolean
  autoOpen?: boolean
}

/** "Sec 3A" → "3A", consistent with student class labels */
function formatFormClass(cls: string | undefined): string | undefined {
  return cls?.replace(/^Sec\s+/i, '')
}

function makeMemberNames(ids: Array<string>): Array<string> {
  return ids
    .map((id) => {
      const s = MOCK_STAFF.find((m) => m.id === id)
      return s ? stripSalutation(s.name) : undefined
    })
    .filter((n): n is string => Boolean(n))
}

function makeMemberDetails(ids: Array<string>): Array<MemberDetail> {
  return ids.flatMap((id) => {
    const s = MOCK_STAFF.find((m) => m.id === id)
    if (!s) return []
    return [
      {
        name: stripSalutation(s.name),
        sublabel: [formatFormClass(s.formClass), s.email]
          .filter(Boolean)
          .join(' · '),
      },
    ]
  })
}

// Individual staff — label has salutation stripped; sublabel shows form class (if any) + email
const STAFF_INDIVIDUAL_ITEMS: Array<EntityItem> = MOCK_STAFF.map((s) => ({
  id: s.id,
  label: stripSalutation(s.name),
  sublabel: [formatFormClass(s.formClass), s.email].filter(Boolean).join(' · '),
  type: 'individual' as const,
  count: 1,
}))

// Level scope — level teams (e.g. Sec 3 Level Team)
// groupType is 'staff-group' (not 'level') so count reads "members" not "students"
const LEVEL_GROUP_ITEMS: Array<EntityItem> = MOCK_STAFF_GROUPS.filter(
  (g) => g.groupType === 'level',
).map((g) => ({
  id: g.id,
  label: g.label,
  type: 'group' as const,
  count: g.memberIds.length,
  memberNames: makeMemberNames(g.memberIds),
  memberDetails: makeMemberDetails(g.memberIds),
  groupType: 'staff-group' as const,
}))

// School scope — school-wide groups only (departments are kept for search but not surfaced here)
const SCHOOL_GROUP_ITEMS: Array<EntityItem> = MOCK_STAFF_GROUPS.filter(
  (g) => g.groupType === 'staff-group',
).map((g) => ({
  id: g.id,
  label: g.label,
  type: 'group' as const,
  count: g.memberIds.length,
  memberNames: makeMemberNames(g.memberIds),
  memberDetails: makeMemberDetails(g.memberIds),
  groupType: (g.groupType ?? 'staff-group') as 'department' | 'staff-group',
}))

// All group items flat (for search)
const ALL_STAFF_GROUP_ITEMS: Array<EntityItem> = [
  ...LEVEL_GROUP_ITEMS,
  ...SCHOOL_GROUP_ITEMS,
]

// Scopes: Individual | Level | School — mirrors PG app's staff-in-charge picker
const STAFF_SCOPES: Array<EntityScope> = [
  { id: 'individual', label: 'Individual', items: STAFF_INDIVIDUAL_ITEMS },
  { id: 'level', label: 'Level', items: LEVEL_GROUP_ITEMS },
  { id: 'school', label: 'School', items: SCHOOL_GROUP_ITEMS },
]

function staffSearchFn(query: string): SearchResults {
  const q = query.toLowerCase()
  if (!q) {
    return {
      groups: ALL_STAFF_GROUP_ITEMS,
      individuals: STAFF_INDIVIDUAL_ITEMS,
    }
  }
  return {
    groups: ALL_STAFF_GROUP_ITEMS.filter((g) =>
      g.label.toLowerCase().includes(q),
    ),
    individuals: STAFF_INDIVIDUAL_ITEMS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (s.sublabel?.toLowerCase().includes(q) ?? false),
    ),
  }
}

export function StaffSelector({
  value,
  onChange,
  renderChipExtra,
  hideChips,
  openOnFocus,
  autoOpen,
}: StaffSelectorProps) {
  return (
    <EntitySelector
      value={value}
      onChange={onChange}
      scopes={STAFF_SCOPES}
      searchFn={staffSearchFn}
      placeholder="Search staff by name or group…"
      searchPlaceholder="Search staff…"
      noResultsText="No staff found"
      chipsBelow
      maxVisibleTokens={2}
      renderChipExtra={renderChipExtra}
      hideChips={hideChips}
      openOnFocus={openOnFocus}
      autoOpen={autoOpen}
    />
  )
}
