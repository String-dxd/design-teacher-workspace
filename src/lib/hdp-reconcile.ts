import type { DraftClaim, TrendDirection } from '@/types/hdp'
import type { SubjectTrend } from './hdp-trends'

// F4b reconcile gate (PRD §6 F4-full point 6, plan 040) — a judgement
// tripwire on Confirm, not a nag: fires only when a draft's own sentiment
// and the student's markbook trajectory read in opposite directions. This
// is a placeholder keyword heuristic standing in for real sentiment
// analysis (see the STOP condition in plan 040) — the PRD's eval-set
// requirement stands before any real model ships (maintenance note).

/** Words that read as positive-progress phrasing in a comment. */
const POSITIVE_KEYWORDS = [
  'improved',
  'improving',
  'improvement',
  'growth',
  'progress',
  'consistent',
  'consistently',
]

/** Words that read as struggle phrasing in a comment. */
const STRUGGLE_KEYWORDS = [
  'struggle',
  'struggling',
  'difficulty',
  'difficulties',
  'slipping',
  'falling behind',
  'behind',
]

export interface ReconcileResult {
  fired: boolean
  /** The subject named in the mismatch — set only when the check ran
   *  against a single subject's trend (kind: 'subject', or an 'overall'
   *  draft with just one trend available). Absent for a majority-rule
   *  'overall' mismatch — the caller renders "the majority of subjects". */
  subject?: string
  direction?: TrendDirection
}

function containsAny(text: string, words: Array<string>): boolean {
  const lower = text.toLowerCase()
  return words.some((word) => lower.includes(word))
}

/** Most common trend direction across a set of subjects — ties broken by
 *  the order `trends` was given in (stable/deterministic, no Math.random). */
function majorityDirection(
  trends: Array<SubjectTrend>,
): TrendDirection | undefined {
  if (trends.length === 0) return undefined
  const counts = new Map<TrendDirection, number>()
  for (const trend of trends) {
    counts.set(trend.direction, (counts.get(trend.direction) ?? 0) + 1)
  }
  let best: TrendDirection | undefined
  let bestCount = 0
  for (const trend of trends) {
    const count = counts.get(trend.direction) ?? 0
    if (count > bestCount) {
      best = trend.direction
      bestCount = count
    }
  }
  return best
}

/**
 * Runs the F4b tripwire against a draft's claims and the relevant subject
 * trend(s). Pass a single-element `trends` array for a subject draft (or an
 * 'overall' draft you've already resolved to one subject); pass every
 * subject's trend for an 'overall' draft to invoke the majority rule.
 *
 * Fires when positive-progress phrasing coincides with an 'easing' trend,
 * or struggle phrasing coincides with a 'climbing' trend — never on
 * 'steady'/'recovering', and never when the comment carries neither
 * phrasing at all.
 */
export function reconcileCheck(
  claims: Array<DraftClaim>,
  trends: Array<SubjectTrend>,
): ReconcileResult {
  const text = claims.map((c) => c.text).join(' ')
  const hasPositive = containsAny(text, POSITIVE_KEYWORDS)
  const hasStruggle = containsAny(text, STRUGGLE_KEYWORDS)
  if (!hasPositive && !hasStruggle) return { fired: false }

  const direction =
    trends.length === 1 ? trends[0].direction : majorityDirection(trends)
  if (!direction) return { fired: false }

  const subject = trends.length === 1 ? trends[0].subject : undefined

  if (hasPositive && direction === 'easing') {
    return { fired: true, subject, direction }
  }
  if (hasStruggle && direction === 'climbing') {
    return { fired: true, subject, direction }
  }
  return { fired: false }
}
