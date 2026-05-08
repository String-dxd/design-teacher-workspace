import type { FeatureFlags } from './types'

export const FEATURE_FLAGS_STORAGE_KEY = 'feature_flags'

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  posts: false,
  forms: true,
  'release-2-communications': false,
  notifications: true,
  'holistic-reports': false,
  'parents-gateway': true,
  'student-analytics': false,
  'student-analytics-basic': false,
  'lta-intervention': false,
  'student-groups': false,
  'import-data': false,
  'msf-uplift-data': false,
  'developer-interfaces': false,
}
