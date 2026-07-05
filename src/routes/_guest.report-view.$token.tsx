import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

import type { HolisticReport } from '@/types/report'
import { ReportOverviewTab } from '@/components/reports/report-overview-tab'
import { AcademicTab } from '@/components/reports/academic-tab'
import { HolisticTab } from '@/components/reports/holistic-tab'
import { ReportPreview } from '@/components/reports/report-preview'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getReportById } from '@/data/mock-reports'
import type { SharedReport } from '@/lib/hdp-template-store'
import { loadShareMessage, loadSharedReport } from '@/lib/hdp-template-store'

export const Route = createFileRoute('/_guest/report-view/$token')({
  component: GuestReportViewPage,
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

function GuestReportViewPage() {
  const { token } = Route.useParams()
  const report = getReportById(token)

  useEffect(() => {
    document.title = report
      ? `${report.studentName} · Holistic Development Profile`
      : 'Report · Teacher Workspace'
  }, [report])

  if (!report) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16">
        <h1 className="text-2xl font-semibold">Report Not Found</h1>
        <p className="text-muted-foreground text-center">
          This report link may have expired or is invalid.
        </p>
      </main>
    )
  }

  // Reports built with the Report Builder persist a shared layout → parent-first view.
  // Legacy/secondary reports (no layout) keep the original student-first view.
  const shared = loadSharedReport(report.id)
  return shared || report.layout ? (
    <ParentReportView report={report} shared={shared} />
  ) : (
    <LegacyReportView report={report} />
  )
}

// ── Parent-first view (Report Builder / P1) ───────────────────────

function ParentReportView({
  report,
  shared,
}: {
  report: HolisticReport
  shared: SharedReport | null
}) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [message] = useState(() => loadShareMessage(report.id))
  const blocks = shared?.blocks ?? report.layout?.blocks ?? []
  const comments = shared?.comments ?? report.teacherComments ?? ''

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col">
      <div className="flex-1 px-4 pb-32 pt-6">
        <div className="text-muted-foreground mb-1 text-center text-sm font-medium">
          Holistic Development Profile
        </div>
        <div className="mb-6 flex flex-col items-center gap-3">
          <Avatar size="lg" className="ring-primary ring-2 ring-offset-2">
            <AvatarFallback>{getInitials(report.studentName)}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-xl font-semibold">{report.studentName}</h1>
            <p className="text-muted-foreground text-sm">
              {report.studentClass} · {report.term} {report.academicYear}
            </p>
          </div>
        </div>

        {message && (
          <div className="bg-muted/50 mb-6 rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-xs font-medium">
              A note from {report.formTeacher}
            </p>
            <p className="text-sm leading-relaxed">{message}</p>
          </div>
        )}

        <ReportPreview
          report={report}
          blocks={blocks}
          comments={comments}
          compactPupilInfo
        />
      </div>

      <div className="bg-card fixed inset-x-0 bottom-0 mx-auto max-w-md border-t px-4 py-4">
        {acknowledged ? (
          <div className="text-lime-11 text-center text-sm">
            Report acknowledged — thank you.
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={() => {
              setAcknowledged(true)
              toast.success('Report acknowledged')
            }}
          >
            <CheckCircle className="mr-2 size-4" />
            Acknowledge report
          </Button>
        )}
      </div>
    </main>
  )
}

// ── Legacy view (existing reports without a layout) — unchanged behaviour ──

function LegacyReportView({ report }: { report: HolisticReport }) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [sentToParents, setSentToParents] = useState(false)

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col">
      <div className="flex-1 px-4 pb-32 pt-6">
        <div className="text-muted-foreground mb-1 text-center text-sm font-medium">
          Student Profile
        </div>
        <div className="mb-6 flex flex-col items-center gap-3">
          <Avatar size="lg" className="ring-primary ring-2 ring-offset-2">
            <AvatarFallback>{getInitials(report.studentName)}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-xl font-semibold">{report.studentName}</h1>
            <p className="text-muted-foreground text-sm">
              {report.studentClass}
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {report.term} {report.academicYear}
          </span>
          <span className="text-muted-foreground">
            Issued{' '}
            {report.generatedAt.toLocaleDateString('en-SG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        <Tabs defaultValue="overview">
          <TabsList variant="line">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="academic" className="text-xs">
              Academic
            </TabsTrigger>
            <TabsTrigger value="holistic" className="text-xs">
              Holistic
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <ReportOverviewTab report={report} />
          </TabsContent>
          <TabsContent value="academic">
            <AcademicTab data={report.academic} />
          </TabsContent>
          <TabsContent value="holistic">
            <HolisticTab
              data={report.holistic}
              studentFirstName={getFirstName(report.studentName)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="bg-card fixed inset-x-0 bottom-0 mx-auto max-w-md border-t px-4 py-4">
        {!acknowledged ? (
          <Button
            className="w-full"
            onClick={() => {
              setAcknowledged(true)
              toast.success('Report acknowledged successfully')
            }}
          >
            <CheckCircle className="mr-2 size-4" />
            Acknowledge Report
          </Button>
        ) : !sentToParents ? (
          <div className="flex flex-col gap-2">
            <div className="text-lime-11 text-center text-xs">
              Report acknowledged
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setSentToParents(true)
                toast.success('Report sent to parents successfully')
              }}
            >
              <Send className="mr-2 size-4" />
              Send to Parents
            </Button>
          </div>
        ) : (
          <div className="text-lime-11 text-center text-sm">
            Report acknowledged and sent to parents
          </div>
        )}
      </div>
    </main>
  )
}
