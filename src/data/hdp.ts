import { mockStudents } from './mock-students'
import { MOCK_STAFF } from './mock-staff'
import type {
  AssessmentKind,
  BroadcastRequest,
  FormingPattern,
  HdpCycle,
  HdpDraft,
  HdpMarkEntry,
  HdpMarksRecord,
  HdpReportBook,
  HdpTag,
  SchoolYear,
  Semester,
  StudentReflection,
} from '@/types/hdp'

// Fresh, self-contained fixtures for the HDP Reports module. Zero imports
// from the legacy mock-reports.ts / report-layouts.ts (plan 028, grill
// decision #7). Students and staff are reused from the app-wide mock data
// (mock-students.ts / mock-staff.ts) since those aren't part of the reports
// teardown — only their id/name are borrowed here; the teaching/form-class
// assignments below are this module's own fixture, independent of
// mock-staff's own `formClass` field.

function staffById(id: string) {
  const staff = MOCK_STAFF.find((s) => s.id === id)
  if (!staff) throw new Error(`Unknown staff id: ${id}`)
  return staff
}

const leeSuYin = staffById('lee-sy')
const gohWeiTing = staffById('goh-wt')
const anithaKumar = staffById('kumar-a')
const vijayRaj = staffById('raj-v')

// The demo's dual-role teacher: form teacher of 3A but does not teach 3A
// academically (she teaches 3B and 4A instead) — the "form teacher who
// doesn't teach her own class" persona from the grill record. Her 3A tags
// use form-time/cca/other contexts; her lesson/marking tags land on 3B/4A.
export const CURRENT_TEACHER = {
  id: leeSuYin.id,
  name: leeSuYin.name,
  formClassId: '3A',
  teachingClasses: ['3B', '4A'],
}

// The three subject teachers who actually teach 3A — they author most of
// 3A's tags and are the broadcast's recipients.
export const HDP_COLLEAGUES = [
  { id: gohWeiTing.id, name: gohWeiTing.name, teachingClasses: ['3A'] },
  {
    id: anithaKumar.id,
    name: anithaKumar.name,
    teachingClasses: ['3A', '3B'],
  },
  { id: vijayRaj.id, name: vijayRaj.name, teachingClasses: ['3A', '4A'] },
]

// 3A has 14 students (not the PRD's 33) — reuses the largest class already
// in mock-students.ts rather than growing it (recorded tradeoff, plan 028).
// Exported so the store and later plans (e.g. 030's class list) don't have
// to re-derive the roster from mock-students themselves.
export const CLASS_3A_STUDENT_IDS = mockStudents
  .filter((s) => s.class === '3A')
  .map((s) => s.id)

// Window already open so the Draft Studio is demoable from first load;
// Release tools stay "coming later" per the plan.
export const CURRENT_CYCLE: HdpCycle = {
  schoolYear: '2026',
  semester: 2,
  terms: [3, 4],
  stage: 'window-open',
  windowOpensAt: '2026-07-13T00:00:00+08:00',
  releaseAt: '2026-11-13T00:00:00+08:00',
}

