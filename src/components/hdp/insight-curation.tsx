import { TagPill } from './tag-pill'
import type { HdpInsight, InsightKind } from '@/types/hdp'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const KIND_LABELS: Record<InsightKind, string> = {
  observation: 'Observation',
  pattern: 'Pattern',
  trajectory: 'Trajectory',
  attendance: 'Attendance',
  cca: 'CCA',
  conduct: 'Conduct',
  via: 'VIA',
  competition: 'Competition',
  promotion: 'Promotion',
}

interface InsightCurationProps {
  insights: Array<HdpInsight>
  selectedIds: Set<string>
  onToggle: (id: string) => void
  /** Section heading — defaults to the school-records framing now that
   *  river observations and threads are selected in the river itself. */
  title?: string
  description?: string
}

// Prototype B's curation list (PRD F4-full point 1, plan 040) — explicitly
// not a dashboard: no charts, no aggregates, just facts a teacher can pick
// from. Since the river became the selection surface for observations and
// confirmed threads, this list carries only the non-river facts
// (trajectories, attendance, CCA, conduct, VIA, competition). Promotion
// status renders (context) but its checkbox is disabled — it isn't
// something a teacher curates into a comment.
export function InsightCuration({
  insights,
  selectedIds,
  onToggle,
  title = 'School records',
  description,
}: InsightCurationProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      <ul className="flex flex-col gap-2.5">
        {insights.map((insight) => {
          const checkboxId = `insight-${insight.id}`
          return (
            <li key={insight.id} className="flex items-start gap-3">
              <Checkbox
                id={checkboxId}
                checked={selectedIds.has(insight.id)}
                disabled={!insight.selectable}
                onCheckedChange={() => onToggle(insight.id)}
                className="mt-0.5"
              />
              <Label
                htmlFor={checkboxId}
                className="flex flex-1 flex-wrap items-center gap-2 text-sm font-normal"
              >
                {insight.label}
                <TagPill label={KIND_LABELS[insight.kind]} />
              </Label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
