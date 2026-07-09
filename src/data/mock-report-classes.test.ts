import { describe, expect, it } from 'vitest'
import {
  P1_LEVEL_SCOPE,
  SAMPLE_PREVIEW_PUPIL,
  getReportRoster,
  getSiblingState,
} from './mock-report-classes'
import {
  CURRENT_ACADEMIC_YEAR,
  generateReportFromStudent,
} from '@/data/mock-reports'

describe('getReportRoster', () => {
  it('level scope concatenates P1-A with the seeded sibling classes', () => {
    const level = getReportRoster(P1_LEVEL_SCOPE)
    const p1a = getReportRoster('P1-A')
    const p1b = getReportRoster('P1-B')
    const p1c = getReportRoster('P1-C')
    expect(p1a.length).toBeGreaterThan(0)
    expect(level).toHaveLength(p1a.length + p1b.length + p1c.length)
    expect(new Set(level.map((p) => p.id)).size).toBe(level.length)
  })

  it('real classes come from mock-students, siblings from the seeds', () => {
    expect(getReportRoster('P1-A').every((p) => p.class === 'P1-A')).toBe(true)
    expect(getReportRoster('P1-B').every((p) => p.class === 'P1-B')).toBe(true)
  })
})

describe('SAMPLE_PREVIEW_PUPIL', () => {
  it('generates a complete report for the layout preview', () => {
    const report = generateReportFromStudent(
      SAMPLE_PREVIEW_PUPIL,
      'Term 2',
      CURRENT_ACADEMIC_YEAR,
    )
    expect(report.studentName).toContain('Sample')
    expect(report.academic.subjects.length).toBeGreaterThan(0)
    expect(report.holistic.coreValues.length).toBeGreaterThan(0)
    expect(report.attendance.totalSchoolDays).toBeGreaterThan(0)
  })

  it('is not part of any hub roster', () => {
    const level = getReportRoster(P1_LEVEL_SCOPE)
    expect(level.some((p) => p.id === SAMPLE_PREVIEW_PUPIL.id)).toBe(false)
  })
})

describe('getSiblingState', () => {
  it('is deterministic and only defined for sibling pupils', () => {
    const first = getSiblingState('p1b-01')
    expect(first).toBeDefined()
    expect(getSiblingState('p1b-01')).toEqual(first)
    expect(getSiblingState('36')).toBeUndefined()
  })

  it('spreads pupils across the pipeline states', () => {
    const statuses = new Set(
      getReportRoster(P1_LEVEL_SCOPE)
        .map((p) => getSiblingState(p.id)?.status)
        .filter(Boolean),
    )
    expect(statuses.size).toBeGreaterThanOrEqual(5)
  })
})
