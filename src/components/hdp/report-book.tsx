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
import { cn } from '@/lib/utils'
import {
  slipDetailsForStudent,
  slipResultsForStudent,
  staticRecordsForStudent,
} from '@/data/insights'
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

// The shared report-book rendering — follows the official HDP report
// (MOE mockup, 6 pages) section-for-section: particulars → results with
// mark/grade/percentile → overall (percentage, attendance, days late,
// next-year class/course) → conduct & comments → personal qualities →
// subject remarks → CCA remarks → physical fitness → VIA → co-curricular
// activities (with attendance) → enrichment → programmes → awards. Two
// prototype-native sections keep their place at the end (trends behind
// `reports-hdp-future`, "Ask me about"). Used both by the teacher's own
// preview and the parent guest route, distinguished only by `viewer`:
// teacher-preview shows SourceTag provenance chips per sentence; parent
// view carries one attribution line per comment section instead
// (authorship, not tag ids — P3/CMP-9).
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
  const records = staticRecordsForStudent(book.studentId)
  const slip = slipDetailsForStudent(book.studentId)
  const { rows: resultRows, percentage } = slipResultsForStudent(
    book.studentId,
    book.results,
  )

  const changeFor = (subject: string) =>
    book.results.find((r) => r.subject === subject && r.term === 4)?.change
  const totalViaHours = slip.via.reduce((sum, row) => sum + row.hours, 0)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">
            Holistic Development Profile · For Year {book.schoolYear}
          </p>
          <Heading className="text-2xl font-semibold">{studentName}</Heading>
          <p className="text-muted-foreground text-sm">
            {className} · S/N {slip.serialNo}
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <Particular label="Age on 1st Jan" value={String(slip.age)} />
          <Particular label="Identification no" value={slip.idNo} />
          <Particular label="Course" value={slip.course} />
          <Particular label="Form teacher" value={staffName('lee-sy')} />
          <Particular label="Co-form teacher" value={staffName('goh-wt')} />
        </dl>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold">Results</h2>
          <p className="text-muted-foreground text-xs">
            The official record — from School Cockpit
          </p>
        </div>
        <div className="border-border max-w-full overflow-x-auto rounded-lg border">
          <Table>
            <TableCaption className="sr-only">
              Semester 1, Semester 2 and overall subject results for{' '}
              {studentName} — mark, grade and percentile
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="align-bottom">
                  Subject
                </TableHead>
                <TableHead colSpan={2} className="text-center">
                  Sem 1
                </TableHead>
                <TableHead colSpan={2} className="text-center">
                  Sem 2
                </TableHead>
                <TableHead colSpan={3} className="text-center">
                  Overall
                </TableHead>
                {showFuture && (
                  <TableHead rowSpan={2} className="text-right align-bottom">
                    Change
                  </TableHead>
                )}
              </TableRow>
              <TableRow>
                <TableHead className="text-right">Mark</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead className="text-right">Mark</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead className="text-right">Mark</TableHead>
                <TableHead className="text-right">Grade</TableHead>
                <TableHead className="text-right">Pctl</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultRows.map((row) => (
                <TableRow key={row.subject}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {row.subject}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.sem1.mark}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.sem1.grade}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.sem2.mark}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.sem2.grade}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.overall.mark}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.overall.grade}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {row.overall.pctl}
                  </TableCell>
                  {showFuture && (
                    <TableCell className="text-right tabular-nums">
                      {formatChange(changeFor(row.subject))}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Overall</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <Particular label="Percentage" value={String(percentage)} />
          <Particular
            label="Attendance"
            value={`${book.attendance.present}/${book.attendance.total} days`}
          />
          <Particular label="No. of days late" value={String(slip.daysLate)} />
          <Particular label="Class for next year" value={slip.nextClass} />
          <Particular label="Course for next year" value={slip.nextCourse} />
        </dl>
        {records.promotion && (
          <p className="text-muted-foreground text-sm">{records.promotion}</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Conduct & comments</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <Particular label="Conduct (overall)" value={book.conduct} />
        </dl>
        {book.overallComment && (
          <CommentSection
            heading="Comments (overall)"
            authorId={book.overallComment.authorId}
            claims={book.overallComment.claims}
            viewer={viewer}
            showSourceTags={showSourceTags}
            resolveTag={resolveTag}
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Personal qualities</h2>
        <SlipTable
          caption={`Personal qualities and remarks for ${studentName}`}
          columns={['Quality', 'Remarks']}
          rows={slip.personalQualities.map((q) => [q.quality, q.remark])}
        />
      </section>

      {book.subjectComments.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Subject remarks</h2>
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

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">CCA remarks</h2>
        <p className="text-sm leading-relaxed">{slip.ccaRemarks}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Physical fitness</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <Particular label="BMI weight indicator" value={slip.bmi} />
          <Particular
            label="Physical fitness test award"
            value={slip.fitnessAward}
          />
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Values in action</h2>
        {slip.via.map((row) => (
          <div key={row.title} className="flex flex-col gap-0.5 text-sm">
            <p className="font-medium">{row.title}</p>
            <p className="text-muted-foreground">
              {row.type} · {row.partner}
            </p>
            <p className="text-muted-foreground tabular-nums">
              {row.role} · {row.hours} hours
            </p>
          </div>
        ))}
        <p className="text-sm tabular-nums">
          Total duration: {totalViaHours} hours
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Co-curricular activities</h2>
        <div className="flex flex-col gap-0.5 text-sm">
          <p className="font-medium">{slip.cca.name}</p>
          <p className="text-muted-foreground">
            {slip.cca.involvement} · {slip.cca.domain}
          </p>
          {slip.cca.event && (
            <p className="text-muted-foreground">
              Event/Competition: {slip.cca.event}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium">CCA attendance</h3>
          <SlipTable
            caption={`CCA attendance by term for ${studentName}`}
            columns={['Term 1', 'Term 2', 'Term 3', 'Term 4', 'Overall']}
            rows={[[...slip.cca.attendanceByTerm, slip.cca.attendanceOverall]]}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Enrichment</h2>
        <SlipTable
          caption={`Enrichment activities for ${studentName}`}
          columns={['Area', 'Activity', 'SDP domain']}
          rows={slip.enrichment.map((e) => [e.area, e.activity, e.domain])}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Programmes</h2>
        <SlipTable
          caption={`School programmes for ${studentName}`}
          columns={['Programme', 'Domain']}
          rows={slip.programmes.map((p) => [p.programme, p.domain])}
        />
      </section>

      {slip.awards.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Awards</h2>
          {slip.awards.map((a) => (
            <div key={a.award} className="flex flex-col gap-0.5 text-sm">
              <p className="font-medium">{a.award}</p>
              <p className="text-muted-foreground">
                {a.type} · {a.category}
              </p>
            </div>
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
          <p className="text-muted-foreground text-sm">
            {firstName} can start the conversation — ask about these.
          </p>
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

/** One label/value row of the slip's particulars-style definition lists
 *  (header block, Overall, Conduct, Physical fitness) — always rendered
 *  inside a `grid-cols-[auto_1fr]` <dl>. */
function Particular({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </>
  )
}

/** Plain bordered data table for the slip's record sections (personal
 *  qualities, VIA, CCA, enrichment, programmes, awards) — same wrapper as
 *  the Results table, text cells only. */
function SlipTable({
  caption,
  columns,
  rows,
}: {
  caption: string
  columns: Array<string>
  rows: Array<Array<string>>
}) {
  return (
    <div className="border-border max-w-full overflow-x-auto rounded-lg border">
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell
                  key={cellIndex}
                  className={cn(
                    'align-top whitespace-normal',
                    cellIndex === 0 ? 'font-medium' : 'text-muted-foreground',
                  )}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
          <React.Fragment key={claim.id ?? `claim-${index}`}>
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
