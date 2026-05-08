export type FeatureFlagKey =
  | 'posts'
  | 'forms'
  | 'release-2-communications'
  | 'notifications'
  | 'holistic-reports'
  | 'parents-gateway'
  | 'student-analytics'
  | 'student-analytics-basic'
  | 'lta-intervention'
  | 'student-groups'
  | 'import-data'
  | 'msf-uplift-data'
  | 'developer-interfaces'

export type FeatureFlags = {
  [K in FeatureFlagKey]: boolean
}
