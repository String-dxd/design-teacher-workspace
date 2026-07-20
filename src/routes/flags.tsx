import { createFileRoute } from '@tanstack/react-router'

import type {
  FeatureFlagKey,
  FeatureFlagMeta,
  FeatureFlagStage,
} from '@/lib/feature-flags'
import {
  FEATURE_FLAG_MODULES,
  FEATURE_FLAG_REGISTRY,
  useFeatureFlags,
} from '@/lib/feature-flags'
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

const flagEntries = Object.entries(FEATURE_FLAG_REGISTRY) as Array<
  [FeatureFlagKey, FeatureFlagMeta]
>

const STAGE_ORDER: Record<FeatureFlagStage, number> = {
  'Release 2': 0,
  'Release 3': 1,
  Experiment: 2,
}

const flagGroups = FEATURE_FLAG_MODULES.map((module) => {
  const moduleEntries = flagEntries.filter(
    ([, meta]) => meta.module === module.id,
  )
  const parents = moduleEntries
    .filter(([, meta]) => !meta.parent)
    .sort(([, a], [, b]) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage])
  const children = moduleEntries.filter(([, meta]) => meta.parent)

  // Each top-level entry followed by its children (registry order),
  // preserving the existing per-module stage ordering for parents.
  const ordered = parents.flatMap((entry) => {
    const [parentKey] = entry
    const childEntries = children.filter(
      ([, meta]) => meta.parent === parentKey,
    )
    return [entry, ...childEntries]
  })

  return { ...module, flags: ordered }
})

function FeatureFlagsPage() {
  const { flags, setFlag } = useFeatureFlags()

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
        <p className="text-sm text-muted-foreground">
          Manage feature flags for this application. Changes are stored locally
          and persist across sessions.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        {flagGroups.map((group) =>
          group.flags.length === 0 ? null : (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.label}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {group.flags.map(([key, meta]) => {
                  const parentOff = meta.parent ? !flags[meta.parent] : false
                  return (
                    <div
                      key={key}
                      className={
                        meta.parent
                          ? 'ml-6 flex items-center justify-between gap-4 border-l pl-4'
                          : 'flex items-center justify-between gap-4'
                      }
                    >
                      <div
                        className={
                          parentOff ? 'space-y-0.5 opacity-50' : 'space-y-0.5'
                        }
                      >
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor={key} className="text-sm font-medium">
                            {meta.label}
                          </Label>
                          <Badge
                            variant="outline"
                            className={
                              meta.stage === 'Experiment'
                                ? 'border-violet-6 bg-violet-3 text-violet-11'
                                : undefined
                            }
                          >
                            {meta.stage}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {meta.description}
                        </p>
                      </div>
                      <Switch
                        id={key}
                        checked={flags[key]}
                        disabled={parentOff}
                        onCheckedChange={(checked) => setFlag(key, checked)}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </div>
  )
}
