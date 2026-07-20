import type { StudentGroup } from '@/types/student-group'
import { mockStudents } from '@/data/mock-students'

// Learning Support Students — students from Bandung Secondary where learningSupport is not null
const lsStudents = mockStudents
  .filter(
    (s) =>
      s.schoolName === 'Bandung Secondary School' && s.learningSupport !== null,
  )
  .sort((a, b) => a.indexNumber - b.indexNumber)

// Drama Festival Cast — 6 from 3A, 6 from 3B
const aspirationStudents = mockStudents
  .filter(
    (s) => s.schoolName === 'Bandung Secondary School' && s.class === '3A',
  )
  .sort((a, b) => a.indexNumber - b.indexNumber)
  .slice(0, 6)

const creativityStudents = mockStudents
  .filter(
    (s) => s.schoolName === 'Bandung Secondary School' && s.class === '3B',
  )
  .sort((a, b) => a.indexNumber - b.indexNumber)
  .slice(0, 6)

// Science Olympiad Team — 4 from 4A, 4 from 4B
const dedicationStudents = mockStudents
  .filter(
    (s) => s.schoolName === 'Bandung Secondary School' && s.class === '4A',
  )
  .sort((a, b) => a.indexNumber - b.indexNumber)
  .slice(0, 4)

const endeavourStudents = mockStudents
  .filter(
    (s) => s.schoolName === 'Bandung Secondary School' && s.class === '4B',
  )
  .sort((a, b) => a.indexNumber - b.indexNumber)
  .slice(0, 4)

export const MOCK_GROUPS: Array<StudentGroup> = [
  {
    id: 'cg-drama-festival',
    kind: 'regular',
    listType: 'static',
    source: 'created',
    name: 'Drama Festival Cast',
    description:
      'Selected students from 3A and 3B performing in the school Drama Festival 2025.',
    members: [...aspirationStudents, ...creativityStudents].map((s) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      nric: s.nric,
      indexNumber: s.indexNumber,
    })),
    staffInCharge: [
      { id: 'wong-km', name: 'Mr Wong Kai Ming', type: 'individual' },
    ],
    visibility: 'private',
    sharedWith: [
      {
        staffId: 'wong-km',
        name: 'Mr Wong Kai Ming',
        email: 'wongkm@school.edu.sg',
        role: 'editor',
      },
      {
        staffId: 'chan-hl',
        name: 'Ms Chan Hui Ling',
        email: 'chanhl@school.edu.sg',
        role: 'viewer',
      },
    ],
    createdBy: { name: 'Mrs Tan Mei Lin', email: 'tanml@school.edu.sg' },
    createdAt: '2025-03-05T10:00:00.000Z',
    updatedAt: '2026-03-28T09:45:00.000Z', // 5 days ago
    lastUsedAt: '2026-03-28T09:45:00.000Z',
  },
  {
    id: 'cg-science-olympiad',
    kind: 'regular',
    listType: 'static',
    source: 'created',
    name: 'Science Olympiad Team',
    description:
      'Top Sec 4 Science students from 4A and 4B selected for the National Science Olympiad 2025.',
    members: [...dedicationStudents, ...endeavourStudents].map((s) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      nric: s.nric,
      indexNumber: s.indexNumber,
    })),
    staffInCharge: [
      { id: 'rajan-s', name: 'Mr Rajan Subramaniam', type: 'individual' },
    ],
    visibility: 'private',
    sharedWith: [
      {
        staffId: 'rajan-s',
        name: 'Mr Rajan Subramaniam',
        email: 'rajans@school.edu.sg',
        role: 'editor',
      },
      {
        staffId: 'ng-xh',
        name: 'Ms Ng Xiu Han',
        email: 'ngxh@school.edu.sg',
        role: 'viewer',
      },
    ],
    createdBy: { name: 'Mrs Tan Mei Lin', email: 'tanml@school.edu.sg' },
    createdAt: '2025-04-18T11:15:00.000Z',
    updatedAt: '2026-03-19T16:00:00.000Z', // 2 weeks ago
    lastUsedAt: '2026-03-19T16:00:00.000Z',
  },
]

// Shared groups — created by other teachers, shared with Mrs Tan
const brightSparksStudents = mockStudents
  .filter(
    (s) => s.schoolName === 'Bandung Secondary School' && s.class === '3A',
  )
  .sort((a, b) => a.indexNumber - b.indexNumber)
  .slice(6, 14)

const readingStudents = mockStudents
  .filter(
    (s) => s.schoolName === 'Bandung Secondary School' && s.class === '4A',
  )
  .sort((a, b) => a.indexNumber - b.indexNumber)
  .slice(4, 10)

const MOCK_SHARED_GROUPS: Array<StudentGroup> = [
  {
    id: 'cg-bright-sparks',
    kind: 'regular',
    source: 'created',
    name: 'Bright Sparks Mentorship',
    description:
      'High-ability Sec 3 students selected for the external mentorship programme by Mr Wong.',
    members: brightSparksStudents.map((s) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      nric: s.nric,
      indexNumber: s.indexNumber,
    })),
    staffInCharge: [
      { id: 'wong-km', name: 'Mr Wong Kai Ming', type: 'individual' },
    ],
    visibility: 'private',
    sharedWith: [
      {
        staffId: 'tanml',
        name: 'Mrs Tan Mei Lin',
        email: 'tanml@school.edu.sg',
        role: 'editor',
      },
    ],
    createdBy: { name: 'Mr Wong Kai Ming', email: 'wongkm@school.edu.sg' },
    createdAt: '2025-06-01T09:00:00.000Z',
    updatedAt: '2026-03-31T11:30:00.000Z', // 2 days ago
    lastUsedAt: '2026-03-31T11:30:00.000Z',
  },
  {
    id: 'cg-reading-programme',
    kind: 'regular',
    source: 'created',
    name: 'Reading Programme Cohort',
    description:
      'Sec 4 students enrolled in the school-wide Reading for Life programme. Shared for co-facilitation.',
    members: readingStudents.map((s) => ({
      id: s.id,
      name: s.name,
      class: s.class,
      nric: s.nric,
      indexNumber: s.indexNumber,
    })),
    staffInCharge: [
      { id: 'lim-bh', name: 'Mr Lim Beng Huat', type: 'individual' },
    ],
    visibility: 'private',
    sharedWith: [
      {
        staffId: 'tanml',
        name: 'Mrs Tan Mei Lin',
        email: 'tanml@school.edu.sg',
        role: 'viewer',
      },
    ],
    createdBy: { name: 'Mr Lim Beng Huat', email: 'limbh@school.edu.sg' },
    createdAt: '2025-07-14T14:00:00.000Z',
    updatedAt: '2026-03-25T10:00:00.000Z', // 1 week ago
    lastUsedAt: '2025-12-01T10:00:00.000Z',
  },
]

export function getGroupById(id: string): StudentGroup | undefined {
  return [...MOCK_GROUPS, ...MOCK_SHARED_GROUPS].find((g) => g.id === id)
}
