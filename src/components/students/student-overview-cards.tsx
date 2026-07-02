import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { Student } from '@/types/student'
import { Card, CardContent } from '@/components/ui/card'

interface StudentOverviewCardsProps {
  student: Student
}

export function StudentOverviewCards({ student }: StudentOverviewCardsProps) {
  const attendancePct =
    student.totalSchoolDays > 0
      ? Math.round((student.daysPresent / student.totalSchoolDays) * 100)
      : 0

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Attendance Card */}
      <Card size="sm">
        <CardContent className="relative space-y-1">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Attendance
            </span>
            <div className="flex items-center gap-1 text-crimson-11">
              <TrendingDown className="h-3 w-3" />
              <span className="text-xs font-medium">Declining</span>
            </div>
          </div>
          <div className="text-3xl font-semibold">{attendancePct}%</div>
          <span className="text-muted-foreground text-sm">Current term</span>
        </CardContent>
      </Card>

      {/* Academics Card */}
      <Card size="sm">
        <CardContent className="relative space-y-1">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Academics
            </span>
            <div className="flex items-center gap-1 text-foreground">
              <Minus className="h-3 w-3" />
              <span className="text-xs font-medium">Stable</span>
            </div>
          </div>
          <div className="flex items-end gap-6">
            <div className="flex flex-col">
              <span className="text-3xl font-semibold">
                {student.overallPercentage}%
              </span>
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                Overall %
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellbeing Card */}
      <Card size="sm">
        <CardContent className="relative space-y-1">
          <div className="flex items-start justify-between">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Wellbeing
            </span>
            <div className="flex items-center gap-1 text-lime-11">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">Improving</span>
            </div>
          </div>
          <div className="text-3xl font-semibold">{student.riskIndicators}</div>
          <span className="text-muted-foreground text-sm">
            TCI risk indicators
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
