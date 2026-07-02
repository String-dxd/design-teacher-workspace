# Plan 007: Fix broken color-token registration (`slate` scale + `destructive-foreground`) and align `accent`/`input`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9eb7dee..HEAD -- src/styles.css src/components/ui/button.tsx`
> If either in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1 (fixes a live, app-wide disabled-button rendering bug)
- **Effort**: S
- **Risk**: LOW (additive token registration + 4 one-line value changes; no logic)
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `9eb7dee`, 2026-06-26

## Why this matters

`src/styles.css` exposes Radix color scales to Tailwind through an `@theme inline`
block. Every scale — `twblue`, `crimson`, `orange`, `lime`, `amber`, `twpurple` —
is registered across the full 1–12 range **except `slate`, which stops at
`slate-2`.** In Tailwind v4 a color utility/variable only exists for the steps
registered in `@theme`, so `text-slate-3 … text-slate-12`, `bg-slate-6`, etc. are
never generated and `var(--color-slate-3..12)` resolves to nothing. (Verified by
compiling the exact pattern with Tailwind v4.3.1: bare `slate-3..12` utilities
were not emitted, and `--color-slate-11` had zero definitions in the output. Note
`var(--slate-N)` — no `--color-` prefix — DOES work, since the raw Radix vars are
imported; only the Tailwind-namespaced `--color-slate-N` and the bare `slate-N`
utilities are missing.)

Concrete cost today:

- **`src/components/ui/button.tsx:13`** (core component, NOT flag-gated): the
  `default` variant sets `disabled:opacity-100` (cancelling the base
  `disabled:opacity-50` dim) and relies on `disabled:bg-[var(--color-slate-3)]` +
  `disabled:text-[var(--color-slate-8)]` for a gray disabled look. Both vars are
  undefined → **disabled primary buttons render identical to enabled ones**
  (full brand-blue background, white text, no dimming). App-wide.
