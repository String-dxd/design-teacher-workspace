import * as React from 'react'
import { SourceTag } from './source-tag'
import { TrendLine } from './trend-line'
import type {
  DraftClaim,
  HdpReportBook,
  HdpTag,
  TrendDirection,
} from '@/types/hdp'
import { MOCK_STAFF } from '@/data/mock-staff'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function staffName(id: string): string {
  return MOCK_STAFF.find((s) => s.id === id)?.name ?? 'Unknown teacher'
}

const DIRECTION_WORDS: Record<TrendDirection, string> = {
  climbing: 'Climbing',
  steady: 'Steady',
  recovering: 'Recovering',
  easing: 'Easing',
}

function formatChange(change: number | undefined): string {
  if (change === undefined) return '—'
  if (change === 0) return '+0'
  return change > 0 ? `+${change}` : `−${Math.abs(change)}`
}

export interface SubjectTrendRow {
  subject: string
  direction: TrendDirection
  points: Array<number>
}

type ResolveTag = (
  tagId: string,
) => { tag: HdpTag; authorName: string } | undefined

interface ReportBookProps {
  book: HdpReportBook
  studentName: string
  className: string
  viewer: 'teacher-preview' | 'parent'
  /** Resolves a claim's source tag id to the underlying tag + author name —
   *  needed both for teacher-preview's SourceTag chips and for the parent
   *  attribution line's "n subject teachers" count. Optional: when absent,
   *  chips don't render and the attribution line drops the count rather
   *  than fabricating one. */
  resolveTag?: ResolveTag
  /** Resolved by the caller from the `reports-hdp-future` flag — this
   *  component stays flag-free (repo convention). Gates the results table's
   *  "Change" column AND the "Where things are heading" trends section. */
  showFuture?: boolean
  /** Per-subject trend rows (≥2 semesters of data only) — only read when
   *  `showFuture` is true. */
  trends?: Array<SubjectTrendRow>
}

// The shared report-book rendering — a formal, single-column register
// (marks lead, per the report-book register design; the full chaptered
// report with marks-last is out of scope, Phase 3). Used both by the
// teacher's own preview (/reports/release?preview=…) and the parent guest
// route, distinguished only by `viewer`: teacher-preview shows SourceTag
// provenance chips per sentence; parent view carries one attribution line
// per comment section instead (authorship, not tag ids — P3/CMP-9).
export function ReportBook({
  book,
  studentName,
  className,
  viewer,
  resolveTag,
  showFuture = false,
  trends = [],
}: ReportBookProps) {
  const showSourceTags = viewer === 'teacher-preview'
  const firstName = studentName.split(' ')[0] ?? studentName
  const Heading = viewer === 'parent' ? 'h1' : 'h2'

  const subjects = Array.from(new Set(book.results.map((r) => r.subject)))
  const gradeFor = (subject: string, term: 3 | 4) =>
    book.results.find((r) => r.subject === subject && r.term === term)?.grade
  const changeFor = (subject: string) =>
    book.results.find((r) => r.subject === subject && r.term === 4)?.change

  const hasComments =
    Boolean(book.overallComment) || book.subjectComments.length > 0

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">
          Semester {book.semester}, {book.schoolYear}
        </p>
        <Heading className="text-2xl font-semibold">{studentName}</Heading>
        <p className="text-muted-foreground text-sm">{className}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Results</h2>
        <div className="border-border max-w-full overflow-x-auto rounded-lg border">
          <Table>
            <TableCaption className="sr-only">
              Term 3 and Term 4 subject results for {studentName}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Term 3</TableHead>
                <TableHead className="text-right">Term 4</TableHead>
                {showFuture && (
                  <TableHead className="text-right">Change</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject}>
                  <TableCell className="font-medium">{subject}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {gradeFor(subject, 3) ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {gradeFor(subject, 4) ?? '—'}
                  </TableCell>
                  {showFuture && (
                    <TableCell className="text-right tabular-nums">
                      {formatChange(changeFor(subject))}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-1 text-sm">
        <h2 className="text-lg font-semibold">Attendance & conduct</h2>
        <p className="tabular-nums">
          Present {book.attendance.present} of {book.attendance.total} days
        </p>
        <p>{book.conduct}</p>
      </section>

      {hasComments && (
        <section className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold">Personal qualities</h2>
          {book.overallComment && (
            <CommentSection
              heading={null}
              authorId={book.overallComment.authorId}
              claims={book.overallComment.claims}
              viewer={viewer}
              showSourceTags={showSourceTags}
              resolveTag={resolveTag}
            />
          )}
          {book.subjectComments.map((sc) => (
            <CommentSection
              key={sc.subject}
              heading={sc.subject}
              authorId={sc.authorId}
              claims={sc.claims}
              viewer={viewer}
              showSourceTags={showSourceTags}
              resolveTag={resolveTag}
            />
          ))}
        </section>
      )}

      {showFuture && trends.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Where things are heading</h2>
          <div className="flex flex-col gap-3">
            {trends.map((trend) => (
              <div
                key={trend.subject}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-sm font-medium">{trend.subject}</span>
                <div className="flex items-center gap-3">
                  <TrendLine points={trend.points} />
                  <span className="text-sm font-medium">
                    {DIRECTION_WORDS[trend.direction]}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Direction, not numbers, leads. Drawn from weighted assessments
            already recorded.
          </p>
        </section>
      )}

      {book.parentPrompts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Ask {firstName} about</h2>
          <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
            {book.parentPrompts.map((prompt, index) => (
              <li key={index}>{prompt}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

interface CommentSectionProps {
  heading: string | null
  authorId: string
  claims: Array<DraftClaim>
  viewer: 'teacher-preview' | 'parent'
  showSourceTags: boolean
  resolveTag?: ResolveTag
}

function CommentSection({
  heading,
  authorId,
  claims,
  viewer,
  showSourceTags,
  resolveTag,
}: CommentSectionProps) {
  const otherAuthorIds = new Set<string>()
  if (resolveTag) {
    for (const claim of claims) {
      if (!claim.source) continue
      const resolved = resolveTag(claim.source.tagId)
      if (resolved && resolved.tag.authorId !== authorId) {
        otherAuthorIds.add(resolved.tag.authorId)
      }
    }
  }
  const subjectTeacherCount = otherAuthorIds.size

  return (
    <div className="flex flex-col gap-2">
      {heading && <h3 className="text-sm font-medium">{heading}</h3>}
      {viewer === 'parent' && (
        <p className="text-muted-foreground text-sm">
          Written by {staffName(authorId)}
          {subjectTeacherCount > 0
            ? ` from observations by ${subjectTeacherCount} subject teacher${subjectTeacherCount === 1 ? '' : 's'}`
            : ''}
          .
        </p>
      )}
      <p className="text-sm leading-relaxed">
        {claims.map((claim, index) => (
          <React.Fragment key={index}>
            <span>{claim.text} </span>
            {showSourceTags && (
              <>
                <SourceTag
                  source={claim.source}
                  edited={claim.edited}
                  tag={
                    claim.source
                      ? resolveTag?.(claim.source.tagId)?.tag
                      : undefined
                  }
                  authorName={
                    claim.source
                      ? resolveTag?.(claim.source.tagId)?.authorName
                      : undefined
                  }
                />{' '}
              </>
            )}
          </React.Fragment>
        ))}
      </p>
    </div>
  )
}
