import type { AcademicAggregate } from '@/types/report'

interface AcademicAggregatesSectionProps {
  aggregates: Array<AcademicAggregate>
}

const AGGREGATE_COLORS = [
  { bg: 'bg-crimson-3', text: 'text-crimson-11', border: 'border-crimson-6' },
  { bg: 'bg-orange-3', text: 'text-orange-11', border: 'border-orange-6' },
  { bg: 'bg-twblue-3', text: 'text-twblue-11', border: 'border-twblue-6' },
  {
    bg: 'bg-lime-3',
    text: 'text-lime-11',
    border: 'border-lime-6',
  },
  { bg: 'bg-violet-3', text: 'text-violet-11', border: 'border-violet-6' },
]

export function AcademicAggregatesSection({
  aggregates,
}: AcademicAggregatesSectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">Academic Aggregates</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {aggregates.map((agg, i) => {
          const color = AGGREGATE_COLORS[i % AGGREGATE_COLORS.length]
          return (
            <div
              key={agg.label}
              className={`flex flex-col items-center rounded-lg border p-3 ${color.bg} ${color.border}`}
            >
              <p className="text-muted-foreground text-[10px] uppercase">
                {agg.label}
              </p>
              <p className={`text-2xl font-bold ${color.text}`}>{agg.value}</p>
              <p className="text-muted-foreground text-center text-[10px]">
                {agg.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
