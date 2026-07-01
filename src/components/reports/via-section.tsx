import { Heart } from 'lucide-react'
import type { VIAActivity } from '@/types/report'

interface VIASectionProps {
  activities: Array<VIAActivity>
}

export function VIASection({ activities }: VIASectionProps) {
  return (
    <section className="border-border rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-lime-3">
          <Heart className="text-lime-11" size={18} />
        </div>
        <h2 className="text-base font-semibold">Values in Action (VIA)</h2>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {activities.map((activity) => (
          <div key={activity.activityName} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-lime-3 px-3 py-1 text-xs font-semibold uppercase text-lime-11">
                {activity.category}
              </span>
              <span className="text-muted-foreground text-sm">
                {activity.hours} Hours
              </span>
            </div>
            <p className="text-sm font-semibold">{activity.activityName}</p>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Role: {activity.role}
            </p>
            <p className="text-muted-foreground text-sm">
              {activity.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
