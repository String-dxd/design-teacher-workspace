# Plan 006: Remove Flow DS — consolidate all UI on Shadcn/Base UI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b22bd52..HEAD -- src/routes/attendance.tsx src/routes/_guest.student-login.tsx src/styles.css src/flow-ds-theme.css package.json "src/routes/ds.*"`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (removes a global CSS reset and migrates a live interactive page)
- **Depends on**: none (plans 001–005 are merged into main; tests and CI exist)
- **Category**: tech-debt
- **Planned at**: commit `b22bd52`, 2026-06-11

## Why this matters

The app standardized on **Shadcn UI over Base UI primitives** (`src/components/ui/`,
per `CLAUDE.md`/`AGENTS.md`), but a second design system — **Flow DS**
(`@flow/core`, `@flow/design-tokens`, transitively `@flow/icons`) — is still
wired in: two real routes import its components, `src/styles.css` imports four
Flow CSS layers plus a 429-line mapping file (`src/flow-ds-theme.css`), a
~2,200-line `/ds` demo playground showcases it, and a whole workspace app
(`apps/flow-ds-test`) exists only to test it. Two component systems mean two
APIs (this repo already shipped bugs from confusing Radix-style and
Base-UI-style props — see merged plan 002), double the CSS cascade, and a
component-reuse policy that's ambiguous about which `Button` is canonical.
This plan migrates the two real routes to the app's own `ui/` components and
deletes every Flow DS artifact. The maintainer chose to delete the **entire**
`/ds` playground (including the non-Flow `tw-theme` page) and
`apps/flow-ds-test`.

## Current state

### Flow DS usage map (complete — verified by `grep -rln "@flow" src/`)

| File | Uses |
|------|------|
| `src/routes/attendance.tsx` (245 lines) | `Avatar`, `AvatarFallback`, `Button`, `ToggleGroup`, `ToggleGroupItem` from `@flow/core`; 6 icons from `@flow/icons`; Flow utility classes |
| `src/routes/_guest.student-login.tsx` (91 lines) | `Button`, `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`, `Input`, `Label` from `@flow/core` |
| `src/routes/ds.tsx` (9 lines) | layout: just an `<Outlet/>` |
| `src/routes/ds.index.tsx` (64 lines) | links to the demo pages |
| `src/routes/ds.flow-components.tsx` (1,081 lines) | Flow component showcase |
| `src/routes/ds.flow-tokens.tsx` (1,056 lines) | Flow token tables |
| `src/routes/ds.tw-theme.tsx` (1,647 lines) | app TW theme reference (no `@flow` imports — deleted anyway per maintainer decision) |
| `src/styles.css` | 5 Flow-related imports (below) |
| `src/flow-ds-theme.css` (429 lines) | maps Flow DS vars from app tokens |
| `package.json` | `"@flow/core": "^0.1.17"`, `"@flow/design-tokens": "^0.1.7"`, `"workspaces": ["apps/*"]` |
| `apps/flow-ds-test/` | standalone Vite workspace app |

Nothing else in `src/` references `@flow` or links to `/ds` (verified:
`grep -rn "to=\"/ds" src/ --include="*.tsx"` outside `src/routes/ds.*` → empty).

### `src/styles.css` — exact lines to remove (lines 1–3, 9, 22 at `b22bd52`)

```css
@import '@flow/design-tokens/css';            /* line 1  — REMOVE */
@import '@flow/design-tokens/tailwind/reset'; /* line 2  — REMOVE (see note) */
@import '@flow/design-tokens/tailwind';       /* line 3  — REMOVE */
@import 'tailwindcss';                        /* line 4  — KEEP   */
...
@import '@flow/core/tailwind.no-reset.css';   /* line 9  — REMOVE */
...
@import './flow-ds-theme.css';                /* line 22 — REMOVE */
```

**Reset note**: line 2 is a CSS reset that loads BEFORE Tailwind's own
preflight (included via line 4). Removing it leaves Tailwind preflight as the
only reset. This is the riskiest part of the plan — base styles may shift
subtly app-wide. The visual checks in step 7 exist for this.

