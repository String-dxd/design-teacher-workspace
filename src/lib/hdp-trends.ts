import type { HdpMarkEntry, TrendDirection } from '@/types/hdp'

// Pure trend derivation over already-loaded mark entries — no store reads
// (kept independent of hdp-store.ts to avoid a circular import with its own
// semesterAverage; the two compute the same simple mean independently), no
// Date.now/Math.random, so results are stable across reloads and across
// runs. `trendForSubject` is the single trend authority (plan 036's
// maintenance note) — the report book's "Where things are heading" section
// and the marks-grid inline sparkline both call this same function.

/** A rising last-semester delta above this many points reads as "climbing". */
export const TREND_CLIMB_THRESHOLD = 2
/** A falling last-semester delta below the negative of this many points reads
 *  as "easing". */
export const TREND_EASE_THRESHOLD = -2
/** How far above its dip the last point must sit for a mid-series dip to
 *  read as "recovering" rather than noise. */
export const TREND_RECOVER_MARGIN = 2

interface TrendResult {
  direction: TrendDirection
  points: Array<number>
}

function semesterSortKey(schoolYear: string, semester: number): number {
  return Number(schoolYear) * 10 + semester
}

/** Local, pure mean over matching entries — mirrors hdp-store.ts's
 *  `semesterAverage` exactly but stays here to keep this module
 *  store-independent (see the file-header note). */
function localSemesterAverage(
  entries: Array<HdpMarkEntry>,
  subject: string,
  schoolYear: string,
  semester: number,
): number | undefined {
  const matches = entries.filter(
    (e) =>
      e.subject === subject &&
      e.schoolYear === schoolYear &&
      e.semester === semester,
  )
  if (matches.length === 0) return undefined
  return matches.reduce((sum, e) => sum + e.score, 0) / matches.length
}

/**
 * Derives the trend direction + sparkline points for one subject from a
 * student's mark entries. `points` are the last four semester averages,
 * oldest→newest, skipping any semester with no recorded entries at all.
 *
 * Direction:
 * - fewer than 2 points → 'steady' (with whatever points exist)
 * - a mid-series dip (the minimum sits strictly between the first and last
 *   point) followed by a recovery past it → 'recovering' (checked first —
 *   it's the more specific shape; a plain climb/ease never has an interior
 *   minimum, so this never shadows them)
 * - otherwise, last delta > +2 → 'climbing'; last delta < −2 → 'easing';
 *   else → 'steady'
 */
export function trendForSubject(
  entries: Array<HdpMarkEntry>,
  subject: string,
): TrendResult {
  const subjectEntries = entries.filter((e) => e.subject === subject)

  const semesterKeys = Array.from(
    new Set(subjectEntries.map((e) => `${e.schoolYear}:${e.semester}`)),
  )
    .map((key) => {
      const [schoolYear, semesterStr] = key.split(':')
      return { schoolYear, semester: Number(semesterStr) as 1 | 2 }
    })
    .sort(
      (a, b) =>
        semesterSortKey(a.schoolYear, a.semester) -
        semesterSortKey(b.schoolYear, b.semester),
    )

  const allPoints = semesterKeys
    .map((s) =>
      localSemesterAverage(subjectEntries, subject, s.schoolYear, s.semester),
    )
    .filter((avg): avg is number => avg !== undefined)

  const points = allPoints.slice(-4)

  if (points.length < 2) {
    return { direction: 'steady', points }
  }

  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const lastDelta = last - prev

  const min = Math.min(...points)
  const minIndex = points.indexOf(min)
  const isDipThenRise =
    minIndex !== 0 &&
    minIndex !== points.length - 1 &&
    last > min + TREND_RECOVER_MARGIN

  if (isDipThenRise) {
    return { direction: 'recovering', points }
  }
  if (lastDelta > TREND_CLIMB_THRESHOLD) {
    return { direction: 'climbing', points }
  }
  if (lastDelta < TREND_EASE_THRESHOLD) {
    return { direction: 'easing', points }
  }
  return { direction: 'steady', points }
}

export interface SubjectTrend extends TrendResult {
  subject: string
}

/** Convenience wrapper over `trendForSubject` for callers that just want
 *  every subject's trend from one student's already-loaded mark entries
 *  (report book "Where things are heading", the marks-grid row sparklines).
 *  Only returns subjects with at least 2 semesters of data — matching the
 *  report book's "≥2 semesters of data" section rule. */
export function trendsForEntries(
  entries: Array<HdpMarkEntry>,
): Array<SubjectTrend> {
  const subjects = Array.from(new Set(entries.map((e) => e.subject)))
  return subjects
    .map((subject) => ({ subject, ...trendForSubject(entries, subject) }))
    .filter((t) => t.points.length >= 2)
}
