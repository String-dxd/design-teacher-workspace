# Plan 011: Color-token sweep — mechanical batches (Phases 1–6, ~51 small/medium files)

> **Executor instructions**: READ `plans/010-color-sweep-overview.md` FIRST — it
> holds the canonical mapping table, the resolved design decisions, and the shared
> verification gates this plan references by name. Then follow this plan step by step.
> Run every gate and confirm the expected result before moving on. If a "STOP
> conditions" item occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6e3d7e5..HEAD -- src/components src/routes`
> If a file in this plan's scope changed since `6e3d7e5`, re-run that file's PALETTE
> COUNT-DROP grep to get the live count before editing; the *recipe* is grep-anchored
> so line drift is fine, but a content change (e.g. a status map rewritten) is a STOP.

## Status

- **Priority**: P2
- **Effort**: L (≈51 files, but each is a mechanical class swap; no logic)
- **Risk**: LOW (Phases 1, 2, 5) → MED (Phases 3, 4, 6 — widely-consumed shared components and dense routes)
- **Depends on**: plan 010 (reference). Run BEFORE plans 012 and 013.
- **Category**: tech-debt / design
- **Planned at**: commit `6e3d7e5`, 2026-06-30

## Why this matters

See `plans/010` §"Why this matters". This plan does the **low/medium-risk bulk**: the
~38–51 files that are small enough to migrate by grep-and-swap with full build/grep
verification, before the high-risk giant files (012) and charts (013). Charts and SVG
color are explicitly NOT touched here (decision CHART-NOW) — even in files that contain
both (e.g. `insight-buddy`), fix the palette/dark-hazard classes and leave `fill=`/
`stroke=`/inline-style hexes for plan 013.

## The recipe (applies to every file in every phase below)

For each file, in order:

1. Run the **PALETTE COUNT-DROP** grep (010 §gates) to see what's there.
2. Replace each Tailwind-default palette class using the **canonical mapping** in 010.
   Map by role: a badge bg → `*-3`, a border → `*-6`, low-contrast text → `*-11`, a
   solid fill → `*-9`. Prefer **semantic tokens** (`bg-muted`, `text-muted-foreground`,
   `border-border`, `bg-destructive`, `primary`) when the color expresses a role.
3. Replace each **dark-mode hazard** (`bg-white`/`text-white`/`bg-black`): surface
   white → `bg-card`/`bg-background`/`bg-popover` by role; `text-white` on a token
   surface → the paired `*-foreground`; keep `text-white` ONLY on a fixed brand fill.
4. Replace **non-chart raw hex** in `className`/arbitrary values (`text-[#12b886]` →
   `text-lime-11`) per the mapping. Translucency → opacity modifier or `color-mix()`
   (decision ALPHA — never `slate-a3`-style utilities).
5. Run the per-file gates (PALETTE, DARK-HAZARD, NO-STRAY-ALPHA, RAW-HEX RESIDUAL).
6. After the whole phase: BUILD, TSC-UNCHANGED, VITEST-UNCHANGED, PRETTIER-NOISE.

**Do NOT** touch: any `fill=`/`stroke=` prop, recharts inline-style hexes, or a
`colorScheme` prop value — those are plan 013. Leave them; they count as the file's
expected RAW-HEX residual.

## Scope — files by sub-phase

> Each sub-phase = one logical commit (or a few). Branch: `advisor/011-color-sweep-mechanical`.

### Phase 1 — Leaf status/report cards (LOW risk, 13 files)

`announcement-card.tsx`, `notifications/notification-popover.tsx`,
`reports/attendance-conduct-card.tsx`, `reports/attendance-ring.tsx`,
`reports/cca-section.tsx`, `reports/character-section.tsx`,
`reports/exam-overall-section.tsx`, `reports/learning-outcome-row.tsx`,
`reports/physical-fitness-section.tsx`, `reports/student-info-card.tsx`,
`reports/via-section.tsx`, `students/student-overview-cards.tsx`,
`reports/report-table.tsx`.

File-specific notes:
- **`report-table.tsx` — GD-DISTINCT split (verified at `6e3d7e5`).** The status map has
  a green/emerald/teal triplet AND a source inconsistency. Apply:
  - "Viewed" (`bg-green-100 text-green-700`, ~L74-75 and ~L101) → `bg-lime-3 text-lime-11 hover:bg-lime-3`
  - "Acknowledged" (`bg-emerald-100 text-emerald-700` ~L79; **also `bg-green-100` at ~L102 — normalize both to the same**) → `bg-twblue-3 text-twblue-11 hover:bg-twblue-3`
  - "Sent to Parents" (`bg-teal-100 text-teal-700`, ~L106) → `bg-violet-3 text-violet-11 hover:bg-violet-3`
  - The "draft/sent" sender status (`bg-green-100`, ~L56) is success, not part of the triplet → `bg-lime-3 text-lime-11`.
  - **This three-token assignment is pending design confirmation** — if design has not
    signed off, STOP on this file and migrate the other 12 first.
