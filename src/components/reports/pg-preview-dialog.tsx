import { Info, Send, X } from 'lucide-react'
import { ReportOverviewTab } from './report-overview-tab'
import { AcademicTab } from './academic-tab'
import { HolisticTab } from './holistic-tab'
import type { HolisticReport, SchoolLevel } from '@/types/report'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PgPreviewDialogProps {
  report: HolisticReport
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: () => void
  studentFirstName: string
  schoolLevel?: SchoolLevel
}

export function PgPreviewDialog({
  report,
  open,
  onOpenChange,
  onSend,
  studentFirstName,
  schoolLevel,
}: PgPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] max-w-sm flex-col gap-0 overflow-hidden rounded-[2.5rem] p-0"
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <DialogHeader className="flex-1">
            <DialogTitle className="text-sm">
              Parents Gateway Preview
            </DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Preview banner */}
        <div className="flex items-center gap-2 bg-twblue-3 px-5 py-2.5 text-xs text-twblue-11">
          <Info className="size-3.5 shrink-0" />
          This is a preview of how the parent will see the notification
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pb-6 pt-4">
            <div className="mb-1 text-lg font-semibold">
              {report.studentName}
              <span className="text-muted-foreground ml-1.5 text-sm font-normal">
                {report.studentClass}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              {report.term} {report.academicYear}
            </p>

            <Tabs defaultValue="overview" className="mt-4">
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

        <div className="flex flex-col gap-2 border-t px-4 py-3">
          <Button
            className="w-full bg-orange-9 text-white hover:bg-orange-10"
            size="sm"
            onClick={onSend}
          >
            <Send className="mr-2 size-3.5" />
            Send via PG
          </Button>
          <Button
            className="w-full"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
