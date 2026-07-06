import { useMemo, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Clock,
  Columns2,
  Download,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import type { FormQuestion, FormRecipient, ResponseType } from '@/types/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormResponseTableProps {
  recipients: Array<FormRecipient>
  formTitle: string
  responseType?: ResponseType
  questions: Array<FormQuestion>
}

type BaseColumnKey =
  | 'indexNo'
  | 'respondedAt'
  | 'readBy'
  | 'pgStatus'
  | 'formResponse'
type ColumnKey = BaseColumnKey | `q${number}`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function exportCSV(
  rows: Array<FormRecipient>,
  title: string,
  responseType: ResponseType | undefined,
  questions: Array<FormQuestion>,
) {
  const headers = [
    'Student',
    'Index No.',
    'Class',
    'PG Status',
    'Response Status',
    'Responded At',
    'Parent / Guardian',
    'Relationship',
    'Contact',
    ...(responseType === 'yes-no' ? ['Response (Yes/No)'] : []),
    ...questions.map((q, i) => `Q${i + 1}: ${q.text}`),
  ]
  const data = rows.map((r) => [
    r.studentName,
    r.indexNo ?? '',
    r.classLabel,
    r.pgStatus === 'onboarded' ? 'Onboarded' : 'Not Onboarded',
    r.responseStatus === 'responded' ? 'Responded' : 'Pending',
    r.respondedAt ? formatDate(r.respondedAt) : '',
    r.parentName,
    r.parentRelationship ?? '',
    r.parentContact ?? '',
    ...(responseType === 'yes-no' ? [r.formResponse ?? ''] : []),
    ...questions.map((_, i) => r.questionAnswers?.[i] ?? ''),
  ])
  const csv = [headers, ...data]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-responses.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormResponseTable({
  recipients,
  formTitle,
  responseType,
  questions,
}: FormResponseTableProps) {
  // Filter state
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'responded' | 'pending'
  >('all')
  const [pgFilter, setPgFilter] = useState<
    'all' | 'onboarded' | 'not_onboarded'
  >('all')

  // Column visibility
  const defaultCols: Set<ColumnKey> = new Set([
    'indexNo',
    'respondedAt',
    'readBy',
    'pgStatus',
    ...(responseType === 'yes-no'
      ? (['formResponse'] as Array<ColumnKey>)
      : []),
    ...questions.map((_, i) => `q${i}` as ColumnKey),
  ])
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(defaultCols)

  const uniqueClasses = useMemo(
    () => [...new Set(recipients.map((r) => r.classLabel))].sort(),
    [recipients],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return [...recipients]
      .filter((r) => {
        if (
          q &&
          !r.studentName.toLowerCase().includes(q) &&
          !r.parentName.toLowerCase().includes(q) &&
          !r.classLabel.toLowerCase().includes(q)
        )
          return false
        if (classFilter !== 'all' && r.classLabel !== classFilter) return false
        if (statusFilter !== 'all' && r.responseStatus !== statusFilter)
          return false
        if (pgFilter !== 'all' && r.pgStatus !== pgFilter) return false
        return true
      })
      .sort((a, b) => {
        // Pending first, then alphabetical
        if (a.responseStatus !== b.responseStatus)
          return a.responseStatus === 'pending' ? -1 : 1
        return a.studentName.localeCompare(b.studentName)
      })
  }, [recipients, search, classFilter, statusFilter, pgFilter])

  function toggleCol(col: ColumnKey) {
    setVisibleCols((prev) => {
      const next = new Set(prev)
      if (next.has(col)) next.delete(col)
      else next.add(col)
      return next
    })
  }

  function show(col: ColumnKey) {
    return visibleCols.has(col)
  }

  const activeFilterCount = [
    classFilter !== 'all',
    statusFilter !== 'all',
    pgFilter !== 'all',
  ].filter(Boolean).length

  function resetFilters() {
    setClassFilter('all')
    setStatusFilter('all')
    setPgFilter('all')
  }

  const baseColumnLabels: Record<BaseColumnKey, string> = {
    indexNo: 'Index No.',
    respondedAt: 'Responded At',
    readBy: 'Parent / Guardian',
    pgStatus: 'PG Status',
    formResponse: 'Response (Yes/No)',
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search student or parent…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-1.5',
                  activeFilterCount > 0 && 'border-twblue-9 text-twblue-9',
                )}
              />
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-twblue-9 text-[10px] font-semibold text-twblue-1">
                {activeFilterCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-52 p-0">
            <div className="px-3 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filters
              </p>
            </div>

            {/* Class */}
            <div className="p-3">
              <p className="mb-2 text-xs font-medium">Class</p>
              <div className="space-y-0.5">
                {(['all', ...uniqueClasses] as const).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setClassFilter(cls)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-4"
                  >
                    <span
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        classFilter === cls
                          ? 'border-twblue-9 bg-twblue-9'
                          : 'border-slate-6',
                      )}
                    >
                      {classFilter === cls && (
                        <span className="h-1.5 w-1.5 rounded-full bg-twblue-1" />
                      )}
                    </span>
                    {cls === 'all' ? 'All classes' : `Class ${cls}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Status */}
            <div className="border-t p-3">
              <p className="mb-2 text-xs font-medium">Response status</p>
              <div className="space-y-0.5">
                {(
                  [
                    ['all', 'All'],
                    ['responded', 'Responded'],
                    ['pending', 'Pending'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStatusFilter(val)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-4"
                  >
                    <span
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        statusFilter === val
                          ? 'border-twblue-9 bg-twblue-9'
                          : 'border-slate-6',
                      )}
                    >
                      {statusFilter === val && (
                        <span className="h-1.5 w-1.5 rounded-full bg-twblue-1" />
                      )}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* PG Status */}
            <div className="border-t p-3">
              <p className="mb-2 text-xs font-medium">PG status</p>
              <div className="space-y-0.5">
                {(
                  [
                    ['all', 'All'],
                    ['onboarded', 'Onboarded'],
                    ['not_onboarded', 'Not Onboarded'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPgFilter(val)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-4"
                  >
                    <span
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        pgFilter === val
                          ? 'border-twblue-9 bg-twblue-9'
                          : 'border-slate-6',
                      )}
                    >
                      {pgFilter === val && (
                        <span className="h-1.5 w-1.5 rounded-full bg-twblue-1" />
                      )}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="border-t p-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-4 hover:text-foreground"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Column visibility */}
        <Popover>
          <PopoverTrigger
            render={<Button variant="outline" size="sm" className="gap-1.5" />}
          >
            <Columns2 className="h-3.5 w-3.5" />
            Columns
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Show / hide columns
            </p>
            {(Object.keys(baseColumnLabels) as Array<BaseColumnKey>)
              .filter(
                (col) => col !== 'formResponse' || responseType === 'yes-no',
              )
              .map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleCol(col)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-4"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      show(col)
                        ? 'border-twblue-9 bg-twblue-9 text-twblue-1'
                        : 'border-input',
                    )}
                  >
                    {show(col) && <Check className="h-2.5 w-2.5" />}
                  </span>
                  {baseColumnLabels[col]}
                </button>
              ))}
            {questions.map((q, i) => (
              <button
                key={`q${i}`}
                type="button"
                onClick={() => toggleCol(`q${i}`)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-4"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    show(`q${i}`)
                      ? 'border-twblue-9 bg-twblue-9 text-twblue-1'
                      : 'border-input',
                  )}
                >
                  {show(`q${i}`) && <Check className="h-2.5 w-2.5" />}
                </span>
                <span className="truncate">
                  Q{i + 1}: {q.text}
                </span>
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            exportCSV(filtered, formTitle, responseType, questions)
          }
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          {classFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-twblue-2 px-2.5 py-0.5 text-xs font-medium text-twblue-9">
              Class {classFilter}
              <button
                type="button"
                onClick={() => setClassFilter('all')}
                className="ml-0.5 hover:text-twblue-12"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-twblue-2 px-2.5 py-0.5 text-xs font-medium text-twblue-9">
              {statusFilter === 'responded' ? 'Responded' : 'Pending'}
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="ml-0.5 hover:text-twblue-12"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {pgFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-twblue-2 px-2.5 py-0.5 text-xs font-medium text-twblue-9">
              {pgFilter === 'onboarded' ? 'Onboarded' : 'Not Onboarded'}
              <button
                type="button"
                onClick={() => setPgFilter('all')}
                className="ml-0.5 hover:text-twblue-12"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length === recipients.length
          ? `${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`
          : `${filtered.length} of ${recipients.length} recipients`}
      </p>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Student</TableHead>
              {show('indexNo') && (
                <TableHead className="w-20">Index No.</TableHead>
              )}
              <TableHead className="w-16">Class</TableHead>
              <TableHead>Response</TableHead>
              {show('respondedAt') && <TableHead>Responded At</TableHead>}
              {show('readBy') && <TableHead>Parent / Guardian</TableHead>}
              {show('pgStatus') && <TableHead>PG Status</TableHead>}
              {show('formResponse') && responseType === 'yes-no' && (
                <TableHead className="w-24">Yes / No</TableHead>
              )}
              {questions.map((q, i) =>
                show(`q${i}`) ? (
                  <TableHead
                    key={`q${i}`}
                    className="max-w-[160px] min-w-[120px]"
                  >
                    <span className="block truncate" title={q.text}>
                      Q{i + 1}: {q.text}
                    </span>
                  </TableHead>
                ) : null,
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={
                    3 +
                    [
                      show('indexNo'),
                      show('respondedAt'),
                      show('readBy'),
                      show('pgStatus'),
                      show('formResponse') && responseType === 'yes-no',
                      ...questions.map((_, i) => show(`q${i}`)),
                    ].filter(Boolean).length
                  }
                  className="h-24 text-center text-muted-foreground"
                >
                  No recipients found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell className="font-medium">{r.studentName}</TableCell>
                  {show('indexNo') && (
                    <TableCell className="text-muted-foreground">
                      {r.indexNo ?? '—'}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {r.classLabel}
                  </TableCell>
                  {/* Response status */}
                  <TableCell>
                    {r.responseStatus === 'responded' ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-lime-11">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        Responded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-11">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        Pending
                      </span>
                    )}
                  </TableCell>
                  {show('respondedAt') && (
                    <TableCell className="text-sm text-muted-foreground">
                      {r.respondedAt ? formatDate(r.respondedAt) : '—'}
                    </TableCell>
                  )}
                  {show('readBy') && (
                    <TableCell className="text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">
                          {r.parentRelationship
                            ? `${r.parentRelationship} · ${r.parentName}`
                            : r.parentName}
                        </span>
                        {r.parentContact && (
                          <span className="text-xs text-muted-foreground">
                            {r.parentContact}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {show('pgStatus') && (
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                          r.pgStatus === 'onboarded'
                            ? 'bg-twblue-2 text-twblue-9'
                            : 'bg-slate-3 text-slate-11',
                        )}
                      >
                        {r.pgStatus === 'onboarded'
                          ? 'Onboarded'
                          : 'Not Onboarded'}
                      </span>
                    </TableCell>
                  )}
                  {show('formResponse') && responseType === 'yes-no' && (
                    <TableCell>
                      {r.formResponse === 'yes' ? (
                        <span className="inline-flex items-center rounded-md bg-lime-3 px-2 py-0.5 text-xs font-semibold text-lime-11">
                          Yes
                        </span>
                      ) : r.formResponse === 'no' ? (
                        <span className="inline-flex items-center rounded-md bg-crimson-3 px-2 py-0.5 text-xs font-semibold text-crimson-11">
                          No
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                  {questions.map((_, i) =>
                    show(`q${i}`) ? (
                      <TableCell
                        key={`q${i}`}
                        className="max-w-[160px] text-sm text-muted-foreground"
                      >
                        <span className="line-clamp-2">
                          {r.questionAnswers?.[i] || '—'}
                        </span>
                      </TableCell>
                    ) : null,
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
