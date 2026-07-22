# Plan 046: Dead-code sweep — five confirmed orphans plus vetted dead exports

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. On
> any STOP condition, stop and report — do not improvise. When done, update
> this plan's row in `plans/README.md` — unless a reviewer dispatched you and
> told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 41c5962..HEAD -- src/routes/_guest.preview-menu.tsx src/data/intervention-config.ts src/components/hdp/term-summary-panel.tsx public/report-templates/msf.docx public/avatars/`
> On drift, STOP.
>
> **NEVER run `bun run check`.** Targeted `bunx prettier --check <file>` /
> `bunx eslint <file>` only.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none. **Run BEFORE plan 044** (044's replace lists assume
  `term-summary-panel.tsx` is gone).
- **Category**: tech-debt
- **Planned at**: commit `41c5962`, 2026-07-19

## Why this matters

The July legacy-Reports teardown (plan 034, −5,872 lines) and the IA flatten
(plan 035) left a small second wave of orphans: ~1,500 lines of code and
~60 KB of assets with zero importers, plus a tail of exports nothing consumes.
Dead modules mislead readers (e.g. `intervention-config.ts` suggests a wired
interventions feature that doesn't exist) and dead `public/` files ship in
every build. Every deletion below was verified by grep at planning time; the
maintainer explicitly approved deleting the `/preview-menu` design mockup
(2026-07-19).

## Current state

Verified-dead files (each grep run 2026-07-19 with alias `@/` AND relative
`./` import patterns; all zero importers):

| File                                        | Size      | Verification grep (re-run before deleting)                                                                                                                                                                                                                                                                                                |
| ------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/_guest.preview-menu.tsx`        | 984 lines | `grep -rn "preview-menu" src/ --include='*.ts*' \| grep -v _guest.preview-menu \| grep -v routeTree` → 0. It is a HeyTalia A/B/C design mockup reachable only by typing the URL; the dev-preview hub `src/routes/settings.tsx` links `skeleton-preview`/`error-preview`/`ds` but deliberately not this. **Maintainer approved deletion.** |
| `src/data/intervention-config.ts`           | 301 lines | `grep -rn "intervention-config\|getInterventions\|interventionRules\|InterventionPackage" src/ --include='*.ts*' \| grep -v "src/data/intervention-config"` → 0                                                                                                                                                                           |
| `src/components/hdp/term-summary-panel.tsx` | 192 lines | `grep -rn "term-summary-panel\|TermSummaryPanel" src/ --include='*.ts*' \| grep -v term-summary-panel.tsx` → 0. Superseded by the IA flatten — `src/routes/reports.summary.tsx` documents that Term Summary content now lives in the `/reports` "My students" tab.                                                                        |
| `public/report-templates/msf.docx`          | 58 KB     | `grep -rn "msf.docx" src/` → 0. The MSF template points at the PDF (`src/data/mock-agency-reports.ts:2178` → `/report-templates/msf.pdf`). Siblings `msf-probation.docx`/`msf-psv.docx` ARE referenced — do not touch them.                                                                                                               |
| `public/avatars/chloe.svg`                  | 3.5 KB    | `grep -rn "chloe.svg\|avatars/" src/` → 0 asset refs (the only "chloe" hits are a test-helper name in `src/lib/hdp-comment-draft.test.ts`, unrelated). Delete the then-empty `public/avatars/` directory too.                                                                                                                             |

Route files are auto-registered in the generated `src/routeTree.gen.ts` —
deleting `_guest.preview-menu.tsx` requires the route tree to regenerate,
which happens automatically on the next `bun run dev` / `bun run build`
(TanStack Router plugin in `vite.config.ts`). Do not hand-edit
`routeTree.gen.ts`.

Vetted dead-export candidates (knip@5 run at planning time; **each must be
re-verified** — knip has known false positives here for dynamic access and
test-only importers). Non-`ui/` exports only; `src/components/ui/*` unused
exports are the shadcn component API and stay by standing decision:

