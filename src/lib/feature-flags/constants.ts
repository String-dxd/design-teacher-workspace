import type {
  FeatureFlagKey,
  FeatureFlagMeta,
  FeatureFlagModule,
  FeatureFlags,
} from './types'

export const FEATURE_FLAGS_STORAGE_KEY = 'feature_flags'

export const FEATURE_FLAG_MODULES: Array<{
  id: FeatureFlagModule
  label: string
  description: string
}> = [
  {
    id: 'student-insights',
    label: 'Student Insights',
    description: 'Student list, profiles, and analytics',
  },
  {
    id: 'contextual-intelligence',
    label: 'Contextual Intelligence',
    description: 'Signals and external data about students',
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Holistic, agency, and school reports',
  },
  {
    id: 'communications',
    label: 'Communications',
    description: 'Posts, meetings, and notifications',
  },
  {
    id: 'manage',
    label: 'Manage',
    description: 'Planning and organisation tools',
  },
]

export const FEATURE_FLAG_REGISTRY: Record<FeatureFlagKey, FeatureFlagMeta> = {
  'student-analytics-basic': {
    label: 'Analytics',
    description:
      'Show Analytics and Profiles pages in the sidebar — attendance cohort analytics, academic analytics, and export CSV.',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  'student-analytics': {
    label: 'Insight Buddy',
    description:
      'Add the AI-powered Insight Buddy to Analytics — the Insight Buddy sidebar entry and AI student insights.',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
    parent: 'student-analytics-basic',
  },
  'import-data': {
    label: 'Import data',
    description:
      'Show the Import Data option in the student list to upload custom fields via a guided wizard',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  export: {
    label: 'Export',
    description:
      'Show the Export data option in the student list to export student data',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  'date-range-filter': {
    label: 'Date range filter',
    description:
      'Show the Date range selector in the student list filter bar for filtering data by period',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  'column-visibility': {
    label: 'Show/hide columns',
    description:
      'Show the Show/hide columns control in the student list to toggle which columns are visible',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  'overall-percentage': {
    label: 'Overall %',
    description:
      'Show the Overall % across selected subjects field in the student list column, student profile, filters, and group-by dropdown',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  'social-links': {
    label: 'Social links',
    description:
      'Show the Social links field in the student list column, student profile, filters, and group-by dropdown',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  'primary-contact': {
    label: 'Primary contact',
    description:
      'Show the Primary contact button in the student profile header and the Primary contact field in the Family section',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  'student-groups': {
    label: 'Student groups',
    description:
      'Show the Groups page in the sidebar for organising students into reusable groups',
    stage: 'Release 2',
    module: 'student-insights',
    defaultValue: false,
  },
  'lta-intervention': {
    label: 'LTA intervention',
    description:
      'Show the LTA (long-term absenteeism) tag in the student list and the intervention banner and guidance dialog on the student profile',
    stage: 'Release 2',
    module: 'contextual-intelligence',
    defaultValue: false,
  },
  'attention-tag': {
    label: 'Attention tags',
    description:
      'Show the Attention tag column in the student list with tags such as LTA, SEN, and FAS',
    stage: 'Experiment',
    module: 'contextual-intelligence',
    defaultValue: false,
  },
  'msf-uplift-data': {
    label: 'Familial risk data from Uplift Office',
    description:
      'Show student data sourced from MSF via Uplift Office when this flag is enabled',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  'agency-reports': {
    label: 'Agency reports',
    description:
      'Show the Agency Reports subsection on the student profile and enable the Agency Report generation wizard (template picker, Fill Report with split-pane template reference, Review & Submit, Export)',
    stage: 'Experiment',
    module: 'reports',
    defaultValue: true,
  },
  'report-generation': {
    label: 'Agency report generation',
    description:
      "Agency reports only. Allow new agency reports to be generated. When off, existing reports stay visible on the student profile but the '+ New Agency Report' button and the wizard entry point are hidden",
    stage: 'Experiment',
    module: 'reports',
    defaultValue: true,
    parent: 'agency-reports',
  },
  posts: {
    label: 'Posts',
    description: 'Show or hide the Posts page in the sidebar navigation',
    stage: 'Release 2',
    module: 'communications',
    defaultValue: true,
  },
  'posts-admin-view': {
    label: 'Posts admin view',
    description:
      'Show a "Posts (Admin)" sidebar link that renders the Posts page with admin layout at /announcements?view=admin',
    stage: 'Release 2',
    module: 'communications',
    defaultValue: false,
    parent: 'posts',
  },
  forms: {
    label: 'Custom forms',
    description: 'Show or hide the Custom Forms tab on the Posts page',
    stage: 'Release 3',
    module: 'communications',
    defaultValue: true,
    parent: 'posts',
  },
  meetings: {
    label: 'Meetings',
    description: 'Show the Meetings page in the sidebar under Manage',
    stage: 'Release 2',
    module: 'communications',
    defaultValue: false,
  },
  notifications: {
    label: 'Notifications',
    description: 'Enable notification features',
    stage: 'Release 2',
    module: 'communications',
    defaultValue: true,
  },
  calendar: {
    label: 'Calendar',
    description: 'Show the Calendar page in the sidebar under Manage',
    stage: 'Release 2',
    module: 'manage',
    defaultValue: false,
  },
  'reports-hdp': {
    label: 'HDP Reports module',
    description:
      'Replace the Reports tab with the new HDP module — ambient tagging, per-student river, coverage broadcast, and in-flow drafting. Turning it off restores the current Reports page.',
    stage: 'Experiment',
    module: 'reports',
    defaultValue: true,
  },
  'reports-river-visibility': {
    label: 'Full river for subject teachers',
    description:
      'Show subject teachers the full observation river for a student instead of their own tags plus confirmed threads only. Open research question — default off.',
    stage: 'Experiment',
    module: 'reports',
    defaultValue: false,
    parent: 'reports-hdp',
  },
  'reports-hdp-future': {
    label: 'Future state (Prototype B)',
    description:
      'Switch the report rendering and release flow to the Prototype B future state — trend lines, story register with student reflections, student-first release. Off shows the pragmatic Prototype A rendering.',
    stage: 'Experiment',
    module: 'reports',
    defaultValue: false,
    parent: 'reports-hdp',
  },
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.fromEntries(
  (Object.keys(FEATURE_FLAG_REGISTRY) as Array<FeatureFlagKey>).map((key) => [
    key,
    FEATURE_FLAG_REGISTRY[key].defaultValue,
  ]),
) as FeatureFlags
