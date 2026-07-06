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
    key: 'hdp-reports',
    label: 'HDP Reports',
    description:
      'Show all Holistic Development reporting: the P1–P2 reporting-cycle hub (class + term picker, two-stage layout/write builder with inline Smart Compose), the parents-first share flow, template management via ?mode=template, and the Holistic Reports section on the student profile. Off hides all of it.',
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
    stage: 'Release 2',
  },
  {
    key: 'reports',
    label: 'Reports',
    description: 'Show the Reports page in the sidebar under Manage',
    stage: 'Release 2',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    description: 'Show the Calendar page in the sidebar under Manage',
    stage: 'Release 2',
  },
  {
    key: 'meetings',
    label: 'Meetings',
    description: 'Show the Meetings page in the sidebar under Manage',
    stage: 'Release 2',
  },
  {
    key: 'posts-admin-view',
    label: 'Posts — Admin view',
    description:
      'Show a "Posts (Admin)" sidebar link that renders the Posts page with admin layout at /announcements?view=admin',
    stage: 'Release 2',
  },
  {
    key: 'reports-admin-view',
    label: 'Reports — Admin view',
    description:
      'Show a "Reports (Admin)" sidebar link that renders the Reports page with admin layout at /reports?view=admin',
    stage: 'Release 2',
  },
  {
    key: 'import-data',
    label: 'Import Data',
    description:
      'Show the Import Data option in the student list to upload custom fields via a guided wizard',
    stage: 'Experiment',
  },
  {
    key: 'agency-reports',
    label: 'Agency Reports',
    description:
      'Show the Agency Reports subsection on the student profile and enable the Agency Report generation wizard (template picker, Fill Report with split-pane template reference, Review & Submit, Export)',
    stage: 'Experiment',
  },
  {
    key: 'report-generation',
    label: 'Report Generation',
    description:
      "Agency reports only. Allow new agency reports to be generated. When off, existing reports stay visible on the student profile but the '+ New Agency Report' button and the wizard entry point are hidden",
    stage: 'Experiment',
  },
  {
    key: 'msf-uplift-data',
    label: 'Student data from MSF via Uplift Office',
    description:
      'Show student data sourced from MSF via Uplift Office when this flag is enabled',
    stage: 'Experiment',
  },
  {
    key: 'date-range-filter',
    label: 'Date range filter',
    description:
      'Show the Date range selector in the student list filter bar for filtering data by period',
    stage: 'Experiment',
  },
  {
    key: 'attention-tag',
    label: 'Attention tag',
    description:
      'Show the Attention tag column in the student list with tags such as LTA, SEN, and FAS',
    stage: 'Experiment',
  },
  {
    key: 'column-visibility',
    label: 'Show/hide columns',
    description:
      'Show the Show/hide columns control in the student list to toggle which columns are visible',
    stage: 'Experiment',
  },
  {
    key: 'overall-percentage',
    label: 'Overall % across selected subjects',
    description:
      'Show the Overall % across selected subjects field in the student list column, student profile, filters, and group-by dropdown',
    stage: 'Experiment',
  },
  {
    key: 'social-links',
    label: 'Social links',
    description:
      'Show the Social links field in the student list column, student profile, filters, and group-by dropdown',
    stage: 'Experiment',
  },
  {
    key: 'export',
    label: 'Export',
    description:
      'Show the Export data option in the student list to export student data',
    stage: 'Experiment',
  },
  {
    key: 'primary-contact',
    label: 'Primary contact',
    description:
      'Show the Primary contact button in the student profile header and the Primary contact field in the Family section',
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
                        ? 'border-violet-6 bg-violet-3 text-violet-11'
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
