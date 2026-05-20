export type AgencyReportStatus =
  | 'draft'
  | 'pending_review'
  | 'edits_requested'
  | 'approved'

export type FieldRole = 'yh' | 'principal' | 'counsellor'
export type FieldType = 'text' | 'narrative' | 'radio' | 'yesnona' | 'signature'

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

export type StaffRole =
  | 'YH'
  | 'SC'
  | 'P'
  | 'VP'
  | 'FT'
  | 'CCA Teacher'
  | 'Subject Teacher'

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
  { name: 'Mr Lee Wei Kiat', role: 'CCA Teacher', initials: 'LW' },
]

export const CURRENT_USER: Staff = MOCK_STAFF[0]

// Collaborators on the active agency report. Hardcoded for the prototype —
// real wiring would derive from a per-report ACL.
export interface Collaborator extends Staff {
  email: string
  permission: 'edit' | 'comment' | 'view'
  isOwner?: boolean
}

export const MOCK_COLLABORATORS: Array<Collaborator> = [
  {
    name: 'Mr Daniel Tan',
    role: 'YH',
    initials: 'DT',
    email: 'daniel_tan@schools.gov.sg',
    permission: 'edit',
    isOwner: true,
  },
  {
    name: 'Ms Sarah Chen',
    role: 'SC',
    initials: 'SC',
    email: 'sarah_chen@schools.gov.sg',
    permission: 'edit',
  },
  {
    name: 'Mr Ahmad Rizal',
    role: 'CCA Teacher',
    initials: 'AR',
    email: 'ahmad_rizal@schools.gov.sg',
    permission: 'comment',
  },
  {
    name: 'Ms Lim Hui Ying',
    role: 'Subject Teacher',
    initials: 'LH',
    email: 'lim_hui_ying@schools.gov.sg',
    permission: 'comment',
  },
]

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
    autoFilled: 60,
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
            value: 'FGO Social Investigation',
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
            value: 'T1234567A',
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
            value: 'Temasek Secondary School',
            prefillKey: 'school',
          },
          {
            id: 'ch-school-address',
            label: "School's Address",
            type: 'text',
            source: 'EduHub',
            value: '2 Bedok South Road, Singapore 469296',
          },
        ],
      },
      {
        id: 'ch-attendance',
        title: 'Attendance',
        role: 'yh',
        fields: [
          // Secondary 1
          {
            id: 'ch-att-rating-sec1',
            label: 'Secondary 1 — Attendance rating',
            type: 'radio',
            options: ['Very Regular', 'Regular', 'Irregular'],
            value: 'Regular',
          },
          {
            id: 'ch-att-present-sec1',
            label:
              'Secondary 1 — No. of days present during the year (e.g. 90/100)',
            type: 'text',
            source: 'School Cockpit',
            value: '186 / 190',
          },
          {
            id: 'ch-att-late-sec1',
            label: 'Secondary 1 — No. of days late for school',
            type: 'text',
            source: 'School Cockpit',
            value: '4',
          },
          {
            id: 'ch-att-absent-sec1',
            label: 'Secondary 1 — No. of days absent without valid reasons',
            type: 'text',
            source: 'School Cockpit',
            value: '0',
          },
          // Secondary 2
          {
            id: 'ch-att-rating-sec2',
            label: 'Secondary 2 — Attendance rating',
            type: 'radio',
            options: ['Very Regular', 'Regular', 'Irregular'],
            value: 'Regular',
          },
          {
            id: 'ch-att-present-sec2',
            label:
              'Secondary 2 — No. of days present during the year (e.g. 90/100)',
            type: 'text',
            source: 'School Cockpit',
            value: '178 / 190',
          },
          {
            id: 'ch-att-late-sec2',
            label: 'Secondary 2 — No. of days late for school',
            type: 'text',
            source: 'School Cockpit',
            value: '8',
          },
          {
            id: 'ch-att-absent-sec2',
            label: 'Secondary 2 — No. of days absent without valid reasons',
            type: 'text',
            source: 'School Cockpit',
            value: '2',
          },
          // Secondary 3 (current)
          {
            id: 'ch-att-rating-sec3',
            label: 'Secondary 3 — Attendance rating (current)',
            type: 'radio',
            options: ['Very Regular', 'Regular', 'Irregular'],
            value: 'Irregular',
            prefillKey: 'attendanceRating',
          },
          {
            id: 'ch-att-present-sec3',
            label:
              'Secondary 3 — No. of days present during the year (e.g. 90/100)',
            type: 'text',
            source: 'School Cockpit',
            value: '39 / 47',
          },
          {
            id: 'ch-att-late-sec3',
            label: 'Secondary 3 — No. of days late for school',
            type: 'text',
            source: 'School Cockpit',
            value: '12',
          },
          {
            id: 'ch-att-absent-sec3',
            label: 'Secondary 3 — No. of days absent without valid reasons',
            type: 'text',
            source: 'School Cockpit',
            value: '3',
          },
          // Final-year-only fields (left blank — not applicable)
          {
            id: 'ch-att-date-left',
            label: 'Date left school (for ex-students)',
            type: 'text',
          },
          {
            id: 'ch-att-reason-leaving',
            label: 'Reason for leaving school',
            type: 'narrative',
            aiDraftable: true,
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
          // Positive behaviours
          {
            id: 'ch-cond-responsive',
            label: 'Responsive',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-cond-responsible',
            label: 'Responsible',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-cond-polite',
            label: 'Polite',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-cond-honest',
            label: 'Honest',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-cond-helpful',
            label: 'Helpful',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-cond-attentive',
            label: 'Attentive',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-cond-hardworking',
            label: 'Hardworking',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-cond-respectful',
            label: 'Respectful',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-cond-peers',
            label: 'Problems with peers',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-cond-teachers',
            label: 'Problems with teachers',
            type: 'yesnona',
            value: 'No',
          },
          // Negative behaviours
          {
            id: 'ch-cond-gangs',
            label: 'Associates with Gangs',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-cond-truancy',
            label: 'Truancy',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-cond-fights',
            label: 'Engages in Fights',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-cond-pilfers',
            label: 'Pilfers/Steals',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-cond-smokes',
            label: 'Smokes',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-cond-substances',
            label: 'Abuses other Substances',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-cond-defies',
            label: 'Defies Authority',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-cond-resists-counselling',
            label: 'Resists School counselling',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-cond-bullies',
            label: 'Bullies',
            type: 'yesnona',
            value: 'No',
          },
          // Overall conduct per year
          {
            id: 'ch-cond-overall-sec1',
            label: 'Secondary 1 — Overall conduct',
            type: 'radio',
            options: ['Excellent', 'Good', 'Fair', 'Poor'],
            value: 'Good',
          },
          {
            id: 'ch-cond-overall-sec2',
            label: 'Secondary 2 — Overall conduct',
            type: 'radio',
            options: ['Excellent', 'Good', 'Fair', 'Poor'],
            value: 'Fair',
          },
          {
            id: 'ch-cond-overall-sec3',
            label: 'Secondary 3 — Overall conduct',
            type: 'radio',
            options: ['Excellent', 'Good', 'Fair', 'Poor'],
            value: 'Poor',
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
            value: 'Satisfactory',
          },
          {
            id: 'ch-acad-sec2',
            label: 'Secondary 2 — Academic performance',
            type: 'radio',
            options: ['Good', 'Satisfactory', 'Poor'],
            value: 'Satisfactory',
          },
          {
            id: 'ch-acad-sec3',
            label: 'Secondary 3 — Academic performance',
            type: 'radio',
            options: ['Good', 'Satisfactory', 'Poor'],
            value: 'Poor',
            prefillKey: 'academicPerformance',
          },
          {
            id: 'ch-acad-remarks',
            label: 'Other remarks pertaining to academic performance',
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'ch-cca-activities',
            label: 'CCA / Activities student participated in',
            type: 'narrative',
            value: 'Football (School Team)',
          },
          {
            id: 'ch-cca-positions',
            label: 'Positions held',
            type: 'text',
            value: 'Member',
          },
          {
            id: 'ch-cca-attendance',
            label: 'CCA attendance',
            type: 'text',
            value: 'Regular until Term 2 2026, then irregular',
          },
          {
            id: 'ch-cca-behaviour',
            label: 'Behaviour at CCA',
            type: 'narrative',
            aiDraftable: true,
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
            value: 'Yes',
          },
          {
            id: 'ch-par-control',
            label: 'Parents / guardians are able to exert control',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-par-acknowledge',
            label: "Parents / guardians acknowledge the offender's wrongdoing",
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-par-inconsistent',
            label:
              'Parents / guardians are inconsistent in their approach to discipline',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ch-par-other',
            label: 'Other parental observations (please provide details)',
            type: 'narrative',
            aiDraftable: true,
          },
          // Other Information — adverse family records
          {
            id: 'ch-fam-criminal',
            label: 'An immediate family member has a criminal record',
            type: 'yesnona',
            value: 'NA',
          },
          {
            id: 'ch-fam-drug',
            label: 'There is information of drug abuse in the family',
            type: 'yesnona',
            value: 'NA',
          },
          {
            id: 'ch-fam-sexual',
            label: 'There is information of sexual abuse in the family',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-fam-physical',
            label: 'There is information of physical abuse in the family',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-fam-other',
            label: 'Other family observations (please provide details)',
            type: 'narrative',
            aiDraftable: true,
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
            aiDraftable: true,
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
            aiDraftable: true,
          },
          {
            id: 'ch-health-bizarre',
            label:
              'Extremely bizarre behaviour (hallucinations, delusions, etc.)',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-health-violent',
            label: 'Extremely violent behaviour',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-health-suicidal',
            label:
              'Suicidal inclinations / attempt or clear plan to commit suicide',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-health-substance',
            label: 'Obvious addiction to substances',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ch-health-depression',
            label: 'Depression',
            type: 'yesnona',
            value: 'NA',
          },
          {
            id: 'ch-health-other',
            label: 'Other psychiatric concerns (please provide details)',
            type: 'narrative',
            aiDraftable: true,
            helper: 'NA — Information is not available to the school.',
          },
        ],
      },
      {
        id: 'ch-counselling',
        title: 'Counselling',
        role: 'counsellor',
        fields: [
          {
            id: 'ch-couns-programme',
            label: 'Name / type of programme',
            type: 'text',
          },
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
            aiDraftable: true,
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
            aiDraftable: true,
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
            value: 'Year Head',
          },
          {
            id: 'ch-teacher-years',
            label: 'No. of years student known',
            type: 'text',
            value: '3',
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
            value: '29 Apr 2026',
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
  {
    id: 'msf',
    agency: 'Ministry of Social and Family Development',
    name: 'MSF School Report',
    abbrev: 'MSF',
    color: '#0064ff',
    category: 'Family & Social Services',
    totalFields: 60,
    autoFilled: 50,
    pages: 5,
    turnaroundDays: 7,
    // Points at the report-only PDF (the upstream .docx leads with an
    // email cover page; we skipped that and re-derived /report-templates/
    // msf.pdf + /report-previews/msf-thumb.png from pages 2..6 of the
    // original so every preview surface — Export step, Eye modal, list
    // thumbnail — opens at the actual School Report's first page.
    templateFile: '/report-templates/msf.pdf',
    sections: [
      {
        id: 'ms-purpose',
        title: 'Purpose',
        role: 'yh',
        fields: [
          {
            id: 'ms-purpose-type',
            label: 'Purpose of report',
            type: 'radio',
            options: [
              'Guidance Programme (GP)',
              'School Performance Report (Police)',
              'VWOs',
              'PRGS Pre-Sentence Report',
              'PRGS Progress Report',
              'Beyond Parental Control',
              'RRB Progress Report',
              'Others',
            ],
            value: 'PRGS Pre-Sentence Report',
            helper:
              'Select one. Police / VWOs categories are listed first; MSF categories follow.',
          },
          {
            id: 'ms-purpose-other',
            label: 'If Others, please specify',
            type: 'text',
          },
        ],
      },
      {
        id: 'ms-particulars',
        title: "Student's Personal Particulars",
        role: 'yh',
        fields: [
          {
            id: 'ms-name',
            label: 'Name',
            type: 'text',
            source: 'EduHub',
            value: 'Chen Jun Kai',
            prefillKey: 'studentName',
          },
          {
            id: 'ms-nric',
            label: 'NRIC No',
            type: 'text',
            source: 'EduHub',
            value: 'T1234567A',
            prefillKey: 'nric',
          },
          {
            id: 'ms-class',
            label: 'Class',
            type: 'text',
            source: 'School Cockpit',
            value: '3A',
            prefillKey: 'class',
          },
          {
            id: 'ms-school',
            label: 'School',
            type: 'text',
            source: 'EduHub',
            value: 'Temasek Secondary School',
            prefillKey: 'school',
          },
          {
            id: 'ms-address',
            label: 'Address',
            type: 'text',
            source: 'EduHub',
            value: '45 Bedok North Avenue 3, #08-123, Singapore 460045',
          },
          {
            id: 'ms-officer-name',
            label: 'Name of Officer',
            type: 'text',
            value: 'Ms Ong Hui Wen',
          },
          {
            id: 'ms-officer-tel',
            label: 'Tel No.',
            type: 'text',
            value: '68590893',
          },
        ],
      },
      {
        id: 'ms-attendance',
        title: 'Attendance',
        role: 'yh',
        fields: [
          {
            id: 'ms-att-rating',
            label: 'Attendance rating',
            type: 'radio',
            options: ['Very Regular', 'Regular', 'Irregular'],
            value: 'Irregular',
            prefillKey: 'attendanceRating',
          },
          {
            id: 'ms-att-present',
            label: 'No. of days present during the semester (e.g. 85/90)',
            type: 'text',
            source: 'School Cockpit',
            value: '39 / 47',
          },
          {
            id: 'ms-att-late',
            label: 'No. of days late for school',
            type: 'text',
            source: 'School Cockpit',
            value: '12',
          },
          {
            id: 'ms-att-absent',
            label: 'No. of days absent without valid reasons',
            type: 'text',
            source: 'School Cockpit',
            value: '3',
          },
          {
            id: 'ms-att-date-left',
            label: 'Date left school (for ex-students)',
            type: 'text',
            value: 'N/A — current student',
          },
          {
            id: 'ms-att-reason-leaving',
            label: 'Reason for leaving school',
            type: 'narrative',
            // No aiDraftable here — the field is for ex-students only,
            // so an AI Draft button would be misleading on this profile.
          },
          {
            id: 'ms-att-withdrawn-by',
            label: 'Withdrawn by (if applicable)',
            type: 'text',
          },
        ],
      },
      {
        id: 'ms-conduct',
        title: 'Conduct',
        role: 'yh',
        fields: [
          // Positive
          {
            id: 'ms-cond-responsive',
            label: 'Responsive',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ms-cond-responsible',
            label: 'Responsible',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-cond-polite',
            label: 'Polite',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ms-cond-honest',
            label: 'Honest',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ms-cond-helpful',
            label: 'Helpful',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ms-cond-attentive',
            label: 'Attentive',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-cond-hardworking',
            label: 'Hardworking',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-cond-respectful',
            label: 'Respectful',
            type: 'yesnona',
            value: 'Yes',
          },
          // Negative
          {
            id: 'ms-cond-gangs',
            label: 'Associates with Gangs',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-cond-truant',
            label: 'Plays Truant',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ms-cond-fights',
            label: 'Engages in Fights',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ms-cond-pilfers',
            label: 'Pilfers/Steals',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-cond-smokes',
            label: 'Smokes',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-cond-substances',
            label: 'Abuses other Substances',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-cond-defies',
            label: 'Defies Authority',
            type: 'yesnona',
            value: 'Yes',
          },
          {
            id: 'ms-cond-resists',
            label: 'Resists School counselling and other forms of help',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-cond-bullies',
            label: 'Bullies',
            type: 'yesnona',
            value: 'No',
          },
          // Overall conduct
          {
            id: 'ms-cond-overall',
            label: 'Overall Conduct (Please include Disciplinary Records)',
            type: 'radio',
            options: ['Excellent', 'Good', 'Fair', 'Poor'],
            value: 'Poor',
            prefillKey: 'overallConduct',
          },
          {
            id: 'ms-cond-comments',
            label: 'Comments, if any',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'ms-academic-perf',
        title: 'Academic Performance',
        role: 'yh',
        fields: [
          {
            id: 'ms-acad-rating',
            label: 'Academic Performance',
            type: 'radio',
            options: ['Good', 'Satisfactory', 'Poor'],
            value: 'Poor',
            prefillKey: 'academicPerformance',
          },
          {
            id: 'ms-acad-remarks',
            label: 'Other Remarks Pertaining to Academic Performance',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'ms-cca',
        title: 'Co-Curricular Activities',
        role: 'yh',
        assignedTo: {
          name: 'Mr Lee Wei Kiat',
          role: 'CCA Teacher',
          initials: 'LW',
          completed: true,
          completedDate: '21 Apr 2026',
        },
        fields: [
          {
            id: 'ms-cca-activities',
            label: 'Activity/ies',
            type: 'text',
            value: 'Football (School Team)',
          },
          {
            id: 'ms-cca-positions',
            label: 'Position/s Held',
            type: 'text',
            value: 'Member',
          },
          {
            id: 'ms-cca-attendance',
            label: 'Attendance',
            type: 'text',
            value:
              'Regular until Term 2 2026, then irregular (attended 12 of last 16 sessions)',
          },
          {
            id: 'ms-cca-behaviour',
            label: 'Behaviour at CCA',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'ms-other-comments',
        title: 'Other Comments',
        role: 'yh',
        fields: [
          // Parents/Guardians — left unchecked for the YH to fill
          {
            id: 'ms-par-cooperative',
            label: 'The parents/guardians are co-operative',
            type: 'yesnona',
          },
          {
            id: 'ms-par-control',
            label: 'The parents/guardians are able to exert control',
            type: 'yesnona',
          },
          {
            id: 'ms-par-acknowledge',
            label:
              "The parents/guardians acknowledge the offender's wrongdoing",
            type: 'yesnona',
          },
          {
            id: 'ms-par-inconsistent',
            label:
              'The parents/guardians are inconsistent in their approach to discipline',
            type: 'yesnona',
          },
          {
            id: 'ms-par-other',
            label: 'Others (please provide details)',
            type: 'narrative',
            aiDraftable: true,
          },
          // Adverse family records — left unchecked for the YH to fill
          {
            id: 'ms-fam-criminal',
            label: 'An immediate family member/members has a criminal record',
            type: 'yesnona',
          },
          {
            id: 'ms-fam-drug',
            label: 'There is information of drug abuse in the family',
            type: 'yesnona',
          },
          {
            id: 'ms-fam-sexual',
            label: 'There is information of sexual abuse in the family',
            type: 'yesnona',
          },
          {
            id: 'ms-fam-physical',
            label: 'There is information of physical abuse in the family',
            type: 'yesnona',
          },
          {
            id: 'ms-fam-other',
            label: 'Others (please provide details)',
            type: 'narrative',
            aiDraftable: true,
            helper: 'NA — Information is not available to the school.',
          },
        ],
      },
      {
        id: 'ms-care',
        title: 'Care Arrangements',
        role: 'yh',
        fields: [
          {
            id: 'ms-care-arrangements',
            label:
              "The student's care arrangements, if known to the school (e.g. whether the student is staying with someone with whom he shares a strong emotional bond)",
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'ms-health',
        title: "Student's Health",
        role: 'yh',
        fields: [
          {
            id: 'ms-health-medical',
            label: 'Any known medical problems (please provide details)',
            type: 'narrative',
            aiDraftable: true,
          },
          {
            id: 'ms-health-bizarre',
            label:
              'Extremely bizarre behaviour (hallucinations, delusions, etc.)',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-health-violent',
            label: 'Extremely violent behaviour',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-health-suicidal',
            label:
              'Suicidal inclinations / attempt or clear plan to commit suicide',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-health-substance',
            label: 'Obvious addiction to substances',
            type: 'yesnona',
            value: 'No',
          },
          {
            id: 'ms-health-depression',
            label: 'Depression',
            type: 'yesnona',
            value: 'NA',
          },
          {
            id: 'ms-health-other',
            label: 'Others (please provide details)',
            type: 'narrative',
            aiDraftable: true,
            helper: 'NA — Information is not available to the school.',
          },
        ],
      },
      {
        id: 'ms-counselling',
        title: 'Counselling',
        role: 'counsellor',
        fields: [
          {
            id: 'ms-couns-programme',
            label: 'Name / type of programme',
            type: 'text',
          },
          {
            id: 'ms-couns-duration',
            label: 'Duration / frequency',
            type: 'text',
          },
          {
            id: 'ms-couns-persons',
            label:
              'Persons involved (e.g. parents, fellow students (buddy system) etc)',
            type: 'text',
          },
          { id: 'ms-couns-name', label: 'Name of counsellor', type: 'text' },
          {
            id: 'ms-couns-quals',
            label: 'Qualifications of counsellor',
            type: 'text',
          },
          {
            id: 'ms-couns-contact',
            label: "Counsellor's contact details",
            type: 'text',
          },
          {
            id: 'ms-couns-other',
            label: 'Any other details which will be of assistance',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'ms-other',
        title: 'Other Information',
        role: 'yh',
        fields: [
          {
            id: 'ms-other-info',
            label:
              'Any other information which may assist the student and the person in charge of the present investigation',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
      {
        id: 'ms-teacher',
        title: 'Teacher / Person Preparing the Report',
        role: 'yh',
        fields: [
          {
            id: 'ms-teacher-name',
            label: 'Name',
            type: 'text',
            value: 'Mr Daniel Tan',
          },
          {
            id: 'ms-teacher-appointment',
            label: 'Appointment',
            type: 'text',
            value: 'Year Head',
          },
          {
            id: 'ms-teacher-years',
            label: 'No. of years student known',
            type: 'text',
            value: '3',
          },
          {
            id: 'ms-teacher-signature',
            label: 'Signature of Teacher / Person',
            type: 'signature',
          },
          {
            id: 'ms-teacher-date',
            label: 'Date',
            type: 'text',
            value: '29 Apr 2026',
          },
        ],
      },
      {
        id: 'ms-principal',
        title: "Principal's Comments",
        role: 'principal',
        fields: [
          {
            id: 'ms-principal-name',
            label: 'Name',
            type: 'text',
            value: 'Mrs Jenny Lim',
          },
          {
            id: 'ms-principal-school',
            label: 'School / Institution',
            type: 'text',
            value: 'Temasek Secondary School',
          },
          {
            id: 'ms-principal-address',
            label: 'Address',
            type: 'text',
            value: '2 Bedok South Road, Singapore 469296',
          },
          {
            id: 'ms-principal-tel',
            label: 'Tel / Fax numbers',
            type: 'text',
            value: '6441 3143',
          },
          {
            id: 'ms-principal-comments',
            label: 'Comments on report, if any',
            type: 'narrative',
          },
        ],
      },
    ],
  },
  // ── Placeholder templates ─────────────────────────────────────
  // Listed in the picker so the YH can select them; the Fill Report
  // form opens with a generic 'Details' section. Full field structure
  // not yet built out.
  {
    id: 'fam-fsc',
    agency: 'Family Service Centre',
    name: 'FAM@FSC Interagency Referral Form',
    abbrev: 'FSC',
    color: '#0064ff',
    category: 'Family & Social Services',
    totalFields: 0,
    autoFilled: 0,
    pages: 1,
    turnaroundDays: 7,
    sections: [
      {
        id: 'fsc-details',
        title: 'Referral Details',
        role: 'yh',
        fields: [
          {
            id: 'fsc-notes',
            label: 'Referral notes',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'reach-north',
    agency: 'National University Hospital (REACH North)',
    name: 'NUH REACH North Forms',
    abbrev: 'REACH',
    color: '#059669',
    category: 'Mental Health',
    totalFields: 0,
    autoFilled: 0,
    pages: 1,
    turnaroundDays: 7,
    sections: [
      {
        id: 'rn-details',
        title: 'Referral Details',
        role: 'yh',
        fields: [
          {
            id: 'rn-notes',
            label: 'Referral notes',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'asn',
    agency: 'School',
    name: 'Assessment of Student Needs Form',
    abbrev: 'ASN',
    color: '#9333ea',
    category: 'Mental Health',
    totalFields: 0,
    autoFilled: 0,
    pages: 1,
    turnaroundDays: 5,
    sections: [
      {
        id: 'asn-details',
        title: 'Assessment Notes',
        role: 'yh',
        fields: [
          {
            id: 'asn-notes',
            label: 'Assessment notes',
            type: 'narrative',
            aiDraftable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'court-order',
    agency: 'Youth Court',
    name: 'School Report for Court Order',
    abbrev: 'COURT',
    color: '#374151',
    category: 'Care & Placement',
    totalFields: 0,
    autoFilled: 0,
    pages: 1,
    turnaroundDays: 7,
    sections: [
      {
        id: 'co-details',
        title: 'Report Details',
        role: 'yh',
        fields: [
          {
            id: 'co-notes',
            label: 'Court report notes',
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
  // MSF School Report — narrative AI drafts. Each draft is composed
  // from concrete data in the student's record (attendance, conduct,
  // counselling sessions, family composition) so the demo can speak
  // specifically when DOS clicks "Generate draft". Superscript markers
  // ¹²³ map to AI_DRAFT_CITATIONS entries rendered in the SOURCES block.
  'ms-cond-comments':
    "Jun Kai's overall conduct has shifted across the Secondary track — Good in Secondary 1, Fair in Secondary 2, and Poor in his current year¹. Three disciplinary incidents have been logged this academic year: a verbal altercation with a classmate in late January, a physical scuffle during recess on 6 March, and a follow-up incident on 12 March that escalated to a two-day suspension². His Year Head reports that one-on-one conversations are productive — Jun Kai can articulate what led to each incident and accepts the consequences without argument. The pattern of escalation clusters around Monday mornings and the first week following each school break, which may point to home-environment stressors rather than classroom triggers¹.",
  'ms-acad-remarks':
    'Academic performance has dipped sharply through Secondary 3, with Mathematics (38%) and English (44%) producing the weakest results on the Term 2 papers — well below his Secondary 2 averages of 58% and 61% respectively¹. The mid-year drop tracks closely with attendance: 39 of 47 possible school days present, twelve recorded late-comings, and three unexcused absences in Term 2 alone². Subject teachers note that engagement is markedly higher in practical components — he completes hands-on work in Design & Technology and Science labs at a level above his theory marks, suggesting capability rather than ability is the gap. Targeted remedial support in Mathematics and English would likely lift both grades if attendance stabilises through Term 3³.',
  'ms-par-other':
    'Both parents have attended every parent-teacher conference scheduled this academic year and respond to school WhatsApp messages within a day¹. They acknowledge the recent disciplinary incidents, do not minimise them, and have been receptive to the counselling recommendations the school has put forward. The mother, Mdm Tan Siew Lee, is the day-to-day point of contact and supervises homework; the father works long shifts as a taxi driver and engages less frequently with school matters but joins meetings when scheduled in advance². Both parents have asked the school for clearer behavioural expectations they can reinforce at home — the underlying issue appears to be capacity rather than willingness³.',
  'ms-fam-other':
    'School records hold no information indicating criminal activity, drug abuse, sexual abuse, or physical abuse in the immediate family¹. The household consists of both biological parents, Jun Kai, and a younger sister currently in Primary 5 at Bandung Primary School. The family qualifies for the MOE Financial Assistance Scheme; combined household income from the father\'s taxi-driving and the mother\'s part-time cleaning role sits below the FAS threshold². Term 1 Termly Check-In responses note moderate financial stress at home but raise no flags around safety, conflict, or substance use³.',
  'ms-care-arrangements':
    'Jun Kai lives with both biological parents and his younger sister in a three-room HDB rental flat in Bedok North¹. The strongest emotional bond, consistently described in counselling notes, is with his mother — she is named as his primary emergency contact, attends every school engagement, and is the parent Jun Kai turns to first². His relationship with his father is functional but less close; the father\'s shift-based work limits one-on-one time, and Jun Kai has described feeling closer to his sister than to his father in counselling sessions. He takes an active role caring for his sister after school, walking her home from her after-school programme on most weekdays³.',
  'ms-health-medical':
    'School health records show no chronic medical conditions, no known allergies, and no long-term medication for Jun Kai¹. He has had no health-related absences this academic year — the eight Term 2 absences logged were disciplinary, unexcused, or attributable to family commitments rather than illness². The Secondary 1 medical screening flagged mild myopia, now corrected with prescription glasses, and the most recent annual screening on 18 January 2026 raised no new concerns. Jun Kai self-reports good general health and has not visited the school sickbay this year³.',
  'ms-health-other':
    'There are no acute psychiatric concerns on file — no recorded suicidal ideation, no violent or self-injurious behaviour, and no substance-use indicators¹. However, Term 1 and Term 2 Termly Check-In responses both show consistently low mood scores (3 and 4 out of 10 on the wellbeing slider, against a Secondary 3 cohort average of 6.2). The school counsellor has noted occasional flat affect during sessions and reduced spontaneous engagement compared to his Secondary 2 baseline². The disciplinary incidents recorded this year have been impulsive rather than indicative of an underlying psychiatric disorder, but the persistent low-mood signal warrants continued external monitoring and would benefit from a community-based touchpoint³.',
  'ms-other-info':
    'Jun Kai has been receiving fortnightly individual counselling from the School Counsellor, Ms Sarah Chen, since 12 January 2026; eight sessions have been completed to date¹. The school has proactively engaged the family through three structured meetings this academic year — two with both parents present, one with the mother only — and has logged each in Case Sync². Termly Check-In data over the past two cycles suggests an ongoing low-mood pattern that the school cannot address through its own resources alone, and the Year Head has indicated the school would welcome an external referral. Jun Kai has not previously been known to MSF, the Singapore Police Force, or any community agency; this is his first agency-level engagement, and the school is committed to remaining a stable touchpoint throughout³.',
  'ms-cca-behaviour':
    'Jun Kai has been a member of the school football team since Secondary 1 and trains twice weekly under Coach Lee Wei Kiat¹. He is generally cooperative during training, follows tactical instructions promptly, and takes a leadership role when warming up younger team-mates — a side of his behaviour rarely visible in the classroom. Attendance was very regular through Secondary 1 and 2 but has become irregular since March 2026; he has missed four of the last eight training sessions without explanation, which cost him his place on the starting eleven for the recent inter-school friendly². When he does attend, the effort and attitude remain high, suggesting that motivation is intact and the consistency issue is external rather than disengagement from the sport itself³.',
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

// Mutable: empty by default (clean state for demo). The agency-report wizard
// pushes a freshly-submitted report into this array so the student profile
// reflects the new "In Review" card without round-tripping a backend.
export const mockAgencyReports: Array<AgencyReport> = []

// Path constants for the asset files actually present in
// /public/ministry-logos/. Add new logos here as they're added to the
// folder; downstream resolution is keyword-based via getAgencyLogo().
const LOGO_PATHS = {
  msf: '/ministry-logos/msf.png',
  spf: '/ministry-logos/spf.png',
  sps: '/ministry-logos/sps.png',
  cnb: '/ministry-logos/cnb.avif',
  nuh: '/ministry-logos/nuh.jpeg',
  imh: '/ministry-logos/imh.png',
  courts: '/ministry-logos/courts.png',
  fsc: '/ministry-logos/fsc.svg',
} as const

// Keyword-based agency → logo resolution. The previous exact-match dict
// missed forms whose `agency` is a sub-service name (e.g. "Children's
// Home" — an MSF program — would fall through to a generic acronym
// tile). Now ANY form whose agency rolls up under MSF (CPS, NAVH,
// Probation, PSV, Children's Home) resolves to the MSF logo automatically.
export function getAgencyLogo(agency: string): string | undefined {
  const a = agency.toLowerCase()
  // MSF + every MSF sub-service / program location
  if (
    a.includes('msf') ||
    a.includes('ministry of social') ||
    a.includes("children's home") ||
    a.includes('child protective') ||
    a.includes('cps') ||
    a.includes('probation') ||
    a.includes('navh') ||
    a.includes('anti-violence') ||
    a.includes('psv')
  ) {
    return LOGO_PATHS.msf
  }
  // SPS — check before SPF so "prison service" doesn't match the police
  // branch via the looser "service" keyword (it doesn't here, but order
  // matters for future additions).
  if (a.includes('prison') || a.includes('sps')) {
    return LOGO_PATHS.sps
  }
  // SPF
  if (a.includes('spf') || a.includes('police')) {
    return LOGO_PATHS.spf
  }
  // CNB
  if (a.includes('cnb') || a.includes('narcotics')) {
    return LOGO_PATHS.cnb
  }
  // IMH — check before NUH so "Institute of Mental Health" doesn't get
  // ambiguously matched (NUH is a different hospital system).
  if (
    a.includes('imh') ||
    a.includes('institute of mental health') ||
    a.includes('child guidance')
  ) {
    return LOGO_PATHS.imh
  }
  // NUH — covers both the main hospital and the REACH North program that
  // sits under it.
  if (
    a.includes('nuh') ||
    a.includes('national university hospital') ||
    a.includes('reach')
  ) {
    return LOGO_PATHS.nuh
  }
  // SG Courts — Youth Court and any future court-related agencies.
  if (a.includes('court') || a.includes('judiciary')) {
    return LOGO_PATHS.courts
  }
  // Family Service Centres (incl. FAM@FSC referral programs).
  if (
    a.includes('family service centre') ||
    a.includes('family service center') ||
    a.includes('fsc') ||
    a.includes('fam@fsc')
  ) {
    return LOGO_PATHS.fsc
  }
  // Future: drop new asset files into /public/ministry-logos/ and add a
  // matching keyword check here. Returning undefined triggers the
  // deterministic acronym swatch fallback in <AgencyLogo />.
  return undefined
}

// Legacy export retained for any direct lookups. Prefer getAgencyLogo().
export const AGENCY_LOGOS: Record<string, string | undefined> = new Proxy(
  {},
  {
    get: (_t, prop: string) => getAgencyLogo(prop),
  },
) as Record<string, string | undefined>

// Push a freshly-submitted report onto the mock store and return it. Used by
// the wizard's "Submit for Principal review" flow.
export function appendSubmittedReport(input: {
  studentId: string
  templateId: string
  templateName: string
  agency: string
  totalSections: number
}): AgencyReport {
  const now = new Date()
  const report: AgencyReport = {
    id: `ar-${now.getTime()}`,
    studentId: input.studentId,
    templateId: input.templateId,
    templateName: input.templateName,
    agency: input.agency,
    status: 'pending_review',
    createdAt: now,
    startedAt: now,
    passwordSaved: false,
  }
  mockAgencyReports.unshift(report)
  return report
}

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
  // MSF School Report — per-field citations. Numbers correspond to the
  // superscript markers in AI_DRAFTS[fieldId]. Each detail is rendered
  // as a clickable hyperlink in the SOURCES block.
  'ms-cond-comments': [
    {
      num: 1,
      source: 'Case Sync',
      detail: 'Case notes, Jan–Apr 2026',
    },
    {
      num: 2,
      source: 'School Cockpit',
      detail: 'Disciplinary records, 2026',
    },
    {
      num: 3,
      source: 'School Cockpit',
      detail: 'Suspension record, Mar 2026',
    },
  ],
  'ms-acad-remarks': [
    {
      num: 1,
      source: 'School Cockpit',
      detail: 'Academic results, Sec 1–3',
    },
    {
      num: 2,
      source: 'School Cockpit',
      detail: 'Attendance record, Term 2 2026',
    },
    {
      num: 3,
      source: 'Case Sync',
      detail: 'Counselling notes, Apr 2026',
    },
  ],
  'ms-par-other': [
    {
      num: 1,
      source: 'Case Sync',
      detail: 'Parent communication log, 2026',
    },
    {
      num: 2,
      source: 'Case Sync',
      detail: 'Counselling notes, Apr 2026',
    },
    {
      num: 3,
      source: 'TCI',
      detail: 'Term 1 wellbeing check-in',
    },
  ],
  'ms-fam-other': [
    {
      num: 1,
      source: 'School Cockpit',
      detail: 'Family records, EduHub',
    },
    {
      num: 2,
      source: 'TCI',
      detail: 'Term 1 wellbeing check-in',
    },
    {
      num: 3,
      source: 'Case Sync',
      detail: 'Case notes, Jan–Apr 2026',
    },
  ],
  'ms-care-arrangements': [
    {
      num: 1,
      source: 'School Cockpit',
      detail: 'Caregiver records, EduHub',
    },
    {
      num: 2,
      source: 'Case Sync',
      detail: 'Counselling notes, Apr 2026',
    },
    {
      num: 3,
      source: 'School Cockpit',
      detail: 'Family contact log, 2026',
    },
  ],
  'ms-health-medical': [
    {
      num: 1,
      source: 'School Cockpit',
      detail: 'Medical alerts, EduHub',
    },
    {
      num: 2,
      source: 'School Cockpit',
      detail: 'Attendance record, Term 2 2026',
    },
    {
      num: 3,
      source: 'School Cockpit',
      detail: 'Student health profile',
    },
  ],
  'ms-health-other': [
    {
      num: 1,
      source: 'TCI',
      detail: 'Term 1 wellbeing check-in',
    },
    {
      num: 2,
      source: 'Case Sync',
      detail: 'Counselling notes, Apr 2026',
    },
    {
      num: 3,
      source: 'School Cockpit',
      detail: 'Behavioural incident records, 2026',
    },
  ],
  'ms-other-info': [
    {
      num: 1,
      source: 'Case Sync',
      detail: 'Counselling sessions, Jan 2026 onwards',
    },
    {
      num: 2,
      source: 'Case Sync',
      detail: 'Family engagement log',
    },
    {
      num: 3,
      source: 'TCI',
      detail: 'Term 1 wellbeing check-in',
    },
  ],
  'ms-cca-behaviour': [
    {
      num: 1,
      source: 'School Cockpit',
      detail: 'CCA attendance log, 2026',
    },
    {
      num: 2,
      source: 'Case Sync',
      detail: 'CCA teacher feedback',
    },
    {
      num: 3,
      source: 'School Cockpit',
      detail: 'CCA attendance log, Mar 2026',
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

// ── Source attribution for auto-populated fields ───────────────────────
// When a field's value comes from an upstream system (EduHub, School
// Cockpit, TCI, Case Sync, Connectogram), the Fill Report page surfaces a
// small affordance next to the value that opens a side panel showing the
// excerpt the value was derived from. The mapping below is keyed by the
// field-level `source` string already present on `ReportField` plus an
// optional per-field excerpt override.

export interface SourceExcerpt {
  system: string
  excerpt: string
  lastUpdated: string
  href: string
}

const DEFAULT_SOURCE_EXCERPTS: Record<string, SourceExcerpt> = {
  EduHub: {
    system: 'EduHub',
    excerpt:
      'Student Record · Active · Chen Jun Kai · NRIC S9101B · Class 3A · Bandung Secondary School · Singapore Citizen',
    lastUpdated: '12 Jan 2026',
    href: 'https://eduhub.example.gov.sg/students/S9101B',
  },
  'School Cockpit': {
    system: 'School Cockpit',
    excerpt:
      'Term 1 attendance · Present 78 / 95 days (82.1%). Late arrivals: 14. Absences with MC: 9. Unexcused absences: 8.',
    lastUpdated: '18 Apr 2026',
    href: 'https://schoolcockpit.example.gov.sg/students/3A/S9101B',
  },
  TCI: {
    system: 'TCI',
    excerpt:
      'Discipline ledger · 4 incidents this AY. Most recent: 12 Mar 2026 — disrupting class, 3-day suspension. Conduct grade: Fair.',
    lastUpdated: '14 Mar 2026',
    href: 'https://tci.example.gov.sg/cases/S9101B',
  },
  'Case Sync': {
    system: 'Case Sync',
    excerpt:
      'Open case · Counselling sessions: 6 since Jan 2026 · Lead: Ms Sarah Chen (SC) · Last session note: 8 Apr 2026.',
    lastUpdated: '8 Apr 2026',
    href: 'https://casesync.example.gov.sg/cases/CS-2026-0142',
  },
  Connectogram: {
    system: 'Connectogram',
    excerpt:
      'Family map · Lives with maternal aunt (Mdm Tan, 47). Biological mother: contact infrequent. No registered father. Housing: 3-room HDB rental.',
    lastUpdated: '2 Feb 2026',
    href: 'https://connectogram.example.gov.sg/family/S9101B',
  },
}

// Per-field overrides — adjust the excerpt to be field-specific where the
// generic text isn't quite right. Falls back to DEFAULT_SOURCE_EXCERPTS
// keyed on `field.source` when there's no entry here.
const FIELD_SOURCE_OVERRIDES: Record<string, Partial<SourceExcerpt>> = {
  // MSF Children's Home School Report — student particulars
  name: {
    excerpt:
      'Student Record · Active · Full name: Chen Jun Kai · Preferred: Jun Kai · NRIC S9101B · Class 3A',
  },
  nric: {
    excerpt:
      'Identity · NRIC S9101B (issued 2010) · Citizenship: Singapore Citizen · DOB 4 Jan 2010',
  },
  school: {
    excerpt:
      'Enrolment · Bandung Secondary School · 21 Tampines St 33 · S9101B · Class 3A · Form Teacher: Mr Ahmad Rizal',
  },
  // Generic student-name pre-fill keys used by other templates
  'intk-name': {
    excerpt:
      'Student Record · Active · Full name: Chen Jun Kai · NRIC S9101B · Class 3A',
  },
  'intk-attendance': {
    excerpt:
      'Term 2 attendance · Present 41 / 49 days (83.7%). 7 lates, 1 unexcused absence (12 Apr 2026).',
  },
  'intk-conduct': {
    excerpt:
      'Conduct Grade · Poor · Driven by 4 disciplinary incidents this AY (last: 12 Mar 2026, 3-day suspension).',
  },
  // MSF School Report — student particulars + attendance excerpts. The
  // demo walkthrough surfaces the source side-panel from these fields.
  'ms-name': {
    excerpt:
      'Student Record · Active · Full name: Chen Jun Kai · Preferred: Jun Kai · NRIC T1234567A · Class 3A',
  },
  'ms-nric': {
    excerpt:
      'Identity · NRIC T1234567A (issued 2010) · Citizenship: Singapore Citizen · DOB 4 Jan 2010',
  },
  'ms-class': {
    excerpt:
      'Enrolment · Class 3A · Form Teacher: Mr Ahmad Rizal · Year Head: Mr Daniel Tan',
  },
  'ms-school': {
    excerpt:
      'Enrolment · Temasek Secondary School · Posting since Sec 1 (2024) · Status: Active · Express stream',
  },
  'ms-address': {
    excerpt:
      'Address on file · 45 Bedok North Avenue 3, #08-123, Singapore 460045 · Verified 12 Jan 2026',
  },
  'ms-att-present': {
    excerpt:
      'Term 2 attendance · Present 39 / 47 days (83.0%). 12 lates, 3 unexcused absences. Trend: declining since wk 4.',
  },
  'ms-att-late': {
    excerpt:
      'Late arrivals · 12 instances this term · Most common day: Monday (7) · Avg lateness: 18 minutes',
  },
  'ms-att-absent': {
    excerpt:
      'Unexcused absences · 3 days this term (12 Apr, 16 Apr, 22 Apr 2026) · No MC submitted · Parents notified',
  },
}

export function getSourceExcerpt(
  fieldId: string,
  source: string | null | undefined,
): SourceExcerpt | null {
  if (!source) return null
  const base = DEFAULT_SOURCE_EXCERPTS[source]
  if (!base) return null
  const override = FIELD_SOURCE_OVERRIDES[fieldId]
  return override ? { ...base, ...override } : base
}
