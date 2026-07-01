# Plan 010: Feature-wide color-token sweep — OVERVIEW & canonical mapping

> **This is the shared reference for plans 011–013.** It is not executed on its
> own — it defines the canonical Tailwind→token mapping, the resolved design
> decisions, the shared verification gates, and the phase order that plans
> 011, 012, and 013 all depend on. An executor running any of those plans
> should read THIS file first, then their phase plan.
>
> **Planned at**: commit `6e3d7e5`, 2026-06-30 (Round 3).

## Status

- **Priority**: P2 (design-system consistency + dark-mode readiness; no live bug)
- **Effort**: L (≈580–800 edits across 60 files; split into 3 executable plans)
- **Risk**: MED overall (LOW for 011, HIGH for the giant files in 012 and the charts in 013)
- **Depends on**: plans 007–009 (DONE — token foundation). Nothing else.
- **Category**: tech-debt / design

## Why this matters

The `src/components/ui/` primitives are already 100% token-driven on `@base-ui/react`,
and `src/styles.css` exposes a clean 3-layer token bridge (Radix Colors → shadcn
semantic tokens → Tailwind v4 `@theme inline`). But **~580–800 color usages in 60
feature files bypass that system** — they hardcode Tailwind's *default* palette
(`bg-blue-100`, `text-green-700`, …) and raw hex/rgba instead of the repo's Radix
scales and semantic tokens.

Two concrete costs:

1. **Dark-mode is a latent landmine.** The dark tokens exist in `styles.css` but no
   `.dark` toggle is wired yet. ~175 literal `bg-white` / `text-white` / `bg-black`
   usages will *not* flip when dark mode is switched on — they will render
   white-on-white or invisible-on-dark.
2. **Drift from the design system.** Tailwind-default hues (`blue`, `green`, `red`,
   `purple`) are not the brand scales (`twblue`, `lime`, `crimson`, `violet`), so the
   UI is subtly off-brand and inconsistent screen to screen.

After this sweep: feature code consumes the same tokens the primitives do, dark mode
becomes safe to enable, and the only remaining literals are deliberate, documented
brand/chart/document-fidelity colors.

