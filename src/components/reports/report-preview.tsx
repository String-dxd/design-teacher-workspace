import { useState } from 'react'
import {
  Award,
  BookOpen,
  Calculator,
  CalendarCheck,
  FlaskConical,
  Globe,
  Languages,
  Loader2,
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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { draftTeacherComment } from '@/lib/hdp-comment-draft'
import { AttendanceRing } from '@/components/reports/attendance-ring'
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

/** Section keys PreviewBlock can actually render (pupilInfo handled apart). */
const RENDERED_SECTIONS = new Set([
  'termAtAGlance',
  'subjects',
  'conduct',
  'personalQualities',
  'cca',
  'via',
  'physicalFitness',
])

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
        <SubjectIcon aria-hidden className="text-muted-foreground size-4 shrink-0" />
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
        {/* Index keys: the artifact repeats outcome names (Chinese lists
            "Reading" twice), so names aren't unique. */}
        {subj.learningOutcomes.map((lo, i) => (
          <ScaleRow
            key={`${i}-${lo.name}`}
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

/**
 * The comments field wears the exact chrome of the final parent-facing quote
 * (amber rule + attribution) so what the teacher types is what parents see.
 * Plain text only — no rich text for report prose. "Generate draft" composes
 * a comment from results, attendance, conduct and Student-Insights data.
 */
function CommentField({
  report,
  comments,
  onCommentsChange,
}: {
  report: HolisticReport
  comments: string
  onCommentsChange: (value: string) => void
}) {
  const [drafting, setDrafting] = useState(false)

  function handleGenerate() {
    setDrafting(true)
    window.setTimeout(() => {
      onCommentsChange(draftTeacherComment(report))
      setDrafting(false)
    }, 800)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="ft-comments" className="sr-only">
        Form teacher comments
      </Label>
      <blockquote className="border-amber-6 border-l-4 py-0.5 pl-4">
        <Textarea
          id="ft-comments"
          value={comments}
          onChange={(e) => onCommentsChange(e.target.value)}
          placeholder="Write a short comment about this pupil…"
          rows={2}
          className="field-sizing-content min-h-0 resize-none rounded-none border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0"
        />
        <footer className="text-muted-foreground mt-2 text-xs">
          — {stripSalutation(report.formTeacher)}, Form Teacher
        </footer>
      </blockquote>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={drafting}
        >
          {drafting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 size-4" />
          )}
          {drafting ? 'Drafting…' : 'Generate draft'}
        </Button>
        <span className="text-muted-foreground text-xs">
          Drafts from results, attendance, conduct and Student Insights
        </span>
      </div>
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

/** Count the dominant descriptor stage within one subject, for an honest
 * tile caption like "2 of 3 outcomes at Exceeding". */
function subjectStageCaption(
  report: HolisticReport,
  subjectName: string,
): string | null {
  const subj = report.academic.subjects.find((x) => x.name === subjectName)
  if (!subj || subj.learningOutcomes.length === 0) return null
  const counts = new Map<LearningOutcomeStatus, number>()
  for (const lo of subj.learningOutcomes) {
    counts.set(lo.status, (counts.get(lo.status) ?? 0) + 1)
  }
  let best: LearningOutcomeStatus | null = null
  let bestCount = 0
  for (const [status, count] of counts) {
    const higherStage =
      best === null ||
      LO_STAGE_ORDER.indexOf(status) > LO_STAGE_ORDER.indexOf(best)
    if (count > bestCount || (count === bestCount && higherStage)) {
      best = status
      bestCount = count
    }
  }
  if (best === null) return null
  return `${bestCount} of ${subj.learningOutcomes.length} outcomes at ${best}`
}

/** One metric tile — health-app anatomy: icon + label, big value, caption. */
function GlanceTile({
  icon,
  label,
  value,
  caption,
  tint,
  ring,
}: {
  icon: LucideIcon
  label: string
  value: string
  caption?: string | null
  tint: { bg: string; label: string; value: string }
  ring?: number
}) {
  const Icon = icon
  return (
    <div className={cn('rounded-lg p-3', tint.bg)}>
      <p
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium',
          tint.label,
        )}
      >
        <Icon aria-hidden className="size-3.5 shrink-0" />
        {label}
      </p>
      <div className="mt-1.5 flex items-center gap-3">
        {ring !== undefined && (
          <div aria-hidden className={cn('shrink-0', tint.label)}>
            <AttendanceRing
              percentage={ring}
              size={40}
              strokeWidth={5}
              color="currentColor"
              label=""
            />
          </div>
        )}
        <div className="min-w-0">
          <p className={cn('text-lg leading-tight font-semibold', tint.value)}>
            {value}
          </p>
          {caption && (
            <p className={cn('mt-0.5 text-[11px] leading-snug', tint.label)}>
              {caption}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** "Term at a glance" — four soft metric tiles, health-app style: each fact
 * in its own gentle colour family. */
function TermAtAGlance({ report }: { report: HolisticReport }) {
  const attendancePct = Math.round(
    (report.attendance.daysPresent / report.attendance.totalSchoolDays) * 100,
  )
  const { strongest, growing } = deriveHighlights(report)

  return (
    <div className="bg-card rounded-xl border p-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        {strongest.length > 0 && (
          <GlanceTile
            icon={Award}
            label="Strongest in"
            value={strongest.join(', ')}
            caption={
              strongest.length === 1
                ? subjectStageCaption(report, strongest[0])
                : null
            }
            tint={{
              bg: 'bg-lime-2',
              label: 'text-lime-11',
              value: 'text-lime-12',
            }}
          />
        )}
        {growing.length > 0 && (
          <GlanceTile
            icon={Sprout}
            label="Growing in"
            value={growing.join(', ')}
            caption={
              growing.length === 1
                ? subjectStageCaption(report, growing[0])
                : null
            }
            tint={{
              bg: 'bg-amber-2',
              label: 'text-amber-11',
              value: 'text-amber-12',
            }}
          />
        )}
        <GlanceTile
          icon={CalendarCheck}
          label="Attendance"
          value={`${attendancePct}%`}
          caption={`${report.attendance.daysPresent} of ${report.attendance.totalSchoolDays} days${
            report.attendance.daysLate > 0
              ? ` · ${report.attendance.daysLate} day${report.attendance.daysLate === 1 ? '' : 's'} late`
              : ''
          }`}
          tint={{
            bg: 'bg-twblue-2',
            label: 'text-twblue-11',
            value: 'text-twblue-12',
          }}
          ring={attendancePct}
        />
        <GlanceTile
          icon={Smile}
          label="Conduct"
          value={report.character.conduct}
          caption={`A ${report.character.conduct.toLowerCase()} term overall`}
          tint={{
            bg: 'bg-violet-2',
            label: 'text-violet-11',
            value: 'text-violet-12',
          }}
        />
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
            <blockquote className="border-amber-6 border-l-4 py-0.5 pl-4">
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
      {restBlocks
        .filter(
          (block) =>
            // Skip blocks that would render nothing — an empty wrapper still
            // occupies a flex slot and doubles the section gap. The comments
            // section only renders where the teacher edits it (read views
            // quote the comment in the hero), and stored layouts may carry
            // keys with no renderer (e.g. the retired attendance section).
            RENDERED_SECTIONS.has(block.key) &&
            (block.key !== 'conduct' || (editable && !!onCommentsChange)),
        )
        .map((block) => (
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
      return (
        <div className="flex flex-col gap-2">
          {heading('Term at a glance')}
          <p className="text-muted-foreground text-xs">
            A quick snapshot of {firstName(report.studentName)}'s term —
            strengths, growth areas, attendance, and conduct.
          </p>
          <TermAtAGlance report={report} />
        </div>
      )

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
          <p className="text-muted-foreground text-xs">
            A note from the form teacher on{' '}
            {firstName(report.studentName)}'s term.
          </p>
          <CommentField
            report={report}
            comments={comments}
            onCommentsChange={onCommentsChange}
          />
        </div>
      )

    // Attendance renders once, in the "Term at a glance" hero — no standalone
    // section, so the report never states it twice.

    case 'personalQualities':
      return (
        <div className="flex flex-col gap-2">
          {heading('Personal qualities')}
          <p className="text-muted-foreground text-xs">
            How {firstName(report.studentName)} shows the school's personal
            qualities day to day.
          </p>
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
