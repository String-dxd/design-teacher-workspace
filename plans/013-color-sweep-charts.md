# Plan 013: Color-token sweep — charts & SVG (Phase 11, the deferred chart/SVG literals)

> **Executor instructions**: READ `plans/010-color-sweep-overview.md` FIRST, then
> `src/lib/chart-colors.ts` in full — it is the canonical chart-palette module and the
> centralization target for this plan. The build CANNOT validate chart color; the
> **MANDATORY gate here is a per-chart light+dark visual review**. If a "STOP
> conditions" item occurs, stop and report. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 6e3d7e5..HEAD -- src/lib/chart-colors.ts src/components/reports/radar-chart.tsx src/components/students/academic-analytics.tsx src/components/students/attendance-analytics.tsx`

## Status

- **Priority**: P3 (visual polish + dark-mode completeness; charts work today)
- **Effort**: M–L (≈90 chart/SVG literals, but concentrated and centralizable)
- **Risk**: **HIGH** — SVG props take no Tailwind class, only var()/color-mix; correctness is eyeball-only
- **Depends on**: plans 010 (reference), 011, **and 012** (the two analytics files'
  non-chart drift must be fixed first — this plan re-touches them for charts only)
- **Category**: tech-debt / design
- **Planned at**: commit `6e3d7e5`, 2026-06-30

## Why this matters

Recharts/SVG color lives in `fill=`/`stroke=` props and inline styles, which **cannot
take Tailwind classes** — so every earlier phase deferred it here. Two facts shape the
strategy:

1. **There is already a canonical chart palette**: `src/lib/chart-colors.ts` exports
   `CATEGORICAL_6` and `CATEGORICAL_COLORS` (verified at `6e3d7e5`), with documented
   usage rules. `academic-analytics.tsx` already imports `CATEGORICAL_6` (but the audit
   found it largely unused — scattered ad-hoc hexes are used instead).
2. **That module explicitly reserves semantic chart colors** — its header says do NOT
   use the categorical palette for *attendance severity* (`red/orange/yellow`), the
   *"Present" ring* (`#12b886`), or *grade diverging scales*. Those reserved hexes are
   **intentional, not drift.**

So the DS-correct move is **centralize, don't scatter**: pull the loose chart hexes into
named exports in `chart-colors.ts` (referencing Radix `var(--color-*)` where the role is
a brand/neutral one, or kept as documented reserved hexes where design intends an exact
hue), and have the chart components import those names. This replaces ~90 inline
literals with a handful of named, themeable constants in one reviewable file.

## Strategy (decide the 3 buckets, then apply)

For every chart literal, classify it:

- **(A) Neutral chrome** — gridlines, axes, tick labels, tooltip borders
  (`#e9ecef`, `#e5e7eb`, `#dee2e6`, `#868e96`, `#495057`, `#adb5bd`). → map to slate via
  `var(--color-slate-4)` (grid), `var(--color-slate-6)` (tooltip border),
  `var(--color-slate-9/11)` (ticks), `var(--color-slate-12)` (bar labels). Add named
  exports `CHART_GRID`, `CHART_AXIS`, `CHART_TICK`, `CHART_LABEL` to `chart-colors.ts`.
- **(B) Reserved semantic** — attendance severity (`#e03131`→crimson, `#f76707`→orange),
  the "Present" ring (`#12b886`→lime), grade scales. These are documented reserved
  scales. Add named exports (`ATTENDANCE_SEVERITY`, `PRESENT_RING`, `GRADE_FILL`) defined
  as `var(--color-crimson-9)` / `var(--color-orange-9)` / `var(--color-lime-9)` etc.
  **— this is the one place to get design sign-off on whether to adopt the Radix step or
  keep the exact reserved hex.**
- **(C) Categorical series** — multi-series bars/lines. → use `CATEGORICAL_6` in order
  (it already exists); delete the ad-hoc per-series hexes. Decide with design whether
  `CATEGORICAL_6` (Spectrum-muted) or `CATEGORICAL_COLORS` (brand-anchored) is the set
  (decision CHART-NOW open sub-question).

> **ALPHA (decision)**: translucent chart fills (`${color}18`-style hex concat,
> `rgba(18,184,134,…)`) → `color-mix(in srgb, var(--color-X-9) N%, transparent)`. Never a
> non-twblue `-aN` utility. The `AGENT_PURPLE`/`agent.color` alpha-concat in
> `heytalia-panel.tsx` (`${color}18`) **breaks under a plain var() swap** — replace with
> `color-mix(... var(--color-violet-9) 9%, transparent)` or `bg-violet-3`.

## Scope — files

- `components/reports/radar-chart.tsx` — `COLORS` map: green stroke `#12b886` → lime
  (present/success), pink stroke `#f26c47` → **orange** (decision BRAND: this "pink" is
  coral report-orange, NOT pink→crimson); grid strokes `#e5e7eb` → `CHART_GRID`.
- `components/reports/core-values-section.tsx` — passes `colorScheme='pink'` to
  radar-chart; once radar-chart's `pink` scheme resolves to orange, this is consistent.
  Confirm cross-file.
