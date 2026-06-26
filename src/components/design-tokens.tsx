'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Page content for /ds — a living reference of the design tokens defined in
// src/styles.css. Like component-example.tsx, this is a showcase module composed
// from existing primitives, not a reusable component.

// Semantic Shadcn tokens grouped by role, with the Radix/brand scale each maps
// to. Mirrors the :root block in src/styles.css — keep in sync if tokens change.
const SEMANTIC_GROUPS: Array<{
  title: string
  tokens: Array<{ name: string; maps: string }>
}> = [
  {
    title: 'Surfaces',
    tokens: [
      { name: '--background', maps: 'slate-1' },
      { name: '--foreground', maps: 'slate-12' },
      { name: '--card', maps: 'white' },
      { name: '--card-foreground', maps: 'slate-12' },
      { name: '--popover', maps: 'white' },
      { name: '--popover-foreground', maps: 'slate-12' },
    ],
  },
  {
    title: 'Brand & actions',
    tokens: [
      { name: '--primary', maps: 'twblue-9' },
      { name: '--primary-foreground', maps: 'white' },
      { name: '--secondary', maps: 'slate-3' },
      { name: '--secondary-foreground', maps: 'slate-12' },
      { name: '--ring', maps: 'twblue-8' },
    ],
  },
  {
    title: 'Muted & accent',
    tokens: [
      { name: '--muted', maps: 'slate-3' },
      { name: '--muted-foreground', maps: 'slate-11' },
      { name: '--accent', maps: 'slate-4' },
      { name: '--accent-foreground', maps: 'slate-12' },
    ],
  },
  {
    title: 'Feedback & form',
    tokens: [
      { name: '--destructive', maps: 'crimson-9' },
      { name: '--destructive-foreground', maps: 'white' },
      { name: '--border', maps: 'slate-6' },
      { name: '--input', maps: 'slate-7' },
    ],
  },
  {
    title: 'Sidebar',
    tokens: [
      { name: '--sidebar', maps: 'slate-2' },
      { name: '--sidebar-foreground', maps: 'slate-12' },
      { name: '--sidebar-primary', maps: 'twblue-9' },
      { name: '--sidebar-primary-foreground', maps: 'white' },
      { name: '--sidebar-accent', maps: 'slate-3' },
      { name: '--sidebar-accent-foreground', maps: 'slate-12' },
      { name: '--sidebar-border', maps: 'slate-6' },
      { name: '--sidebar-ring', maps: 'twblue-8' },
    ],
  },
  {
    title: 'Charts',
    tokens: [
      { name: '--chart-1', maps: 'twblue-5' },
      { name: '--chart-2', maps: 'twblue-7' },
      { name: '--chart-3', maps: 'twblue-8' },
      { name: '--chart-4', maps: 'twblue-9' },
      { name: '--chart-5', maps: 'twblue-11' },
    ],
  },
]

// 12-step scales registered as Tailwind utilities in @theme inline.
const SCALES: Array<{ name: string; label: string }> = [
  { name: 'twblue', label: 'brand — T&S Blue (hand-defined)' },
  { name: 'slate', label: 'neutral (Radix)' },
  { name: 'crimson', label: 'destructive (Radix)' },
  { name: 'violet', label: 'accent (Radix)' },
  { name: 'orange', label: 'status (Radix)' },
  { name: 'amber', label: 'status (Radix)' },
  { name: 'lime', label: 'status (Radix)' },
]

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const ALPHA_STEPS = STEPS.map((s) => `a${s}`)

// Read each swatch's resolved background-color after mount (CSS vars resolve to
// rgb in getComputedStyle). Keyed by the swatch's data-tok value.
function useResolvedColors() {
  const [resolved, setResolved] = useState<Record<string, string>>({})
  useEffect(() => {
    const map: Record<string, string> = {}
    document.querySelectorAll<HTMLElement>('[data-tok]').forEach((el) => {
      const key = el.dataset.tok
      if (key) map[key] = getComputedStyle(el).backgroundColor
    })
    setResolved(map)
  }, [])
  return resolved
}

function SemanticRow({
  name,
  maps,
  resolved,
}: {
  name: string
  maps: string
  resolved: Record<string, string>
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div
        data-tok={name}
        className="h-9 w-9 shrink-0 rounded-md border border-border"
        style={{ backgroundColor: `var(${name})` }}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-xs text-foreground">{name}</div>
        <div className="truncate font-mono text-[11px] text-muted-foreground">
          → {maps}
        </div>
      </div>
      <code className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
        {resolved[name] ?? ''}
      </code>
    </div>
  )
}

function ScaleRow({
  name,
  label,
  steps,
}: {
  name: string
  label: string
  steps: Array<number | string>
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="font-mono text-sm font-medium text-foreground">
          {name}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-6 gap-1 md:grid-cols-12">
        {steps.map((s) => (
          <div key={s} className="flex flex-col items-center gap-1">
            <div
              className="h-10 w-full rounded border border-border"
              style={{ backgroundColor: `var(--${name}-${s})` }}
              title={`--${name}-${s}`}
            />
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DesignTokens() {
  const resolved = useResolvedColors()

  return (
    <div className="w-full bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-xl font-semibold text-foreground">Design Tokens</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semantic Shadcn tokens and the Radix / brand scales they map to.
            Source:{' '}
            <code className="font-mono text-xs">src/styles.css</code>.
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Semantic tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {SEMANTIC_GROUPS.map((group) => (
                <section key={group.title}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </h3>
                  <div className="space-y-0.5">
                    {group.tokens.map((token) => (
                      <SemanticRow
                        key={token.name}
                        name={token.name}
                        maps={token.maps}
                        resolved={resolved}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <p className="mt-6 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
              --radius-input: 14px&nbsp;&nbsp;·&nbsp;&nbsp;--overlay:
              rgba(0,0,0,0.8)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color scales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {SCALES.map((scale) => (
                <ScaleRow
                  key={scale.name}
                  name={scale.name}
                  label={scale.label}
                  steps={STEPS}
                />
              ))}
              <ScaleRow
                name="twblue"
                label="brand alpha (over the page background)"
                steps={ALPHA_STEPS}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
