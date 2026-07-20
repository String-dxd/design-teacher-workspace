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
  const record = parsed as Record<string, unknown>
  for (const key of Object.keys(
    DEFAULT_FEATURE_FLAGS,
  ) as Array<FeatureFlagKey>) {
    const value = record[key]
    if (typeof value === 'boolean') merged[key] = value
  }

  // Migration (plan 043): pre-hierarchy, 'student-analytics' alone implied
  // the analytics pages. Under parent/child it needs its parent on. This
  // used to gate on the 'student-analytics-basic' key being ABSENT from the
  // stored payload — but pre-hierarchy saveFlags persisted EVERY flag key,
  // so a real legacy payload always carries an explicit
  // 'student-analytics-basic' value (often `false`, its pre-hierarchy
  // default). Key absence can't tell "user turned it off" apart from
  // "this predates the hierarchy" — it never fired for real users, who
  // silently lost analytics. saveFlags now stamps every write with a
  // version marker (`_v: 2`), so a payload's presence/absence of `_v` is
  // the actual signal: no `_v` means legacy, migrate it once. Any `_v`
  // means the payload already went through (or postdates) the migration,
  // so an explicit parent-off must stick.
  const isLegacyPayload = record._v === undefined
  if (isLegacyPayload && merged['student-analytics']) {
    merged['student-analytics-basic'] = true
  }

  return merged
}

/**
 * Parse the raw (URI-encoded, JSON) feature-flags seed cookie into an
 * untrusted payload, or `null` on any decode/parse failure. Pure so it can
 * be exercised without a server function. `mergeStoredFlags` validates the
 * result before it reaches state.
 */
export function parseSeedCookie(raw: string | undefined): unknown {
  if (raw === undefined) return null
  try {
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }
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

/**
 * Resolve a single flag's EFFECTIVE value: a child flag whose parent is off
 * always reads as off, regardless of its own stored value. Shared by the
 * provider's `isEnabled` and the non-React `readEffectiveFlags` so both
 * apply identical parent-gating.
 */
export function resolveEffective(
  key: FeatureFlagKey,
  flags: FeatureFlags,
): boolean {
  const parent = FEATURE_FLAG_REGISTRY[key].parent
  if (parent && !flags[parent]) return false
  return flags[key]
}

/** Non-React read for route guards. Returns EFFECTIVE values. */
export function readEffectiveFlags(): FeatureFlags {
  const raw = loadFlags()
  const effective = { ...raw }
  for (const key of Object.keys(raw) as Array<FeatureFlagKey>) {
    effective[key] = resolveEffective(key, raw)
  }
  return effective
}

/**
 * Persist flags to localStorage (and mirror to a cookie for SSR seeding),
 * stamping the payload with the `_v: 2` version marker consumed by
 * `mergeStoredFlags`'s legacy-migration check. Exported so tests can
 * exercise the real write path instead of hand-authoring `_v` in fixtures.
 */
export function saveFlags(flags: FeatureFlags): void {
  if (typeof window === 'undefined') return

  // Stamp every write with a version marker so a future stored payload can
  // be told apart from a legacy (pre-hierarchy) one — see the migration
  // comment in `mergeStoredFlags`.
  const serialized = JSON.stringify({ ...flags, _v: 2 })

  try {
    localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, serialized)
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
      serialized,
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
    (key: FeatureFlagKey): boolean => resolveEffective(key, flags),
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
