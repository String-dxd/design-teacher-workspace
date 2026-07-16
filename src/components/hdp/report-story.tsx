import { TagPill } from './tag-pill'
import { TrendLine } from './trend-line'
import type { SubjectTrendRow } from './report-book'
import type {
  FormingPattern,
  HdpReportBook,
  StudentReflection,
  TagContext,
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const DIRECTION_WORDS: Record<TrendDirection, string> = {
  climbing: 'Climbing',
  steady: 'Steady',
  recovering: 'Recovering',
  easing: 'Easing',
}

const CONTEXT_LABELS: Record<TagContext, string> = {
  lesson: 'Lesson',
  marking: 'Marking',
  cca: 'CCA',
  'form-time': 'Form time',
  other: 'Other',
}

/** Family-facing provenance, first honest slice (PRD B.4, plan 040): a
 *  per-SECTION line, copy only — no per-sentence badges (the visual
 *  language for that is an open design question, PRD §11.12). Renders only
 *  when the section's source draft actually carried a non-empty
 *  `insightIds` — i.e. it was composed via Prototype B's insight layer,
 *  not handwritten or A-path (composeDraft) content. */
function insightAttributionLine(
  insightIds: Array<string> | undefined,
  authorId: string,
): string | undefined {
  if (!insightIds || insightIds.length === 0) return undefined
  return `Drafted from ${insightIds.length} insight${insightIds.length === 1 ? '' : 's'} selected by ${staffName(authorId)}; sentences added by the teacher are their own words.`
}

function formatChange(change: number | undefined): string {
  if (change === undefined) return '—'
  if (change === 0) return '+0'
  return change > 0 ? `+${change}` : `−${Math.abs(change)}`
}

/** "Noticed 3 times across marking and other" — count + contexts, straight
 *  from the pattern's own tag data (no extra tag reads needed here). */
function evidenceSentence(pattern: FormingPattern): string {
  const contexts = pattern.contexts.map((c) => CONTEXT_LABELS[c].toLowerCase())
  const contextList =
    contexts.length <= 1
      ? contexts.join('')
      : `${contexts.slice(0, -1).join(', ')} and ${contexts[contexts.length - 1]}`
  return `Noticed ${pattern.tagIds.length} time${pattern.tagIds.length === 1 ? '' : 's'}, across ${contextList}.`
}

interface ReportStoryProps {
  book: HdpReportBook
  studentName: string
  className: string
  viewer: 'teacher-preview' | 'parent'
  /** The reflection the cover leads with — resolved by the caller via
   *  `coverReflection(book.studentId)` (repo convention: components stay
   *  store-read-free). Absent ⇒ the honest "No reflection yet" fallback,
   *  never a fabricated quote. */
  reflection?: StudentReflection
  /** CONFIRMED patterns only — the caller filters `loadPatterns()` by
   *  studentId AND status === 'confirmed' (P5: candidates/dismissed never
   *  render in the story register). */
  patterns?: Array<FormingPattern>
  /** Resolved by the caller from the `reports-hdp-future` flag — same
   *  convention as ReportBook; this component stays flag-free. */
  showFuture?: boolean
  trends?: Array<SubjectTrendRow>
}

// Prototype B's story register (plan 037) — leads with the student's own
// reflection and teacher-validated behaviour patterns, closes with the
// official results as an appendix. Structurally rhymes with ReportBook's
// narrative-first order (header → qualities → ask-about → attendance/
// conduct → trends → results appendix, plan 039) but tells it in the
// student's voice via chapters, not comment prose. Single column,
// `max-w-2xl`, sentence case throughout — never uppercase/mono (the
// reference wireframe's dark-panel/mono styling is adapted to app tokens).
export function ReportStory({
  book,
  studentName,
  className,
  viewer,
  reflection,
  patterns = [],
  showFuture = false,
  trends = [],
}: ReportStoryProps) {
  const firstName = studentName.split(' ')[0] ?? studentName
  const CoverHeading = viewer === 'parent' ? 'h1' : 'h2'

  const confirmedPatterns = patterns.filter((p) => p.status === 'confirmed')

  const subjects = Array.from(new Set(book.results.map((r) => r.subject)))
  const gradeFor = (subject: string, term: 3 | 4) =>
    book.results.find((r) => r.subject === subject && r.term === term)?.grade
  const changeFor = (subject: string) =>
    book.results.find((r) => r.subject === subject && r.term === 4)?.change

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <p className="text-muted-foreground text-xs">
          Holistic development profile — {className} — Semester {book.semester},{' '}
          {book.schoolYear}
        </p>
        <CoverHeading className="text-2xl font-semibold">
          {firstName}'s semester, in their own words
        </CoverHeading>

        {reflection ? (
          <div className="flex flex-col gap-2">
            <p className="text-lg leading-relaxed">
              &ldquo;{reflection.text}&rdquo;
            </p>
            <p className="text-muted-foreground text-sm">
              Written by {studentName}, {formatDate(reflection.writtenAt)}
              {reflection.chosenAsCover ? ' · Chosen as the cover' : ''}
            </p>
            <p className="border-border text-muted-foreground rounded-md border border-dashed p-3 text-xs">
              Student reflection, unedited. Teachers see it after release; it is
              never vetted.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No reflection yet</p>
        )}
      </header>

      {(book.overallComment || book.subjectComments.length > 0) && (
        <section className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold">Personal qualities</h2>
          {book.overallComment && (
            <div className="flex flex-col gap-2">
              <p className="text-sm leading-relaxed">
                {book.overallComment.claims.map((c) => c.text).join(' ')}
              </p>
              {insightAttributionLine(
                book.overallComment.insightIds,
                book.overallComment.authorId,
              ) && (
                <p className="text-muted-foreground text-xs">
                  {insightAttributionLine(
                    book.overallComment.insightIds,
                    book.overallComment.authorId,
                  )}
                </p>
              )}
            </div>
          )}
          {book.subjectComments.map((sc) => (
            <div key={sc.subject} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">{sc.subject}</h3>
              <p className="text-sm leading-relaxed">
                {sc.claims.map((c) => c.text).join(' ')}
              </p>
              {insightAttributionLine(sc.insightIds, sc.authorId) && (
                <p className="text-muted-foreground text-xs">
                  {insightAttributionLine(sc.insightIds, sc.authorId)}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {confirmedPatterns.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">
            Patterns this semester — validated by teachers
          </h2>
          {confirmedPatterns.map((pattern) => {
            const uniqueContexts = Array.from(new Set(pattern.contexts))
            return (
              <div
                key={pattern.id}
                className="border-border flex flex-col gap-2 rounded-lg border p-4"
              >
                {pattern.headline && (
                  <h3 className="text-base font-semibold">
                    {pattern.headline}
                  </h3>
                )}
                <p className="text-muted-foreground text-sm">
                  {evidenceSentence(pattern)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueContexts.map((context) => (
                    <TagPill key={context} label={CONTEXT_LABELS[context]} />
                  ))}
                </div>
                {pattern.studentNote && (
                  <div className="border-border border-l-2 pl-3">
                    <p className="text-sm">
                      <span className="font-medium">{firstName} adds: </span>
                      {pattern.studentNote}
                    </p>
                  </div>
                )}
                {pattern.confirmedBy && (
                  <div>
                    <TagPill
                      variant="key"
                      label={`Validated · ${staffName(pattern.confirmedBy)}`}
                    />
                  </div>
                )}
              </div>
            )
          })}
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
          <ol className="flex flex-col gap-2 text-sm">
            {book.parentPrompts.map((prompt, index) => (
              <li key={index} className="flex gap-2">
                <span className="tabular-nums text-muted-foreground">
                  {index + 1}.
                </span>
                <span>{prompt}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold">Results</h2>
          <p className="text-muted-foreground text-xs">
            Appendix — the official record
          </p>
        </div>
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
    </div>
  )
}
