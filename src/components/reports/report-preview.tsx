import {
  BookOpen,
  Calculator,
  FlaskConical,
  Languages,
  Sparkles,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import type {
  BlockDisplay,
  CoreValueLevel,
  HolisticReport,
  LearningOutcomeStatus,
  ReportBlock,
} from '@/types/report'
import { RichTextEditor } from '@/components/comms/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AttendanceRing } from '@/components/reports/attendance-ring'
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

const QUALITY_STAGE_ORDER: Array<CoreValueLevel> = [
  'Beginning',
  'Regularly Shows',
  'Demonstrates',
  'Demonstrates Strongly',
  'Demonstrates Very Strongly',
]

const LO_STAGE_MEANINGS: Array<{ stage: string; meaning: string }> = [
  { stage: 'Beginning', meaning: 'Starting out — learns with close support.' },
  { stage: 'Developing', meaning: 'Making progress with some guidance.' },
  { stage: 'Competent', meaning: 'Meets the learning outcome confidently.' },
  {
    stage: 'Accomplished',
    meaning: 'Applies it independently and consistently.',
  },
]

const SUBJECT_ICONS = new Map<string, LucideIcon>([
  ['English Language', BookOpen],
  ['Chinese Language', Languages],
  ['Mathematics', Calculator],
  ['Science', FlaskConical],
])

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

/** Filled segments up to the achieved stage. Decorative — the stage word on the
 * row is the accessible text. */
function GrowthScale({
  stageIndex,
  totalStages,
  rowIndex,
}: {
  stageIndex: number
  totalStages: number
  rowIndex: number
}) {
  return (
    <div aria-hidden className="flex w-24 shrink-0 items-center gap-1 sm:w-28">
      {Array.from({ length: totalStages }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full',
            i <= stageIndex
              ? 'bg-primary animate-hdp-seg-grow'
              : 'border-border bg-muted/40 border',
          )}
          style={
            i <= stageIndex
              ? { animationDelay: `${rowIndex * 60 + i * 45}ms` }
              : undefined
          }
        />
      ))}
    </div>
  )
}

