# Plan 014: Remove dead files, dead dependencies, and declare the transitive `react-query`

> **Executor instructions**: Follow step by step. Run every verification command and
> confirm the expected result before the next step. If a "STOP conditions" item occurs,
> stop and report — do not improvise. When done, update the status row in
> `plans/README.md`. Do NOT push or open a PR unless told to.
>
> **Drift check (run first)**: `git diff --stat 8a71db6..HEAD -- package.json src/components src/data` — if in-scope files changed since `8a71db6`, re-run the "zero importers" greps in Step 1 before deleting anything; a file that has GAINED an importer is a STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (removals confirmed to have zero importers / zero usages)
- **Depends on**: none. (Do this BEFORE plan 017 — it shrinks the dead-export list.)
- **Category**: tech-debt (dead code)
- **Planned at**: commit `8a71db6`, 2026-07-01

## Why this matters

A dead-code audit (knip + import-graph verification) found ~10 source files with **zero
importers**, forming three orphaned subtrees left behind by past refactors, plus ~11
`package.json` dependencies with **zero usages**. Dead files mislead readers (two were
even recolored in the plan-011 color sweep before being found dead), and dead deps bloat
the lockfile and install. Removing them is low-risk because nothing imports them.

One coupling: `@tanstack/react-query` is imported directly by two route files but is
**not declared** in `package.json` — it currently resolves transitively through
`@tanstack/react-router-ssr-query`, which is itself dead. So removing `ssr-query` without
first declaring `react-query` would break the build. This plan declares it.

## Current state (verified at `8a71db6`)

### Dead files — three orphaned subtrees + standalones (zero importers each)

- **Old announcements UI**: `src/components/announcements/announcement-list.tsx` (no
  importers) → its only child `src/components/announcements/announcement-card.tsx`
  (imported only by `announcement-list.tsx`).
- **Old report detail**: `src/components/reports/report-detail.tsx` (no importers) →
  `src/components/reports/character-section.tsx` and
  `src/components/reports/academic-section.tsx` (imported only by `report-detail.tsx`) →
  `src/data/threshold-config.ts` (imported only by those two sections).
- **Orphaned devtools**: `src/components/draggable-tanstack-devtools.tsx` (no importers;
  sole user of `@tanstack/react-devtools` + `@tanstack/react-router-devtools`).
- **Orphaned gallery demo**: `src/components/component-example.tsx` (no importers — the
  `/ds` route renders `component-gallery.tsx`, not this file).
- **Orphaned skeleton**: `src/components/students/student-table-skeleton.tsx` (no importers).

> Note: the live report page uses `core-values-section` / `cca-section` / `via-section`
> etc. — those are NOT dead. Only `character-section` + `academic-section` (used solely by
> the dead `report-detail`) are dead. `src/components/example.tsx` is NOT dead
> (`component-gallery.tsx` uses it) — do not delete it.

### Dead dependencies (`package.json`, zero usages — line numbers at `8a71db6`)

```
21  "@tanstack/react-devtools": "^0.7.0",           ← only used by draggable file (deleted in Step 1)
23  "@tanstack/react-router-devtools": "^1.132.0",  ← only used by draggable file
24  "@tanstack/react-router-ssr-query": "^1.131.7", ← unused; transitively provides react-query (see below)
26  "@tanstack/router-plugin": "^1.132.0",          ← not used in vite.config.ts (uses tanstackStart())
27  "@tiptap/extension-color": "^3.20.0",           ← editor imports only underline/text-align/link/task-*/highlight
30  "@tiptap/extension-placeholder": "^3.20.0",
34  "@tiptap/extension-text-style": "^3.20.0",
48  "react-grab": "^0.1.13",                        ← zero matches repo-wide
```

devDependencies:

```
57  "@tanstack/devtools-vite": "^0.3.11",           ← devtools() plugin is commented out in vite.config.ts
59  "@testing-library/dom": "^10.4.0",              ← no test imports it (tests are pure-logic, vitest only)
60  "@testing-library/react": "^16.2.0",            ← no render() calls in any *.test.ts
71  "web-vitals": "^5.1.0"                           ← zero matches repo-wide
```

**Keep** `@tanstack/eslint-config` (used in `eslint.config.js:3`) — knip false-positive.

### Missing declared dependency

