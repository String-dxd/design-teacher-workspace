# Plan 003: Consolidate the two student filter evaluators into one tested module

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9f03003..HEAD -- src/routes/students.index.tsx src/lib/profile-group-evaluation.ts src/components/students/student-table.tsx src/types/student.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-test-ci-baseline.md (needs the vitest setup)
- **Category**: bug / tech-debt
- **Planned at**: commit `9f03003`, 2026-06-10

## Why this matters

The same filter-evaluation logic exists twice, copy-pasted and already
diverging:

1. `matchesCondition()` in `src/routes/students.index.tsx:81-181` — drives the
   student list filters.
2. `studentMatchesCriterion()` in `src/lib/profile-group-evaluation.ts:59-110`
   — drives profile-group membership.

Both contain an identical 27-entry `KNOWN_FIELDS` set and an identical
operator `switch`, but their **value extraction differs**, which has already
produced a real bug: the filter UI (`src/data/filter-config.ts:170-177`)
exposes `counsellingSessions` as a multiselect with enum values
`'Complex cases' | 'Less complex cases' | '-'`. The profile-group evaluator
maps the student's numeric session count into those buckets
(`profile-group-evaluation.ts:41-48`); the student-list evaluator does not —
it compares `String(count) === 'Complex cases'`, which **never matches**, so
the "Counselling cases" filter silently returns zero results on the students
page. Both evaluators also apply `Number()` comparisons to non-numeric values,
where `neq` on a NaN comparison returns `true` for every student. One module
with unit tests ends the divergence and makes filter behavior verifiable.

This plan also fixes the one tsc error in `students.index.tsx`
(`Set<string>` vs `Set<FilterField>` at line 503).

## Current state

- `src/routes/students.index.tsx` — student list page (~525 lines):
  - `computeStudentOverall(student, selectedSubjects)` at lines 60-74:
    computes overall % from `student.subjectScores` filtered to
    `selectedSubjects`, falling back to `student.overallPercentage`.
  - `matchesCondition(student, filter, selectedSubjects?)` at lines 81-181: - Lines 82-116: local `knownFields` set; unknown field → `return true`,
    with the comment `// Imported/custom fields have no student data — skip
filter (show all)`. **This is documented, intentional behavior for this
    page — preserve it.** - Value extraction handles `overallPercentage` (via
    `computeStudentOverall`), `attendance` (percent from
    `daysPresent/totalSchoolDays`), `housingType` (maps
    `'Owned'→'Owner-occupied'`, `'Rented'→'Rented'`, else `'-'`), otherwise
    `student[field as keyof Student]`. It does NOT bucket
    `counsellingSessions` (the bug). - Operator switch: `gt/gte/lt/lte/eq/neq` via `Number()` casts;
    `between/not_between` via a `{min,max}` cast; `contains/not_contains/
is/is_not` via `String(value ?? '')`; `is_empty/is_not_empty`;
    `default: return false`.
  - Line 331-334: `activeFilterFields = new Set(filters.filter(isFilterComplete).map((f) => f.field))`
    — inferred as `Set<string>` because `FilterCriterion.field` is
    `FilterField | string` (`src/types/student.ts:189-194`).
  - Line 503: passes that set to `<StudentTable activeFilterFields={...}>`,
    whose prop is declared `Set<FilterField>` at
    `src/components/students/student-table.tsx:50` → tsc error TS2322.