- `components/students/academic-analytics.tsx` — `BAR_COLORS`, `GRADE_FILL`,
  `CartesianGrid stroke`, all `<Bar fill=>`; adopt `CATEGORICAL_6` for the term series,
  `CHART_*` for chrome, `GRADE_FILL` export for grades.
- `components/students/attendance-analytics.tsx` — the `typeColor` severity map
  (`#e03131`/`#f76707`), box-plot/ring/line strokes → `ATTENDANCE_SEVERITY` + `CHART_*`.
- `components/insight-buddy.tsx` — 2 chart fills (`#228be6`→`var(--color-twblue-9)`,
  `#12b886`→`var(--color-lime-9)` or `PRESENT_RING`).
- `routes/_guest.preview-menu.tsx` — ~18 inline-style hexes → map per bucket (mostly
  neutral chrome + brand).
- `components/heytalia/heytalia-panel.tsx` — the mascot SVG `#9575CD` and `AGENTS[].color`
  are **brand artwork; LEAVE per plan 008**. Only the `${color}18` alpha-concat that
  feeds a *background tint* (not the logo) gets the `color-mix` treatment. If every
  `#9575CD` is logo/agent artwork, this file's residual is intentional — document it.

## Steps

### Step 1: Extend `src/lib/chart-colors.ts` with named semantic exports

Add `CHART_GRID`, `CHART_AXIS`, `CHART_TICK`, `CHART_LABEL`, `ATTENDANCE_SEVERITY`
(`{ excused, unexcused, late }` or the actual keys), `PRESENT_RING`, and `GRADE_FILL`
as exported constants, each `= 'var(--color-<scale>-<step>)'` per the buckets above.
Match the file's existing export style and its documentation-comment convention.

**Verify**: `bun run build` → 0; `grep -c "export const CHART_GRID" src/lib/chart-colors.ts` → 1.

### Step 2: Replace inline literals with the named imports, file by file

For each scope file: import the new constants, replace each `fill=`/`stroke=`/inline-style
hex with the matching constant, and adopt `CATEGORICAL_6` for categorical series.

**Verify (per file)**: RAW-HEX grep → 0 (or only documented artwork residuals like
heytalia `#9575CD`); NO-STRAY-ALPHA → empty; `bun run build` → 0.

### Step 3: Re-run the giant-file gates (double-touch guard)

For `academic-analytics.tsx` and `attendance-analytics.tsx`, re-run plan 012's PALETTE
and DARK-HAZARD gates → still 0. This phase must not have re-introduced palette drift.

### Step 4: MANDATORY visual review (the real gate)

`bun run dev`. Open every touched chart in **light AND dark mode** and eyeball:
- bars, donut/ring, box-plot, line, radar render with intended, distinguishable hues;
- gridlines/axes/ticks are visible but recessive in both themes;
- attendance severity reads red/orange as before; the Present ring reads green;
- the HeyTalia mascot is unchanged.

Screenshot each chart in both themes and attach to the report.

## Commands you will need

See `plans/010` §gates. Plus per-file `grep -nE '#[0-9a-fA-F]{3,6}|rgba?\(' <file>` to
track the hex residual to 0/documented.

## Done criteria

- [ ] `chart-colors.ts` exports the new `CHART_*` / `ATTENDANCE_SEVERITY` / `PRESENT_RING`
      / `GRADE_FILL` constants; `bun run build` → 0.
- [ ] Every scope file imports them; RAW-HEX grep → 0 except documented artwork
      (heytalia `#9575CD`) and any design-approved reserved hex.
- [ ] NO-STRAY-ALPHA → empty; `${color}18`-style concats replaced with `color-mix()`.
- [ ] `academic-analytics` + `attendance-analytics` PALETTE/DARK-HAZARD gates still 0.
- [ ] `tsc` = 113; `bunx vitest run` 37/16.
- [ ] Visual review done in both themes for every chart; screenshots attached.
- [ ] `plans/README.md` row updated.

## STOP conditions

In addition to 010 §"Global STOP conditions":

- You cannot tell whether a hex is categorical-series, reserved-semantic, or neutral
  chrome → STOP and ask; mis-bucketing flattens or mis-hues a chart.
- A chart renders visibly differently (wrong hue, invisible series, washed-out ticks) in
  either theme after the swap → STOP.
- `CATEGORICAL_6` vs `CATEGORICAL_COLORS` adoption isn't decided by design → keep the
  existing per-series hexes for that chart and report (don't guess the set).
- Touching `#9575CD` would alter the HeyTalia mascot artwork → leave it (plan 008).

## Maintenance notes

- After this, all chart color flows through `src/lib/chart-colors.ts`. New charts import
  from there; no inline hex. The reserved-semantic exports are the single place to retune
  attendance/grade/present hues.
- This is the phase that makes dark mode fully safe — once it lands, the feature surface
  has no theme-blind color left (outside the documented document/preview fences in 012).
- Revisit `CATEGORICAL_6` vs `CATEGORICAL_COLORS`: the repo ships both; consolidating to
  one (and deleting the unused one) is a small follow-up worth doing.