// ── SEED_TAGS ────────────────────────────────────────────────────────────
// ~70 tags across 3A's 14 students plus a handful in 3B/4A, authored by the
// 4 seeded teachers across mixed contexts and entry points. Notes describe
// behaviour in context — never trait language. Exactly 6 of 3A's 14
// students (ids 9, 10, 25, 26, 30, 34) are left with zero tags — the thin
// records a form teacher who doesn't teach her own class would need to
// broadcast about. Coverage for 3A = 8 of 14 reviewed (the 8 tagged
// students; none of the 6 thin ones pick up a nil response either — see
// SEED_BROADCAST below).
export const SEED_TAGS: Array<HdpTag> = [
  {
    id: 'tag-1',
    studentId: '1',
    authorId: 'lee-sy',
    disposition: 'curiosity',
    context: 'cca',
    note: 'Looked up extra tessellation examples after the lesson ended.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-22T16:00:00+08:00',
    editableUntil: '2026-06-23T16:00:00+08:00',
  },
  {
    id: 'tag-2',
    studentId: '1',
    authorId: 'lee-sy',
    disposition: 'curiosity',
    context: 'form-time',
    note: "Kept asking 'what if' during the case study discussion.",
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-18T11:45:00+08:00',
    editableUntil: '2026-06-19T11:45:00+08:00',
  },
  {
    id: 'tag-3',
    studentId: '1',
    authorId: 'goh-wt',
    disposition: 'self-direction',
    context: 'lesson',
    note: "Set up the next CCA session's equipment without being asked.",
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-05T11:30:00+08:00',
    editableUntil: '2026-07-06T11:30:00+08:00',
  },
  {
    id: 'tag-4',
    studentId: '1',
    authorId: 'lee-sy',
    disposition: 'collaboration',
    context: 'cca',
    note: 'Helped a groupmate catch up on the lab steps without taking over.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 2,
    lifecycle: 'archived',
    createdAt: '2026-04-15T16:00:00+08:00',
    editableUntil: '2026-04-16T16:00:00+08:00',
  },
  {
    id: 'tag-5',
    studentId: '1',
    authorId: 'raj-v',
    disposition: 'collaboration',
    context: 'marking',
    note: 'Noticed a teammate was stuck and re-explained the instructions patiently.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-23T09:00:00+08:00',
    editableUntil: '2026-06-24T09:00:00+08:00',
  },
  {
    id: 'tag-6',
    studentId: '1',
    authorId: 'goh-wt',
    disposition: 'self-direction',
    context: 'lesson',
    note: "Set up the next CCA session's equipment without being asked.",
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-12T10:30:00+08:00',
    editableUntil: '2026-07-13T10:30:00+08:00',
  },
  {
    id: 'tag-7',
    studentId: '1',
    authorId: 'raj-v',
    disposition: 'perseverance',
    context: 'other',
    note: 'Retried the circuit wiring after it short-circuited twice.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-18T11:15:00+08:00',
    editableUntil: '2026-06-19T11:15:00+08:00',
  },
  {
    id: 'tag-8',
    studentId: '2',
    authorId: 'raj-v',
    disposition: 'curiosity',
    context: 'other',
    note: 'Wanted to know what happens if you change one variable in the experiment.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-08T08:30:00+08:00',
    editableUntil: '2026-06-09T08:30:00+08:00',
  },
  {
    id: 'tag-9',
    studentId: '2',
    authorId: 'lee-sy',
    disposition: 'collaboration',
    context: 'other',
    note: 'Offered to walk the table through the working when others looked lost.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-13T15:15:00+08:00',
    editableUntil: '2026-07-14T15:15:00+08:00',
  },
  {
    id: 'tag-10',
    studentId: '2',
    authorId: 'lee-sy',
    disposition: 'collaboration',
    context: 'other',
    note: 'Noticed a teammate was stuck and re-explained the instructions patiently.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-13T13:15:00+08:00',
    editableUntil: '2026-07-14T13:15:00+08:00',
  },
  {
    id: 'tag-11',
    studentId: '2',
    authorId: 'lee-sy',
    disposition: 'perseverance',
    context: 'cca',
    note: 'Redid the geometry proof three times until the angles worked out.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-21T10:45:00+08:00',
    editableUntil: '2026-06-22T10:45:00+08:00',
  },
  {
    id: 'tag-12',
    studentId: '2',
    authorId: 'raj-v',
    disposition: 'collaboration',
    context: 'marking',
    note: 'Noticed a teammate was stuck and re-explained the instructions patiently.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-22T09:30:00+08:00',
    editableUntil: '2026-06-23T09:30:00+08:00',
  },
  {
    id: 'tag-13',
    studentId: '2',
    authorId: 'kumar-a',
    disposition: 'self-direction',
    context: 'marking',
    note: 'Started the essay draft before it was assigned, from the reading list.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-06T16:00:00+08:00',
    editableUntil: '2026-07-07T16:00:00+08:00',
  },
  {
    id: 'tag-14',
    studentId: '2',
    authorId: 'raj-v',
    disposition: 'curiosity',
    context: 'other',
    note: 'Looked up extra tessellation examples after the lesson ended.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-06T16:00:00+08:00',
    editableUntil: '2026-07-07T16:00:00+08:00',
  },
  {
    id: 'tag-15',
    studentId: '3',
    authorId: 'goh-wt',
    disposition: 'curiosity',
    context: 'marking',
    note: 'Asked why the formula worked, not just how to apply it.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-29T09:00:00+08:00',
    editableUntil: '2026-06-30T09:00:00+08:00',
  },
  {
    id: 'tag-16',
    studentId: '3',
    authorId: 'raj-v',
    disposition: 'self-direction',
    context: 'lesson',
    note: 'Followed up on a returned test with a self-made corrections page.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-09T16:45:00+08:00',
    editableUntil: '2026-06-10T16:45:00+08:00',
  },
  {
    id: 'tag-17',
    studentId: '3',
    authorId: 'raj-v',
    disposition: 'collaboration',
    context: 'other',
    note: 'Stepped back from leading so a quieter groupmate could present.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-15T16:45:00+08:00',
    editableUntil: '2026-07-16T16:45:00+08:00',
  },
  {
    id: 'tag-18',
    studentId: '3',
    authorId: 'lee-sy',
    disposition: 'curiosity',
    context: 'form-time',
    note: "Kept asking 'what if' during the case study discussion.",
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 1,
    lifecycle: 'archived',
    createdAt: '2026-02-01T09:00:00+08:00',
    editableUntil: '2026-02-02T09:00:00+08:00',
  },
  {
    id: 'tag-19',
    studentId: '3',
    authorId: 'kumar-a',
    disposition: 'curiosity',
    context: 'lesson',
    note: 'Wanted to know what happens if you change one variable in the experiment.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-07T16:15:00+08:00',
    editableUntil: '2026-07-08T16:15:00+08:00',
  },
  {
    id: 'tag-20',
    studentId: '3',
    authorId: 'raj-v',
    disposition: 'self-direction',
    context: 'marking',
    note: 'Picked a harder practice set instead of the assigned one.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-04T09:45:00+08:00',
    editableUntil: '2026-06-05T09:45:00+08:00',
  },
  {
    id: 'tag-21',
    studentId: '3',
    authorId: 'raj-v',
    disposition: 'perseverance',
    context: 'lesson',
    note: 'Redid the geometry proof three times until the angles worked out.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-11T09:15:00+08:00',
    editableUntil: '2026-07-12T09:15:00+08:00',
  },
  {
    id: 'tag-22',
    studentId: '3',
    authorId: 'goh-wt',
    disposition: 'collaboration',
    context: 'marking',
    note: 'Stepped back from leading so a quieter groupmate could present.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-28T09:45:00+08:00',
    editableUntil: '2026-06-29T09:45:00+08:00',
  },
  {
    id: 'tag-23',
    studentId: '4',
    authorId: 'goh-wt',
    disposition: 'perseverance',
    context: 'lesson',
    note: 'Redid the geometry proof three times until the angles worked out.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-06T14:45:00+08:00',
    editableUntil: '2026-06-07T14:45:00+08:00',
  },
  {
    id: 'tag-24',
    studentId: '4',
    authorId: 'goh-wt',
    disposition: 'perseverance',
    context: 'lesson',
    note: 'Went back over the missed algebra questions alone at the end of class.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-15T12:45:00+08:00',
    editableUntil: '2026-07-16T12:45:00+08:00',
  },
  {
    id: 'tag-25',
    studentId: '4',
    authorId: 'raj-v',
    disposition: 'self-direction',
    context: 'other',
    note: 'Reorganised revision notes after the last test result, unprompted.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-10T11:00:00+08:00',
    editableUntil: '2026-06-11T11:00:00+08:00',
  },
  {
    id: 'tag-26',
    studentId: '4',
    authorId: 'raj-v',
    disposition: 'perseverance',
    context: 'marking',
    note: 'Retried the circuit wiring after it short-circuited twice.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-06T08:00:00+08:00',
    editableUntil: '2026-07-07T08:00:00+08:00',
  },
  {
    id: 'tag-27',
    studentId: '4',
    authorId: 'lee-sy',
    disposition: 'curiosity',
    context: 'form-time',
    note: 'Brought in a follow-up question from a documentary about the topic.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-29T11:00:00+08:00',
    editableUntil: '2026-06-30T11:00:00+08:00',
  },
  {
    id: 'tag-28',
    studentId: '4',
    authorId: 'raj-v',
    disposition: 'collaboration',
    context: 'other',
    note: 'Split the research reading fairly and checked in with the quieter member.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-22T13:15:00+08:00',
    editableUntil: '2026-06-23T13:15:00+08:00',
  },
  {
    id: 'tag-29',
    studentId: '4',
    authorId: 'lee-sy',
    disposition: 'self-direction',
    context: 'other',
    note: "Set up the next CCA session's equipment without being asked.",
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-01T15:00:00+08:00',
    editableUntil: '2026-06-02T15:00:00+08:00',
  },
  {
    id: 'tag-30',
    studentId: '4',
    authorId: 'goh-wt',
    disposition: 'curiosity',
    context: 'marking',
    note: 'Wanted to know what happens if you change one variable in the experiment.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 1,
    lifecycle: 'archived',
    createdAt: '2026-03-06T15:30:00+08:00',
    editableUntil: '2026-03-07T15:30:00+08:00',
  },
  {
    id: 'tag-31',
    studentId: '5',
    authorId: 'raj-v',
    disposition: 'collaboration',
    context: 'other',
    note: 'Helped a groupmate catch up on the lab steps without taking over.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-09T09:00:00+08:00',
    editableUntil: '2026-06-10T09:00:00+08:00',
  },
  {
    id: 'tag-32',
    studentId: '5',
    authorId: 'lee-sy',
    disposition: 'curiosity',
    context: 'cca',
    note: 'Wanted to know what happens if you change one variable in the experiment.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-22T12:45:00+08:00',
    editableUntil: '2026-06-23T12:45:00+08:00',
  },
  {
    id: 'tag-33',
    studentId: '5',
    authorId: 'goh-wt',
    disposition: 'self-direction',
    context: 'lesson',
    note: "Set up the next CCA session's equipment without being asked.",
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-01T13:15:00+08:00',
    editableUntil: '2026-06-02T13:15:00+08:00',
  },
  {
    id: 'tag-34',
    studentId: '5',
    authorId: 'raj-v',
    disposition: 'self-direction',
    context: 'marking',
    note: 'Followed up on a returned test with a self-made corrections page.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-04T09:15:00+08:00',
    editableUntil: '2026-06-05T09:15:00+08:00',
  },
  {
    id: 'tag-35',
    studentId: '5',
    authorId: 'raj-v',
    disposition: 'self-direction',
    context: 'other',
    note: 'Reorganised revision notes after the last test result, unprompted.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-10T13:00:00+08:00',
    editableUntil: '2026-06-11T13:00:00+08:00',
  },
  {
    id: 'tag-36',
    studentId: '5',
    authorId: 'lee-sy',
    disposition: 'perseverance',
    context: 'form-time',
    note: 'Kept at the essay outline through two rejected drafts before the third landed.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-05T11:15:00+08:00',
    editableUntil: '2026-07-06T11:15:00+08:00',
  },
  {
    id: 'tag-37',
    studentId: '5',
    authorId: 'kumar-a',
    disposition: 'collaboration',
    context: 'lesson',
    note: 'Stepped back from leading so a quieter groupmate could present.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-09T10:00:00+08:00',
    editableUntil: '2026-06-10T10:00:00+08:00',
  },
  {
    id: 'tag-38',
    studentId: '6',
    authorId: 'lee-sy',
    disposition: 'curiosity',
    context: 'cca',
    note: 'Brought in a follow-up question from a documentary about the topic.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-10T11:15:00+08:00',
    editableUntil: '2026-07-11T11:15:00+08:00',
  },
  {
    id: 'tag-39',
    studentId: '6',
    authorId: 'kumar-a',
    disposition: 'collaboration',
    context: 'lesson',
    note: 'Noticed a teammate was stuck and re-explained the instructions patiently.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 1,
    lifecycle: 'archived',
    createdAt: '2026-03-22T16:30:00+08:00',
    editableUntil: '2026-03-23T16:30:00+08:00',
  },
  {
    id: 'tag-40',
    studentId: '6',
    authorId: 'lee-sy',
    disposition: 'collaboration',
    context: 'cca',
    note: 'Helped a groupmate catch up on the lab steps without taking over.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-20T14:30:00+08:00',
    editableUntil: '2026-06-21T14:30:00+08:00',
  },
  {
    id: 'tag-41',
    studentId: '6',
    authorId: 'raj-v',
    disposition: 'self-direction',
    context: 'other',
    note: 'Followed up on a returned test with a self-made corrections page.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-09T08:45:00+08:00',
    editableUntil: '2026-06-10T08:45:00+08:00',
  },
  {
    id: 'tag-42',
    studentId: '6',
    authorId: 'goh-wt',
    disposition: 'collaboration',
    context: 'other',
    note: 'Helped a groupmate catch up on the lab steps without taking over.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 1,
    lifecycle: 'archived',
    createdAt: '2026-04-10T16:30:00+08:00',
    editableUntil: '2026-04-11T16:30:00+08:00',
  },
  {
    id: 'tag-43',
    studentId: '6',
    authorId: 'raj-v',
    disposition: 'curiosity',
    context: 'marking',
    note: 'Looked up extra tessellation examples after the lesson ended.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-13T10:30:00+08:00',
    editableUntil: '2026-07-14T10:30:00+08:00',
  },
  {
    id: 'tag-44',
    studentId: '6',
    authorId: 'kumar-a',
    disposition: 'self-direction',
    context: 'marking',
    note: 'Followed up on a returned test with a self-made corrections page.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-15T15:45:00+08:00',
    editableUntil: '2026-07-16T15:45:00+08:00',
  },
  {
    id: 'tag-45',
    studentId: '7',
    authorId: 'raj-v',
    disposition: 'perseverance',
    context: 'lesson',
    note: 'Kept at the essay outline through two rejected drafts before the third landed.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-03T11:30:00+08:00',
    editableUntil: '2026-07-04T11:30:00+08:00',
  },
  {
    id: 'tag-46',
    studentId: '7',
    authorId: 'lee-sy',
    disposition: 'curiosity',
    context: 'form-time',
    note: 'Brought in a follow-up question from a documentary about the topic.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-15T14:15:00+08:00',
    editableUntil: '2026-06-16T14:15:00+08:00',
  },
  {
    id: 'tag-47',
    studentId: '7',
    authorId: 'kumar-a',
    disposition: 'perseverance',
    context: 'lesson',
    note: 'Redid the geometry proof three times until the angles worked out.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-08T10:45:00+08:00',
    editableUntil: '2026-07-09T10:45:00+08:00',
  },
  {
    id: 'tag-48',
    studentId: '7',
    authorId: 'goh-wt',
    disposition: 'self-direction',
    context: 'marking',
    note: 'Followed up on a returned test with a self-made corrections page.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 1,
    lifecycle: 'archived',
    createdAt: '2026-04-20T13:45:00+08:00',
    editableUntil: '2026-04-21T13:45:00+08:00',
  },
  {
    id: 'tag-49',
    studentId: '7',
    authorId: 'raj-v',
    disposition: 'self-direction',
    context: 'marking',
    note: 'Reorganised revision notes after the last test result, unprompted.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-15T12:15:00+08:00',
    editableUntil: '2026-07-16T12:15:00+08:00',
  },
  {
    id: 'tag-50',
    studentId: '7',
    authorId: 'raj-v',
    disposition: 'curiosity',
    context: 'marking',
    note: 'Wanted to know what happens if you change one variable in the experiment.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-03T12:15:00+08:00',
    editableUntil: '2026-07-04T12:15:00+08:00',
  },
  {
    id: 'tag-51',
    studentId: '7',
    authorId: 'raj-v',
    disposition: 'curiosity',
    context: 'lesson',
    note: 'Looked up extra tessellation examples after the lesson ended.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-05T11:00:00+08:00',
    editableUntil: '2026-07-06T11:00:00+08:00',
  },
  {
    id: 'tag-52',
    studentId: '8',
    authorId: 'kumar-a',
    disposition: 'curiosity',
    context: 'marking',
    note: 'Brought in a follow-up question from a documentary about the topic.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-01T14:45:00+08:00',
    editableUntil: '2026-07-02T14:45:00+08:00',
  },
  {
    id: 'tag-53',
    studentId: '8',
    authorId: 'kumar-a',
    disposition: 'curiosity',
    context: 'marking',
    note: 'Brought in a follow-up question from a documentary about the topic.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 2,
    lifecycle: 'archived',
    createdAt: '2026-02-09T14:45:00+08:00',
    editableUntil: '2026-02-10T14:45:00+08:00',
  },
  {
    id: 'tag-54',
    studentId: '8',
    authorId: 'kumar-a',
    disposition: 'self-direction',
    context: 'other',
    note: 'Reorganised revision notes after the last test result, unprompted.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 2,
    lifecycle: 'archived',
    createdAt: '2026-04-18T08:45:00+08:00',
    editableUntil: '2026-04-19T08:45:00+08:00',
  },
  {
    id: 'tag-55',
    studentId: '8',
    authorId: 'goh-wt',
    disposition: 'curiosity',
    context: 'other',
    note: 'Brought in a follow-up question from a documentary about the topic.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-02T12:45:00+08:00',
    editableUntil: '2026-06-03T12:45:00+08:00',
  },
  {
    id: 'tag-56',
    studentId: '8',
    authorId: 'kumar-a',
    disposition: 'self-direction',
    context: 'marking',
    note: "Set up the next CCA session's equipment without being asked.",
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-16T08:00:00+08:00',
    editableUntil: '2026-06-17T08:00:00+08:00',
  },
  {
    id: 'tag-57',
    studentId: '8',
    authorId: 'raj-v',
    disposition: 'perseverance',
    context: 'lesson',
    note: 'Redid the geometry proof three times until the angles worked out.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-07T08:15:00+08:00',
    editableUntil: '2026-06-08T08:15:00+08:00',
  },
  {
    id: 'tag-58',
    studentId: '8',
    authorId: 'goh-wt',
    disposition: 'self-direction',
    context: 'other',
    note: "Set up the next CCA session's equipment without being asked.",
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-06T09:15:00+08:00',
    editableUntil: '2026-07-07T09:15:00+08:00',
  },
  // ── a handful of tags outside 3A (3B, 4A — CURRENT_TEACHER's teaching
  // classes and HDP_COLLEAGUES' other classes) ──
  {
    id: 'tag-59',
    studentId: '11',
    authorId: 'goh-wt',
    disposition: 'self-direction',
    context: 'marking',
    note: 'Picked a harder practice set instead of the assigned one.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-03T11:00:00+08:00',
    editableUntil: '2026-06-04T11:00:00+08:00',
  },
  {
    id: 'tag-60',
    studentId: '11',
    authorId: 'lee-sy',
    disposition: 'perseverance',
    context: 'other',
    note: 'Retried the circuit wiring after it short-circuited twice.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-12T16:45:00+08:00',
    editableUntil: '2026-06-13T16:45:00+08:00',
  },
  {
    id: 'tag-61',
    studentId: '11',
    authorId: 'raj-v',
    disposition: 'self-direction',
    context: 'marking',
    note: 'Picked a harder practice set instead of the assigned one.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'fab',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-14T13:45:00+08:00',
    editableUntil: '2026-06-15T13:45:00+08:00',
  },
  {
    id: 'tag-62',
    studentId: '12',
    authorId: 'lee-sy',
    disposition: 'collaboration',
    context: 'other',
    note: 'Noticed a teammate was stuck and re-explained the instructions patiently.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-15T14:30:00+08:00',
    editableUntil: '2026-07-16T14:30:00+08:00',
  },
  {
    id: 'tag-63',
    studentId: '12',
    authorId: 'goh-wt',
    disposition: 'curiosity',
    context: 'marking',
    note: 'Brought in a follow-up question from a documentary about the topic.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-11T08:45:00+08:00',
    editableUntil: '2026-07-12T08:45:00+08:00',
  },
  {
    id: 'tag-64',
    studentId: '12',
    authorId: 'goh-wt',
    disposition: 'collaboration',
    context: 'marking',
    note: 'Split the research reading fairly and checked in with the quieter member.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-01T16:15:00+08:00',
    editableUntil: '2026-07-02T16:15:00+08:00',
  },
  {
    id: 'tag-65',
    studentId: '53',
    authorId: 'lee-sy',
    disposition: 'self-direction',
    context: 'lesson',
    note: 'Picked a harder practice set instead of the assigned one.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 2,
    lifecycle: 'archived',
    createdAt: '2026-03-26T08:00:00+08:00',
    editableUntil: '2026-03-27T08:00:00+08:00',
  },
  {
    id: 'tag-66',
    studentId: '53',
    authorId: 'lee-sy',
    disposition: 'collaboration',
    context: 'lesson',
    note: 'Stepped back from leading so a quieter groupmate could present.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-14T16:30:00+08:00',
    editableUntil: '2026-07-15T16:30:00+08:00',
  },
  {
    id: 'tag-67',
    studentId: '57',
    authorId: 'lee-sy',
    disposition: 'curiosity',
    context: 'marking',
    note: 'Asked why the formula worked, not just how to apply it.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-11T09:15:00+08:00',
    editableUntil: '2026-06-12T09:15:00+08:00',
  },
  {
    id: 'tag-68',
    studentId: '57',
    authorId: 'lee-sy',
    disposition: 'collaboration',
    context: 'marking',
    note: 'Helped a groupmate catch up on the lab steps without taking over.',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-10T11:30:00+08:00',
    editableUntil: '2026-06-11T11:30:00+08:00',
  },
  // Broadcast-sourced: Mr Vijay Raj's response to SEED_BROADCAST below.
  {
    id: 'tag-69',
    studentId: '3',
    authorId: 'raj-v',
    disposition: 'curiosity',
    context: 'other',
    note: 'Wanted to know what happens if you change one variable in the experiment.',
    evidenceIds: [],
    source: 'broadcast',
    entryPoint: 'topbar',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-06-23T16:15:00+08:00',
    editableUntil: '2026-06-24T16:15:00+08:00',
  },
]

