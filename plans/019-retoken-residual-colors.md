# Plan 019: Retoken the residual theme-blind colors (incl. the Button primitive)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b01d78d..HEAD -- src/components/ui/button.tsx src/components/welcome-modal.tsx src/components/forms/forms-filter-bar.tsx src/components/comms/announcement-filter-bar.tsx src/routes/announcements.new.tsx src/components/heytalia/heytalia-panel.tsx src/components/students/student-table.tsx src/components/students/attendance-analytics.tsx src/data/mock-agency-reports.ts 'src/routes/students_.$id.agency-report.new.tsx'`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (each change is visually identical in light mode by construction)
- **Depends on**: none. **Sequencing note**: plans 018/022 also edit
  `announcements.new.tsx` and 021 also edits `heytalia-panel.tsx` /
  `attendance-analytics.tsx` — execute 018 → 019 → 021 → 022 sequentially on
  rebased branches to avoid conflicts.
- **Category**: tech-debt
- **Planned at**: commit `b01d78d`, 2026-07-02

## Why this matters

The repo's color policy (plans 007–013, see `plans/010-color-sweep-overview.md`)
is: every color references a Radix scale (`slate-*`, `crimson-*`, `orange-*`,
`lime-*`, `amber-*`, `violet-*`), the `twblue` brand scale, or a shadcn
semantic token — no raw hex, no literal white/black surfaces, no Tailwind
default palette. A re-audit found a small set of survivors, the most important
being **`bg-white` inside the shared Button primitive itself** — which also
contradicts plan 010's recorded claim that "the `src/components/ui/` primitives
are already 100% token-driven". These are all latent dark-mode bugs: invisible
today (no `.dark` toggle is wired yet), white-on-dark breakage the day it is.

## Current state

Token vocabulary (from `src/styles.css`): `--background` = `slate-1`,
`--card`/`--popover` = `white` in light and `slate-2` in dark, `--muted` =
`slate-3`, `--overlay` = `rgba(0,0,0,0.8)` in BOTH modes (the sanctioned
theme-invariant black scrim). Tailwind v4 exposes these as `bg-background`,
`bg-card`, `bg-overlay`, etc. via `@theme inline` (`src/styles.css:203+`).

The violations, each verified at `b01d78d`:

1. `src/components/ui/button.tsx:15,17`:

   ```
   outline:
     'border-border bg-white hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
   secondary:
     'border-border bg-white text-secondary-foreground hover:bg-muted aria-expanded:bg-muted aria-expanded:text-secondary-foreground',
   ```

2. `src/components/welcome-modal.tsx:43` — `<DialogContent … className="max-w-xs p-0 overflow-hidden gap-0 bg-white">`.
   `DialogContent`'s own default is already the token-driven `bg-popover`
   (white in light mode) — the override is redundant in light and wrong in dark.

3. `src/components/forms/forms-filter-bar.tsx:81` and
   `src/components/comms/announcement-filter-bar.tsx:101` — both:
   `className="h-9 gap-2 aria-expanded:bg-white"` (overrides the Button
   primitive's `aria-expanded:bg-muted` to keep the trigger white while its
   popover is open).

4. `src/routes/announcements.new.tsx:2348` — photo-tile toolbar
   `bg-[oklch(0_0_0/0.75)]`; `:2430` — photo delete button
   `bg-[oklch(0_0_0/0.5)] text-white hover:bg-[oklch(0_0_0/0.7)]`.
   These arbitrary-value blacks evaded every sweep grep (the gates matched
   `#…`, `rgba(`, `bg-black` — not `oklch`). Both sit in the editable
   photo grid of `NewAnnouncementPage` (NOT inside the fenced preview mockups
   at lines ~136–907). They overlay photo thumbnails with white text/icons, so
   they must STAY dark in both themes → use the `--overlay` token, not
   `bg-foreground` (which flips to near-white in dark mode and would put white
   text on a white scrim).

5. `src/routes/announcements.new.tsx:1810-1822` — scheduled-send date/time
   inputs styled `border-twblue-6 … focus:ring-2 focus:ring-twblue-7`, while
   the SAME control in `src/routes/announcements.$id.tsx:288-298` uses the
   semantic `border-input … focus:ring-2 focus:ring-ring`. The `$id` variant
   is canonical. (The surrounding banner's `bg-twblue-3` / `text-twblue-11` /
   `text-twblue-12` classes are intentional brand accents — leave them.)

6. `src/components/heytalia/heytalia-panel.tsx:496` — input footer
   `"shrink-0 border-t bg-white px-3 pb-3 pt-2.5"`.

7. `src/components/students/student-table.tsx:754` — sticky-cell hover
   `group-hover:bg-[color-mix(in_oklab,var(--muted)_50%,white)]` — mixes
   toward literal `white`, which *lightens* in dark mode where the hover
   should stay subtle.

