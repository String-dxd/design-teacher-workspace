import type { FilterCriterion } from '@/types/student'

export type ProfileGroupBucketRule =
  | { kind: 'meet_at_least'; count: number }
  | { kind: 'all_remaining' }

export interface ProfileGroupBucket {
  id: string
  name: string
  rule: ProfileGroupBucketRule
}

export interface ProfileGroup {
  id: string
  name: string
  criteria: Array<FilterCriterion>
  buckets: Array<ProfileGroupBucket>
  /** True when the group was applied without going through the Save flow.
   *  Unsaved groups are excluded from the saved-groups dropdown. */
  isUnsaved?: boolean
  createdAt: string
  updatedAt: string
}