Everything else in `styles.css` is app-local and **stays**: the `@radix-ui/colors`
imports, the `:root` token block (twblue scale, Shadcn semantic tokens), the
`.dark` block, and the `@theme inline` block (which exposes `twblue-*`,
`twpurple-*`, `crimson-*`, `orange-*`, `lime-*`, `amber-*` as Tailwind
utilities — you will use these for the migration mappings). Two comments
become stale and must be updated (see step 5). The "Tier 1 overridable
primitives" block (`--_radius-*`, `--_spacing-*`, `--_text-*`, `--_weight-*`,
~lines 100–117) is consumed ONLY by `flow-ds-theme.css` — delete it in step 5
after re-verifying with the grep given there.

### Flow utility classes in `attendance.tsx` and their app-native replacements

The Flow Tailwind preset (line 3) provides utilities that exist nowhere else.
`attendance.tsx` is the only app file using them (verified). Mappings —
derived from `flow-ds-theme.css` Section A (e.g. `--color-critical-1: var(--crimson-1)`)
and the app's token values (`--_spacing-xs: 0.5rem`, `--_text-label-sm: 0.75rem`,
weight 500):

| Flow utility | Replace with | Basis |
|---|---|---|
| `text-default` | `text-foreground` | Flow default text → app foreground |
| `text-subtle` | `text-muted-foreground` | Flow subtle → app muted |
| `border-default` | `border-border` | convention: `src/components/app-header.tsx:62` |
| `border-success-7` / `bg-success-3` / `text-success-11` | `border-lime-7` / `bg-lime-3` / `text-lime-11` | Flow success scale maps to lime (verify in `flow-ds-theme.css` Section A before deleting it) |
| `border-critical-7` / `bg-critical-3` / `text-critical-11` | `border-crimson-7` / `bg-crimson-3` / `text-crimson-11` | `flow-ds-theme.css:65-72` |
| `border-amber-7` / `bg-amber-3` / `text-amber-11` | unchanged — `amber-*` is app-native via `@theme inline` | |
| `gap-xs` | `gap-2` | `--spacing-xs` = 0.5rem |
| `px-sm` | `px-3` | Flow `sm` spacing = 0.75rem |
| `typography-label-sm` | `text-xs font-medium` | 0.75rem / weight 500 |

### `attendance.tsx` ToggleGroup — current usage (lines 191–236)

```tsx
<ToggleGroup
  type="single"
  value={status ?? ''}
  onValueChange={(val) => handleStatusChange(student.id, val)}
  aria-label={`Attendance status for ${student.name}`}
>
  <ToggleGroupItem
    value="present"
    aria-label="Present"
    className={cn(
      'flex items-center gap-xs border px-sm typography-label-sm transition-colors',
      status === 'present'
        ? 'border-success-7 bg-success-3 text-success-11'
        : 'border-transparent text-subtle hover:text-default',
    )}
  >
    <CircleCheck className="size-4 shrink-0" />
    <span>Present</span>
  </ToggleGroupItem>
  ... (two more items: "late" with amber, "absent" with critical)
</ToggleGroup>
```

This is Flow's Radix-style API (`type="single"`, scalar `value`,
`onValueChange(string)`). The Shadcn Base UI toggle-group you will add in
step 1 may expose a different API (Base UI Toggle Group uses an **array**
`value` and `toggleMultiple` instead of `type`). Read the generated
`src/components/ui/toggle-group.tsx` and adapt the call site — e.g.
`value={status ? [status] : []}` and
`onValueChange={(vals) => handleStatusChange(student.id, vals[0] ?? '')}` —
preserving single-select toggle behavior (clicking the active item may
deselect; current code handles `''`/null status).

