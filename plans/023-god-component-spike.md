# Plan 023: Spike — characterization tests + decomposition design for the two god routes

> **Executor instructions**: This is a SPIKE plan: the deliverables are tests
> and a design document, NOT a refactor. Do not restructure the two routes in
> this plan. Follow the steps, run every verification command, and when done
> update the status row in `plans/README.md` — unless a reviewer dispatched
> you and told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b01d78d..HEAD -- src/routes/announcements.new.tsx 'src/routes/students_.$id.agency-report.new.tsx' src/lib/draft-storage.ts`
> Plans 018/019/022 intentionally edit `announcements.new.tsx` first; expect
> their hunks. If either route was substantially restructured (>500 lines
> changed), STOP — this spike's premises need re-checking.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: LOW (this plan itself changes no product code)
- **Depends on**: 018, 019, 022 (they edit the same files; spike against the
  post-fix state so the design doesn't plan around already-fixed bugs)
- **Category**: tech-debt (investigate/design)
- **Planned at**: commit `b01d78d`, 2026-07-02

## Why this matters

The two heaviest authoring surfaces are single components an order of
magnitude larger than the repo median:

- `src/routes/announcements.new.tsx` — 2,758 lines, **41 `useState`, 0
  `useMemo`**. The autosave effect (~line 1072) lists ~25 dependencies; any
  missed dependency is a stale-closure / lost-draft bug. Coordinated state
  clusters (`filesMeta`/`draftFilesMeta`/`photosMeta`/`draftPhotosMeta`/
  `coverPhotoIndices`) can desync.
- `src/routes/students_.$id.agency-report.new.tsx` — 3,749 lines, **35
  `useState`**.

Every keystroke re-renders the entire multi-thousand-line tree, and these are
also the highest-churn files in the repo. Refactoring them blind is how drafts
get lost — so the prerequisite is characterization tests around the one truly
dangerous behavior (draft save/restore), then a decomposition design that a
later plan can execute mechanically.

## Current state

- Draft persistence: `src/lib/draft-storage.ts` (`loadDraft`/`saveDraft`
  and the draft shape) — plan 005 already hardened its parsing; there are
  existing tests in `src/lib/` to model on (find them with
  `ls src/lib/*.test.ts`).
- The vitest baseline is 37 pass / 16 fail (2 files fail pre-existing —
  do not try to fix those here).
- The repo has NO component-render test harness (no @testing-library dep).
  Characterization therefore targets the pure/serializable layers (draft
  shape, state-transition helpers), plus scripted browser flows if the
  agent-browser skill is available.
- Repo conventions: reusable components in `src/components/` (policy:
  compose existing primitives — see CLAUDE.md), hooks in `src/hooks/`,
  pure logic in `src/lib/`.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Tests     | `bunx vitest run`      | 37+new pass / 16 fail (pre-existing) |
| Typecheck | `bunx tsc --noEmit`    | ≤41 pre-existing errors; no new codes/files |
| Line/hook census | `grep -c 'useState' <file>` / `wc -l <file>` | for the design doc's inventory |

## Scope

**In scope**:

- New test files: `src/lib/draft-storage.test.ts` (extend if it exists),
  and pure-helper tests extracted WITHOUT changing behavior (extraction of a
  pure function to `src/lib/` with identical call sites is allowed —
  extraction only, no logic edits).
- New design doc: `docs/plans/2026-07-XX-024-announcements-new-decomposition.md`
  (and a sibling for the agency-report route, or one combined doc).
- `plans/README.md` (status row)

**Out of scope**:

- ANY behavioral change to the two routes. No component splitting, no
  useReducer conversion, no memoization — that's the follow-up plan this
  spike produces.
- The 16 pre-existing vitest failures.

## Git workflow

- Branch: `advisor/023-god-component-spike`
- Conventional commits: `test(drafts): characterize announcement draft save/restore`,
  `docs(plans): decomposition design for announcements.new`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Characterize draft save/restore

Read `src/lib/draft-storage.ts` and the autosave effect + restore path in
`announcements.new.tsx` (grep `saveDraft(`, `loadDraft(`). Write tests that
pin the CURRENT behavior:

- Round-trip: a fully-populated draft object survives save→load bit-identical.
- Partial drafts: missing optional fields load with today's defaults.
- Corrupt/legacy payloads: whatever `loadDraft` does today (null? partial?)
  is asserted as-is — characterization, not improvement.
- The exact field list the autosave effect persists (enumerate from the
  effect's deps) — a test that fails if a field is silently dropped.

**Verify**: `bunx vitest run` → all new tests pass; 16 pre-existing failures
unchanged.

### Step 2: State inventory of both routes

For each route, produce (into the design doc) a table of every `useState`:
name, type, which UI section reads it, which handlers write it, whether it
belongs to a cohesive cluster (files/photos, scheduling, recipients, share
dialog, preview, questions). Mark the clusters that must move together and
any state that is actually derived (candidates for plain computation).

**Verify**: the doc lists 41 rows for `announcements.new.tsx` and 35 for the
agency-report route (or the current counts if plans 018/022 changed them —
note the actuals).

### Step 3: Decomposition design

Write the design in `docs/plans/` (match the existing plan style there —
see `docs/plans/2026-05-26-001-feat-404-not-found-page-plan.md`). It must
specify:

- Target component tree: which sections become child components
  (editor form / preview pane / photo+file manager / schedule banner /
  share dialog …), each with its prop contract.
- Which state clusters become `useReducer`s or custom hooks
  (`useAnnouncementDraft`, `useAttachments`), with their action lists.
- Render-isolation goals: typing in the title must not re-render the
  preview/photo grid (state colocation or memoized children — name which).
- The autosave effect's future: subscribe to the reducer state, single dep.
- Migration order in mechanically-executable slices (each slice ≤~400 lines
  moved, independently verifiable via the step-1 tests + a browser pass),
  so a later executor plan can do one slice per PR.
- Open questions for the maintainer, explicitly listed.
- A go/no-go recommendation for the agency-report route: if its structure
  turns out to be mostly a linear form (lower coordination risk), it may be
  honest to recommend "leave it until it next grows a feature" — say so.

**Verify**: doc exists; every section above present; `bunx tsc --noEmit`
unchanged (extraction-only edits, if any, compile clean).

## Test plan

Step 1 IS the test plan: characterization tests for draft persistence are the
spike's primary hard deliverable and become the safety net for the follow-up
refactor plan.

## Done criteria

- [ ] New characterization tests exist and pass; pre-existing failures
      unchanged (`bunx vitest run`)
- [ ] Design doc in `docs/plans/` with state inventory, target tree,
      migration slices, and open questions
- [ ] Zero behavioral diff to the two routes
      (`git diff --stat` shows only test files, optional pure extractions,
      the doc, and `plans/README.md`)
- [ ] `bunx tsc --noEmit` ≤41 pre-existing errors
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Draft save/restore behavior is nondeterministic or version-dependent in a
  way tests can't pin (report the specific instability — that's a finding).
- A "pure" extraction can't be done without behavior change.
- You catch yourself refactoring the component tree — that is the follow-up
  plan, not this one.

## Maintenance notes

- The design doc's migration slices should become plans 024+ via a future
  `improve` run (or `execute` them directly one slice at a time).
- Until decomposition lands, reviewers should push back on NEW `useState`s in
  these two files — additions belong in the clusters the design names.
- Related deferred item: `students.index.tsx`'s columns-as-overrides
  derivation (see plan 022 maintenance notes) fits naturally into the same
  design vocabulary.
