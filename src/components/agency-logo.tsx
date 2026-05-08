import { useState } from 'react'

import { getAgencyLogo } from '@/data/mock-agency-reports'
import { cn } from '@/lib/utils'

// Single source of truth for agency-branded tile rendering. Mirrors the TW
// app-shelf logo treatment (size-16 rounded-[14px] border bg-white) but
// scales to inline-meta or page-header sizes via the `size` prop. Falls
// back to a deterministic acronym swatch when the logo asset is missing.

function agencyAcronym(name: string): string {
  const words = name.replace(/[(),]/g, ' ').split(/\s+/).filter(Boolean)
  const skip = new Set(['of', 'and', 'the', 'for'])
  const letters = words
    .filter((w) => !skip.has(w.toLowerCase()))
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return letters.slice(0, 4) || name.slice(0, 2).toUpperCase()
}

function agencyTint(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  const hues = [
    '#0064ff',
    '#7c3aed',
    '#16a34a',
    '#ea580c',
    '#db2777',
    '#0891b2',
  ]
  return hues[Math.abs(hash) % hues.length]
}

export type AgencyLogoSize = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<
  AgencyLogoSize,
  { box: string; radius: string; pad: string; text: string }
> = {
  // sm: inline-meta on report-card rows in the student profile.
  sm: {
    box: 'size-9',
    radius: 'rounded-[10px]',
    pad: 'p-1',
    text: 'text-[10px]',
  },
  // md: page header on the Fill Report top bar.
  md: {
    box: 'size-11',
    radius: 'rounded-[12px]',
    pad: 'p-1.5',
    text: 'text-xs',
  },
  // lg: parity with the TW app-shelf tile.
  lg: {
    box: 'size-16',
    radius: 'rounded-[14px]',
    pad: 'p-2',
    text: 'text-sm',
  },
}

export function AgencyLogo({
  agency,
  size = 'sm',
  className,
}: {
  agency: string
  size?: AgencyLogoSize
  className?: string
}) {
  const [src, setSrc] = useState<string | undefined>(() =>
    getAgencyLogo(agency),
  )
  const acronym = agencyAcronym(agency)
  const tint = agencyTint(agency)
  const s = SIZE_CLASSES[size]

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border bg-white',
        s.box,
        s.radius,
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className={cn('h-full w-full object-contain', s.pad)}
          onError={() => setSrc(undefined)}
        />
      ) : (
        <span
          className={cn(
            'flex h-full w-full items-center justify-center font-semibold tracking-tight text-white',
            s.text,
          )}
          style={{ backgroundColor: tint }}
          aria-hidden
        >
          {acronym}
        </span>
      )}
    </div>
  )
}