There is no other `Avatar`/`Button` API risk: the app's
`src/components/ui/avatar.tsx` exports `Avatar`/`AvatarFallback`, and
`src/components/ui/button.tsx` exports `Button` with a `default` variant —
same names `attendance.tsx` already uses. `_guest.student-login.tsx` uses
only prop-less `Card*`/`Input`/`Label`/`Button` — direct import swaps.

Icons: all six (`CalendarCheck2`, `CircleCheck`, `CircleX`, `Clock`,
`Search`, `UserRound`) exist under the same names in `lucide-react`
(verified), which is the app's icon convention.

### Repo conventions

- Add Shadcn components ONLY via `bunx shadcn@latest add <name>`
  (per `CLAUDE.md`; components.json is configured for the `base-maia` style on
  Base UI). Do NOT hand-write `ui/` primitives.
- Imports use the `@/` alias. Icons from `lucide-react`.
- `src/routeTree.gen.ts` is auto-generated by the TanStack Router plugin on
  `dev`/`build` and is committed — after deleting routes, run a build and
  commit the regenerated file.
- Conventional commits (`refactor:`, `chore:`, e.g. `fix(ui): replace Radix
  asChild with Base UI render prop on triggers` from `git log`).

## Commands you will need

| Purpose   | Command            | Expected on success |
|-----------|--------------------|---------------------|
| Install   | `bun install`      | exit 0 |
| Tests     | `bun run test`     | 53 tests pass (3 files) |
| Build     | `bun run build`    | exit 0 (also regenerates `routeTree.gen.ts`) |
| Typecheck | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | baseline ~120 at `b22bd52`; must be LOWER after (ds pages carry several errors) |
| Dev smoke | `bun run dev` then `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/<route>` | 200 |
| Add component | `bunx shadcn@latest add toggle-group` | creates `src/components/ui/toggle-group.tsx` |

## Suggested executor toolkit

- If the `agent-browser` CLI is available, use it for step 0/7 screenshots
  (`agent-browser --session plan006 open <url>`, `screenshot <path>`). A
  first visit shows a "Welcome to Teacher Workspace" modal — click
  "Get started" before screenshotting. Otherwise curl-based 200 checks +
  reporting that visual checks were skipped is acceptable; say so plainly.

## Scope

**In scope** (the only files you may modify, create, or delete):

- `src/routes/attendance.tsx` (migrate)
- `src/routes/_guest.student-login.tsx` (migrate)
- `src/components/ui/toggle-group.tsx` (create via shadcn CLI)
- `src/routes/ds.tsx`, `ds.index.tsx`, `ds.flow-components.tsx`,
  `ds.flow-tokens.tsx`, `ds.tw-theme.tsx` (delete all five)
- `src/flow-ds-theme.css` (delete)
- `src/styles.css` (remove the 5 Flow imports, the `--_*` block, stale comments)
- `src/routeTree.gen.ts` (regenerated by build)
- `package.json` (remove 2 deps + `workspaces` key), `bun.lock` (regenerated)
- `apps/flow-ds-test/` (delete directory)
- `README.md` (remove the Flow DS row from the tech-stack table; remove
  `apps/` from the project-structure tree if listed)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- `packages/ds-tw-skills/` — skill tooling consumed by other projects, not
  part of this app's build. Leave it.
- `src/components/ui/*` (existing files) — no edits to existing primitives.
- The `@radix-ui/colors` imports and all token definitions in `styles.css`
  other than what step 5 names — the app theme depends on them.
- `shadcn`, `tw-animate-css`, `@radix-ui/colors` packages — still used.
- Every other route/component. If a file outside this list needs a change to
  make the build pass, STOP.

## Git workflow

- Branch: `advisor/006-remove-flow-ds`
- Conventional commits per step, e.g.
  `refactor(attendance): migrate from @flow/core to app ui components`,
  `chore(ds): delete Flow DS demo routes and theme bridge`,
  `chore(deps): drop @flow/core and @flow/design-tokens`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 0: Baselines

