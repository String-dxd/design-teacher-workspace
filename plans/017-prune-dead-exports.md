# Plan 017: Prune dead non-UI exports (unexport-or-delete, tsc-verified)

> **Executor instructions**: Follow step by step. Use the unexport→tsc→delete method in
> Step 2 — it makes every removal verifiable. STOP conditions halt you. Update
> `plans/README.md` when done. Don't push/PR unless told.
>
> **Drift check**: this plan is knip-driven — run Step 0 to regenerate the live dead-export
> list at HEAD rather than trusting the list below verbatim (plan 014 changes it).

## Status
- **Priority**: P3
- **Effort**: M (~40 exports across ~19 files; finicky — types vs values, mock data judgment)
- **Risk**: LOW–MED (a dynamically/re-exported symbol could look dead; the tsc method guards it)
- **Depends on**: **plan 014 first** (removing dead files deletes some of these files and
  may make more exports dead). Re-run knip after 014 to get the true list.
- **Category**: tech-debt (dead code)
- **Planned at**: commit `8a71db6`, 2026-07-01

## Why this matters
knip found ~40 exported symbols in **live** files with zero importers — dead public API
surface (unused mock-data exports, superseded lib helpers, over-exported in-file helpers).
Trimming them clarifies each module's real contract. This is the finicky tail of the
dead-code work, deliberately sequenced last.

## Current state (at `8a71db6`, BEFORE plan 014 — re-verify with knip in Step 0)

**Bucket A — likely "unexport" (used in-file, needlessly exported):**
- `src/components/app-card.tsx`: `AppIcon`
- `src/components/heytalia/heytalia-panel.tsx`: `AGENTS`, `AgentDef` (type)

**Bucket B — likely "delete" (unused anywhere):**
- `src/lib/filter-evaluation.ts`: `KNOWN_FILTER_FIELDS`, `EvaluateOptions` (type)
- `src/lib/profile-group-evaluation.ts`: `studentMatchesCriterion`
- `src/lib/profile-group-storage.ts`: `loadProfileGroups`, `saveProfileGroup`,
  `deleteProfileGroup`, `getAppliedProfileGroupId`, `setAppliedProfileGroupId` (the live API
  is `useProfileGroups` — keep that)
- `src/lib/utils.ts`: `getStatusColor`, `StatusThreshold` (type) — consumers were the
  now-deleted report chain (plan 014)
- `src/lib/chart-colors.ts`: `CATEGORICAL_6`, `CATEGORICAL_COLORS`, `CHART_AXIS`,
  `Categorical6Color` (type), `CategoricalColor` (type) — never adopted by any chart
- `src/data/filter-config.ts`: `textOperators`, `PeriodTerm` (type), `PeriodYear` (type), `FilterFieldConfig` (type)
- `src/components/example.tsx`: `ExampleWrapper` (only consumer was deleted `component-example.tsx`)
- `src/data/mock-agency-reports.ts`: `DATA_SOURCES`, `AGENCY_LOGOS`, `DataSource` (type), `SourceExcerpt` (type)
- `src/data/mock-students.ts`: `classOptions`, `ClassGroup` (type), `DashboardMetrics` (type)
- `src/data/mock-groups.ts`: `getMockStudentById`
- `src/data/mock-student-groups.ts`: `SCHOOL_GROUP`, `CUSTOM_GROUPS`, `STUDENT_SCOPES`
- `src/data/mock-announcements.ts`: `getAnnouncementById`
- `src/data/mock-form-responses.ts`: `FORM_RESPONSES`
- `src/data/mock-reports.ts`: `getUniqueStudents`, `ReportFilters` (type)
- `src/data/intervention-config.ts`: `getInterventions`, `AccentColor`/`InterventionAction`/`InterventionResource`/`InterventionPackage` (types)
- `src/components/students/column-visibility-popover.tsx`: `CURRENT_TERM_LABEL`, `PREV_TERM_KEY`, `PREV_TERM_LABEL`
- `src/components/students/subject-selector-dialog.tsx`: `SUBJECT_GROUPS`

