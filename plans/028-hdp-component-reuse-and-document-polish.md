# Plan 028: HDP component reuse & report-document polish — compose DS primitives, one badge system, consistent chrome

> **Executor instructions**: Follow step by step; verify each step. On any STOP condition, stop and report. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 3aa0371..HEAD -- src/components/reports/report-preview.tsx src/components/reports/pg-report-preview-dialog.tsx src/routes/reports.cycle.write.$studentId.tsx src/routes/reports.cycle.layout.tsx`
> On any change since this plan was written, compare the excerpts below to live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MEDIUM (touches the shared `report-preview.tsx`, rendered across write / layout / detail / parent-guest — 4 surfaces; visual regression is the risk, not logic).
- **Depends on**: 027 (colour hygiene) — land 027 first so this diff is chrome/component only, not colour+component tangled.
- **Planned at**: commit `3aa0371`, 2026-07-13
- **Execute via**: `tfx:design` (component/layout dimension). Run the `tfx:evaluator` verify pass afterward.
- **Baseline gates**: same as plan 027 (tsc 81 / vitest 98-24 / build 0).

## Why this matters

The single recurring divergence across the HDP area is **hand-rolled versions of components the design system already ships**: cards built as `rounded-xl border bg-card` divs instead of `ui/Card`, status/label chips built as `rounded-full px-2 py-0.5` spans instead of `ui/Badge`, and info/error panels built by hand instead of `ui/Alert`. This is a known, explicitly-deferred follow-up (see `plans/README.md` → "Primitive-reuse opportunities (~80)" and the `AGENTS.md` / `CLAUDE.md` Component Reuse Policy). It makes the HDP surfaces subtly inconsistent (different radius, border-vs-ring chrome, parallel badge palettes) and violates the repo's first rule: **reuse existing components, don't hand-roll.**

**Read the DS primitives before editing** so replacements match their real API:

- `src/components/ui/card.tsx` — note it uses `rounded-3xl` + `ring-1 ring-foreground/10` (NOT `border`). Hand-rolled cards use `rounded-xl border`. Decide per-site (see Step 1 note).
- `src/components/ui/badge.tsx` — variants + how `className` tone overrides compose (`cycle-student-table.tsx` is the reference for on-scale tone classes over `variant="default"`).
- `src/components/ui/alert.tsx` — has a `destructive` variant.

## Hard constraints

- `report-preview.tsx` is shared by 4 surfaces. After ANY change, re-verify all four render: write page (`/reports/cycle/write/36`), layout preview (`/reports/cycle/layout`), PG preview dialog (write → "Preview as parent"), and the parent guest view (share a report, open the token URL). A regression in any = STOP.
- Do NOT change colours (plan 027 owns those) except where adopting a primitive naturally replaces a colour class with the primitive's token default.
- Do NOT change copy strings except the capitalization fixes explicitly listed in Step 4 (broader copy is plan 029).
- Component reuse is mandatory (CLAUDE.md): if a `ui/*` primitive fits, use it; do not create new components.

## Step 1 — `report-preview.tsx`: hand-rolled cards → `ui/Card`

Six hand-rolled cards use `bg-card rounded-xl border px-3.5 py-4` (or `divide-x rounded-xl border` for the glance card):

- `~143` SubjectCard, `~526` GlanceCard, `~744` pupil-info card, `~886` personal-qualities, `~914` CCA, `~952` VIA.

**Decision (use judgment, keep it consistent):** `ui/Card` renders `rounded-3xl ring-1 ring-foreground/10`, which is heavier chrome than these compact document cards want. Two acceptable paths — pick ONE and apply uniformly:

- **(A, preferred)** Adopt `ui/Card` + `CardContent` for structure/consistency, passing `className` to keep the compact padding (`px-3.5 py-4`). Accept the `rounded-3xl`/ring chrome as the app-consistent look, OR
- **(B)** If `rounded-3xl` visibly breaks the dense document rhythm (verify in-browser), keep hand-rolled divs but extract ONE local `DocCard` wrapper in this file so all six share a single definition instead of six copies.

Whichever you choose, all six document cards must end up visually identical to each other. **Verify in-browser before committing** which path reads better against the rest of the app; record the choice in the plan row.

## Step 2 — `report-preview.tsx`: collapse the parallel pill system onto `ui/Badge`

`LO_PILL_CLASS` (73–80) and `QUALITY_PILL_CLASS` (82–88) plus the ScaleRow pill (~192) and conduct pill (~597) are a second badge implementation next to `ui/Badge` — which `cycle-student-table.tsx` already uses for the same status vocabulary. Colours are on-scale (lime/amber/violet), so this is structure, not colour: render these as `<Badge variant="default" className={LO_PILL_CLASS[status]}>` (the tone-class-over-Badge pattern `cycle-student-table.tsx:346` establishes), so the document and the hub share one badge component.

**Verify**: no `rounded-full px-2.5 py-0.5` pill spans remain in `report-preview.tsx` (`grep -n 'rounded-full px-2' src/components/reports/report-preview.tsx`); pills render identically to before.

## Step 3 — Hand-rolled banners/panels → `ui/Alert`; arbitrary font sizes → scale

- `reports.cycle.write.$studentId.tsx`: the "sent to parents" info banner (`~491`, `bg-twblue-3 …`) and the error banner (`~467`, `border-destructive/40 bg-destructive/5`) → `ui/Alert` (`destructive` variant for the error). The "Results not in yet" panel (`~480`) and report container (`~508`) — evaluate whether `ui/Card` fits or the hand-rolled div is load-bearing; apply Step 1's decision consistently.
- `reports.cycle.layout.tsx`: the "Editing the shared template" pill (`~420`) and "Level Head only to edit" pill (`~426`) → `ui/Badge`; the info note (`~470`) → `ui/Alert`.
- `section-layout-editor.tsx` `~103,108` and `report-preview.tsx` `~580,589`: `text-[11px]` → `text-xs` (the app's smallest scale step). `pg-report-preview-dialog.tsx` `text-[10px]` (184, 234) / `text-[11px]` (218) → `text-xs`.
- `pg-report-preview-dialog.tsx`: raw `<button>` (213 Acknowledge, 226 download) → `ui/Button` (Acknowledge: `className` for the orange-9 fill from plan 027 + `disabled`; download: `variant="outline" size="icon"`). The `rounded-[28px]`/`border-[7px]` device bezel is intentional phone-mockup geometry — keep it (it is not a content radius).

## Step 4 — Capitalization: card titles must match their section headings (sentence case)

Confirmed mismatches in `report-preview.tsx` (section heading is sentence case, inner card title is Title Case):

- `889` `Personal Qualities` → `Personal qualities` (matches heading at 881).
- `918` `Co-curricular Activities` → `Co-curricular activities` (matches heading at 909).
- `947`/`955` "Values in Action" — this is a proper programme name (MOE "Values in Action"); **leave as-is** but confirm the heading and card title agree.

(Broader page-wide capitalization + voice is plan 029; these two are here only because they are the same-component heading/title contradiction that Step 1–2's edits sit right next to.)

## Gates + bookkeeping

- `bunx tsc --noEmit` = 81 (0 new). `bunx vitest run` = 98/24 (no regression). `bun run build` exit 0.
- Targeted prettier + eslint on each touched file (never `bun run check`).
- **Browser regression pass on all four `report-preview.tsx` surfaces** (write, layout preview, PG dialog, parent guest view) + the write banners + the layout badges. Screenshot before/after each.
- Update this plan's row in `plans/README.md` including which card path (A or B) was chosen.

## STOP conditions

- Adopting `ui/Card`'s `rounded-3xl` visibly wrecks the dense document layout AND the local-`DocCard` fallback also looks wrong → STOP, capture screenshots, report.
- Any of the four shared-document surfaces regresses → STOP.
- A `ui/*` primitive doesn't exist for a case (e.g. no `RadioGroup` for the send dialog's native radios) → leave that site alone and note it; do NOT create a new component.
