import type { CycleStudentStatus } from '@/lib/hdp-cycle-store'
import { mockStudents } from '@/data/mock-students'

// Reports-hub-only class data. The Students page owns `classGroups` in
// mock-students.ts (one class per primary level there), so the sibling P1
// classes the hub's level view needs are seeded here and nowhere else — the
// Students page never sees them. Sibling pupils are display-only: the teacher
// is P1-A's form teacher, so their rows carry seeded pipeline states and no
// cycle store.

export interface ReportPupil {
  id: string
  name: string
  class: string
}

/** Scope value meaning "every Primary 1 class" in the hub's scope selector. */
export const P1_LEVEL_SCOPE = 'level:P1'

/** P1-A pupils whose parents never acknowledge the sent report (demo). */
export const NEVER_ACK_STUDENT_IDS = new Set(['37'])

const P1B_ROSTER: Array<ReportPupil> = [
  { id: 'p1b-01', name: 'Aisyah Binte Rahman', class: 'P1-B' },
  { id: 'p1b-02', name: 'Bryan Lim Kai Xuan', class: 'P1-B' },
  { id: 'p1b-03', name: 'Charlotte Goh Li Ting', class: 'P1-B' },
  { id: 'p1b-04', name: 'Dhanush s/o Ravindran', class: 'P1-B' },
  { id: 'p1b-05', name: 'Emma Chua Jia Hui', class: 'P1-B' },
  { id: 'p1b-06', name: 'Farhan Bin Ismail', class: 'P1-B' },
  { id: 'p1b-07', name: 'Gwendolyn Yeo Su Ann', class: 'P1-B' },
  { id: 'p1b-08', name: 'Harith Bin Azman', class: 'P1-B' },
  { id: 'p1b-09', name: 'Isabelle Wong Zi Qi', class: 'P1-B' },
]

const P1C_ROSTER: Array<ReportPupil> = [
  { id: 'p1c-01', name: 'Jayden Teo Wei Le', class: 'P1-C' },
  { id: 'p1c-02', name: 'Kavya d/o Suresh', class: 'P1-C' },
  { id: 'p1c-03', name: 'Lucas Ang Jun Kai', class: 'P1-C' },
  { id: 'p1c-04', name: 'Mei Lin Koh', class: 'P1-C' },
  { id: 'p1c-05', name: 'Nadia Binte Yusof', class: 'P1-C' },
  { id: 'p1c-06', name: 'Owen Chia Zhi Hao', class: 'P1-C' },
  { id: 'p1c-07', name: 'Priya d/o Kumar', class: 'P1-C' },
  { id: 'p1c-08', name: 'Ryan Seah Ming En', class: 'P1-C' },
]

const SIBLING_ROSTERS = new Map<string, Array<ReportPupil>>([
  ['P1-B', P1B_ROSTER],
  ['P1-C', P1C_ROSTER],
])

export interface SiblingReportState {
  status: CycleStudentStatus
  /** Only meaningful when status is 'sent'. */
  acknowledged: boolean
}

// Deterministic spread so the level view looks like a class mid-cycle: most
// reports out the door or close to it, a few still moving.
const SIBLING_STATE_SPREAD: Array<SiblingReportState> = [
  { status: 'sent', acknowledged: true },
  { status: 'sent', acknowledged: false },
  { status: 'approved', acknowledged: false },
  { status: 'in_review', acknowledged: false },
  { status: 'sent', acknowledged: true },
  { status: 'draft', acknowledged: false },
  { status: 'pending_comments', acknowledged: false },
  { status: 'sent', acknowledged: true },
  { status: 'awaiting_results', acknowledged: false },
]

const SIBLING_STATES: Map<string, SiblingReportState> = new Map(
  [...P1B_ROSTER, ...P1C_ROSTER].map((pupil, i) => [
    pupil.id,
    SIBLING_STATE_SPREAD[i % SIBLING_STATE_SPREAD.length],
  ]),
)

/** Seeded pipeline state for a sibling-class pupil; undefined for real (P1-A) pupils. */
export function getSiblingState(
  studentId: string,
): SiblingReportState | undefined {
  return SIBLING_STATES.get(studentId)
}

function realRoster(classId: string): Array<ReportPupil> {
  return mockStudents
    .filter((s) => s.class === classId)
    .sort((a, b) => a.indexNumber - b.indexNumber)
    .map((s) => ({ id: s.id, name: s.name, class: s.class }))
}

/**
 * Pupils for a hub scope: a class id (real classes come from mock-students,
 * sibling P1 classes from the seeds above) or `P1_LEVEL_SCOPE` for all of P1.
 */
export function getReportRoster(scope: string): Array<ReportPupil> {
  if (scope === P1_LEVEL_SCOPE) {
    return [...realRoster('P1-A'), ...P1B_ROSTER, ...P1C_ROSTER]
  }
  return SIBLING_ROSTERS.get(scope) ?? realRoster(scope)
}

/** Level groups for the hub's scope selector (reports hub only). */
export const REPORT_LEVELS: Array<{
  level: string
  /** Present when the whole level is selectable (multiple classes seeded). */
  allValue?: string
  classes: Array<string>
}> = [
  { level: 'Primary 1', allValue: P1_LEVEL_SCOPE, classes: ['P1-B', 'P1-C'] },
  { level: 'Primary 2', classes: ['P2-B'] },
  { level: 'Primary 3', classes: ['P3-A'] },
  { level: 'Primary 4', classes: ['P4-B'] },
  { level: 'Primary 5', classes: ['P5-A'] },
  { level: 'Primary 6', classes: ['P6-B'] },
  { level: 'Secondary 1', classes: ['1A', '1B', '1C', '1D'] },
]
