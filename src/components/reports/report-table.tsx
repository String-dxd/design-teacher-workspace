import React, { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronLeft, ChevronRight, Send } from 'lucide-react'

import type {
  HolisticReport,
  ParentStatus,
  ReviewStatus,
  SchoolLevel,
  StudentStatus,
} from '@/types/report'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'

interface ReportTableProps {
  reports: Array<HolisticReport>
  className?: string
  pageSize?: number
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  schoolLevel?: SchoolLevel
  groupBy?: 'none' | 'student' | 'term'
  onQuickSendStudent?: (id: string) => void
  onQuickSendParent?: (id: string) => void
}

function getReviewStatusBadge(status: ReviewStatus) {
  const config = {
    pending: {
      label: 'Pending',
      className: 'bg-muted text-muted-foreground hover:bg-muted',
    },
    in_review: {
      label: 'In Review',
      className: 'bg-amber-3 text-amber-11 hover:bg-amber-3',
    },
    approved: {
      label: 'Approved',
      className: 'bg-lime-3 text-lime-11 hover:bg-lime-3',
    },
  }
  const { label, className } = config[status]
  return <Badge className={className}>{label}</Badge>
}

function getParentStatusBadge(status: ParentStatus) {
  const config = {
    not_sent: {
      label: 'Not Sent',
      className: 'bg-muted text-muted-foreground hover:bg-muted',
    },
    sent: {
      label: 'Sent',
      className: 'bg-twblue-3 text-twblue-11 hover:bg-twblue-3',
    },
    viewed: {
      label: 'Viewed',
      className: 'bg-lime-3 text-lime-11 hover:bg-lime-3',
    },
    acknowledged: {
      label: 'Acknowledged',
      className: 'bg-twblue-3 text-twblue-11 hover:bg-twblue-3',
    },
  }
  const { label, className } = config[status]
  return <Badge className={className}>{label}</Badge>
}

function getStudentStatusBadge(status: StudentStatus) {
  const config = {
    not_sent: {
      label: 'Not Sent',
      className: 'bg-muted text-muted-foreground hover:bg-muted',
    },
    sent: {
      label: 'Sent',
      className: 'bg-twblue-3 text-twblue-11 hover:bg-twblue-3',
    },
    viewed: {
      label: 'Viewed',
      className: 'bg-lime-3 text-lime-11 hover:bg-lime-3',
    },
    acknowledged: {
      label: 'Acknowledged',
      className: 'bg-twblue-3 text-twblue-11 hover:bg-twblue-3',
    },
    sent_to_parents: {
      label: 'Sent to Parents',
      className: 'bg-violet-3 text-violet-11 hover:bg-violet-3',
    },
  }
  const { label, className } = config[status]
  return <Badge className={className}>{label}</Badge>
}

