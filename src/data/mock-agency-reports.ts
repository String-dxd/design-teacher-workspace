export type AgencyReportStatus =
  | 'draft'
  | 'pending_review'
  | 'edits_requested'
  | 'approved'

export type FieldRole = 'yh' | 'principal' | 'counsellor'
export type FieldType =
  | 'text'
  | 'narrative'
  | 'radio'
  | 'yesnona'
  | 'signature'

export interface ReportField {
  id: string
  label: string
  type: FieldType
  source?: string | null
  value?: string
  aiDraftable?: boolean
  stale?: boolean
  staleMsg?: string
  restricted?: boolean
  restrictedMsg?: string
  options?: Array<string>
  helper?: string
  // Stable cross-template key. When the user pre-fills from a prior
  // report, fields with the same prefillKey copy values across.
  prefillKey?: string
}

export type StaffRole = 'YH' | 'SC' | 'P' | 'VP' | 'FT'

export interface Staff {
  name: string
  role: StaffRole
  initials: string
}

export interface SectionAssignment extends Staff {
  completed?: boolean
  completedDate?: string
}

export interface ReportSection {
  id: string
  title: string
  role: FieldRole
  fields: Array<ReportField>
  assignedTo?: SectionAssignment
}

export const MOCK_STAFF: Array<Staff> = [
  { name: 'Mr Daniel Tan', role: 'YH', initials: 'DT' },
  { name: 'Ms Sarah Chen', role: 'SC', initials: 'SC' },
  { name: 'Mrs Jenny Lim', role: 'P', initials: 'JL' },
  { name: 'Mr Ahmad Rizal', role: 'FT', initials: 'AR' },
  { name: 'Ms Priya Nair', role: 'VP', initials: 'PN' },
]

export const CURRENT_USER: Staff = MOCK_STAFF[0]

export type TemplateCategoryLabel =
  | 'Care & Placement'
  | 'Family & Social Services'
  | 'Mental Health'
  | 'Offences & Law Enforcement'

export interface AgencyTemplate {
  id: string
  agency: string
  name: string
  abbrev: string
  color: string
  category: TemplateCategoryLabel
  locked?: boolean
  totalFields: number
  autoFilled: number
  pages: number
  turnaroundDays: number
  pdfPreview?: string
  templateFile?: string
  sections: Array<ReportSection>
}

export interface AgencyReport {
  id: string
  studentId: string
  templateId: string
  templateName: string
  agency: string
  status: AgencyReportStatus
  createdAt: Date
  startedAt?: Date
  passwordSaved: boolean
  password?: string
  principalNote?: string
  // Snapshot of cross-template values keyed by prefillKey. Approved/Sent
  // reports expose this so future reports can be pre-filled from them.
  prefillData?: Record<string, string>
}

export interface AiSourceItem {
  id: string
  system: 'Case Sync' | 'TCI' | 'School Cockpit'
  label: string
  date?: string
  defaultSelected: boolean
  // Maps to AI_DRAFT_CITATIONS[fieldId][num] when this source corresponds
  // to one of the canonical citations.
  citationNum?: number
  href: string
}

export interface DataSource {
  id: string
  name: string
  desc: string
  lastUpdated: string
  checked: boolean
}

