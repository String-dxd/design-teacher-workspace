# Plan 021: Characterization tests for `commitCycleReport` and `statusFor`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, stop and report — do not improvise. Update this plan's
> row in `plans/README.md` when done unless a reviewer says they maintain it.
>
> **Drift check (run first)**: `git diff --stat 077d669..HEAD -- src/lib/hdp-report-commit.ts src/components/reports/cycle-student-table.tsx`
> If either file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW (additive — new test files only)
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `077d669`, 2026-07-06

## Why this matters

Two pieces of pure, load-bearing logic in the HDP reporting cycle ship with no tests:

1. `commitCycleReport` (`src/lib/hdp-report-commit.ts`) is the **single commit point** from a cycle draft to a real report — called by both "Mark ready" (Write stage) and bulk "Share with parents" (Hub). A regression here (dropped comments, wrong layout, lost draft) silently corrupts every report.
2. `statusFor` (`src/components/reports/cycle-student-table.tsx`) derives each student's cycle status (`not_started`/`draft`/`ready`/`sent`), which drives the hub's summary metrics, the per-row badges, and the "N ready to share" count.

Both are pure and trivially testable. Characterization tests lock in current behavior so future edits (or a move to real persistence) can't regress them unnoticed.

## Current state

`src/lib/hdp-report-commit.ts` — `commitCycleReport(student, term, cycle)`:

```ts
export function commitCycleReport(
  student: Student,
  term: Term,
  cycle: CycleState,
): HolisticReport {
  const draft = Object.prototype.hasOwnProperty.call(
    cycle.perStudent,
    student.id,
  )
    ? cycle.perStudent[student.id]
    : undefined
  const base = generateReportFromStudent(student, term, CURRENT_ACADEMIC_YEAR)
  const comments = (draft && draft.comments) || base.teacherComments
  const built: HolisticReport = {
    ...base,
    layout: cycle.layout,
    teacherComments: comments,
  }
  upsertReport(built)
  saveSharedReport(built.id, {
    blocks: cycle.layout.blocks,
    comments: comments || '',
  })
  return built
}
```

Note: `saveSharedReport` writes localStorage but guards `typeof window === 'undefined'`, so it no-ops in a node test — do NOT assert on it. Assert on the returned object and the `upsertReport` side-effect via `getReportById`.

`src/components/reports/cycle-student-table.tsx` — `statusFor` (exported at the bottom, `export { statusFor }`):

```ts
export type CycleStudentStatus = 'not_started' | 'draft' | 'ready' | 'sent'
function statusFor(
  cycle: CycleState | null,
  studentId: string,
): CycleStudentStatus {
  const draft = cycle?.perStudent[studentId]
  if (!draft) return 'not_started'
  if (draft.sentAt) return 'sent'
  if (draft.ready) return 'ready'
  if (draft.comments || draft.parentMessage) return 'draft'
  return 'not_started'
}
```

**Test conventions (mirror these exactly):**