8. `src/components/students/attendance-analytics.tsx:602` — recharts
   `cursor={{ fill: 'rgba(0,0,0,0.04)' }}` — raw black hover cursor.

9. `src/data/mock-agency-reports.ts:118` declares `color: string` on the
   template type, with 22 off-token hex values (e.g. `:166`, `:401`, `:546`).
   Grep-verified: **no code reads `.color`** — it is a dead field carrying the
   exact off-brand palette the sweep eliminated; delete it before something
   renders it.

10. `src/routes/students_.$id.agency-report.new.tsx:2543` —
    `text-blue-900` on the cursive "Jenny Lim" signature inside the plan-012
    PDF-facsimile fence (lines ~1761–2616). Judged intentional (blue ink on a
    printed-report facsimile) but undocumented — document it, don't retoken it.

**Reviewer amendment (2026-07-02, during execution)** — the executor's live
audit found three sites the original list missed; confirmed by the reviewer
and added to scope:

11. `src/components/ui/input.tsx:11` — `bg-white` in the shared Input
    primitive → `bg-card` (same rationale as item 1; NOT `bg-input/30`, which
    would visibly change light mode).
12. `src/components/ui/sheet.tsx:31` — backdrop `bg-black/60` → `bg-overlay/75`
    (exact: 0.8 × 0.75 = 0.6 alpha).
13. `src/components/ui/dialog.tsx:34` — backdrop `bg-black/60` → `bg-overlay/75`.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Typecheck | `bunx tsc --noEmit`    | ≤41 errors, all pre-existing (baseline: 41 — 23×TS2322, 9×TS2345, 3×TS2353, 6 singles). No new codes/files. |
| Tests     | `bunx vitest run`      | 37 pass / 16 fail (pre-existing) — no new failures |
| Build     | `bun run build`        | exit 0              |
| Dev       | `bun run dev`          | serves on port 3000 |

## Scope

**In scope** (the only files you should modify):

- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx` (reviewer amendment, item 11)
- `src/components/ui/sheet.tsx` (reviewer amendment, item 12)
- `src/components/ui/dialog.tsx` (reviewer amendment, item 13)
- `src/components/welcome-modal.tsx`
- `src/components/forms/forms-filter-bar.tsx`
- `src/components/comms/announcement-filter-bar.tsx`
- `src/routes/announcements.new.tsx` (ONLY lines ~1810–1822 and ~2348/2430)
- `src/components/heytalia/heytalia-panel.tsx` (ONLY line ~496)
- `src/components/students/student-table.tsx` (line ~754)
- `src/components/students/attendance-analytics.tsx` (line ~602)
- `src/data/mock-agency-reports.ts`
- `src/routes/students_.$id.agency-report.new.tsx` (comment only, line ~2543)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look white/hex-ish):

- `bg-white` at `src/components/app-card.tsx:34,48` and
  `src/components/agency-logo.tsx:88` — intentional app-store-style white logo
  plates (agency-logo already pairs `dark:outline-white/10`).
- `bg-white` at `src/routes/groups.index.tsx:896,930` — white selected-radio
  dots on `bg-primary` (effectively `primary-foreground`); intentional.
- Everything inside the fenced preview mockups in `announcements.new.tsx`
  (lines ~136–907: `AcknowledgeMockup`/`YesNoMockup`/`AnnouncementPreview`) and
  the PDF facsimile in `agency-report.new.tsx` (~1761–2616) except the single
  comment in step 7.
- `src/lib/chart-colors.ts` (hex is a documented plan-013 decision),
  `src/styles.css` (twblue scale + `white` in `--card`/`--primary-foreground`
  are by design), HeyTalia brand artwork hex, `src/components/design-tokens.tsx`.

## Git workflow

- Branch: `advisor/019-retoken-residuals`
- Conventional commits, e.g. `fix(tokens): retoken residual theme-blind colors`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Button primitive

In `src/components/ui/button.tsx:15,17`, replace `bg-white` with `bg-card` in
both the `outline` and `secondary` variant strings. `--card` is `white` in
light mode, so light-mode pixels are **identical**; in dark mode buttons get
the `slate-2` elevated surface.

**Verify**: `grep -n 'bg-white' src/components/ui/button.tsx` → 0 matches.
`bunx tsc --noEmit` → no new errors.

### Step 2: Filter-bar triggers

In `forms-filter-bar.tsx:81` and `announcement-filter-bar.tsx:101`, replace
`aria-expanded:bg-white` with `aria-expanded:bg-card` (preserves today's
"stay white while open" behavior, now token-driven and consistent with step 1).

**Verify**: `grep -rn 'aria-expanded:bg-white' src/` → 0 matches.

### Step 3: Welcome modal

In `welcome-modal.tsx:43`, delete `bg-white` from the className (the
`DialogContent` default `bg-popover` takes over — identical in light mode).

**Verify**: `grep -n 'bg-white' src/components/welcome-modal.tsx` → 0 matches.
Run `bun run dev`, trigger the welcome modal (or render `/`) and confirm it
still has a white surface.

### Step 4: Photo-grid scrims (oklch)

In `announcements.new.tsx:2348`, replace `bg-[oklch(0_0_0/0.75)]` with
`bg-overlay` (the token is rgba(0,0,0,0.8) — imperceptible 0.05 alpha change).
At `:2430`, replace `bg-[oklch(0_0_0/0.5)]` with `bg-overlay/60` and
`hover:bg-[oklch(0_0_0/0.7)]` with `hover:bg-overlay/90` (Tailwind v4
alpha-modifies via color-mix; 0.8×0.6=0.48≈0.5, 0.8×0.9=0.72≈0.7).

**Verify**: `grep -rn 'oklch(0_0_0' src/` → 0 matches. In the dev server,
open `/announcements/new`, add a photo, confirm the dark toolbar band and the
round delete button still render dark with legible white icons.

### Step 5: Date/time inputs + heytalia footer + hover mix + chart cursor

- `announcements.new.tsx:1810-1822`: in both the date and time `<input>`
  classNames, replace `border-twblue-6` → `border-input` and
  `focus:ring-twblue-7` → `focus:ring-ring` (match
  `announcements.$id.tsx:288-298` exactly). Leave the banner's other
  `twblue-*` classes alone.
- `heytalia-panel.tsx:496`: `bg-white` → `bg-card`.
- `student-table.tsx:754`: change
  `color-mix(in_oklab,var(--muted)_50%,white)` →
  `color-mix(in_oklab,var(--muted)_50%,var(--background))`.
- `attendance-analytics.tsx:602`: change
  `cursor={{ fill: 'rgba(0,0,0,0.04)' }}` →
  `cursor={{ fill: 'color-mix(in oklab, var(--color-slate-12) 4%, transparent)' }}`.

**Verify**: `grep -n 'twblue-6\|twblue-7' src/routes/announcements.new.tsx` →
no matches on the two input lines (banner classes may remain);
`grep -n "rgba(0,0,0,0.04)" src -r` → 0 matches. Dev server: `/students` row
hover and the attendance chart hover still show a subtle highlight.

### Step 6: Delete the dead mock color field

In `src/data/mock-agency-reports.ts`: remove the `color: string` property from
the interface (line ~118) and all 22 `color: '#…'` literals from the data
objects.

**Verify**: `grep -cn "color: '#" src/data/mock-agency-reports.ts` → 0.
`bunx tsc --noEmit` → no NEW errors (if a consumer of `.color` surfaces as a
new error, that contradicts the dead-field finding → STOP condition).

### Step 7: Document the fence exception

In `agency-report.new.tsx` immediately above line ~2543, add a one-line
comment: `{/* fence exception (plan 019): blue-ink signature in the printed-report facsimile — intentionally Tailwind blue-900, permanent light-mode region */}`

**Verify**: `git diff -- 'src/routes/students_.$id.agency-report.new.tsx'`
shows ONLY the comment line.

## Test plan

No new unit tests — these are class-string changes with no logic. The
regression net is: tsc (step 6 proves the field was dead), the existing vitest
baseline, and the four dev-server visual checks named in steps 3–5.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn 'bg-white' src/components/ui/` → 0 matches
- [ ] `grep -rn 'bg-black' src/components/ui/` → 0 matches (reviewer amendment)
- [ ] `grep -rn 'oklch(0_0_0' src/` → 0 matches
- [ ] `grep -rn 'aria-expanded:bg-white' src/` → 0 matches
- [ ] `grep -c "color: '#" src/data/mock-agency-reports.ts` → 0
- [ ] `bunx tsc --noEmit` ≤41 pre-existing errors; `bunx vitest run` no new
      failures; `bun run build` exit 0
- [ ] Visual spot-checks in steps 3–5 pass (light mode)
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any "Current state" excerpt doesn't match the live code (drift).
- Step 6 produces a NEW tsc error referencing `.color` — the field has gained
  a consumer since the audit; report the consumer instead of restyling it.
- An outline/secondary button visibly changes in light mode after step 1
  (it must not — `--card` is white; if it does, `--card` was redefined).
- You find yourself wanting to edit `styles.css` or any out-of-scope
  `bg-white` site.

## Maintenance notes

- Plan 010's claim that ui/ primitives are "100% token-driven" is TRUE again
  after step 1 — if plan 010 is ever revised, note this correction.
- Sweep-gate gap: future color audits must also grep for `oklch(` arbitrary
  values, not just hex/rgba/named colors.
- Plan 012's fence line-ranges for `announcements.new.tsx` are stale (the
  preview-mockup fence actually spans ~L136–907); the plans/README Round-5
  notes record this.
- When the `.dark` toggle ships, re-run a visual pass over: buttons, filter
  bars, welcome modal, photo scrims, student-table hover, chart cursors.
