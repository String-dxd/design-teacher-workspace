import { describe, expect, it } from 'vitest'
import { trendForSubject, trendsForEntries } from './hdp-trends'
import type { HdpMarkEntry, SchoolYear } from '@/types/hdp'

function entry(
  subject: string,
  schoolYear: string,
  semester: 1 | 2,
  score: number,
): HdpMarkEntry {
  return {
    subject,
    schoolYear: schoolYear as SchoolYear,
    semester,
    assessment: 'wa1',
    score,
  }
}

describe('trendForSubject', () => {
  it('classifies climbing when the last delta exceeds +2', () => {
    const entries = [
      entry('English', '2025', 1, 60),
      entry('English', '2025', 2, 63),
      entry('English', '2026', 1, 66),
      entry('English', '2026', 2, 70),
    ]
    const result = trendForSubject(entries, 'English')
    expect(result.direction).toBe('climbing')
    expect(result.points).toEqual([60, 63, 66, 70])
  })

  it('classifies easing when the last delta is below -2', () => {
    const entries = [
      entry('Science', '2025', 1, 80),
      entry('Science', '2025', 2, 77),
      entry('Science', '2026', 1, 74),
      entry('Science', '2026', 2, 68),
    ]
    const result = trendForSubject(entries, 'Science')
    expect(result.direction).toBe('easing')
    expect(result.points).toEqual([80, 77, 74, 68])
  })

  it('classifies recovering for a mid-series dip followed by a rise', () => {
    const entries = [
      entry('Mathematics', '2025', 1, 65),
      entry('Mathematics', '2025', 2, 55), // dip — min, neither first nor last
      entry('Mathematics', '2026', 1, 60),
      entry('Mathematics', '2026', 2, 64), // last delta (+4) stays within ±2 of prev step
    ]
    const result = trendForSubject(entries, 'Mathematics')
    expect(result.direction).toBe('recovering')
    expect(result.points).toEqual([65, 55, 60, 64])
  })

  it('classifies steady when the last delta stays within ±2 and there is no dip-then-rise shape', () => {
    const entries = [
      entry('Humanities', '2025', 1, 60),
      entry('Humanities', '2025', 2, 61),
      entry('Humanities', '2026', 1, 60),
      entry('Humanities', '2026', 2, 61),
    ]
    const result = trendForSubject(entries, 'Humanities')
    expect(result.direction).toBe('steady')
    expect(result.points).toEqual([60, 61, 60, 61])
  })

  it('returns steady with whatever points exist when there are fewer than 2 semesters', () => {
    const entries = [entry('English', '2026', 2, 70)]
    const result = trendForSubject(entries, 'English')
    expect(result.direction).toBe('steady')
    expect(result.points).toEqual([70])
  })

  it('is deterministic across two runs over the same input', () => {
    const entries = [
      entry('English', '2025', 1, 60),
      entry('English', '2025', 2, 63),
      entry('English', '2026', 1, 66),
      entry('English', '2026', 2, 70),
    ]
    const first = trendForSubject(entries, 'English')
    const second = trendForSubject(entries, 'English')
    expect(second).toEqual(first)
  })
})

describe('trendsForEntries', () => {
  it('only returns subjects with at least 2 semesters of data', () => {
    const entries = [
      entry('English', '2025', 1, 60),
      entry('English', '2026', 2, 70),
      entry('Science', '2026', 2, 80), // one semester only — excluded
    ]
    const trends = trendsForEntries(entries)
    expect(trends.map((t) => t.subject)).toEqual(['English'])
  })
})
