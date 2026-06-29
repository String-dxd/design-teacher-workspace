'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Sticky scroll-spy navigation for the /ds page. Auto-discovers sections from
// the DOM: any element with [data-ds-section] (its label) and optional
// [data-ds-group] (its heading) becomes a nav entry, anchored by its id.
// The active entry is tracked with an IntersectionObserver as the page scrolls.

type Section = { id: string; label: string; group: string }

export function DsNav() {
  const [sections, setSections] = useState<Array<Section>>([])
  const [active, setActive] = useState('')

  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-ds-section]'),
    ).filter((el) => el.id)

    setSections(
      els.map((el) => ({
        id: el.id,
        label: el.dataset.dsSection || el.id,
        group: el.dataset.dsGroup || 'Sections',
      })),
    )
    if (els[0]) setActive(els[0].id)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )
        if (visible[0]) setActive((visible[0].target as HTMLElement).id)
      },
      { rootMargin: '0px 0px -70% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  if (!sections.length) return null

  // Group sections, preserving first-seen order.
  const groups: Array<{ name: string; items: Array<Section> }> = []
  for (const s of sections) {
    const existing = groups.find((g) => g.name === s.group)
    if (existing) existing.items.push(s)
    else groups.push({ name: s.group, items: [s] })
  }

  return (
    <nav
      aria-label="Design system sections"
      className="sticky top-6 hidden max-h-[calc(100vh-3rem)] w-52 shrink-0 self-start overflow-y-auto pr-2 lg:block"
    >
      {groups.map((group) => (
        <div key={group.name} className="mb-5">
          <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.name}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(section.id)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  className={cn(
                    'w-full truncate rounded-md px-2 py-1 text-left text-sm transition-colors',
                    active === section.id
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
