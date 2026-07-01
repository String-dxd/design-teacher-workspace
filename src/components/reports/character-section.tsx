import type { CharacterData } from '@/types/report'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, getStatusColor } from '@/lib/utils'
import {
  absencesThresholds,
  ccaMissedThresholds,
  lateComingThresholds,
  offencesThresholds,
  riskIndicatorsThresholds,
} from '@/data/threshold-config'

interface CharacterSectionProps {
  data: CharacterData
}

export function CharacterSection({ data }: CharacterSectionProps) {
  const conductColors: Record<string, string> = {
    Excellent: 'bg-lime-3 text-lime-11 hover:bg-lime-3',
    'Very Good': 'bg-lime-3 text-lime-11 hover:bg-lime-3',
    Good: 'bg-muted text-muted-foreground hover:bg-muted',
    Fair: 'bg-amber-3 text-amber-11 hover:bg-amber-3',
    Poor: 'bg-crimson-3 text-crimson-11 hover:bg-crimson-3',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Character Development</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <h4 className="text-muted-foreground mb-3 text-sm font-medium">
            Behaviour & Discipline
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">Conduct</span>
              <Badge className={cn('w-fit', conductColors[data.conduct])}>
                {data.conduct}
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">Offences</span>
              <span
                className={cn(
                  'font-medium',
                  getStatusColor(data.offences, offencesThresholds),
                )}
              >
                {data.offences}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">Absences</span>
              <span
                className={cn(
                  'font-medium',
                  getStatusColor(data.absences, absencesThresholds),
                )}
              >
                {data.absences}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">Late Coming</span>
              <span
                className={cn(
                  'font-medium',
                  getStatusColor(data.lateComing, lateComingThresholds),
                )}
              >
                {data.lateComing}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">CCA Missed</span>
              <span
                className={cn(
                  'font-medium',
                  getStatusColor(data.ccaMissed, ccaMissedThresholds),
                )}
              >
                {data.ccaMissed}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-muted-foreground mb-3 text-sm font-medium">
            Wellbeing
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                TCI Risk Indicators
              </span>
              <span
                className={cn(
                  'font-medium',
                  getStatusColor(data.riskIndicators, riskIndicatorsThresholds),
                )}
              >
                {data.riskIndicators}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Low Mood Flagged
              </span>
              <span className="font-medium">{data.lowMoodFlagged || 'No'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Social Links
              </span>
              <span className="font-medium">{data.socialLinks}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                Counselling Sessions
              </span>
              <span className="font-medium">{data.counsellingSessions}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
