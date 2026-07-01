import { Award, Info } from 'lucide-react'
import { RadarChart } from './radar-chart'
import type { CoreValue, CoreValueLevel } from '@/types/report'
import { cn } from '@/lib/utils'

const levelColors: Record<CoreValueLevel, string> = {
  'Demonstrates Very Strongly': 'bg-lime-3 text-lime-11',
  'Demonstrates Strongly': 'bg-lime-3 text-lime-11',
  Demonstrates: 'bg-twblue-3 text-twblue-11',
  'Regularly Shows': 'bg-amber-3 text-amber-11',
  Beginning: 'bg-slate-3 text-slate-11',
}

interface CoreValuesSectionProps {
  coreValues: Array<CoreValue>
  studentFirstName: string
}

export function CoreValuesSection({
  coreValues,
  studentFirstName,
}: CoreValuesSectionProps) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <span className="inline-block rounded-full bg-orange-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-11">
          Core Values Journey
        </span>
        <h2 className="mt-3 text-xl font-bold">
          Celebrating {studentFirstName}&apos;s Personal Growth
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Character development is a lifelong journey. We celebrate every step
          forward in fulfilling our core values.
        </p>
      </div>

      <div className="flex justify-center">
        <RadarChart values={coreValues} colorScheme="pink" />
      </div>

      <div className="flex flex-col gap-4">
        {coreValues.map((value) => (
          <div key={value.name} className="border-border rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold">{value.name}</h3>
                  <Info className="text-muted-foreground size-3.5" />
                </div>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {value.shortDescription}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase',
                  levelColors[value.level],
                )}
              >
                {value.level}
              </span>
            </div>
            {value.supportedBy.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5">
                {value.supportedBy.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm"
                  >
                    <Award className="text-muted-foreground size-3.5 shrink-0" />
                    <span>
                      Supported by: <span className="font-medium">{s}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