- **`attendance-ring.tsx`**: its accent hexes drive `stroke=currentColor` via a
  `className` text color, so they ARE class-context — convert to Tailwind classes
  (`text-lime-11`, `text-crimson-11`…), NOT `var()`. Any literal `<svg stroke="#…">`
  prop, if present, is deferred to 013.
- **`attendance-conduct-card.tsx`**: a white-on-colored conduct pill keeps its
  `text-white` (sits on a fixed colored fill) — leave it; it's an expected residual.

Expected residual after Phase 1: PALETTE → 0 across all 13; RAW-HEX → only any deferred
`stroke=`/`fill=` props (likely 0 here).

### Phase 2 — Report wizard steps + preview/email dialogs (LOW risk, 12 files)

`reports/generate-hdp-wizard.tsx`, `reports/hdp-data-step.tsx`,
`reports/hdp-preview-step.tsx`, `reports/hdp-template-step.tsx`,
`reports/report-overview-tab.tsx`, `reports/academic-aggregates-section.tsx`,
`reports/email-preview-dialog.tsx`, `reports/pg-preview-dialog.tsx`,
`reports/parent-preview-dialog.tsx`, `reports/secondary-subject-accordion.tsx`,
`reports/secondary-subject-detail.tsx`, `students/profile-criteria-details-card.tsx`.

Notes:
- Shared pattern: info-banner `blue-*` → `twblue` (`bg-twblue-3` / `text-twblue-11`),
  and the **report-orange `#f26c47` active-tab/CTA** accent. The active-tab pattern
  `data-active:text-[#f26c47] data-active:after:bg-[#f26c47]` repeats ~3× per file —
  apply the BRAND decision (`var(--color-orange-9)` or `orange-9` class) and consider
  extracting a shared `const` if the same string appears 3+ times in one file.
- **`#f26c47` / `#e05a37` are FLAGGED for design sign-off** (decision BRAND). Default to
  `orange-9`/`orange-10`; if not signed off, do the blue/slate/green swaps and leave the
  report-orange as a documented residual.
- `hdp-data-step.tsx` category icons include the **pink → crimson** and **cyan → twblue**
  cases (decisions PINK/CYAN): `text-violet-600`/`bg-violet-50` already handled by 008;
  any `pink-*` → `crimson-*`, any `cyan-*` → `twblue-*`.

### Phase 3 — Comms shared components (MED risk, 6 files)

`comms/entity-selector.tsx` (1,141 lines), `comms/pg-shortcuts-selector.tsx`,
`comms/question-builder.tsx`, `comms/recipient-read-table.tsx`,
`comms/rich-text-editor.tsx` (shared across compose flows), `forms/form-response-table.tsx`.

Notes:
- MED risk because `entity-selector` and `rich-text-editor` are consumed by both
  Announcements and Forms — a regression shows on many screens. Do **color only**; do
  NOT fold in the flagged primitive-reuse rewrites (Checkbox/Badge/DropdownMenu) — that
  is explicitly out of scope (decision PRIMITIVE-REUSE).
- `rich-text-editor.tsx`: the `bg-yellow-100` highlighter mark → `bg-amber-3` (it is an
  intentional text-highlight; amber is correct).
- Radio/check dots rendered as `bg-white` on a `bg-primary`/`bg-destructive` fill →
  `bg-primary-foreground` / `bg-destructive-foreground` (so the knob flips correctly).

### Phase 4 — Guest routes + standalone route pages (MED risk, 7 files)

`routes/_guest.login.tsx`, `routes/_guest.report-view.$token.tsx`, `routes/$.tsx`,
`routes/flags.tsx`, `routes/student-analytics.tsx`, `routes/insight-buddy.tsx`,
`components/insight-buddy.tsx`.

Notes:
- `_guest.login`: mostly `slate-*` → semantic + `red-*` → `destructive`.
- `flags.tsx` / `student-analytics.tsx`: share the purple **"Experiment" badge** →
  `violet`. Drop any `dark:` override on those badges — Radix `violet` auto-flips, so a
  manual `dark:` class becomes redundant (verify the badge still reads in both modes).
- `insight-buddy` (route + component): the blue assistant-avatar/FAB pattern → `twblue`
  or semantic `primary`. **The 2 chart fills in the component (`#228be6`, `#12b886`) are
  DEFERRED to plan 013** — leave them; they are the file's RAW-HEX residual.

### Phase 5 — Groups area (LOW risk, 5 files)

