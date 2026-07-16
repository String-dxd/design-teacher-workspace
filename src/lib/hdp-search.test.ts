import { describe, expect, it } from 'vitest'
import {
  searchAllStudents,
  searchAssociatedStudents,
  tokensFor,
} from './hdp-search'
import { mockStudents } from '@/data/mock-students'
import { CURRENT_TEACHER } from '@/data/hdp'

// mockStudents (this repo's app-wide fixture) happens to be entirely
// Chinese-style names — there is no Malay or Indian-style name in it to
// exercise the patronymic-skipping / any-token behaviour against directly
// through searchAssociatedStudents/searchAllStudents (which read from
// mockStudents internally and can't be given an injected list). That's a
// fixture gap, not a matcher gap: the two tests below exercise the
// exported `tokensFor` helper — the actual tokenizer the search functions
// use — directly against representative Malay/Indian names.
describe('tokensFor', () => {
  it('tokenizes a Malay name, skipping bin/binte but keeping personal and family tokens', () => {
    const tokens = tokensFor('Nur Aisyah binte Rahman')
    expect(tokens).toContain('aisyah')
    expect(tokens).toContain('rahman')
    expect(tokens).not.toContain('bin')
    expect(tokens).not.toContain('binte')
  })

  it('tokenizes an Indian-style name on every token', () => {
    const tokens = tokensFor('Priya d/o Suresh Kumar')
    expect(tokens).toContain('priya')
    expect(tokens).toContain('suresh')
    expect(tokens).toContain('kumar')
  })
})

describe('searchAssociatedStudents', () => {
  it('matches any name token case-insensitively', () => {
    // "Tan Wei Jie" (id 9, 3A) via "jie"
    const results = searchAssociatedStudents('jie', CURRENT_TEACHER.id)
    expect(results.some((s) => s.name === 'Tan Wei Jie')).toBe(true)
  })

  it("scopes to the teacher's associated classes only (a 4D student never returned)", () => {
    const results = searchAssociatedStudents('', CURRENT_TEACHER.id)
    expect(results.every((s) => ['3A', '3B', '4A'].includes(s.class))).toBe(
      true,
    )
    const a4dStudent = mockStudents.find((s) => s.class === '4D')
    expect(a4dStudent).toBeDefined()
    const nameQuery = a4dStudent!.name.split(' ')[0].toLowerCase()
    const scoped = searchAssociatedStudents(nameQuery, CURRENT_TEACHER.id)
    expect(scoped.some((s) => s.id === a4dStudent!.id)).toBe(false)
  })

  it('ranks form-class students before teaching-class students', () => {
    const results = searchAssociatedStudents('', CURRENT_TEACHER.id)
    const classesInOrder = results.map((s) => s.class)
    const lastFormIndex = classesInOrder.lastIndexOf(
      CURRENT_TEACHER.formClassId,
    )
    const firstNonFormIndex = classesInOrder.findIndex(
      (c) => c !== CURRENT_TEACHER.formClassId,
    )
    if (lastFormIndex !== -1 && firstNonFormIndex !== -1) {
      expect(lastFormIndex).toBeLessThan(firstNonFormIndex)
    }
  })

  it('caps at 8 results; empty query returns form-class students first', () => {
    const results = searchAssociatedStudents('', CURRENT_TEACHER.id)
    expect(results.length).toBeLessThanOrEqual(8)
    expect(results).toHaveLength(8)
    expect(results.every((s) => s.class === CURRENT_TEACHER.formClassId)).toBe(
      true,
    )
  })
})

describe('searchAllStudents', () => {
  it('finds a 4D student by token (the escape hatch), still capped at 8', () => {
    const a4dStudent = mockStudents.find((s) => s.class === '4D')
    expect(a4dStudent).toBeDefined()
    const nameQuery = a4dStudent!.name.split(' ')[0].toLowerCase()
    const results = searchAllStudents(nameQuery)
    expect(results.length).toBeLessThanOrEqual(8)
    expect(results.some((s) => s.id === a4dStudent!.id)).toBe(true)
  })
})