export const AGENCY_TEMPLATES: Array<AgencyTemplate> = [
  {
    id: 'cps',
    agency: 'Child Protective Service',
    name: 'MSF CPS Annex A',
    abbrev: 'CPS',
    color: '#dc2626',
    category: 'Family & Social Services',
    totalFields: 32,
    autoFilled: 22,
    pages: 4,
    turnaroundDays: 5,
    templateFile: '/report-templates/cps.docx',
    sections: [
      {
        id: 'particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'name',
            label: 'Full Name of Student',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'dob',
            label: 'Date of Birth',
            type: 'text',
            source: 'EduHub',
            value: '4 Jan 2010',
          },
          {
            id: 'age',
            label: 'Age',
            type: 'text',
            source: 'EduHub',
            value: '16',
          },
          {
            id: 'gender',
            label: 'Gender',
            type: 'text',
            source: 'EduHub',
            value: 'Male',
          },
          {
            id: 'school',
            label: 'Name of School',
            type: 'text',
            source: 'EduHub',
            value: 'Bandung Secondary School',
          },
          {
            id: 'class',
            label: 'Class',
            type: 'text',
            source: 'School Cockpit',
            value: '3A',
          },
          {
            id: 'citizenship',
            label: 'Citizenship',
            type: 'text',
            source: 'EduHub',
            value: 'Singapore citizen',
          },
        ],
      },
      {
        id: 'family',
        title: 'Family Background',
        role: 'yh',
        fields: [
          {
            id: 'fatherName',
            label: "Father's Name",
            type: 'text',
            source: 'School Cockpit',
            value: 'Mr Chen Wei Ming',
          },
          {
            id: 'motherName',
            label: "Mother's Name",
            type: 'text',
            source: 'School Cockpit',
            value: 'Mdm Tan Siew Lan',
          },
          {
            id: 'custody',
            label: 'Custody Arrangement',
            type: 'text',
            source: 'School Cockpit',
            value: 'Both Parents',
          },
          {
            id: 'housing',
            label: 'Housing Type',
            type: 'text',
            source: 'School Cockpit',
            value: 'HDB 3-room',
            stale: true,
            staleMsg: 'Last updated 14 months ago',
          },
          {
            id: 'fas',
            label: 'Financial Assistance',
            type: 'text',
            source: 'School Cockpit',
            value: 'MOE FAS',
          },
          {
            id: 'income',
            label: 'Monthly Household Income',
            type: 'text',
            source: 'School Cockpit',
            value: '$1,800',
          },
          {
            id: 'occupation',
            label: 'Parent Occupation',
            type: 'text',
            source: null,
            value: '',
            restricted: true,
            restrictedMsg: 'Access-restricted in SC',
          },
        ],
      },
      {
        id: 'attendance',
        title: 'Attendance & Conduct',
        role: 'yh',
        fields: [
          {
            id: 'attendPct',
            label: 'Attendance Rate (%)',
            type: 'text',
            source: 'School Cockpit',
            value: '83%',
          },
          {
            id: 'daysPresent',
            label: 'Days Present / Total',
            type: 'text',
            source: 'School Cockpit',
            value: '39 / 47',
          },
          {
            id: 'late',
            label: 'Late-coming Instances',
            type: 'text',
            source: 'School Cockpit',
            value: '12',
          },
          {
            id: 'offences',
            label: 'Number of Offences',
            type: 'text',
            source: 'School Cockpit',
            value: '3',
          },
          {
            id: 'conduct',
            label: 'Overall Conduct Grade',
            type: 'text',
            source: 'School Cockpit',
            value: 'Poor',
          },
        ],
      },
      {
        id: 'observations',
        title: 'Behavioural Observations',
        role: 'yh',
        fields: [
          {
            id: 'behaviour',
            label: "School's Observations on Student's Behaviour",
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'triggers',
            label: 'Known Behavioural Triggers',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'counsellor',
        title: "Counsellor's Input",
        role: 'counsellor',
        fields: [
          {
            id: 'interventions',
            label: 'Intervention Plans',
            type: 'narrative',
          },
          {
            id: 'sessions',
            label: 'Number of Sessions',
            type: 'text',
            source: 'Case Sync',
            value: '8',
          },
        ],
      },
      {
        id: 'principal',
        title: "Principal's Comments",
        role: 'principal',
        fields: [
          {
            id: 'pRemarks',
            label: "Principal's Assessment",
            type: 'narrative',
          },
          {
            id: 'confidential',
            label: 'Confidential Information (P-level only)',
            type: 'narrative',
          },
        ],
      },
    ],
  },
  {
    id: 'msf-probation',
    agency: 'Probation Service, MSF',
    name: 'MSF Probation School Report',
    abbrev: 'MSF-P',
    color: '#0064ff',
    category: 'Offences & Law Enforcement',
    totalFields: 22,
    autoFilled: 14,
    pages: 3,
    turnaroundDays: 7,
    templateFile: '/report-templates/msf-probation.docx',
    sections: [
      {
        id: 'msfp-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'msfp-name',
            label: 'Full Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'msfp-nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'msfp-school',
            label: 'School',
            type: 'text',
            source: 'EduHub',
            value: 'Bandung Secondary School',
          },
        ],
      },
      {
        id: 'msfp-conduct',
        title: 'Conduct & Disciplinary Record',
        role: 'yh',
        fields: [
          {
            id: 'msfp-offences',
            label: 'Disciplinary Offences',
            type: 'text',
            source: 'School Cockpit',
            value: '3',
          },
          {
            id: 'msfp-conduct',
            label: 'Conduct Grade',
            type: 'text',
            source: 'School Cockpit',
            value: 'Poor',
          },
          {
            id: 'msfp-remarks',
            label: 'School Remarks on Behaviour',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'msfp-principal',
        title: "Principal's Statement",
        role: 'principal',
        fields: [
          {
            id: 'msfp-statement',
            label: "Principal's Statement",
            type: 'narrative',
          },
        ],
      },
    ],
  },
  {
    id: 'msf-psv',
    agency: 'Ministry of Social and Family Development (PSV)',
    name: 'MSF PSV Annex A',
    abbrev: 'PSV',
    color: '#0064ff',
    category: 'Family & Social Services',
    totalFields: 18,
    autoFilled: 12,
    pages: 2,
    turnaroundDays: 3,
    templateFile: '/report-templates/msf-psv.docx',
    sections: [
      {
        id: 'psv-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'psv-name',
            label: 'Student Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'psv-nric',
            label: 'NRIC',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'psv-class',
            label: 'Class',
            type: 'text',
            source: 'School Cockpit',
            value: '3A',
          },
        ],
      },
      {
        id: 'psv-report',
        title: 'School Report',
        role: 'yh',
        fields: [
          {
            id: 'psv-attendance',
            label: 'Attendance Rate',
            type: 'text',
            source: 'School Cockpit',
            value: '83%',
          },
          {
            id: 'psv-behaviour',
            label: 'Behavioural Summary',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'spf',
    agency: 'Singapore Police Force',
    name: 'SPF Annex F',
    abbrev: 'SPF',
    color: '#1e40af',
    category: 'Offences & Law Enforcement',
    totalFields: 20,
    autoFilled: 14,
    pages: 2,
    turnaroundDays: 3,
    templateFile: '/report-templates/spf.docx',
    sections: [
      {
        id: 'spf-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'spf-name',
            label: 'Full Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'spf-nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'spf-dob',
            label: 'Date of Birth',
            type: 'text',
            source: 'EduHub',
            value: '4 Jan 2010',
          },
          {
            id: 'spf-address',
            label: 'Home Address',
            type: 'text',
            source: 'School Cockpit',
            value: '',
          },
        ],
      },
      {
        id: 'spf-school',
        title: 'School Information',
        role: 'yh',
        fields: [
          {
            id: 'spf-attendance',
            label: 'Attendance Rate',
            type: 'text',
            source: 'School Cockpit',
            value: '83%',
          },
          {
            id: 'spf-offences',
            label: 'School Offences',
            type: 'text',
            source: 'School Cockpit',
            value: '3',
          },
          {
            id: 'spf-conduct',
            label: 'Conduct Grade',
            type: 'text',
            source: 'School Cockpit',
            value: 'Poor',
          },
          {
            id: 'spf-observations',
            label: "School's Observations",
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'spf-principal',
        title: "Principal's Declaration",
        role: 'principal',
        fields: [
          {
            id: 'spf-declaration',
            label: "Principal's Declaration",
            type: 'narrative',
          },
        ],
      },
    ],
  },
  {
    id: 'cnb',
    agency: 'Central Narcotics Bureau',
    name: 'CNB Annex F',
    abbrev: 'CNB',
    color: '#b45309',
    category: 'Offences & Law Enforcement',
    totalFields: 18,
    autoFilled: 12,
    pages: 2,
    turnaroundDays: 5,
    templateFile: '/report-templates/cnb.docx',
    sections: [
      {
        id: 'cnb-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'cnb-name',
            label: 'Full Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'cnb-nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'cnb-dob',
            label: 'Date of Birth',
            type: 'text',
            source: 'EduHub',
            value: '4 Jan 2010',
          },
          {
            id: 'cnb-school',
            label: 'School',
            type: 'text',
            source: 'EduHub',
            value: 'Bandung Secondary School',
          },
        ],
      },
      {
        id: 'cnb-school-info',
        title: 'School Assessment',
        role: 'yh',
        fields: [
          {
            id: 'cnb-attendance',
            label: 'Attendance Rate',
            type: 'text',
            source: 'School Cockpit',
            value: '83%',
          },
          {
            id: 'cnb-conduct',
            label: 'Conduct Grade',
            type: 'text',
            source: 'School Cockpit',
            value: 'Poor',
          },
          {
            id: 'cnb-observations',
            label: 'Behavioural Observations',
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'cnb-risk',
            label: 'Risk Indicators Observed',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'imh-cgc',
    agency: 'Institute of Mental Health / Child Guidance Clinic',
    name: 'IMH CGC School Report',
    abbrev: 'IMH',
    color: '#7c3aed',
    category: 'Mental Health',
    locked: true,
    totalFields: 26,
    autoFilled: 16,
    pages: 3,
    turnaroundDays: 7,
    templateFile: '/report-templates/imh-cgc.docx',
    sections: [
      {
        id: 'imh-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'imh-name',
            label: 'Patient / Student Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'imh-nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'imh-dob',
            label: 'Date of Birth',
            type: 'text',
            source: 'EduHub',
            value: '4 Jan 2010',
          },
          {
            id: 'imh-school',
            label: 'School',
            type: 'text',
            source: 'EduHub',
            value: 'Bandung Secondary School',
          },
        ],
      },
      {
        id: 'imh-wellbeing',
        title: 'Socio-Emotional Wellbeing',
        role: 'yh',
        fields: [
          {
            id: 'imh-tci',
            label: 'TCI Wellbeing Flags',
            type: 'text',
            source: 'TCI',
            value: 'Low mood (2 terms)',
          },
          {
            id: 'imh-behaviour',
            label: 'Observed Behaviour at School',
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'imh-peer',
            label: 'Peer Relationships',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'imh-counsellor',
        title: "Counsellor's Summary",
        role: 'counsellor',
        fields: [
          {
            id: 'imh-sessions',
            label: 'No. of Counselling Sessions',
            type: 'text',
            source: 'Case Sync',
            value: '8',
          },
          {
            id: 'imh-summary',
            label: 'Counselling Summary',
            type: 'narrative',
          },
        ],
      },
      {
        id: 'imh-principal',
        title: "School Leader's Endorsement",
        role: 'principal',
        fields: [
          {
            id: 'imh-endorse',
            label: "Principal's Endorsement",
            type: 'narrative',
          },
        ],
      },
    ],
  },
  {
    id: 'reach',
    agency: 'National University Hospital',
    name: 'NUH REACH Referral Response',
    abbrev: 'REACH',
    color: '#059669',
    category: 'Mental Health',
    totalFields: 22,
    autoFilled: 14,
    pages: 3,
    turnaroundDays: 5,
    templateFile: '/report-templates/reach.doc',
    sections: [
      {
        id: 'reach-particulars',
        title: 'Student Information',
        role: 'yh',
        fields: [
          {
            id: 'reach-name',
            label: 'Student Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'reach-nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'reach-dob',
            label: 'Date of Birth',
            type: 'text',
            source: 'EduHub',
            value: '4 Jan 2010',
          },
          {
            id: 'reach-school',
            label: 'School',
            type: 'text',
            source: 'EduHub',
            value: 'Bandung Secondary School',
          },
        ],
      },
      {
        id: 'reach-referral',
        title: 'Reason for Referral',
        role: 'yh',
        fields: [
          {
            id: 'reach-reason',
            label: 'Presenting Concerns',
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'reach-history',
            label: 'Background History',
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'reach-previous',
            label: 'Previous Mental Health Support',
            type: 'text',
            source: 'Case Sync',
            value: 'School counselling since Jan 2025',
          },
        ],
      },
      {
        id: 'reach-counsellor',
        title: "Counsellor's Input",
        role: 'counsellor',
        fields: [
          {
            id: 'reach-sessions',
            label: 'Number of Sessions',
            type: 'text',
            source: 'Case Sync',
            value: '8',
          },
          {
            id: 'reach-notes',
            label: 'Clinical Notes Summary',
            type: 'narrative',
          },
        ],
      },
    ],
  },
  {
    id: 'sps',
    agency: 'Singapore Prison Service',
    name: 'SPS School Information Request',
    abbrev: 'SPS',
    color: '#374151',
    category: 'Offences & Law Enforcement',
    totalFields: 16,
    autoFilled: 10,
    pages: 2,
    turnaroundDays: 3,
    templateFile: '/report-templates/sps.docx',
    sections: [
      {
        id: 'sps-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'sps-name',
            label: 'Full Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'sps-nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'sps-school',
            label: 'School',
            type: 'text',
            source: 'EduHub',
            value: 'Bandung Secondary School',
          },
        ],
      },
      {
        id: 'sps-info',
        title: 'School Information',
        role: 'yh',
        fields: [
          {
            id: 'sps-attendance',
            label: 'Attendance Rate',
            type: 'text',
            source: 'School Cockpit',
            value: '83%',
          },
          {
            id: 'sps-conduct',
            label: 'Conduct Grade',
            type: 'text',
            source: 'School Cockpit',
            value: 'Poor',
          },
          {
            id: 'sps-offences',
            label: 'Disciplinary Offences',
            type: 'text',
            source: 'School Cockpit',
            value: '3',
          },
          {
            id: 'sps-remarks',
            label: 'School Remarks',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'children-home',
    agency: "Children's Home",
    name: "MSF Children's Home School Report",
    abbrev: 'CH',
    color: '#d97706',
    category: 'Care & Placement',
    totalFields: 70,
    autoFilled: 16,
    pages: 8,
    turnaroundDays: 10,
    pdfPreview: '/report-previews/children-home.pdf',
    templateFile: '/report-templates/children-home.pdf',
    sections: [
      {
        id: 'ch-purpose',
        title: 'Purpose',
        role: 'yh',
        fields: [
          {
            id: 'ch-purpose-type',
            label: 'Purpose of report',
            type: 'radio',
            options: [
              'Pre-FGO Screening',
              'FGO Social Investigation',
              'Others',
            ],
          },
          {
            id: 'ch-purpose-other',
            label: 'If Others, please specify',
            type: 'text',
          },
        ],
      },
      {
        id: 'ch-particulars',
        title: "Student's Personal Particulars",
        role: 'yh',
        fields: [
          {
            id: 'ch-name',
            label: 'Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
            prefillKey: 'studentName',
          },
          {
            id: 'ch-nric',
            label: 'NRIC / BC No.',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
            prefillKey: 'nric',
          },
          {
            id: 'ch-class',
            label: 'Class',
            type: 'text',
            source: 'School Cockpit',
            value: '3A',
            prefillKey: 'class',
          },
          {
            id: 'ch-school',
            label: 'School',
            type: 'text',
            source: 'EduHub',
            value: 'Bandung Secondary School',
            prefillKey: 'school',
          },
          {
            id: 'ch-school-address',
            label: "School's Address",
            type: 'text',
            source: 'EduHub',
            value: '21 Jurong West Avenue 1, Singapore 649520',
          },
        ],
      },
      {
        id: 'ch-attendance',
        title: 'Attendance',
        role: 'yh',
        fields: [
          // Sec 1
          {
            id: 'ch-att-rating-sec1',
            label: 'Secondary 1 — Attendance rating',
            type: 'radio',
            options: ['Very Regular', 'Regular', 'Irregular'],
          },
          {
            id: 'ch-att-present-sec1',
            label: 'Sec 1 — Days present / total',
            type: 'text',
            source: 'School Cockpit',
            value: '186 / 190',
          },
          {
            id: 'ch-att-late-sec1',
            label: 'Sec 1 — Days late',
            type: 'text',
            source: 'School Cockpit',
            value: '4',
          },
          {
            id: 'ch-att-absent-sec1',
            label: 'Sec 1 — Days absent without valid reasons',
            type: 'text',
            source: 'School Cockpit',
            value: '0',
          },
          // Sec 2
          {
            id: 'ch-att-rating-sec2',
            label: 'Secondary 2 — Attendance rating',
            type: 'radio',
            options: ['Very Regular', 'Regular', 'Irregular'],
          },
          {
            id: 'ch-att-present-sec2',
            label: 'Sec 2 — Days present / total',
            type: 'text',
            source: 'School Cockpit',
            value: '178 / 190',
          },
          {
            id: 'ch-att-late-sec2',
            label: 'Sec 2 — Days late',
            type: 'text',
            source: 'School Cockpit',
            value: '8',
          },
          {
            id: 'ch-att-absent-sec2',
            label: 'Sec 2 — Days absent without valid reasons',
            type: 'text',
            source: 'School Cockpit',
            value: '2',
          },
          // Sec 3 (current year)
          {
            id: 'ch-att-rating-sec3',
            label: 'Secondary 3 — Attendance rating (current)',
            type: 'radio',
            options: ['Very Regular', 'Regular', 'Irregular'],
            prefillKey: 'attendanceRating',
          },
          {
            id: 'ch-att-present-sec3',
            label: 'Sec 3 — Days present / total',
            type: 'text',
            source: 'School Cockpit',
            value: '39 / 47',
          },
          {
            id: 'ch-att-late-sec3',
            label: 'Sec 3 — Days late',
            type: 'text',
            source: 'School Cockpit',
            value: '12',
          },
          {
            id: 'ch-att-absent-sec3',
            label: 'Sec 3 — Days absent without valid reasons',
            type: 'text',
            source: 'School Cockpit',
            value: '5',
          },
          // Final year only — leaving info
          {
            id: 'ch-att-date-left',
            label: 'Date left school (for ex-students)',
            type: 'text',
          },
          {
            id: 'ch-att-reason-leaving',
            label: 'Reason for leaving school',
            type: 'narrative',
          },
          {
            id: 'ch-att-withdrawn-by',
            label: 'Withdrawn by (if applicable)',
            type: 'text',
          },
        ],
      },
      {
        id: 'ch-conduct',
        title: 'Conduct',
        role: 'yh',
        fields: [
          // Positive
          { id: 'ch-cond-responsive', label: 'Responsive', type: 'yesnona' },
          { id: 'ch-cond-responsible', label: 'Responsible', type: 'yesnona' },
          { id: 'ch-cond-polite', label: 'Polite', type: 'yesnona' },
          { id: 'ch-cond-honest', label: 'Honest', type: 'yesnona' },
          { id: 'ch-cond-helpful', label: 'Helpful', type: 'yesnona' },
          { id: 'ch-cond-attentive', label: 'Attentive', type: 'yesnona' },
          {
            id: 'ch-cond-hardworking',
            label: 'Hardworking',
            type: 'yesnona',
          },
          { id: 'ch-cond-respectful', label: 'Respectful', type: 'yesnona' },
          {
            id: 'ch-cond-peers',
            label: 'Problems with peers',
            type: 'yesnona',
          },
          {
            id: 'ch-cond-teachers',
            label: 'Problems with teachers',
            type: 'yesnona',
          },
          // Negative
          {
            id: 'ch-cond-gangs',
            label: 'Associates with gangs',
            type: 'yesnona',
          },
          { id: 'ch-cond-truancy', label: 'Truancy', type: 'yesnona' },
          {
            id: 'ch-cond-fights',
            label: 'Engages in fights',
            type: 'yesnona',
          },
          {
            id: 'ch-cond-pilfers',
            label: 'Pilfers / steals',
            type: 'yesnona',
          },
          { id: 'ch-cond-smokes', label: 'Smokes', type: 'yesnona' },
          {
            id: 'ch-cond-substances',
            label: 'Abuses other substances',
            type: 'yesnona',
          },
          {
            id: 'ch-cond-defies',
            label: 'Defies authority',
            type: 'yesnona',
          },
          {
            id: 'ch-cond-resists-counselling',
            label: 'Resists school counselling',
            type: 'yesnona',
          },
          { id: 'ch-cond-bullies', label: 'Bullies', type: 'yesnona' },
          // Overall conduct per year
          {
            id: 'ch-cond-overall-sec1',
            label: 'Secondary 1 — Overall conduct',
            type: 'radio',
            options: ['Excellent', 'Good', 'Fair', 'Poor'],
          },
          {
            id: 'ch-cond-overall-sec2',
            label: 'Secondary 2 — Overall conduct',
            type: 'radio',
            options: ['Excellent', 'Good', 'Fair', 'Poor'],
          },
          {
            id: 'ch-cond-overall-sec3',
            label: 'Secondary 3 — Overall conduct',
            type: 'radio',
            options: ['Excellent', 'Good', 'Fair', 'Poor'],
            prefillKey: 'overallConduct',
          },
          {
            id: 'ch-cond-comments',
            label: 'Comments, if any',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'ch-academic',
        title: 'Academic Performance & CCA',
        role: 'yh',
        fields: [
          {
            id: 'ch-acad-sec1',
            label: 'Secondary 1 — Academic performance',
            type: 'radio',
            options: ['Good', 'Satisfactory', 'Poor'],
          },
          {
            id: 'ch-acad-sec2',
            label: 'Secondary 2 — Academic performance',
            type: 'radio',
            options: ['Good', 'Satisfactory', 'Poor'],
          },
          {
            id: 'ch-acad-sec3',
            label: 'Secondary 3 — Academic performance',
            type: 'radio',
            options: ['Good', 'Satisfactory', 'Poor'],
            prefillKey: 'academicPerformance',
          },
          {
            id: 'ch-acad-remarks',
            label: 'Other remarks pertaining to academic performance',
            type: 'narrative',
          },
          {
            id: 'ch-cca-activities',
            label: 'CCA / Activities student participated in',
            type: 'narrative',
          },
          {
            id: 'ch-cca-positions',
            label: 'Positions held',
            type: 'text',
          },
          {
            id: 'ch-cca-attendance',
            label: 'CCA attendance',
            type: 'text',
          },
          {
            id: 'ch-cca-behaviour',
            label: 'Behaviour at CCA',
            type: 'narrative',
          },
        ],
      },
      {
        id: 'ch-other-comments',
        title: 'Other Comments',
        role: 'yh',
        fields: [
          // Parents/Guardians
          {
            id: 'ch-par-cooperative',
            label: 'Parents / guardians are co-operative',
            type: 'yesnona',
          },
          {
            id: 'ch-par-control',
            label: 'Parents / guardians are able to exert control',
            type: 'yesnona',
          },
          {
            id: 'ch-par-acknowledge',
            label: "Parents / guardians acknowledge the offender's wrongdoing",
            type: 'yesnona',
          },
          {
            id: 'ch-par-inconsistent',
            label:
              'Parents / guardians are inconsistent in their approach to discipline',
            type: 'yesnona',
          },
          {
            id: 'ch-par-other',
            label: 'Other parental observations (please provide details)',
            type: 'narrative',
          },
          // Other Information — adverse family records
          {
            id: 'ch-fam-criminal',
            label: 'An immediate family member has a criminal record',
            type: 'yesnona',
          },
          {
            id: 'ch-fam-drug',
            label: 'There is information of drug abuse in the family',
            type: 'yesnona',
          },
          {
            id: 'ch-fam-sexual',
            label: 'There is information of sexual abuse in the family',
            type: 'yesnona',
          },
          {
            id: 'ch-fam-physical',
            label: 'There is information of physical abuse in the family',
            type: 'yesnona',
          },
          {
            id: 'ch-fam-other',
            label: 'Other family observations (please provide details)',
            type: 'narrative',
            helper: 'NA — Information is not available to the school.',
          },
        ],
      },
      {
        id: 'ch-care',
        title: 'Care Arrangements',
        role: 'yh',
        fields: [
          {
            id: 'ch-care-arrangements',
            label:
              "The student's care arrangements, if known to the school (e.g. whether the student is staying with someone with whom he shares a strong emotional bond)",
            type: 'narrative',
          },
        ],
      },
      {
        id: 'ch-health',
        title: "Student's Health",
        role: 'yh',
        fields: [
          {
            id: 'ch-health-medical',
            label: 'Any known medical problems (please provide details)',
            type: 'narrative',
          },
          {
            id: 'ch-health-bizarre',
            label:
              'Extremely bizarre behaviour (hallucinations, delusions, etc.)',
            type: 'yesnona',
          },
          {
            id: 'ch-health-violent',
            label: 'Extremely violent behaviour',
            type: 'yesnona',
          },
          {
            id: 'ch-health-suicidal',
            label:
              'Suicidal inclinations / attempt or clear plan to commit suicide',
            type: 'yesnona',
          },
          {
            id: 'ch-health-substance',
            label: 'Obvious addiction to substances',
            type: 'yesnona',
          },
          {
            id: 'ch-health-depression',
            label: 'Depression',
            type: 'yesnona',
          },
          {
            id: 'ch-health-other',
            label: 'Other psychiatric concerns (please provide details)',
            type: 'narrative',
            helper: 'NA — Information is not available to the school.',
          },
        ],
      },
      {
        id: 'ch-counselling',
        title: 'Counselling',
        role: 'counsellor',
        fields: [
          { id: 'ch-couns-programme', label: 'Name / type of programme', type: 'text' },
          {
            id: 'ch-couns-duration',
            label: 'Duration / frequency (start–end date)',
            type: 'text',
          },
          {
            id: 'ch-couns-persons',
            label: 'Persons involved (e.g. parent, friend)',
            type: 'text',
          },
          { id: 'ch-couns-name', label: 'Name of counsellor', type: 'text' },
          {
            id: 'ch-couns-quals',
            label: 'Qualifications of counsellor',
            type: 'text',
          },
          {
            id: 'ch-couns-contact',
            label: "Counsellor's contact details",
            type: 'text',
          },
          {
            id: 'ch-couns-other',
            label: 'Any other details which will be of assistance',
            type: 'narrative',
          },
        ],
      },
      {
        id: 'ch-other',
        title: 'Other Information',
        role: 'yh',
        fields: [
          {
            id: 'ch-other-info',
            label:
              'Any other information which may assist the student and the person in charge of the present investigation',
            type: 'narrative',
          },
        ],
      },
      {
        id: 'ch-teacher',
        title: 'Teacher / Person Preparing the Report',
        role: 'yh',
        fields: [
          {
            id: 'ch-teacher-name',
            label: 'Name',
            type: 'text',
            value: 'Mr Daniel Tan',
          },
          {
            id: 'ch-teacher-appointment',
            label: 'Appointment',
            type: 'text',
            value: 'Year Head, Secondary 3',
          },
          {
            id: 'ch-teacher-years',
            label: 'No. of years student known',
            type: 'text',
          },
          {
            id: 'ch-teacher-signature',
            label: 'Signature',
            type: 'signature',
          },
          {
            id: 'ch-teacher-date',
            label: 'Date',
            type: 'text',
            value: '24 Apr 2026',
          },
        ],
      },
      {
        id: 'ch-principal',
        title: "Principal's Comments",
        role: 'principal',
        fields: [
          { id: 'ch-principal-name', label: 'Name', type: 'text' },
          {
            id: 'ch-principal-tel',
            label: 'Tel / Fax numbers',
            type: 'text',
          },
          {
            id: 'ch-principal-comments',
            label: 'Comments on report, if any',
            type: 'narrative',
          },
          {
            id: 'ch-principal-signature',
            label: 'Signature and date',
            type: 'signature',
          },
        ],
      },
    ],
  },
  {
    id: 'assq',
    agency: 'National University Hospital',
    name: 'NUH ASSQ Form',
    abbrev: 'ASSQ',
    color: '#9333ea',
    category: 'Mental Health',
    totalFields: 30,
    autoFilled: 8,
    pages: 2,
    turnaroundDays: 3,
    pdfPreview: '/report-previews/assq.pdf',
    templateFile: '/report-templates/assq.pdf',
    sections: [
      {
        id: 'assq-info',
        title: 'Child Information',
        role: 'yh',
        fields: [
          {
            id: 'assq-name',
            label: 'Name of Child',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'assq-dob',
            label: 'Date of Birth',
            type: 'text',
            source: 'EduHub',
            value: '4 Jan 2010',
          },
          {
            id: 'assq-rater',
            label: 'Name of Rater (Teacher)',
            type: 'text',
            source: null,
            value: '',
          },
          {
            id: 'assq-date',
            label: 'Date of Rating',
            type: 'text',
            source: null,
            value: '',
          },
        ],
      },
      {
        id: 'assq-items',
        title: 'ASSQ Items (27-item scale)',
        role: 'yh',
        fields: [
          {
            id: 'assq-1',
            label: '1. Is old-fashioned or precocious',
            type: 'text',
            source: null,
            value: '',
          },
          {
            id: 'assq-2',
            label: '2. Is regarded as an "eccentric professor"',
            type: 'text',
            source: null,
            value: '',
          },
          {
            id: 'assq-3',
            label: '3. Lives somewhat in a world of his/her own',
            type: 'text',
            source: null,
            value: '',
          },
          {
            id: 'assq-4',
            label: '4. Accumulates facts on certain topics',
            type: 'text',
            source: null,
            value: '',
          },
          {
            id: 'assq-5',
            label: '5. Has a literal understanding of ambiguous language',
            type: 'text',
            source: null,
            value: '',
          },
          {
            id: 'assq-note',
            label: 'Rating guide: No = 0, Somewhat = 1, Yes = 2',
            type: 'text',
            source: null,
            value: '(Rate all 27 items using 0/1/2 scale)',
          },
        ],
      },
    ],
  },
  {
    id: 'sc-swo-a',
    agency: 'Child Protective Service',
    name: 'MSF CPS Interview Template A',
    abbrev: 'CPS',
    color: '#0064ff',
    category: 'Family & Social Services',
    totalFields: 20,
    autoFilled: 14,
    pages: 2,
    turnaroundDays: 5,
    templateFile: '/report-templates/sc-swo-a.docx',
    sections: [
      {
        id: 'swoa-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'swoa-name',
            label: 'Student Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'swoa-nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'swoa-class',
            label: 'Class',
            type: 'text',
            source: 'School Cockpit',
            value: '3A',
          },
        ],
      },
      {
        id: 'swoa-known',
        title: 'Existing Case Information',
        role: 'counsellor',
        fields: [
          {
            id: 'swoa-case',
            label: 'Existing Case Reference',
            type: 'text',
            source: 'Case Sync',
            value: '',
          },
          { id: 'swoa-summary', label: 'Case Summary', type: 'narrative' },
          { id: 'swoa-progress', label: 'Progress to Date', type: 'narrative' },
        ],
      },
      {
        id: 'swoa-principal',
        title: "Principal's Endorsement",
        role: 'principal',
        fields: [
          {
            id: 'swoa-endorse',
            label: "Principal's Endorsement",
            type: 'narrative',
          },
        ],
      },
    ],
  },
  {
    id: 'sc-swo-b',
    agency: 'Child Protective Service',
    name: 'MSF CPS Interview Template B',
    abbrev: 'CPS',
    color: '#0064ff',
    category: 'Family & Social Services',
    totalFields: 18,
    autoFilled: 12,
    pages: 2,
    turnaroundDays: 5,
    templateFile: '/report-templates/sc-swo-b.docx',
    sections: [
      {
        id: 'swob-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'swob-name',
            label: 'Student Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'swob-nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'swob-class',
            label: 'Class',
            type: 'text',
            source: 'School Cockpit',
            value: '3A',
          },
        ],
      },
      {
        id: 'swob-new',
        title: 'New Referral Information',
        role: 'yh',
        fields: [
          {
            id: 'swob-reason',
            label: 'Reason for Referral',
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'swob-concerns',
            label: 'Presenting Concerns',
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'swob-history',
            label: 'Brief Background',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'swob-principal',
        title: "Principal's Endorsement",
        role: 'principal',
        fields: [
          {
            id: 'swob-endorse',
            label: "Principal's Endorsement",
            type: 'narrative',
          },
        ],
      },
    ],
  },
  {
    id: 'intake',
    agency: 'Child Protective Service',
    name: 'MSF CPS Intake Assessment (Part 1)',
    abbrev: 'CPS',
    color: '#0064ff',
    category: 'Family & Social Services',
    totalFields: 24,
    autoFilled: 16,
    pages: 3,
    turnaroundDays: 5,
    templateFile: '/report-templates/intake.docx',
    sections: [
      {
        id: 'intk-particulars',
        title: 'Client Particulars',
        role: 'yh',
        fields: [
          {
            id: 'intk-name',
            label: 'Client Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'intk-nric',
            label: 'NRIC / FIN',
            type: 'text',
            source: 'EduHub',
            value: 'S9101B',
          },
          {
            id: 'intk-dob',
            label: 'Date of Birth',
            type: 'text',
            source: 'EduHub',
            value: '4 Jan 2010',
          },
          {
            id: 'intk-school',
            label: 'School',
            type: 'text',
            source: 'EduHub',
            value: 'Bandung Secondary School',
          },
        ],
      },
      {
        id: 'intk-presenting',
        title: 'Presenting Issues',
        role: 'yh',
        fields: [
          {
            id: 'intk-issues',
            label: 'Presenting Issues',
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'intk-duration',
            label: 'Duration of Concerns',
            type: 'text',
            source: null,
            value: '',
          },
        ],
      },
      {
        id: 'intk-school',
        title: 'School Functioning',
        role: 'yh',
        fields: [
          {
            id: 'intk-attendance',
            label: 'Attendance Rate',
            type: 'text',
            source: 'School Cockpit',
            value: '83%',
          },
          {
            id: 'intk-conduct',
            label: 'Conduct Grade',
            type: 'text',
            source: 'School Cockpit',
            value: 'Poor',
          },
          {
            id: 'intk-behaviour',
            label: 'Behavioural Summary',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'msf-navh-intake',
    agency: 'National Anti-Violence Helpline',
    name: 'MSF NAVH Intake Assessment (Part 1)',
    abbrev: 'NAVH',
    color: '#0064ff',
    category: 'Family & Social Services',
    totalFields: 18,
    autoFilled: 10,
    pages: 3,
    turnaroundDays: 5,
    templateFile: '/report-templates/navh.docx',
    sections: [
      {
        id: 'nav-int-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'nav-int-name',
            label: 'Full Name of Student',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
          {
            id: 'nav-int-class',
            label: 'Class',
            type: 'text',
            source: 'School Cockpit',
            value: '3A',
          },
        ],
      },
      {
        id: 'nav-int-context',
        title: 'Intake Context',
        role: 'yh',
        fields: [
          {
            id: 'nav-int-summary',
            label: 'Summary of Concerns',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'msf-navh-a',
    agency: 'National Anti-Violence Helpline',
    name: 'MSF NAVH Interview Template A',
    abbrev: 'NAVH',
    color: '#0064ff',
    category: 'Family & Social Services',
    totalFields: 14,
    autoFilled: 8,
    pages: 2,
    turnaroundDays: 5,
    templateFile: '/report-templates/navh.docx',
    sections: [
      {
        id: 'nav-a-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'nav-a-name',
            label: 'Full Name of Student',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
        ],
      },
      {
        id: 'nav-a-interview',
        title: 'Interview Notes',
        role: 'yh',
        fields: [
          {
            id: 'nav-a-notes',
            label: 'Interview Notes',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'msf-navh-b',
    agency: 'National Anti-Violence Helpline',
    name: 'MSF NAVH Interview Template B',
    abbrev: 'NAVH',
    color: '#0064ff',
    category: 'Family & Social Services',
    totalFields: 14,
    autoFilled: 8,
    pages: 2,
    turnaroundDays: 5,
    templateFile: '/report-templates/navh.docx',
    sections: [
      {
        id: 'nav-b-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'nav-b-name',
            label: 'Full Name of Student',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
        ],
      },
      {
        id: 'nav-b-interview',
        title: 'Interview Notes',
        role: 'yh',
        fields: [
          {
            id: 'nav-b-notes',
            label: 'Interview Notes',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'spf-annex-n',
    agency: 'Singapore Police Force',
    name: 'SPF Annex N',
    abbrev: 'SPF',
    color: '#1e40af',
    category: 'Offences & Law Enforcement',
    totalFields: 16,
    autoFilled: 9,
    pages: 2,
    turnaroundDays: 5,
    templateFile: '/report-templates/spf.docx',
    sections: [
      {
        id: 'spfn-particulars',
        title: 'Student Particulars',
        role: 'yh',
        fields: [
          {
            id: 'spfn-name',
            label: 'Full Name of Student',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
          },
        ],
      },
      {
        id: 'spfn-conduct',
        title: 'Conduct Summary',
        role: 'yh',
        fields: [
          {
            id: 'spfn-notes',
            label: 'Conduct Notes',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
]

export const AI_DRAFTS: Record<string, string> = {
  behaviour:
    'Jun Kai has shown fluctuating behaviour patterns this term\u00B9. He is generally quiet in class but has had episodes of disruptive behaviour, particularly during unstructured periods\u00B2. He responds well to one-on-one conversations with trusted adults but can be withdrawn in group settings\u00B3. Teachers have noted improvement in class participation since the start of Term 2, though attendance remains a concern.',
  triggers:
    "Jun Kai's behavioural episodes tend to correlate with disruptions in his home environment\u00B9. Teachers have observed heightened agitation on Mondays and after school holidays\u00B2. Peer conflicts, particularly around group work, can also trigger withdrawal or outbursts.",
  reason:
    'Jun Kai is being referred for a comprehensive psychological assessment to better understand his social-emotional needs. He has been flagged for low mood across two consecutive terms via the Termly Check-In, and school counselling records indicate recurring themes around family stress and peer relationship difficulties.',
  history:
    'Jun Kai has been receiving fortnightly school-based counselling since January 2025. He has 2 active counselling cases (family and peer-related). He is on MOE FAS. Attendance has been declining (83% this term), with 12 late-coming instances and 3 recorded offences including truancy.',
  'msf-family-comp':
    "Jun Kai lives with both parents and a younger sibling in a 3-room HDB flat. The family is on MOE FAS with a monthly household income of approximately $1,800. The father is employed as a taxi driver and the mother is a part-time cleaner. Family dynamics appear stable on the surface but teachers have noted Jun Kai's mood dips after weekends, suggesting possible home stressors.",
  'msf-behaviour':
    'Jun Kai has shown a pattern of absenteeism and disruptive behaviour during the current academic year. He is generally cooperative when engaged one-on-one but struggles with group dynamics. His conduct grade is Poor, with 3 recorded offences including truancy.',
  'msfp-remarks':
    'Jun Kai has accumulated 3 disciplinary offences this term, including truancy. His conduct grade has declined from Fair to Poor over the past year. Teachers note that he is often truant on Mondays following disruptions at home.',
  'psv-behaviour':
    'Jun Kai demonstrates periodic disengagement from school activities. His attendance has fallen to 83% this term. Behavioural incidents include truancy and minor classroom disruptions.',
  'spf-observations':
    'Jun Kai has been flagged for truancy on multiple occasions this term. He responds well to authority figures in a calm setting. There are no known associations with gangs or organised groups. His peers describe him as a loner who occasionally gets into verbal arguments.',
  'cnb-observations':
    'No direct substance-use indicators observed. Jun Kai has been displaying withdrawal behaviour, altered moods, and unexplained absences which warrant monitoring. Teaching staff have not observed any paraphernalia or substance-related conversations.',
  'cnb-risk':
    'Risk indicators include social withdrawal, unexplained absenteeism, and peer group changes noted in Term 2. No confirmed substance use but risk profile warrants referral for further assessment.',
  'imh-behaviour':
    'Jun Kai has been observed to be withdrawn and occasionally tearful in class. He rarely participates in group activities and tends to isolate himself during recess. Two teachers have flagged concerns about his low affect and flat expression over the past two terms.',
  'imh-peer':
    'Jun Kai has limited peer connections in class. He does not appear to have close friends and has experienced some peer conflicts around group work. He has not reported bullying but teachers have observed exclusionary behaviour by peers on a few occasions.',
  'reach-reason':
    'Jun Kai is being referred to REACH due to persistent low mood flagged across two consecutive Termly Check-In cycles, recurring themes of family stress and social isolation in school counselling, and declining attendance. The school is concerned about his overall mental wellbeing and seeks a more intensive community mental health response.',
  'reach-history':
    'Jun Kai has been receiving fortnightly school-based counselling since January 2025, totalling 8 sessions. Two open cases are on record (family stressors and peer relationships). He is on MOE FAS. Attendance has declined to 83% with 12 late-coming instances. No previous REACH or other community mental health involvement noted.',
  'navh-behaviour':
    'Jun Kai has been absent without valid reason on several occasions, particularly on Monday mornings. He appears disengaged and has been observed with unfamiliar peers outside school. No confirmed substance-related incidents have been reported but the pattern of behaviour raises concern.',
  'navh-risk':
    'Potential risk indicators include unexplained absences, change in peer group, and withdrawal from school activities. No direct substance use observed. Referral is for early assessment and preventive intervention.',
  'sps-remarks':
    'Jun Kai has 3 recorded disciplinary offences including truancy. His conduct grade is Poor. He has been responsive to pastoral support from his Year Head and counsellor. The school is engaged with his case and has active intervention plans in place.',
  'ch-academic-perf':
    "Jun Kai's academic performance has been below average across subjects. He struggles with sustained focus and has missed key assessments due to absenteeism. Subject teachers note potential but inconsistent effort.",
  'ch-family-bg':
    "Jun Kai lives with both parents and a younger sibling in a 3-room HDB flat. The family receives MOE FAS support. There have been no reported incidents of family violence but teachers note that Jun Kai's mood is visibly affected by home circumstances.",
  'swob-reason':
    'Jun Kai is referred to the School Social Worker for support with persistent family stressors, declining school attendance, and socio-emotional difficulties. He has been engaged in school counselling but would benefit from a more holistic family-focused intervention.',
  'swob-concerns':
    'Presenting concerns include truancy (12 late-coming instances), poor conduct grade, low mood flagged in TCI, and social isolation. Family circumstances including low income and possible parental stress appear to be contributing factors.',
  'swob-history':
    'Jun Kai has been in school counselling since January 2025 with 8 sessions completed. Two active cases are on record. He has no prior SWO involvement. Family is cooperative with school outreach.',
  'intk-issues':
    'Jun Kai presents with a combination of school-related difficulties including truancy, declining academic performance, and socio-emotional challenges. He has been flagged for low mood over two consecutive terms.',
  'intk-behaviour':
    'Jun Kai demonstrates periodic withdrawal and mood fluctuations at school. He is generally cooperative with trusted adults but struggles with group interactions. His attendance has declined to 83% this term.',
  'nric-remarks':
    'Jun Kai is a Secondary 3 student with an attendance rate of 83% and a conduct grade of Poor. He is receiving school counselling and is on MOE FAS. He responds positively to pastoral engagement.',
}

export const DATA_SOURCES: Array<DataSource> = [
  {
    id: 'sc',
    name: 'School Cockpit',
    desc: 'Attendance, academics, family details, offences',
    lastUpdated: '19 Apr 2026',
    checked: true,
  },
  {
    id: 'eduhub',
    name: 'EduHub',
    desc: 'Student biodata, enrolment info',
    lastUpdated: '19 Apr 2026',
    checked: true,
  },
  {
    id: 'casesync',
    name: 'Case Sync',
    desc: 'Counselling case notes, intervention plans',
    lastUpdated: '17 Apr 2026',
    checked: true,
  },
  {
    id: 'tci',
    name: 'TCI',
    desc: 'Termly Check-In wellbeing data',
    lastUpdated: '15 Apr 2026',
    checked: true,
  },
]

export const mockAgencyReports: Array<AgencyReport> = [
  {
    id: 'ar-draft',
    studentId: '1',
    templateId: 'children-home',
    templateName: "MSF Children's Home School Report",
    agency: "Children's Home",
    status: 'draft',
    createdAt: new Date('2026-04-23'),
    startedAt: new Date('2026-04-23'),
    passwordSaved: false,
  },
  {
    id: 'ar-edits',
    studentId: '1',
    templateId: 'cps',
    templateName: 'CPS School Report',
    agency: 'Child Protective Service',
    status: 'edits_requested',
    createdAt: new Date('2026-04-20'),
    startedAt: new Date('2026-04-20'),
    passwordSaved: false,
    principalNote:
      'Please verify the attendance figures for Term 2 and add more detail to the behavioural observations section.',
  },
  {
    id: 'ar-approved',
    studentId: '1',
    templateId: 'intake',
    templateName: 'MSF CPS Intake Assessment (Part 1)',
    agency: 'Child Protective Service',
    status: 'approved',
    createdAt: new Date('2026-04-22'),
    startedAt: new Date('2026-04-22'),
    passwordSaved: true,
    password: 'SCRUBBED',
    prefillData: {
      studentName: 'Chen Jun Kai',
      nric: 'S9101B',
      class: '3A',
      school: 'Bandung Secondary School',
      attendanceRating: 'Regular',
      overallConduct: 'Fair',
      academicPerformance: 'Satisfactory',
    },
  },
  {
    id: 'ar-completed-cps',
    studentId: '1',
    templateId: 'cps',
    templateName: 'CPS School Report',
    agency: 'Child Protective Service',
    status: 'approved',
    createdAt: new Date('2026-02-12'),
    startedAt: new Date('2026-02-10'),
    passwordSaved: true,
    password: 'SCRUBBED',
    prefillData: {
      studentName: 'Chen Jun Kai',
      nric: 'S9101B',
      class: '3A',
      school: 'Bandung Secondary School',
      attendanceRating: 'Regular',
      overallConduct: 'Fair',
      academicPerformance: 'Satisfactory',
    },
  },
]

export const MOCK_AI_SOURCES: Array<AiSourceItem> = [
  {
    id: 'cs-1',
    system: 'Case Sync',
    label: 'Case note',
    date: '12 Mar 2026',
    defaultSelected: true,
    citationNum: 2,
    href: '#',
  },
  {
    id: 'cs-2',
    system: 'Case Sync',
    label: 'Case note',
    date: '5 Jan 2026',
    defaultSelected: true,
    href: '#',
  },
  {
    id: 'cs-3',
    system: 'Case Sync',
    label: 'Referral record',
    date: '15 Nov 2025',
    defaultSelected: false,
    href: '#',
  },
  {
    id: 'tci-1',
    system: 'TCI',
    label: 'Term 1 wellbeing check-in',
    date: '15 Apr 2026',
    defaultSelected: true,
    citationNum: 3,
    href: '#',
  },
  {
    id: 'tci-2',
    system: 'TCI',
    label: 'Term 4 2025 wellbeing check-in',
    date: '10 Oct 2025',
    defaultSelected: false,
    href: '#',
  },
  {
    id: 'sc-1',
    system: 'School Cockpit',
    label: 'Attendance record, Term 2 2026',
    defaultSelected: true,
    citationNum: 1,
    href: '#',
  },
  {
    id: 'sc-2',
    system: 'School Cockpit',
    label: 'Behavioural incident',
    date: '3 Mar 2026',
    defaultSelected: true,
    href: '#',
  },
]

export const AI_DRAFT_CITATIONS: Record<
  string,
  Array<{ num: number; source: string; detail: string }>
> = {
  behaviour: [
    {
      num: 1,
      source: 'School Cockpit',
      detail: 'Attendance record, Terms 1–2 2026',
    },
    { num: 2, source: 'Case Sync', detail: 'Case note, 12 Mar 2026' },
    { num: 3, source: 'TCI', detail: 'Term 1 wellbeing check-in' },
  ],
  triggers: [
    { num: 1, source: 'Case Sync', detail: 'Session notes, Jan–Apr 2026' },
    {
      num: 2,
      source: 'School Cockpit',
      detail: 'Attendance pattern, Terms 1–2 2026',
    },
  ],
  reason: [
    {
      num: 1,
      source: 'TCI',
      detail: 'Term 2 wellbeing check-in — flagged low mood',
    },
    { num: 2, source: 'Case Sync', detail: 'Counselling summary, Apr 2026' },
    {
      num: 3,
      source: 'School Cockpit',
      detail: 'Attendance record, Terms 1–2 2026',
    },
  ],
  history: [
    {
      num: 1,
      source: 'Case Sync',
      detail: '2 open cases — family and peer-related',
    },
    {
      num: 2,
      source: 'School Cockpit',
      detail: 'MOE FAS, attendance 83%, late-coming 12×',
    },
  ],
}

export const MOCK_COUNSELLOR = {
  name: 'Ms Sarah Chen',
  completedAt: '15 Apr 2026',
  fields: {
    interventions:
      'Jun Kai has been engaged in fortnightly individual counselling sessions since January 2025, focusing on family coping strategies and peer relationship skills. A structured support plan was developed in Term 1 2026 in consultation with his Year Head and parents. Progress has been gradual — Jun Kai has shown increased willingness to articulate concerns and has developed two coping strategies for managing stress.',
    sessions: '8',
  },
}

export function getAgencyReportsByStudent(
  studentId: string,
): Array<AgencyReport> {
  return mockAgencyReports.filter((r) => r.studentId === studentId)
}
