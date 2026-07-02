'use client'

import { Fragment, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Page content for /ds — a living reference of the design tokens defined in
// src/styles.css. Like component-gallery.tsx, this is a showcase module composed
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
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-xl font-semibold text-foreground">Design Tokens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Semantic Shadcn tokens and the Radix / brand scales they map to.
          Source: <code className="font-mono text-xs">src/styles.css</code>.
        </p>
      </header>

      <Card
        id="semantic-tokens"
        data-ds-section="Semantic tokens"
        data-ds-group="Design Tokens"
        className="mb-6 scroll-mt-6"
      >
        <CardHeader>
          <CardTitle>Semantic tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9 w-20">Preview</TableHead>
                  <TableHead className="h-9">Token</TableHead>
                  <TableHead className="h-9">Maps to</TableHead>
                  <TableHead className="h-9 text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SEMANTIC_GROUPS.map((group) => (
                  <Fragment key={group.title}>
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={4}
                        className="bg-muted/50 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {group.title}
                      </TableCell>
                    </TableRow>
                    {group.tokens.map((token) => (
                      <TableRow key={token.name}>
                        <TableCell className="py-2">
                          <div
                            data-tok={token.name}
                            className="h-7 w-10 rounded-md border border-border"
                            style={{ backgroundColor: `var(${token.name})` }}
                          />
                        </TableCell>
                        <TableCell className="py-2 font-mono text-xs text-foreground">
                          {token.name}
                        </TableCell>
                        <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                          {token.maps}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                          {resolved[token.name] ?? ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-4 font-mono text-[11px] text-muted-foreground">
            --radius-input: 14px&nbsp;&nbsp;·&nbsp;&nbsp;--overlay:
            rgba(0,0,0,0.8)
          </p>
        </CardContent>
      </Card>

      <Card
        id="color-scales"
        data-ds-section="Color scales"
        data-ds-group="Design Tokens"
        className="scroll-mt-6"
      >
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
  )
}
