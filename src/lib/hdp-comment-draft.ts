import type { HolisticReport, LearningOutcomeStatus } from '@/types/report'

// Mock "AI" comment drafter for the P1 Write page: composes a teacher comment
// deterministically from data the system already holds — subject results
// (School Cockpit), attendance, conduct, and Student-Insights touches like the
// pupil's CCA. No model call; the point is the flow, not the prose engine.

const STAGE_ORDER: Array<LearningOutcomeStatus> = [
  'Beginning',
  'Developing',
  'Competent',
  'Exceeding',
]

function firstName(name: string): string {
  return name.split(' ').filter(Boolean)[0] ?? name
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

export function draftTeacherComment(report: HolisticReport): string {
  const first = firstName(report.studentName)
  const conduct = report.character.conduct.toLowerCase()
  const scored = subjectScores(report)
  const sorted = [...scored].sort((a, b) => b.score - a.score)
  const strongest = sorted.at(0)
  const growing = sorted.at(-1)
  const attendancePct = Math.round(
    (report.attendance.daysPresent / report.attendance.totalSchoolDays) * 100,
  )
  const cca = report.holistic.cca.at(0)

  const sentences: Array<string> = []
  sentences.push(
    `${first} has had a ${conduct} term and takes part in class activities with a positive attitude.`,
  )
  if (strongest && growing && strongest.name !== growing.name) {
    sentences.push(
      `${first} shows particular strength in ${strongest.name}, and is steadily building confidence in ${growing.name}.`,
    )
  } else if (strongest) {
    sentences.push(
      `${first} is making steady progress across all subjects, including ${strongest.name}.`,
    )
  }
  if (attendancePct >= 90) {
    sentences.push(
      `Attending ${attendancePct}% of school days, ${first} comes to school ready to learn${
        cca ? ` and enjoys their time in ${cca.name}` : ''
      }.`,
    )
  } else if (cca) {
    sentences.push(`${first} enjoys their time in ${cca.name}.`)
  }
  sentences.push(
    `Continue reading together at home — regular reading will further strengthen ${first}'s language skills and support their learning overall.`,
  )
  return sentences.join(' ')
}
