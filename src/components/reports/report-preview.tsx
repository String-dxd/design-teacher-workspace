import { useEffect, useRef, useState } from 'react'
import {
  CalendarCheck,
  ChevronDown,
  Flag,
  Loader2,
  Pencil,
  Sparkles,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  CoreValueLevel,
  HolisticReport,
  LearningOutcomeStatus,
  ReportBlock,
  SubjectPerformance,
} from '@/types/report'
import type { CockpitSubjectSubmission } from '@/data/mock-cockpit-submissions'
import type { DraftSource } from '@/lib/hdp-comment-draft'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ALL_DRAFT_SOURCES,
  DRAFT_SOURCE_DEFS,
  draftTeacherComment,
} from '@/lib/hdp-comment-draft'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

/**
 * Illustration slot for a subject/qualities card — a hand-drawn graphic in
 * this app's own house style (see public/teacher-illustration.png), sourced
 * from the design team rather than generated here. Renders nothing until a
 * matching file exists: drop a PNG at
 * `public/subject-illustrations/{slug}.png` for each of 'mathematics',
 * 'chinese-language', 'english-language', 'social-studies', 'science',
 * 'personal-qualities', 'cca', 'values-in-action' and it appears
 * automatically — no code change needed.
 */
function SectionIllustration({ slug, alt }: { slug: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={`/subject-illustrations/${slug}.png`}
      alt={alt}
      className="h-24 w-24 object-contain"
      onError={() => setFailed(true)}
    />
  )
}

const SUBJECT_ILLUSTRATION_SLUG = new Map<string, string>([
  ['English Language', 'english-language'],
  ['Chinese Language', 'chinese-language'],
  ['Mathematics', 'mathematics'],
  ['Science', 'science'],
  ['Social Studies', 'social-studies'],
])

/** Per-subject card: illustration + centered name/teacher, then every
 * outcome with its statement in full view — no disclosure levels, the
 * reader scrolls instead of tapping. */
