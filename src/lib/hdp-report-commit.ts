import type { HolisticReport, Term } from '@/types/report'
import type { Student } from '@/types/student'
import type { CycleState } from '@/lib/hdp-cycle-store'
import {
  CURRENT_ACADEMIC_YEAR,
  generateReportFromStudent,
  upsertReport,
} from '@/data/mock-reports'
import { saveSharedReport } from '@/lib/hdp-template-store'

/**
 * The single commit path from a cycle draft to a real report: regenerate the
 * student's report, attach the cycle's layout + this student's comments, and
 * persist it both in-memory (mockReports, via upsertReport) and to localStorage
 * (saveSharedReport) so a parent link / reload resolves the built version.
 *
 * Called by both "Mark ready" (Write stage) and bulk "Share with parents" (Hub).
 */
export function commitCycleReport(
  student: Student,
  term: Term,
  cycle: CycleState,
): HolisticReport {
  const draft = Object.prototype.hasOwnProperty.call(
    cycle.perStudent,
    student.id,
  )
    ? cycle.perStudent[student.id]
    : undefined
  const base = generateReportFromStudent(student, term, CURRENT_ACADEMIC_YEAR)
  const comments = (draft && draft.comments) || base.teacherComments

  const built: HolisticReport = {
    ...base,
    layout: cycle.layout,
    teacherComments: comments,
  }

  upsertReport(built)
  saveSharedReport(built.id, {
    blocks: cycle.layout.blocks,
    comments: comments || '',
  })

  return built
}
