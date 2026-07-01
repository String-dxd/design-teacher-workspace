# Plan 015: Strip unused imports/locals (TS6133) and unblock the typecheck CI gate

> **Executor instructions**: Follow step by step, run every gate. STOP conditions halt
> you — don't improvise. Update `plans/README.md` when done. Don't push/PR unless told.
>
> **Drift check**: run Step 0 to get the live TS6133 count; this plan is count-driven, not
> line-number-driven, so drift is tolerated as long as the errors are still TS6133.

## Status

- **Priority**: P2
- **Effort**: S–M (68 sites at `8a71db6`, mechanical; fewer after plan 014)
- **Risk**: LOW (removing provably-unused imports/locals; `tsc` verifies)
- **Depends on**: **plan 014 recommended first** (deleting dead files removes some of these
  errors). Not a hard dependency.
- **Category**: tech-debt (dead code)
- **Planned at**: commit `8a71db6`, 2026-07-01

## Why this matters

`tsconfig.json` sets `noUnusedLocals: true` and `noUnusedParameters: true`, but the build
(`vite build` / esbuild) does not run `tsc`, and the typecheck CI step is non-blocking —
so **68 unused-import/local errors (TS6133)** have accumulated (of 111 total `tsc` errors).
These are pure dead code: imports never used, variables/destructures never read. Clearing
them removes noise and is the **prerequisite to making the typecheck a blocking CI gate**
(a long-standing deferred item — see `plans/README.md` "Deferred follow-ups"): once TS6133
is 0, only the ~43 remaining "real" type errors stand between the repo and a green
blocking typecheck.

## Current state (at `8a71db6`, before plan 014)

`npx tsc --noEmit 2>&1 | grep -c "TS6133"` → **68**, across ~30 files. Heaviest:

```
11  src/routes/announcements.$id.tsx
 8  src/components/heytalia/heytalia-panel.tsx
 6  src/routes/students_.$id.agency-report.new.tsx
 5  src/data/mock-reports.ts
 4  src/components/comms/recipient-read-table.tsx
 3  each: mock-student-groups.ts, import-wizard.tsx, column-header-menu.tsx, academic-analytics.tsx
 …1–2 each across ~20 more files
```
Each error is either `'X' is declared but its value is never read` (an unused import
specifier or local `const`/destructure) or an unused function parameter.

### Repo conventions
- `bun` runtime. `bun run check` = `prettier --write . && eslint --fix`. ESLint uses
  `@tanstack/eslint-config` (`eslint.config.js`). Conventional commits.

## Commands you will need
| Purpose | Command | Expected |
|---|---|---|
| List the errors | `npx tsc --noEmit 2>&1 \| grep "TS6133"` | file:line + symbol for each |
| Count them | `npx tsc --noEmit 2>&1 \| grep -c "TS6133"` | target **0** when done |
| Total tsc | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | drops by the number of TS6133 fixed; must not gain NON-TS6133 errors |
| Build | `bun run build` | exit 0 |
| Tests | `bunx vitest run 2>&1 \| grep "Tests "` | 37 passed / 16 failed (unchanged) |
| Format/lint | `bun run check` | clean; keep formatting in a separate commit if it reflows |

## Scope
**In scope**: removing unused imports/locals/params flagged by TS6133, in whatever files
`tsc` reports them. **Out of scope**: the other ~43 tsc errors (they are real type issues,
NOT dead code — do not "fix" them here); any behavior change; the CI-gate flip itself
(that's a follow-up once this is 0).

## Steps

### Step 0: Baseline
`npx tsc --noEmit 2>&1 | grep -c "TS6133"` (record N — 68 at `8a71db6`, fewer if plan 014
landed), and `grep -c "error TS"` (record total). `bun run build` exit 0; `bunx vitest run` 37/16.

### Step 1: Remove each TS6133 site
Work file by file from the `grep "TS6133"` list. For each:
- **Unused import specifier** → delete just that specifier (or the whole `import` line if it
  becomes empty). Do NOT remove a side-effect import (`import './x.css'`) — TS6133 won't
  flag those anyway.
- **Unused local `const`/`let`/destructured var** → delete the declaration **only if its
  initializer has no side effects** (a plain value, a `useX()` hook result that's unused, a
  destructure field). If the initializer is a function CALL that may have side effects
  (e.g. `const _ = doThing()`), keep the call but drop the binding — or if unsure, STOP and
  list it for review rather than guessing.
- **Unused function parameter** → prefix with `_` (e.g. `(_e) =>`) if positional and
  required by the signature; delete if trailing and safe.

Re-run `npx tsc --noEmit 2>&1 | grep -c "TS6133"` periodically; it should trend to 0.

### Step 2: Verify
- `npx tsc --noEmit 2>&1 | grep -c "TS6133"` → **0**.
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → equals (baseline total − baseline TS6133);
  **no NEW error codes** introduced.
- `bun run build` → exit 0. `bunx vitest run` → 37/16.
- `bun run check` → clean (commit any prettier reflow separately).

## Test plan
No new tests. Gate is `TS6133 → 0` with no new tsc errors, build green, tests unchanged.

## Done criteria
- [ ] `npx tsc --noEmit | grep -c "TS6133"` → 0
- [ ] Total tsc errors dropped by exactly the fixed count; no new error codes
- [ ] `bun run build` exit 0; `bunx vitest run` 37/16
- [ ] `plans/README.md` updated (note the new total tsc count — enables the CI-gate flip)

## STOP conditions
- Removing a local would drop a call with possible side effects and you can't tell — list it, skip it, report.
- Total tsc errors would rise or a new (non-TS6133) error appears after a removal — revert that edit and report.
- A TS6133 sits inside a file plan 014 is deleting — skip it (plan 014 removes the file).

## Maintenance notes
- Once this is 0, the **follow-up** is flipping the GitHub Actions typecheck step from
  `continue-on-error: true` to blocking (the ~43 remaining real errors must be triaged
  first — a separate plan). Note that in the CI workflow file.
- Consider adding `eslint-plugin-unused-imports` (autofix on `bun run check`) to prevent
  regressions — optional follow-up, not this plan.
