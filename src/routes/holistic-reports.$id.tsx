import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  MoreVertical,
  Send,
} from 'lucide-react'

import { toast } from 'sonner'

import { AcademicTab } from '@/components/reports/academic-tab'
import { EmailPreviewDialog } from '@/components/reports/email-preview-dialog'
import { PgPreviewDialog } from '@/components/reports/pg-preview-dialog'
import { HolisticTab } from '@/components/reports/holistic-tab'
import { ParentPreviewDialog } from '@/components/reports/parent-preview-dialog'
import { ReportOverviewTab } from '@/components/reports/report-overview-tab'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAdjacentReportIds, getReportById } from '@/data/mock-reports'
import { getSchoolLevel } from '@/data/mock-students'
import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/holistic-reports/$id')({
  component: ReportDetailPage,
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getFirstName(name: string): string {
  return name.split(' ').filter((part) => part.length > 0)[0] ?? name
}

function ReportDetailPage() {
  const { id } = Route.useParams()
  const report = getReportById(id)
  const defaultLevel = report
    ? getSchoolLevel(report.studentClass)
    : 'secondary'
  const schoolLevel = defaultLevel
  const [activeTab, setActiveTab] = useState('overview')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'parent' | 'student'>('parent')
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
  const [pgPreviewOpen, setPgPreviewOpen] = useState(false)

  const breadcrumbLabel = report
    ? `${report.studentName} - ${report.term} ${report.academicYear}`
    : 'Report'

  useSetBreadcrumbs([
    { label: 'Reports', href: '/holistic-reports' },
    { label: breadcrumbLabel, href: `/holistic-reports/${id}` },
  ])

  if (!report) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Report Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The report you're looking for doesn't exist.
          </p>
          <Link to="/holistic-reports" className={cn(buttonVariants(), 'mt-4')}>
            Back to Reports
          </Link>
        </div>
      </main>
    )
  }

  const { prevId, nextId } = getAdjacentReportIds(id)
  const isPrimary = schoolLevel === 'primary'

  const handlePreview = () => {
    setPreviewMode(isPrimary ? 'parent' : 'student')
    setPreviewOpen(true)
  }

  const handleSendToStudent = () => {
    setEmailPreviewOpen(true)
  }

  const handleSendViaPg = () => {
    setPgPreviewOpen(true)
  }

  const handleSaveAsPdf = () => {
    toast.success('Downloading report as PDF...')
    window.print()
  }

  const handleConfirmSend = () => {
    setEmailPreviewOpen(false)
    toast.success("Report sent to student's email")
  }

  const handleConfirmPgSend = () => {
    setPgPreviewOpen(false)
    toast.success('Report sent via Parents Gateway')
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <Link
          to="/holistic-reports"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <Avatar size="lg">
          <AvatarFallback>{getInitials(report.studentName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            {report.studentName}
            <span className="text-muted-foreground ml-2 text-base font-normal">
              {report.studentClass}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Issued{' '}
            {report.generatedAt.toLocaleDateString('en-SG', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-full"
            disabled={!prevId}
            render={
              prevId ? (
                <Link to="/reports/$id" params={{ id: prevId }} />
              ) : undefined
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-full"
            disabled={!nextId}
            render={
              nextId ? (
                <Link to="/reports/$id" params={{ id: nextId }} />
              ) : undefined
            }
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-full"
            onClick={handleSaveAsPdf}
          >
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList variant="line">
          <TabsTrigger
            value="overview"
            className="data-active:text-orange-9 data-active:after:bg-orange-9"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="academic"
            className="data-active:text-orange-9 data-active:after:bg-orange-9"
          >
            Academic
          </TabsTrigger>
          <TabsTrigger
            value="holistic"
            className="data-active:text-orange-9 data-active:after:bg-orange-9"
          >
            Holistic
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <ReportOverviewTab
            report={report}
            onViewHolistic={() => setActiveTab('holistic')}
          />
        </TabsContent>
        <TabsContent value="academic">
          <AcademicTab
            data={report.academic}
            secondaryData={report.secondaryAcademic}
            schoolLevel={schoolLevel}
          />
        </TabsContent>
        <TabsContent value="holistic">
          <HolisticTab
            data={report.holistic}
            studentFirstName={getFirstName(report.studentName)}
          />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 flex gap-3 border-t bg-card py-4">
        <Button variant="outline" className="flex-1" onClick={handlePreview}>
          <Eye className="mr-2 size-4" />
          {isPrimary ? 'Preview as Parent' : 'Preview as Student'}
        </Button>
        {!isPrimary && (
          <Button
            className="flex-1 bg-orange-9 text-white hover:bg-orange-10"
            onClick={handleSendToStudent}
          >
            <Send className="mr-2 size-4" />
            Send to Student
          </Button>
        )}
        {isPrimary && (
          <Button
            className="flex-1 bg-orange-9 text-white hover:bg-orange-10"
            onClick={handleSendViaPg}
          >
            <Send className="mr-2 size-4" />
            Send to Parents via PG
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon">
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {!isPrimary && (
              <DropdownMenuItem onClick={handleSendViaPg}>
                <Send className="mr-2 size-4" />
                Send to Parents via PG
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleSaveAsPdf}>
              <Download className="mr-2 size-4" />
              Save as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ParentPreviewDialog
        report={report}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        studentFirstName={getFirstName(report.studentName)}
        previewMode={previewMode}
        schoolLevel={schoolLevel}
      />

      <EmailPreviewDialog
        report={report}
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        recipientType="student"
        onSend={handleConfirmSend}
      />

      <PgPreviewDialog
        report={report}
        open={pgPreviewOpen}
        onOpenChange={setPgPreviewOpen}
        onSend={handleConfirmPgSend}
        studentFirstName={getFirstName(report.studentName)}
        schoolLevel={schoolLevel}
      />
    </main>
  )
}