Record: `npx tsc --noEmit 2>&1 | grep -c "error TS"` (expect ~120),
`bun run test` (expect 53 pass), `bun run build` (expect exit 0). If
agent-browser is available: start `bun run dev`, screenshot `/`,
`/attendance`, and `/student-login` to `/tmp/plan006-before-*.png`.

**Verify**: all three baseline commands behave as expected — if not, STOP
(repo drifted).

### Step 1: Add the Shadcn toggle-group component

```
bunx shadcn@latest add toggle-group
```

**Verify**: `ls src/components/ui/toggle-group.tsx` → exists;
`npx tsc --noEmit 2>&1 | grep toggle-group` → no output;
`git status` shows ONLY the new file (if the CLI modified other files,
inspect and revert anything outside scope). If the registry has no
`toggle-group` for this style, STOP.

### Step 2: Migrate `src/routes/attendance.tsx`

1. Replace the `@flow/core` import with:
   `import { Avatar, AvatarFallback } from '@/components/ui/avatar'`,
   `import { Button } from '@/components/ui/button'`,
   `import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'`.
2. Replace the `@flow/icons` import with the same six names from
   `'lucide-react'`.
3. Adapt the ToggleGroup call site to the generated component's API (see
   "Current state" — likely array `value`; keep single-select + deselect
   behavior).
4. Apply the utility-class mapping table from "Current state" to every
   occurrence (`grep -nE "text-default|text-subtle|border-default|success-|critical-|gap-xs|px-sm|typography-" src/routes/attendance.tsx`
   to find them all).

**Verify**: `grep -c "@flow" src/routes/attendance.tsx` → 0;
`npx tsc --noEmit 2>&1 | grep attendance` → no output (or only pre-existing
TS6133 lines if any); `bun run build` → exit 0.

### Step 3: Migrate `src/routes/_guest.student-login.tsx`

Replace the single `@flow/core` import with:
`import { Button } from '@/components/ui/button'`,
`import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'`,
`import { Input } from '@/components/ui/input'`,
`import { Label } from '@/components/ui/label'`.
No other changes expected — the JSX uses only standard props.

**Verify**: `grep -c "@flow" src/routes/_guest.student-login.tsx` → 0;
`npx tsc --noEmit 2>&1 | grep student-login` → no output; `bun run build` → exit 0.

### Step 4: Delete the `/ds` playground

```
git rm src/routes/ds.tsx src/routes/ds.index.tsx src/routes/ds.flow-components.tsx src/routes/ds.flow-tokens.tsx src/routes/ds.tw-theme.tsx
```

Run `bun run build` to regenerate `src/routeTree.gen.ts`; stage the
regenerated file.

**Verify**: `grep -c "ds/flow\|ds/tw-theme" src/routeTree.gen.ts` → 0;
`bun run build` → exit 0; `grep -rln "@flow" src/` → exactly two files:
`src/styles.css` and `src/flow-ds-theme.css`.

### Step 5: Remove the Flow CSS layers

1. In `src/styles.css`, delete the 5 import lines exactly as listed in
   "Current state" (lines 1–3, 9, 22 pre-drift — match by content, not line
   number).
2. Delete the "Tier 1 overridable primitives" block (`--_radius-*`,
   `--_spacing-*`, `--_text-*`, `--_weight-*` and its comment) — but FIRST
   re-verify it is unconsumed:
   `grep -rn '\-\-_' src/ --include='*.tsx' --include='*.css' | grep -v styles.css | grep -v flow-ds-theme` → must be empty (it was at planning time).
3. Update the two stale comments: the App Token block comment mentioning
   "flow-ds-theme.css reads these to map Flow DS tokens" and the Dark Mode
   comment mentioning "flow-ds-theme.css auto-resolve" — rewrite to describe
   the app tokens without referencing Flow.
4. `git rm src/flow-ds-theme.css`.

**Verify**: `grep -c "flow" src/styles.css` → 0; `bun run build` → exit 0;
`bun run test` → 53 pass.

### Step 6: Drop the packages and the workspace app

