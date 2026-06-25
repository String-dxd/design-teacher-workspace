import type { FeatureFlags } from './types'

export const FEATURE_FLAGS_STORAGE_KEY = 'feature_flags'

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  posts: true,
  forms: true,
  notifications: true,
  'holistic-reports': false,
  'parents-gateway': true,
  'student-analytics': false,
  'student-analytics-basic': false,
  'lta-intervention': false,
  'student-groups': false,
  'import-data': false,
  'agency-reports': true,
  'report-generation': true,
  'msf-uplift-data': false,
  'date-range-filter': false,
  'attention-tag': false,
  'column-visibility': false,
  'overall-percentage': false,
  'social-links': false,
  export: false,
  'primary-contact': false,
}