`routes/groups.$groupId.tsx`, `routes/groups.index.tsx`, `routes/groups.new.tsx`,
`routes/groups.structured.$groupId.tsx`, `routes/groups.upload.tsx`.

Notes:
- Cohesive vocabulary: blue info-banners/badges → `twblue`; slate surfaces → semantic;
  green success → `lime`; amber undo-banner → `amber`; red upload-error → `destructive`.
- `groups.index.tsx`: radio-dot `bg-white` sitting on `bg-primary`/`bg-destructive` fills
  are intended white knobs — **do NOT flag as hazards**; they are expected residuals
  (the audit confirmed these are deliberate). Re-check against the audit before changing.
- `groups.upload.tsx` is the heaviest (~38 palette + ~9 dark-hazard) but still mechanical;
  its error tints already use `bg-destructive/10` (opacity modifier — correct, leave).

### Phase 6 — Forms + announcement-detail routes + app-level components (MED risk, 8 files)

`routes/forms.$id.tsx`, `routes/forms.index.tsx`, `routes/forms.new.tsx`,
`routes/announcements.$id.tsx`, `routes/reports.$id.tsx`, `routes/reports.index.tsx`,
`components/agency-logo.tsx`, `components/app-card.tsx`.

Notes:
- `announcements.$id.tsx` is the densest non-giant route (~38 palette) — status badges
  `green→lime`, `slate→muted`, `amber→amber`; radio dots → `*-foreground`.
- **`agency-logo.tsx` (verified at `6e3d7e5`)**: the 6 swatch hexes in `agencyTint()`
  (`#0064ff`, `#7c3aed`, `#16a34a`, `#ea580c`, `#db2777`, `#0891b2`) are applied via
  inline `style={{ backgroundColor }}` and are **per-agency brand identity** (decision
  CYAN). Convert each to a `var(--color-*)` literal *without forcing a hue change beyond
  the nearest token*: `#0064ff→var(--color-twblue-9)`, `#7c3aed→var(--color-violet-9)`,
  `#16a34a→var(--color-lime-9)`, `#ea580c→var(--color-orange-9)`,
  `#db2777→var(--color-crimson-9)` (pink→crimson), `#0891b2→var(--color-twblue-9)`
  (cyan→twblue — note this collides with the `#0064ff` swatch; **flag to design** that
  two agencies may now share a hue). The `bg-white` logo backing (L88) and the
  `text-white` acronym on a colored swatch (L104) are **intentional brand-asset
  choices — leave them** (expected residuals).
- `app-card.tsx`: `#0064ff` → `var(--color-twblue-9)`; the per-app hover map
  (`group-hover:text-{orange,green,purple,pink}-500`) → `orange-9`/`lime-9`/`violet-9`/
  `crimson-9` (pink→crimson per PINK).

## Commands you will need

See `plans/010` §"Verification gates". Quick reference: `bun run build`,
`npx tsc --noEmit 2>&1 | grep -c "error TS"` (=113), `bunx vitest run` (37/16),
`bun run check`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] For every file in Phases 1–6, PALETTE COUNT-DROP grep → 0.
- [ ] DARK-HAZARD grep → only the documented intentional residuals (conduct pill,
      groups radio knobs, agency-logo backing/acronym).
- [ ] NO-STRAY-ALPHA grep → empty across all touched files.
- [ ] RAW-HEX RESIDUAL → 0 except deferred chart `fill=`/`stroke=` (insight-buddy 2,
      attendance-ring svg if any) and design-flagged report-orange, each justified.
- [ ] `report-table.tsx` triplet renders 3 distinct tokens; L102 inconsistency normalized.
- [ ] `bun run build` exit 0; `tsc` error count = 113; `bunx vitest run` 37/16.
- [ ] `git status` shows only the ~51 in-scope files + `plans/README.md`.
- [ ] `plans/README.md` status row updated.

## STOP conditions

In addition to 010 §"Global STOP conditions":

- `report-table.tsx`'s triplet design assignment is unconfirmed → migrate the other 12
  Phase-1 files and report.
- A report-orange (`#f26c47`/`#e05a37`) sign-off is pending and you are about to merge.
- A file you expected to be palette-only turns out to contain a chart you can't cleanly
  fence off from the class swaps → leave the chart parts, note it, and report.

## Maintenance notes

- After this plan, the only off-token colors left in these 51 files are documented
  intentional residuals (brand swatches, white-on-brand text) and the chart literals
  that plan 013 owns.
- If design rejects the report-table triplet tokens, only `report-table.tsx` needs a
  re-touch — the tokens are isolated to its status map.
- A future "enable dark mode" task can rely on these files being theme-safe; the giant
  files (012) and charts (013) must land first for full coverage.