1. In `package.json`: remove `"@flow/core"` and `"@flow/design-tokens"` from
   dependencies, and remove the `"workspaces": ["apps/*"]` key (its only
   member is being deleted).
2. `git rm -r apps/flow-ds-test`
3. `bun install` (regenerates `bun.lock` without the Flow packages).
4. `README.md`: delete the `| Design Tokens | Flow Design System ... |` row
   from the tech-stack table and the `apps/` line from the project-structure
   tree.

**Verify**: `grep -c "@flow" package.json bun.lock | grep -v ":0"` → no
output; `bun run build` → exit 0; `bun run test` → 53 pass.

### Step 7: Full verification + visual check

- `grep -rn "@flow" src/ package.json` → empty.
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → LOWER than the step 0
  baseline (the deleted ds pages carried errors; the migrations must add none).
- `bun run dev`, then HTTP 200 on `/`, `/attendance`, `/student-login`,
  `/students`, `/forms`; HTTP 404-page (the app's custom not-found) on `/ds`.
- Visual: screenshot `/`, `/attendance`, `/student-login` to
  `/tmp/plan006-after-*.png` and compare against step 0. Expected deltas:
  none on `/`; on `/attendance` only the toggle-group/avatar/button details
  may shift within reason; `/student-login` form should look equivalent.
  Anything beyond that (fonts, margins, list markers changing app-wide)
  means the reset removal regressed base styles → STOP and report with both
  screenshots.
- Functional: on `/attendance`, click each of Present/Late/Absent on one
  student row and confirm the selected state styles change (lime/amber/crimson).

## Test plan

No new unit tests — this is a migration/deletion plan; the existing 53-test
suite, typecheck delta, build, and the step 7 visual/functional checks are
the gates. (The attendance toggle logic is plain useState; if you find
yourself wanting a test harness for it, that is out of scope here.)

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn "@flow" src/ package.json` → empty
- [ ] `ls src/flow-ds-theme.css src/routes/ds.tsx apps/flow-ds-test 2>&1 | grep -c "No such file"` → 3
- [ ] `src/components/ui/toggle-group.tsx` exists
- [ ] `bun run test` → 53 pass; `bun run build` → exit 0
- [ ] tsc error count < step 0 baseline
- [ ] `/attendance` and `/student-login` return HTTP 200 from the dev server
- [ ] `git status` clean apart from in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `bunx shadcn@latest add toggle-group` fails or the registry has no such
  component for the configured style — do NOT hand-write a toggle-group.
- The generated toggle-group cannot reproduce single-select-with-deselect
  behavior used on `/attendance`.
- Removing the Flow reset (step 5) visibly changes pages OUTSIDE the two
  migrated routes (step 7 comparison) — report with before/after screenshots.
- You find `@flow` usage or Flow utility classes in any file not listed in
  the usage map (the map was verified complete at `b22bd52`; a new usage
  means drift).
- `bun install` after step 6 wants to change versions of packages other than
  removing the two `@flow/*` entries (inspect the `bun.lock` diff).

## Maintenance notes

- After this lands, the **only** component system is `src/components/ui/`
  (Shadcn on Base UI). Reviewers should reject any new `@flow/*` import; the
  CI typecheck/build gates will catch unresolvable imports once the packages
  are gone.
- The `/ds` URLs now 404. If a living theme reference is wanted later, the
  deleted `ds.tw-theme.tsx` (1,647 lines, no Flow deps) can be restored from
  git history (`git show b22bd52:src/routes/ds.tw-theme.tsx`) with only its
  `--color-brand-*` var references needing cleanup.
- `packages/ds-tw-skills` and the user-level `ds-tw-design` / `ds-tw-install`
  skills target Flow DS and no longer apply to this repo — using them here
  would reintroduce what this plan removes.
- The Flow reset is gone; Tailwind preflight (via `@import 'tailwindcss'`) is
  now the single base-style layer. If subtle base-style regressions surface
  later (e.g. button font inheritance), fix them in `styles.css` `@layer base`
  rather than reintroducing any Flow import.
