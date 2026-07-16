import { mockStudents } from './mock-students'

// Which teachers are timetabled to which students (mock). Used by broadcast
// recipient resolution (plan 031) and Tag Queue search scoping (plan 029).
export interface TimetableEntry {
  teacherId: string
  classId: string
  subject: string
}

// The 4 seeded teachers × their classes (see src/data/hdp.ts CURRENT_TEACHER
// and HDP_COLLEAGUES). CURRENT_TEACHER (lee-sy) is form teacher of 3A but
// teaches 3B and 4A; the 3 colleagues teach 3A plus one other class each.
export const TIMETABLE: Array<TimetableEntry> = [
  { teacherId: 'lee-sy', classId: '3B', subject: 'English' },
  { teacherId: 'lee-sy', classId: '4A', subject: 'English' },
  { teacherId: 'goh-wt', classId: '3A', subject: 'Mathematics' },
  { teacherId: 'kumar-a', classId: '3A', subject: 'Science' },
  { teacherId: 'kumar-a', classId: '3B', subject: 'Science' },
  { teacherId: 'raj-v', classId: '3A', subject: 'Humanities' },
  { teacherId: 'raj-v', classId: '4A', subject: 'Humanities' },
]

function classIdsForStudents(studentIds: Array<string>): Set<string> {
  const classes = new Set<string>()
  for (const studentId of studentIds) {
    const student = mockStudents.find((s) => s.id === studentId)
    if (student) classes.add(student.class)
  }
  return classes
}

export function teachersForStudents(studentIds: Array<string>): Array<string> {
  const classes = classIdsForStudents(studentIds)
  const teacherIds = new Set<string>()
  for (const entry of TIMETABLE) {
    if (classes.has(entry.classId)) teacherIds.add(entry.teacherId)
  }
  return Array.from(teacherIds)
}

export function classesForTeacher(teacherId: string): Array<string> {
  return TIMETABLE.filter((entry) => entry.teacherId === teacherId).map(
    (entry) => entry.classId,
  )
}
