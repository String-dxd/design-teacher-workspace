import {
  Award,
  BookOpen,
  Calculator,
  CalendarCheck,
  FlaskConical,
  Globe,
  Languages,
  Smile,
  Sparkles,
  Sprout,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import type {
  CoreValueLevel,
  HolisticReport,
  LearningOutcomeStatus,
  ReportBlock,
  SubjectPerformance,
} from '@/types/report'
import type { CockpitSubjectSubmission } from '@/data/mock-cockpit-submissions'
import { RichTextEditor } from '@/components/comms/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  getCockpitSubmissions,
  isSubjectSubmitted,
} from '@/data/mock-cockpit-submissions'
import { cn, stripSalutation } from '@/lib/utils'

// Shared P1 report renderer — used by the builder's live preview (editable) and the
// parent-facing guest view (read-only). Renders the ordered, enabled blocks of a
// ReportLayout. P1 shows Learning Outcomes + qualitative descriptors — never marks,
// percentages, or A1–F9 grades.
//
// Design: one hero visual ("Term at a glance") right after pupil particulars; the
// rest of the document is typographic — each learning outcome / personal quality
// renders its descriptor as a subtle text chip, no repeated bars.

// Growth-bar scales — every descriptor renders as a position on a development
// ladder (filled segments up to the achieved stage) with the stage named on the
// row, so the document reads as "a stage on the journey", never a grade. One
// neutral colour throughout: no red flags in a parent-facing report.

const LO_STAGE_ORDER: Array<LearningOutcomeStatus> = [
  'Beginning',
  'Developing',
  'Competent',
  'Exceeding',
]

// Stage pills — growth ramp, seed to bloom: Beginning is a quiet outlined
// seed, Developing warms to amber, Competent turns light lime, Accomplished
// blooms into saturated lime. A nature progression with no red anywhere, so
// it reads as growth, not grading — and it leaves blue to the app's
// interactive elements.
const LO_PILL_CLASS: Record<LearningOutcomeStatus, string> = {
  Exceeding: 'bg-lime-4 text-lime-12',
  Accomplished: 'bg-lime-4 text-lime-12',
  Competent: 'bg-lime-3 text-lime-12',
  Developing: 'bg-amber-3 text-amber-12',
  Beginning: 'text-muted-foreground border bg-transparent',
}

const QUALITY_PILL_CLASS: Record<CoreValueLevel, string> = {
  'Demonstrates Very Strongly': 'bg-lime-5 text-lime-12',
  'Demonstrates Strongly': 'bg-lime-4 text-lime-12',
  Demonstrates: 'bg-lime-3 text-lime-12',
  'Regularly Shows': 'bg-amber-3 text-amber-12',
  Beginning: 'text-muted-foreground border bg-transparent',
}

const SUBJECT_ICONS = new Map<string, LucideIcon>([
  ['English Language', BookOpen],
  ['Chinese Language', Languages],
  ['Mathematics', Calculator],
  ['Science', FlaskConical],
  ['Social Studies', Globe],
])

/** Per-subject card: sentence first, then every outcome with its statement in
 * full view — no disclosure levels, the reader scrolls instead of tapping. */
function SubjectCard({
  subj,
  submission,
}: {
  subj: SubjectPerformance
  submission?: CockpitSubjectSubmission
}) {
  const SubjectIcon = SUBJECT_ICONS.get(subj.name) ?? BookOpen
  return (
    <div className="rounded-xl border px-3.5 py-3">
      <div className="flex w-full items-center gap-2">
        <SubjectIcon aria-hidden className="text-primary size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {subj.name}
        </span>
        {submission?.submittedAt && (
          <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
            {stripSalutation(submission.teacherName)}
          </span>
        )}
      </div>
      <div className="mt-2 border-t pt-1.5">
        {subj.learningOutcomes.map((lo) => (
          <ScaleRow
            key={lo.name}
            label={lo.name}
            sublabel={lo.description}
            stageLabel={lo.status}
            pillClass={LO_PILL_CLASS[lo.status]}
          />
        ))}
      </div>
    </div>
  )
}

function ScaleRow({
  label,
  sublabel,
  stageLabel,
  pillClass,
}: {
  label: string
  /** Always-visible supporting line; wraps in full (never truncated). */
  sublabel?: string
  stageLabel: string
  pillClass: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm">{label}</p>
        {sublabel && (
          <p className="text-muted-foreground text-xs leading-snug">
            {sublabel}
          </p>
        )}
      </div>
      <span
        className={cn(
          'mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
          pillClass,
        )}
      >
        {stageLabel}
      </span>
    </div>
  )
}

