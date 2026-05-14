import type { StructuredGroup } from '@/types/student-group'
import { mockStudents } from '@/data/mock-students'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nameHash(name: string): number {
  let h = 0
  for (const c of name) h = Math.imul(31, h) + c.charCodeAt(0)
  return Math.abs(h)
}

function fakeNric(name: string): string {
  const h = nameHash(name)
  const prefix = h % 2 === 0 ? 'S' : 'T'
  const digits = String(h % 10_000_000).padStart(7, '0')
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  return `${prefix}${digits}${letters[h % letters.length]}`
}

const bandung = mockStudents.filter(
  (s) => s.schoolName === 'Bandung Secondary School',
)

// ─── Teacher's School Cockpit assignment ──────────────────────────────────────
// Mock: this teacher is assigned 2 classes (3 Aspiration, 3 Creativity) and
//       2 CCAs (Basketball, Choir) in School Cockpit.

const SYNC_DATE = '2026-03-20T08:00:00.000Z'

// Class: 3A
const aspirationStudents = bandung
  .filter((s) => s.class === '3A')
  .sort((a, b) => a.indexNumber - b.indexNumber)

// Class: 3B
const creativityStudents = bandung
  .filter((s) => s.class === '3B')
  .sort((a, b) => a.indexNumber - b.indexNumber)

// CCA member names
const BASKETBALL_NAMES = [
  'Chen Teo Jun Kai',
  'Yusuf Koh Xin Yi',
  'Bryan Tay Zhi Wei',
  'Lim Jun Hao',
  'Kevin Ng Wei Ming',
  'Ryan Lim Zhi Hao',
  'Daniel Ong Jun Wei',
]

const CHOIR_NAMES = [
  'Sarah Chan Jun Kai',
  'Natalie Lim Jia Ying',
  'Sophie Wong Xin Hui',
  'Rachel Wong Mei Ling',
  'Tan Shu Min',
  'Emily Tan Shu Wen',
  'Chua Xin Tong',
]

// Derive a fake class label for CCA members (spread across levels)
const CCA_CLASSES = ['1A', '1B', '2C', '2D', '3A', '3B', '4A']

function ccaMemberClass(name: string): string {
  return CCA_CLASSES[nameHash(name) % CCA_CLASSES.length]
}

// Level: Secondary 3 (all Sec 3 students assigned to this teacher's level)
const sec3Students = bandung
  .filter((s) => ['3A', '3B', '3C', '3D'].includes(s.class))
  .sort(
    (a, b) => a.class.localeCompare(b.class) || a.indexNumber - b.indexNumber,
  )

// Teaching Group: English Remedial Sec 3 (subset of Sec 3 students)
const englishRemedialNames = [
  'Lim Jun Hao',
  'Bryan Tay Zhi Wei',
  'Chen Teo Jun Kai',
  'Daniel Ong Jun Wei',
  'Fong Wei Lin',
  'Grace Lim Shu Wen',
  'Heng Yong Sheng',
  'Isabel Tan Xin Yi',
]

const TEACHING_CLASSES = ['3A', '3B']

function teachingMemberClass(name: string): string {
  return TEACHING_CLASSES[nameHash(name) % TEACHING_CLASSES.length]
}

// ─── Exported structured groups ───────────────────────────────────────────────

export const TEACHER_STRUCTURED_GROUPS: Array<StructuredGroup> = [
  {
    id: 'structured:class:3a',
    kind: 'structured',
    structuredType: 'class',
    name: '3A',
    syncedAt: SYNC_DATE,
    members: aspirationStudents.map((s) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      nric: s.nric,
      indexNumber: s.indexNumber,
      cca: s.cca ?? undefined,
    })),
  },
  {
    id: 'structured:class:3b',
    kind: 'structured',
    structuredType: 'class',
    name: '3B',
    syncedAt: SYNC_DATE,
    members: creativityStudents.map((s) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      nric: s.nric,
      indexNumber: s.indexNumber,
      cca: s.cca ?? undefined,
    })),
  },
  {
    id: 'structured:cca:basketball',
    kind: 'structured',
    structuredType: 'cca',
    name: 'Basketball',
    syncedAt: SYNC_DATE,
    members: BASKETBALL_NAMES.map((name, i) => ({
      id: `cca-bball-${i}`,
      name,
      class: ccaMemberClass(name),
      nric: fakeNric(name),
    })),
  },
  {
    id: 'structured:cca:choir',
    kind: 'structured',
    structuredType: 'cca',
    name: 'Choir',
    syncedAt: SYNC_DATE,
    members: CHOIR_NAMES.map((name, i) => ({
      id: `cca-choir-${i}`,
      name,
      class: ccaMemberClass(name),
      nric: fakeNric(name),
    })),
  },
  {
    id: 'structured:level:sec-3',
    kind: 'structured',
    structuredType: 'level',
    name: 'Secondary 3',
    syncedAt: SYNC_DATE,
    members: sec3Students.map((s) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      nric: s.nric,
      indexNumber: s.indexNumber,
    })),
  },
  {
    id: 'structured:teaching:english-remedial-3',
    kind: 'structured',
    structuredType: 'teaching',
    name: 'English Remedial (Sec 3)',
    syncedAt: SYNC_DATE,
    members: englishRemedialNames.map((name, i) => ({
      id: `teaching-eng-rem-${i}`,
      name,
      class: teachingMemberClass(name),
      nric: fakeNric(name),
    })),
  },
]

export function getStructuredGroupById(
  id: string,
): StructuredGroup | undefined {
  return TEACHER_STRUCTURED_GROUPS.find((g) => g.id === id)
}