// ── SEED_PATTERNS ────────────────────────────────────────────────────────
// 2 candidates: same disposition, ≥2 distinct contexts, real tagIds.
export const SEED_PATTERNS: Array<FormingPattern> = [
  {
    id: 'pattern-1',
    studentId: '1',
    disposition: 'curiosity',
    contexts: ['cca', 'form-time'],
    tagIds: ['tag-1', 'tag-2'],
    status: 'candidate',
    schoolYear: '2026',
  },
  {
    id: 'pattern-2',
    studentId: '5',
    disposition: 'self-direction',
    contexts: ['lesson', 'marking'],
    tagIds: ['tag-33', 'tag-34'],
    status: 'candidate',
    schoolYear: '2026',
  },
  // pattern-3: student B (Vincent, '2') — the story register's confirmed
  // pattern chapter (plan 037). Reuses the same collaboration tags already
  // cited by his overall draft claim ("Has become the groupmate others go
  // to first when they get stuck") so the chapter's evidence matches the
  // book's own comment thread. tag-9/tag-10 (lee-sy, context 'other') +
  // tag-12 (raj-v, context 'marking') — 2 distinct contexts, confirmed by
  // both teachers who logged them.
  {
    id: 'pattern-3',
    studentId: '2',
    disposition: 'collaboration',
    contexts: ['other', 'marking'],
    tagIds: ['tag-9', 'tag-10', 'tag-12'],
    status: 'confirmed',
    confirmedBy: 'lee-sy',
    schoolYear: '2026',
    headline: 'Steps in when a groupmate gets stuck',
    studentNote:
      "I like being the one people ask when they're confused — it means I actually get it.",
  },
]

