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
}

// Prototype B's curation step (PRD F4-full point 1, plan 040) — a numbered
// list, explicitly not a dashboard: no charts, no aggregates, just the
// facts a teacher can pick from. Sits between the evidence river and the
// claim editor in the Draft Studio student workspace. Promotion status
// renders (context) but its checkbox is disabled — it isn't something a
// teacher curates into a comment.
export function InsightCuration({
  insights,
  selectedIds,
  onToggle,
}: InsightCurationProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium">Insights</h2>
        <p className="text-muted-foreground text-xs">
          Select the insights that belong in this comment.
        </p>
      </div>
      <ol className="flex flex-col gap-2.5">
        {insights.map((insight, index) => {
          const checkboxId = `insight-${insight.id}`
          return (
            <li key={insight.id} className="flex items-start gap-3">
              <span
                className="text-muted-foreground w-4 shrink-0 pt-0.5 text-right text-xs tabular-nums"
                aria-hidden
              >
                {index + 1}
              </span>
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
      </ol>
    </div>
  )
}
