import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAGS_STORAGE_KEY,
  FEATURE_FLAG_REGISTRY,
} from './constants'
import {
  mergeStoredFlags,
  parseSeedCookie,
  readEffectiveFlags,
  resolveEffective,
} from './context'

// Under this repo's vitest/jsdom/Node combination, `globalThis.localStorage`
// occasionally comes back `undefined` in a worker (see draft-storage.test.ts
// for the full explanation). Install a minimal in-memory Storage-compatible
// stub so these tests exercise readEffectiveFlags against a real Storage
// contract deterministically.
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

beforeAll(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
})

afterEach(() => {
  localStorage.clear()
})

function setStoredFlags(partial: Record<string, unknown>): void {
  localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(partial))
}

describe('FEATURE_FLAG_REGISTRY parent integrity', () => {
  const registryKeys = new Set(Object.keys(FEATURE_FLAG_REGISTRY))

  it('every parent is itself a key of the registry', () => {
    for (const [key, meta] of Object.entries(FEATURE_FLAG_REGISTRY)) {
      if (meta.parent) {
        expect(registryKeys.has(meta.parent), `${key} -> ${meta.parent}`).toBe(
          true,
        )
      }
    }
  })

  it('a parent flag must not itself have a parent (depth <= 1)', () => {
    for (const [key, meta] of Object.entries(FEATURE_FLAG_REGISTRY)) {
      if (meta.parent) {
        const parentMeta = FEATURE_FLAG_REGISTRY[meta.parent]
        expect(
          parentMeta.parent,
          `${key} -> ${meta.parent} -> ?`,
        ).toBeUndefined()
      }
    }
  })

  it('every child shares its parent module', () => {
    for (const [key, meta] of Object.entries(FEATURE_FLAG_REGISTRY)) {
      if (meta.parent) {
        const parentMeta = FEATURE_FLAG_REGISTRY[meta.parent]
        expect(meta.module, key).toBe(parentMeta.module)
      }
    }
  })
})

describe('readEffectiveFlags', () => {
  it('resolves a child to false when its stored parent is off (remember semantics)', () => {
    setStoredFlags({ 'reports-hdp': false, 'reports-hdp-future': true })
    expect(readEffectiveFlags()['reports-hdp-future']).toBe(false)
  })

  it('resolves a child to its stored value once the parent is on', () => {
    setStoredFlags({ 'reports-hdp': true, 'reports-hdp-future': true })
    expect(readEffectiveFlags()['reports-hdp-future']).toBe(true)
  })

  it('ignores non-boolean stored values and falls back to the default', () => {
    setStoredFlags({ posts: 'yes' })
    const defaultPosts = FEATURE_FLAG_REGISTRY.posts.defaultValue
    expect(readEffectiveFlags().posts).toBe(defaultPosts)
  })
})

describe('loadFlags analytics reconcile (via readEffectiveFlags)', () => {
  it('turns on student-analytics-basic when student-analytics is stored on alone (legacy, no _v)', () => {
    setStoredFlags({ 'student-analytics': true })
    const effective = readEffectiveFlags()
    expect(effective['student-analytics-basic']).toBe(true)
    expect(effective['student-analytics']).toBe(true)
  })

  it('does not override an explicit stored student-analytics-basic: false once it has been migrated (_v: 2)', () => {
    // A payload carrying `_v` represents a post-migration save — the
    // version marker means the reconcile must NOT re-fire, so an explicit
    // parent-off sticks.
    setStoredFlags({
      'student-analytics': true,
      'student-analytics-basic': false,
      _v: 2,
    })
    const effective = readEffectiveFlags()
    expect(effective['student-analytics-basic']).toBe(false)
    expect(effective['student-analytics']).toBe(false)
  })

  it('migrates a real legacy payload that persisted every key (including an explicit basic: false)', () => {
    // Pre-hierarchy saveFlags wrote every flag key, so a genuine legacy
    // payload carries an explicit `student-analytics-basic: false` (its
    // pre-hierarchy default) alongside every other flag at its default —
    // and, critically, no `_v` marker. Key-absence gating could never
    // distinguish this from real user intent; the version marker can.
    setStoredFlags({
      ...Object.fromEntries(
        Object.keys(FEATURE_FLAG_REGISTRY).map((key) => [
          key,
          FEATURE_FLAG_REGISTRY[key as keyof typeof FEATURE_FLAG_REGISTRY]
            .defaultValue,
        ]),
      ),
      'student-analytics': true,
      'student-analytics-basic': false,
    })
    const effective = readEffectiveFlags()
    expect(effective['student-analytics-basic']).toBe(true)
    expect(effective['student-analytics']).toBe(true)
  })

  it('keeps an explicit student-analytics-basic: false stable across reloads once migrated', () => {
    // Round-trip: a payload already stamped with `_v: 2` and an explicit
    // basic: false must stay false — the whole point of the marker is that
    // it does not get re-migrated on every subsequent load.
    setStoredFlags({
      'student-analytics': true,
      'student-analytics-basic': false,
      _v: 2,
    })
    const effective = readEffectiveFlags()
    expect(effective['student-analytics-basic']).toBe(false)
  })
})