function firstName(name: string): string {
  return name.split(' ').filter(Boolean)[0] ?? name
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 'P1-A' → 'Primary 1A' — the report spells the class out in full. */
function spellOutClass(classLabel: string): string {
  const match = /^P(\d)-([A-Z])$/.exec(classLabel)
  return match ? `Primary ${match[1]}${match[2]}` : classLabel
}

/** Mask the identification number the way the printed HDP does: TXXXX712D. */
function maskNric(nric: string): string {
  if (nric.length < 6) return nric
  return `${nric.slice(0, 1)}XXXX${nric.slice(5)}`
}

/** Subject-level highlights: each submitted subject is profiled by its LO
 * stages, and the panels name whole subjects — the strongest overall, and
 * (framed positively) the ones still climbing. */
function deriveHighlights(report: HolisticReport): {
  strongest: Array<string>
  growing: Array<string>
} {
  // Only draw on subjects whose School Cockpit data has actually arrived —
  // highlights must never cite data the teacher can't see yet.
  const scored = report.academic.subjects
    .filter((subj) => isSubjectSubmitted(report.studentId, subj.name))
    .map((subj) => ({
      name: subj.name,
      score:
        subj.learningOutcomes.reduce(
          (sum, lo) => sum + LO_STAGE_ORDER.indexOf(lo.status),
          0,
        ) / Math.max(subj.learningOutcomes.length, 1),
    }))
  if (scored.length < 2) return { strongest: [], growing: [] }
  const max = Math.max(...scored.map((s) => s.score))
  const min = Math.min(...scored.map((s) => s.score))
  if (max === min) return { strongest: [], growing: [] }
  return {
    strongest: scored
      .filter((s) => s.score === max)
      .map((s) => s.name)
      .slice(0, 2),
    growing: scored
      .filter((s) => s.score === min)
      .map((s) => s.name)
      .slice(0, 2),
  }
}

/** "Term at a glance" — the document's single designed visual moment. */
function TermAtAGlance({ report }: { report: HolisticReport }) {
  const attendancePct = Math.round(
    (report.attendance.daysPresent / report.attendance.totalSchoolDays) * 100,
  )
  const { strongest, growing } = deriveHighlights(report)
  const first = firstName(report.studentName)

  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      {/* Where the child shines and where she's growing. */}
      {strongest.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <div className="bg-twblue-2 flex-1 rounded-lg p-3">
            <p className="text-twblue-12 flex items-center gap-2 text-xs font-medium">
              <span
                aria-hidden
                className="bg-card flex size-7 shrink-0 items-center justify-center rounded-full"
              >
                <Award className="text-twblue-11 size-3.5" />
              </span>
              Strongest in
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {strongest.map((name) => (
                <span
                  key={name}
                  className="bg-card text-foreground rounded-full border px-2.5 py-0.5 text-xs font-medium"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
          {growing.length > 0 && (
            <div className="bg-lime-2 flex-1 rounded-lg p-3">
              <p className="text-lime-12 flex items-center gap-2 text-xs font-medium">
                <span
                  aria-hidden
                  className="bg-card flex size-7 shrink-0 items-center justify-center rounded-full"
                >
                  <Sprout className="text-lime-11 size-3.5" />
                </span>
                Growing in
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {growing.map((name) => (
                  <span
                    key={name}
                    className="bg-card text-foreground rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance and conduct — supporting facts as icon-chip bullet rows
          (Duolingo-certificate style), deliberately quieter than the panels. */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <div className="flex items-center gap-2.5 text-sm">
          <span
            aria-hidden
            className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full"
          >
            <Smile className="size-3.5" />
          </span>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">
              Conduct: {report.character.conduct}
            </span>{' '}
            · {first} had a {report.character.conduct.toLowerCase()} term
            overall
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <span
            aria-hidden
            className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full"
          >
            <CalendarCheck className="size-3.5" />
          </span>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">
              {attendancePct}% attendance
            </span>{' '}
            · present {report.attendance.daysPresent} of{' '}
            {report.attendance.totalSchoolDays} days
            {report.attendance.daysLate > 0 && (
              <>
                {' '}
                ·{' '}
                {report.attendance.daysLate === 1
                  ? '1 day late'
                  : `${report.attendance.daysLate} days late`}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

export interface ReportPreviewProps {
  report: HolisticReport
  blocks: Array<ReportBlock>
  /** When true, the comments block is editable (builder). When false, read-only (parent view). */
  editable?: boolean
  comments: string
  onCommentsChange?: (value: string) => void
  /**
   * When true, the pupil-particulars block drops name/class/term and keeps only
   * form teacher — for surfaces (guest view, detail page) whose own header already
   * carries the student's identity.
   */
  compactPupilInfo?: boolean
  /**
   * Teacher-facing surfaces set this so subjects whose School Cockpit data
   * hasn't arrived render an honest "awaiting data" placeholder instead of
   * seeded filler. Parent-facing views leave it off.
   */
  showMissingData?: boolean
}

export function ReportPreview({
  report,
  blocks,
  editable = false,
  comments,
  onCommentsChange,
  compactPupilInfo = false,
  showMissingData = false,
}: ReportPreviewProps) {
  const ordered = [...blocks]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order)
  const pupilInfoBlock = ordered.find((b) => b.key === 'pupilInfo')
  const restBlocks = ordered.filter((b) => b.key !== 'pupilInfo')

  return (
    <div className="mx-auto flex max-w-[66ch] flex-col gap-6">
      {pupilInfoBlock && (
        <div data-section-key={pupilInfoBlock.key}>
          <PreviewBlock
            block={pupilInfoBlock}
            report={report}
            editable={editable}
            comments={comments}
            onCommentsChange={onCommentsChange}
            compactPupilInfo={compactPupilInfo}
            showMissingData={showMissingData}
          />
        </div>
      )}
      {/* The teacher's words lead the document — a standalone block quote in
          read views. Write mode keeps the editor section instead, and the
          quote respects the "Form teacher comments" layout toggle. */}
      {!editable &&
        ordered.some((b) => b.key === 'conduct') &&
        (() => {
          const quote = stripHtml(comments)
          if (!quote) return null
          const first = firstName(report.studentName)
          const [beforeName, ...afterName] = quote.split(first)
          return (
            <blockquote className="border-amber-8 border-l-4 py-0.5 pl-4">
                <p className="text-sm leading-relaxed">
                  “
                  {afterName.length > 0 ? (
                    <>
                      {beforeName}
                      <strong>{first}</strong>
                      {afterName.join(first)}
                    </>
                  ) : (
                    quote
                  )}
                  ”
                </p>
              <footer className="text-muted-foreground mt-2 text-xs">
                — {stripSalutation(report.formTeacher)}, Form Teacher
              </footer>
            </blockquote>
          )
        })()}
      {restBlocks.map((block) => (
        <div key={block.key} data-section-key={block.key}>
          <PreviewBlock
            block={block}
            report={report}
            editable={editable}
            comments={comments}
            onCommentsChange={onCommentsChange}
            showMissingData={showMissingData}
          />
        </div>
      ))}
    </div>
  )
}

function PreviewBlock({
  block,
  report,
  editable,
  comments,
  onCommentsChange,
  compactPupilInfo = false,
  showMissingData = false,
}: {
  block: ReportBlock
  report: HolisticReport
  editable: boolean
  comments: string
  onCommentsChange?: (value: string) => void
  compactPupilInfo?: boolean
  showMissingData?: boolean
}) {
  const heading = (text: string) => (
    <h3 className="text-sm font-semibold tracking-tight">{text}</h3>
  )

  switch (block.key) {
    case 'pupilInfo':
      // Compact: the host surface's header already shows name/class/term, so keep
      // only form teacher here to avoid repeating the student's identity.
      if (compactPupilInfo) {
        return (
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{report.studentName}</h2>
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">
                Form teacher:{' '}
              </span>
              {stripSalutation(report.formTeacher)}
            </p>
          </div>
        )
      }
      // Identity band — avatar + particulars left, provenance right
      // (certificate-style header, after the Duolingo English Test reference).
      return (
        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold">{report.studentName}</h2>
              <p className="text-muted-foreground text-sm">
                {spellOutClass(report.studentClass)} · {report.term}{' '}
                {report.academicYear}
              </p>
              <p className="text-muted-foreground text-xs">
                ID: {maskNric(report.nric)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-sm sm:text-right">
            <p>
              <span className="text-foreground font-medium">
                Form teacher:{' '}
              </span>
              <span className="text-muted-foreground">
                {stripSalutation(report.formTeacher)}
              </span>
            </p>
            {report.coFormTeacher && (
              <p>
                <span className="text-foreground font-medium">
                  Co-form teacher:{' '}
                </span>
                <span className="text-muted-foreground">
                  {stripSalutation(report.coFormTeacher)}
                </span>
              </p>
            )}
          </div>
        </div>
      )

    case 'termAtAGlance':
      return <TermAtAGlance report={report} />

    case 'subjects': {
      const submissions = getCockpitSubmissions(report.studentId)
      return (
        <div className="flex flex-col gap-2">
          {heading('Subjects')}
          <p className="text-muted-foreground text-xs">
            Where {firstName(report.studentName)} is on each learning outcome —
            a stage on the journey, not a grade.
          </p>
          <div className="flex flex-col gap-3 pt-1">
            {report.academic.subjects.map((subj) => {
              const awaiting =
                showMissingData &&
                !isSubjectSubmitted(report.studentId, subj.name)
              const submission = submissions.find(
                (s) => s.subject === subj.name,
              )
              if (awaiting) {
                return (
                  <div
                    key={subj.name}
                    className="rounded-xl border border-dashed px-3.5 py-3"
                  >
                    <p className="text-sm font-medium">{subj.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Awaiting data from School Cockpit
                      {submission ? ` — ${stripSalutation(submission.teacherName)}` : ''}
                    </p>
                  </div>
                )
              }
              return (
                <SubjectCard
                  key={subj.name}
                  subj={subj}
                  submission={submission}
                />
              )
            })}
          </div>
        </div>
      )
    }

    case 'conduct':
      // Conduct lives in the at-a-glance bullet, and read views surface the
      // written note as the quote at the top of that card — this section only
      // renders where the teacher edits the comment.
      if (!editable || !onCommentsChange) return null
      return (
        <div className="flex flex-col gap-2">
          {heading('Form teacher comments')}
          <div className="space-y-1.5">
            <Label htmlFor="ft-comments" className="sr-only">
              Form teacher comments
            </Label>
            <RichTextEditor
              value={comments}
              onChange={onCommentsChange}
              toolbar="simple"
              placeholder="Write a short comment about this pupil…"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onCommentsChange(
                  (comments ? comments + ' ' : '') +
                    `${firstName(report.studentName)} has settled well into Primary 1, shows curiosity in class, and is building confidence with friends.`,
                )
              }
            >
              <Sparkles className="mr-2 size-4" />
              Suggest
            </Button>
          </div>
        </div>
      )

    // Attendance renders once, in the "Term at a glance" hero — no standalone
    // section, so the report never states it twice.

    case 'personalQualities':
      return (
        <div className="flex flex-col gap-2">
          {heading('Personal qualities')}
          <div className="rounded-xl border px-3.5 py-2">
            {report.holistic.coreValues.map((cv) => (
              <ScaleRow
                key={cv.name}
                label={cv.name}
                sublabel={cv.description}
                stageLabel={cv.level}
                pillClass={QUALITY_PILL_CLASS[cv.level]}
              />
            ))}
          </div>
        </div>
      )

    case 'cca':
      return (
        <div className="flex flex-col gap-2">
          {heading('Co-curricular activities')}
          {report.holistic.cca.length ? (
            report.holistic.cca.map((c) => (
              <p key={c.name} className="text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground"> · {c.role}</span>
              </p>
            ))
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No CCA recorded.
            </p>
          )}
        </div>
      )

    case 'via':
      return (
        <div className="flex flex-col gap-2">
          {heading('Values in Action')}
          {report.holistic.via.length ? (
            report.holistic.via.map((v) => (
              <p key={v.activityName} className="text-sm">
                <span className="font-medium">{v.activityName}</span>
                <span className="text-muted-foreground"> · {v.hours} hrs</span>
              </p>
            ))
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No activities recorded.
            </p>
          )}
        </div>
      )

    case 'physicalFitness':
      return (
        <div className="flex flex-col gap-1">
          {heading('Physical fitness')}
          <p className="text-muted-foreground text-sm">
            {report.holistic.physicalFitness.bmiCategory}
            {report.holistic.physicalFitness.napfaAward
              ? ` · NAPFA ${report.holistic.physicalFitness.napfaAward}`
              : ''}
          </p>
        </div>
      )

    default:
      return null
  }
}
