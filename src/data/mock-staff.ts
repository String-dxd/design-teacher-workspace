export interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  formClass?: string // e.g. "3A" — undefined for non-form teachers (HODs, etc.)
}

export interface StaffGroup {
  id: string
  label: string
  memberIds: Array<string>
  groupType?: 'level' | 'department' | 'staff-group'
}

export const MOCK_STAFF: Array<StaffMember> = [
  // ── Sec 1 Form & Co-Form ────────────────────────────────────────────────────
  {
    id: 'lee-sy',
    name: 'Mrs Lee Su Yin',
    email: 'leesy@school.edu.sg',
    role: 'Form Teacher',
    formClass: '1A',
  },
  {
    id: 'goh-wt',
    name: 'Mr Goh Wei Ting',
    email: 'gohwt@school.edu.sg',
    role: 'Co-Form Teacher',
    formClass: '1A',
  },
  {
    id: 'kumar-a',
    name: 'Ms Anitha Kumar',
    email: 'anithaK@school.edu.sg',
    role: 'Form Teacher',
    formClass: '1B',
  },
  {
    id: 'loh-jx',
    name: 'Mr Loh Jun Xiang',
    email: 'lohjx@school.edu.sg',
    role: 'Co-Form Teacher',
    formClass: '1B',
  },

  // ── Sec 2 Form & Co-Form ────────────────────────────────────────────────────
  {
    id: 'yeo-cl',
    name: 'Ms Yeo Ching Ling',
    email: 'yeocl@school.edu.sg',
    role: 'Form Teacher',
    formClass: '2A',
  },
  {
    id: 'hassan-f',
    name: 'Mr Faris Hassan',
    email: 'farisH@school.edu.sg',
    role: 'Co-Form Teacher',
    formClass: '2A',
  },
  {
    id: 'ong-bh',
    name: 'Mrs Ong Bee Hoon',
    email: 'ongbh@school.edu.sg',
    role: 'Form Teacher',
    formClass: '2B',
  },
  {
    id: 'raj-v',
    name: 'Mr Vijay Raj',
    email: 'vijayR@school.edu.sg',
    role: 'Co-Form Teacher',
    formClass: '2B',
  },

  // ── Sec 3 Form & Co-Form ────────────────────────────────────────────────────
  {
    id: 'tan-ml',
    name: 'Mrs Tan Mei Lin',
    email: 'tanml@school.edu.sg',
    role: 'Form Teacher',
    formClass: '3A',
  },
  {
    id: 'wong-km',
    name: 'Mr Wong Kai Ming',
    email: 'wongkm@school.edu.sg',
    role: 'Co-Form Teacher',
    formClass: '3A',
  },
  {
    id: 'priya-n',
    name: 'Ms Priya Nair',
    email: 'priyan@school.edu.sg',
    role: 'Form Teacher',
    formClass: '3B',
  },
  {
    id: 'chan-hl',
    name: 'Ms Chan Hui Ling',
    email: 'chanhl@school.edu.sg',
    role: 'Co-Form Teacher',
    formClass: '3B',
  },
  {
    id: 'ng-xh',
    name: 'Ms Ng Xiu Han',
    email: 'ngxh@school.edu.sg',
    role: 'Form Teacher',
    formClass: '3C',
  },
  {
    id: 'teo-rk',
    name: 'Mr Teo Rui Kang',
    email: 'teork@school.edu.sg',
    role: 'Co-Form Teacher',
    formClass: '3C',
  },

  // ── Sec 4 Form & Co-Form ────────────────────────────────────────────────────
  {
    id: 'sim-pw',
    name: 'Mrs Sim Pei Wen',
    email: 'simpw@school.edu.sg',
    role: 'Form Teacher',
    formClass: '4A',
  },
  {
    id: 'abdul-r',
    name: 'Mr Abdul Rahman',
    email: 'abdulR@school.edu.sg',
    role: 'Co-Form Teacher',
    formClass: '4A',
  },
  {
    id: 'koh-ly',
    name: 'Ms Koh Li Ying',
    email: 'kohly@school.edu.sg',
    role: 'Form Teacher',
    formClass: '4B',
  },
  {
    id: 'chen-jh',
    name: 'Mr Chen Jia Hao',
    email: 'chenjh@school.edu.sg',
    role: 'Co-Form Teacher',
    formClass: '4B',
  },

  // ── Admin Support (AM / AE / CSO / MSO) ─────────────────────────────────────
  {
    id: 'tan-bl',
    name: 'Mrs Tan Bee Leng',
    email: 'tanbl@school.edu.sg',
    role: 'Administrative Manager',
  },
  {
    id: 'chia-dw',
    name: 'Mr David Chia',
    email: 'chiadw@school.edu.sg',
    role: 'Admin Executive',
  },
  {
    id: 'nurul-h',
    name: 'Ms Nurul Huda',
    email: 'nurulH@school.edu.sg',
    role: 'Customer Service Officer',
  },
  {
    id: 'sim-pt',
    name: 'Mr Patrick Sim',
    email: 'simpt@school.edu.sg',
    role: 'Management Support Officer',
  },

  // ── Allied Educators (AEDs) ──────────────────────────────────────────────────
  {
    id: 'lim-jl',
    name: 'Ms Jennifer Lim',
    email: 'limjl@school.edu.sg',
    role: 'AED (Learning & Behavioural Support)',
  },
  {
    id: 'muthu-s',
    name: 'Ms Sarah Muthu',
    email: 'muthuS@school.edu.sg',
    role: 'AED (Teaching & Learning)',
  },
  {
    id: 'ismail-z',
    name: 'Mr Zulkifli Ismail',
    email: 'ismailZ@school.edu.sg',
    role: 'AED (Learning & Behavioural Support)',
  },

  // ── Heads (Year / Level / Subject / Dept / SSD) ──────────────────────────────
  {
    id: 'lim-bh',
    name: 'Mr Lim Beng Huat',
    email: 'limbh@school.edu.sg',
    role: 'HOD English',
  },
  {
    id: 'rajan-s',
    name: 'Mr Rajan Subramaniam',
    email: 'rajans@school.edu.sg',
    role: 'HOD Mathematics',
  },
  {
    id: 'chua-sl',
    name: 'Mrs Chua Siew Ling',
    email: 'chuasl@school.edu.sg',
    role: 'Year Head (Sec 1)',
  },
  {
    id: 'koh-rm',
    name: 'Mr Raymond Koh',
    email: 'kohrm@school.edu.sg',
    role: 'Year Head (Sec 3)',
  },
  {
    id: 'fatimah-a',
    name: 'Ms Fatimah Binte Ahmad',
    email: 'fatimahA@school.edu.sg',
    role: 'Subject Head (Physical Education)',
  },
  {
    id: 'wee-hc',
    name: 'Mrs Wee Hui Chen',
    email: 'weehc@school.edu.sg',
    role: 'Level Head (Science)',
  },

  // ── School Leaders ───────────────────────────────────────────────────────────
  {
    id: 'tan-bj',
    name: 'Mr Benjamin Tan',
    email: 'tanbj@school.edu.sg',
    role: 'Principal',
  },
  {
    id: 'lau-gc',
    name: 'Mrs Grace Lau',
    email: 'laugc@school.edu.sg',
    role: 'Vice-Principal',
  },
  {
    id: 'soh-ks',
    name: 'Mr Soh Kian Seng',
    email: 'sohks@school.edu.sg',
    role: 'Vice-Principal',
  },
]

