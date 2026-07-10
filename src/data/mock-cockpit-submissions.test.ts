import { describe, expect, it } from 'vitest'
import {
  hasAllResults,
  hasAnyResults,
  isSubjectSubmitted,
} from './mock-cockpit-submissions'

describe('hasAllResults / hasAnyResults', () => {
  it('are both true for a student with no seeded gaps', () => {
    expect(hasAllResults('36')).toBe(true)
    expect(hasAnyResults('36')).toBe(true)
  })

  it('diverge for student 48, whose Mathematics result is missing', () => {
    expect(hasAllResults('48')).toBe(false)
    expect(hasAnyResults('48')).toBe(true)
  })
})

describe('isSubjectSubmitted', () => {
  it('is false only for student 48s missing Mathematics result', () => {
    expect(isSubjectSubmitted('48', 'Mathematics')).toBe(false)
    expect(isSubjectSubmitted('48', 'English Language')).toBe(true)
    expect(isSubjectSubmitted('36', 'Mathematics')).toBe(true)
  })

  it('treats non-cockpit subjects as always submitted', () => {
    expect(isSubjectSubmitted('48', 'Art')).toBe(true)
  })
})
