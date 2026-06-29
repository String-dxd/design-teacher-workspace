export type FeatureFlagKey =
  | 'posts'
  | 'forms'
  | 'notifications'
  | 'holistic-reports'
  | 'parents-gateway'
  | 'student-analytics'
  | 'lta-intervention'
  | 'student-groups'
  | 'reports'
  | 'calendar'
  | 'meetings'
  | 'import-data'

export type FeatureFlags = {
  [K in FeatureFlagKey]: boolean
}
