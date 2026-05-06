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

export type FieldType = 'numeric' | 'text' | 'boolean' | 'enum' | 'multiselect'

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

export interface FilterFieldConfig {
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
    field: 'class',
    label: 'Class',
    type: 'text',
    group: 'general',
    defaultOperator: 'contains',
    defaultValue: '',
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
    field: 'lateComing',
    label: 'Late-coming(%)',
    type: 'numeric',
    group: 'attendance',
    defaultOperator: 'gte',
    defaultValue: 5,
  },
  {
    field: 'absences',
    label: 'Non-VR absences(%)',
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
    label: 'Counselling cases',
    type: 'multiselect',
    group: 'behaviour',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Complex cases', 'Less complex cases', '-'],
  },
  {
    field: 'sen',
    label: 'SEN',
    type: 'multiselect',
    group: 'behaviour',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: [
      '-',
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
    enumValues: ['LSP', 'LSM'],
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
    enumValues: ['-', 'Yes', 'No'],
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
    field: 'siblings',
    label: 'Siblings',
    type: 'numeric',
    group: 'family',
    defaultOperator: 'gte',
    defaultValue: 3,
  },
  {
    field: 'fas',
    label: 'FAS',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['MOE FAS', 'School based FAS', '-'],
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
    enumValues: ['Owner occupied', 'Rented'],
  },
  {
    field: 'supportedByComLink',
    label: 'Supported by ComLink+',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Yes', 'No', '-'],
  },
  {
    field: 'supportedByFsc',
    label: 'Supported by FSC in the past 2 years',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Yes', 'No', '-'],
  },
  {
    field: 'nonIntactFamily',
    label: 'From Non-Intact Family',
    type: 'multiselect',
    group: 'family',
    defaultOperator: 'is',
    defaultValue: '',
    enumValues: ['Yes', 'No', '-'],
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
