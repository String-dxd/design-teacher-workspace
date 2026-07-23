import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import type { Student } from '@/types/student'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface InterventionBannerProps {
  student: Student
}

export function InterventionBanner({ student }: InterventionBannerProps) {
  // Lam Wei Jie (id '3') and Alice De Silva (id '118', duplicated from Lam Wei Jie)
  if (student.id !== '3' && student.id !== '118') return null

  // Alice De Silva carries updated copy; Lam Wei Jie keeps the original wording.
  const isAlice = student.id === '118'
  const copy = isAlice
    ? {
        header: 'Possible support areas',
        title: 'LTA and Low mood',
        description:
          'Changes to build on: attendance improved; friends selected increased from 1 to 3.',
        cta: 'Explore support',
      }
    : {
        header: 'Recommended action',
        title: 'Follow-up areas: bullying incident, missed CCA, low mood',
        description:
          'Behavioural, social-emotional, and engagement patterns observed across multiple areas — consider a sequenced, differentiated approach.',
        cta: 'View guidance',
      }

  return (
    <div className="rounded-3xl border border-twblue-6 bg-twblue-2 px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-twblue-11">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-semibold">{copy.header}</span>
        </div>
        {!isAlice && (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-3">
        <h3
          className={cn(
            'font-semibold text-foreground',
            isAlice ? 'text-base' : 'text-sm',
          )}
        >
          {copy.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {copy.description}
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
          {copy.cta}
        </Button>
      </div>
    </div>
  )
}
