import type { ReactNode } from 'react'
import type {
  FilterCriterion,
  FilterField,
  FilterOperator,
} from '@/types/student'

/** A filter is "complete" (should be applied) when its value is filled in */
export function isFilterComplete(filter: FilterCriterion): boolean {
  const { operator, value } = filter
  if (operator === 'is_empty' || operator === 'is_not_empty') return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object' && value !== null) return true // range
  if (typeof value === 'number') return true
  return typeof value === 'string' && value.trim() !== ''
}

export type FieldType =
  | 'numeric'
  | 'text'
  | 'boolean'
  | 'enum'
  | 'multiselect'
  | 'period'

/**
 * Data period (date range) options for the "Date range" filter.
 *
 * "Latest available" is the default view: for each data field it resolves to the
 * most recent term that actually has a value (e.g. for Conduct grade at the
 * start of Term 2 2026, the latest available data is still Term 1 2026).
 * Users can instead pin the view to specific year/term combinations.
 *
 * Years are listed most recent first, and terms within a year are also listed
 * most recent first (T2 above T1) to match the date-range picker design.
 */
export const LATEST_PERIOD = 'latest'

/** Display label for the "Latest available" period option */
export const LATEST_LABEL = 'Latest available (Recommended)'

interface PeriodTerm {
  /** Stable value stored in the filter, e.g. "2026-T2" */
  value: string
  /** Short label shown in the picker, e.g. "T2" */
  label: string
}

interface PeriodYear {
  year: number
  terms: Array<PeriodTerm>
}

export const periodYears: Array<PeriodYear> = [
  {
    year: 2026,
    // 2026 only has T1 and T2 so far
    terms: [
      { value: '2026-T2', label: 'T2' },
      { value: '2026-T1', label: 'T1' },
    ],
  },
  {
    year: 2025,
    terms: [
      { value: '2025-T4', label: 'T4' },
      { value: '2025-T3', label: 'T3' },
      { value: '2025-T2', label: 'T2' },
      { value: '2025-T1', label: 'T1' },
    ],
  },
]

/** Human-readable label for a stored period value, e.g. "2026-T1" -> "T1, 2026" */
export function formatPeriodValue(value: string): string {
  if (value === LATEST_PERIOD) return LATEST_LABEL
  for (const year of periodYears) {
    const term = year.terms.find((t) => t.value === value)
    if (term) return `${term.label}, ${year.year}`
  }
  return value
}

export type FieldGroup =
  | 'general'
  | 'attendance'
  | 'academic'
  | 'behaviour'
  | 'wellbeing'
  | 'family'

export interface OperatorOption {
  value: FilterOperator
  label: string
  icon?: ReactNode
}

export interface FilterFieldOption {
  field: FilterField
  label: string
  type: FieldType
  group: FieldGroup
  operators: Array<OperatorOption>
  defaultOperator: FilterOperator
  defaultValue: string | number
  enumValues?: Array<string>
}

export const groupLabels: Record<FieldGroup, string> = {
  general: 'General',
  attendance: 'Attendance',
  academic: 'Academic',
  behaviour: 'Behaviour',
  wellbeing: 'Wellbeing',
  family: 'Family',
}

export const groupOrder: Array<FieldGroup> = [
  'general',
  'attendance',
  'behaviour',
  'wellbeing',
  'academic',
  'family',
]

export const textOperators: Array<OperatorOption> = [
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]

// Note: numericOperators and booleanOperators include icons that need to be
// rendered with React components, so they are defined in the component file
// to avoid importing React components in this data file.

interface FilterFieldConfig {
  field: FilterField
  label: string
  type: FieldType
  group: FieldGroup
  defaultOperator: FilterOperator
  defaultValue: string | number
  enumValues?: Array<string>
}

