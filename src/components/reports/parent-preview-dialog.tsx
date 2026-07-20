import { CheckCircle, Download, Send, X } from 'lucide-react'
import { ReportOverviewTab } from './report-overview-tab'
import { AcademicTab } from './academic-tab'
import { HolisticTab } from './holistic-tab'
import type { HolisticReport, SchoolLevel } from '@/types/report'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getInitials } from '@/lib/format'

interface ParentPreviewDialogProps {
  report: HolisticReport
  open: boolean
  onOpenChange: (open: boolean) => void
  studentFirstName: string
  previewMode?: 'parent' | 'student'
  schoolLevel?: SchoolLevel
}

export function ParentPreviewDialog({
  report,
  open,
  onOpenChange,
  studentFirstName,
  previewMode = 'parent',
  schoolLevel,
}: ParentPreviewDialogProps) {
  const isStudentPreview = previewMode === 'student'
  const title = isStudentPreview
    ? 'Student Mobile Preview'
    : 'Parent Mobile Preview'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] max-w-sm flex-col gap-0 overflow-hidden rounded-[2.5rem] p-0"
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <DialogHeader className="flex-1">
            <DialogTitle className="text-sm">{title}</DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pb-6 pt-4">
            {isStudentPreview ? (
              <>
                {/* Guest link layout */}
                <div className="mb-1 text-center text-sm font-medium text-muted-foreground">
                  Student Profile
                </div>
                <div className="mb-6 flex flex-col items-center gap-3">
                  <Avatar
                    size="lg"
                    className="ring-2 ring-orange-9 ring-offset-2"
                  >
                    <AvatarFallback>
                      {getInitials(report.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">
                      {report.studentName}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {report.studentClass}
                    </p>
                  </div>
                </div>

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
              </>
            ) : (
              <>
                <div className="mb-1 text-lg font-semibold">
                  {report.studentName}
                  <span className="text-muted-foreground ml-1.5 text-sm font-normal">
                    {report.studentClass}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {report.term} {report.academicYear}
                </p>
              </>
            )}

            <Tabs
              defaultValue="overview"
              className={isStudentPreview ? '' : 'mt-4'}
            >
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
                <AcademicTab
                  data={report.academic}
                  secondaryData={report.secondaryAcademic}
                  schoolLevel={schoolLevel ?? report.schoolLevel}
                />
              </TabsContent>
              <TabsContent value="holistic">
                <HolisticTab
                  data={report.holistic}
                  studentFirstName={studentFirstName}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="border-t px-4 py-3">
          {isStudentPreview ? (
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-orange-9 text-white hover:bg-orange-10"
                size="sm"
                disabled
              >
                <CheckCircle className="mr-2 size-3.5" />
                Acknowledge Report
              </Button>
              <Button className="w-full" variant="outline" size="sm" disabled>
                <Send className="mr-2 size-3.5" />
                Send to Parents
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-lime-9 text-white hover:bg-lime-10"
                  size="sm"
                  disabled
                >
                  Acknowledge Report
                </Button>
                <Button variant="outline" size="icon-sm" disabled>
                  <Download className="size-3.5" />
                </Button>
              </div>
              <p className="text-muted-foreground text-center text-xs">
                Please scroll through all sections to acknowledge
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