describe('mergeStoredFlags (shared by localStorage load and SSR cookie seed)', () => {
  it('merges a valid partial payload over the defaults', () => {
    const merged = mergeStoredFlags({ posts: false, meetings: true })
    expect(merged.posts).toBe(false)
    expect(merged.meetings).toBe(true)
    // Untouched keys fall back to their registry defaults.
    expect(merged['import-data']).toBe(
      FEATURE_FLAG_REGISTRY['import-data'].defaultValue,
    )
  })

  it('ignores junk-typed values and non-object input', () => {
    expect(mergeStoredFlags({ posts: 'yes', meetings: 1 })).toEqual(
      DEFAULT_FEATURE_FLAGS,
    )
    expect(mergeStoredFlags(null)).toEqual(DEFAULT_FEATURE_FLAGS)
    expect(mergeStoredFlags('garbage')).toEqual(DEFAULT_FEATURE_FLAGS)
    expect(mergeStoredFlags(42)).toEqual(DEFAULT_FEATURE_FLAGS)
  })

  it('applies the analytics reconcile to a seeded (cookie) input', () => {
    const merged = mergeStoredFlags({ 'student-analytics': true })
    expect(merged['student-analytics-basic']).toBe(true)
    expect(merged['student-analytics']).toBe(true)
  })

  it('keeps an explicit student-analytics-basic: false from a seeded, already-migrated (_v: 2) input', () => {
    const merged = mergeStoredFlags({
      'student-analytics': true,
      'student-analytics-basic': false,
      _v: 2,
    })
    expect(merged['student-analytics-basic']).toBe(false)
    expect(merged['student-analytics']).toBe(true)
  })

  it('migrates a legacy (no _v) input even when it explicitly carries basic: false', () => {
    const merged = mergeStoredFlags({
      'student-analytics': true,
      'student-analytics-basic': false,
    })
    expect(merged['student-analytics-basic']).toBe(true)
    expect(merged['student-analytics']).toBe(true)
  })
})

describe('resolveEffective (shared by isEnabled and readEffectiveFlags)', () => {
  // isEnabled (provider) delegates to this same helper, so exercising it
  // directly covers the provider's effective-resolution logic too.

  it('resolves a childless key to its raw stored value', () => {
    expect(
      resolveEffective('meetings', {
        ...DEFAULT_FEATURE_FLAGS,
        meetings: true,
      }),
    ).toBe(true)
    expect(
      resolveEffective('meetings', {
        ...DEFAULT_FEATURE_FLAGS,
        meetings: false,
      }),
    ).toBe(false)
  })

  it('resolves a child to false when its parent is off, regardless of the child value', () => {
    const flags = {
      ...DEFAULT_FEATURE_FLAGS,
      'reports-hdp': false,
      'reports-hdp-future': true,
    }
    expect(resolveEffective('reports-hdp-future', flags)).toBe(false)
  })

  it('resolves a child to its own value once the parent is on', () => {
    const flagsOn = {
      ...DEFAULT_FEATURE_FLAGS,
      'reports-hdp': true,
      'reports-hdp-future': true,
    }
    const flagsOff = {
      ...DEFAULT_FEATURE_FLAGS,
      'reports-hdp': true,
      'reports-hdp-future': false,
    }
    expect(resolveEffective('reports-hdp-future', flagsOn)).toBe(true)
    expect(resolveEffective('reports-hdp-future', flagsOff)).toBe(false)
  })

  it('is exactly what readEffectiveFlags produces for every key, given the same stored payload', () => {
    setStoredFlags({
      'reports-hdp': false,
      'reports-hdp-future': true,
      posts: false,
      forms: true,
      'student-analytics': true,
      'student-analytics-basic': false,
      _v: 2,
    })
    const stored = JSON.parse(
      localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)!,
    ) as Record<string, unknown>
    const merged = mergeStoredFlags(stored)
    const effective = readEffectiveFlags()
    for (const key of Object.keys(FEATURE_FLAG_REGISTRY) as Array<
      keyof typeof FEATURE_FLAG_REGISTRY
    >) {
      expect(effective[key], key).toBe(resolveEffective(key, merged))
    }
  })
})

describe('parseSeedCookie', () => {
  it('parses a valid URI-encoded JSON payload into an object', () => {
    const raw = encodeURIComponent(JSON.stringify({ posts: false, _v: 2 }))
    expect(parseSeedCookie(raw)).toEqual({ posts: false, _v: 2 })
  })

  it('returns null for malformed URI encoding', () => {
    expect(parseSeedCookie('%')).toBeNull()
  })

  it('returns null for a value that decodes fine but is not valid JSON', () => {
    expect(parseSeedCookie(encodeURIComponent('not json'))).toBeNull()
  })

  it('returns null for undefined input (cookie absent)', () => {
    expect(parseSeedCookie(undefined)).toBeNull()
  })
})
