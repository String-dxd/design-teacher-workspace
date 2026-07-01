export interface OffenceDetail {
  type: string
  count: number
  latestDate: string
}

export interface RiskIndicatorRecord {
  year: number
  term: string
  indicators: Array<string>
}

export interface SocialLinkPerson {
  name: string
  class: string
  closenessRating: number | null
}

export interface SubjectScore {
  subject: string
  percentage: number
}

export interface Student {
  id: string
  name: string
  class: string
  /** Comma-separated CCA names for table/header display. */
  cca: string
  /** Per-CCA attendance, set for students enrolled in more than one CCA. */
  ccaDetails?: Array<{ name: string; attendance: number }>
  attentionTags: Array<AttentionTag>
  // Academic Performance
  overallPercentage: number
  subjectScores?: Array<SubjectScore>
  conduct: ConductGrade
  approvedMtl: string | null
  learningSupport: string | null
  postSecEligibility: string
  // Behaviour & Discipline
  offences: number
  offenceDetails?: Array<OffenceDetail>
  absences: number
  lateComing: number
  ccaMissed: number
  // Wellbeing
  riskIndicators: number
  riskIndicatorHistory?: Array<RiskIndicatorRecord>
  lowMoodFlagged: string | null
  lowMoodTerms?: Array<{ year: number; terms: Array<string> }>
  socialLinks: number
  selectedBy?: Array<SocialLinkPerson>
  selectedFriends?: Array<SocialLinkPerson>
  counsellingSessions: number
  /** Severity bucket for the single counselling case, shown in the table/filter. */
  counsellingComplexity?: 'Less complex cases' | 'Complex cases'
  sen: string | null
  fas: string | null
  // Family, Housing, Finance
  housing: string | null
  housingType: 'Owned' | 'Rented' | null
  custody: string | null
  custodyDetails: string | null
  commuterStatus: string | null
  afterSchoolArrangement: string | null
  siblings: number
  siblingDetails?: Array<{ name: string; class: string; relationship?: string }>
  externalAgencies: string | null
  supportedByComLink?: 'Yes' | 'No'
  /** Name of the FSC or SSO providing ComLink+ support (shown on the profile) */
  supportedByComLinkBy?: string
  supportedByFsc?: 'Yes' | 'No'
  parentsConsideringDivorce?: 'Yes' | 'No'
  nonIntactFamily?: 'Yes' | 'No'
  // Personal
  birthday?: string
  citizenship?: 'Singapore citizen' | 'Permanent resident' | 'Foreigner'
  languagesSpoken?: string
  // School
  schoolName?: string
  // Student Identity
  nric: string
  indexNumber: number
  formTeacher: string
  coFormTeacher: string | null
  promotionStatus: string | null
  daysPresent: number
  totalSchoolDays: number
  // Teacher & Action
  teacherObservations: string | null
  nextSteps: string | null
}

export type AttentionTag =
  | 'FAS'
  | 'GEP'
  | 'LSM'
  | 'LSP'
  | 'SEN'
  | 'LTA'
  | 'SwAN'

export type ConductGrade = 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor'

export type TemporalType =
  | 'accumulating'
  | 'event-based'
  | 'fixed'
  | 'cross-term'

export interface TermlyAccumulatingData {
  offences: number
  counsellingSessions: number
  daysPresent: number
  totalSchoolDays: number
  lateComing: number
  absences: number
  ccaMissed: number
}


export type FilterField =
  // General
  | 'dateRange'
  | 'class'
  | 'cca'
  // Academic Performance
  | 'overallPercentage'
  | 'conduct'
  | 'approvedMtl'
  | 'learningSupport'
  | 'postSecEligibility'
  // Behaviour and Discipline
  | 'offences'
  | 'absences'
  | 'lateComing'
  | 'ccaMissed'
  // Wellbeing
  | 'riskIndicators'
  | 'lowMoodFlagged'
  | 'socialLinks'
  | 'counsellingSessions'
  | 'sen'
  | 'fas'
  // Family, Housing, Finance
  | 'housing'
  | 'housingType'
  | 'custody'
  | 'commuterStatus'
  | 'afterSchoolArrangement'
  | 'siblings'
  | 'externalAgencies'
  | 'supportedByComLink'
  | 'supportedByFsc'
  | 'parentsConsideringDivorce'
  | 'nonIntactFamily'

export type FilterOperator =
  // Numeric operators
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'eq'
  | 'neq'
  | 'between'
  | 'not_between'
  // Text operators
  | 'contains'
  | 'not_contains'
  | 'is'
  | 'is_not'
  | 'is_empty'
  | 'is_not_empty'

export interface FilterRangeValue {
  min: number
  max: number
}

export interface FilterCriterion {
  id: string
  field: FilterField | string
  operator: FilterOperator
  value: string | number | FilterRangeValue | Array<string>
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: string
  direction: SortDirection
}
