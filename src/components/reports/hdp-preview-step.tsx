import { useState } from 'react'
import { Eye } from 'lucide-react'
import { ReportOverviewTab } from './report-overview-tab'
import { AcademicTab } from './academic-tab'
import { CoreValuesSection } from './core-values-section'
import { PhysicalFitnessSection } from './physical-fitness-section'
import { VIASection } from './via-section'
import { CCASection } from './cca-section'
import type { HolisticReport, SchoolLevel } from '@/types/report'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ACTIVE_TAB_CLASS =
  'data-active:text-orange-9 data-active:after:bg-orange-9'

function getFirstName(name: string): string {
  return name.split(' ').filter((part) => part.length > 0)[0] ?? name
}

interface HdpPreviewStepProps {
  report: HolisticReport
  selectedSections: Record<string, boolean>
  schoolLevel: SchoolLevel
}

export function HdpPreviewStep({
  report,
  selectedSections,
  schoolLevel,
}: HdpPreviewStepProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const hasHolistic =
    selectedSections.coreValues ||
    selectedSections.physicalFitness ||
    selectedSections.via ||
    selectedSections.cca

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 rounded-lg bg-twblue-3 px-4 py-3 text-sm text-twblue-11">
        <Eye className="size-4 shrink-0" />
        <span>
          This is how the report card will appear when downloaded or sent to
          parents. Review before saving.
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList variant="line">
          <TabsTrigger
            value="overview"
            className={ACTIVE_TAB_CLASS}
          >
            Overview
          </TabsTrigger>
          {selectedSections.academic && (
            <TabsTrigger
              value="academic"
              className={ACTIVE_TAB_CLASS}
            >
              Academic
            </TabsTrigger>
          )}
          {hasHolistic && (
            <TabsTrigger
              value="holistic"
              className={ACTIVE_TAB_CLASS}
            >
              Holistic
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <ReportOverviewTab
            report={report}
            onViewHolistic={
              hasHolistic ? () => setActiveTab('holistic') : undefined
            }
          />
        </TabsContent>

        {selectedSections.academic && (
          <TabsContent value="academic">
            <AcademicTab
              data={report.academic}
              secondaryData={report.secondaryAcademic}
              schoolLevel={schoolLevel}
            />
          </TabsContent>
        )}

        {hasHolistic && (
          <TabsContent value="holistic">
            <div className="flex flex-col gap-6 pt-4">
              {selectedSections.coreValues && (
                <CoreValuesSection
                  coreValues={report.holistic.coreValues}
                  studentFirstName={getFirstName(report.studentName)}
                />
              )}
              {selectedSections.physicalFitness && (
                <PhysicalFitnessSection
                  fitness={report.holistic.physicalFitness}
                />
              )}
              {selectedSections.via && (
                <VIASection activities={report.holistic.via} />
              )}
              {selectedSections.cca && (
                <CCASection ccaList={report.holistic.cca} />
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