export const filterFieldConfigs: Array<FilterFieldConfig> = [
  // General
  {
    field: 'dateRange',
    label: 'Date range',
    type: 'period',
    group: 'general',
    defaultOperator: 'is',
    defaultValue: LATEST_PERIOD,
  },
  {
    field: 'cca',
    label: 'CCA',
    type: 'multiselect',
    group: 'general',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: [
      'No CCA',
      'AVA',
      'Robotics',
      'Flying club',
      'Badminton',
      'Basketball',
      'Bowling',
      'Football',
      'Netball',
      'Tchoukball',
      "Boys' brigade",
      "Girls' brigade",
      'National cadet corps (Land)',
      'National civil defence cadet corps',
      'National police cadet corps',
      'Choir',
      'Concert band',
      'English drama',
      'Guitar ensemble',
      'Modern dance',
      'Visual arts',
    ],
  },
  // Attendance
  {
    field: 'attendance',
    label: 'Attendance (%)',
    type: 'numeric',
    group: 'attendance',
    defaultOperator: 'lte',
    defaultValue: 90,
  },
  {
    field: 'lateComing',
    label: 'Late-coming (days)',
    type: 'numeric',
    group: 'attendance',
    defaultOperator: 'gte',
    defaultValue: 5,
  },
  {
    field: 'absences',
    label: 'Non-VR absences (days)',
    type: 'numeric',
    group: 'attendance',
    defaultOperator: 'gte',
    defaultValue: 5,
  },
  {
    field: 'ccaMissed',
    label: 'CCA attendance(%)',
    type: 'numeric',
    group: 'attendance',
    defaultOperator: 'gte',
    defaultValue: 3,
  },
  // Behaviour
  {
    field: 'offences',
    label: 'Offences',
    type: 'numeric',
    group: 'behaviour',
    defaultOperator: 'gte',
    defaultValue: 1,
  },
  {
    field: 'counsellingSessions',
    label: 'Counselling',
    type: 'multiselect',
    group: 'behaviour',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Complex cases', 'Less complex cases', 'None'],
  },
  {
    field: 'sen',
    label: 'Special Educational Needs (SEN)',
    type: 'multiselect',
    group: 'behaviour',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: [
      'None',
      'Intellectual disability',
      'Attention Deficit Hyperactivity Disorder',
      'Depression',
      'Developmental Language Disorder',
      'Dyslexia',
    ],
  },
  {
    field: 'conduct',
    label: 'Conduct grade',
    type: 'multiselect',
    group: 'behaviour',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
  },
  // Academic
  {
    field: 'overallPercentage',
    label: 'Overall % across selected subjects',
    type: 'numeric',
    group: 'academic',
    defaultOperator: 'lte',
    defaultValue: 50,
  },
  {
    field: 'approvedMtl',
    label: 'Approved MTL',
    type: 'text',
    group: 'academic',
    defaultOperator: 'is_not_empty',
    defaultValue: '',
  },
  {
    field: 'learningSupport',
    label: 'Learning support',
    type: 'multiselect',
    group: 'academic',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['LSP', 'LSM', 'None'],
  },
  {
    field: 'postSecEligibility',
    label: 'Post-Sec Eligibility',
    type: 'text',
    group: 'academic',
    defaultOperator: 'contains',
    defaultValue: '',
  },
  // Wellbeing
  {
    field: 'riskIndicators',
    label: 'TCI risk indicators',
    type: 'numeric',
    group: 'wellbeing',
    defaultOperator: 'eq',
    defaultValue: 3,
  },
  {
    field: 'lowMoodFlagged',
    label: 'Low mood flagged 2+ terms',
    type: 'multiselect',
    group: 'wellbeing',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Yes', 'No'],
  },
  {
    field: 'socialLinks',
    label: 'Social links',
    type: 'numeric',
    group: 'wellbeing',
    defaultOperator: 'lte',
    defaultValue: 2,
  },
  // Family, Housing, Finance
  {
    field: 'parentsConsideringDivorce',
    label: 'Parent enrolled in CPP',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Yes', 'No'],
  },
  {
    field: 'nonIntactFamily',
    label: 'Parents are divorced',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Yes', 'No'],
  },
  {
    field: 'supportedByComLink',
    label: 'Supported by ComLink+',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Yes', 'No'],
  },
  {
    field: 'supportedByFsc',
    label: 'Supported by FSC',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Yes', 'No'],
  },
  {
    field: 'fas',
    label: 'FAS',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['MOE FAS', 'School based FAS', 'None'],
  },
  {
    field: 'housing',
    label: 'Housing',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: [
      'Others',
      'HDB 1-room flat',
      'HDB 2-room flat',
      'HDB 3-room flat',
      'HDB 4-room flat',
      'HDB 5-room flat',
      'HDB executive/multi-generation flat',
      'HUDC flat',
      'Private flat/apartment',
      'Semi-detached house',
      'Terrace',
    ],
  },
  {
    field: 'housingType',
    label: 'Housing ownership',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: [
      'None',
      'Not applicable',
      'Rented',
      'Owner-occupied',
      'Others',
    ],
  },
  {
    field: 'siblings',
    label: 'Siblings',
    type: 'numeric',
    group: 'family',
    defaultOperator: 'gte',
    defaultValue: 3,
  },
  {
    field: 'commuterStatus',
    label: 'Commuter status',
    type: 'text',
    group: 'family',
    defaultOperator: 'is_not_empty',
    defaultValue: '',
  },
  {
    field: 'afterSchoolArrangement',
    label: 'After-school arrangement',
    type: 'text',
    group: 'family',
    defaultOperator: 'is_not_empty',
    defaultValue: '',
  },
]
