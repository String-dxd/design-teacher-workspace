# Plan 020: Refresh the design-system dependencies (Base UI 1.6, shadcn CLI v4, Tailwind 4.3, lucide 1.x)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b01d78d..HEAD -- package.json bun.lock`
> If versions already moved past what "Current state" records, reconcile
> before proceeding; if a dep was already upgraded, skip its step.

## Status

- **Priority**: P2
- **Effort**: M (the lucide major is the only real work)
- **Risk**: MED (one runtime-library major; everything else minor/dev-only)
- **Depends on**: none (independent of 018/019, but land AFTER them to keep
  rebases trivial — this plan touches many import lines)
- **Category**: migration
- **Planned at**: commit `b01d78d`, 2026-07-02

## Why this matters

The design system is built on exactly these packages, and they've drifted:
`@base-ui/react` is 4 minor versions behind (missing 50–85% popup mount/unmount
performance gains, stable Drawer/OTPField, and a batch of a11y fixes),
`lucide-react` is a major behind (0.x is no longer getting icon/security
updates; 1.0 also cut the package ~32% and defaults `aria-hidden` correctly),
and the `shadcn` CLI is a major behind — v4 adds `--diff`/`--dry-run`, which is
the tool this repo needs to reconcile its locally-modified `ui/` components
against the upstream `base-maia` registry going forward.

## Current state

Installed (from `node_modules`, verified at `b01d78d`) vs latest (npm, 2026-07-02):

