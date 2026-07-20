# Plan 034: Legacy Reports teardown — remove `reports`, `reports-admin-view`, `hdp-reports` flags and their code

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. Your reviewer maintains `plans/README.md`.

## Status

- **Priority**: P1 (maintainer-requested, 2026-07-16)
- **Effort**: M–L
- **Risk**: MED-HIGH (deletes routes/stores; survivors share files with the deleted feature)
- **Depends on**: plans 028–033 (all DONE on branch `hdp-prototype-v2`)
- **Planned at**: branch `hdp-prototype-v2` (post-033 + QA fixes), 2026-07-16

## Why this matters

The maintainer reversed the earlier "keep legacy reachable behind flags"
decision: the new HDP Reports module (flag `reports-hdp`) has replaced the
Reports tab, and the three legacy flags — `reports` (old Reports table page),
`reports-admin-view`, and `hdp-reports` (the old P1–P2 reporting-cycle hub) —
are to be removed **with their code**. What must NOT break: the new HDP module,
`holistic-reports.*` routes, the student profile, agency reports, notifications,
and attendance analytics — several of these import files that also serve the
legacy hub.

## Ground rules

- Commands: `bunx tsc --noEmit 2>&1 | grep -c "error TS"`; `bunx vitest run`;
  `bun run build`; targeted `bunx prettier --check` / `bunx eslint` only.
  NEVER `bun run check`.
- Baselines before this plan: tsc **82** / vitest **160 pass, 24 fail** (known:
  `hdp-cycle-store.test.ts`, `imported-columns.test.ts`) / build exit 0.
  Deleting legacy files SHIFTS both baselines — the done criteria below define
  the new expectations.
- The `reports-hdp` and `reports-river-visibility` flags (the new module) STAY.

## Scope

**Seed removal set** (Step 1–4; certain):

- Flag keys `reports`, `reports-admin-view`, `hdp-reports` in
  `src/lib/feature-flags/types.ts` + `constants.ts`.
