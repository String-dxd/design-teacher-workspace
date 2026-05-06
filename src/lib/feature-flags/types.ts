export type FeatureFlagKey =
  | 'posts'
  | 'forms'
  | 'notifications'
  | 'holistic-reports'
  | 'parents-gateway'
  | 'student-analytics'
  | 'lta-intervention'
  | 'student-groups'
  | 'import-data'
  | 'agency-reports'
  | 'report-generation'

export type FeatureFlags = {
  [K in FeatureFlagKey]: boolean
}