// ── SEED_BROADCAST ───────────────────────────────────────────────────────
// One prior broadcast from CURRENT_TEACHER to the 3 colleagues who teach
// 3A, asking about a mix of students. Two colleagues report "nothing stood
// out" (students already have tags from elsewhere, so this doesn't affect
// coverage); one colleague tags a moment (tag-69, source: 'broadcast'). The
// two thin-record students on the list (9, 10) haven't been answered yet —
// silence, not a nil — so they stay uncovered, keeping 3A's coverage at
// exactly 8 of 14 reviewed.
export const SEED_BROADCAST: BroadcastRequest = {
  id: 'broadcast-1',
  formClassId: '3A',
  requesterId: 'lee-sy',
  studentIds: ['3', '5', '9', '10'],
  recipientIds: ['goh-wt', 'kumar-a', 'raj-v'],
  message:
    "Anything stand out for these before the window closes? A quick tag or 'nothing stood out' both help.",
  createdAt: '2026-07-10T09:00:00+08:00',
  responses: [
    {
      recipientId: 'goh-wt',
      studentId: '3',
      result: { kind: 'nothing-stood-out' },
      respondedAt: '2026-07-10T14:00:00+08:00',
    },
    {
      recipientId: 'kumar-a',
      studentId: '5',
      result: { kind: 'nothing-stood-out' },
      respondedAt: '2026-07-11T10:00:00+08:00',
    },
    {
      recipientId: 'raj-v',
      studentId: '3',
      result: { kind: 'tag', tagId: 'tag-69' },
      respondedAt: '2026-07-11T16:00:00+08:00',
    },
  ],
}

