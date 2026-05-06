export interface GroupMember {
  id: string
  name: string
  class: string
  nric?: string
  indexNumber?: number
  cca?: string
  /** True if this member was recently added by a criteria update (live groups only) */
  isNew?: boolean
}

export interface GroupSharedWith {
  staffId: string
  name: string
  email: string
  role: 'editor' | 'viewer'
}

export interface StaffInCharge {
  id: string
  name: string
  type: 'individual' | 'group'
}

export type StructuredGroupType = 'class' | 'level' | 'cca' | 'teaching'
export type GroupTypeFilterOption =
  | 'regular'
  | 'class'
  | 'level'
  | 'cca'
  | 'teaching'

export interface StudentGroup {
  id: string
  name: string
  description?: string
  kind: 'regular'
  /** static = manually curated; live = auto-updates in real-time based on criteria */
  listType?: 'static' | 'live'
  /** Human-readable criteria label shown on live groups (e.g. "Attendance below 80%") */
  criteria?: string
  /** Where to redirect the user to edit the criteria or fix errors (for live groups) */
  criteriaSourceHref?: string
  source?: 'created' | 'saved-from-sdt'
  members: Array<GroupMember>
  staffInCharge: Array<StaffInCharge>
  visibility: 'private' | 'school'
  sharedWith: Array<GroupSharedWith>
  createdBy: { name: string; email: string }
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
}

export interface StructuredGroup {
  id: string
  kind: 'structured'
  structuredType: StructuredGroupType
  name: string
  members: Array<GroupMember>
  syncedAt: string
}

export type UnifiedGroup = StudentGroup | StructuredGroup

export function getStructuredTypeLabel(type: StructuredGroupType): string {
  return {
    class: 'Class',
    level: 'Level',
    cca: 'CCA',
    teaching: 'Teaching Group',
  }[type]
}