function SubjectCard({
  subj,
  submission,
}: {
  subj: SubjectPerformance
  submission?: CockpitSubjectSubmission
}) {
  const slug = SUBJECT_ILLUSTRATION_SLUG.get(subj.name)
  return (
    <div className="bg-card rounded-xl border px-3.5 py-4">
      <div className="flex flex-col items-center gap-1 pb-3 text-center">
        {slug && <SectionIllustration slug={slug} alt="" />}
        <p className="text-sm font-semibold">{subj.name}</p>
        {submission?.submittedAt && (
          <p className="text-muted-foreground text-xs italic">
            Taught by: {stripSalutation(submission.teacherName)}
          </p>
        )}
      </div>
      <div className="border-t pt-1.5">
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
    <div className="flex items-start justify-between gap-2 py-1.5 @sm/report:gap-3">
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

/** Generate-draft split button, shared between CommentField's read and edit
 * modes so the two don't drift out of sync. */
function GenerateDraftControl({
  drafting,
  sources,
  onGenerate,
  onToggleSource,
}: {
  drafting: boolean
  sources: Array<DraftSource>
  onGenerate: () => void
  onToggleSource: (id: DraftSource, checked: boolean) => void
}) {
  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerate}
        disabled={drafting || sources.length === 0}
        className="rounded-r-none border-r-0"
      >
        {drafting ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 size-4" />
        )}
        {drafting ? 'Drafting…' : 'Generate draft'}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              disabled={drafting}
              aria-label="Choose draft sources"
              className="rounded-l-none px-2"
            />
          }
        >
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Draft from</DropdownMenuLabel>
            {DRAFT_SOURCE_DEFS.map((def) => (
              <DropdownMenuCheckboxItem
                key={def.id}
                checked={sources.includes(def.id)}
                onCheckedChange={(checked) =>
                  onToggleSource(def.id, checked === true)
                }
                closeOnClick={false}
              >
                {def.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/**
 * The comments field wears the exact chrome of the final parent-facing quote
 * so what the teacher types is what parents see. Editing sits behind an
 * explicit Edit → Save changes / Cancel flow so a stray click can't quietly
 * rewrite an approved comment — read mode reuses TeacherQuote itself, so the
 * read view is provably identical to what parents see. "Generate draft"
 * composes a comment from the sources checked in the split-button menu
 * (results, attendance, conduct, personal qualities, CCA); from read mode
 * it's only offered when the comment is blank — otherwise the teacher must
 * enter edit mode first, so generation can never silently overwrite existing
 * text.
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
  const [isEditing, setIsEditing] = useState(false)
  const [draftText, setDraftText] = useState(comments)
  const [drafting, setDrafting] = useState(false)
  const [sources, setSources] = useState<Array<DraftSource>>(ALL_DRAFT_SOURCES)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus()
  }, [isEditing])

  function toggleSource(id: DraftSource, checked: boolean) {
    setSources((prev) =>
      checked
        ? ALL_DRAFT_SOURCES.filter((s) => s === id || prev.includes(s))
        : prev.filter((s) => s !== id),
    )
  }

  function startEditing() {
    setDraftText(comments)
    setIsEditing(true)
  }

  function handleGenerate() {
    setDrafting(true)
    window.setTimeout(() => {
      setDraftText(draftTeacherComment(report, sources))
      setIsEditing(true)
      setDrafting(false)
    }, 800)
  }

  function handleSave() {
    onCommentsChange(draftText)
    setIsEditing(false)
  }

  function handleCancel() {
    setDraftText(comments)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="space-y-2">
        {comments.trim() ? (
          <TeacherQuote report={report} comments={comments} />
        ) : (
          <p className="text-muted-foreground text-sm italic">
            No comment written yet.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="mr-2 size-3.5" />
            Edit
          </Button>
          {!comments.trim() && (
            <GenerateDraftControl
              drafting={drafting}
              sources={sources}
              onGenerate={handleGenerate}
              onToggleSource={toggleSource}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="ft-comments" className="sr-only">
        Form teacher comments
      </Label>
      <blockquote className="border-twblue-6 border-l-4 py-0.5 pl-4">
        <Textarea
          ref={textareaRef}
          id="ft-comments"
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Write a short comment about this pupil…"
          rows={2}
          className="field-sizing-content min-h-0 resize-none rounded-none border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0"
        />
        <footer className="text-muted-foreground mt-2 text-xs">
          — {stripSalutation(report.formTeacher)}, Form Teacher
        </footer>
      </blockquote>
      <div className="flex flex-wrap items-center gap-2">
        <GenerateDraftControl
          drafting={drafting}
          sources={sources}
          onGenerate={handleGenerate}
          onToggleSource={toggleSource}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save changes
          </Button>
        </div>
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

/**
 * The teacher's written note as parents read it — quoted, child's first name
 * bolded, attributed. Read-view counterpart of CommentField; renders in the
 * "Form teacher comments" section's ordered slot.
 */
function TeacherQuote({
  report,
  comments,
}: {
  report: HolisticReport
  comments: string
}) {
  const quote = stripHtml(comments)
  if (!quote) return null
  const first = firstName(report.studentName)
  const [beforeName, ...afterName] = quote.split(first)
  return (
    <blockquote className="border-twblue-6 border-l-4 py-0.5 pl-4">
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/** Single best subject for the "Best Subject" tile: the submitted subject
 * with the highest average LO stage. Ties are named together. Returns null
 * when fewer than two subjects have data (nothing meaningful to compare). */
function deriveBestSubject(report: HolisticReport): string | null {
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
  if (scored.length < 2) return null
  const max = Math.max(...scored.map((s) => s.score))
  const names = scored.filter((s) => s.score === max).map((s) => s.name)
  return names.length > 0 ? names.join(', ') : null
}

/** White bordered card split into two halves by a vertical divider — the
 * "Term at a glance" hero is two of these, side by side. */
function GlanceCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card divide-x rounded-xl border">{children}</div>
  )
}

/** One half of a GlanceCard: optional icon + label header, then arbitrary
 * content below. The reference only shows an icon on the first half of each
 * card, so icon is optional rather than required. */
function GlanceHalf({
  icon,
  label,
  children,
}: {
  icon?: LucideIcon
  label: string
  children: ReactNode
}) {
  const Icon = icon
  return (
    <div className="flex-1 p-3.5">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

/** "Term at a glance" — two divided white cards: attendance + days late,
 * conduct + best subject. */
function TermAtAGlance({ report }: { report: HolisticReport }) {
  const attendancePct = Math.round(
    (report.attendance.daysPresent / report.attendance.totalSchoolDays) * 100,
  )
  const bestSubject = deriveBestSubject(report)
  const { daysLate } = report.attendance

  return (
    <div className="grid grid-cols-1 gap-2.5 @sm/report:grid-cols-2">
      <GlanceCard>
        <GlanceHalf icon={CalendarCheck} label="Attendance">
          <div className="flex items-center gap-3">
            <AttendanceRing
              percentage={attendancePct}
              size={40}
              strokeWidth={5}
              color="currentColor"
              label=""
            />
            <div className="min-w-0">
              <p className="text-lg leading-tight font-semibold">
                {report.attendance.daysPresent}/
                {report.attendance.totalSchoolDays}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
                Days present
              </p>
            </div>
          </div>
        </GlanceHalf>
        <GlanceHalf label="Days Late">
          <p className="text-lg leading-tight font-semibold">{daysLate}</p>
          {daysLate === 0 && (
            <p className="text-lime-11 mt-0.5 text-[11px] leading-snug font-medium">
              Good job!
            </p>
          )}
        </GlanceHalf>
      </GlanceCard>
      <GlanceCard>
        <GlanceHalf icon={Flag} label="Conduct">
          <span className="bg-violet-3 text-violet-12 inline-block rounded-full px-2.5 py-0.5 text-sm font-medium">
            {report.character.conduct}
          </span>
        </GlanceHalf>
        <GlanceHalf label="Best Subject">
          {bestSubject ? (
            <p className="text-sm leading-tight font-semibold">
              {bestSubject}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              Not yet available
            </p>
          )}
        </GlanceHalf>
      </GlanceCard>
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
    <div className="@container/report bg-muted/40 mx-auto flex max-w-[66ch] flex-col gap-4 rounded-2xl p-3 @sm/report:gap-6 @sm/report:p-4">
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
      {restBlocks
        .filter(
          (block) =>
            // Skip blocks that would render nothing — an empty wrapper still
            // occupies a flex slot and doubles the section gap. In read views
            // the comments section renders as the teacher's quote (skipped
            // when nothing is written), and stored layouts may carry keys
            // with no renderer (e.g. the retired attendance section).
            RENDERED_SECTIONS.has(block.key) &&
            (block.key !== 'conduct' ||
              (editable ? !!onCommentsChange : stripHtml(comments).length > 0)),
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
      // Profile card — avatar + name/school up top, then Class, then a
      // two-column Form/Co-form teacher row (matches the PG dialog's own
      // header design, see pg-report-preview-dialog.tsx).
      return (
        <div className="bg-card flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>{getInitials(report.studentName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-twblue-11 truncate text-base font-bold uppercase">
                {report.studentName}
              </h2>
              {report.schoolName && (
                <p className="text-muted-foreground truncate text-sm">
                  {report.schoolName}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                {report.term} {report.academicYear} · ID:{' '}
                {maskNric(report.nric)}
              </p>
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Class: </span>
              <span className="font-medium">
                {spellOutClass(report.studentClass)}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 border-t pt-3 @sm/report:grid-cols-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Form teacher: </span>
              <span className="font-medium">
                {stripSalutation(report.formTeacher)}
              </span>
            </p>
            {report.coFormTeacher && (
              <p className="text-sm">
                <span className="text-muted-foreground">
                  Co-form teacher:{' '}
                </span>
                <span className="font-medium">
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
                      {submission
                        ? ` — ${stripSalutation(submission.teacherName)}`
                        : ''}
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
      // Conduct lives in the at-a-glance bullet; this section carries the
      // teacher's written note. Read views render it as the quote, in
      // whatever position the layout orders it (the section is filtered out
      // upstream when nothing is written).
      if (!editable || !onCommentsChange) {
        return <TeacherQuote report={report} comments={comments} />
      }
      return (
        <div className="flex flex-col gap-2">
          {heading("Teacher's comments")}
          <p className="text-muted-foreground text-xs">
            A note from the form teacher on {firstName(report.studentName)}'s
            term.
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
          <div className="bg-card rounded-xl border px-3.5 py-4">
            <div className="flex flex-col items-center gap-1 pb-3 text-center">
              <SectionIllustration slug="personal-qualities" alt="" />
              <p className="text-sm font-semibold">Personal Qualities</p>
            </div>
            <div className="border-t pt-1.5">
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
        </div>
      )

    case 'cca':
      return (
        <div className="flex flex-col gap-2">
          {heading('Co-curricular activities')}
          <p className="text-muted-foreground text-xs">
            Where {firstName(report.studentName)} spends time outside the
            classroom.
          </p>
          <div className="bg-card rounded-xl border px-3.5 py-4">
            <div className="flex flex-col items-center gap-1 pb-3 text-center">
              <SectionIllustration slug="cca" alt="" />
              <p className="text-sm font-semibold">
                Co-curricular Activities
              </p>
            </div>
            <div className="border-t pt-1.5">
              {report.holistic.cca.length ? (
                report.holistic.cca.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-start justify-between gap-2 py-1.5"
                  >
                    <p className="text-sm">{c.name}</p>
                    <span className="text-muted-foreground mt-0.5 shrink-0 text-xs">
                      {c.role}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground py-1.5 text-sm italic">
                  No CCA recorded.
                </p>
              )}
            </div>
          </div>
        </div>
      )

    case 'via':
      return (
        <div className="flex flex-col gap-2">
          {heading('Values in Action')}
          <p className="text-muted-foreground text-xs">
            How {firstName(report.studentName)} has contributed to the
            community.
          </p>
          <div className="bg-card rounded-xl border px-3.5 py-4">
            <div className="flex flex-col items-center gap-1 pb-3 text-center">
              <SectionIllustration slug="values-in-action" alt="" />
              <p className="text-sm font-semibold">Values in Action</p>
            </div>
            <div className="border-t pt-1.5">
              {report.holistic.via.length ? (
                report.holistic.via.map((v) => (
                  <div
                    key={v.activityName}
                    className="flex items-start justify-between gap-2 py-1.5"
                  >
                    <p className="text-sm">{v.activityName}</p>
                    <span className="text-muted-foreground mt-0.5 shrink-0 text-xs">
                      {v.hours} hrs
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground py-1.5 text-sm italic">
                  No activities recorded.
                </p>
              )}
            </div>
          </div>
        </div>
      )

    case 'physicalFitness':
      return (
        <div className="flex flex-col gap-2">
          {heading('Physical fitness')}
          <GlanceCard>
            <GlanceHalf label="BMI Category">
              <p className="text-sm leading-tight font-semibold">
                {report.holistic.physicalFitness.bmiCategory}
              </p>
            </GlanceHalf>
            <GlanceHalf label="NAPFA Award">
              {report.holistic.physicalFitness.napfaAward ? (
                <p className="text-sm leading-tight font-semibold">
                  {report.holistic.physicalFitness.napfaAward}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  Not yet available
                </p>
              )}
            </GlanceHalf>
          </GlanceCard>
        </div>
      )

    default:
      return null
  }
}