// ── SEED_BROADCAST_FOR_TEACHER ───────────────────────────────────────────
// A second, independent broadcast where CURRENT_TEACHER is a RECIPIENT
// rather than the requester (plan 031, Step 3) — makes the responder
// ("Requests for you") section of /reports/broadcast demoable honestly
// without reshaping SEED_BROADCAST's 3A fixture. Mdm Goh Wei Ting asks
// about two 4A students CURRENT_TEACHER (lee-sy) teaches academically
// (English); Mr Vijay Raj (Humanities, also timetabled to 4A) has already
// answered for one of them. CURRENT_TEACHER's two pairs are still
// unanswered — that's the outstanding work the responder section surfaces.
export const SEED_BROADCAST_FOR_TEACHER: BroadcastRequest = {
  id: 'broadcast-2',
  formClassId: '4A',
  requesterId: 'goh-wt',
  studentIds: ['53', '61'],
  recipientIds: ['lee-sy', 'raj-v'],
  message:
    "Anything stand out for these before the window closes? A quick tag or 'nothing stood out' both help.",
  createdAt: '2026-07-15T09:00:00+08:00',
  responses: [
    {
      recipientId: 'raj-v',
      studentId: '53',
      result: { kind: 'nothing-stood-out' },
      respondedAt: '2026-07-15T15:00:00+08:00',
    },
  ],
}

