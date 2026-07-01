import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

import { ReportOverviewTab } from '@/components/reports/report-overview-tab'
import { AcademicTab } from '@/components/reports/academic-tab'
import { HolisticTab } from '@/components/reports/holistic-tab'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getReportById } from '@/data/mock-reports'

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
  const [acknowledged, setAcknowledged] = useState(false)
  const [sentToParents, setSentToParents] = useState(false)

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

  const handleAcknowledge = () => {
    setAcknowledged(true)
    toast.success('Report acknowledged successfully')
  }

  const handleSendToParents = () => {
    setSentToParents(true)
    toast.success('Report sent to parents successfully')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col">
      <div className="flex-1 px-4 pb-32 pt-6">
        {/* Header */}
        <div className="mb-1 text-center text-sm font-medium text-muted-foreground">
          Student Profile
        </div>
        <div className="mb-6 flex flex-col items-center gap-3">
          <Avatar size="lg" className="ring-2 ring-orange-9 ring-offset-2">
            <AvatarFallback>{getInitials(report.studentName)}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-xl font-semibold">{report.studentName}</h1>
            <p className="text-muted-foreground text-sm">
              {report.studentClass}
            </p>
          </div>
        </div>

        {/* Term & Date info */}
        <div className="mb-6 flex items-center justify-between text-sm">
          <div>
            <span className="text-muted-foreground">
              {report.term} {report.academicYear}
            </span>
          </div>
          <div className="text-muted-foreground">
            Issued{' '}
            {report.generatedAt.toLocaleDateString('en-SG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList variant="line">
            <TabsTrigger
              value="overview"
              className="text-xs data-active:text-orange-9 data-active:after:bg-orange-9"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="academic"
              className="text-xs data-active:text-orange-9 data-active:after:bg-orange-9"
            >
              Academic
            </TabsTrigger>
            <TabsTrigger
              value="holistic"
              className="text-xs data-active:text-orange-9 data-active:after:bg-orange-9"
            >
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

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t bg-card px-4 py-4">
        {!acknowledged ? (
          <Button
            className="w-full bg-orange-9 text-white hover:bg-orange-10"
            onClick={handleAcknowledge}
          >
            <CheckCircle className="mr-2 size-4" />
            Acknowledge Report
          </Button>
        ) : !sentToParents ? (
          <div className="flex flex-col gap-2">
            <div className="text-center text-xs text-lime-11">
              Report acknowledged
            </div>
            <Button
              className="w-full bg-orange-9 text-white hover:bg-orange-10"
              onClick={handleSendToParents}
            >
              <Send className="mr-2 size-4" />
              Send to Parents
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-lime-11">
            Report acknowledged and sent to parents
          </div>
        )}
      </div>
    </main>
  )
}
