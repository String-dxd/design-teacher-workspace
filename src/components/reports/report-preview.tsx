import { Sparkles } from 'lucide-react'

import type {
  CoreValueLevel,
  HolisticReport,
  LearningOutcomeStatus,
  ReportBlock,
} from '@/types/report'
import { RichTextEditor } from '@/components/comms/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AttendanceRing } from '@/components/reports/attendance-ring'
import {
  getSubjectTeacher,
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

// Chip text uses step 12 (lime/amber) and twblue-11 — step 11 on step 3 sits just
// below the 4.5:1 AA floor for these hues at 12px (measured 4.25–4.29).
const LO_CHIP_CLASS: Record<LearningOutcomeStatus, string> = {
  Accomplished: 'bg-twblue-3 text-twblue-11',
  Competent: 'bg-lime-3 text-lime-12',
  Developing: 'bg-amber-3 text-amber-12',
  Beginning: 'bg-muted text-muted-foreground',
}

const QUALITY_CHIP_CLASS: Record<CoreValueLevel, string> = {
  'Demonstrates Very Strongly': 'bg-twblue-3 text-twblue-11',
  'Demonstrates Strongly': 'bg-lime-3 text-lime-12',
  Demonstrates: 'bg-lime-3 text-lime-12',
  'Regularly Shows': 'bg-amber-3 text-amber-12',
  Beginning: 'bg-muted text-muted-foreground',
}

function DescriptorChip({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {label}
    </span>
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
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">Form teacher: </span>
            {report.formTeacher}
          </p>
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
        </div>
      )

    case 'subjects':
      return (
        <div className="flex flex-col gap-2">
          {heading('Subjects')}
          <p className="text-muted-foreground text-xs">
            Learning outcomes and how {firstName(report.studentName)} is
            progressing.
          </p>
          <div className="flex flex-col gap-3">
            {report.academic.subjects.map((subj) => {
              const awaiting =
                showMissingData &&
                !isSubjectSubmitted(report.studentId, subj.name)
              if (awaiting) {
                const teacher = getSubjectTeacher(subj.name)
                return (
                  <div
                    key={subj.name}
                    className="rounded-lg border border-dashed p-3"
                  >
                    <p className="text-sm font-medium">{subj.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Awaiting data from School Cockpit
                      {teacher ? ` — ${teacher}` : ''}
                    </p>
                  </div>
                )
              }
              return (
                <div key={subj.name} className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{subj.name}</p>
                  {subj.learningOutcomes.map((lo) => (
                    <div
                      key={lo.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground min-w-0 flex-1 truncate">
                        {lo.name}
                      </span>
                      <DescriptorChip
                        label={lo.status}
                        className={LO_CHIP_CLASS[lo.status]}
                      />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )

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
            <div
              className="text-sm leading-relaxed [&_p]:mb-2"
              // Teacher's own schema-constrained Tiptap output (prototype).
              dangerouslySetInnerHTML={{ __html: comments }}
            />
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No comments yet.
            </p>
          )}
        </div>
      )

    case 'attendance':
      return (
        <div className="flex flex-col gap-1">
          {heading('Attendance')}
          <p className="text-muted-foreground text-sm">
            Present {report.attendance.daysPresent} of{' '}
            {report.attendance.totalSchoolDays} days ·{' '}
            {report.attendance.daysLate} late
          </p>
        </div>
      )

    case 'personalQualities':
      return (
        <div className="flex flex-col gap-2">
          {heading('Personal qualities')}
          <div className="flex flex-col gap-2">
            {report.holistic.coreValues.map((cv) => (
              <div
                key={cv.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{cv.name}</span>
                <DescriptorChip
                  label={cv.level}
                  className={QUALITY_CHIP_CLASS[cv.level]}
                />
              </div>
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