// ── Staged funnel (UX grill decision, 2026-07-16) ───────────────────────
// Student A ('1', Chen Jun Kai): confirmed, unsynced overall draft — Review
// & Sync renders populated from first load. Book comments stay empty.
// Student B ('2', Vincent Koh Xin Yi): a second confirmed+synced draft,
// snapshotted into the book — shared and acknowledged, demoing the
// completed parent state cold.
// Student C ('3', Lam Wei Jie): book present, no draft, empty comments —
// the fresh student the live demo carries through the whole funnel.
export const SEED_DRAFTS: Array<HdpDraft> = [
  {
    id: 'draft-1',
    studentId: '1',
    kind: 'overall',
    authorId: 'lee-sy',
    status: 'confirmed',
    claims: [
      {
        text: 'Set up the next session on his own initiative more than once, without being asked.',
        source: { tagId: 'tag-3', label: 'Self-direction — lesson, 5 Jul' },
      },
      {
        text: 'Kept working at the circuit wiring after it failed twice, rather than asking for the fix outright.',
        source: { tagId: 'tag-7', label: 'Perseverance — other, 18 Jun' },
      },
      {
        text: 'Has grown more comfortable asking "why" instead of just noting down the answer.',
      },
    ],
  },
  {
    id: 'draft-2',
    studentId: '2',
    kind: 'overall',
    authorId: 'lee-sy',
    status: 'confirmed',
    syncedAt: '2026-07-14T09:00:00+08:00',
    claims: [
      {
        text: 'Kept redoing the geometry proof at CCA training until his technique held up.',
        source: { tagId: 'tag-11', label: 'Perseverance — cca, 21 Jun' },
      },
      {
        text: 'Started the essay draft early, working ahead from the reading list.',
        source: {
          tagId: 'tag-13',
          label: 'Self-direction — marking, 6 Jul',
        },
      },
      {
        text: 'Has become the groupmate others go to first when they get stuck.',
      },
    ],
  },
]

