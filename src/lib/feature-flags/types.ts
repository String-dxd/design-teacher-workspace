export type FeatureFlagKey =
  | 'posts'
  | 'forms'
  | 'notifications'
  | 'holistic-reports'
  | 'parents-gateway'
  | 'student-analytics'
  | 'student-analytics-basic'
  | 'lta-intervention'
  | 'student-groups'
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
  | 'hdp-report-builder'
  | 'hdp-template-admin'

export type FeatureFlags = {
  [K in FeatureFlagKey]: boolean
}