```
src/components/hdp/broadcast-requests-panel.tsx: pendingRequestsForTeacher, openRequestCount, PendingRequest (type)
src/components/hdp/tag-queue-context.tsx: contextFromPath, TagQueuePrefill (type), ComposerDraft (type)
src/data/filter-config.ts: textOperators
src/data/hdp.ts: CLASS_3A_STUDENT_IDS
src/data/mock-cockpit-submissions.ts: COCKPIT_LAST_SYNCED, getSubjectTeacher
src/data/mock-groups.ts: MOCK_SHARED_GROUPS
src/data/mock-reports.ts: addReport, filterReports
src/data/report-layouts.ts: P1_SECTION_DEFS, P1_DEFAULT_LAYOUT, defaultP1Layout, BUILT_IN_TEMPLATES, getTemplateById, SectionDef (type), BuiltInTemplate (type)
src/lib/hdp-notifications.ts: pushHdpNotification, HdpNotification (type)
src/lib/hdp-store.ts: tagsByAuthor, saveBroadcast, MAX_OUTSTANDING_PER_CLASS, ClassSummary (type), CreateBroadcastInput (type), BroadcastResponseResult (type)
src/lib/hdp-template-store.ts: saveTemplateLayout, loadTemplateLayout, listCustomTemplates, saveCustomTemplate, saveShareMessage, loadShareMessage, saveSharedReport, CustomTemplate (type), SharedReport (type)
src/lib/hdp-trends.ts: TREND_CLIMB_THRESHOLD, TREND_EASE_THRESHOLD, TREND_RECOVER_MARGIN
src/data/insights.ts: StaticFacts, SlipViaRow, SlipDetails, SlipResultRow (types)
src/data/timetable.ts: TimetableEntry (type)
src/hooks/use-breadcrumbs.tsx: BreadcrumbItem (type)
src/lib/auth.tsx: User (type)
src/components/reports/report-preview.tsx: ReportPreviewProps (type)
```

**Known trap**: `TREND_*` thresholds were made named exports deliberately in
plan 036 ("thresholds named exports") — check `src/lib/hdp-trends.test.ts`
for importers before touching; if tests import them, KEEP them. The same
test-importer check applies to every symbol above.

## Commands you will need

| Purpose              | Command                           | Expected                                                                                               |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Typecheck            | `bunx tsc --noEmit`               | 76 baseline errors at planning; 0 new (may DROP if deleted files carried errors — record before/after) |
| Tests                | `bunx vitest run`                 | 190 pass / 6 fail baseline (flaky `imported-columns.test.ts`); no new failures                         |
| Build                | `bun run build`                   | exit 0                                                                                                 |
| Dead-export re-check | `bunx --bun knip@5 --no-progress` | shrinking "Unused exports" list                                                                        |

## Scope

**In scope**:

- Delete: the five files/assets in the table above (+ empty `public/avatars/`).
- The files listed in the dead-export block — **modify only to remove the
  named export or the `export` keyword** (see Step 3 procedure).
- `src/routeTree.gen.ts` — regenerates itself; commit the regenerated file.

**Out of scope**:

- `src/components/ui/*` — shadcn API surface, keep all exports.
- `eslint.config.js` / `@tanstack/eslint-config` — knip flags them, but the
  eslint config imports the dep; knip config noise, not dead code.
- `TagEntryPoint`'s `'topbar'` and `'cmdk'` variants — kept by decision
  (maintainer feedback 2026-07-16).
- The redirect stub routes under `src/routes/reports.*` — intentional.
- `public/report-previews/*-thumb.png` — referenced via dynamic path
  construction (`students_.$id.agency-report.new.tsx:507`), alive.
- Any behavior change. This plan only deletes provably-unreferenced things.

## Git workflow