- Vitest, co-located `*.test.ts`. See `src/data/mock-reports.test.ts` (imports from `./mock-reports`, `mockStudents` fixtures, `describe`/`it`/`expect`) and `src/lib/hdp-cycle-store.test.ts` (has a `makeCycle(overrides): CycleState` helper — copy that helper's shape for building cycle fixtures).
- `CycleState` shape (from `hdp-cycle-store.test.ts`): `{ classId, term, academicYear, templateId, layout: { blocks: [...] }, perStudent: {}, updatedAt }`.
- `PerStudentDraft` fields: `comments: string`, `parentMessage: string`, `ready: boolean`, `sentAt?: string`.

## Commands you will need

| Purpose           | Command                                                                                                          | Expected                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Tests             | `bun run test`                                                                                                   | all pass, including the new tests (was 65; will be 65 + N)                                                                 |
| Typecheck         | `bunx tsc --noEmit`                                                                                              | no error whose path contains `hdp-report-commit.test` or `cycle-student-table.test` (repo has ~107 pre-existing elsewhere) |
| Format (targeted) | `bunx prettier --check "src/lib/hdp-report-commit.test.ts" "src/components/reports/cycle-student-table.test.ts"` | clean                                                                                                                      |
| Lint (targeted)   | `bunx eslint "src/lib/hdp-report-commit.test.ts" "src/components/reports/cycle-student-table.test.ts"`           | exit 0                                                                                                                     |

> ⚠️ Do NOT run `bun run check` (it is repo-wide `prettier --write .` and reformats unrelated files). Use the targeted commands above. Do NOT run `bun install` (installed). Do NOT `git checkout`/`git restore`/`rm` any file.

## Scope

**In scope** (create these two files only):

- `src/lib/hdp-report-commit.test.ts` (create)
- `src/components/reports/cycle-student-table.test.ts` (create)

**Out of scope**: any source file (no production code changes), `plans/*` (reviewer maintains).

## Git workflow

- Branch: `advisor/021-cycle-commit-status-tests`. One commit, conventional style (`test(reports): cover commitCycleReport and statusFor`). Do NOT push/PR. (If a reviewer dispatched you and said they handle commits, leave uncommitted instead.)

## Steps

### Step 1: Test `statusFor`

Create `src/components/reports/cycle-student-table.test.ts`. Import `statusFor` and `CycleStudentStatus` from `'./cycle-student-table'` and `CycleState` type from `'@/lib/hdp-cycle-store'`. Build minimal cycles inline. Cases (each its own `it`):

- `null` cycle → `'not_started'`.
- studentId absent from `perStudent` → `'not_started'`.
- draft with `comments: 'x'`, `ready: false`, no `sentAt` → `'draft'`.
- draft with only `parentMessage: 'x'` → `'draft'`.
- draft with `ready: true`, no `sentAt` → `'ready'`.
- draft with `sentAt: '2026-01-01'` (and `ready: true`) → `'sent'`.
- draft with `sentAt` set but `ready: false` → `'sent'` (sentAt takes precedence — this documents the current precedence).

**Verify**: `bun run test` → new file passes.

### Step 2: Test `commitCycleReport`

Create `src/lib/hdp-report-commit.test.ts`. Import `commitCycleReport` from `'./hdp-report-commit'`, `getReportById` from `'@/data/mock-reports'`, `mockStudents` from `'@/data/mock-students'`, and `CycleState` from `'./hdp-cycle-store'`. Use a `makeCycle` helper like `hdp-cycle-store.test.ts`. Pick a fixture student via `mockStudents.find(s => s.class === 'P1-A')` (throw if missing). Cases:

- **Uses the draft's comments when present**: cycle with `perStudent[student.id] = { comments: 'DRAFT-COMMENT', parentMessage: '', ready: true }`; call `commitCycleReport(student, 'Term 3', cycle)`; assert the returned report's `teacherComments === 'DRAFT-COMMENT'` and `layout === cycle.layout`.
- **Falls back to base teacherComments when no draft**: cycle with empty `perStudent`; assert returned `teacherComments === generateReportFromStudent(student,'Term 3',CURRENT_ACADEMIC_YEAR).teacherComments` (import `generateReportFromStudent`, `CURRENT_ACADEMIC_YEAR` too) — or simply assert it is a non-empty string equal to the base's.
- **Upserts so the report is retrievable**: after `const built = commitCycleReport(...)`, assert `getReportById(built.id)` is defined and its `layout` deep-equals `cycle.layout`.

Use `'Term 3'` (or `'Term 4'`) to avoid clobbering pre-generated Term 1/2 fixtures other tests rely on. Do NOT assert on `saveSharedReport`/localStorage (no-ops in node).

**Verify**: `bun run test` → new file passes.

### Step 3: Confirm scope + gates

**Verify**: `git diff --name-only` → exactly the two new test files; targeted prettier `--check` clean; targeted eslint exit 0; `bun run test` all pass.

## Test plan

This plan _is_ tests. Structural pattern: `src/data/mock-reports.test.ts` (fixture-from-mockStudents style) and `src/lib/hdp-cycle-store.test.ts` (the `makeCycle` helper). Total new `it` blocks: ~7 (statusFor) + ~3 (commit) = ~10.

## Done criteria

- [ ] `bun run test` → all pass; the two new files contribute ~10 passing tests (total ≥ 75)
- [ ] `bunx tsc --noEmit 2>&1 | grep -c "cycle-student-table.test\|hdp-report-commit.test"` → `0`
- [ ] targeted prettier `--check` → clean; targeted eslint → exit 0
- [ ] `git diff --name-only` → exactly `src/lib/hdp-report-commit.test.ts` and `src/components/reports/cycle-student-table.test.ts`

## STOP conditions

- `statusFor` is not exported / signature differs from the excerpt → STOP (drift).
- `commitCycleReport` throws in a node test because it hits `window`/DOM not guarded → STOP and report (do not add a DOM shim).
- Any file outside the two test files shows as changed → STOP, do not revert, report.
- `bun run test` shows a previously-passing test now failing → STOP.

## Maintenance notes

- If the `PerStudentDraft` shape or `statusFor` precedence changes, these tests must be updated in lockstep — that's the point (they document current behavior).
- If HDP moves to real persistence, the `commitCycleReport` test's `getReportById` assertion may need a persistence mock; note it then.
