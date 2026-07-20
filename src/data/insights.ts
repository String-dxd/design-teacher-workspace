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

/** The report-book rendering reads these directly (physical-slip parity:
 *  CCA, VIA, promotion all appear on today's result slip). */
export function staticRecordsForStudent(
  studentId: string,
): Partial<StaticFacts> {
  return STATIC_FACTS[studentId] ?? {}
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

// ── Physical-slip details (HDP mockup parity, 2026-07-17) ──────────────
// The official HDP report (MOE mockup, 6 pages) carries far more than this
// prototype's store: particulars, mark/grade/percentile results, conduct,
// personal qualities, CCA remarks + attendance, physical fitness, VIA,
// enrichment, programmes, awards. Everything below is a deterministic
// fixture derived from the studentId (same hash trick as the seed) plus
// STATIC_FACTS where a student has curated ones — so every parent preview
// renders complete, and repeat loads agree.

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const CCA_POOL: Array<{ name: string; domain: string }> = [
  { name: 'Basketball', domain: 'Physical Sports' },
  { name: 'Track and Field', domain: 'Physical Sports' },
  { name: 'Robotics Club', domain: 'Clubs & Societies' },
  { name: 'Choir', domain: 'Aesthetics' },
  { name: 'Debate Club', domain: 'Clubs & Societies' },
  { name: 'Art Club', domain: 'Aesthetics' },
  { name: 'Guitar Ensemble', domain: 'Aesthetics' },
  { name: 'Badminton', domain: 'Physical Sports' },
]

const VIA_POOL: Array<{ title: string; partner: string }> = [
  { title: 'Community Green Day', partner: 'National Environment Agency' },
  { title: 'Elderly Befriending Visits', partner: 'Lions Befrienders' },
  { title: 'East Coast Beach Clean-up', partner: 'NParks' },
  { title: 'Food from the Heart Drive', partner: 'Food from the Heart' },
]

const ENRICHMENT_POOL: Array<{
  area: string
  activity: string
  domain: string
}> = [
  {
    area: 'Self-Management and Social Skills',
    activity: 'Beyond Speaking',
    domain: 'Social/Moral',
  },
  {
    area: 'Critical Thinking',
    activity: 'Future Problem Solving',
    domain: 'Cognitive',
  },
  {
    area: 'Digital Literacy',
    activity: 'Coding for Good',
    domain: 'Cognitive',
  },
]

const PROGRAMME_POOL: Array<{ programme: string; domain: string }> = [
  { programme: 'Creative Arts Programme', domain: 'Others – Arts' },
  { programme: 'Debate Competition', domain: 'English Language' },
  { programme: 'Environmental Science', domain: 'Science' },
  { programme: 'Mathematics Mastery', domain: 'Mathematics' },
]

const QUALITY_REMARKS: Array<string> = [
  'Demonstrates this consistently in class and during group work.',
  'Showed this more often in the second half of the term.',
  'A clear strength this semester.',
  'Developing — responds well when given the chance to lead.',
]

const CCA_REMARK_TEMPLATES: Array<(cca: string) => string> = [
  (cca) =>
    `Takes responsibility for own preparation in ${cca} — arrives ready and helps pack up without being asked.`,
  (cca) =>
    `A dependable member of ${cca} who encourages newer members and keeps the group on task during sessions.`,
  (cca) =>
    `Shows steady commitment to ${cca}, volunteering for roles during school events and following through on them.`,
]

interface SlipViaRow {
  type: string
  title: string
  partner: string
  role: string
  hours: number
}

interface SlipDetails {
  age: number
  serialNo: number
  idNo: string
  course: string
  daysLate: number
  nextClass: string
  nextCourse: string
  cca: {
    name: string
    domain: string
    involvement: string
    event?: string
    attendanceByTerm: Array<string>
    attendanceOverall: string
  }
  ccaRemarks: string
  bmi: string
  fitnessAward: string
  via: Array<SlipViaRow>
  personalQualities: Array<{ quality: string; remark: string }>
  enrichment: Array<{ area: string; activity: string; domain: string }>
  programmes: Array<{ programme: string; domain: string }>
  awards: Array<{ type: string; category: string; award: string }>
}

export function slipDetailsForStudent(studentId: string): SlipDetails {
  const h = hashCode(`slip-${studentId}`)
  const facts = STATIC_FACTS[studentId]

  // Students with curated STATIC_FACTS keep their CCA name (format is
  // always '<CCA> — attended …'); everyone else draws from the pool.
  const factsCcaName = facts?.cca.split(' — ')[0]
  const pooled = CCA_POOL[h % CCA_POOL.length]
  const ccaName = factsCcaName ?? pooled.name
  const ccaDomain =
    CCA_POOL.find((c) => c.name === ccaName)?.domain ?? pooled.domain

  const viaHours = facts
    ? Number(/(\d+) hours/.exec(facts.via)?.[1] ?? 12)
    : 8 + (h % 10)
  const viaPick = VIA_POOL[h % VIA_POOL.length]

  const termTotals = [8, 6, 6, 4]
  const attendanceByTerm = termTotals.map(
    (total, i) => `${total - ((h >> i) & 1)}/${total}`,
  )
  const attended = termTotals.reduce(
    (sum, total, i) => sum + total - ((h >> i) & 1),
    0,
  )
  const totalSessions = termTotals.reduce((a, b) => a + b, 0)

  const serialFromId = Number(studentId)
  return {
    age: 15,
    serialNo: Number.isFinite(serialFromId) ? serialFromId : (h % 30) + 1,
    idNo: `TXXXX${String(100 + ((h * 37) % 900))}${'ABDFGHJ'[h % 7]}`,
    course: 'Express',
    daysLate: h % 2,
    nextClass: '4A',
    nextCourse: 'Express',
    cca: {
      name: ccaName,
      domain: ccaDomain,
      involvement: h % 4 === 0 ? 'Vice-Captain' : 'Member',
      event: facts?.competition,
      attendanceByTerm,
      attendanceOverall: `${Math.round((attended / totalSessions) * 100)}%`,
    },
    ccaRemarks: CCA_REMARK_TEMPLATES[h % CCA_REMARK_TEMPLATES.length](ccaName),
    bmi: 'Acceptable',
    fitnessAward: ['Gold', 'Silver', 'Bronze'][h % 3],
    via: [
      {
        type: 'Project (School Initiated)',
        title: viaPick.title,
        partner: viaPick.partner,
        role: 'Participant',
        hours: viaHours,
      },
    ],
    personalQualities: [
      'Perseverance',
      'Curiosity',
      'Collaboration',
      'Self-direction',
    ].map((quality, i) => ({
      quality,
      remark: QUALITY_REMARKS[(h + i) % QUALITY_REMARKS.length],
    })),
    enrichment: [ENRICHMENT_POOL[h % ENRICHMENT_POOL.length]],
    programmes: [
      PROGRAMME_POOL[h % PROGRAMME_POOL.length],
      PROGRAMME_POOL[(h + 2) % PROGRAMME_POOL.length],
    ],
    awards: facts?.competition
      ? [
          {
            type: 'Inter-Schools',
            category: ccaDomain,
            award: facts.competition,
          },
        ]
      : [],
  }
}

// ── Slip results (mark · grade · percentile, HDP mockup parity) ────────
// The seeded book only carries one letter grade per subject; the official
// slip shows Mark/Grade per semester plus an Overall with a percentile
// band. Marks are derived deterministically from the seeded grade so the
// derived grade always agrees with what the roster already shows.

const GRADE_BASE: Record<string, number> = {
  A1: 78,
  A2: 72,
  B3: 67,
  B4: 62,
  C5: 57,
}

function gradeForMark(mark: number): string {
  if (mark >= 75) return 'A1'
  if (mark >= 70) return 'A2'
  if (mark >= 65) return 'B3'
  if (mark >= 60) return 'B4'
  if (mark >= 55) return 'C5'
  return 'C6'
}

// Lower bound of each grade's mark band (mirrors gradeForMark's thresholds).
// Used to clamp the derived Overall mark so it can never render a grade below
// the seeded one (or below the same row's Sem 2).
const GRADE_FLOOR: Record<string, number> = {
  A1: 75,
  A2: 70,
  B3: 65,
  B4: 60,
  C5: 55,
}

// Percentile band per grade tier. The Overall percentile is taken from the
// seeded grade (not the derived mark), so a top grade always lands in the top
// band and grade/percentile can never contradict each other.
const GRADE_PCTL: Record<string, string> = {
  A1: '80–100',
  A2: '60–80',
  B3: '40–60',
  B4: '20–40',
  C5: '20–40',
}

interface SlipResultRow {
  subject: string
  sem1: { mark: number; grade: string }
  sem2: { mark: number; grade: string }
  overall: { mark: number; grade: string; pctl: string }
}

export function slipResultsForStudent(
  studentId: string,
  results: Array<{ subject: string; grade: string }>,
): { rows: Array<SlipResultRow>; percentage: number } {
  const seen = new Set<string>()
  const rows: Array<SlipResultRow> = []
  for (const result of results) {
    if (seen.has(result.subject)) continue
    seen.add(result.subject)
    const h = hashCode(`${studentId}-${result.subject}`)
    const base = GRADE_BASE[result.grade] ?? 62
    const sem2Mark = base + (h % 3) - 1 // stays within the seeded grade's band
    const sem1Mark = sem2Mark - 2 - (h % 4)
    // Overall is anchored to the seeded grade (the roster's source of truth):
    // clamp the weighted mark into that grade's band so mark, grade and
    // percentile always agree, and Overall never dips below the same row's
    // Sem 2 grade.
    const overallRaw = Math.round(sem1Mark * 0.4 + sem2Mark * 0.6)
    const floor = GRADE_FLOOR[result.grade] ?? 55
    const overallMark = Math.min(base, Math.max(floor, overallRaw))
    rows.push({
      subject: result.subject,
      sem1: { mark: sem1Mark, grade: gradeForMark(sem1Mark) },
      sem2: { mark: sem2Mark, grade: gradeForMark(sem2Mark) },
      overall: {
        mark: overallMark,
        grade: result.grade,
        pctl: GRADE_PCTL[result.grade] ?? '40–60',
      },
    })
  }
  const percentage =
    rows.length > 0
      ? Math.round(
          rows.reduce((sum, r) => sum + r.overall.mark, 0) / rows.length,
        )
      : 0
  return { rows, percentage }
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
