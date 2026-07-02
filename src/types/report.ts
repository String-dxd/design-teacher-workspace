import type { ConductGrade } from './student'

export type Term = 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4'

export type ReviewStatus = 'pending' | 'in_review' | 'approved'
export type ParentStatus = 'not_sent' | 'sent' | 'viewed' | 'acknowledged'
export type StudentStatus =
  | 'not_sent'
  | 'sent'
  | 'viewed'
  | 'acknowledged'
  | 'sent_to_parents'
export type SchoolLevel = 'primary' | 'secondary'

// Academic types
export type LearningOutcomeStatus =
  | 'Accomplished'
  | 'Competent'
  | 'Developing'
  | 'Beginning'

export interface LearningOutcome {
  name: string
  description: string
  status: LearningOutcomeStatus
}

export interface SubjectPerformance {
  name: string
  learningOutcomes: Array<LearningOutcome>
}

export interface AcademicData {
  overallPercentage: number
  learningSupport: string | null
  postSecEligibility: string
  subjects: Array<SubjectPerformance>
}

// Secondary academic types
export type SecondaryGrade =
  | 'A1'
  | 'A2'
  | 'B3'
  | 'B4'
  | 'C5'
  | 'C6'
  | 'D7'
  | 'E8'
  | 'F9'

export type GradingTier = 'G3' | 'G2' | 'G1' | 'CMH'

export interface SemesterResult {
  semester: string
  score: number
  grade: SecondaryGrade
  delta?: number
}

export interface SecondarySubjectPerformance {
  name: string
  currentScore: number
  currentGrade: SecondaryGrade
  gradingTier: GradingTier
  semesterHistory: Array<SemesterResult>
  academicYearOverall: number
}

export interface AcademicAggregate {
  label: string
  value: number | string
  description: string
}

export interface ExamOverall {
  examPerformance: number
  semesterLabel: string
  academicYearOverall: number
  cumulativeLabel: string
}

export interface GradeDefinition {
  grade: SecondaryGrade
  minScore: number
  maxScore: number
}

export interface GradingTierDefinition {
  tier: GradingTier
  grades: Array<GradeDefinition>
}

export interface SecondaryAcademicData {
  overallPercentage: number
  learningSupport: string | null
  postSecEligibility: string
  aggregates: Array<AcademicAggregate>
  subjects: Array<SecondarySubjectPerformance>
  overall: ExamOverall
  gradingSystem: Array<GradingTierDefinition>
}

export interface CharacterData {
  conduct: ConductGrade
  offences: number
  absences: number
  lateComing: number
  ccaMissed: number
  riskIndicators: number
  lowMoodFlagged: string | null
  socialLinks: number
  counsellingSessions: number
}

export interface AttendanceData {
  daysPresent: number
  totalSchoolDays: number
  daysLate: number
}

// Holistic types
export type CoreValueLevel =
  | 'Demonstrates Very Strongly'
  | 'Demonstrates Strongly'
  | 'Demonstrates'
  | 'Regularly Shows'
  | 'Beginning'

export interface CoreValue {
  name: string
  description: string
  shortDescription: string
  level: CoreValueLevel
  score: number
  supportedBy: Array<string>
}

export type NapfaAward = 'Gold' | 'Silver' | 'Bronze' | 'Pass'

export interface PhysicalFitness {
  bmiCategory: string
  percentile: number
  description: string
  napfaAward?: NapfaAward
  napfaDescription?: string
}

export interface VIAActivity {
  category: string
  activityName: string
  role: string
  hours: number
  description: string
}

export interface CCAInfo {
  category: string
  name: string
  role: string
  years: number
  recognition: Array<string>
  sessionsAttended: number
  totalSessions: number
}

export interface HolisticData {
  coreValues: Array<CoreValue>
  physicalFitness: PhysicalFitness
  via: Array<VIAActivity>
  cca: Array<CCAInfo>
}

// Report Builder layout model.
// The layout is a "template of intent": the ordered set of sections a report shows.
// A teacher's build persists it on their report instance; an admin template persists
// it as the shared definition. P1 renders its curated sections as-is; secondary bulk
// (out of the test-track scope) renders layout ∩ available-data.
export type ReportBlockViz = 'bar' | 'table' | 'progress' | 'line'

export interface ReportBlock {
  key: string // matches a P1_SECTION_DEFS key in src/data/report-layouts.ts
  enabled: boolean
  order: number
  viz?: ReportBlockViz // for chartable sections
}

export interface ReportLayout {
  blocks: Array<ReportBlock>
}

export interface HolisticReport {
  id: string
  studentId: string
  studentName: string
  studentClass: string
  schoolName?: string
  term: Term
  academicYear: number
  generatedAt: Date
  schoolLevel: SchoolLevel
  academic: AcademicData
  secondaryAcademic?: SecondaryAcademicData
  character: CharacterData
  holistic: HolisticData
  teacherObservations: string | null
  nextSteps: string | null
  teacherComments: string | null
  reviewStatus: ReviewStatus
  parentStatus: ParentStatus
  studentStatus: StudentStatus
  nric: string
  indexNumber: number
  formTeacher: string
  coFormTeacher: string | null
  promotionStatus: string | null
  attendance: AttendanceData
  // Optional — reports built with the Report Builder carry their section layout so
  // the detail + parent share views render exactly what was built. Older reports
  // without one fall back to a default layout at render time.
  layout?: ReportLayout
}
