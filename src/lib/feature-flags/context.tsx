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

function loadFlags(): FeatureFlags {
  if (typeof window === 'undefined') {
    return DEFAULT_FEATURE_FLAGS
  }

  try {
    const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Record<string, boolean>>
      const merged: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS }
      for (const key of Object.keys(
        DEFAULT_FEATURE_FLAGS,
      ) as Array<FeatureFlagKey>) {
        const value = parsed[key]
        if (typeof value === 'boolean') merged[key] = value
      }

      // Migration (plan 043): pre-hierarchy, 'student-analytics' alone implied
      // the analytics pages. Under parent/child it needs its parent on.
      if (merged['student-analytics'] && !merged['student-analytics-basic']) {
        merged['student-analytics-basic'] = true
      }

      return merged
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
}

export function FeatureFlagProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [flags, setFlags] = React.useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS)
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
