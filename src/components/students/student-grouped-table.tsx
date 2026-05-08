import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type { Student } from '@/types/student'
import type { ProfileGroup, ProfileGroupBucket } from '@/types/profile-group'
import {
  assignBucket,
  completeCriteria,
  countMatchedCriteria,
  getMatchedCriteria,
} from '@/lib/profile-group-evaluation'
import { filterFieldConfigs } from '@/data/filter-config'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface StudentGroupedTableProps {
  students: Array<Student>
  group: ProfileGroup
  className?: string
}

interface BucketRow {
  bucket: ProfileGroupBucket
  students: Array<{
    student: Student
    matchedCount: number
    primaryTag: string | null
  }>
}

const COL_COUNT = 11

export function StudentGroupedTable({
  students,
  group,
  className,
}: StudentGroupedTableProps) {
  const navigate = useNavigate()
  const criteria = useMemo(() => completeCriteria(group), [group])

  const bucketRows = useMemo<Array<BucketRow>>(() => {
    const rows: Record<string, BucketRow> = {}
    for (const bucket of group.buckets) {
      rows[bucket.id] = { bucket, students: [] }
    }
    for (const student of students) {
      const matchedCount = countMatchedCriteria(student, criteria)
      const bucket = assignBucket(matchedCount, group.buckets)
      if (!bucket) continue
      const matched = getMatchedCriteria(student, criteria)
      const primaryTag = matched[0]
        ? (filterFieldConfigs.find((f) => f.field === matched[0].field)
            ?.label ?? null)
        : null
      rows[bucket.id].students.push({ student, matchedCount, primaryTag })
    }
    return group.buckets.map((b) => rows[b.id])
  }, [criteria, group.buckets, students])

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const b of group.buckets) init[b.id] = false
    return init
  })

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className={cn('max-w-full overflow-x-auto bg-white', className)}>
      <Table>
        <TableHeader className="border-b bg-white">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="w-12 pl-6">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Criteria met</TableHead>
            <TableHead>Criteria tag</TableHead>
            <TableHead>Non-VR absences (days)</TableHead>
            <TableHead>Late-coming (days)</TableHead>
            <TableHead>Attendance (%)</TableHead>
            <TableHead>Offences</TableHead>
            <TableHead>Counselling</TableHead>
            <TableHead>Special Educational Needs (SEN)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bucketRows.map(({ bucket, students: bucketStudents }) => {
            const isOpen = expanded[bucket.id]
            return (
              <Fragment key={bucket.id}>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableCell colSpan={COL_COUNT} className="py-2 pl-6">
                    <button
                      type="button"
                      onClick={() => toggle(bucket.id)}
                      className="flex w-full items-center gap-2 text-left text-sm font-semibold"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span>{bucket.name || 'Untitled'}</span>
                      <span className="font-normal text-muted-foreground">
                        ({bucketStudents.length} students)
                      </span>
                      {isOpen && (
                        <span className="ml-2 rounded-md bg-white px-2 py-0.5 text-xs font-medium text-foreground shadow-sm">
                          Collapse
                        </span>
                      )}
                    </button>
                  </TableCell>
                </TableRow>
                {isOpen &&
                  bucketStudents.map(
                    ({ student, matchedCount, primaryTag }, idx) => {
                      const attendancePct =
                        student.totalSchoolDays > 0
                          ? Math.round(
                              (student.daysPresent / student.totalSchoolDays) *
                                100,
                            )
                          : 0
                      const counsellingLabel = !student.counsellingSessions
                        ? '-'
                        : student.counsellingSessions >= 2
                          ? 'Complex'
                          : 'Less complex'
                      return (
                        <TableRow
                          key={student.id}
                          className="group cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            navigate({
                              to: '/students/$id',
                              params: { id: student.id },
                            })
                          }
                        >
                          <TableCell className="sticky left-0 z-10 bg-white pl-6 text-muted-foreground transition-colors group-hover:bg-[color-mix(in_oklab,var(--muted)_50%,white)]">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>{matchedCount}</TableCell>
                          <TableCell>
                            {primaryTag ? (
                              <Badge
                                variant="secondary"
                                className="border-emerald-300 bg-emerald-50 text-emerald-700"
                              >
                                {primaryTag}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{student.absences}</TableCell>
                          <TableCell>{student.lateComing}</TableCell>
                          <TableCell>{attendancePct}</TableCell>
                          <TableCell>{student.offences}</TableCell>
                          <TableCell>{counsellingLabel}</TableCell>
                          <TableCell>
                            {student.sen || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    },
                  )}
                {isOpen && bucketStudents.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={COL_COUNT}
                      className="py-4 text-center text-sm text-muted-foreground"
                    >
                      No students match this bucket
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
