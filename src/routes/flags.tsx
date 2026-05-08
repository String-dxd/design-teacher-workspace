import { createFileRoute } from '@tanstack/react-router'

import type { FeatureFlagKey } from '@/lib/feature-flags'
import { useFeatureFlags } from '@/lib/feature-flags'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export const Route = createFileRoute('/flags')({
  component: FeatureFlagsPage,
})

interface FeatureFlagConfig {
  key: FeatureFlagKey
  label: string
  description: string
  stage: string
}

const featureFlagConfigs: Array<FeatureFlagConfig> = [
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Enable notification features',
    stage: 'Release 2',
  },
  {
    key: 'posts',
    label: 'Posts',
    description: 'Show or hide the Posts page in the sidebar navigation',
    stage: 'Release 2',
  },
  {
    key: 'forms',
    label: 'Posts with Custom Forms',
    description: 'Show or hide the Custom Forms tab on the Posts page',
    stage: 'Release 3',
  },
  {
    key: 'lta-intervention',
    label: 'Contextual Intelligence',
    description:
      'Show the LTA (long-term absenteeism) tag in the student list and the intervention banner and guidance dialog on the student profile',
    stage: 'Release 2',
  },
  {
    key: 'holistic-reports',
    label: 'Holistic Reports',
    description:
      'Enable holistic development reports showing student progress across academic and character development',
    stage: 'Experiment',
  },
  {
    key: 'student-analytics-basic',
    label: 'Student Analytics',
    description:
      'Show Analytics and Profiles pages in the sidebar — attendance cohort analytics, academic analytics, and export CSV. Insight Buddy is not included.',
    stage: 'Experiment',
  },
  {
    key: 'student-analytics',
    label: 'Student Analytics with Insight buddy',
    description:
      'Show Student Analytics and Insight Buddy in the sidebar — attendance cohort analytics, academic analytics, export CSV, and AI-powered student insights',
    stage: 'Experiment',
  },
  {
    key: 'student-groups',
    label: 'Student Groups',
    description:
      'Show the Groups page in the sidebar for organising students into reusable groups',
    stage: 'Experiment',
  },
  {
    key: 'import-data',
    label: 'Import Data',
    description:
      'Show the Import Data option in the student list to upload custom fields via a guided wizard',
    stage: 'Experiment',
  },
  {
    key: 'msf-uplift-data',
    label: 'Student data from MSF via UPLIFT',
    description:
      'Show student data sourced from MSF via UPLIFT when this flag is enabled',
    stage: 'Experiment',
  },
]

function FeatureFlagsPage() {
  const { flags, setFlag } = useFeatureFlags()

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Manage feature flags for this application. Changes are stored
            locally and persist across sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {featureFlagConfigs.map((config) => (
            <div
              key={config.key}
              className="flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={config.key} className="text-sm font-medium">
                    {config.label}
                  </Label>
                  <Badge
                    variant="outline"
                    className={
                      config.stage === 'Experiment'
                        ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : undefined
                    }
                  >
                    {config.stage}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
              <Switch
                id={config.key}
                checked={flags[config.key]}
                onCheckedChange={(checked) => setFlag(config.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