export const SEED_REPORT_BOOKS: Array<HdpReportBook> = [
  {
    // Student A — comments stay empty (not yet shared); Review & Sync has
    // the confirmed draft above waiting.
    studentId: '1',
    schoolYear: '2026',
    semester: 2,
    results: [
      { subject: 'English', term: 3, grade: 'B3' },
      { subject: 'Mathematics', term: 3, grade: 'A2' },
      { subject: 'Science', term: 3, grade: 'B4' },
      { subject: 'Mother Tongue', term: 3, grade: 'B3' },
      { subject: 'Humanities', term: 3, grade: 'A2' },
    ],
    attendance: { present: 58, total: 60 },
    conduct: 'Good',
    subjectComments: [],
    parentPrompts: [
      'Ask me about the geometry proof I finally solved.',
      'Ask me what I want to try differently next term.',
    ],
  },
  {
    // Student B — pre-shared and acknowledged; comments snapshotted from
    // the synced draft above.
    studentId: '2',
    schoolYear: '2026',
    semester: 2,
    results: [
      { subject: 'English', term: 3, grade: 'A2' },
      { subject: 'Mathematics', term: 3, grade: 'B4' },
      { subject: 'Science', term: 3, grade: 'B3' },
      { subject: 'Mother Tongue', term: 3, grade: 'A2' },
      { subject: 'Humanities', term: 3, grade: 'B3' },
    ],
    attendance: { present: 59, total: 60 },
    conduct: 'Very good',
    overallComment: {
      authorId: 'lee-sy',
      claims: [
        {
          text: 'Kept redoing the geometry proof at CCA training until his technique held up.',
          source: {
            tagId: 'tag-11',
            label: 'Perseverance — cca, 21 Jun',
          },
        },
        {
          text: 'Started the essay draft early, working ahead from the reading list.',
          source: {
            tagId: 'tag-13',
            label: 'Self-direction — marking, 6 Jul',
          },
        },
        {
          text: 'Has become the groupmate others go to first when they get stuck.',
        },
      ],
    },
    subjectComments: [],
    parentPrompts: [
      'Ask me about a group project where I helped a friend catch up.',
      'Ask me what technique finally worked at CCA training.',
    ],
    sharedAt: '2026-07-14T10:00:00+08:00',
    acknowledgement: {
      at: '2026-07-15T19:32:00+08:00',
      note: 'Thank you — we noticed him helping his younger cousin study too.',
    },
  },
  {
    // Student C — fresh; no draft yet, comments empty. The live demo walks
    // this student through the whole funnel.
    studentId: '3',
    schoolYear: '2026',
    semester: 2,
    results: [
      { subject: 'English', term: 3, grade: 'B4' },
      { subject: 'Mathematics', term: 3, grade: 'B3' },
      { subject: 'Science', term: 3, grade: 'A2' },
      { subject: 'Mother Tongue', term: 3, grade: 'B4' },
      { subject: 'Humanities', term: 3, grade: 'B3' },
    ],
    attendance: { present: 56, total: 60 },
    conduct: 'Good',
    subjectComments: [],
    parentPrompts: [
      'Ask me why I think the formula works, not just how to use it.',
      'Ask me about the group project where I let someone else present.',
    ],
  },
]

