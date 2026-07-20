import * as React from 'react'

import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAGS_STORAGE_KEY,
  FEATURE_FLAG_REGISTRY,
} from './constants'
import type { FeatureFlagKey, FeatureFlags } from './types'

interface FeatureFlagContextValue {
  flags: FeatureFlags
  isEnabled: (key: FeatureFlagKey) => boolean
  setFlag: (key: FeatureFlagKey, value: boolean) => void
  resetFlags: () => void
}

const FeatureFlagContext = React.createContext<FeatureFlagContextValue | null>(
  null,
)

/**
 * Merge an arbitrary (untrusted) partial flags payload over the defaults,
 * validating each value is a boolean, then apply the plan-043 analytics
 * migration. Shared by the localStorage load path and the SSR cookie seed
 * path so both go through identical reconcile logic.
 */
export function mergeStoredFlags(parsed: unknown): FeatureFlags {
  const merged: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS }
  if (!parsed || typeof parsed !== 'object') {
    return merged
  }
  const record = parsed as Partial<Record<string, boolean>>
  for (const key of Object.keys(
    DEFAULT_FEATURE_FLAGS,
  ) as Array<FeatureFlagKey>) {
    const value = record[key]
    if (typeof value === 'boolean') merged[key] = value
  }

  // Migration (plan 043): pre-hierarchy, 'student-analytics' alone implied
  // the analytics pages. Under parent/child it needs its parent on. Gate
  // on the KEY BEING ABSENT from the stored payload, not on its merged
  // (default-backfilled) value — otherwise a user who explicitly turns
  // the parent off (stored { 'student-analytics-basic': false }) would
  // have it flipped back on at every reload.
  if (
    merged['student-analytics'] &&
    typeof record['student-analytics-basic'] !== 'boolean'
  ) {
    merged['student-analytics-basic'] = true
  }

  return merged
}

function loadFlags(): FeatureFlags {
  if (typeof window === 'undefined') {
    return DEFAULT_FEATURE_FLAGS
  }

  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)
    if (stored) {
      return mergeStoredFlags(JSON.parse(stored))
    }
  } catch {
    // Ignore parse errors, use defaults
  }

  return DEFAULT_FEATURE_FLAGS
}

/** Non-React read for route guards. Returns EFFECTIVE values. */
export function readEffectiveFlags(): FeatureFlags {
  const raw = loadFlags()
  const effective = { ...raw }
  for (const key of Object.keys(raw) as Array<FeatureFlagKey>) {
    const parent = FEATURE_FLAG_REGISTRY[key].parent
    if (parent && !raw[parent]) effective[key] = false
  }
  return effective
}

function saveFlags(flags: FeatureFlags): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(flags))
  } catch {
    // Ignore storage errors
  }

  try {
    // Mirror into a cookie so the server-rendered first paint (and the
    // client's first render before hydration) can seed from the same
    // values instead of always starting from registry defaults. This is a
    // render-seed mirror, not a source of truth — localStorage remains
    // authoritative on the client.
    document.cookie = `${FEATURE_FLAGS_STORAGE_KEY}=${encodeURIComponent(
      JSON.stringify(flags),
    )}; path=/; max-age=31536000; samesite=lax`
  } catch {
    // Ignore cookie write errors
  }
}

export function FeatureFlagProvider({
  children,
  initialFlags,
}: {
  children: React.ReactNode
  /**
   * Server-computed seed (from the root loader's cookie read) used to
   * initialize state so the first client render matches the SSR HTML —
   * no post-mount flag flash. `undefined`/`null` falls back to defaults.
   */
  initialFlags?: unknown
}) {
  const [flags, setFlags] = React.useState<FeatureFlags>(() =>
    initialFlags != null
      ? mergeStoredFlags(initialFlags)
      : DEFAULT_FEATURE_FLAGS,
  )
  const [isHydrated, setIsHydrated] = React.useState(false)

  React.useEffect(() => {
    setFlags(loadFlags())
    setIsHydrated(true)
  }, [])

  React.useEffect(() => {
    if (isHydrated) {
      saveFlags(flags)
    }
  }, [flags, isHydrated])

  const isEnabled = React.useCallback(
    (key: FeatureFlagKey): boolean => {
      const parent = FEATURE_FLAG_REGISTRY[key].parent
      if (parent && !flags[parent]) return false
      return flags[key]
    },
    [flags],
  )

  const setFlag = React.useCallback(
    (key: FeatureFlagKey, value: boolean): void => {
      setFlags((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const resetFlags = React.useCallback((): void => {
    setFlags(DEFAULT_FEATURE_FLAGS)
  }, [])

  const value = React.useMemo(
    () => ({ flags, isEnabled, setFlag, resetFlags }),
    [flags, isEnabled, setFlag, resetFlags],
  )

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

export function useFeatureFlags(): FeatureFlagContextValue {
  const context = React.useContext(FeatureFlagContext)
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider')
  }
  return context
}
