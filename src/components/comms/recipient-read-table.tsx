import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Columns2,
  Download,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react'
import type { PGQuestion, PGRecipient } from '@/types/pg-announcement'
import type { ResponseType } from '@/types/form'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
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

interface RecipientReadTableProps {
  recipients: Array<PGRecipient>
  announcementTitle: string
  responseType?: ResponseType
  questions?: Array<PGQuestion>
}

type ColumnKey = 'indexNo' | 'readAt' | 'readBy' | 'pgStatus'

const COLUMN_LABELS: Record<ColumnKey, string> = {
  indexNo: 'Index No.',
  readAt: 'Read at',
  readBy: 'Read by',
  pgStatus: 'PG Status',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Derive a unified "response status" string for filtering */
function getResponseStatus(r: PGRecipient, responseType: ResponseType): string {
  if (responseType === 'acknowledge') {
    return r.respondedAt ? 'acknowledged' : 'pending'
  }
  if (responseType === 'yes-no') {
    if (!r.respondedAt) return 'pending'
    return r.formResponse ?? 'pending'
  }
  // view-only
  return r.readStatus
}

/** Timestamp to show in the "Timestamp" column */
function getTimestamp(
  r: PGRecipient,
  responseType: ResponseType,
): string | undefined {
  if (responseType === 'acknowledge') return r.respondedAt ?? r.acknowledgedAt
  if (responseType === 'yes-no') return r.respondedAt
  return r.readAt
}

function exportCSV(
  rows: Array<PGRecipient>,
  title: string,
  responseType: ResponseType,
) {
  const headers = [
    'Student',
    'Index No.',
    'Class',
    'PG Status',
    responseType === 'acknowledge'
      ? 'Acknowledged'
      : responseType === 'yes-no'
        ? 'Response'
        : 'Read Status',
    'Timestamp',
    'Parent / Guardian',
    'Relationship',
    'Contact',
  ]
  const data = rows.map((r) => [
    r.studentName,
    r.indexNo ?? '',
    r.classLabel,
    r.pgStatus === 'onboarded' ? 'Onboarded' : 'Not Onboarded',
    responseType === 'acknowledge'
      ? r.respondedAt
        ? 'Acknowledged'
        : 'Pending'
      : responseType === 'yes-no'
        ? r.formResponse
          ? r.formResponse.charAt(0).toUpperCase() + r.formResponse.slice(1)
          : 'No Response'
        : r.readStatus === 'read'
          ? 'Read'
          : 'Unread',
    getTimestamp(r, responseType)
      ? formatTimestamp(getTimestamp(r, responseType)!)
      : '',
    r.parentName,
    r.parentRelationship ?? '',
    r.parentContact ?? '',
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
  a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-status.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecipientReadTable({
  recipients,
  announcementTitle,
  responseType = 'view-only',
  questions = [],
}: RecipientReadTableProps) {
  // Only show questions that are relevant to yes-no type
  const visibleQuestions = responseType === 'yes-no' ? questions : []
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pgFilter, setPgFilter] = useState<
    'all' | 'onboarded' | 'not_onboarded'
  >('all')

  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(
    new Set(['indexNo', 'readAt', 'readBy', 'pgStatus']),
  )

  // Dynamic status filter options
  const statusOptions: Array<[string, string]> =
    responseType === 'acknowledge'
      ? [
          ['all', 'All'],
          ['acknowledged', 'Acknowledged'],
          ['pending', 'Pending'],
        ]
      : responseType === 'yes-no'
        ? [
            ['all', 'All'],
            ['yes', 'Yes'],
            ['no', 'No'],
            ['pending', 'No Response'],
          ]
        : [
            ['all', 'All'],
            ['read', 'Read'],
            ['unread', 'Unread'],
          ]

  // Derived column header labels for the table
  const statusColLabel =
    responseType === 'acknowledge'
      ? 'Acknowledged'
      : responseType === 'yes-no'
        ? 'Response'
        : 'Read Status'

  const timestampColLabel =
    responseType === 'acknowledge'
      ? 'Acknowledged At'
      : responseType === 'yes-no'
        ? 'Responded At'
        : 'Read At'

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
        if (statusFilter !== 'all') {
          const rs = getResponseStatus(r, responseType)
          if (rs !== statusFilter) return false
        }
        if (pgFilter !== 'all' && r.pgStatus !== pgFilter) return false
        return true
      })
      .sort((a, b) => {
        // Pending/unread first, then alphabetical
        const aStatus = getResponseStatus(a, responseType)
        const bStatus = getResponseStatus(b, responseType)
        const aPending = aStatus === 'pending' || aStatus === 'unread'
        const bPending = bStatus === 'pending' || bStatus === 'unread'
        if (aPending !== bPending) return aPending ? -1 : 1
        return a.studentName.localeCompare(b.studentName)
      })
  }, [recipients, search, classFilter, statusFilter, pgFilter, responseType])

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

  const activeFilters = [
    classFilter !== 'all' && classFilter,
    statusFilter !== 'all' &&
      (statusOptions.find(([v]) => v === statusFilter)?.[1] ?? statusFilter),
    pgFilter !== 'all' &&
      (pgFilter === 'onboarded' ? 'Onboarded' : 'Not Onboarded'),
  ].filter(Boolean) as Array<string>

  function resetFilters() {
    setClassFilter('all')
    setStatusFilter('all')
    setPgFilter('all')
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
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
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-1.5',
                activeFilterCount > 0 && 'border-twblue-9 text-twblue-9',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-twblue-9 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
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
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-100"
                  >
                    <span
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        classFilter === cls
                          ? 'border-twblue-9 bg-twblue-9'
                          : 'border-slate-300',
                      )}
                    >
                      {classFilter === cls && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    {cls === 'all' ? 'All classes' : `Class ${cls}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="border-t p-3">
              <p className="mb-2 text-xs font-medium">{statusColLabel}</p>
              <div className="space-y-0.5">
                {statusOptions.map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStatusFilter(val)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-100"
                  >
                    <span
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        statusFilter === val
                          ? 'border-twblue-9 bg-twblue-9'
                          : 'border-slate-300',
                      )}
                    >
                      {statusFilter === val && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
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
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-100"
                  >
                    <span
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        pgFilter === val
                          ? 'border-twblue-9 bg-twblue-9'
                          : 'border-slate-300',
                      )}
                    >
                      {pgFilter === val && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
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
                  className="w-full rounded-md px-2 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Column visibility */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Columns2 className="h-3.5 w-3.5" />
              Columns
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[280px] p-0">
            {/* Quick actions */}
            <div className="flex items-center gap-2 border-b p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setVisibleCols(
                    new Set(Object.keys(COLUMN_LABELS) as Array<ColumnKey>),
                  )
                }
              >
                Show all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCols(new Set())}
              >
                Hide all
              </Button>
            </div>
            {/* Column list */}
            <ScrollArea className="max-h-[300px]">
              <div className="p-2">
                {(Object.keys(COLUMN_LABELS) as Array<ColumnKey>).map((col) => (
                  <label
                    key={col}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={show(col)}
                      onCheckedChange={() => toggleCol(col)}
                    />
                    <span className="text-sm">
                      {col === 'readAt'
                        ? timestampColLabel
                        : COLUMN_LABELS[col]}
                    </span>
                  </label>
                ))}
              </div>
            </ScrollArea>
            {/* Reset */}
            <div className="border-t p-3">
              <button
                type="button"
                onClick={() =>
                  setVisibleCols(
                    new Set(['indexNo', 'readAt', 'readBy', 'pgStatus']),
                  )
                }
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to default
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => exportCSV(filtered, announcementTitle, responseType)}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
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
              {statusOptions.find(([v]) => v === statusFilter)?.[1] ??
                statusFilter}
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
              <TableHead>{statusColLabel}</TableHead>
              {show('readAt') && <TableHead>{timestampColLabel}</TableHead>}
              {visibleQuestions.map((q) => (
                <TableHead key={q.id}>
                  <div className="w-[160px]">
                    <span className="line-clamp-2 text-xs leading-snug">
                      {q.text}
                    </span>
                  </div>
                </TableHead>
              ))}
              {show('readBy') && <TableHead>Parent / Guardian</TableHead>}
              {show('pgStatus') && <TableHead>PG Status</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={
                    4 +
                    [
                      show('indexNo'),
                      show('readAt'),
                      show('readBy'),
                      show('pgStatus'),
                    ].filter(Boolean).length +
                    visibleQuestions.length
                  }
                  className="h-24 text-center text-muted-foreground"
                >
                  No recipients found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const ts = getTimestamp(r, responseType)
                const status = getResponseStatus(r, responseType)

                return (
                  <TableRow key={r.studentId}>
                    <TableCell className="font-medium">
                      {r.studentName}
                    </TableCell>
                    {show('indexNo') && (
                      <TableCell className="text-muted-foreground">
                        {r.indexNo ?? '—'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {r.classLabel}
                      </Badge>
                    </TableCell>

                    {/* Status cell — adapts to responseType */}
                    <TableCell>
                      {responseType === 'acknowledge' ? (
                        status === 'acknowledged' ? (
                          <span className="text-sm font-medium text-green-700">
                            Acknowledged
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-foreground">
                            Pending
                          </span>
                        )
                      ) : responseType === 'yes-no' ? (
                        status === 'yes' ? (
                          <span className="text-sm font-medium text-green-700">
                            Yes
                          </span>
                        ) : status === 'no' ? (
                          <span className="text-sm font-medium text-rose-600">
                            No
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-foreground">
                            No Response
                          </span>
                        )
                      ) : r.readStatus === 'read' ? (
                        <span className="text-sm font-medium text-green-700">
                          Read
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-foreground">
                          Unread
                        </span>
                      )}
                    </TableCell>

                    {show('readAt') && (
                      <TableCell className="text-sm text-muted-foreground">
                        {ts ? formatTimestamp(ts) : '—'}
                      </TableCell>
                    )}
                    {visibleQuestions.map((q) => {
                      // Only show answer if the question applies to this recipient's response
                      const applies =
                        !q.showAfter ||
                        q.showAfter === 'both' ||
                        q.showAfter === r.formResponse
                      const answer = applies
                        ? (r.questionAnswers?.[q.id] ?? null)
                        : null
                      return (
                        <TableCell key={q.id} className="text-sm">
                          <div className="w-[160px] whitespace-normal break-words">
                            {answer ? (
                              <span className="text-foreground">{answer}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      )
                    })}
                    {show('readBy') && (
                      <TableCell className="text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={
                              status !== 'pending' && status !== 'unread'
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground'
                            }
                          >
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
                              : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {r.pgStatus === 'onboarded'
                            ? 'Onboarded'
                            : 'Not Onboarded'}
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
