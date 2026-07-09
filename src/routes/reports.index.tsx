import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ClipboardCheck,
  Columns3,
  FileText,
  ListFilter,
  Search,
  Send,
  Settings2,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  HolisticReport,
  ParentStatus,
  ReviewStatus,
  SchoolLevel,
  StudentStatus,
  Term,
} from '@/types/report'
import { TermSelector } from '@/components/reports/term-selector'
import { ReportTable } from '@/components/reports/report-table'
import {
  CycleStudentTable,
  statusFor,
} from '@/components/reports/cycle-student-table'
import { ClassSelector } from '@/components/students/class-selector'
import { EmptyState } from '@/components/empty-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select'
import { CURRENT_ACADEMIC_YEAR, mockReports } from '@/data/mock-reports'
import { getSchoolLevel, mockStudents } from '@/data/mock-students'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { hasAllResults } from '@/data/mock-cockpit-submissions'
import {
  NEVER_ACK_STUDENT_IDS,
  P1_LEVEL_SCOPE,
  REPORT_LEVELS,
  getReportRoster,
  getSiblingState,
} from '@/data/mock-report-classes'
import { loadCycle, patchStudent } from '@/lib/hdp-cycle-store'
import { commitCycleReport } from '@/lib/hdp-report-commit'
import { saveShareMessage } from '@/lib/hdp-template-store'

type GroupBy = 'none' | 'student' | 'term'

interface ReportsSearchParams {
  studentId?: string
  classId?: string
  term?: Term
  groupBy?: GroupBy
}

export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
  validateSearch: (search: Record<string, unknown>): ReportsSearchParams => {
    return {
      studentId: search.studentId as string | undefined,
      classId: search.classId as string | undefined,
      term: search.term as Term | undefined,
      groupBy: search.groupBy as GroupBy | undefined,
    }
  },
})

