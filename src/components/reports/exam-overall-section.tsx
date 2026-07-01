import type { ExamOverall } from '@/types/report'

interface ExamOverallSectionProps {
  overall: ExamOverall
}

export function ExamOverallSection({ overall }: ExamOverallSectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Overall</h2>
      <div className="border-border rounded-lg border p-5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              Exam Performance
            </p>
            <p className="mt-1 text-2xl font-bold text-orange-9">
              {overall.examPerformance}
            </p>
            <p className="text-muted-foreground text-sm">
              {overall.semesterLabel}
            </p>
          </div>
          <div className="border-border border-t pt-4">
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              Academic Year Overall
            </p>
            <p className="mt-1 text-2xl font-bold">
              {overall.academicYearOverall}
            </p>
            <p className="text-muted-foreground text-sm">
              {overall.cumulativeLabel}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
