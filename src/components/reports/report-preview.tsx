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
  BlockDisplay,
  CoreValueLevel,
  HolisticReport,
  LearningOutcome,
  LearningOutcomeStatus,
  ReportBlock,
  SubjectPerformance,
} from '@/types/report'
import type { CockpitSubjectSubmission } from '@/data/mock-cockpit-submissions'
import { RichTextEditor } from '@/components/comms/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  COCKPIT_LAST_SYNCED,
  getCockpitSubmissions,
  isSubjectSubmitted,
} from '@/data/mock-cockpit-submissions'
import { cn } from '@/lib/utils'

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
  'Accomplished',
]

// Soft stage pills — one blue family, deeper tint = further along the ladder,
// so the palette reads as depth on a journey rather than good/bad grading.
const LO_PILL_CLASS: Record<LearningOutcomeStatus, string> = {
  Accomplished: 'bg-twblue-5 text-twblue-12',
  Competent: 'bg-twblue-3 text-twblue-11',
  Developing: 'bg-twblue-2 text-twblue-11',
  Beginning: 'bg-muted text-muted-foreground',
}

const QUALITY_PILL_CLASS: Record<CoreValueLevel, string> = {
  'Demonstrates Very Strongly': 'bg-twblue-5 text-twblue-12',
  'Demonstrates Strongly': 'bg-twblue-4 text-twblue-12',
  Demonstrates: 'bg-twblue-3 text-twblue-11',
  'Regularly Shows': 'bg-twblue-2 text-twblue-11',
  Beginning: 'bg-muted text-muted-foreground',
}

const SUBJECT_ICONS = new Map<string, LucideIcon>([
  ['English Language', BookOpen],
  ['Chinese Language', Languages],
  ['Mathematics', Calculator],
  ['Science', FlaskConical],
  ['Social Studies', Globe],
])

/** Join names conversationally: "Reading", "Reading and Listening",
 * "Reading, Listening and Writing". */
