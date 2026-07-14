# Plan 027: HDP colour & token hygiene — one parent-facing accent, zero off-token literals

> **Executor instructions**: Follow step by step; verify each step. On any STOP condition, stop and report. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 3aa0371..HEAD -- src/components/reports/pg-report-preview-dialog.tsx src/routes/holistic-reports.index.tsx src/routes/reports.index.tsx`
> On any change since this plan was written, compare the excerpts below to live code; on mismatch, STOP.

## Status

- **Priority**: P1 (highest-leverage design-consistency fix in the HDP area)
- **Effort**: S–M
- **Risk**: LOW (className/token swaps only; no logic, no layout restructure)
- **Planned at**: commit `3aa0371`, 2026-07-13
- **Execute via**: `tfx:design` (colour/polish dimension)
- **Baseline gates** (branch `design/hdp-report-polish`): `bunx tsc --noEmit` = **81** errors; `bunx vitest run` = **98 pass / 24 fail** (the 24 are the documented jsdom/localStorage-race in `draft-storage.test.ts` + `imported-columns.test.ts`, unrelated to reports UI); `bun run build` exit 0.

## Why this matters

The `src/components/ui/` primitives are 100% token-driven, and the wider app renders on Radix `slate-1..12` (via semantic tokens) + `twblue` brand + Radix accent scales (`lime/amber/orange/violet/crimson`). Several HDP surfaces added in the latest pull defect off that system, so they read as a _different design language_ than the rest of the app — the exact problem this branch exists to fix. Two concrete symptoms confirmed in-browser:

- The **same report document** shows a **blue** student name on the write page (`report-preview.tsx` → `text-twblue-11`) but a **salmon/terracotta `#c47565`** name in the Parents Gateway preview dialog. One element, two colours.
- The **same filter-count badge** is `bg-orange-9` in `reports.index.tsx:515` but hard-coded `bg-[#f26c47]` in `holistic-reports.index.tsx:362`.

Round 3 of the color sweep (see `plans/README.md`) already decided the canonical mapping: **the coral/salmon brand hexes `#f26c47` / `#e05a37` / `#c47565` all map to the Radix `orange` scale.** This plan finishes applying that decision to the HDP surfaces that regressed.

**The single parent-facing accent = Radix `orange` scale** (`orange-9` for solid fills / brand text, `orange-11` for accessible text-on-light). Use it everywhere a "Parents Gateway"/parent-action accent appears.

## Hard constraints

- Token swaps only. Do NOT restructure layout, rename props, or change component behaviour — those belong to plan 028.
- Do NOT touch the fenced PG phone-preview inside `announcements.new.tsx` (~L136–907) — that is the documented, intentional light-mode Parents-Gateway mimicry and is explicitly out of scope for token sweeps.
- The app's scale is Radix `slate-1..12` only. Tailwind's _default_ numeric palette (`slate-900`, `slate-100`, `lime-600`, …) is OFF-token and does not dark-flip — treat every such literal as a defect.
- Preserve AA contrast: on light surfaces use `text-*-11`/`text-*-12` for text, `*-9` for solid fills with white text, `*-3`/`*-4` for tinted backgrounds.

## Step 1 — `pg-report-preview-dialog.tsx` (the worst offender): re-tokenize every colour

Current-state literals (all confirmed at `3aa0371`):

| Line               | Literal                         | Replace with                                                                   |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------ |
| 132                | `border-slate-900`              | `border-foreground`                                                            |
| 132                | `bg-white`                      | `bg-card`                                                                      |
| 132                | `rounded-[28px]` `border-[7px]` | keep for now — device-bezel geometry, addressed in 028; **do NOT change here** |
| 136                | `divide-slate-100`              | `divide-border`                                                                |
| 136                | `bg-white`                      | `bg-card`                                                                      |
| 140                | `text-slate-900`                | `text-foreground`                                                              |
| 150                | `text-[#c47565]`                | `text-orange-11`                                                               |
| 154                | `text-slate-500`                | `text-muted-foreground`                                                        |
| 160, 168           | `border-slate-100`              | `border-border`                                                                |
| 161, 169, 176      | `text-slate-700`                | `text-foreground`                                                              |
| 162, 170, 177, 184 | `text-slate-400`                | `text-muted-foreground`                                                        |
| 202                | `border-slate-100`              | `border-border`                                                                |
| 202                | `bg-white`                      | `bg-card`                                                                      |
| 205                | `text-lime-600`                 | `text-lime-11`                                                                 |
| 206                | `text-slate-700`                | `text-foreground`                                                              |
| 221                | `bg-[#c47565]`                  | `bg-orange-9`                                                                  |
| 221                | `bg-slate-300` (disabled)       | `bg-muted`                                                                     |
| 229                | `border-slate-200`              | `border-border`                                                                |
| 229                | `text-slate-500`                | `text-muted-foreground`                                                        |
| 234                | `text-slate-400`                | `text-muted-foreground`                                                        |

Leave the arbitrary font sizes (`text-[10px]`, `text-[11px]`) and the raw `<button>` elements for plan 028 (component/type work). This step is colour-only so the diff stays reviewable.

**Verify**: `grep -nE '#[0-9a-fA-F]{6}|slate-[0-9]{3}|bg-white|lime-600' src/components/reports/pg-report-preview-dialog.tsx` returns nothing. Browser: open `/reports/cycle/write/36` → "Preview as parent" — student name is now brand-orange (matches the app's parent accent), the phone chrome and text tones look native to the app, Acknowledge button is `orange-9`.

## Step 2 — `holistic-reports.index.tsx`: align the drifted twin with `reports.index.tsx`

| Line | Literal        | Replace with  | Rationale                                                   |
| ---- | -------------- | ------------- | ----------------------------------------------------------- |
| 362  | `bg-[#f26c47]` | `bg-orange-9` | match the identical badge in `reports.index.tsx:515`        |
| 517  | `bg-white`     | `bg-card`     | match the identical floating bar in `reports.index.tsx:670` |

**Verify**: `grep -nE '#[0-9a-fA-F]{6}|bg-white' src/routes/holistic-reports.index.tsx` returns nothing. The two routes' shared elements now use identical tokens.

## Step 3 — `cycle-student-table.tsx`: the one off-token shadow literal

`~line 598`: the sticky Name-cell box-shadow hard-codes `rgba(0,0,0,0.1)`. The sibling border in the same file already uses `var(--color-border)`. Replace the `rgba(0,0,0,0.1)` colour stop in the shadow with `var(--color-border)` (keep the offsets/blur). If the exact shadow string differs from this description, STOP and report rather than guessing.

**Verify**: `grep -n 'rgba(' src/components/reports/cycle-student-table.tsx` returns nothing.

## Gates + bookkeeping

- `bunx tsc --noEmit` — **must stay at 81** (0 new errors).
- `bunx vitest run` — **must stay at 98 pass / 24 fail** (no regression).
- `bun run build` — exit 0.
- Targeted `bunx prettier --check` + `bunx eslint` on the three touched files (NOT `bun run check`, which reformats the whole repo).
- Browser: PG preview dialog + both hub routes render with the app's native palette; no salmon/coral hexes anywhere.
- Update this plan's row in `plans/README.md`.

## STOP conditions

- Any swap would change contrast below AA (e.g. `orange-9` text on a light background — use `orange-11` for text, `orange-9` only for solid fills) → STOP and flag.
- A literal in the table above no longer exists at the cited line (drift) → STOP and re-anchor.
- Fixing a colour requires touching the fenced `announcements.new.tsx` PG preview → STOP (out of scope).