function ReportRow({
  report,
  isSecondary,
  isSelected,
  onSelect,
  onNavigate,
  onQuickSendStudent,
  onQuickSendParent,
}: {
  report: HolisticReport
  isSecondary: boolean
  isSelected: boolean
  onSelect: (id: string, e: React.MouseEvent) => void
  onNavigate: () => void
  onQuickSendStudent?: (id: string) => void
  onQuickSendParent?: (id: string) => void
}) {
  return (
    <TableRow
      className="group cursor-pointer hover:bg-transparent [&>td]:transition-colors [&>td]:group-hover:bg-muted/50"
      onClick={onNavigate}
      data-selected={isSelected || undefined}
    >
      <TableCell
        className="sticky left-0 z-10 bg-card pl-6 group-hover:bg-muted/50 group-data-[selected]:bg-muted"
        onClick={(e) => onSelect(report.id, e)}
      >
        <Checkbox
          checked={isSelected}
          aria-label={`Select report for ${report.studentName}`}
        />
      </TableCell>
      <TableCell className="sticky left-12 z-10 bg-card font-medium shadow-[2px_0_5px_-2px_color-mix(in_srgb,var(--color-slate-12)_10%,transparent)] group-hover:bg-muted/50 group-data-[selected]:bg-muted">
        {report.studentName}
      </TableCell>
      <TableCell>{report.studentClass}</TableCell>
      <TableCell>
        <Badge variant="outline">{report.term}</Badge>
      </TableCell>
      <TableCell>{getReviewStatusBadge(report.reviewStatus)}</TableCell>
      {isSecondary && (
        <TableCell>
          <div className="flex items-center gap-1.5">
            {getStudentStatusBadge(report.studentStatus)}
            {report.studentStatus === 'not_sent' && onQuickSendStudent && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onQuickSendStudent(report.id)
                      }}
                      aria-label={`Send report to ${report.studentName}`}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  }
                />
                <TooltipContent>Send to student</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
      )}
      <TableCell className="pr-6">
        <div className="flex items-center gap-1.5">
          {getParentStatusBadge(report.parentStatus)}
          {report.parentStatus === 'not_sent' && onQuickSendParent && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      onQuickSendParent(report.id)
                    }}
                    aria-label={`Send report to ${report.studentName}'s parents`}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                }
              />
              <TooltipContent>Send to parents</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function ReportTable({
  reports,
  className,
  pageSize = 20,
  selectedIds,
  onSelectionChange,
  schoolLevel = 'secondary',
  groupBy = 'none',
  onQuickSendStudent,
  onQuickSendParent,
}: ReportTableProps) {
  const navigate = useNavigate()
  const isSecondary = schoolLevel === 'secondary'

  // Build all groups from the full report list (before pagination)
  const allGroups = useMemo(() => {
    if (groupBy === 'none') return null
    const groups: Array<{ name: string; reports: Array<HolisticReport> }> = []
    const groupMap = new Map<string, Array<HolisticReport>>()
    for (const report of reports) {
      const key = groupBy === 'student' ? report.studentName : report.term
      let group = groupMap.get(key)
      if (!group) {
        group = []
        groupMap.set(key, group)
        groups.push({ name: key, reports: group })
      }
      group.push(report)
    }
    return groups
  }, [reports, groupBy])

  // Group-aware pagination: pack complete groups into pages
  const groupPages = useMemo(() => {
    if (!allGroups) return null
    const pages: Array<
      Array<{ name: string; reports: Array<HolisticReport> }>
    > = []
    let currentPageGroups: Array<{
      name: string
      reports: Array<HolisticReport>
    }> = []
    let currentPageSize = 0

    for (const group of allGroups) {
      // If adding this group would exceed pageSize and we already have groups on this page, start a new page
      if (
        currentPageSize > 0 &&
        currentPageSize + group.reports.length > pageSize
      ) {
        pages.push(currentPageGroups)
        currentPageGroups = []
        currentPageSize = 0
      }
      currentPageGroups.push(group)
      currentPageSize += group.reports.length
    }
    if (currentPageGroups.length > 0) {
      pages.push(currentPageGroups)
    }
    return pages
  }, [allGroups, pageSize])

  // Flat pagination (ungrouped)
  const flatPagination = usePagination({
    totalItems: groupBy === 'none' ? reports.length : 0,
    pageSize,
  })

  // Group pagination state
  const [groupPage, setGroupPage] = useState(1)
  const groupTotalPages = groupPages?.length ?? 0

  // Reset group page when groups change
  const groupPagesRef = React.useRef(groupPages)
  if (groupPagesRef.current !== groupPages) {
    groupPagesRef.current = groupPages
    if (groupPage > (groupPages?.length ?? 1)) {
      setGroupPage(1)
    }
  }

  const groupPageNumbers = useMemo(() => {
    const pages: Array<number | 'ellipsis'> = []
    const maxVisible = 5
    if (groupTotalPages <= maxVisible) {
      for (let i = 1; i <= groupTotalPages; i++) pages.push(i)
    } else if (groupPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push('ellipsis')
      pages.push(groupTotalPages)
    } else if (groupPage >= groupTotalPages - 2) {
      pages.push(1)
      pages.push('ellipsis')
      for (let i = groupTotalPages - 3; i <= groupTotalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('ellipsis')
      pages.push(groupPage - 1)
      pages.push(groupPage)
      pages.push(groupPage + 1)
      pages.push('ellipsis')
      pages.push(groupTotalPages)
    }
    return pages
  }, [groupTotalPages, groupPage])

  // Determine what's visible on the current page
  const visibleReports = useMemo(() => {
    if (groupPages && groupPages.length > 0) {
      const pageIdx = Math.min(groupPage - 1, groupPages.length - 1)
      return groupPages[pageIdx].flatMap((g) => g.reports)
    }
    return reports.slice(
      flatPagination.startIndex,
      flatPagination.startIndex + pageSize,
    )
  }, [groupPages, groupPage, reports, flatPagination.startIndex, pageSize])

  const visibleGroups = useMemo(() => {
    if (!groupPages || groupPages.length === 0) return null
    const pageIdx = Math.min(groupPage - 1, groupPages.length - 1)
    return groupPages[pageIdx]
  }, [groupPages, groupPage])

  const visibleIds = useMemo(() => {
    return new Set(visibleReports.map((r) => r.id))
  }, [visibleReports])

  const allPageSelected =
    visibleReports.length > 0 &&
    visibleReports.every((r) => selectedIds.has(r.id))

  const somePageSelected =
    visibleReports.some((r) => selectedIds.has(r.id)) && !allPageSelected

  const handleSelectAll = () => {
    if (allPageSelected) {
      const newSelection = new Set(selectedIds)
      for (const id of visibleIds) {
        newSelection.delete(id)
      }
      onSelectionChange(newSelection)
    } else {
      const newSelection = new Set(selectedIds)
      for (const id of visibleIds) {
        newSelection.add(id)
      }
      onSelectionChange(newSelection)
    }
  }

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    onSelectionChange(newSelection)
  }

  const colSpan = isSecondary ? 7 : 6

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  // Unified pagination values
  const isGrouped = groupBy !== 'none'
  const currentPage = isGrouped ? groupPage : flatPagination.currentPage
  const totalPages = isGrouped ? groupTotalPages : flatPagination.totalPages
  const pageNumbers = isGrouped ? groupPageNumbers : flatPagination.pageNumbers
  const canGoPrevious = isGrouped ? groupPage > 1 : flatPagination.canGoPrevious
  const canGoNext = isGrouped
    ? groupPage < groupTotalPages
    : flatPagination.canGoNext
  const goToPage = isGrouped
    ? (p: number) => setGroupPage(Math.max(1, Math.min(p, groupTotalPages)))
    : flatPagination.goToPage
  const goToPreviousPage = isGrouped
    ? () => setGroupPage((p) => Math.max(1, p - 1))
    : flatPagination.goToPreviousPage
  const goToNextPage = isGrouped
    ? () => setGroupPage((p) => Math.min(groupTotalPages, p + 1))
    : flatPagination.goToNextPage

  return (
    <div className={cn('max-w-full overflow-x-auto bg-card', className)}>
      <Table>
        <TableHeader className="border-b bg-card">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="sticky left-0 z-10 w-12 min-w-12 bg-card pl-6">
              <Checkbox
                checked={allPageSelected}
                indeterminate={somePageSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all reports on this page"
              />
            </TableHead>
            <TableHead className="sticky left-12 z-10 min-w-[150px] bg-card shadow-[2px_0_5px_-2px_color-mix(in_srgb,var(--color-slate-12)_10%,transparent)]">
              Name
            </TableHead>
            <TableHead className="min-w-[90px]">Class</TableHead>
            <TableHead className="min-w-[90px]">Term</TableHead>
            <TableHead className="min-w-[120px]">Review Status</TableHead>
            {isSecondary && (
              <TableHead className="min-w-[130px]">
                Student View Status
              </TableHead>
            )}
            <TableHead className="min-w-[120px] pr-6">
              Parent View Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleReports.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="h-48">
                <EmptyState
                  title="No reports found"
                  description="Try adjusting your filters or search query."
                />
              </TableCell>
            </TableRow>
          ) : visibleGroups ? (
            visibleGroups.map(({ name: groupName, reports: groupReports }) => {
              const isCollapsed = collapsedGroups.has(groupName)
              return (
                <React.Fragment key={groupName}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/70"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <TableCell
                      colSpan={colSpan}
                      className="bg-muted/50 py-2 pl-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-200',
                            isCollapsed && '-rotate-90',
                          )}
                        />
                        {groupName}
                        <span className="font-normal">
                          ({groupReports.length})
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {!isCollapsed &&
                    groupReports.map((report) => (
                      <ReportRow
                        key={report.id}
                        report={report}
                        isSecondary={isSecondary}
                        isSelected={selectedIds.has(report.id)}
                        onSelect={handleSelectRow}
                        onNavigate={() =>
                          navigate({
                            to: '/reports/$id',
                            params: { id: report.id },
                          })
                        }
                        onQuickSendStudent={onQuickSendStudent}
                        onQuickSendParent={onQuickSendParent}
                      />
                    ))}
                </React.Fragment>
              )
            })
          ) : (
            visibleReports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                isSecondary={isSecondary}
                isSelected={selectedIds.has(report.id)}
                onSelect={handleSelectRow}
                onNavigate={() =>
                  navigate({
                    to: '/reports/$id',
                    params: { id: report.id },
                  })
                }
                onQuickSendStudent={onQuickSendStudent}
                onQuickSendParent={onQuickSendParent}
              />
            ))
          )}
        </TableBody>
      </Table>

      {/* Record count and Pagination */}
      <div className="flex shrink-0 items-center justify-between px-6 py-4">
        <div className="text-sm text-muted-foreground">
          {reports.length} reports
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousPage}
              disabled={!canGoPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {pageNumbers.map((page, index) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-muted-foreground"
                  aria-hidden="true"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? 'outline' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </Button>
              ),
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={!canGoNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
