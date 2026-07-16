import type { DispositionId, HdpInsight, TagContext } from '@/types/hdp'
import {
  detectFormingPatterns,
  loadMarks,
  tagsForStudent,
} from '@/lib/hdp-store'
import { trendsForEntries } from '@/lib/hdp-trends'

// Prototype B's insight layer (PRD §7, plan 040) — per-student numbered,
// selectable facts. Deliberately NOT a dashboard: insightsForStudent
// returns a flat list, in a stable display order, for the caller to render
// as a numbered <ol> (PRD F4-full point 1). Two sources feed it:
//   - DERIVED insights, computed live from this module's own store
//     (observations from tags, patterns from confirmed FormingPatterns,
//     trajectory inflections from 036's trendForSubject/trendsForEntries)
//   - SEEDED static facts (attendance/CCA/conduct/VIA/competition/
//     promotion) standing in for Cockpit/SDT/STP fields this prototype
//     doesn't have real access to (PRD §7.1 — "verify field-by-field
//     before commitment"; kept honest here as clearly-labelled fixtures,
//     never sourced from mock-students.ts's unrelated, non-HDP,
//     sometimes-negative fields like `conduct`/`offences` — 6.0.4 holds:
//     HDP surfaces strengths-and-growth only, never discipline data).
//
// This function reads the store (tagsForStudent/detectFormingPatterns/
// loadMarks are all SSR-guarded, return [] with no window) — callers must
// only invoke it client-side (useEffect), same convention as the rest of
// the module.

const DISPOSITION_LABELS: Record<DispositionId, string> = {
  perseverance: 'perseverance',
  curiosity: 'curiosity',
  collaboration: 'collaboration',
  'self-direction': 'self-direction',
}

const CONTEXT_LABELS: Record<TagContext, string> = {
  lesson: 'lessons',
  marking: 'marking',
  cca: 'CCA',
  'form-time': 'form time',
  other: 'other settings',
}

/** Static facts standing in for Cockpit/SDT/STP fields (PRD §7.1). Present
 *  for the 3 demo students ('1' Chen Jun Kai, '2' Vincent Koh Xin Yi, '3'
 *  Lam Wei Jie) plus 3 more 3A students, so the mechanic demos across a
 *  handful of records, not just the funnel's staged three. Every value is
 *  a plain, positively-or-neutrally framed fact — no trait words, no
 *  comparisons across students. */
interface StaticFacts {
  attendance: string
  cca: string
  conduct: string
  via: string
  competition?: string
  promotion: string
}

const STATIC_FACTS: Partial<Record<string, StaticFacts>> = {
  '1': {
    attendance: '96% attendance this term (2 medical-certified absences)',
    cca: 'Basketball — attended 11 of 12 training sessions this term',
    conduct: 'Good conduct grading, Semester 2',
    via: 'Value-in-Action: 14 hours logged this year',
    promotion: 'On track for promotion to Secondary 4',
  },
  '2': {
    attendance: '98% attendance this term (1 medical-certified absence)',
    cca: 'Track and Field — attended every training session this term',
    conduct: 'Very good conduct grading, Semester 2',
    via: 'Value-in-Action: 20 hours logged this year',
    competition: 'Placed 2nd, Zone Track and Field relay',
    promotion: 'On track for promotion to Secondary 4',
  },
  '3': {
    attendance: '94% attendance this term (3 medical-certified absences)',
    cca: 'Robotics Club — attended 9 of 12 sessions this term',
    conduct: 'Good conduct grading, Semester 2',
    via: 'Value-in-Action: 9 hours logged this year',
    promotion: 'On track for promotion to Secondary 4',
  },
  '4': {
    attendance: '92% attendance this term (4 medical-certified absences)',
    cca: 'Choir — attended 10 of 12 sessions this term',
    conduct: 'Good conduct grading, Semester 2',
    via: 'Value-in-Action: 11 hours logged this year',
    promotion: 'On track for promotion to Secondary 4',
  },
  '5': {
    attendance: '97% attendance this term (1 medical-certified absence)',
    cca: 'Debate Club — attended every session this term',
    conduct: 'Very good conduct grading, Semester 2',
    via: 'Value-in-Action: 16 hours logged this year',
    competition: 'Reached the semi-final, Inter-school Debate Championship',
    promotion: 'On track for promotion to Secondary 4',
  },
  '6': {
    attendance: '90% attendance this term (5 medical-certified absences)',
    cca: 'Art Club — attended 8 of 12 sessions this term',
    conduct: 'Good conduct grading, Semester 2',
    via: 'Value-in-Action: 7 hours logged this year',
    promotion: 'On track for promotion to Secondary 4',
  },
}

/** One-line, behaviour-in-context clause (lowercase, ready to follow a
 *  student's name) — the tag's own note already reads this way (plan
 *  028's rule); the disposition-only fallback matches composeDraft's
 *  claimTextForTag phrasing. */
