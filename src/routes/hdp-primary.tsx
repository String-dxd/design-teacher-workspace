import { useCallback, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ClipboardCheck,
  Columns3,
  ListFilter,
  Search,
  Send,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  HolisticReport,
  ParentStatus,
  ReviewStatus,
  Term,
} from '@/types/report'
import type { Student } from '@/types/student'
import { TermSelector } from '@/components/reports/term-selector'
import { ReportTable } from '@/components/reports/report-table'
import { ClassSelector } from '@/components/students/class-selector'
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
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { CURRENT_ACADEMIC_YEAR, mockReports } from '@/data/mock-reports'
import { getSchoolLevel, mockStudents } from '@/data/mock-students'
import { GenerateHdpWizard } from '@/components/reports/generate-hdp-wizard'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
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

type GroupBy = 'none' | 'student' | 'term'

interface SearchParams {
  studentId?: string
  term?: Term
  groupBy?: GroupBy
}

export const Route = createFileRoute('/hdp-primary')({
  component: HdpPrimaryPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      studentId: search.studentId as string | undefined,
      term: search.term as Term | undefined,
      groupBy: search.groupBy as GroupBy | undefined,
    }
  },
})

function HdpPrimaryPage() {
  const {
    studentId: initialStudentId,
    term: initialTerm,
    groupBy: initialGroupBy,
  } = Route.useSearch()

  const [selectedClass, setSelectedClass] = useState('P1-A')
  const [selectedTerm, setSelectedTerm] = useState<Term | ''>(initialTerm || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<
    ReviewStatus | ''
  >('')
  const [selectedParentStatus, setSelectedParentStatus] = useState<
    ParentStatus | ''
  >('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroupBy || 'student')
  const [reports, setReports] = useState<Array<HolisticReport>>(
    () => mockReports,
  )
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStudents, setWizardStudents] = useState<Array<Student>>([])

  useSetBreadcrumbs([{ label: 'HDP (Primary)', href: '/hdp-primary' }])

  const levelFilteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.academicYear !== CURRENT_ACADEMIC_YEAR) return false
      if (initialStudentId && report.studentId !== initialStudentId)
        return false
      if (selectedTerm && report.term !== selectedTerm) return false
      return getSchoolLevel(report.studentClass) === 'primary'
    })
  }, [reports, initialStudentId, selectedTerm])

  const classFilteredReports = useMemo(() => {
    if (selectedClass === 'all') return levelFilteredReports

    if (selectedClass.startsWith('Primary')) {
      const levelPart = selectedClass.replace(/^Primary\s*/, '')
      return levelFilteredReports.filter((r) =>
        r.studentClass.startsWith(`P${levelPart}`),
      )
    }

    return levelFilteredReports.filter((r) => r.studentClass === selectedClass)
  }, [levelFilteredReports, selectedClass])

  const searchFilteredReports = useMemo(() => {
    if (!searchQuery) return classFilteredReports
    const query = searchQuery.toLowerCase()
    return classFilteredReports.filter((r) =>
      r.studentName.toLowerCase().includes(query),
    )
  }, [classFilteredReports, searchQuery])

  const filteredReports = useMemo(() => {
    return searchFilteredReports.filter((r) => {
      if (selectedReviewStatus && r.reviewStatus !== selectedReviewStatus)
        return false
      if (selectedParentStatus && r.parentStatus !== selectedParentStatus)
        return false
      return true
    })
  }, [searchFilteredReports, selectedReviewStatus, selectedParentStatus])

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

  const pgSendableCount = useMemo(() => {
    return reports.filter(
      (r) => selectedIds.has(r.id) && r.parentStatus === 'not_sent',
    ).length
  }, [reports, selectedIds])

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

  const activeFilterCount = [
    selectedTerm,
    selectedReviewStatus,
    selectedParentStatus,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col">
      <div className="shrink-0 space-y-6 pt-6">
        {/* Page Header */}
        <div className="px-6">
          <h1 className="text-2xl font-semibold">
            Holistic Development Reports
          </h1>
          <p className="text-muted-foreground">
            Primary school — generate, review, and release HDPs to parents
          </p>
        </div>

        {/* Class Selector — primary only */}
        <div className="px-6">
          <ClassSelector
            value={selectedClass}
            onValueChange={setSelectedClass}
            schoolLevel="primary"
            onSchoolLevelChange={() => {}}
          />
        </div>

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
                    <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f26c47] px-1.5 text-xs font-medium text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <PopoverContent align="start" className="w-80 gap-3">
              <div className="space-y-1">
                <Label>Semester</Label>
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
                <Label>Parent status</Label>
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
        groupBy={groupBy}
        onQuickSendParent={handleQuickSendParent}
      />

      {/* Generate HDP Wizard */}
      <GenerateHdpWizard
        students={wizardStudents}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border bg-white px-5 py-2.5 shadow-lg">
            <span className="text-sm font-medium text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              size="sm"
              className="rounded-full bg-orange-9 text-white hover:bg-orange-10"
              onClick={() => {
                const students = [...selectedIds]
                  .map((id) => {
                    const report = reports.find((r) => r.id === id)
                    return mockStudents.find((s) => s.id === report?.studentId)
                  })
                  .filter((s): s is Student => s !== undefined)
                setWizardStudents(students)
                setWizardOpen(true)
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate HDP
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button size="sm" variant="outline" className="rounded-full">
                    <Send className="mr-2 h-4 w-4" />
                    Release to parents via PG
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Release to parents via PG</AlertDialogTitle>
                  <AlertDialogDescription>
                    Release {pgSendableCount} report
                    {pgSendableCount !== 1 ? 's' : ''} to parents via Parents
                    Gateway? Parents will be notified via PG.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkSendParentsPg}>
                    Release
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
    </div>
  )
}
