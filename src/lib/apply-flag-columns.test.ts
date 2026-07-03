import { describe, expect, it } from 'vitest'
import { applyFlagColumns } from './apply-flag-columns'
import type { FlagColumnSpec } from './apply-flag-columns'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Col {
  id: string
}

const col = (id: string): Col => ({ id })

const defaults: Array<Col> = [
  col('name'),
  col('cca'),
  col('attentionTags'),
  col('lowMoodFlagged'),
  col('socialLinks'),
  col('overallPercentage'),
  col('msfA'),
  col('msfB'),
  col('fas'),
]

const spec = (overrides: Partial<FlagColumnSpec>): FlagColumnSpec => ({
  enabled: true,
  ids: [],
  anchorId: '',
  position: 'before',
  ...overrides,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('applyFlagColumns', () => {
  it('inserts before the anchor', () => {
    const prev = [col('name'), col('fas')]
    const result = applyFlagColumns(
      prev,
      [spec({ ids: ['msfA', 'msfB'], anchorId: 'fas', position: 'before' })],
      defaults,
    )
    expect(result.map((c) => c.id)).toEqual(['name', 'msfA', 'msfB', 'fas'])
  })

  it('inserts after the anchor', () => {
    const prev = [col('name'), col('cca'), col('fas')]
    const result = applyFlagColumns(
      prev,
      [spec({ ids: ['attentionTags'], anchorId: 'cca', position: 'after' })],
      defaults,
    )
    expect(result.map((c) => c.id)).toEqual([
      'name',
      'cca',
      'attentionTags',
      'fas',
    ])
  })

  it('appends when the anchor is missing', () => {
    const prev = [col('name')]
    const result = applyFlagColumns(
      prev,
      [spec({ ids: ['socialLinks'], anchorId: 'nope', position: 'after' })],
      defaults,
    )
    expect(result.map((c) => c.id)).toEqual(['name', 'socialLinks'])
  })

  it('removes the columns when the flag is off', () => {
    const prev = [col('name'), col('msfA'), col('msfB'), col('fas')]
    const result = applyFlagColumns(
      prev,
      [
        spec({
          enabled: false,
          ids: ['msfA', 'msfB'],
          anchorId: 'fas',
          position: 'before',
        }),
      ],
      defaults,
    )
    expect(result.map((c) => c.id)).toEqual(['name', 'fas'])
  })

  it('returns the same reference when nothing changes', () => {
    const prev = [col('name'), col('attentionTags')]
    const specs = [
      // enabled + already present → no-op
      spec({ ids: ['attentionTags'], anchorId: 'cca', position: 'after' }),
      // disabled + already absent → no-op
      spec({ enabled: false, ids: ['socialLinks'], anchorId: 'x' }),
      // enabled but no matching default columns → skipped
      spec({ ids: ['unknownColumn'], anchorId: 'name', position: 'after' }),
    ]
    expect(applyFlagColumns(prev, specs, defaults)).toBe(prev)
  })

  it('lets a later spec anchor on a column inserted in the same pass', () => {
    const prev = [col('name'), col('lowMoodFlagged'), col('fas')]
    const result = applyFlagColumns(
      prev,
      [
        spec({
          ids: ['socialLinks'],
          anchorId: 'lowMoodFlagged',
          position: 'after',
        }),
        spec({
          ids: ['overallPercentage'],
          anchorId: 'socialLinks',
          position: 'after',
        }),
      ],
      defaults,
    )
    expect(result.map((c) => c.id)).toEqual([
      'name',
      'lowMoodFlagged',
      'socialLinks',
      'overallPercentage',
      'fas',
    ])
  })

  it('applies inserts and removals from multiple specs in one pass', () => {
    const prev = [col('name'), col('attentionTags'), col('fas')]
    const result = applyFlagColumns(
      prev,
      [
        spec({ enabled: false, ids: ['attentionTags'], anchorId: 'cca' }),
        spec({ ids: ['msfA', 'msfB'], anchorId: 'fas', position: 'before' }),
      ],
      defaults,
    )
    expect(result.map((c) => c.id)).toEqual(['name', 'msfA', 'msfB', 'fas'])
  })
})