function ScaleRow({
  label,
  sublabel,
  stageIndex,
  totalStages,
  stageLabel,
  rowIndex,
  display = 'bars',
}: {
  label: string
  sublabel?: string
  stageIndex: number
  totalStages: number
  stageLabel: string
  rowIndex: number
  display?: BlockDisplay
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{label}</p>
        {sublabel && (
          <p className="text-muted-foreground truncate text-xs">{sublabel}</p>
        )}
      </div>
      {display === 'bars' && (
        <GrowthScale
          stageIndex={stageIndex}
          totalStages={totalStages}
          rowIndex={rowIndex}
        />
      )}
      <span
        className={cn(
          'text-twblue-11 shrink-0 text-right text-xs leading-tight font-medium',
          display === 'bars' ? 'w-24 sm:w-28' : 'w-auto',
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

/** "Term at a glance" — the document's single designed visual moment. */
function TermAtAGlance({ report }: { report: HolisticReport }) {
  const attendancePct = Math.round(
    (report.attendance.daysPresent / report.attendance.totalSchoolDays) * 100,
  )

  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-center gap-3">
        <div aria-hidden className="text-primary">
          <AttendanceRing
            percentage={attendancePct}
            size={88}
            strokeWidth={8}
            color="currentColor"
          />
        </div>
        <div className="text-sm">
          <p className="font-medium">Attendance</p>
          <p className="text-muted-foreground">
            {attendancePct}% · present {report.attendance.daysPresent} of{' '}
            {report.attendance.totalSchoolDays} days
          </p>
        </div>
      </div>
      <div className="hidden h-12 w-px bg-border sm:block" aria-hidden />
      <div className="text-sm">
        <p className="font-medium">Conduct: {report.character.conduct}</p>
        <p className="text-muted-foreground">
          {firstName(report.studentName)} had a{' '}
          {report.character.conduct.toLowerCase()} term overall.
        </p>
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
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">
                Form teacher:{' '}
              </span>
              {report.formTeacher}
            </p>
            <p className="text-muted-foreground text-xs">
              Packaged from School Cockpit · data as at{' '}
              {formatFullDay(COCKPIT_LAST_SYNCED)}
            </p>
          </div>
        )
      }
      return (
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{report.studentName}</h2>
          <dl className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>
              <dt className="text-foreground inline font-medium">Class: </dt>
              <dd className="inline">{report.studentClass}</dd>
            </div>
            <div>
              <dt className="text-foreground inline font-medium">Term: </dt>
              <dd className="inline">
                {report.term} {report.academicYear}
              </dd>
            </div>
            <div>
              <dt className="text-foreground inline font-medium">
                Form teacher:{' '}
              </dt>
              <dd className="inline">{report.formTeacher}</dd>
            </div>
          </dl>
          <p className="text-muted-foreground text-xs">
            Packaged from School Cockpit · data as at{' '}
            {formatFullDay(COCKPIT_LAST_SYNCED)}
          </p>
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
          <Accordion className="rounded-lg border">
            <AccordionItem value="how-to-read" className="border-b-0">
              <AccordionTrigger className="px-3 py-2 text-xs font-medium">
                How to read this report
              </AccordionTrigger>
              <AccordionContent className="px-3">
                <ul className="flex flex-col gap-1.5">
                  {LO_STAGE_MEANINGS.map((m, i) => (
                    <li key={m.stage} className="flex items-center gap-3">
                      <GrowthScale
                        stageIndex={i}
                        totalStages={4}
                        rowIndex={i}
                      />
                      <span className="text-xs">
                        <span className="font-medium">{m.stage}</span>{' '}
                        <span className="text-muted-foreground">
                          — {m.meaning}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex flex-col gap-4 pt-1">
            {report.academic.subjects.map((subj, subjIdx) => {
              const awaiting =
                showMissingData &&
                !isSubjectSubmitted(report.studentId, subj.name)
              const submission = submissions.find(
                (s) => s.subject === subj.name,
              )
              const SubjectIcon = SUBJECT_ICONS.get(subj.name) ?? BookOpen
              if (awaiting) {
                return (
                  <div
                    key={subj.name}
                    className="rounded-lg border border-dashed p-3"
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
                <div key={subj.name} className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <SubjectIcon
                      aria-hidden
                      className="text-primary size-4 shrink-0 self-center"
                    />
                    <p className="text-sm font-medium">{subj.name}</p>
                    {submission?.submittedAt && (
                      <p className="text-muted-foreground text-xs">
                        {submission.teacherName} ·{' '}
                        {formatDay(submission.submittedAt)}
                      </p>
                    )}
                  </div>
                  {subj.learningOutcomes.map((lo, loIdx) => (
                    <ScaleRow
                      key={lo.name}
                      label={lo.name}
                      stageIndex={LO_STAGE_ORDER.indexOf(lo.status)}
                      totalStages={LO_STAGE_ORDER.length}
                      stageLabel={lo.status}
                      rowIndex={subjIdx * 4 + loIdx}
                      display={block.display}
                    />
                  ))}
                </div>
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

    case 'attendance': {
      const pct = Math.round(
        (report.attendance.daysPresent / report.attendance.totalSchoolDays) *
          100,
      )
      return (
        <div className="flex flex-col gap-1.5">
          {heading('Attendance')}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">
                {report.attendance.daysPresent}
              </span>{' '}
              of {report.attendance.totalSchoolDays} days present
            </span>
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">
                {report.attendance.daysLate}
              </span>{' '}
              {report.attendance.daysLate === 1 ? 'day' : 'days'} late
            </span>
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{pct}%</span>{' '}
              attendance
            </span>
          </div>
        </div>
      )
    }

    case 'personalQualities':
      return (
        <div className="flex flex-col gap-2">
          {heading('Personal qualities')}
          <div className="flex flex-col gap-1">
            {report.holistic.coreValues.map((cv, i) => (
              <ScaleRow
                key={cv.name}
                label={cv.name}
                sublabel={cv.description}
                stageIndex={QUALITY_STAGE_ORDER.indexOf(cv.level)}
                totalStages={QUALITY_STAGE_ORDER.length}
                stageLabel={cv.level}
                rowIndex={i}
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
