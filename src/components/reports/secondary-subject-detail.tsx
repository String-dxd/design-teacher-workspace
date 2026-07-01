import type { SecondarySubjectPerformance } from '@/types/report'
import { cn } from '@/lib/utils'

interface SecondarySubjectDetailProps {
  subject: SecondarySubjectPerformance
}

export function SecondarySubjectDetail({
  subject,
}: SecondarySubjectDetailProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wider">
        Performance History
      </p>
      <div className="divide-border divide-y">
        {subject.semesterHistory.map((sem) => (
          <div
            key={sem.semester}
            className="flex items-center justify-between py-2"
          >
            <span className="text-muted-foreground text-sm">
              {sem.semester}
            </span>
            <span className="flex items-center gap-2 text-sm">
              {sem.delta != null && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    sem.delta > 0 && 'text-lime-11',
                    sem.delta < 0 && 'text-crimson-11',
                    sem.delta === 0 && 'text-muted-foreground',
                  )}
                >
                  {sem.delta > 0 ? '+' : ''}
                  {sem.delta}
                </span>
              )}
              <span className="font-semibold">{sem.score}</span>
              <span className="text-muted-foreground rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                {sem.grade}
              </span>
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between py-2 font-semibold">
          <span className="text-sm">Academic Year Overall</span>
          <span className="text-sm">{subject.academicYearOverall}</span>
        </div>
      </div>
    </div>
  )
}