// ── SEED_MARKS (plan 036) ────────────────────────────────────────────────
// Four semesters of marks history per 3A student (2025 S1 → 2026 S2, the
// current semester) across 5 subjects — realistic 45–90 scores, deterministic
// (no Date.now/Math.random) so the fixture is stable across reloads. Each
// (student, subject) pair is mapped to one of the four trend shapes below via
// a plain string hash, so across 14 students × 5 subjects every trend
// direction (climbing/steady/recovering/easing) shows up at least once.
const MARK_SUBJECTS = [
  'English',
  'Mathematics',
  'Science',
  'Mother Tongue',
  'Humanities',
]

const MARK_SEMESTERS: Array<{ schoolYear: SchoolYear; semester: Semester }> = [
  { schoolYear: '2025', semester: 1 },
  { schoolYear: '2025', semester: 2 },
  { schoolYear: '2026', semester: 1 },
  { schoolYear: '2026', semester: 2 }, // current — partially filled (WA1 only)
]

type MarkTrendShape = 'climbing' | 'steady' | 'recovering' | 'easing'
const MARK_TREND_SHAPES: Array<MarkTrendShape> = [
  'climbing',
  'steady',
  'recovering',
  'easing',
]

// Per-semester deltas off a base score, one per shape. `recovering`'s last
// delta is kept inside ±2 on purpose — it dips then recovers to roughly
// where it started, distinct from a `climbing` shape whose last delta is
// what pushes it past the +2 threshold.
function marksDeltasForShape(
  shape: MarkTrendShape,
): [number, number, number, number] {
  switch (shape) {
    case 'climbing':
      return [0, 3, 6, 9]
    case 'easing':
      return [9, 6, 3, 0]
    case 'recovering':
      return [0, -6, -1, 0]
    case 'steady':
    default:
      return [0, 1, 0, 1]
  }
}

/** Deterministic, dependency-free string hash — spreads (student, subject)
 *  pairs across the four trend shapes and a small score jitter. Not for
 *  anything cryptographic; purely a stable fixture-shaping tool. */
function seedHash(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function clampScore(score: number): number {
  return Math.max(45, Math.min(90, Math.round(score)))
}

function marksForStudent(studentId: string): HdpMarksRecord {
  const entries: Array<HdpMarkEntry> = []
  for (const subject of MARK_SUBJECTS) {
    const hash = seedHash(`${studentId}-${subject}`)
    const base = 55 + (hash % 15) // 55..69 starting band
    const shape = MARK_TREND_SHAPES[Math.floor(hash / 15) % 4]
    const jitter = Math.floor(hash / 60) % 3 // 0..2, keeps clamping rare
    const deltas = marksDeltasForShape(shape)

    MARK_SEMESTERS.forEach((sem, index) => {
      const target = base + deltas[index]
      const isCurrent = index === MARK_SEMESTERS.length - 1
      if (isCurrent) {
        // The current semester's marking window has only just opened — WA1
        // is the only assessment recorded so far.
        entries.push({
          subject,
          schoolYear: sem.schoolYear,
          semester: sem.semester,
          assessment: 'wa1',
          score: clampScore(target),
        })
        return
      }
      const assessments: Array<{ assessment: AssessmentKind; score: number }> =
        [
          { assessment: 'wa1', score: clampScore(target - jitter) },
          { assessment: 'wa2', score: clampScore(target) },
          { assessment: 'exam', score: clampScore(target + jitter) },
        ]
      for (const { assessment, score } of assessments) {
        entries.push({
          subject,
          schoolYear: sem.schoolYear,
          semester: sem.semester,
          assessment,
          score,
        })
      }
    })
  }
  return { studentId, entries }
}

export const SEED_MARKS: Array<HdpMarksRecord> =
  CLASS_3A_STUDENT_IDS.map(marksForStudent)

// ── SEED_REFLECTIONS (plan 037) ─────────────────────────────────────────
// First-person, age-plausible reflections for the 3 report-book students
// (see the "Staged funnel" note above). Student B ('2', Vincent) is marked
// `chosenAsCover: true` — the story register's cover quote. Behaviour-in-
// context language, no trait vocabulary, matches the "Ask … about" prompts
// already seeded for these three.
export const SEED_REFLECTIONS: Array<StudentReflection> = [
  {
    studentId: '1',
    text: 'This term I finally got the geometry proof to work after redoing it a few times. I want to try explaining my working out loud more, not just writing it down.',
    writtenAt: '2026-07-10T20:15:00+08:00',
    chosenAsCover: false,
  },
  {
    studentId: '2',
    text: 'I kept going back to that geometry proof at CCA training until it made sense, even when it was frustrating. I also started noticing when people around me look lost, and I like being the one they ask.',
    writtenAt: '2026-07-11T19:40:00+08:00',
    chosenAsCover: true,
  },
  {
    studentId: '3',
    text: 'I let someone else present our group project this time, even though I wanted to. I think I understand the formula better when I ask why it works, not just how to use it.',
    writtenAt: '2026-07-12T21:05:00+08:00',
    chosenAsCover: false,
  },
]
