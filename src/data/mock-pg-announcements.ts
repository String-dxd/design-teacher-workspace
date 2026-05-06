import type { PGAnnouncement } from '@/types/pg-announcement'

const now = new Date()
const daysAgo = (d: number) =>
  new Date(now.getTime() - d * 86400000).toISOString()
const hoursAgo = (h: number) =>
  new Date(now.getTime() - h * 3600000).toISOString()
const daysFromNow = (d: number) =>
  new Date(now.getTime() + d * 86400000).toISOString()

// Parent contact details per student (relationship + mobile)
const parentContactMap: Record<
  string,
  { parentRelationship: string; parentContact: string }
> = {
  '1': { parentRelationship: 'Father', parentContact: '9123 4567' },
  '2': { parentRelationship: 'Father', parentContact: '8234 5678' },
  '4': { parentRelationship: 'Father', parentContact: '8456 7890' },
}

// pgStatus key by studentId
const pgStatusMap: Record<string, 'onboarded' | 'not_onboarded'> = {
  '1': 'onboarded',
  '2': 'onboarded',
  '4': 'onboarded',
}

// Class index numbers per student
const classIndexMap: Record<string, string> = {
  '1': '01',
  '2': '02',
  '4': '04',
}

export const mockPGAnnouncements: Array<PGAnnouncement> = [
  // ── Drafts ────────────────────────────────────────────────────────────────

  // Draft — view-only
  {
    id: 'pg-draft-1',
    title: 'Sports Day Update',
    description:
      '<p>Dear Parent/Guardian,</p><p>Please note the updated arrangements for Sports Day on <strong>15 May 2026</strong>. Students are to report to the school hall by 7.30 am in their House attire.</p>',
    shortcuts: [],
    websiteLinks: [],
    attachments: [{ name: 'Sports Day Programme 2026.pdf', size: '214 KB' }],
    status: 'draft',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    createdAt: daysAgo(1),
    recipients: [],
  },

  // Draft — acknowledge
  {
    id: 'pg-draft-2',
    title: 'Medical Check-up Consent',
    description:
      '<p>Dear Parent/Guardian,</p><p>The school will be conducting a compulsory health screening for all Secondary 3 students on <strong>22 May 2026</strong>. Please acknowledge that you have read and agreed to the screening.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'draft',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    responseType: 'acknowledge',
    dueDate: daysFromNow(10),
    createdAt: daysAgo(2),
    recipients: [],
  },

  // Draft — yes/no
  {
    id: 'pg-draft-3',
    title: 'CCA Selection Survey',
    description:
      '<p>Dear Parent/Guardian,</p><p>Please indicate whether your child has selected their Primary CCA for the new year. This is required to finalise the CCA allocation list.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'draft',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    responseType: 'yes-no',
    dueDate: daysFromNow(7),
    createdAt: daysAgo(1),
    recipients: [],
  },

  // ── Scheduled ─────────────────────────────────────────────────────────────

  // Scheduled — yes/no
  {
    id: 'pg-12',
    title: 'School Camp Permission Slip',
    description:
      '<p>Dear Parent/Guardian,</p><p>We will be organising a <strong>3-day school camp</strong> at MOE Jalan Bahtera from <strong>10–12 June 2026</strong>. The camp focuses on outdoor education and team-building.</p><p>Please indicate if your child has your permission to attend.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'scheduled',
    scheduledAt: daysFromNow(2),
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [{ id: 'tan-ml', name: 'Tan Mei Lin', role: 'editor' }],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    responseType: 'yes-no',
    dueDate: daysFromNow(20),
    createdAt: daysAgo(1),
    recipients: [],
  },

  // ── Shared — posted ───────────────────────────────────────────────────────

  // Shared with current user as viewer (view-only)
  {
    id: 'pg-2',
    title: 'Year-End Concert – 12 November',
    description:
      '<p>Dear Parent/Guardian,</p><p>You are warmly invited to our <strong>Year-End Concert</strong> on <strong>12 November 2026</strong> at the school hall. The concert will begin at 6.30 pm. Admission is free.</p><p>Please present this letter at the entrance for registration.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'shared',
    role: 'viewer',
    staffInCharge: [
      { id: 'ong-bh', name: 'Ong Bee Hoon', role: 'editor' },
      { id: 'tan-ml', name: 'Tan Mei Lin', role: 'viewer' },
    ],
    enquiryEmail: 'ongbh@school.edu.sg',
    createdAt: daysAgo(6),
    postedAt: daysAgo(5),
    recipients: [
      {
        studentId: '1',
        studentName: 'Chen Teo Jun Kai',
        indexNo: classIndexMap['1'],
        classLabel: '2B',
        parentName: 'Chen Wei Liang',
        ...parentContactMap['1'],
        pgStatus: pgStatusMap['1'],
        readStatus: 'read',
        readAt: daysAgo(4),
      },
      {
        studentId: '2',
        studentName: 'Vincent Koh Xin Yi',
        indexNo: classIndexMap['2'],
        classLabel: '2B',
        parentName: 'Koh Beng Huat',
        ...parentContactMap['2'],
        pgStatus: pgStatusMap['2'],
        readStatus: 'unread',
      },
    ],
  },

  // Shared with current user as editor (acknowledge)
  {
    id: 'pg-3',
    title: 'Parent-Teacher Conference – Sec 3',
    description:
      '<p>Dear Parent/Guardian,</p><p>The <strong>Parent-Teacher Conference for Secondary 3</strong> will be held on <strong>24 October 2026</strong> from 9 am to 12 pm at the school library.</p><p>Please acknowledge that you have noted the schedule. The consultation timetable will be sent separately.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'shared',
    role: 'editor',
    staffInCharge: [
      { id: 'tan-ml', name: 'Tan Mei Lin', role: 'editor' },
      { id: 'priya-n', name: 'Priya Nair', role: 'editor' },
    ],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    responseType: 'acknowledge',
    dueDate: daysFromNow(3),
    createdAt: daysAgo(4),
    postedAt: daysAgo(3),
    recipients: [
      {
        studentId: '1',
        studentName: 'Chen Teo Jun Kai',
        indexNo: classIndexMap['1'],
        classLabel: '3A',
        parentName: 'Chen Wei Liang',
        ...parentContactMap['1'],
        pgStatus: pgStatusMap['1'],
        readStatus: 'read',
        readAt: daysAgo(2),
        acknowledgedAt: daysAgo(2),
        respondedAt: daysAgo(2),
      },
      {
        studentId: '2',
        studentName: 'Vincent Koh Xin Yi',
        indexNo: classIndexMap['2'],
        classLabel: '3A',
        parentName: 'Koh Beng Huat',
        ...parentContactMap['2'],
        pgStatus: pgStatusMap['2'],
        readStatus: 'read',
        readAt: daysAgo(1),
        // not yet acknowledged
      },
      {
        studentId: '4',
        studentName: 'Priya Nair',
        indexNo: classIndexMap['4'],
        classLabel: '3A',
        parentName: 'Nair Ramesh',
        ...parentContactMap['4'],
        pgStatus: pgStatusMap['4'],
        readStatus: 'unread',
      },
    ],
  },

  // ── Posted (mine) ─────────────────────────────────────────────────────────

  // 1. View-only post
  {
    id: 'pg-1',
    title: 'Term 4 Letter to Parents',
    description:
      "<p>Please find attached the Term 4 Letter to Parents, which outlines key dates, school expectations, and upcoming events for the final term of the year.</p><p>We encourage all parents to read through the letter carefully. Please contact your child's Form Teacher should you have any questions.</p>",
    shortcuts: [],
    websiteLinks: [],
    attachments: [{ name: 'Term 4 Parent Letter 2026.pdf', size: '318 KB' }],
    status: 'posted',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [{ id: 'tan-ml', name: 'Tan Mei Lin', role: 'editor' }],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    createdAt: daysAgo(5),
    postedAt: daysAgo(4),
    recipients: [
      {
        studentId: '1',
        studentName: 'Chen Teo Jun Kai',
        indexNo: classIndexMap['1'],
        classLabel: '3A',
        parentName: 'Chen Wei Liang',
        ...parentContactMap['1'],
        pgStatus: pgStatusMap['1'],
        readStatus: 'read',
        readAt: daysAgo(3),
      },
      {
        studentId: '2',
        studentName: 'Vincent Koh Xin Yi',
        indexNo: classIndexMap['2'],
        classLabel: '3A',
        parentName: 'Koh Beng Huat',
        ...parentContactMap['2'],
        pgStatus: pgStatusMap['2'],
        readStatus: 'read',
        readAt: daysAgo(3),
      },
      {
        studentId: '4',
        studentName: 'Priya Nair',
        indexNo: classIndexMap['4'],
        classLabel: '3A',
        parentName: 'Nair Ramesh',
        ...parentContactMap['4'],
        pgStatus: pgStatusMap['4'],
        readStatus: 'unread',
      },
    ],
  },

  // 2. Post with yes/no response
  {
    id: 'pg-11',
    title: 'Class Chalet 2026 – RSVP',
    description:
      '<p>Dear Parent/Guardian,</p><p>We are planning a <strong>Class Chalet</strong> at <strong>Downtown East</strong> on <strong>18–19 April 2026</strong> as part of our class bonding activities. The chalet will be supervised by teachers.</p><p>Please indicate whether your child <strong>will be attending</strong> the chalet.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [{ id: 'tan-ml', name: 'Tan Mei Lin', role: 'editor' }],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    responseType: 'yes-no',
    dueDate: daysFromNow(7),
    questions: [
      {
        id: 'q1',
        text: 'Which meal package do you prefer?',
        type: 'mcq',
        options: ['Standard', 'Vegetarian', 'Halal'],
        showAfter: 'yes',
      },
      {
        id: 'q2',
        text: 'Any dietary restrictions or special requests?',
        type: 'free-text',
        showAfter: 'yes',
      },
    ],
    createdAt: daysAgo(2),
    postedAt: daysAgo(1),
    recipients: [
      {
        studentId: '1',
        studentName: 'Chen Teo Jun Kai',
        indexNo: classIndexMap['1'],
        classLabel: '3A',
        parentName: 'Chen Wei Liang',
        ...parentContactMap['1'],
        pgStatus: pgStatusMap['1'],
        readStatus: 'read',
        readAt: hoursAgo(20),
        formResponse: 'yes',
        respondedAt: hoursAgo(20),
        questionAnswers: {
          q1: 'Halal',
          q2: 'No pork or lard please.',
        },
      },
      {
        studentId: '2',
        studentName: 'Vincent Koh Xin Yi',
        indexNo: classIndexMap['2'],
        classLabel: '3A',
        parentName: 'Koh Beng Huat',
        ...parentContactMap['2'],
        pgStatus: pgStatusMap['2'],
        readStatus: 'read',
        readAt: hoursAgo(18),
        formResponse: 'no',
        respondedAt: hoursAgo(18),
        // Questions only apply to 'yes' responses — no answers needed
      },
      {
        studentId: '4',
        studentName: 'Priya Nair',
        indexNo: classIndexMap['4'],
        classLabel: '3A',
        parentName: 'Nair Ramesh',
        ...parentContactMap['4'],
        pgStatus: pgStatusMap['4'],
        readStatus: 'unread',
      },
    ],
  },

  // 3. Post with acknowledge response
  {
    id: 'pg-10',
    title: 'Science Centre Learning Journey – Consent',
    description:
      '<p>Dear Parent/Guardian,</p><p>We are organising a <strong>Learning Journey to the Science Centre Singapore</strong> on <strong>28 March 2026</strong> for Secondary 3 students.</p><p>Please acknowledge this announcement to confirm that you have read and understood the details.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [{ id: 'tan-ml', name: 'Tan Mei Lin', role: 'editor' }],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    responseType: 'acknowledge',
    dueDate: daysFromNow(5),
    createdAt: daysAgo(3),
    postedAt: daysAgo(2),
    recipients: [
      {
        studentId: '1',
        studentName: 'Chen Teo Jun Kai',
        indexNo: classIndexMap['1'],
        classLabel: '3A',
        parentName: 'Chen Wei Liang',
        ...parentContactMap['1'],
        pgStatus: pgStatusMap['1'],
        readStatus: 'read',
        readAt: daysAgo(1),
        acknowledgedAt: daysAgo(1),
        respondedAt: daysAgo(1),
      },
      {
        studentId: '2',
        studentName: 'Vincent Koh Xin Yi',
        indexNo: classIndexMap['2'],
        classLabel: '3A',
        parentName: 'Koh Beng Huat',
        ...parentContactMap['2'],
        pgStatus: pgStatusMap['2'],
        readStatus: 'read',
        readAt: daysAgo(1),
        acknowledgedAt: daysAgo(1),
        respondedAt: daysAgo(1),
      },
      {
        studentId: '4',
        studentName: 'Priya Nair',
        indexNo: classIndexMap['4'],
        classLabel: '3A',
        parentName: 'Nair Ramesh',
        ...parentContactMap['4'],
        pgStatus: pgStatusMap['4'],
        readStatus: 'read',
        readAt: hoursAgo(20),
        // not yet acknowledged
      },
    ],
  },
]

export function getPGAnnouncementById(id: string): PGAnnouncement | undefined {
  return mockPGAnnouncements.find((a) => a.id === id)
}