// ── Convenience ID lists ──────────────────────────────────────────────────────
const ALL_FORM_COFORM_IDS = [
  'lee-sy',
  'goh-wt',
  'kumar-a',
  'loh-jx', // Sec 1
  'yeo-cl',
  'hassan-f',
  'ong-bh',
  'raj-v', // Sec 2
  'tan-ml',
  'wong-km',
  'priya-n',
  'chan-hl',
  'ng-xh',
  'teo-rk', // Sec 3
  'sim-pw',
  'abdul-r',
  'koh-ly',
  'chen-jh', // Sec 4
]

const ADMIN_SUPPORT_IDS = ['tan-bl', 'chia-dw', 'nurul-h', 'sim-pt']

const AED_IDS = ['lim-jl', 'muthu-s', 'ismail-z']

const HEADS_IDS = [
  'lim-bh',
  'rajan-s',
  'chua-sl',
  'koh-rm',
  'fatimah-a',
  'wee-hc',
]

const SCHOOL_LEADERS_IDS = ['tan-bj', 'lau-gc', 'soh-ks']

export const MOCK_STAFF_GROUPS: Array<StaffGroup> = [
  // ── Level tab ───────────────────────────────────────────────────────────────
  {
    id: 'level:sec1',
    label: 'Sec 1 – Form & Co-Form',
    memberIds: ['lee-sy', 'goh-wt', 'kumar-a', 'loh-jx'],
    groupType: 'level',
  },
  {
    id: 'level:sec2',
    label: 'Sec 2 – Form & Co-Form',
    memberIds: ['yeo-cl', 'hassan-f', 'ong-bh', 'raj-v'],
    groupType: 'level',
  },
  {
    id: 'level:sec3',
    label: 'Sec 3 – Form & Co-Form',
    memberIds: ['tan-ml', 'wong-km', 'priya-n', 'chan-hl', 'ng-xh', 'teo-rk'],
    groupType: 'level',
  },
  {
    id: 'level:sec4',
    label: 'Sec 4 – Form & Co-Form',
    memberIds: ['sim-pw', 'abdul-r', 'koh-ly', 'chen-jh'],
    groupType: 'level',
  },

  // ── School tab ──────────────────────────────────────────────────────────────
  {
    id: 'school:all-form-coform',
    label: 'All Form & Co-Form',
    memberIds: ALL_FORM_COFORM_IDS,
    groupType: 'staff-group',
  },
  {
    id: 'school:admin-support',
    label: 'Admin Support (AM/AE/CSO/MSO)',
    memberIds: ADMIN_SUPPORT_IDS,
    groupType: 'staff-group',
  },
  {
    id: 'school:all-teachers',
    label: 'All Teachers (Excluding KPs)',
    memberIds: [...ALL_FORM_COFORM_IDS, ...HEADS_IDS],
    groupType: 'staff-group',
  },
  {
    id: 'school:all-aeds',
    label: 'All AEDs',
    memberIds: AED_IDS,
    groupType: 'staff-group',
  },
  {
    id: 'school:all-heads',
    label: 'All Heads (Year/Level/Subject/Dept/SSD)',
    memberIds: HEADS_IDS,
    groupType: 'staff-group',
  },
  {
    id: 'school:school-leaders',
    label: 'All School Leaders',
    memberIds: SCHOOL_LEADERS_IDS,
    groupType: 'staff-group',
  },

  // ── Department tab (kept for search; not surfaced in School scope) ───────────
  {
    id: 'dept:english',
    label: 'English Department',
    memberIds: ['lim-bh', 'chan-hl', 'yeo-cl'],
    groupType: 'department',
  },
  {
    id: 'dept:math',
    label: 'Mathematics Department',
    memberIds: ['rajan-s', 'goh-wt'],
    groupType: 'department',
  },
]

// Saved favourite enquiry emails shown in the quick-select picker
export const SAVED_ENQUIRY_EMAILS: Array<string> = [
  'tanml@school.edu.sg',
  'hod@school.edu.sg',
  'admin@school.edu.sg',
]
