import { AttendanceRing } from './attendance-ring'
import type { ConductGrade } from '@/types/student'
import type { AttendanceData } from '@/types/report'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AttendanceConductCardProps {
  attendance: AttendanceData
  conduct: ConductGrade
}

const CONDUCT_GRADES: Array<ConductGrade> = [
  'Excellent',
  'Very Good',
  'Good',
  'Fair',
  'Poor',
]

export function AttendanceConductCard({
  attendance,
  conduct,
}: AttendanceConductCardProps) {
  const attendancePercentage =
    attendance.totalSchoolDays > 0
      ? (attendance.daysPresent / attendance.totalSchoolDays) * 100
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance &amp; Conduct</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <AttendanceRing percentage={attendancePercentage} size={80} />
          <div className="flex flex-1 items-start gap-4">
            <div className="border-border flex-1 border-r pr-4">
              <p className="text-muted-foreground text-xs font-medium">
                Attendance
              </p>
              <p className="text-lg font-semibold">
                {attendance.daysPresent} / {attendance.totalSchoolDays}
              </p>
              <p className="text-muted-foreground text-xs">Days Present</p>
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-xs font-medium">
                Days Late
              </p>
              <p className="text-lg font-semibold">{attendance.daysLate}</p>
              <p className="text-muted-foreground text-xs">Total Instances</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs font-medium">
            Overall Conduct
          </span>
          <div className="flex flex-wrap gap-2">
            {CONDUCT_GRADES.map((grade) => {
              const isActive = grade === conduct
              return (
                <span
                  key={grade}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    isActive
                      ? 'bg-lime-9 text-white'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {grade}
                </span>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