**Do NOT touch — considered and KEPT:** all `src/components/ui/*` unused exports
(`DialogPortal`, `SidebarMenuSub`, `Combobox*`, `Field*`, etc.) — that is the shadcn
primitive library's public API surface; trimming it deviates from the component-kit
convention and the `CLAUDE.md`/`AGENTS.md` reuse policy.

### Mock-data judgment
The `src/data/mock-*` exports are demo data. They're safe to remove *now* (nothing imports
them), but if any is obviously staged for an in-progress feature, prefer to leave it and
note it. Don't delete a mock export that a WIP branch clearly consumes.

### Repo conventions
`tsconfig` has `noUnusedLocals: true` — so unexporting a symbol that isn't used in-file
immediately surfaces as a `tsc` TS6133 error. Use that as the delete signal. `bun` runtime.

## Commands you will need
| Purpose | Command | Expected |
|---|---|---|
| Live dead-export list | `bunx --bun knip@5 --no-progress` | current exports/types with 0 importers |
| Per-symbol importer check | `grep -rlE "\b<symbol>\b" src --include="*.tsx" --include="*.ts" \| grep -v <defining-file>` | empty ⇒ no external use |
| Typecheck | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | must not gain NEW errors beyond expected TS6133 you then resolve |
| Build / tests | `bun run build` ; `bunx vitest run` | exit 0 ; 37/16 |

## Scope
**In scope**: removing/​unexporting the dead non-ui exports confirmed by knip at HEAD.
**Out of scope**: all `src/components/ui/*` exports; adding new code; the ~43 non-TS6133
type errors; anything plan 014/015/016 owns.

## Steps

### Step 0: Regenerate the list
Run `bunx --bun knip@5 --no-progress`. Use ITS current `exports`/`types` findings as the
source of truth (plan 014 may have removed files/added deaths). Baseline `tsc` total and
`bun run build`.

### Step 1: Confirm each symbol has no external importer
For each candidate: `grep -rlE "\b<symbol>\b" src --include="*.tsx" --include="*.ts" | grep -v <defining-file> | grep -v routeTree.gen`. Empty ⇒ proceed. Non-empty ⇒ it IS used (knip re-export/dynamic edge case) — KEEP, drop from list.

### Step 2: Unexport → tsc → delete (per symbol)
1. Remove the `export` keyword (value) or `export` from the type.
2. `npx tsc --noEmit 2>&1 | grep "<symbol>"`:
   - If it now reports **TS6133 "declared but never read"** → the symbol is used nowhere;
     **delete the whole declaration** (and any now-unused imports it pulled in).
   - If tsc is **clean** for that symbol → it's used elsewhere in the file; **leave it
     unexported** (Bucket A outcome).
3. For a re-export barrel (`export { x } from './y'`), delete the re-export line and apply
   the same check to the source.

Batch by file; keep prettier reflow in a separate commit.

### Step 3: Verify
- `bunx --bun knip@5 --no-progress` → the pruned exports no longer listed (ui/ ones remain, expected).
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → no NEW error codes; any TS6133 you created was resolved by deletion.
- `bun run build` → exit 0; `bunx vitest run` → 37/16.

## Test plan
No new tests. Gate: knip export list shrinks to only ui/ primitives (+ any intentional),
tsc clean of new errors, build + tests unchanged.

## Done criteria
- [ ] Every Bucket B symbol deleted or (if used in-file) unexported; Bucket A unexported.
- [ ] `bunx knip` shows no non-ui dead exports remaining (or each remainder justified).
- [ ] `bun run build` exit 0; `tsc` no new errors; `bunx vitest run` 37/16.
- [ ] `plans/README.md` row updated.

## STOP conditions
- A symbol grep shows an importer knip missed (dynamic/re-export) — keep it, report.
- Deleting a declaration cascades new tsc errors you can't cleanly resolve — revert that one, report.
- A mock-data export is clearly consumed by active WIP — keep it, note it.

## Maintenance notes
- After this, each module's exports reflect real consumers. New helpers should stay
  file-local until a second file needs them.
- `chart-colors.ts` losing `CATEGORICAL_6`/`CATEGORICAL_COLORS`: if a future chart wants a
  categorical palette, re-add one set (don't ship two) — see plan 013's note.
