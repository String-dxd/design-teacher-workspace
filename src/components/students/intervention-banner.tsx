import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type { Student } from '@/types/student'

import { Button } from '@/components/ui/button'

interface InterventionBannerProps {
  student: Student
}

export function InterventionBanner({ student }: InterventionBannerProps) {
  if (student.id !== '3') return null

  return (
    <div className="rounded-3xl border border-twblue-6 bg-twblue-2 px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-twblue-11">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-semibold">Recommended action</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-foreground">
          Follow-up areas: bullying incident, missed CCA, low mood
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Behavioural, social-emotional, and engagement patterns observed across
          multiple areas — consider a sequenced, differentiated approach.
        </p>
      </div>

      {/* CTA — navigates to the Glow page (full-screen, no modal) */}
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          render={
            <Link to="/glow/$studentId" params={{ studentId: student.id }} />
          }
        >
          View guidance
        </Button>
      </div>
    </div>
  )
}