function joinNames(names: Array<string>): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`
}

/** One deterministic sentence per subject, built from the LO stages — the
 * parent's entry point before any bars or stage words. */
function summarizeSubject(
  first: string,
  learningOutcomes: Array<LearningOutcome>,
): string {
  const staged = learningOutcomes.map((lo) => ({
    name: lo.name,
    stage: LO_STAGE_ORDER.indexOf(lo.status),
  }))
  const max = Math.max(...staged.map((s) => s.stage))
  const min = Math.min(...staged.map((s) => s.stage))
  if (max === min) {
    const uniform: Record<LearningOutcomeStatus, string> = {
      Accomplished: `${first} is working confidently and independently across all areas.`,
      Competent: `${first} is meeting the learning outcomes confidently across all areas.`,
      Developing: `${first} is making steady progress across all areas.`,
      Beginning: `${first} is starting out and building foundations.`,
    }
    return uniform[LO_STAGE_ORDER[max]]
  }
  const top = staged
    .filter((s) => s.stage === max)
    .map((s) => s.name)
    .slice(0, 2)
  const bottom = staged
    .filter((s) => s.stage === min)
    .map((s) => s.name)
    .slice(0, 2)
  return `${first} is strongest in ${joinNames(top)}, and is building ${joinNames(bottom)}.`
}

/** Per-subject card: sentence first, then every outcome with its statement in
 * full view — no disclosure levels, the reader scrolls instead of tapping. */
function SubjectCard({
  subj,
  studentFirstName,
  submission,
  audience,
  display,
}: {
  subj: SubjectPerformance
  studentFirstName: string
  submission?: CockpitSubjectSubmission
  audience: 'teacher' | 'parent'
  display?: BlockDisplay
}) {
  const SubjectIcon = SUBJECT_ICONS.get(subj.name) ?? BookOpen
  return (
    <div className="rounded-xl border px-3.5 py-3">
      <div className="flex w-full items-center gap-2">
        <SubjectIcon aria-hidden className="text-primary size-4 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {subj.name}
          </span>
          {submission?.submittedAt && (
            <span className="text-muted-foreground block truncate text-xs">
              {submission.teacherName}
              {audience === 'teacher' &&
                ` · ${formatDay(submission.submittedAt)}`}
            </span>
          )}
        </span>
      </div>
      <p className="pt-1.5 text-sm leading-relaxed">
        {summarizeSubject(studentFirstName, subj.learningOutcomes)}
      </p>
      <div className="mt-2 border-t pt-1.5">
        {subj.learningOutcomes.map((lo) => (
          <ScaleRow
            key={lo.name}
            label={lo.name}
            sublabel={lo.description}
            stageLabel={lo.status}
            pillClass={LO_PILL_CLASS[lo.status]}
            display={display}
          />
        ))}
      </div>
    </div>
  )
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
  })
}

function formatFullDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ScaleRow({
  label,
  sublabel,
  stageLabel,
  pillClass,
  display = 'bars',
}: {
  label: string
  /** Always-visible supporting line; wraps in full (never truncated). */
  sublabel?: string
  stageLabel: string
  pillClass: string
  /** 'bars' → soft stage pill (default); 'labels' → plain text word. */
  display?: BlockDisplay
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
      {display === 'bars' ? (
        <span
          className={cn(
            'mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
            pillClass,
          )}
        >
          {stageLabel}
        </span>
      ) : (
        <span className="text-twblue-11 mt-1 shrink-0 text-right text-xs leading-tight font-medium">
          {stageLabel}
        </span>
      )}
    </div>
  )
}

function firstName(name: string): string {
  return name.split(' ').filter(Boolean)[0] ?? name
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/** Learning highlights derived from the packaged LO stages: the areas at the
 * highest stage, and (framed positively) the areas still climbing. */
function deriveHighlights(report: HolisticReport): {
  strongest: Array<string>
  growing: Array<string>
} {
  // Only draw on subjects whose School Cockpit data has actually arrived —
  // highlights must never cite an outcome the teacher can't see yet.
  const staged = report.academic.subjects
    .filter((subj) => isSubjectSubmitted(report.studentId, subj.name))
    .flatMap((subj) =>
      subj.learningOutcomes.map((lo) => ({
        name: lo.name,
        stage: LO_STAGE_ORDER.indexOf(lo.status),
      })),
    )
  if (staged.length === 0) return { strongest: [], growing: [] }
  const max = Math.max(...staged.map((s) => s.stage))
  const min = Math.min(...staged.map((s) => s.stage))
  if (max === min) return { strongest: [], growing: [] }
  const dedupe = (names: Array<string>) => [...new Set(names)]
  return {
    strongest: dedupe(
      staged.filter((s) => s.stage === max).map((s) => s.name),
    ).slice(0, 3),
    growing: dedupe(
      staged.filter((s) => s.stage === min).map((s) => s.name),
    ).slice(0, 2),
  }
}

/** "Term at a glance" — the document's single designed visual moment. */
function TermAtAGlance({ report }: { report: HolisticReport }) {
  const attendancePct = Math.round(
    (report.attendance.daysPresent / report.attendance.totalSchoolDays) * 100,
  )
  const { strongest, growing } = deriveHighlights(report)

  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      {/* The lead insight: where the child shines and where she's growing. */}
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
            · {firstName(report.studentName)} had a{' '}
            {report.character.conduct.toLowerCase()} term overall
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
  /**
   * Teachers see operational provenance (School Cockpit freshness line);
   * parents don't — for them it's simply the report their child's teachers
   * prepared.
   */
  audience?: 'teacher' | 'parent'
}

export function ReportPreview({
  report,
  blocks,
  editable = false,
  comments,
  onCommentsChange,
  compactPupilInfo = false,
  showMissingData = false,
  audience = 'teacher',
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
            audience={audience}
          />
        </div>
      )}
      {pupilInfoBlock && <TermAtAGlance report={report} />}
      {restBlocks.map((block) => (
        <div key={block.key} data-section-key={block.key}>
          <PreviewBlock
            block={block}
            report={report}
            editable={editable}
            comments={comments}
            onCommentsChange={onCommentsChange}
            showMissingData={showMissingData}
            audience={audience}
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
  audience = 'teacher',
}: {
  block: ReportBlock
  report: HolisticReport
  editable: boolean
  comments: string
  onCommentsChange?: (value: string) => void
  compactPupilInfo?: boolean
  showMissingData?: boolean
  audience?: 'teacher' | 'parent'
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
              {report.formTeacher}
            </p>
            {audience === 'teacher' && (
              <p className="text-muted-foreground text-xs">
                Packaged from School Cockpit · data as at{' '}
                {formatFullDay(COCKPIT_LAST_SYNCED)}
              </p>
            )}
          </div>
        )
      }
      // Identity band — avatar + particulars left, provenance right
      // (certificate-style header, after the Duolingo English Test reference).
      return (
        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="bg-twblue-3 text-twblue-11 flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            >
              {initials(report.studentName)}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{report.studentName}</h2>
              <p className="text-muted-foreground text-sm">
                {report.studentClass} · {report.term} {report.academicYear}
              </p>
            </div>
          </div>
          <div className="text-sm sm:text-right">
            <p>
              <span className="text-foreground font-medium">
                Form teacher:{' '}
              </span>
              <span className="text-muted-foreground">
                {report.formTeacher}
              </span>
            </p>
            {audience === 'teacher' && (
              <p className="text-muted-foreground text-xs">
                Packaged from School Cockpit · data as at{' '}
                {formatFullDay(COCKPIT_LAST_SYNCED)}
              </p>
            )}
          </div>
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
                      {submission ? ` — ${submission.teacherName}` : ''}
                    </p>
                  </div>
                )
              }
              return (
                <SubjectCard
                  key={subj.name}
                  subj={subj}
                  studentFirstName={firstName(report.studentName)}
                  submission={submission}
                  audience={audience}
                  display={block.display}
                />
              )
            })}
          </div>
        </div>
      )
    }

    case 'conduct':
      return (
        <div className="flex flex-col gap-2">
          {heading('Conduct & comments')}
          <p className="text-sm">
            <span className="font-medium">Conduct: </span>
            {report.character.conduct}
          </p>
          {editable && onCommentsChange ? (
            <div className="space-y-1.5">
              <Label htmlFor="ft-comments">Form-teacher comments</Label>
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
          ) : comments ? (
            <>
              <div
                className="text-sm leading-relaxed [&_p]:mb-2"
                // Teacher's own schema-constrained Tiptap output (prototype).
                dangerouslySetInnerHTML={{ __html: comments }}
              />
              <p className="text-muted-foreground text-xs">
                — {report.formTeacher}, Form Teacher
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No comments yet.
            </p>
          )}
        </div>
      )

    // Attendance renders once, in the "Term at a glance" hero — no standalone
    // section, so the report never states it twice.

    case 'personalQualities':
      return (
        <div className="flex flex-col gap-2">
          {heading('Personal qualities')}
          <div className="flex flex-col gap-1">
            {report.holistic.coreValues.map((cv) => (
              <ScaleRow
                key={cv.name}
                label={cv.name}
                sublabel={cv.description}
                stageLabel={cv.level}
                pillClass={QUALITY_PILL_CLASS[cv.level]}
                display={block.display}
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
