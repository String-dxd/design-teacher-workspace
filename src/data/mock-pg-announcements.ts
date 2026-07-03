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
    postedBy: 'Ong Bee Hoon',
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
    postedBy: 'Mrs Tan Mei Lin',
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

  // Extra records for pagination
  {
    id: 'pg-4',
    title: 'Consent for Overseas Learning Journey',
    description:
      '<p>Dear Parent/Guardian,</p><p>Your child has been selected to participate in an overseas learning journey to Johor Bahru on <strong>22 Aug 2026</strong>. Please indicate your consent below by <strong>15 Jul 2026</strong>.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    createdAt: daysAgo(30),
    postedAt: daysAgo(30),
    responseType: 'yes-no',
    dueDate: daysFromNow(12),
    recipients: Array.from({ length: 32 }, (_, i) => ({
      studentId: `pg4-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: '3A',
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: i < 28 ? 'read' : 'unread',
      readAt: i < 28 ? daysAgo(29) : undefined,
      formResponse: i < 25 ? 'yes' : i < 28 ? 'no' : undefined,
      respondedAt: i < 28 ? daysAgo(29) : undefined,
    })),
  },
  {
    id: 'pg-5',
    title: 'Co-Curricular Activity Selection — Sec 1',
    description:
      '<p>Dear Parent/Guardian,</p><p>Please indicate your child\'s preferred CCA from the options listed. Selections must be submitted by <strong>10 Jul 2026</strong>.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    createdAt: daysAgo(35),
    postedAt: daysAgo(35),
    responseType: 'acknowledge',
    dueDate: daysFromNow(7),
    recipients: Array.from({ length: 38 }, (_, i) => ({
      studentId: `pg5-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: '1A',
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: i < 30 ? 'read' : 'unread',
      readAt: i < 30 ? daysAgo(34) : undefined,
      respondedAt: i < 25 ? daysAgo(34) : undefined,
    })),
  },
  {
    id: 'pg-6',
    title: 'Parental Consent for School Excursion',
    description:
      '<p>Dear Parent/Guardian,</p><p>Your child\'s class will be visiting the Singapore Science Centre on <strong>18 Jul 2026</strong>. Please acknowledge and indicate if your child has any medical conditions to note.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'draft',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    createdAt: daysAgo(2),
    responseType: 'yes-no',
    recipients: [],
  },
  {
    id: 'pg-9',
    title: 'Parent Acknowledgement — Exam Timetable',
    description:
      '<p>Dear Parent/Guardian,</p><p>Please acknowledge receipt of the Semester 2 examination timetable attached. Ensure your child is aware of all exam dates and requirements.</p>',
    shortcuts: [],
    websiteLinks: [],
    attachments: [{ name: 'Exam Timetable Sem 2 2026.pdf', size: '156 KB' }],
    status: 'posted',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    createdAt: daysAgo(40),
    postedAt: daysAgo(40),
    responseType: 'acknowledge',
    dueDate: daysFromNow(5),
    recipients: Array.from({ length: 35 }, (_, i) => ({
      studentId: `pg9-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: '3A',
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: 'read' as const,
      readAt: daysAgo(39),
      respondedAt: i < 30 ? daysAgo(39) : undefined,
    })),
  },
  {
    id: 'pg-7',
    title: 'Uniform Inspection Notice',
    description:
      '<p>Dear Parent/Guardian,</p><p>A uniform inspection will be conducted on <strong>10 Jul 2026</strong>. Please ensure your child adheres to the school dress code.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    createdAt: daysAgo(20),
    postedAt: daysAgo(20),
    responseType: 'view-only',
    recipients: Array.from({ length: 30 }, (_, i) => ({
      studentId: `pg7-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: '3A',
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: i < 22 ? 'read' : 'unread',
      readAt: i < 22 ? daysAgo(19) : undefined,
    })),
  },
  {
    id: 'pg-8',
    title: 'End-of-Year Result Slip Collection',
    description:
      '<p>Dear Parent/Guardian,</p><p>Result slips for Semester 2 will be distributed on <strong>15 Nov 2026</strong>. Parents are invited to collect them in person.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'mine',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanml@bandungsec.edu.sg',
    createdAt: daysAgo(25),
    postedAt: daysAgo(25),
    responseType: 'acknowledge',
    dueDate: daysFromNow(14),
    recipients: Array.from({ length: 28 }, (_, i) => ({
      studentId: `pg8-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: '3A',
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: 'read' as const,
      readAt: daysAgo(24),
      respondedAt: i < 20 ? daysAgo(24) : undefined,
    })),
  },
]

export const mockSchoolWidePosts: Array<PGAnnouncement> = [
  {
    id: 'sw-1',
    title: 'NAPFA Test Scheduling — Sec 2 Classes',
    description:
      '<p>Dear Parent/Guardian,</p><p>Please be informed that the NAPFA test for all Sec 2 students will be held on <strong>10 Jul 2026</strong>. Students should wear their PE attire and bring a water bottle.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'other',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'limsh@bandungsec.edu.sg',
    postedBy: 'Ms Lim Su Hui',
    createdAt: daysAgo(5),
    postedAt: daysAgo(5),
    recipients: Array.from({ length: 89 }, (_, i) => ({
      studentId: `sw1-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: ['2A', '2B', '2C', '2D'][i % 4],
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: i % 3 === 0 ? 'unread' : 'read',
      readAt: i % 3 !== 0 ? daysAgo(4) : undefined,
    })),
    responseType: 'view-only',
  },
  {
    id: 'sw-2',
    title: 'Inter-Class Debate Competition — Sign Up Now',
    description:
      "<p>Dear Parent/Guardian,</p><p>We are pleased to invite students to sign up for the annual Inter-Class Debate Competition. Please indicate your child's interest by 5 Jul 2026.</p>",
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'other',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'tanck@bandungsec.edu.sg',
    postedBy: 'Mr Tan Chee Keong',
    createdAt: daysAgo(8),
    postedAt: daysAgo(7),
    recipients: Array.from({ length: 42 }, (_, i) => ({
      studentId: `sw2-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: ['3A', '3B'][i % 2],
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: i < 30 ? 'read' : 'unread',
      readAt: i < 30 ? daysAgo(6) : undefined,
      formResponse: i < 20 ? 'yes' : i < 30 ? 'no' : undefined,
      respondedAt: i < 30 ? daysAgo(6) : undefined,
    })),
    responseType: 'acknowledge',
    dueDate: daysFromNow(3),
  },
  {
    id: 'sw-3',
    title: 'Library Book Return Reminder',
    description:
      '<p>Dear Parent/Guardian,</p><p>Please remind your child to return all library books by <strong>30 Jun 2026</strong>. Outstanding loans may affect end-of-year results collection.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'other',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'rahmana@bandungsec.edu.sg',
    postedBy: 'Ms Rahimah Noor',
    createdAt: daysAgo(3),
    postedAt: daysAgo(3),
    recipients: Array.from({ length: 120 }, (_, i) => ({
      studentId: `sw3-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: ['1A', '1B', '1C', '2A', '2B'][i % 5],
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: i < 75 ? 'read' : 'unread',
      readAt: i < 75 ? daysAgo(2) : undefined,
    })),
    responseType: 'view-only',
  },
  {
    id: 'sw-4',
    title: 'Sec 4 Oral Examination Schedule',
    description:
      '<p>Dear Parent/Guardian,</p><p>The Mother Tongue Oral Examination schedule for Sec 4 students has been released. Please refer to the attached timetable and ensure your child is present on the designated date.</p>',
    shortcuts: [],
    websiteLinks: [],
    attachments: [{ name: 'MT Oral Timetable 2026.pdf', size: '88 KB' }],
    status: 'posted',
    ownership: 'other',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'wongpx@bandungsec.edu.sg',
    postedBy: 'Mr Wong Poh Xiang',
    createdAt: daysAgo(12),
    postedAt: daysAgo(12),
    recipients: Array.from({ length: 56 }, (_, i) => ({
      studentId: `sw4-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: ['4A', '4B'][i % 2],
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: 'read' as const,
      readAt: daysAgo(11),
    })),
    responseType: 'view-only',
  },
  {
    id: 'sw-5',
    title: 'Parent-Teacher Meeting — Booking Confirmation',
    description:
      '<p>Dear Parent/Guardian,</p><p>Thank you for booking your slot for the upcoming Parent-Teacher Meeting on <strong>18 Jul 2026</strong>. Your appointment has been confirmed.</p>',
    shortcuts: [],
    websiteLinks: [],
    status: 'posted',
    ownership: 'other',
    role: 'editor',
    staffInCharge: [],
    enquiryEmail: 'kohbh@bandungsec.edu.sg',
    postedBy: 'Ms Koh Bee Hwa',
    createdAt: daysAgo(2),
    postedAt: daysAgo(1),
    recipients: Array.from({ length: 34 }, (_, i) => ({
      studentId: `sw5-${i}`,
      studentName: `Student ${i + 1}`,
      classLabel: '3C',
      parentName: `Parent ${i + 1}`,
      pgStatus: 'onboarded' as const,
      readStatus: i < 20 ? 'read' : 'unread',
      readAt: i < 20 ? daysAgo(1) : undefined,
    })),
    responseType: 'acknowledge',
    dueDate: daysFromNow(7),
  },
]

export function getPGAnnouncementById(id: string): PGAnnouncement | undefined {
  return (
    mockPGAnnouncements.find((a) => a.id === id) ??
    mockSchoolWidePosts.find((a) => a.id === id)
  )
}