function ReportsPage() {
  const {
    studentId: initialStudentId,
    classId: initialClassId,
    term: initialTerm,
    groupBy: initialGroupBy,
  } = Route.useSearch()
  // Default landing: the P1 cycle hub (P1-A) unless the URL names a class.
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>(
    initialClassId == null || initialClassId.startsWith('P')
      ? 'primary'
      : 'secondary',
  )
  const [selectedClass, setSelectedClass] = useState(initialClassId ?? 'P1-A')
  const [selectedTerm, setSelectedTerm] = useState<Term | ''>(initialTerm || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<
    ReviewStatus | ''
  >('')
  const [selectedParentStatus, setSelectedParentStatus] = useState<
    ParentStatus | ''
  >('')
  const [selectedStudentStatus, setSelectedStudentStatus] = useState<
    StudentStatus | ''
  >('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroupBy || 'student')
  const [reports, setReports] = useState<Array<HolisticReport>>(
    () => mockReports,
  )

  useSetBreadcrumbs([{ label: 'Reports', href: '/reports' }])

  const builderEnabled = useFeatureFlag('hdp-reports')

  // Cycle hub scope: any specific primary class (P1–P6) or the P1 level view,
  // with the flag on. Secondary keeps the legacy table (its grade-based
  // reports use a different document); 'all' also falls through to the table.
  const isPrimaryClass = /^P\d/.test(selectedClass)
  const showCycleHub =
    builderEnabled && (isPrimaryClass || selectedClass === P1_LEVEL_SCOPE)

  // Filter by school level first
  const levelFilteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.academicYear !== CURRENT_ACADEMIC_YEAR) return false
      if (initialStudentId && report.studentId !== initialStudentId)
        return false
      if (selectedTerm && report.term !== selectedTerm) return false
      return getSchoolLevel(report.studentClass) === schoolLevel
    })
  }, [reports, initialStudentId, selectedTerm, schoolLevel])

  // Filter by class/level
  const classFilteredReports = useMemo(() => {
    if (selectedClass === 'all') {
      return levelFilteredReports
    }

    if (
      selectedClass.startsWith('Secondary') ||
      selectedClass.startsWith('Primary')
    ) {
      const levelPart = selectedClass.replace(/^(Secondary|Primary)\s*/, '')
      if (schoolLevel === 'primary') {
        return levelFilteredReports.filter((r) =>
          r.studentClass.startsWith(`P${levelPart}`),
        )
      }
      return levelFilteredReports.filter((r) =>
        r.studentClass.startsWith(levelPart),
      )
    }

    return levelFilteredReports.filter((r) => r.studentClass === selectedClass)
  }, [levelFilteredReports, selectedClass, schoolLevel])

  // Filter by search query
  const searchFilteredReports = useMemo(() => {
    if (!searchQuery) {
      return classFilteredReports
    }

    const query = searchQuery.toLowerCase()
    return classFilteredReports.filter((r) =>
      r.studentName.toLowerCase().includes(query),
    )
  }, [classFilteredReports, searchQuery])

  // Filter by status
  const filteredReports = useMemo(() => {
    return searchFilteredReports.filter((r) => {
      if (selectedReviewStatus && r.reviewStatus !== selectedReviewStatus) {
        return false
      }
      if (selectedParentStatus && r.parentStatus !== selectedParentStatus) {
        return false
      }
      if (selectedStudentStatus && r.studentStatus !== selectedStudentStatus) {
        return false
      }
      return true
    })
  }, [
    searchFilteredReports,
    selectedReviewStatus,
    selectedParentStatus,
    selectedStudentStatus,
  ])

  // Metrics
  const metrics = useMemo(() => {
    const totalReports = filteredReports.length
    const uniqueStudents = new Set(filteredReports.map((r) => r.studentId)).size
    const pendingReview = filteredReports.filter(
      (r) => r.reviewStatus === 'pending',
    ).length
    const notSentCount = filteredReports.filter(
      (r) => r.parentStatus === 'not_sent',
    ).length

    return { totalReports, uniqueStudents, pendingReview, notSentCount }
  }, [filteredReports])

  const reviewableCount = useMemo(() => {
    return reports.filter(
      (r) => selectedIds.has(r.id) && r.reviewStatus === 'pending',
    ).length
  }, [reports, selectedIds])

  const handleSend = () => {
    if (schoolLevel === 'secondary') {
      setReports((prev) =>
        prev.map((report) =>
          selectedIds.has(report.id) && report.studentStatus === 'not_sent'
            ? { ...report, studentStatus: 'sent' as const }
            : report,
        ),
      )
    } else {
      setReports((prev) =>
        prev.map((report) =>
          selectedIds.has(report.id) && report.parentStatus === 'not_sent'
            ? { ...report, parentStatus: 'sent' as const }
            : report,
        ),
      )
    }
    setSelectedIds(new Set())
  }

  const handleRequestReview = () => {
    setReports((prev) =>
      prev.map((report) =>
        selectedIds.has(report.id) && report.reviewStatus === 'pending'
          ? { ...report, reviewStatus: 'in_review' as const }
          : report,
      ),
    )
    setSelectedIds(new Set())
  }

  const handleQuickSendStudent = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id && r.studentStatus === 'not_sent'
          ? { ...r, studentStatus: 'sent' as const }
          : r,
      ),
    )
    toast.success('Report sent to student')
  }, [])

  const handleQuickSendParent = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id && r.parentStatus === 'not_sent'
          ? { ...r, parentStatus: 'sent' as const }
          : r,
      ),
    )
    toast.success('Report sent to parents')
  }, [])

  const handleBulkSendParentsPg = () => {
    setReports((prev) =>
      prev.map((report) =>
        selectedIds.has(report.id) && report.parentStatus === 'not_sent'
          ? { ...report, parentStatus: 'sent' as const }
          : report,
      ),
    )
    setSelectedIds(new Set())
  }

  const pgSendableCount = useMemo(() => {
    return reports.filter(
      (r) => selectedIds.has(r.id) && r.parentStatus === 'not_sent',
    ).length
  }, [reports, selectedIds])

  // The class selector no longer carries a Primary/Secondary toggle — derive the
  // level from the picked class so the page's primary/secondary branch follows it.
  // 'all' keeps the current level (it means "all classes in this level").
  const handleClassChange = (nextClass: string) => {
    setSelectedClass(nextClass)
    setSelectedIds(new Set())
    if (nextClass === 'all') return
    const nextLevel: SchoolLevel =
      nextClass.startsWith('P') ||
      nextClass.startsWith('Primary') ||
      nextClass === P1_LEVEL_SCOPE
        ? 'primary'
        : 'secondary'
    if (nextLevel !== schoolLevel) {
      setSchoolLevel(nextLevel)
      setSelectedStudentStatus('')
    }
  }

  const activeFilterCount = [
    selectedTerm,
    selectedReviewStatus,
    selectedParentStatus,
    schoolLevel === 'secondary' ? selectedStudentStatus : '',
  ].filter(Boolean).length

  const sendLabel =
    schoolLevel === 'secondary' ? 'Send to Students' : 'Send to Parents'

  return (
    <div className="flex flex-col">
      {/* Fixed content area */}
      <div className="shrink-0 space-y-6 pt-6">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 px-6">
          <div>
            <h1 className="text-2xl font-semibold">
              Holistic Development Reports
            </h1>
            <p className="text-muted-foreground">
              View student progress across academic and character development
            </p>
          </div>
        </div>
      </div>

      {showCycleHub ? (
        <CycleHub classId={selectedClass} onClassChange={handleClassChange} />
      ) : (
        <>
          {/* Class Selector */}
          <div className="px-6 pb-6">
            <ClassSelector
              value={selectedClass}
              onValueChange={handleClassChange}
            />
          </div>
          <LegacyReportsView
            metrics={metrics}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilterCount={activeFilterCount}
            selectedTerm={selectedTerm}
            setSelectedTerm={setSelectedTerm}
            selectedReviewStatus={selectedReviewStatus}
            setSelectedReviewStatus={setSelectedReviewStatus}
            selectedParentStatus={selectedParentStatus}
            setSelectedParentStatus={setSelectedParentStatus}
            schoolLevel={schoolLevel}
            selectedStudentStatus={selectedStudentStatus}
            setSelectedStudentStatus={setSelectedStudentStatus}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            filteredReports={filteredReports}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onQuickSendStudent={handleQuickSendStudent}
            onQuickSendParent={handleQuickSendParent}
            sendLabel={sendLabel}
            handleSend={handleSend}
            pgSendableCount={pgSendableCount}
            handleBulkSendParentsPg={handleBulkSendParentsPg}
            reviewableCount={reviewableCount}
            handleRequestReview={handleRequestReview}
          />
        </>
      )}
    </div>
  )
}