- Branch: `advisor/046-dead-code-sweep`
- One commit for the file deletions, one for the export pruning, e.g.
  `chore: remove post-teardown orphans (preview-menu, intervention-config, term-summary-panel, 2 assets)`
- No push/PR unless instructed.

## Steps

### Step 1: Re-verify and delete the five orphans

For each row in the Current-state table: re-run its verification grep (fresh
zero required), then delete the file. Then `bun run dev` briefly (or
`bun run build`) so `routeTree.gen.ts` regenerates without the preview-menu
route.

**Verify**: `bunx tsc --noEmit` → error count ≤ baseline, 0 new codes;
`grep -n "preview-menu" src/routeTree.gen.ts` → 0 matches; `bun run build` →
exit 0.

### Step 2: Confirm term-summary-panel's transitive imports still live

`term-summary-panel.tsx` imported `pattern-card` and `tag-queue-context`.
Verify both still have other importers:
`grep -rln "pattern-card\|tag-queue-context" src/ --include='*.ts*' | grep -v term-summary` → non-empty for each.

**Verify**: both greps non-empty (they are — `reports-home.tsx`,
`hdp-shell.tsx` et al. import them).

### Step 3: Prune dead exports (unexport → typecheck → delete)

For each symbol in the dead-export block, in this order:

1. `grep -rn "\b<symbol>\b" src/ --include='*.ts*'` **including test files**.
   If ANY hit outside the defining file → **skip the symbol** and list it in
   your completion report as a knip false positive.
2. If only the defining file hits: remove the `export` keyword (keep the
   symbol) and run `bunx tsc --noEmit`. If a new `TS6133`
   (declared-but-unused) appears for it, the symbol is fully dead → delete
   the declaration entirely. If tsc stays quiet, it's used within its own
   module → leave it unexported.
3. Batch per file; commit per 4–5 files.

**Verify after all**: `bunx tsc --noEmit` → 0 new error codes vs baseline;
`bunx vitest run` → no new failures; `bunx --bun knip@5 --no-progress` →
none of the processed symbols still listed.

### Step 4: Final gates

**Verify**: `bun run build` → exit 0; targeted `bunx prettier --check` +
`bunx eslint` on every modified file → clean; `git status` → only in-scope
files.

## Test plan

No new tests — deletions only. The existing suite (especially
`hdp-store.test.ts`, `hdp-trends.test.ts`, `hdp-draft-compose.test.ts`) is
the tripwire: if a "dead" export was actually test-consumed, Step 3.1 catches
it before deletion and vitest catches anything missed.

## Done criteria

- [ ] The five orphan files/assets are gone; `public/avatars/` removed
- [ ] `grep -n "preview-menu" src/routeTree.gen.ts` → 0
- [ ] `bunx tsc --noEmit` → no new error codes (count may drop; record it)
- [ ] `bunx vitest run` → no new failures
- [ ] `bun run build` → exit 0
- [ ] Completion report lists any skipped knip false positives
- [ ] `plans/README.md` row updated (include the new tsc baseline if it dropped)

## STOP conditions

- Any verification grep in Step 1 returns a non-zero importer — the codebase
  drifted; report instead of deleting.
- Deleting `_guest.preview-menu.tsx` breaks the build in a way route-tree
  regeneration doesn't fix.
- More than ~5 symbols in Step 3 turn out to be false positives — the knip
  snapshot is stale; stop and report rather than churning.

## Maintenance notes

- Plan 044 depends on this landing first (removes one `formatDate` +
  `CONTEXT_LABELS` site). If 044 runs first anyway, it must treat
  `term-summary-panel.tsx` as a normal replace site.
- knip is still not a devDependency; adding it + a `knip` script (and/or
  `eslint-plugin-unused-imports`) would prevent the next orphan wave — noted
  since Round 4, still open, deliberately not smuggled into this plan.
- If the maintainer later wants the preview-menu mockup back, it's one
  `git revert` away — note the deletion commit hash in the README row.
