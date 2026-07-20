import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { FEATURE_FLAGS_STORAGE_KEY, FEATURE_FLAG_REGISTRY } from './constants'
import { readEffectiveFlags } from './context'

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
  it('turns on student-analytics-basic when student-analytics is stored on alone', () => {
    setStoredFlags({ 'student-analytics': true })
    const effective = readEffectiveFlags()
    expect(effective['student-analytics-basic']).toBe(true)
    expect(effective['student-analytics']).toBe(true)
  })
})