function observationLabel(
  disposition: DispositionId,
  context: TagContext,
  note: string | undefined,
): string {
  if (note) {
    const trimmed = note.trim()
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
  }
  return `showed ${DISPOSITION_LABELS[disposition]} during ${CONTEXT_LABELS[context]}`
}

/** Cross-context clause for a confirmed pattern, reusing its headline
 *  (plan 037's story-register copy) when the teacher validated one, or a
 *  generic behaviour-in-context clause otherwise — same shape as
 *  hdp-draft-compose's crossContextClaimText. */
function patternLabel(
  headline: string | undefined,
  disposition: DispositionId,
  contexts: Array<TagContext>,
): string {
  if (headline) {
    const trimmed = headline.trim()
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
  }
  const contextList = contexts.map((c) => CONTEXT_LABELS[c]).join(' and ')
  return `has shown ${DISPOSITION_LABELS[disposition]} across ${contextList}, not just once`
}

function trajectoryLabel(
  subject: string,
  direction: string,
  semesters: number,
): string {
  return `${subject} ${direction} across ${semesters} semester${semesters === 1 ? '' : 's'}`
}

/**
 * Every selectable (or context-only, for promotion) insight for one
 * student — river observations, forming patterns, trajectory inflections,
 * and seeded attendance/CCA/conduct/VIA/competition/promotion facts.
 * Stable order (most-recent-first within a kind, kinds grouped) so the
 * numbered list a teacher sees doesn't reshuffle between renders.
 */
export function insightsForStudent(studentId: string): Array<HdpInsight> {
  const insights: Array<HdpInsight> = []

  const activeTags = tagsForStudent(studentId)
    .filter((t) => t.lifecycle === 'active')
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  for (const tag of activeTags) {
    insights.push({
      id: `insight-${studentId}-observation-${tag.id}`,
      studentId,
      kind: 'observation',
      label: observationLabel(tag.disposition, tag.context, tag.note),
      sourceRef: { system: 'tw-river', recordId: tag.id },
      selectable: true,
    })
  }

  const confirmedPatterns = detectFormingPatterns(studentId).filter(
    (p) => p.status === 'confirmed',
  )
  for (const pattern of confirmedPatterns) {
    insights.push({
      id: `insight-${studentId}-pattern-${pattern.id}`,
      studentId,
      kind: 'pattern',
      label: patternLabel(
        pattern.headline,
        pattern.disposition,
        pattern.contexts,
      ),
      sourceRef: { system: 'tw-river', recordId: pattern.id },
      selectable: true,
    })
  }

  const trends = trendsForEntries(loadMarks(studentId)).filter(
    (t) => t.direction !== 'steady',
  )
  for (const trend of trends) {
    insights.push({
      id: `insight-${studentId}-trajectory-${trend.subject}`,
      studentId,
      kind: 'trajectory',
      label: trajectoryLabel(
        trend.subject,
        trend.direction,
        trend.points.length,
      ),
      sourceRef: {
        system: 'sdt',
        recordId: `${studentId}-${trend.subject}`,
      },
      selectable: true,
    })
  }

  const facts = STATIC_FACTS[studentId]
  if (facts) {
    insights.push({
      id: `insight-${studentId}-attendance`,
      studentId,
      kind: 'attendance',
      label: facts.attendance,
      sourceRef: { system: 'cockpit', recordId: `${studentId}-attendance` },
      selectable: true,
    })
    insights.push({
      id: `insight-${studentId}-cca`,
      studentId,
      kind: 'cca',
      label: facts.cca,
      sourceRef: { system: 'sdp', recordId: `${studentId}-cca` },
      selectable: true,
    })
    insights.push({
      id: `insight-${studentId}-conduct`,
      studentId,
      kind: 'conduct',
      label: facts.conduct,
      sourceRef: { system: 'cockpit', recordId: `${studentId}-conduct` },
      selectable: true,
    })
    insights.push({
      id: `insight-${studentId}-via`,
      studentId,
      kind: 'via',
      label: facts.via,
      sourceRef: { system: 'sei', recordId: `${studentId}-via` },
      selectable: true,
    })
    if (facts.competition) {
      insights.push({
        id: `insight-${studentId}-competition`,
        studentId,
        kind: 'competition',
        label: facts.competition,
        sourceRef: { system: 'sdp', recordId: `${studentId}-competition` },
        selectable: true,
      })
    }
    // Promotion status renders as context — it isn't something a teacher
    // curates into a comment (PRD F4-full point 1: "not selectable").
    insights.push({
      id: `insight-${studentId}-promotion`,
      studentId,
      kind: 'promotion',
      label: facts.promotion,
      sourceRef: { system: 'cockpit', recordId: `${studentId}-promotion` },
      selectable: false,
    })
  }

  return insights
}
