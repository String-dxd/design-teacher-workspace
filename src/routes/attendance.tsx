import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Avatar,
  AvatarFallback,
  Button,
  ToggleGroup,
  ToggleGroupItem,
} from '@flow/core'
import {
  CalendarCheck2,
  CircleCheck,
  CircleX,
  Clock,
  Search,
  UserRound,
} from '@flow/icons'

import { cn } from '@/lib/utils'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { ClassSelector } from '@/components/students/class-selector'
import { Input } from '@/components/ui/input'
import { mockStudents } from '@/data/mock-students'

export const Route = createFileRoute('/attendance')({
  component: AttendancePage,
})

type AttendanceStatus = 'present' | 'late' | 'absent'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function AttendancePage() {
  useSetBreadcrumbs([{ label: 'Attendance', href: '/attendance' }])

  const today = useMemo(() => new Date(), [])
  const [selectedClass, setSelectedClass] = useState('3A')
  const [searchQuery, setSearchQuery] = useState('')
  const [attendance, setAttendance] = useState<
    Partial<Record<string, AttendanceStatus>>
  >({})

  const classStudents = useMemo(() => {
    if (selectedClass === 'all') return mockStudents
    if (selectedClass.startsWith('Secondary')) {
      const levelNum = selectedClass.replace('Secondary ', '')
      return mockStudents.filter((s) => s.class.startsWith(levelNum))
    }
    return mockStudents.filter((s) => s.class === selectedClass)
  }, [selectedClass])

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return classStudents
    const q = searchQuery.toLowerCase()
    return classStudents.filter((s) => s.name.toLowerCase().includes(q))
  }, [classStudents, searchQuery])

  const summary = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0, unmarked: 0 }
    for (const student of classStudents) {
      const status = attendance[student.id]
      if (status) counts[status]++
      else counts.unmarked++
    }
    return counts
  }, [classStudents, attendance])

  const handleStatusChange = (studentId: string, value: string) => {
    if (!value) return
    setAttendance((prev) => ({
      ...prev,
      [studentId]: value as AttendanceStatus,
    }))
  }

  return (
    <div className="flex flex-col gap-lg pt-lg">
      {/* Page header */}
      <div className="flex items-start justify-between px-lg">
        <div className="flex flex-col gap-xs">
          <div className="flex items-center gap-sm">
            <CalendarCheck2 className="size-5 text-subtle" />
            <h1 className="typography-title-lg text-default">
              Morning Attendance
            </h1>
          </div>
          <p className="typography-body-sm text-subtle">
            {today.toLocaleDateString('en-SG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Button
          variant="default"
          onClick={() => console.log('Saving attendance:', attendance)}
          disabled={summary.unmarked > 0}
        >
          Save Attendance
        </Button>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-sm px-lg">
        <div className="flex items-center gap-xs rounded-md border border-success-7 bg-success-3 px-sm py-xs">
          <CircleCheck className="size-4 shrink-0 text-success-11" />
          <span className="typography-label-sm text-success-11">
            {summary.present} Present
          </span>
        </div>
        <div className="flex items-center gap-xs rounded-md border border-critical-7 bg-critical-3 px-sm py-xs">
          <CircleX className="size-4 shrink-0 text-critical-11" />
          <span className="typography-label-sm text-critical-11">
            {summary.absent} Absent
          </span>
        </div>
        <div className="flex items-center gap-xs rounded-md border border-amber-7 bg-amber-3 px-sm py-xs">
          <Clock className="size-4 shrink-0 text-amber-11" />
          <span className="typography-label-sm text-amber-11">
            {summary.late} Late
          </span>
        </div>
        {summary.unmarked > 0 && (
          <div className="flex items-center gap-xs rounded-md border border-default px-sm py-xs">
            <span className="typography-label-sm text-subtle">
              {summary.unmarked} Not marked
            </span>
          </div>
        )}
      </div>

      {/* Toolbar: class selector + search */}
      <div className="flex items-center gap-sm px-lg">
        <ClassSelector value={selectedClass} onValueChange={setSelectedClass} />
        <div className="relative ml-auto w-56">
          <Search className="pointer-events-none absolute left-sm top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            type="search"
            placeholder="Search students…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-xl"
          />
        </div>
      </div>

      {/* Student list */}
      <div className="mx-lg mb-lg overflow-hidden rounded-lg border border-default bg-section">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center gap-sm py-2xl">
            <UserRound className="size-8 text-neutral-11" />
            <p className="typography-body-sm text-subtle">No students found</p>
          </div>
        ) : (
          <ul role="list">
            {filteredStudents.map((student, index) => {
              const status = attendance[student.id]
              return (
                <li
                  key={student.id}
                  className={cn(
                    'flex items-center gap-md px-md py-sm',
                    index < filteredStudents.length - 1 &&
                      'border-b border-default',
                  )}
                >
                  <Avatar>
                    <AvatarFallback className="text-default">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate typography-body-md-strong text-default">
                      {student.name}
                    </p>
                    <p className="typography-label-sm text-subtle">
                      Class {student.class}
                    </p>
                  </div>

                  <ToggleGroup
                    type="single"
                    value={status ?? ''}
                    onValueChange={(val) => handleStatusChange(student.id, val)}
                    aria-label={`Attendance status for ${student.name}`}
                  >
                    <ToggleGroupItem
                      value="present"
                      aria-label="Present"
                      className={cn(
                        'flex items-center gap-xs border px-sm typography-label-sm transition-colors',
                        status === 'present'
                          ? 'border-success-7 bg-success-3 text-success-11'
                          : 'border-transparent text-subtle hover:text-default',
                      )}
                    >
                      <CircleCheck className="size-4 shrink-0" />
                      <span>Present</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="late"
                      aria-label="Late"
                      className={cn(
                        'flex items-center gap-xs border px-sm typography-label-sm transition-colors',
                        status === 'late'
                          ? 'border-amber-7 bg-amber-3 text-amber-11'
                          : 'border-transparent text-subtle hover:text-default',
                      )}
                    >
                      <Clock className="size-4 shrink-0" />
                      <span>Late</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="absent"
                      aria-label="Absent"
                      className={cn(
                        'flex items-center gap-xs border px-sm typography-label-sm transition-colors',
                        status === 'absent'
                          ? 'border-critical-7 bg-critical-3 text-critical-11'
                          : 'border-transparent text-subtle hover:text-default',
                      )}
                    >
                      <CircleX className="size-4 shrink-0" />
                      <span>Absent</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
