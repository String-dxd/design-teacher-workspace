import { EntitySelector, detectOverlaps } from './entity-selector'
import type { SearchResults, SelectedEntity } from './entity-selector'
import {
  ALL_STUDENT_GROUP_ITEMS,
  STUDENT_INDIVIDUAL_ITEMS,
  STUDENT_OVERLAP_MAP,
  getStudentScopes,
} from '@/data/mock-student-groups'

// Backward-compatible type alias — existing code that imports SelectedRecipient continues to work
export type { SelectedEntity as SelectedRecipient }

interface StudentRecipientSelectorProps {
  value: Array<SelectedEntity>
  onChange: (recipients: Array<SelectedEntity>) => void
}

function studentSearchFn(query: string): SearchResults {
  const q = query.toLowerCase()
  return {
    groups: ALL_STUDENT_GROUP_ITEMS.filter((g) =>
      g.label.toLowerCase().includes(q),
    ),
    individuals: STUDENT_INDIVIDUAL_ITEMS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (s.sublabel?.toLowerCase().includes(q) ?? false),
    ).slice(0, 8),
  }
}

export function StudentRecipientSelector({
  value,
  onChange,
}: StudentRecipientSelectorProps) {
  const overlaps = detectOverlaps(value, STUDENT_OVERLAP_MAP)

  return (
    <>
      <EntitySelector
        value={value}
        onChange={onChange}
        scopes={getStudentScopes()}
        searchFn={studentSearchFn}
        placeholder="Search students, classes, CCAs…"
        searchPlaceholder="Search by name, class, or group…"
        noResultsText="No students or groups found"
        emptyTabText="No items in this category"
        chipsBelow
        maxVisibleTokens={3}
      />
      {overlaps.map((w, i) => (
        <p key={i} className="mt-1.5 text-xs text-amber-600">
          {w.childLabel} is already included in {w.parentLabel}. Some students
          may receive duplicates.
        </p>
      ))}
    </>
  )
}
