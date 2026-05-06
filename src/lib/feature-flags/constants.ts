import type { FeatureFlags } from './types'

export const FEATURE_FLAGS_STORAGE_KEY = 'feature_flags'

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  posts: true,
  forms: true,
  notifications: true,
  'holistic-reports': false,
  'parents-gateway': true,
  'student-analytics': false,
  'lta-intervention': false,
  'student-groups': false,
  'import-data': false,
  'agency-reports': true,
  'report-generation': true,
}
