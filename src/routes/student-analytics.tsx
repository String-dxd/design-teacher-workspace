import { useEffect, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Clock } from 'lucide-react'

import { useSetBreadcrumbs } from '@/hooks/use-breadcrumbs'
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAGS_STORAGE_KEY,
} from '@/lib/feature-flags'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonitoringAcademicAnalytics } from '@/components/students/academic-analytics'
import { AttendanceLevelAnalytics } from '@/components/students/attendance-analytics'
import { InsightBuddy } from '@/components/insight-buddy'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const ANALYTICS_PROMPTS = [
  'How did Sec 4 (EL-G3) do for Term 1 WA?',
  'What does this chart mean?',
]

export const Route = createFileRoute('/student-analytics')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)
    const flags = stored
      ? { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) }
      : DEFAULT_FEATURE_FLAGS
    if (!flags['student-analytics'] && !flags['student-analytics-basic'])
      throw redirect({ to: '/' })
  },
  component: StudentAnalyticsPage,
})

function ComingSoon({ description }: { description?: string }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Clock className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-4 text-xl font-medium text-foreground">Coming soon</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}

type AcademicView = 'monitoring' | 'benchmark'

function StudentAnalyticsPage() {
  useSetBreadcrumbs([{ label: 'Analytics', href: '/student-analytics' }])

  useEffect(() => {
    document.title = 'Analytics | MOE Workspace'
    return () => {
      document.title = 'MOE Workspace Homepage'
    }
  }, [])

  const [academicView, setAcademicView] = useState<AcademicView>('monitoring')
  const studentAnalyticsEnabled = useFeatureFlag('student-analytics')

  return (
    <div className="flex flex-col p-6">
      <div className="w-full max-w-[1200px]">
        {/* Page header */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <Badge
            variant="outline"
            className="border-violet-6 bg-violet-3 text-violet-11"
          >
            Experiment
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor trends and explore student data
        </p>

        {/* Main tabs */}
        <Tabs defaultValue="attendance" className="mt-6">
          <TabsList variant="line">
            <TabsTrigger
              value="attendance"
              className="after:bg-primary! data-active:text-primary"
            >
              Attendance
            </TabsTrigger>
            <TabsTrigger
              value="academic"
              className="after:bg-primary! data-active:text-primary"
            >
              Academic
            </TabsTrigger>
            <TabsTrigger
              value="wellbeing"
              className="after:bg-primary! data-active:text-primary"
            >
              Wellbeing
            </TabsTrigger>
          </TabsList>

          {/* Attendance tab */}
          <TabsContent value="attendance">
            <AttendanceLevelAnalytics />
          </TabsContent>

          {/* Academic tab */}
          <TabsContent value="academic">
            {/* Segmented control */}
            <div className="mt-4 flex w-fit rounded-full bg-muted p-1">
              <button
                onClick={() => setAcademicView('monitoring')}
                aria-pressed={academicView === 'monitoring'}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  academicView === 'monitoring'
                    ? 'bg-background/90 text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Monitoring
              </button>
              <button
                onClick={() => setAcademicView('benchmark')}
                aria-pressed={academicView === 'benchmark'}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  academicView === 'benchmark'
                    ? 'bg-background/90 text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Benchmark reports
              </button>
            </div>

            {academicView === 'benchmark' ? (
              <ComingSoon description="Benchmark reports are being prepared. They'll appear here once ready." />
            ) : (
              <MonitoringAcademicAnalytics />
            )}
          </TabsContent>

          {/* Wellbeing tab */}
          <TabsContent value="wellbeing">
            <ComingSoon description="Wellbeing analytics to help you support your students are on their way." />
          </TabsContent>
        </Tabs>
      </div>

      {/* Insight Buddy — floating FAB + overlay (does not affect page layout) */}
      {studentAnalyticsEnabled && (
        <InsightBuddy examplePrompts={ANALYTICS_PROMPTS} floating />
      )}
    </div>
  )
}
