import type { HolisticReport, LearningOutcomeStatus } from '@/types/report'

// Mock "AI" comment drafter for the P1 Write page: composes a teacher comment
// deterministically from data the system already holds — subject results
// (School Cockpit), attendance, conduct, personal qualities and Student-
// Insights touches like the pupil's CCA. The teacher picks which sources feed
// the draft; only selected sources contribute sentences. No model call; the
// point is the flow, not the prose engine.

export type DraftSource =
  | 'results'
  | 'attendance'
  | 'conduct'
  | 'qualities'
  | 'cca'

export const DRAFT_SOURCE_DEFS: Array<{
  id: DraftSource
  label: string
}> = [
  { id: 'results', label: 'Subject results' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'conduct', label: 'Conduct' },
  { id: 'qualities', label: 'Personal qualities' },
  { id: 'cca', label: 'CCA' },
]

export const ALL_DRAFT_SOURCES: Array<DraftSource> = DRAFT_SOURCE_DEFS.map(
  (def) => def.id,
)

const STAGE_ORDER: Array<LearningOutcomeStatus> = [
  'Beginning',
  'Developing',
  'Competent',
  'Exceeding',
]

function firstName(name: string): string {
  return name.split(' ').filter(Boolean)[0] ?? name
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

function subjectScores(
  report: HolisticReport,
): Array<{ name: string; score: number }> {
  return report.academic.subjects.map((subj) => ({
    name: subj.name,
    score:
      subj.learningOutcomes.reduce(
        (sum, lo) => sum + STAGE_ORDER.indexOf(lo.status),
        0,
      ) / Math.max(subj.learningOutcomes.length, 1),
  }))
}

export function draftTeacherComment(
  report: HolisticReport,
  sources: ReadonlyArray<DraftSource> = ALL_DRAFT_SOURCES,
): string {
  const has = (source: DraftSource) => sources.includes(source)
  const first = firstName(report.studentName)

  const sentences: Array<string> = []

  if (has('conduct')) {
    const conduct = report.character.conduct.toLowerCase()
    sentences.push(
      `${first} has had a ${conduct} term and takes part in class activities with a positive attitude.`,
    )
  } else {
    sentences.push(
      `${first} has settled well into the routines of school this term.`,
    )
  }

  if (has('results')) {
    const scored = subjectScores(report)
    const sorted = [...scored].sort((a, b) => b.score - a.score)
    const strongest = sorted.at(0)
    const growing = sorted.at(-1)
    if (strongest && growing && strongest.name !== growing.name) {
      sentences.push(
        `${first} shows particular strength in ${strongest.name}, and is steadily building confidence in ${growing.name}.`,
      )
    } else if (strongest) {
      sentences.push(
        `${first} is making steady progress across all subjects, including ${strongest.name}.`,
      )
    }
  }

  if (has('qualities')) {
    const topValue = [...report.holistic.coreValues]
      .sort((a, b) => b.score - a.score)
      .at(0)
    if (topValue) {
      sentences.push(
        `In class, ${first} ${lowerFirst(topValue.description)} — a real strength in ${topValue.name.toLowerCase()}.`,
      )
    }
  }

  const cca = has('cca') ? report.holistic.cca.at(0) : undefined
  if (has('attendance')) {
    const attendancePct = Math.round(
      (report.attendance.daysPresent / report.attendance.totalSchoolDays) *
        100,
    )
    if (attendancePct >= 90) {
      sentences.push(
        `Attending ${attendancePct}% of school days, ${first} comes to school ready to learn${
          cca ? ` and enjoys their time in ${cca.name}` : ''
        }.`,
      )
    } else if (cca) {
      sentences.push(`${first} enjoys their time in ${cca.name}.`)
    }
  } else if (cca) {
    sentences.push(`${first} enjoys their time in ${cca.name}.`)
  }

  sentences.push(
    `Continue reading together at home — regular reading will further strengthen ${first}'s language skills and support their learning overall.`,
  )
  return sentences.join(' ')
}
