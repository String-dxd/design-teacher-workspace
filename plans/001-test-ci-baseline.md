# Plan 001: Establish a test + CI verification baseline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9f03003..HEAD -- package.json eslint.config.js vitest.config.ts src/lib/draft-storage.ts .github/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests / dx
- **Planned at**: commit `9f03003`, 2026-06-10

## Why this matters

This repo has **zero automated verification**: no test files exist anywhere in
`src/` (vitest and Testing Library are installed but there is no vitest config),
there is no `.github/` directory (no CI), `npx tsc --noEmit` fails with 139
errors, and `npx eslint src/` reports 71 errors. The only command that passes
today is `bun run build`. Every other plan in `plans/` — and every future
refactor — is risky until "did I break something?" can be answered by a
command. This plan creates that foundation: a working vitest setup with the
first real unit tests, fixed package scripts, and a GitHub Actions workflow
that blocks on what currently passes (build, tests) and reports-without-blocking
on what currently fails (typecheck, lint) so the gates can be flipped to
blocking as later plans fix the errors.

## Current state

- `package.json` (repo root) — scripts are:

  ```json
  "scripts": {
    "dev": "vite dev --port 3000",
    "dev:3001": "vite dev --port 3001",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "eslint",
    "format": "prettier",
    "check": "prettier --write . && eslint --fix"
  }
  ```

  `"lint": "eslint"` and `"format": "prettier"` have no target arguments, so
  they do nothing useful when run standalone.

- There is **no** `vitest.config.ts`. Running `bun run test` today loads the
  app's `vite.config.ts` (which includes the `nitro()` and `tanstackStart()`
  plugins), prints `close timed out after 10000ms ... something prevents Vite
  server from exiting`, and exits 1. The vitest config you create must NOT
  import or reuse `vite.config.ts`.

- `eslint.config.js` is currently:

  ```js
  //  @ts-check

  import { tanstackConfig } from '@tanstack/eslint-config'

  export default [
    ...tanstackConfig,
    {
      ignores: ['.output/**'],
    },
  ]
  ```

  Running `npx eslint .` from the repo root crashes with parser errors on
  files under `.claude/worktrees/` (git worktrees checked out inside the
  repo). `npx eslint src/` runs but reports 71 errors / 13 warnings.

- `.github/` does not exist. No CI of any kind.

- `src/lib/draft-storage.ts` — a small, pure, dependency-free module
  (localStorage draft persistence for the announcement composer). It is the
  first test target. Its API:
  - `saveDraft(data: DraftData): void` — `JSON.stringify` + `localStorage.setItem`
    under key `'pg-new-post-draft'`, wrapped in try/catch.
  - `loadDraft(): DraftData | null` — returns `null` when the key is absent or
    `JSON.parse` throws.
  - `clearDraft(): void`
  - `daysRemaining(uploadedAt: string): number` — days left in a 30-day
    retention window, clamped to ≥ 0. Uses `Date.now()` internally, so tests
    must use vitest fake timers (`vi.setSystemTime`).

- Repo conventions: Bun is the package manager and script runner
  (`bunfig.toml` sets `[run] bun = true`); TypeScript strict; path alias
  `@/*` → `src/*` (configured in `tsconfig.json`, resolved in builds via the
  `vite-tsconfig-paths` plugin). Commit messages follow conventional-commit
  style, e.g. `feat: add 404 not-found page`, `chore(ci): add .gitguardian.yaml`.

## Commands you will need

| Purpose   | Command              | Expected on success |
|-----------|----------------------|---------------------|
| Install   | `bun install`        | exit 0 |
| Tests     | `bun run test`       | exit 0 after this plan (currently exits 1) |
| Build     | `bun run build`      | exit 0 (verified working at planning time, ~10s) |
| Typecheck | `npx tsc --noEmit`   | currently 139 errors — expected to KEEP failing after this plan |
| Lint      | `npx eslint src/`    | currently 71 errors — expected to KEEP failing after this plan |

## Scope

**In scope** (the only files you should modify or create):

- `vitest.config.ts` (create)
- `src/lib/draft-storage.test.ts` (create)
- `package.json` (scripts only)
- `eslint.config.js` (ignores only)
- `.github/workflows/ci.yml` (create)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- `vite.config.ts` — the app build config. Do not add a `test` block to it and
  do not import it from the vitest config; its nitro plugin hangs the test
  runner.
- Any file in `src/` other than the new test file. Fixing the 139 tsc errors
  and 71 lint errors is covered by plans 002/003 and deliberately deferred
  follow-ups — not this plan.
- `bun.lock` / `package-lock.json` — lockfile cleanup is plan 004.

## Git workflow

