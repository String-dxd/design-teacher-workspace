export type FeatureFlagKey =
  | 'posts'
  | 'forms'
  | 'notifications'
  | 'hdp-reports'
  | 'student-analytics'
  | 'student-analytics-basic'
  | 'lta-intervention'
  | 'student-groups'
  | 'reports'
  | 'calendar'
  | 'meetings'
  | 'import-data'
  | 'agency-reports'
  | 'report-generation'
  | 'msf-uplift-data'
  | 'date-range-filter'
  | 'attention-tag'
  | 'column-visibility'
  | 'overall-percentage'
  | 'social-links'
  | 'export'
  | 'primary-contact'
  | 'posts-admin-view'
  | 'reports-admin-view'
  | 'reports-hdp'
  | 'reports-river-visibility'

export type FeatureFlags = {
  [K in FeatureFlagKey]: boolean
}

export type FeatureFlagModule =
  | 'student-insights'
  | 'contextual-intelligence'
  | 'reports'
  | 'communications'
  | 'manage'

export type FeatureFlagStage = 'Experiment' | 'Release 2' | 'Release 3'

export interface FeatureFlagMeta {
  label: string
  description: string
  stage: FeatureFlagStage
  module: FeatureFlagModule
  defaultValue: boolean
}
