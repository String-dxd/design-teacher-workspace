import { CheckCircle2 } from 'lucide-react'

import type { Student } from '@/types/student'
import {
  assignBucket,
  completeCriteria,
  getMatchedCriteria,
} from '@/lib/profile-group-evaluation'
import { useProfileGroups } from '@/lib/profile-group-storage'
import { filterFieldConfigs } from '@/data/filter-config'

interface ProfileCriteriaDetailsCardProps {
  student: Student
}

export function ProfileCriteriaDetailsCard({
  student,
}: ProfileCriteriaDetailsCardProps) {
  const { appliedGroup } = useProfileGroups()
  if (!appliedGroup) return null

  const criteria = completeCriteria(appliedGroup)
  const matched = getMatchedCriteria(student, criteria)
  if (matched.length === 0) return null

  const bucket = assignBucket(matched.length, appliedGroup.buckets)

  return (
    <section className="scroll-mt-24 rounded-lg border border-twblue-6 bg-twblue-3/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Criteria details</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-lime-3 px-2.5 py-0.5 text-xs font-medium text-lime-11">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Criteria met ({matched.length})
          </span>
        </div>
        {bucket && (
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm">
            {bucket.name || 'Bucket'}
          </span>
        )}
      </div>
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {matched.map((c) => {
          const config = filterFieldConfigs.find((f) => f.field === c.field)
          return (
            <div key={c.id}>
              <dt className="text-sm font-medium">
                {config?.label ?? c.field}
              </dt>
              <dd className="text-sm text-muted-foreground">
                {formatCriterionValue(c.value)}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

function formatCriterionValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}