// ── Legacy view: secondary + P3–P6 primary + flag off. Unchanged behaviour. ──

interface LegacyReportsViewProps {
  metrics: {
    totalReports: number
    uniqueStudents: number
    pendingReview: number
    notSentCount: number
  }
  searchQuery: string
  setSearchQuery: (v: string) => void
  activeFilterCount: number
  selectedTerm: Term | ''
  setSelectedTerm: (v: Term | '') => void
  selectedReviewStatus: ReviewStatus | ''
  setSelectedReviewStatus: (v: ReviewStatus | '') => void
  selectedParentStatus: ParentStatus | ''
  setSelectedParentStatus: (v: ParentStatus | '') => void
  schoolLevel: SchoolLevel
  selectedStudentStatus: StudentStatus | ''
  setSelectedStudentStatus: (v: StudentStatus | '') => void
  groupBy: GroupBy
  setGroupBy: (v: GroupBy) => void
  filteredReports: Array<HolisticReport>
  selectedIds: Set<string>
  setSelectedIds: (v: Set<string>) => void
  onQuickSendStudent: (id: string) => void
  onQuickSendParent: (id: string) => void
  sendLabel: string
  handleSend: () => void
  pgSendableCount: number
  handleBulkSendParentsPg: () => void
  reviewableCount: number
  handleRequestReview: () => void
}

