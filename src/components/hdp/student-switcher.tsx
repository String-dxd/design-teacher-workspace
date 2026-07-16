import { useNavigate } from '@tanstack/react-router'
import { getStudentById, mockStudents } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface StudentSwitcherProps {
  currentStudentId: string
}

// Quick student switch for /reports/drafts/$studentId — a compact labelled
// select in the workspace header (the old left rail is gone; the Drafting
// tab's worklist table is the primary way in, maintainer feedback
// 2026-07-17). Switching never loses autosaved work: draft-studio.tsx
// reloads its per-student state from the store whenever `studentId` changes.
export function StudentSwitcher({ currentStudentId }: StudentSwitcherProps) {
  const navigate = useNavigate()

  // Switch within the current student's class — the workspace covers
  // teaching classes (subject comments) as well as the form class.
  const currentClass =
    getStudentById(currentStudentId)?.class ?? CURRENT_TEACHER.formClassId
  const students = mockStudents.filter((s) => s.class === currentClass)

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="draft-student-switch" className="sr-only">
        Student
      </Label>
      <Select
        value={currentStudentId}
        onValueChange={(value) => {
          if (!value) return
          void navigate({
            to: '/reports/drafts/$studentId',
            params: { studentId: value },
          })
        }}
      >
        <SelectTrigger
          id="draft-student-switch"
          aria-label="Student"
          className="w-56"
        >
          <SelectValue>
            {getStudentById(currentStudentId)?.name ?? 'Student'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {students.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