| Package                             | Installed                    | Latest | Notes                                                                                                                                                                  |
| ----------------------------------- | ---------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@base-ui/react`                    | 1.2.0                        | 1.6.0  | Only breaking change in range: `sanitizeValue` → `normalizeValue` (v1.5, field API). `grep -rn 'sanitizeValue' src` → **0 matches**, so effectively non-breaking here. |
| `tailwindcss` + `@tailwindcss/vite` | 4.2.1 (manifest says ^4.0.6) | 4.3.x  | Minor.                                                                                                                                                                 |
| `shadcn` (devDep, CLI only)         | 3.8.5                        | 4.x    | Dev-tool; no runtime surface.                                                                                                                                          |
| `lucide-react`                      | 0.562.0                      | 1.x    | **Breaking**: brand icons removed; legacy alias names removed.                                                                                                         |
| `tw-animate-css`                    | 1.4.0                        | 1.4.0  | Current — leave.                                                                                                                                                       |
| `@radix-ui/colors`                  | 3.0.0                        | 3.0.0  | Current — leave.                                                                                                                                                       |

Lucide inventory (extracted from every `import { … } from 'lucide-react'`
across `src/`, including multi-line imports): **147 distinct icons in ~88
files**. No brand icons are used. Ten legacy alias names in use will stop
compiling on 1.x:

`AlertCircle, AlertTriangle, ArrowUpDown, CheckCircle, CheckCircle2, Edit2, Home, Loader2, MoreHorizontal, MoreVertical`

Probable canonical names (VERIFY each against the lucide docs / tsc errors —
this table is a lead, not gospel; `ArrowUpDown` may not be renamed at all):

| Legacy           | Canonical          |
| ---------------- | ------------------ |
| `AlertCircle`    | `CircleAlert`      |
| `AlertTriangle`  | `TriangleAlert`    |
| `CheckCircle`    | `CircleCheckBig`   |
| `CheckCircle2`   | `CircleCheck`      |
| `Edit2`          | `Pen`              |
| `Home`           | `House`            |
| `Loader2`        | `LoaderCircle`     |
| `MoreHorizontal` | `Ellipsis`         |
| `MoreVertical`   | `EllipsisVertical` |

These aliases pointed at the same SVGs, so renames are pixel-identical.

## Commands you will need

| Purpose   | Command             | Expected on success                                                                             |
| --------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| Install   | `bun install`       | exit 0, `bun.lock` updated                                                                      |
| Typecheck | `bunx tsc --noEmit` | baseline ≤41 pre-existing errors (23×TS2322, 9×TS2345, 3×TS2353, 6 singles); no new codes/files |
| Tests     | `bunx vitest run`   | 37 pass / 16 fail (pre-existing); no new failures                                               |
| Build     | `bun run build`     | exit 0                                                                                          |
| Dev       | `bun run dev`       | port 3000                                                                                       |

## Scope

**In scope**:

- `package.json`, `bun.lock`
- Any `src/**/*.tsx?` file whose ONLY change is a lucide icon-name rename
  (import + JSX usages of that identifier)
- `plans/README.md` (status row)

**Out of scope**:

- Upgrading anything not listed (react, tanstack, tiptap, recharts, vite,
  vitest, nitro — nitro especially is pinned deliberately, see plan 004).
- Re-adding/regenerating any `src/components/ui/*` file via the new CLI —
  several are intentionally customized; reconciliation via `shadcn diff` is a
  SEPARATE future task, not this plan.
- Any visual/styling change beyond the mechanical icon renames.

## Git workflow

- Branch: `advisor/020-deps-refresh`
- One commit per step (so a bad upgrade bisects cleanly), conventional style:
  `chore(deps): bump @base-ui/react to 1.6`, `chore(deps): lucide-react 1.x + icon renames`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Base UI 1.6

`bun add '@base-ui/react@^1.6.0'`. Confirm
`grep -rn 'sanitizeValue' src` → 0 (pre-verified; re-check).

**Verify**: `bunx tsc --noEmit` → no new errors; `bun run build` → exit 0.
Dev server: open `/students` (dropdowns, popovers, tooltips), `/forms/new`
(select, dialog), `/announcements/new` (popover, sheet) — every popup opens,
positions, and closes; no console errors.

### Step 2: Tailwind 4.3

`bun add 'tailwindcss@^4.3.2' '@tailwindcss/vite@^4.3.2'`.

**Verify**: `bun run build` → exit 0; dev server renders `/` with styles
intact (sidebar colored, buttons rounded — a Tailwind regression is unmissable).

### Step 3: shadcn CLI v4 (devDep)

`bun add -d 'shadcn@^4'`. Sanity-check the CLI runs against this project:
`bunx shadcn diff button --dry-run 2>&1 | head -20` (any reasonable output —
including "component has local changes" — is fine; a crash or a
components.json schema rejection is a STOP condition).

**Verify**: command above produces output, exit code 0 or a documented
"changes found" nonzero — NOT a stack trace.

### Step 4: lucide-react 1.x + renames

1. `bun add 'lucide-react@^1'`
2. `bunx tsc --noEmit 2>&1 | grep 'lucide-react\|has no exported member'` —
   collect every "has no exported member 'X'" error.
3. For each missing name, find its canonical replacement (table above; confirm
   at https://lucide.dev if a name isn't in the table) and rename the
   identifier at the import AND all JSX usages in that file. Keep imports
   alphabetically sorted where they already are.
4. Repeat 2–3 until zero lucide-related tsc errors.

**Verify**: `bunx tsc --noEmit` → back to ≤41 baseline errors, none
mentioning lucide; `bunx vitest run` → no new failures; `bun run build` →
exit 0.

### Step 5: Visual smoke

Dev server: walk `/`, `/students`, `/announcements`, `/forms`, `/groups`,
`/settings` and confirm icons render everywhere (a missed rename renders
nothing and usually throws). Check the browser console for errors.

**Verify**: no blank icon slots, no console errors.

## Test plan

No new tests — this is a version migration; the gates are tsc (catches every
icon rename exhaustively), the vitest baseline, the build, and the visual
smoke in steps 1/5.

## Done criteria

- [ ] `package.json` shows `@base-ui/react@^1.6`, `tailwindcss@^4.3`,
      `@tailwindcss/vite@^4.3`, `shadcn@^4` (dev), `lucide-react@^1`
- [ ] `bunx tsc --noEmit` ≤41 pre-existing errors, zero mentioning lucide
- [ ] `bunx vitest run` — no new failures; `bun run build` exit 0
- [ ] Step 1 and step 5 browser smokes pass
- [ ] Only `package.json`, `bun.lock`, icon-rename files, and
      `plans/README.md` modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- `bun install` resolves a lucide/base-ui version with peer-dependency errors
  against react 19.
- Step 1's smoke shows a popup/dialog/select that no longer opens or positions
  correctly — report the component; do NOT patch `ui/` files to compensate.
- Step 3's CLI check crashes or rejects `components.json` — report; do not
  migrate the config file yourself.
- A lucide icon has NO canonical replacement (removed outright): report the
  icon + usage sites rather than substituting a lookalike.
- tsc errors after step 4 that are not icon renames.

## Maintenance notes

- With `shadcn@4` installed, a follow-up task can run `shadcn diff` per ui/
  component to reconcile local customizations with upstream `base-maia` —
  deliberately out of scope here.
- Base UI publishes minor releases monthly-ish; re-check quarterly.
- If anyone adds a lucide icon by memory, tsc is the guard — legacy alias
  names no longer exist.