- `src/lib/profile-group-evaluation.ts` (147 lines) — pure module, no React:
  - `KNOWN_FIELDS` at lines 5-33 (identical 27 entries).
  - `getStudentValue(student, field)` at lines 35-57: handles `attendance`,
    `counsellingSessions` (bucket: falsy → `'-'`, `>= 2` → `'Complex cases'`,
    else `'Less complex cases'`), `housingType`. Does NOT handle
    `overallPercentage`/`selectedSubjects` (falls through to the raw field).
  - `studentMatchesCriterion(student, criterion)` at lines 59-110: unknown
    field → `return false` (opposite of the students page — intentional:
    a profile group must not match on fields it can't evaluate). Same
    operator switch.
  - Also exports `countMatchedCriteria`, `getMatchedCriteria`, `assignBucket`,
    `completeCriteria` — used by profile-group features; keep their signatures.

- `src/data/filter-config.ts` — `isFilterComplete(c)` helper and the field
  config list (`type: 'numeric' | 'text' | 'boolean' | 'enum' | 'multiselect'`,
  `enumValues`, per-type operator sets). Import-only in this plan.

- Conventions: pure logic lives in `src/lib/` (see
  `profile-group-evaluation.ts` itself); path alias `@/` for imports; tests
  (after plan 001) are `src/**/*.test.ts` run by vitest.

## Commands you will need

| Purpose   | Command                                          | Expected on success                     |
| --------- | ------------------------------------------------ | --------------------------------------- |
| Install   | `bun install`                                    | exit 0                                  |
| Tests     | `bun run test`                                   | all pass (plan 001 must have landed)    |
| Typecheck | `npx tsc --noEmit 2>&1 \| grep "students.index"` | only TS6133 unused-var lines, no TS2322 |
| Build     | `bun run build`                                  | exit 0                                  |

## Scope

**In scope** (the only files you should modify or create):

- `src/lib/filter-evaluation.ts` (create — the shared evaluator)
- `src/lib/filter-evaluation.test.ts` (create)
- `src/lib/profile-group-evaluation.ts` (delegate to the shared evaluator)
- `src/routes/students.index.tsx` (replace local `matchesCondition` +
  `computeStudentOverall` with imports)
- `src/components/students/student-table.tsx` (the `activeFilterFields` prop
  type only)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- `src/data/filter-config.ts` — the field/operator config is the contract;
  do not change it.
- `src/types/student.ts` — keep `FilterCriterion.field: FilterField | string`;
  imported custom columns legitimately use arbitrary string ids.
- `src/components/students/multi-filter-popover.tsx` — has its own tsc errors;
  a different concern.
- Any UI/JSX in `students.index.tsx` beyond swapping the function calls.

## Git workflow

- Branch: `advisor/003-filter-evaluation`
- Conventional commits per step, e.g.
  `refactor(filters): extract shared filter evaluator with tests`,
  `fix(students): bucket counselling sessions in list filters`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `src/lib/filter-evaluation.ts`

Build it from the **profile-group version** (it is the more complete value
extractor), then add what only the students page had. Export:

```ts
import type { FilterCriterion, Student } from '@/types/student'

export const KNOWN_FILTER_FIELDS: Set<string> // the 27-entry set, single copy

export interface EvaluateOptions {
  /** What an incomplete/unknown field means: the students page shows all
   *  ('match'), profile groups exclude ('reject'). */
  unknownField: 'match' | 'reject'
  /** Subject selection for overallPercentage — students page only. */
  selectedSubjects?: Array<string> | null
}

export function computeStudentOverall(
  student: Student,
  selectedSubjects: Array<string> | null,
): number // moved verbatim from students.index.tsx:60-74

export function evaluateCriterion(
  student: Student,
  criterion: FilterCriterion,
  options: EvaluateOptions,
): boolean
```

`evaluateCriterion` behavior:

1. `if (!KNOWN_FILTER_FIELDS.has(criterion.field))` → return
   `options.unknownField === 'match'`.
2. Value extraction = the union of both implementations:
   - `attendance` → percent (both had this, identical).
   - `housingType` → `'Owner-occupied' | 'Rented' | '-'` (both had this).
   - `counsellingSessions` → bucket per `profile-group-evaluation.ts:41-48`
     (now applied in BOTH contexts — this fixes the students-page bug).
   - `overallPercentage` → `computeStudentOverall(student, options.selectedSubjects ?? null)`
     (now applied in both contexts; for profile groups `selectedSubjects` is
     undefined, so it falls back to `student.overallPercentage`, which is what
     the raw field access did before — behavior preserved).
   - otherwise `student[criterion.field as keyof Student]`.
3. Operator switch copied verbatim from `profile-group-evaluation.ts:67-109`,
   with ONE change — a NaN guard on the six numeric operators:

   ```ts
   case 'gt':
   case 'gte':
   case 'lt':
   case 'lte':
   case 'eq':
   case 'neq': {
     const left = Number(value)
     const right = Number(criterion.value)
     if (Number.isNaN(left) || Number.isNaN(right)) return false
     // ... then the existing comparisons
   }
   ```

   Note the deliberate behavior change: previously `neq` against a
   non-numeric value compared `NaN !== NaN` → `true` for every student. Now
   it returns `false`. The filter UI only offers numeric operators on
   `type: 'numeric'` fields, so this path is defensive; the test in step 4
   pins it.

**Verify**: `npx tsc --noEmit 2>&1 | grep "filter-evaluation"` → no output.

### Step 2: Delegate `profile-group-evaluation.ts` to the shared module

Replace `KNOWN_FIELDS`, `getStudentValue`, and the body of
`studentMatchesCriterion` with:

```ts
export function studentMatchesCriterion(
  student: Student,
  criterion: FilterCriterion,
): boolean {
  return evaluateCriterion(student, criterion, { unknownField: 'reject' })
}
```

Keep `countMatchedCriteria`, `getMatchedCriteria`, `assignBucket`,
`completeCriteria` exactly as they are (they call `studentMatchesCriterion`).

**Verify**: `npx tsc --noEmit 2>&1 | grep "profile-group"` → no output;
`grep -c "case 'gt'" src/lib/profile-group-evaluation.ts` → 0.

### Step 3: Switch `students.index.tsx` to the shared module

- Delete the local `computeStudentOverall` (lines 60-74) and
  `matchesCondition` (lines 81-181) including its `knownFields` set.
- Import `{ evaluateCriterion, computeStudentOverall }` from
  `@/lib/filter-evaluation`.
- Replace every `matchesCondition(student, f, selectedSubjects)` call site
  with `evaluateCriterion(student, f, { unknownField: 'match', selectedSubjects })`.
  Find them with `grep -n "matchesCondition" src/routes/students.index.tsx`
  (they are inside the `matchedIds` useMemo around lines 300-328).
- `computeStudentOverall` is also used elsewhere in the file for the table's
  computed column — keep those call sites, now using the import.
- Fix the Set type error: in `src/components/students/student-table.tsx:50`,
  change `activeFilterFields: Set<FilterField>` to
  `activeFilterFields: Set<string>`. (`Set<string>.has()` accepts the
  `FilterField` strings the table checks against; imported-column ids are
  legitimate members.) If `FilterField` becomes an unused import there,
  remove it.

**Verify**: `npx tsc --noEmit 2>&1 | grep -E "students.index|student-table"` →
only `TS6133` unused-variable lines may remain (pre-existing), no `TS2322`.
`grep -c "case 'gt'" src/routes/students.index.tsx` → 0.

### Step 4: Write `src/lib/filter-evaluation.test.ts`

Model the file layout on `src/lib/draft-storage.test.ts` from plan 001. Build
a `makeStudent(overrides)` helper (the `Student` type in
`src/types/student.ts` is wide — fill required fields with neutral values).
Cases, each asserting through `evaluateCriterion`:

1. Numeric: `gt/gte/lt/lte/eq` happy paths on `absences`.
2. NaN guard: operator `eq` and `neq` with a non-numeric stored value both
   return `false` (pins the deliberate change from step 1).
3. `between` inside/outside, `not_between`.
4. Text: `contains` case-insensitive, `not_contains`, `is` with a string,
   `is` with an array (multiselect), `is_not`, `is_empty` / `is_not_empty`.
5. Unknown field `'importedCol42'`: `{ unknownField: 'match' }` → `true`;
   `{ unknownField: 'reject' }` → `false`.
6. `attendance`: student with `daysPresent: 45, totalSchoolDays: 50` matches
   `gte 90`; `totalSchoolDays: 0` evaluates as `0`.
7. `housingType`: raw `'Owned'` matches `is 'Owner-occupied'`; raw `null`
   matches `is '-'`.
8. `counsellingSessions`: count `3` matches `is 'Complex cases'`; count `1`
   matches `is 'Less complex cases'`; count `0`/undefined matches `is '-'`
   — the regression test for the students-page bug.
9. `overallPercentage` with `selectedSubjects`: student with
   `subjectScores: [{subject:'EL', percentage: 80}, {subject:'MA', percentage: 40}]`
   and `selectedSubjects: ['EL']` matches `gte 80`; with
   `selectedSubjects: null` uses `student.overallPercentage`.
10. `assignBucket` (import from `@/lib/profile-group-evaluation`):
    `meet_at_least` boundary (count equal to rule count matches) and
    `all_remaining` fallback.

**Verify**: `bun run test` → all pass, including ≥ 14 new tests in
`filter-evaluation.test.ts`.

### Step 5: Full verification pass

**Verify**:

- `bun run test` → exit 0.
- `bun run build` → exit 0.
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → strictly lower than before
  step 3 (the TS2322 at students.index.tsx:503 is gone).
- Manual spot check (recommended): `bun run dev` →
  `/students` → add filter "Counselling cases" `is` "Complex cases" → the
  list now shows matching students (before this plan it always showed the
  unfiltered/empty result), and an imported-column filter still shows all
  students.

## Test plan

Step 4 is the test plan. The two regression pins that matter most:
counsellingSessions bucketing (case 8) and the unknown-field mode split
(case 5).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run test` exits 0; `filter-evaluation.test.ts` exists with ≥ 14 tests
- [ ] `grep -rn "case 'gt'" src/ --include="*.ts*" | grep -v filter-evaluation` → empty
      (single copy of the operator switch)
- [ ] `npx tsc --noEmit 2>&1 | grep "student-table\|students.index" | grep TS2322` → empty
- [ ] `bun run build` exits 0
- [ ] `git status` shows changes only in the in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The two evaluators have diverged further than described (e.g.
  `students.index.tsx` gained new special-cased fields since `9f03003`) —
  reconcile-by-union may no longer be safe.
- Profile-group tests or the `/students` page show different matching
  behavior for any field OTHER than `counsellingSessions`, `neq`-on-NaN, or
  `overallPercentage`-with-undefined-subjects (the three documented changes).
- `Set<string>` on the StudentTable prop cascades new tsc errors inside
  `student-table.tsx` (its internals may compare against narrowed literals).
- Plan 001 has not landed (no `vitest.config.ts`) — tests cannot run.

## Maintenance notes

- From now on, any new filter operator or special-cased field goes in
  `src/lib/filter-evaluation.ts` with a test — never inline in a route.
- `multi-filter-popover.tsx` still has its own `FilterRangeValue` type errors
  (out of scope here); whoever fixes those should use the new module's types.
- If imported columns ever get real data (so they become filterable), the
  `unknownField: 'match'` mode is the place to implement it — the UI
  currently advertises filtering on them but silently shows all students;
  consider disabling the filter UI for imported columns instead.
