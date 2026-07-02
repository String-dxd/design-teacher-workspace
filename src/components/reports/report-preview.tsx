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

// Shared P1 report renderer — used by the builder's live preview (editable) and the
// parent-facing guest view (read-only). Renders the ordered, enabled blocks of a
// ReportLayout. P1 shows Learning Outcomes + qualitative descriptors — never marks,
// percentages, or A1–F9 grades.

const LO_FRACTION: Record<LearningOutcomeStatus, number> = {
  Accomplished: 1,
  Competent: 0.75,
  Developing: 0.5,
  Beginning: 0.25,
}

const QUALITY_FRACTION: Record<CoreValueLevel, number> = {
  'Demonstrates Very Strongly': 1,
  'Demonstrates Strongly': 0.8,
  Demonstrates: 0.6,
  'Regularly Shows': 0.4,
  Beginning: 0.2,
}

function StatusBar({ fraction }: { fraction: number }) {
  return (
    <div className="bg-muted h-2 w-24 shrink-0 overflow-hidden rounded-full">
      <div
        className="bg-primary h-full rounded-full"
        style={{ width: `${Math.round(fraction * 100)}%` }}
      />
    </div>
  )
}

function firstName(name: string): string {
  return name.split(' ').filter(Boolean)[0] ?? name
}

export interface ReportPreviewProps {
  report: HolisticReport
  blocks: Array<ReportBlock>
  /** When true, the comments block is editable (builder). When false, read-only (parent view). */
  editable?: boolean
  comments: string
  onCommentsChange?: (value: string) => void
}

export function ReportPreview({
  report,
  blocks,
  editable = false,
  comments,
  onCommentsChange,
}: ReportPreviewProps) {
  const ordered = [...blocks]
    .filter((b) => b.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="mx-auto flex max-w-[66ch] flex-col gap-6">
      {ordered.map((block) => (
        <PreviewBlock
          key={block.key}
          block={block}
          report={report}
          editable={editable}
          comments={comments}
          onCommentsChange={onCommentsChange}
        />
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
}: {
  block: ReportBlock
  report: HolisticReport
  editable: boolean
  comments: string
  onCommentsChange?: (value: string) => void
}) {
  const heading = (text: string) => (
    <h3 className="text-sm font-semibold tracking-tight">{text}</h3>
  )

  switch (block.key) {
    case 'pupilInfo':
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
            {report.academic.subjects.map((subj) => (
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
                    {block.viz === 'table' ? (
                      <span className="text-foreground shrink-0 text-xs font-medium">
                        {lo.status}
                      </span>
                    ) : (
                      <StatusBar fraction={LO_FRACTION[lo.status]} />
                    )}
                  </div>
                ))}
              </div>
            ))}
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
                {block.viz === 'table' ? (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {cv.level}
                  </span>
                ) : (
                  <StatusBar fraction={QUALITY_FRACTION[cv.level]} />
                )}
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