- `src/components/app-sidebar.tsx`: the "Reports" item (Manage, flag
  `reports`), "Reports (Admin)" (flag `reports-admin-view`), the legacy
  "Holistic Development Reports" item (flag `hdp-reports`), their flag reads
  and `filterItems` lines, and the `&& !reportsHdpEnabled` suppression (the
  read of `reports-hdp` itself stays for the new module's item).
- `src/routes/reports.index.tsx`: delete `ReportsPage` and everything only it
  used (the legacy table, cycle hub embed, admin view, `validateSearch` and its
  search-param types). The route keeps `ReportsIndexSwitch` semantics: flag
  `reports-hdp` on → `HdpReportsHome`; off → the module's standard off-state
  (copy the pattern from `reports.tag.tsx`: h1 "Reports is off", body
  `Turn on “HDP Reports module” to use this page.`, link to `/flags`).
- Delete route files: `src/routes/reports.cycle.layout.tsx`,
  `src/routes/reports.cycle.write.$studentId.tsx`,
  `src/routes/_guest.report-view.$token.tsx` (the legacy hub's parent share).
- `src/components/students/student-profile.tsx`: remove the `hdp-reports`-gated
  legacy "Holistic Development Reports" section + its flag read. The NEW
  "Observations" section (flag `reports-hdp`) stays. Keep every other section.

**Iterative orphan sweep** (Step 5; rule-driven, not enumerated): candidate set =
`src/components/reports/**`, `src/lib/{hdp-cycle-store,hdp-report-commit,hdp-comment-draft,hdp-template-store,hdp-notifications}.{ts,test.ts}`,
`src/data/{mock-reports,mock-report-classes,mock-cockpit-submissions,report-layouts}.{ts,test.ts}`.
After the seed removals, repeatedly: delete any candidate file with ZERO
importers in `src/` (a `.test.ts` counts as orphaned when its subject is);
re-grep; stop at a fixed point. Files with surviving importers STAY, e.g.
(verified at recon): `hdp-notifications.ts` (notification-popover),
`hdp-template-store.ts` (holistic-reports.$id), `mock-reports.ts`
(student-profile, holistic-reports._, term-selector-if-it-survives),
`attendance-ring.tsx` (attendance-analytics), the academic/holistic tab
components (student-profile, holistic-reports). NEVER delete a file that
`holistic-reports._`, `student-profile.tsx`, `attendance-analytics.tsx`,
`notification-popover.tsx`, or any `src/components/hdp/\*\*` file imports.

**Out of scope**: everything under `src/components/hdp/`; `src/lib/hdp-store*`;
`src/data/hdp.ts`, `timetable.ts`; the new `reports.*` routes (tag, students,
summary, broadcast, drafts, review, release); `_guest.hdp-report.$token.tsx`;
agency-report files; `mock-students.ts`.

## Steps

1. Remove the three flag keys + registry entries. tsc will flag every consumer —
   use the error list as your worklist.
2. Sidebar edits (above). Verify: with the app running, sidebar shows the new
   "Reports" item only (flag on) / no Reports items (flag off).
3. `reports.index.tsx` rewrite (above). The file should shrink to roughly: route
   decl + off-state + `HdpReportsHome` render.
4. Delete the three legacy route files. Run `bun run build` → routeTree
   regenerates without them; commit the regenerated `routeTree.gen.ts`.
5. Orphan sweep per the rule. After each deletion round: `bunx tsc --noEmit`
   must introduce NO errors in surviving files (deleting a file may REMOVE
   errors — that is expected and good).
6. Update `src/lib/hdp-store.ts` or hdp components ONLY if a legacy import
   slipped in (grep says none exists — if you find one, STOP).
7. Gates + browser verification:
   - `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → report the NEW count; it
     must be ≤ 82 and the per-file error list must contain no file absent from
     the pre-teardown list (no new errors, only removals).
   - `bunx vitest run` → report the NEW totals; the ONLY failing file may be
     `imported-columns.test.ts` (pre-existing). All hdp-store/search/compose
     tests still pass.
   - `bun run build` → exit 0.
   - Browser: `/reports` on/off states; `/flags` shows the Reports card WITHOUT
     the three removed flags; sidebar correct in both flag states; a student
     profile renders (Observations present, no legacy Holistic section, no
     crashes); `holistic-reports` index + detail routes still render; the
     notification popover opens without errors; `/hdp-report/hdp-2` (new guest
     route) still renders; the deleted routes 404 via the app's not-found page.

## Done criteria

- [ ] Three flag keys gone from types/constants; `/flags` reflects it
- [ ] `grep -rn "hdp-reports\|reports-admin-view" src --include='*.ts*' | grep -v routeTree` → no hits; `grep -rn "'reports'" src/lib/feature-flags src/components/app-sidebar.tsx` → no hits
- [ ] Deleted: 3 route files + all zero-importer candidates; survivors compile
- [ ] Gates per Step 7 (report exact new tsc/vitest numbers)
- [ ] Browser checks all hold

## STOP conditions

- A candidate file has BOTH legacy and survivor importers in a way the sweep
  rule can't resolve by keeping it (e.g. a survivor imports something that
  imports a deleted file transitively and can't compile) — report the chain.
- `holistic-reports.*` or `student-profile.tsx` need more than deleting the
  named legacy section to compile.
- Anything in `src/components/hdp/` needs editing beyond `reports.index.tsx`'s
  off-state.

## Maintenance notes

- This completes the teardown foreshadowed in the Round 8 index notes and
  removes the `&& !reportsHdpEnabled` scaffolding from 028.
- The vitest "24 known fails" baseline dies with `hdp-cycle-store.test.ts` —
  update future plans' expectations to the new number this plan reports.
- `hdp-notifications.ts`/`hdp-template-store.ts` survive with reduced consumers;
  a later pass may fold them into their remaining callers.