- Branch: `advisor/001-test-ci-baseline`
- Conventional commits, one per step (e.g. `chore(test): add vitest config and
  first unit tests`, `chore(ci): add GitHub Actions workflow`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the bare `lint` and `format` scripts

In `package.json`, change:

```json
"lint": "eslint",
"format": "prettier",
```

to:

```json
"lint": "eslint src/",
"format": "prettier --write .",
```

Leave `check` as is.

**Verify**: `bun run lint` → runs and prints the existing lint report (71
errors is expected; the command executing at all is the success condition).
`grep '"lint"' package.json` → shows `eslint src/`.

### Step 2: Stop eslint from crashing on worktree checkouts

In `eslint.config.js`, extend the ignores entry:

```js
{
  ignores: ['.output/**', '.claude/**', '.nitro/**', '.tanstack/**'],
},
```

**Verify**: `npx eslint . 2>&1 | tail -3` → ends with the problems summary
(e.g. `✖ 84 problems`), NOT a parser crash mentioning `.claude/worktrees`.

### Step 3: Create `vitest.config.ts`

Create at the repo root, standalone (no import of `vite.config.ts`):

```ts
import { defineConfig } from 'vitest/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

Vitest automatically prefers `vitest.config.ts` over `vite.config.ts`, which
sidesteps the nitro-plugin hang. `jsdom` is already a devDependency.

**Verify**: `bun run test` → exits 0 with "No test files found" OR runs 0
tests — it must NOT print `close timed out after 10000ms`. (If your vitest
version exits 1 on "no test files", proceed to step 4 and verify there.)

### Step 4: Write the first unit tests for `src/lib/draft-storage.ts`

Create `src/lib/draft-storage.test.ts`. There is no existing test to model
after (these are the repo's first tests); use standard vitest style:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearDraft, daysRemaining, loadDraft, saveDraft } from './draft-storage'
```

Cases to cover (jsdom provides a working `localStorage`):

1. `loadDraft()` returns `null` when nothing has been saved.
2. `saveDraft(data)` then `loadDraft()` round-trips the object (use a minimal
   `DraftData`-shaped object; the type requires many fields — build a helper
   `makeDraft()` that fills them with empty strings/arrays and override what
   the test cares about).
3. `clearDraft()` after a save → `loadDraft()` returns `null`.
4. Corrupted storage: `localStorage.setItem('pg-new-post-draft', '{not json')`
   → `loadDraft()` returns `null` (must not throw).
5. `daysRemaining`: with `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2026-06-10T00:00:00Z'))`:
   - uploaded today → 30
   - uploaded 31 days ago → 0 (clamped, never negative)
   - uploaded 29.5 days ago → 1 (Math.ceil behavior)

Use `afterEach(() => { localStorage.clear(); vi.useRealTimers() })`.

**Verify**: `bun run test` → exit 0, reports ≥ 6 passing tests in
`src/lib/draft-storage.test.ts`, no timeout message.

### Step 5: Add the CI workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - name: Test
        run: bun run test
      - name: Build
        run: bun run build
      # Non-blocking until the existing 139 tsc / 71 eslint errors are fixed
      # (plans 002, 003 and follow-ups). Flip continue-on-error to false then.
      - name: Typecheck (non-blocking)
        run: npx tsc --noEmit
        continue-on-error: true
      - name: Lint (non-blocking)
        run: bun run lint
        continue-on-error: true
```

**Verify**: `npx yaml-lint .github/workflows/ci.yml` if available, otherwise
`node -e "require('js-yaml')"` is NOT guaranteed to exist — acceptable
fallback: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"`
→ exit 0. Also re-run the two blocking gates locally: `bun run test` → exit 0
and `bun run build` → exit 0.

## Test plan

Covered by Step 4 (the test file is the deliverable). Verification:
`bun run test` → all pass, ≥ 6 tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run test` exits 0 with ≥ 6 passing tests and no
      `close timed out` message
- [ ] `bun run build` exits 0
- [ ] `bun run lint` executes eslint against `src/` (nonzero findings allowed)
- [ ] `npx eslint . 2>&1 | grep -c "claude/worktrees"` → 0
- [ ] `.github/workflows/ci.yml` exists and parses as YAML
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `bun run test` still hangs or times out after creating the standalone
  `vitest.config.ts` (the nitro hang has a deeper cause than config loading).
- `bun run build` fails at any point (it passed at planning time; a failure
  means the repo drifted).
- Importing `DraftData` into the test file produces type errors that require
  changing `src/lib/draft-storage.ts` itself — that file is read-only in this
  plan.
- You are tempted to fix tsc or eslint errors in `src/` to make a gate
  blocking — that is explicitly out of scope.

## Maintenance notes

- The typecheck and lint CI steps are `continue-on-error: true`. The intended
  end state is blocking gates; flip them as the error counts reach zero
  (plan 002 removes ~15 tsc errors, plan 003 one more; the remaining ~46 real
  type errors — mostly `string | null` Select handlers and Recharts typings —
  are a deferred follow-up recorded in `plans/README.md`).
- Reviewers should check that `vitest.config.ts` stays decoupled from
  `vite.config.ts`; anyone "unifying" them will reintroduce the nitro hang.
- Future test files just need to match `src/**/*.test.{ts,tsx}` — no registry
  to update.