> **Round-3 note for reconcilers**: The README's Round-2 "discovered regression"
> explicitly deferred this work ("~30 Tailwind-default `purple-*` usages remain… a
> follow-up plan if wanted"). Plans 010–013 ARE that follow-up, widened to the full
> palette after a 60-file audit. The token *registration* work (slate-3..12, violet,
> `--destructive-foreground`) is already DONE in plan 007/008 — every token this plan
> proposes already resolves; this is purely consumer-side class/prop swaps.

## The token vocabulary (all confirmed to resolve at `6e3d7e5`)

- **Radix scales** as Tailwind utilities, steps `1..12`: `slate`, `twblue` (+ alpha
  `twblue-a1..a12`), `crimson`, `orange`, `lime`, `amber`, `violet`.
- **Semantic shadcn tokens** as utilities: `background`, `foreground`, `card`(+`-foreground`),
  `popover`(+`-foreground`), `primary`(+`-foreground`), `secondary`(+`-foreground`),
  `muted`(+`-foreground`), `accent`(+`-foreground`), `destructive`(+`-foreground`),
  `border`, `input`, `ring`, `chart-1..5`, `sidebar*`.
- `--destructive` = `crimson-9`; `--destructive-foreground` = `white`. There is **no**
  `red`/`green`/`blue` Radix scale imported — the brand blue is **`twblue`**.

### Radix step semantics (how Tailwind 50–950 maps to Radix 1–12)

Follow the precedent set by plan 008 (`bg-violet-50→3`, `ring-violet-200→6`,
`text-violet-600→11`). Map **by role**, not by arithmetic:

| Tailwind step | Radix step | Role |
|---|---|---|
| 50 | 1–2 | app/page background tint |
| 50 / 100 | 3 | subtle component background (badge bg, tint) |
| 100 / 200 | 4 | hover background |
| 200 | 5 | active/selected background |
| 200 / 300 | 6 | subtle border / ring |
| 300 / 400 | 7–8 | UI border / strong border |
| 500 / 600 | 9 | solid fill (the "vivid" step) |
| 600 / 700 | 10 | solid hover |
| 600 / 700 | 11 | low-contrast colored **text** |
| 800 / 900 | 12 | high-contrast colored text |

## Canonical mapping (DECISIONS BAKED IN — this is the executor's lookup table)

> Apply **semantic tokens first** when the color expresses a role
> (surface/border/muted/primary/destructive). Fall back to a raw Radix scale step
> only when no semantic token fits.

| From (Tailwind default / hex) | To (repo token) | Notes |
|---|---|---|
| `gray/zinc/neutral/stone-*`, Tailwind `slate-50..900` | **semantic first**: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-secondary`, `bg-accent`, `border-border`, `border-input`, `text-foreground`, `text-muted-foreground`; else raw `slate-1..12` | Tailwind `slate-50..900` do NOT resolve (Radix slate is `1..12`). Drag-handle `bg-slate-200`→`bg-border`; neutral badge→`bg-muted`. |
| `blue/sky/indigo-*` | `twblue-*` (links/info text → `twblue-11`) | No blue Radix scale; brand blue is `twblue`. |
| `blue-*` as **CTA fill / active toggle** | `primary` + `primary-foreground` | So the paired `text-white` becomes `primary-foreground` and flips in dark mode. |
| `green/emerald/teal-*` | `lime-*` (badge `bg-lime-3` / `text-lime-11`, solid `lime-9`) | No green scale; success → lime. **Exception: report-table triplet — see GD-DISTINCT.** |
| `red/rose-*` (status / value indicator) | `crimson-*` (`bg-crimson-3` / `text-crimson-11` / solid `crimson-9`) | Negative/No/decline values; tonal parity with the lime success pills. |
| `red/rose-*` (destructive **action** / error) | `destructive` + `destructive-foreground` | Delete buttons, error text, invalid-input borders, required asterisks, overdue states. |
| `pink-*` | **`crimson-*`** (decision PINK) | Uniform: unread dots, decorative tints, all → crimson. (`#f26c47` "pink" is actually coral — see BRAND.) |
| `purple/violet/fuchsia-*` | `violet-*` | `twpurple` was retired (plan 008). 'Experiment'/AI badges → violet. |
| `cyan-*` (in-app icons) | **`twblue-*`** (decision CYAN) | agency-logo swatch hexes are exempt — kept as brand `var()` literals. |
| `amber-*` (Tailwind numeric) / `yellow-*` | `amber-*` Radix (highlight/`mark`→`amber-3`) | Radix `amber` IS registered but Tailwind numeric steps (`amber-50/600`) don't resolve — remap by role. |
| `orange-*` (Tailwind numeric) | `orange-*` Radix (tint→`orange-3`, solid→`orange-9`, hover→`orange-10`) | Same: Tailwind numeric `orange-*` doesn't resolve; Radix `orange-1..12` does. |
| `#0064ff`, `#228be6` (TW brand blue) | `var(--color-twblue-9)` / `bg-twblue-9` | Decision BRAND: convert now (close match). |
| `#f26c47`, `#e05a37` (report orange), `#c47565` (PG terracotta) | `orange-9` / `orange-10` / `orange-3` **— FLAG for design sign-off** | Decision BRAND: default to orange scale, but get design confirmation before merge. |
| `#9575CD` (HeyTalia mascot purple) | **LEAVE** | Brand artwork; plan 008 deliberately left the mascot SVG. |
| `bg-white` (non-primary surface) | `bg-card` (elevated), `bg-background` (page/field), `bg-popover` (floating menu) | Pick by surface role. **FENCED exceptions below.** |
| `text-white` (on a token surface) | `primary-foreground` / `destructive-foreground` / `twblue-1` (on `twblue-9`) | Keep literal `text-white` ONLY on fixed saturated brand fills. |
| `bg-black`, `rgba(0,0,0,x)` (scrim/shadow) | `bg-foreground/N` (opacity modifier) or `color-mix(in srgb, var(--color-slate-12) N%, transparent)` | Black overlays/shadows are wrong in dark mode. |

### Alpha / translucency rule (decision ALPHA)

**Only `twblue` has registered alpha steps (`twblue-a1..a12`).** For every other
scale, translucency must use either:

- a Tailwind **opacity modifier** on the solid step in class context — `bg-twblue-3/50`,
  `bg-lime-3/60`, `bg-destructive/10`; or
- **`color-mix()`** for SVG props / inline styles — `color-mix(in srgb, var(--color-crimson-9) 12%, transparent)`.

**Never emit `slate-a3`, `lime-a4`, `crimson-aN`, etc.** — they are not registered
and resolve to nothing (the build will still pass; the color silently disappears).
This is enforced by the NO-STRAY-ALPHA gate.

## Resolved design decisions (confirmed with the maintainer 2026-06-30)

- **PINK** → all Tailwind `pink-*` map to **crimson**. The radar-chart
  `colorScheme='pink'` whose literal is `#f26c47` is *coral, not pink* → handled as
  report-orange under BRAND (Phase 013).
- **CYAN** → in-app `cyan-*` icons map to **twblue**; `agency-logo.tsx`'s 6
  deterministic per-agency swatch hexes stay as **brand `var()` literals** (no forced
  hue change — they are identity, not drift).
- **GD-DISTINCT** → collapse genuinely-synonymous success states to `lime`, but
  **split `report-table.tsx`'s live triplet** into three distinct tokens:
  **Viewed → `lime-3`/`lime-11`, Acknowledged → `twblue-3`/`twblue-11`,
  Sent-to-Parents → `violet-3`/`violet-11`** (and normalize the source inconsistency
  at `report-table.tsx:102`, where "Acknowledged" uses `green-100` in one row and
  `emerald-100` in another). **Design to confirm the three-token assignment.**
- **BRAND** → `#0064ff`/`#228be6` → `twblue-9` now. `#f26c47`/`#e05a37`/`#c47565`
  → orange scale **as default, flagged for design sign-off** before the owning phase
  merges. `#9575CD` HeyTalia mascot → left as artwork (plan 008).
- **CHART-NOW** → all chart/SVG color is deferred to **Phase 013** so the mechanical
  and giant-file phases stay grep-and-build verifiable.
- **PRIMITIVE-REUSE** → **out of scope** for this sweep. The audit found ~80
  primitive-reuse opportunities (hand-built badges/pills, 5 files with raw
  `<button>`/`<input>`). Folding component refactors into a color sweep makes diffs
  unreviewable. Logged as a separate future finding (see `plans/README.md`).

## Verification gates (referenced by every phase plan)

Capture the baseline ONCE before Phase 1, then re-run after each phase. All gates use
`bun` (the repo runtime).

| Gate | Command | Pass condition |
|---|---|---|
| **BUILD** | `bun run build` | exit 0 |
| **TSC-UNCHANGED** | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | **= 113** (baseline at `6e3d7e5`; pure className edits must not move it) |
| **VITEST-UNCHANGED** | `bunx vitest run 2>&1 \| grep "Tests "` | **37 passed / 16 failed** (pre-existing failures unrelated; count must not change) |
| **PALETTE COUNT-DROP** (per file) | `grep -nE 'bg-(blue\|sky\|indigo\|green\|emerald\|teal\|red\|rose\|pink\|purple\|fuchsia\|cyan\|gray\|zinc\|neutral\|stone)-[0-9]\|text-(…)-[0-9]\|border-(…)-[0-9]' <file> \| wc -l` | drops to the phase's expected residual (0 for fully-migrated files) |
| **DARK-HAZARD COUNT-DROP** (per file) | `grep -nE '(bg\|text)-white\|bg-black' <file> \| wc -l` | drops to the intentional-keep residual (white-on-brand CTA text, fenced facsimile/preview) |
| **NO-STRAY-ALPHA** (per file) | `grep -nE '(slate\|lime\|orange\|amber\|crimson\|violet)-a[0-9]' <file>` | **empty** (only `twblue-aN` is registered) |
| **RAW-HEX RESIDUAL** (non-giant) | `grep -nE '#[0-9a-fA-F]{3,6}\|rgba?\(' <file> \| wc -l` | 0, or the count of intentional brand/facsimile literals deliberately kept (each justified) |
| **PRETTIER-NOISE** | `bun run check` | diff contains only intended color lines + the repo's enforced auto-format — no unrelated reflow. Keep formatting in a separate commit if prettier rewraps long `className` strings. |
| **VISUAL SPOT-CHECK** (giants + charts, MANDATORY) | `bun run dev`, open touched screens in light AND dark mode | status badges legible; no white-on-white / invisible-on-dark; charts render intended hues; brand CTAs unchanged. **The only gate that catches chart-color regressions — the build cannot.** |

> The 16 failing tests (`draft-storage.test.ts`, `imported-columns.test.ts`) are
> pre-existing (a regression from merges #135–137, see README Round-2 notes), unrelated
> to color. This sweep touches no tests or logic; the gate is "count unchanged."

## Repo conventions (apply in every phase)

- Tailwind v4, CSS-first config in `src/styles.css` (no `tailwind.config.js`). A color
  utility exists only if its step is registered in `@theme inline` — all the scales
  above already are.
- `bun` runtime. `src/routeTree.gen.ts` is auto-generated — never edit it.
- Conventional commits (`refactor(color): …`, `fix(theme): …`). One logical commit per
  area/file group; keep prettier-only reformatting in its own commit.
- Branch per phase plan: `advisor/0NN-<slug>`. Do NOT push or open a PR unless the
  operator says so.
- **Component Reuse Policy** (`AGENTS.md`): do not create components; this sweep only
  edits `className`/style strings on existing markup.

## Phase map (which plan owns what)

| Plan | Phases | Files | Risk | What it changes |
|---|---|---|---|---|
| **011** mechanical | 1–6 | ~38 small/medium files | LOW–MED | All non-chart palette/hex/dark-hazard swaps, grep-anchored |
| **012** giant files | 7–10 | 5 giant files (>1,500 lines, untested) | HIGH | Palette + dark-hazard ONLY; charts deferred; document/preview fences enforced |
| **013** charts & SVG | 11 | chart/SVG literals across the app | HIGH | All deferred chart/SVG color, centralized into `src/lib/chart-colors.ts`; visual-review gated |

**Execution order: 011 → 012 → 013.** 011 builds confidence in the mapping on
low-risk files. 012's giant files reuse the same recipe but are isolated one-per-branch.
013 is last because chart color can only be validated by eye. `academic-analytics.tsx`
and `attendance-analytics.tsx` are touched in BOTH 012 (palette) and 013 (charts) — the
double-touch is intentional; re-run their count-drop gates after 013.

## Global STOP conditions

Stop and report (do not improvise) if, in any phase:

- A file's "Current state" excerpt doesn't match live code (drift since `6e3d7e5`).
- A gate fails twice after a reasonable fix.
- A swap requires editing logic, a test, or a file outside the phase's scope.
- You are unsure whether a `bg-white`/`text-black`/hex is inside a **fenced** region
  (PDF facsimile, phone preview) — when unsure, leave it and report.
- A brand-hex flagged for design sign-off (report-orange / PG-terracotta) has not been
  confirmed and you are about to merge — hold.