- The Import feature (`import-wizard.tsx`, `import-progress-toast.tsx`,
  `import-success-page.tsx`) has ~75 `slate-3..12` references (bare utilities +
  unfallback'd `var(--color-slate-N)`) that silently don't paint. Latent behind
  the "Import Data" flag, but shipped.
- `--destructive-foreground` is referenced (`groups.$groupId.tsx:759,781`) but
  never defined → dark text on the crimson-9 background → contrast failure.

Registering `slate-3..12` (one block, mirroring how every other scale is done)
fixes ALL of these at once — without editing any component — because
`button.tsx`'s and the Import feature's existing references finally resolve.
This plan also defines the missing `--destructive-foreground` and aligns
`--accent`/`--input` to the team's canonical reference.

## Current state

### `src/styles.css` at `9eb7dee` — the blocks to change

**`@theme inline` slate registration — only 1 and 2 exist** (lines 218–219):

```css
--color-slate-1: var(--slate-1);
--color-slate-2: var(--slate-2);
/* slate-3 … slate-12 are MISSING here — that is the bug */
```

For contrast, the full registration pattern is right there for `twblue`,
`crimson`, `orange`, `lime`, `amber` in the same block — match it.

**`:root` semantic tokens** (lines 78, 80, 82):

```css
  --accent: var(--slate-3);        /* line 78 → slate-4 */
  --destructive: var(--crimson-9); /* line 80 — UNCHANGED (crimson is the brand danger color; no red scale is imported) */
  ...
  --input: var(--slate-6);         /* line 82 → slate-7 */
```

`--destructive-foreground` is absent from `:root`; `--color-destructive-foreground`
is absent from `@theme inline` (the destructive line there is line 320:
`--color-destructive: var(--destructive);`).

### Repo conventions

- Tailwind v4, CSS-first config in `src/styles.css` (no `tailwind.config.js`).
  Color utilities generate only for scale steps registered in `@theme inline`.
- Conventional commits (`fix(...)`, e.g. `fix(ui): replace Radix asChild with
Base UI render prop` from `git log`).
- `bun` is the runtime; `src/routeTree.gen.ts` is auto-generated (not touched here).

## Commands you will need

| Purpose   | Command                                       | Expected on success                                       |
| --------- | --------------------------------------------- | --------------------------------------------------------- |
| Install   | `bun install`                                 | exit 0                                                    |
| Build     | `bun run build`                               | exit 0 (Vite build; does not run tsc)                     |
| Typecheck | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | **≤ 113** (baseline at `9eb7dee`); must NOT increase      |
| Tests     | `bunx vitest run 2>&1 \| grep "Tests "`       | **37 passed, 16 failed** (baseline — unchanged; see note) |

> **Pre-existing failing tests**: at `9eb7dee`, `bunx vitest run` reports
> **37 passed / 16 failed** (`draft-storage.test.ts` 10, `imported-columns.test.ts`
> 6 — a regression from the student-insights merges #135–137, unrelated to this
> plan). This plan touches no test files and no logic; your gate is that the count
> is **unchanged**. If passing drops below 37 or new failures appear, STOP.

## Scope

**In scope** (the only files you may modify):

- `src/styles.css` — register `slate-3..12`; add `--destructive-foreground`;
  change `--accent` and `--input`.
- `plans/README.md` — status row.

**Out of scope** (do NOT touch — they fix themselves once the scale is registered):

- `src/components/ui/button.tsx` — its `var(--color-slate-3/8)` references become
  valid automatically. Do NOT edit the component.
- `import-wizard.tsx` / `import-progress-toast.tsx` / `import-success-page.tsx` —
  start painting once the scale is registered; do NOT rewrite their classes.
- `groups.$groupId.tsx` — its `text-destructive-foreground` resolves once the
  token exists.
- Anything to do with `twpurple`, `violet`, or `heytalia` — that is **plan 008**.
  Do not delete `twpurple` here.

## Git workflow

- Branch: `advisor/007-color-token-mapping`
- Conventional commits, e.g.
  `fix(theme): register slate-3..12 in @theme inline (fixes disabled buttons)`,
  `fix(theme): define --destructive-foreground`,
  `style(theme): align accent/input to reference (slate-4 / slate-7)`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 0: Baselines

Record `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expect `113`),
`bunx vitest run 2>&1 | grep "Tests "` (expect `37 passed | 16 failed`),
`bun run build` (expect exit 0). If any differs materially, STOP (repo drifted).

### Step 1: Register `slate-3 … slate-12` in `@theme inline`

Immediately after `--color-slate-2: var(--slate-2);` (line 219), add:

```css
--color-slate-3: var(--slate-3);
--color-slate-4: var(--slate-4);
--color-slate-5: var(--slate-5);
--color-slate-6: var(--slate-6);
--color-slate-7: var(--slate-7);
--color-slate-8: var(--slate-8);
--color-slate-9: var(--slate-9);
--color-slate-10: var(--slate-10);
--color-slate-11: var(--slate-11);
--color-slate-12: var(--slate-12);
```

**Verify**: `grep -c "color-slate-12" src/styles.css` → `1`; `bun run build` → exit 0.

### Step 2: Define `--destructive-foreground`

1. In `:root`, immediately after `--destructive: var(--crimson-9);` (line 80), add:
   `--destructive-foreground: white;` (crimson-9 is a saturated dark red; white is
   the correct on-color, matching `--primary-foreground: white`).
2. In `@theme inline`, immediately after `--color-destructive: var(--destructive);`
   (line 320), add: `--color-destructive-foreground: var(--destructive-foreground);`

**Verify**: `grep -c "destructive-foreground" src/styles.css` → `2`; `bun run build` → exit 0.

### Step 3: Align `--accent` and `--input`

In `:root`: `--accent: var(--slate-3);` → `var(--slate-4);` (line 78), and
`--input: var(--slate-6);` → `var(--slate-7);` (line 82). This separates `accent`
(hover/selected surfaces) from `secondary`/`muted`, and makes input borders one
step darker than container borders. Visual-only; revertable independently.

**Verify**: `grep -E "^\s*--accent: var\(--slate-4\);" src/styles.css` and
`grep -E "^\s*--input: var\(--slate-7\);" src/styles.css` both match.

### Step 4: Full verification

- `bun run build` → exit 0.
- **Generated-CSS check** (proves utilities now emit):
  `find dist .output -name "*.css" 2>/dev/null | xargs grep -l "text-slate-11" 2>/dev/null`
  → at least one file (`.text-slate-11` exists now because the scale is registered
  and the class is used by the Import wizard; before this plan it was absent).
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → ≤ 113.
- `bunx vitest run 2>&1 | grep "Tests "` → `37 passed | 16 failed` (unchanged).
- **Functional (browser, if `agent-browser` is available)**: `bun run dev`, open a
  page with a disabled primary button (a form with an inactive Submit) and confirm
  it renders **gray** (slate-3 bg / slate-8 text), not brand-blue. If it still
  looks blue, the registration didn't take — STOP and report.

## Test plan

No new unit tests — CSS-token change with no testable logic. Gates are the build,
the generated-CSS grep, the unchanged tsc/vitest baselines, and the disabled-button
browser check.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c "color-slate-12" src/styles.css` → 1
- [ ] `grep -c "destructive-foreground" src/styles.css` → 2
- [ ] `--accent: var(--slate-4);` and `--input: var(--slate-7);` both present in `src/styles.css`
- [ ] `bun run build` → exit 0; generated CSS contains `text-slate-11`
- [ ] `npx tsc --noEmit 2>&1 | grep -c "error TS"` → ≤ 113
- [ ] `bunx vitest run` → 37 passed / 16 failed (unchanged)
- [ ] `grep -c "twpurple" src/styles.css` → still > 0 (you did NOT touch twpurple — that's plan 008)
- [ ] `git status` clean apart from `src/styles.css` and `plans/README.md`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `src/styles.css` excerpts don't match the live code (drift since `9eb7dee`).
- `bun run build` fails, or the generated-CSS check shows `.text-slate-11` still
  absent after registration.
- `tsc` error count rises above 113, or vitest passing drops below 37.
- You feel the need to edit `button.tsx` or any component to fix the disabled
  state — you shouldn't; registering the scale is the whole fix.

## Maintenance notes

- The disabled-button gray works app-wide now because `button.tsx`'s
  `var(--color-slate-3/8)` finally resolve. Tune the disabled look in the
  `default` variant of `src/components/ui/button.tsx` if needed — not the tokens.
- `--accent`/`--input` (step 3) are the visual-design hunk; revisit those two
  lines if hover or field contrast reads wrong.
- The team's canonical token reference should be updated to match reality:
  `--destructive` is `crimson-9` (not `red-9`), `--background` is `slate-1` (not
  `#ffffff`), and add `--destructive-foreground: white`.
- **Coordination**: plan 008 also edits `src/styles.css` (different regions —
  the `twpurple`/`violet` blocks). Land this plan first; 008's drift check will
  catch the shifted line numbers.