function LegacyReportsView({
  metrics,
  searchQuery,
  setSearchQuery,
  activeFilterCount,
  selectedTerm,
  setSelectedTerm,
  selectedReviewStatus,
  setSelectedReviewStatus,
  selectedParentStatus,
  setSelectedParentStatus,
  schoolLevel,
  selectedStudentStatus,
  setSelectedStudentStatus,
  groupBy,
  setGroupBy,
  filteredReports,
  selectedIds,
  setSelectedIds,
  onQuickSendStudent,
  onQuickSendParent,
  sendLabel,
  handleSend,
  pgSendableCount,
  handleBulkSendParentsPg,
  reviewableCount,
  handleRequestReview,
}: LegacyReportsViewProps) {
  return (
    <>
      <div className="shrink-0 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Reports</div>
            <div className="text-2xl font-semibold">{metrics.totalReports}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Students</div>
            <div className="text-2xl font-semibold">
              {metrics.uniqueStudents}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Pending Review</div>
            <div className="text-2xl font-semibold">
              {metrics.pendingReview}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Not Sent</div>
            <div className="text-2xl font-semibold">{metrics.notSentCount}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 pb-4">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 md:w-[200px]"
              aria-label="Search students"
            />
          </div>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-9 px-1.5 text-xs font-medium text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <PopoverContent align="start" className="w-80 gap-3">
              <div className="space-y-1">
                <Label>Term</Label>
                <TermSelector
                  value={selectedTerm}
                  onValueChange={setSelectedTerm}
                />
              </div>
              <div className="space-y-1">
                <Label>Review status</Label>
                <Select
                  value={selectedReviewStatus || 'all'}
                  onValueChange={(val) =>
                    setSelectedReviewStatus(
                      val === 'all' ? '' : (val as ReviewStatus),
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    {selectedReviewStatus
                      ? {
                          pending: 'Pending',
                          in_review: 'In Review',
                          approved: 'Approved',
                        }[selectedReviewStatus]
                      : 'All review'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All review</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Parent view status</Label>
                <Select
                  value={selectedParentStatus || 'all'}
                  onValueChange={(val) =>
                    setSelectedParentStatus(
                      val === 'all' ? '' : (val as ParentStatus),
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    {selectedParentStatus
                      ? {
                          not_sent: 'Not Sent',
                          sent: 'Sent',
                          viewed: 'Viewed',
                          acknowledged: 'Acknowledged',
                        }[selectedParentStatus]
                      : 'All status'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="not_sent">Not Sent</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {schoolLevel === 'secondary' && (
                <div className="space-y-1">
                  <Label>Student view status</Label>
                  <Select
                    value={selectedStudentStatus || 'all'}
                    onValueChange={(val) =>
                      setSelectedStudentStatus(
                        val === 'all' ? '' : (val as StudentStatus),
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      {selectedStudentStatus
                        ? {
                            not_sent: 'Not Sent',
                            sent: 'Sent',
                            viewed: 'Viewed',
                            acknowledged: 'Acknowledged',
                            sent_to_parents: 'Sent to Parents',
                          }[selectedStudentStatus]
                        : 'All student'}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All student</SelectItem>
                      <SelectItem value="not_sent">Not Sent</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="sent_to_parents">
                        Sent to Parents
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline">
                  <Columns3 className="mr-2 h-4 w-4" />
                  Views
                </Button>
              }
            />
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Group by</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={groupBy}
                  onValueChange={(val) => setGroupBy(val as GroupBy)}
                >
                  <DropdownMenuRadioItem value="none">
                    None
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="student">
                    Student name
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="term">
                    Term
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Report Table */}
      <ReportTable
        reports={filteredReports}
        pageSize={20}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        schoolLevel={schoolLevel}
        groupBy={groupBy}
        onQuickSendStudent={onQuickSendStudent}
        onQuickSendParent={onQuickSendParent}
      />

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border bg-card px-5 py-2.5 shadow-lg">
            <span className="text-sm font-medium text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button size="sm" variant="outline" className="rounded-full">
                    <Send className="mr-2 h-4 w-4" />
                    {sendLabel}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{sendLabel}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Send {selectedIds.size} report
                    {selectedIds.size !== 1 ? 's' : ''} to{' '}
                    {schoolLevel === 'secondary' ? 'students' : 'parents'}?{' '}
                    {schoolLevel === 'secondary'
                      ? 'Students will be notified via email.'
                      : 'Parents will be notified and can view these reports.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSend}>
                    Send
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button size="sm" variant="outline" className="rounded-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send to Parents via PG
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send to Parents via PG</AlertDialogTitle>
                  <AlertDialogDescription>
                    Send {pgSendableCount} report
                    {pgSendableCount !== 1 ? 's' : ''} to parents via Parents
                    Gateway? Parents will be notified via PG.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkSendParentsPg}>
                    Send
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button size="sm" variant="outline" className="rounded-full">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Request Review
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Request Review</AlertDialogTitle>
                  <AlertDialogDescription>
                    Request review for {reviewableCount} report
                    {reviewableCount !== 1 ? 's' : ''}? These reports will be
                    sent for approval.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRequestReview}>
                    Request
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </>
  )
}

// ── Cycle hub: P1–P2 + flag on. Reporting-cycle for "~30 reports due this week". ──

function CycleHub({
  classId,
  onClassChange,
}: {
  classId: string
  onClassChange: (classId: string) => void
}) {
  const navigate = useNavigate()
  const [term, setTerm] = useState<Term>('Term 2')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'loading'>('idle')
  // Per-row "Send to parents" pending confirmation (student id).
  const [rowSendId, setRowSendId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  // Bump this to force re-reads from localStorage after a mutation.
  const [refreshKey, setRefreshKey] = useState(0)

  // Scope: a class id or the whole-of-P1 level view. The teacher is P1-A's
  // form teacher, so interactive pieces (layout, share, review, ack) always
  // act on P1-A; sibling P1 classes are display-only seeded states.
  const levelScope = classId === P1_LEVEL_SCOPE
  const cycleClassId = levelScope ? 'P1-A' : classId
  // P1 classes show the six-state pipeline (results gate + leader review);
  // other primary classes keep the original hub until the design is proven.
  const pipeline = levelScope || classId.startsWith('P1')
  // Only the teacher's own class has a real cycle behind its pipeline.
  const ownCycleClass = cycleClassId === 'P1-A'

  const roster = useMemo(() => getReportRoster(classId), [classId])

  const classStudents = useMemo(
    () => mockStudents.filter((s) => s.class === cycleClassId),
    [cycleClassId],
  )

  // refreshKey is a deliberate extra dependency: it forces a re-read from
  // localStorage after a mutation (loadCycle itself doesn't change identity).
  const cycle = useMemo(
    () => loadCycle(cycleClassId, term),
    [cycleClassId, term, refreshKey],
  )

  const seededStates = useMemo(() => {
    const map = new Map<
      string,
      NonNullable<ReturnType<typeof getSiblingState>>
    >()
    for (const pupil of roster) {
      const state = getSiblingState(pupil.id)
      if (state) map.set(pupil.id, state)
    }
    return map
  }, [roster])

  const summary = useMemo(() => {
    let ready = 0
    let drafts = 0
    let sent = 0
    let acked = 0
    let resultsIn = 0
    let pendingComments = 0
    let pendingReview = 0
    for (const pupil of roster) {
      const seeded = seededStates.get(pupil.id)
      const status = seeded?.status ?? statusFor(cycle, pupil.id, pipeline)
      if (status === 'ready') ready += 1
      else if (status === 'draft') drafts += 1
      if (status === 'sent') {
        sent += 1
        const acknowledged = seeded
          ? seeded.acknowledged
          : cycle?.perStudent[pupil.id]?.ackAt !== undefined
        if (acknowledged) acked += 1
      }
      const hasResults = seeded
        ? status !== 'awaiting_results'
        : hasAllResults(pupil.id)
      if (hasResults) resultsIn += 1
      if (status === 'pending_comments' || status === 'draft')
        pendingComments += 1
      if (status === 'in_review') pendingReview += 1
    }
    return {
      ready,
      drafts,
      sent,
      acked,
      resultsIn,
      pendingComments,
      pendingReview,
      total: roster.length,
    }
  }, [roster, seededStates, cycle, pipeline])

  // Reports the teacher can send to parents: leader-approved in the pipeline,
  // self-marked ready elsewhere.
  const sendableStudents = useMemo(
    () =>
      classStudents.filter(
        (s) =>
          statusFor(cycle, s.id, pipeline) ===
          (pipeline ? 'approved' : 'ready'),
      ),
    [classStudents, cycle, pipeline],
  )

  // Demo stand-in for the school leaders' side: reports submitted for review
  // get approved shortly after, so the teacher-facing flow can complete.
  useEffect(() => {
    if (!pipeline || !ownCycleClass) return
    const tick = () => {
      const current = loadCycle(cycleClassId, term)
      if (!current) return
      let approvedAny = false
      for (const [studentId, draft] of Object.entries(current.perStudent)) {
        if (
          draft.reviewStatus === 'in_review' &&
          draft.submittedAt &&
          Date.now() - new Date(draft.submittedAt).getTime() > 15_000
        ) {
          patchStudent(cycleClassId, term, studentId, {
            reviewStatus: 'approved',
          })
          approvedAny = true
        }
      }
      if (approvedAny) {
        toast.success('Report approved by school leaders')
        setRefreshKey((k) => k + 1)
      }
    }
    tick()
    const id = window.setInterval(tick, 5000)
    return () => window.clearInterval(id)
  }, [pipeline, ownCycleClass, cycleClassId, term])

  // Demo stand-in for Parents Gateway: after a report is sent, parents
  // acknowledge at staggered delays (deterministic per roster position) —
  // except the designated never-ack pupils, so the follow-up story stays
  // visible on the hub.
  useEffect(() => {
    if (!pipeline || !ownCycleClass) return
    const tick = () => {
      const current = loadCycle(cycleClassId, term)
      if (!current) return
      let ackedCount = 0
      for (const [studentId, draft] of Object.entries(current.perStudent)) {
        if (!draft.sentAt || draft.ackAt) continue
        if (NEVER_ACK_STUDENT_IDS.has(studentId)) continue
        // Stagger deterministically by roster position so the table updates
        // in visible steps rather than all at once.
        const i = classStudents.findIndex((s) => s.id === studentId)
        if (i === -1) continue
        if (
          Date.now() - new Date(draft.sentAt).getTime() >
          ((i % 3) + 1) * 8_000
        ) {
          patchStudent(cycleClassId, term, studentId, {
            ackAt: new Date().toISOString(),
          })
          ackedCount += 1
        }
      }
      if (ackedCount > 0) {
        toast.success(
          `${ackedCount} parent${ackedCount !== 1 ? 's' : ''} acknowledged the report in Parents Gateway`,
        )
        setRefreshKey((k) => k + 1)
      }
    }
    tick()
    const id = window.setInterval(tick, 5000)
    return () => window.clearInterval(id)
  }, [pipeline, ownCycleClass, cycleClassId, term, classStudents])

  if (roster.length === 0) {
    return (
      <EmptyState
        title="No students in this class"
        description="Pick a different class to start a reporting cycle."
        icon={<FileText className="text-muted-foreground size-8" />}
      />
    )
  }

  function sendReportToParents(student: (typeof classStudents)[number]) {
    if (!cycle) return
    const built = commitCycleReport(student, term, cycle)
    const hasDraft = Object.prototype.hasOwnProperty.call(
      cycle.perStudent,
      student.id,
    )
    const parentMessage = hasDraft
      ? cycle.perStudent[student.id].parentMessage
      : ''
    saveShareMessage(built.id, parentMessage)
    patchStudent(cycleClassId, term, student.id, {
      sentAt: new Date().toISOString(),
    })
  }

  function handleShareConfirm() {
    setShareState('loading')
    window.setTimeout(() => {
      if (!cycle) return
      for (const student of sendableStudents) {
        sendReportToParents(student)
      }
      setShareState('idle')
      setShareOpen(false)
      setRefreshKey((k) => k + 1)
      const message = `Shared ${sendableStudents.length} report${sendableStudents.length !== 1 ? 's' : ''} with parents`
      toast.success(message)
      setAnnouncement(message)
    }, 600)
  }

  function handleRowSendConfirm() {
    const student = classStudents.find((s) => s.id === rowSendId)
    setRowSendId(null)
    if (!student || !cycle) return
    sendReportToParents(student)
    setRefreshKey((k) => k + 1)
    const message = `${student.name}’s report sent to parents via Parents Gateway`
    toast.success(message)
    setAnnouncement(message)
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope: pinned form class, then level groups (reports hub only —
              the Students page keeps its own ClassSelector untouched). */}
          <Select value={classId} onValueChange={(v) => v && onClassChange(v)}>
            <SelectTrigger aria-label="Select class or level" className="w-56">
              {classId === 'P1-A'
                ? 'My form class · P1-A'
                : classId === P1_LEVEL_SCOPE
                  ? 'All Primary 1'
                  : classId}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P1-A">My form class · P1-A</SelectItem>
              {REPORT_LEVELS.map((group) => (
                <SelectGroup key={group.level}>
                  <SelectLabel>{group.level}</SelectLabel>
                  {group.allValue && (
                    <SelectItem value={group.allValue}>
                      All {group.level}
                    </SelectItem>
                  )}
                  {group.classes.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="cycle-term" className="sr-only">
            Term
          </Label>
          <TermSelector
            value={term}
            onValueChange={(v) => v && setTerm(v)}
            className="w-40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: '/reports/cycle/layout',
                search: { classId: cycleClassId, term },
              })
            }
          >
            <Settings2 className="mr-2 size-4" />
            {cycle ? 'Edit layout' : 'Set up layout'}
          </Button>
          <AlertDialog open={shareOpen} onOpenChange={setShareOpen}>
            <AlertDialogTrigger
              render={
                <Button disabled={!cycle || sendableStudents.length === 0}>
                  <Send className="mr-2 size-4" />
                  Share with parents ({sendableStudents.length})
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Share with parents</AlertDialogTitle>
                <AlertDialogDescription>
                  Send {sendableStudents.length}{' '}
                  {pipeline ? 'approved' : 'ready'} report
                  {sendableStudents.length !== 1 ? 's' : ''} to parents via
                  Parents Gateway? Each parent will see the note you wrote for
                  their child, if any.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleShareConfirm}
                  disabled={shareState === 'loading'}
                >
                  {shareState === 'loading' ? 'Sharing…' : 'Share'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {pipeline ? (
        /* Pipeline metrics — one card per stage of the reporting flow. */
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-muted-foreground text-sm">Students</div>
            <div className="text-2xl font-semibold">{summary.total}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-muted-foreground text-sm">Results in</div>
            <div className="text-2xl font-semibold">
              {summary.resultsIn}
              <span className="text-muted-foreground text-base font-normal">
                {' '}
                of {summary.total}
              </span>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-muted-foreground text-sm">
              Pending comments
            </div>
            <div className="text-2xl font-semibold">
              {summary.pendingComments}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-muted-foreground text-sm">Pending review</div>
            <div className="text-2xl font-semibold">
              {summary.pendingReview}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-muted-foreground text-sm">Sent to parents</div>
            <div className="text-2xl font-semibold">
              {summary.sent}
              {summary.sent > 0 && (
                <span className="text-muted-foreground text-base font-normal">
                  {' '}
                  · {summary.acked} acknowledged
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Cycle summary — compact, so the student list stays the focal point */
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span>
            <span className="text-foreground font-semibold">
              {summary.ready}
            </span>{' '}
            of {summary.total} ready
          </span>
          <span>
            <span className="text-foreground font-semibold">
              {summary.drafts}
            </span>{' '}
            drafts
          </span>
          <span>
            <span className="text-foreground font-semibold">
              {summary.sent}
            </span>{' '}
            sent
          </span>
          <span>
            <span className="text-foreground font-semibold">
              {summary.total - summary.ready - summary.drafts - summary.sent}
            </span>{' '}
            not started
          </span>
        </div>
      )}

      <CycleStudentTable
        students={pipeline ? roster : classStudents}
        pipeline={pipeline}
        cycle={cycle}
        classId={cycleClassId}
        term={term}
        showClass={levelScope}
        ownClassId="P1-A"
        seededStates={seededStates}
        onSendToParents={ownCycleClass ? setRowSendId : undefined}
      />

      {/* Per-row send confirmation — same story as the bulk share. */}
      <AlertDialog
        open={rowSendId !== null}
        onOpenChange={(open) => {
          if (!open) setRowSendId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to parents</AlertDialogTitle>
            <AlertDialogDescription>
              Send{' '}
              {classStudents.find((s) => s.id === rowSendId)?.name ??
                'this pupil'}
              ’s approved report to their parents via Parents Gateway? They will
              see the note you wrote, if any.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRowSendConfirm}>
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Polite live region for the async share action. */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}