`@tanstack/react-query` is imported in `src/routes/__root.tsx:8` and `src/routes/_guest.tsx:2`
(`import { QueryClient, QueryClientProvider } from '@tanstack/react-query'`) but is absent
from `package.json`. Add it to `dependencies` (a version is already resolved in the
lockfile via `ssr-query`'s peer range `>=5.90.0`; declare that satisfied version).

### Repo conventions

- `bun` runtime; `bun install` regenerates `bun.lock`. Build = `bun run build` (Vite;
  does NOT run tsc). Conventional commits.

## Commands you will need

| Purpose           | Command                                       | Expected                                                                              |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Install           | `bun install`                                 | exit 0, lockfile updates                                                              |
| Build             | `bun run build`                               | exit 0                                                                                |
| Typecheck         | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | **≤ 111** and should DROP (dead files carried unused-local errors); must not increase |
| Tests             | `bunx vitest run 2>&1 \| grep "Tests "`       | **37 passed / 16 failed** (unchanged — tests don't use testing-library)               |
| Dead-code recheck | `bunx --bun knip@5 --no-progress`             | the deleted files/deps no longer listed                                               |

## Scope

**In scope**: the 10 dead files listed above; `package.json` (remove 11 deps, add
`@tanstack/react-query`); `bun.lock` (regenerated by `bun install`); `plans/README.md`.

**Out of scope** — do NOT touch: `src/components/example.tsx`, `component-gallery.tsx`,
`core-values-section.tsx`, `cca-section.tsx`, `via-section.tsx`, any `src/components/ui/*`,
`@tanstack/eslint-config`. Dead _exports_ in live files are **plan 017**, not here.

## Steps

### Step 0: Baselines

`npx tsc --noEmit 2>&1 | grep -c "error TS"` (≈111), `bunx vitest run` (37/16),
`bun run build` (exit 0). If materially different, STOP (repo drifted).

### Step 1: Confirm zero importers, then delete the 10 dead files

For each file, confirm no importers first:
`grep -rlE "from ['\"][^'\"]*<basename-no-ext>['\"]|import\(['\"][^'\"]*<basename>" src --include="*.tsx" --include="*.ts" | grep -v routeTree.gen`
Expected: empty for `announcement-list`, `report-detail`, `draggable-tanstack-devtools`,
`component-example`, `student-table-skeleton`; and for `announcement-card` /
`character-section` / `academic-section` / `threshold-config` the ONLY importer is another
file in this deletion set. If any has an unexpected importer, STOP.

Then delete:

```
git rm src/components/announcements/announcement-list.tsx \
       src/components/announcements/announcement-card.tsx \
       src/components/reports/report-detail.tsx \
       src/components/reports/character-section.tsx \
       src/components/reports/academic-section.tsx \
       src/data/threshold-config.ts \
       src/components/draggable-tanstack-devtools.tsx \
       src/components/component-example.tsx \
       src/components/students/student-table-skeleton.tsx
```

**Verify**: `bun run build` → exit 0 (nothing referenced them).

### Step 2: Remove the 11 dead deps and declare `react-query`

In `package.json`, delete the 8 dependency lines and 4 devDependency lines listed in
"Current state". Add to `dependencies` (alphabetical position, next to other `@tanstack/*`):
`"@tanstack/react-query": "<resolved version>",` — read the version currently in
`bun.lock` for `@tanstack/react-query` and pin that exact minor (e.g. `^5.x`).

**Verify**: `grep -cE "react-devtools|router-devtools|ssr-query|router-plugin|extension-color|extension-placeholder|extension-text-style|react-grab|devtools-vite|testing-library|web-vitals" package.json` → `0`; `grep -c '"@tanstack/react-query"' package.json` → `1`.

### Step 3: Reinstall and full verification

- `bun install` → exit 0.
- `bun run build` → exit 0.
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → ≤ 111 (expected to drop — deleted files
  had TS6133 unused-locals; note the new number for plan 015's baseline).
- `bunx vitest run 2>&1 | grep "Tests "` → 37 passed / 16 failed.
- `bunx --bun knip@5 --no-progress` → the 10 files and 11 deps no longer appear; the
  `@tanstack/react-query` "unlisted" issue on `__root.tsx`/`_guest.tsx` is gone.

## Test plan

No new unit tests (pure deletion + manifest edit). Gates: build, tsc-not-increased,
vitest-unchanged, knip-recheck, and the grep assertions in Steps 1–2.

## Done criteria

- [ ] 10 files deleted; `git status` shows only them + `package.json` + `bun.lock` + README.
- [ ] `package.json`: 11 deps removed, `@tanstack/react-query` added.
- [ ] `bun run build` exit 0; `tsc` ≤ 111 (record new count); `bunx vitest run` 37/16.
- [ ] `bunx knip` no longer lists the removed files/deps.
- [ ] `plans/README.md` row updated with the new tsc count.

## STOP conditions

- Any "dead" file turns out to have an importer at HEAD (drift since `8a71db6`).
- `bun run build` fails after deleting files (a dynamic import was missed) — restore and report.
- `tsc` error count INCREASES, or vitest passing drops below 37.
- The resolved `@tanstack/react-query` version can't be found in the lockfile — STOP and report (don't guess a major version).

## Maintenance notes

- After this lands, re-run `bunx knip` — some exports in live files may now show as dead
  because their only consumers were the deleted files; those are **plan 017**.
- If TanStack devtools are ever wanted back, re-add via the framework's current
  integration (not the removed `draggable-tanstack-devtools.tsx` wrapper).
- `@tanstack/react-query` is now a direct dep — keep it declared even if a future refactor
  reintroduces `ssr-query`.
