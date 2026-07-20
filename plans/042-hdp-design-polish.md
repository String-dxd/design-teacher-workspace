# Plan 042: Page-by-page design polish of the HDP module — modern, Base UI-native, app-consistent

> **Executor instructions**: This is a POLISH pass, not a redesign. Before
> touching anything: (1) read the "Design constraints" section of
> `plans/028-hdp-module-foundation.md` — binding; (2) invoke the
> `frontend-design:frontend-design` skill via the Skill tool and carry its
> guidance; (3) honor the repo's Component Reuse Policy (CLAUDE.md): do NOT
> create new components when a `src/components/ui/` primitive or existing hdp
> component composes the need. Structure/IA is owned by plans 035/039 — do
> not move sections between pages or reorder report sections. Your reviewer
> maintains `plans/README.md`.

## Status

- **Priority**: P2 (final pass before ship)
- **Effort**: M–L
- **Risk**: LOW-MED (visual-only; the risk is regression via overreach —
  the boundaries below are the control)
- **Depends on**: ALL prior HDP plans on `hdp-prototype-v2` (this is the last
  executor pass before the ship validation)

## Why this matters

The module was built plan-by-plan by different executors; it is functionally
verified but visually uneven — spacing rhythms differ per page, hierarchy
varies, some states are plainer than the app's standard. The maintainer wants
it to read as one product, matching the rest of the app (Shadcn on Base UI,
`base-maia`, Tailwind v4 tokens) but _more_ polished.

## Boundaries (binding)

- Tokens only — no raw hex/rgb; Radix scales + semantic tokens.
- Type: Inter; smallest 12px (`text-xs`); NEVER `uppercase`, NEVER mono
  labels; `tabular-nums` on aligning figures; adjacent heading steps ≥1.25×.
- Motion: ≤150–300ms, standard easing, `motion-reduce:` variants; no bounce,
  no celebratory motion near coverage/marks (P6/P7).
- Cards only for interactive units; no nested cards; one accent element class
  per screen (`--primary`); no purple gradients.
- A11y regressions are review-fatal: labels, `aria-pressed`, focus rings,
  focus order, live regions all stay.
- Do not touch: stores (`src/lib/hdp-*`), fixtures beyond copy, legacy
  non-HDP files — EXCEPT the one sanctioned bug fix below.

## The page list (work through IN ORDER, commit per page, browser-check per page)

For EACH page: capture before-state via agent-browser (accessibility snapshot

- screenshot attempt), apply the polish dimensions below, verify, commit
  `polish(hdp): <page>`.

1. `/reports` home — journey cards (icon wrappers, count lines), coverage
   strip, stage row rhythm; check the page against SLP-11 (student/journey
   focus wins the squint test).
2. `/reports/students` hub — all four tabs (Roster / Summary / Gaps /
   Requests): table density + row hover, tab bar consistency, section rhythm
   inside Summary, composer + responder cards in Gaps/Requests.
3. `/reports/students/$studentId` river — stream rhythm, pattern-card accent
   weight, mix-bar legend, header meta.
4. `/reports/tag` + the global overlay — chip rows, search list, recent
   stream, mobile sheet feel.
5. `/reports/drafts` hub + `/reports/drafts/$studentId` workspace — left
   rail (aria-current styling), marks grid alignment, claim editor rows,
   SourceTag chips, sync strip.
6. `/reports/release` — table, stage-aware actions, preview region + register
   toggle, share-link row.
7. `/hdp-report/$token` (parent, BOTH registers A and B via the
   `reports-hdp-future` flag) — reading measure, section dividers,
   acknowledgement block, print-adjacent restraint. This page is the
   maintainer's headline — spend the most care here.
8. `/hdp-student/$token` (student reflect route, if plan 038/041 landed) —
   reflection block warmth, saved states.

## Polish dimensions (apply per page, from the frontend-design skill +

`make-interfaces-feel-better` sensibilities)

- **Spacing rhythm**: consistent vertical cadence (multiples of 4; section
  gaps consistent across pages — pick the app's dominant `gap-6`/`gap-8`
  pattern and unify).
- **Hierarchy**: one clear focal element per screen; meta text uniformly
  `text-muted-foreground text-sm`/`text-xs`; kickers consistent.
- **Tables**: unified cell padding, right-aligned numerics, `tabular-nums`,
  consistent empty-cell "—".
- **Interactive states**: every clickable has visible hover (border/bg shift,
  no scale blooms) + `focus-visible` ring; disabled states carry title text
  where the reason isn't obvious.
- **Empty states**: all use `EmptyState` with an icon + one action; no bare
  "No data" paragraphs.
- **Transitions**: overlay/panel enter ≤150ms fade/scale; tab switches
  instant (no artificial animation); `motion-reduce` everywhere motion exists.
- **Copy nits**: sentence case everywhere; date formats consistent
  (`16 Jul 2026`); no double spaces; toast copy consistent verb-first.

## Sanctioned bug fix (one, from plan 034's review record)

`src/components/reports/report-table.tsx` row-click navigates to
`/reports/$id` — a route that does not exist (pre-existing; found during 034
browser QA). Fix the navigation target to `/holistic-reports/$id` (verify
that route renders the same record first). One commit, `fix(reports): …`.

## Gates

Baselines from the last review record in `plans/README.md` (verify + record
first). tsc: no new errors. vitest: unchanged. build 0. Per-page browser
checks pass. Final full-module grep set:
`grep -rn "uppercase\|font-mono\|animate-bounce\|dangerouslySetInnerHTML" src/components/hdp src/routes/reports.* src/routes/_guest.hdp-*` → no hits
(comments excepted).

## Browser verification (after the last page)

One end-to-end pass at 1280px AND 375px through the full funnel (home → tag →
river → gaps/requests → draft w/ marks → release → parent A → flip flag →
parent B → student reflect), confirming no functional regressions and
consistent visual rhythm. Note anything you saw but did NOT change (report,
don't creep).

## STOP conditions

- A polish item requires structural change (moving sections, new routes) —
  report; that belongs to a plan, not a polish pass.
- The frontend-design skill is unavailable to you — proceed with the
  boundaries + dimensions above and say so in the report.
- Any gate regresses and the cause isn't your last commit — stop, report.

## Maintenance notes

- This pass defines the module's visual baseline; future plans should match
  it (spacing cadence, table treatment, state styling).
- Anything reported-but-not-changed feeds the next critique round.
