import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CalendarCheck2,
  CircleCheck,
  CircleX,
  Clock,
  Search,
  UserRound,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
    <div className="flex flex-col gap-6 pt-6">
      {/* Page header */}
      <div className="flex items-start justify-between px-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <CalendarCheck2 className="size-5 text-muted-foreground" />
            <h1 className="text-base font-medium text-foreground">
              Morning Attendance
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
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
      <div className="flex flex-wrap items-center gap-3 px-6">
        <div className="flex items-center gap-2 rounded-md border border-lime-7 bg-lime-3 px-3 py-2">
          <CircleCheck className="size-4 shrink-0 text-lime-11" />
          <span className="text-xs font-medium text-lime-11">
            {summary.present} Present
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-crimson-7 bg-crimson-3 px-3 py-2">
          <CircleX className="size-4 shrink-0 text-crimson-11" />
          <span className="text-xs font-medium text-crimson-11">
            {summary.absent} Absent
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-amber-7 bg-amber-3 px-3 py-2">
          <Clock className="size-4 shrink-0 text-amber-11" />
          <span className="text-xs font-medium text-amber-11">
            {summary.late} Late
          </span>
        </div>
        {summary.unmarked > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {summary.unmarked} Not marked
            </span>
          </div>
        )}
      </div>

      {/* Toolbar: class selector + search */}
      <div className="flex items-center gap-3 px-6">
        <ClassSelector value={selectedClass} onValueChange={setSelectedClass} />
        <div className="relative ml-auto w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
      <div className="mx-6 mb-6 overflow-hidden rounded-lg border border-border bg-card">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <UserRound className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No students found</p>
          </div>
        ) : (
          <ul role="list">
            {filteredStudents.map((student, index) => {
              const status = attendance[student.id]
              return (
                <li
                  key={student.id}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3',
                    index < filteredStudents.length - 1 &&
                      'border-b border-border',
                  )}
                >
                  <Avatar>
                    <AvatarFallback className="text-foreground">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {student.name}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      Class {student.class}
                    </p>
                  </div>

                  <ToggleGroup
                    value={status ? [status] : []}
                    onValueChange={(vals) =>
                      handleStatusChange(student.id, vals[0] ?? '')
                    }
                    aria-label={`Attendance status for ${student.name}`}
                  >
                    <ToggleGroupItem
                      value="present"
                      aria-label="Present"
                      className={cn(
                        'flex items-center gap-2 border px-3 text-xs font-medium transition-colors',
                        status === 'present'
                          ? 'border-lime-7 bg-lime-3 text-lime-11'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <CircleCheck className="size-4 shrink-0" />
                      <span>Present</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="late"
                      aria-label="Late"
                      className={cn(
                        'flex items-center gap-2 border px-3 text-xs font-medium transition-colors',
                        status === 'late'
                          ? 'border-amber-7 bg-amber-3 text-amber-11'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Clock className="size-4 shrink-0" />
                      <span>Late</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="absent"
                      aria-label="Absent"
                      className={cn(
                        'flex items-center gap-2 border px-3 text-xs font-medium transition-colors',
                        status === 'absent'
                          ? 'border-crimson-7 bg-crimson-3 text-crimson-11'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
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
