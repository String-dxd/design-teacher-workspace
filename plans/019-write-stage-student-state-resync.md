# Plan 019: Write-stage remounts per student so editable state can't carry over

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a7c534b..HEAD -- src/routes/reports.cycle.write.$studentId.tsx`
> If that file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a7c534b`, 2026-07-06 (v2 — supersedes the v1 resync-only approach, which was BLOCKED at review: see "Why the obvious small fix is wrong" below)

## Why this matters

In the HDP report Write stage (`/reports/cycle/write/$studentId`), the teacher edits a student's form-teacher **comments** (a Tiptap rich-text editor) and **note to parents** (a plain textarea), then uses a prev/next pager to move to the next student in the class. `goToStudent` navigates to the same route with a different `$studentId` param, so TanStack Router **re-renders the same component instance rather than remounting it**. Two things then break:

1. The `useState` initializers seeding `comments`/`parentMessage` don't re-run, so the fields keep the previous student's text. The 500ms debounced autosave then persists that stale text under the **new** studentId, and "Mark ready" commits it — so student A's comments get written onto student B's report. **Data corruption.**
2. The `cycle` object is `useMemo`'d on `[classId, term]`, which don't change during pager navigation, so it is **never re-read from localStorage** after edits. Returning to a student you edited earlier in the session shows stale (mount-time) content even though the edit was saved.

**Why the obvious small fix is wrong** (this was tried and rejected): adding a `useEffect(() => { setComments(...); setParentMessage(...) }, [studentId, cycle, report])` re-sync _looks_ right and fixes the plain `<textarea>` note — but it does **not** fix the rich-text comments. The `RichTextEditor` (`src/components/comms/rich-text-editor.tsx`) only pushes an external `value` into its Tiptap instance when the editor is **not focused** (`if (value !== editor.getHTML() && !editor.view.hasFocus())`, lines ~133–139). During pager navigation the editor commonly still holds focus, so the content reset is skipped and the previous student's text stays visible and re-saveable. It also doesn't fix problem 2 (the stale `cycle` memo). Verified in-browser: after typing for student A and clicking "Next student", student B's editor still showed A's text.

The robust, focus-independent fix is to **remount the whole Write body when `studentId` changes**, by giving it a React `key={studentId}`. A remount re-runs the `useState` initializers (fresh per-student text), creates a fresh `RichTextEditor` initialized to the correct content, and re-runs the `loadCycle` memo (fixing the stale-read). No focus timing, no effect ordering.

## Current state

`src/routes/reports.cycle.write.$studentId.tsx` — the Write-stage route. Structure today (one component holds everything):

```tsx
export const Route = createFileRoute('/reports/cycle/write/$studentId')({
  component: CycleWritePage,
  validateSearch: (search: Record<string, unknown>): WriteSearch => ({
    // ...
  }),
})

function CycleWritePage() {
  const { studentId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const builderEnabled = useFeatureFlag('hdp-reports')

  const student = getStudentById(studentId)
  const classId = search.classId ?? student?.class ?? ''
  const term: Term = search.term ?? 'Term 2'

  const cycle = useMemo(() => loadCycle(classId, term), [classId, term])
  // ... classmates, pager, report useMemo ...
  const draft = cycle?.perStudent[studentId]
  const [comments, setComments] = useState(
    () => draft?.comments ?? report?.teacherComments ?? '',
  )
  const [parentMessage, setParentMessage] = useState(
    () => draft?.parentMessage ?? '',
  )
  const [markState, setMarkState] = useState<'idle' | 'loading' | 'error'>(
    'idle',
  )
  const errorRef = useRef<HTMLDivElement>(null)
  // ... effects, goToStudent, handleMarkReady, and the full JSX return ...
}
```

The whole component body reads `studentId` from `Route.useParams()` at the top and uses it throughout.

**Repo conventions to match**: two-space indent; `useState`/`useEffect`/`useMemo`/`useRef` already imported from `'react'`; TanStack Router `createFileRoute` pattern; components are plain function declarations. `bun run check` runs prettier+eslint but is **repo-wide and destructive** (`prettier --write .`) — do NOT run it (see Commands).

## Commands you will need

| Purpose           | Command                                                                 | Expected                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Typecheck         | `bunx tsc --noEmit`                                                     | repo has ~107 pre-existing errors elsewhere; bar = **no error whose path contains `reports.cycle.write`** (grep in Done criteria). node_modules is already installed — do NOT run `bun install`. |
| Tests             | `bun run test`                                                          | `Tests  65 passed (65)`                                                                                                                                                                          |
| Format (targeted) | `bunx prettier --check "src/routes/reports.cycle.write.$studentId.tsx"` | `All matched files use Prettier code style!`                                                                                                                                                     |
| Lint (targeted)   | `bunx eslint "src/routes/reports.cycle.write.$studentId.tsx"`           | exit 0                                                                                                                                                                                           |

> ⚠️ Do NOT run `bun run check`. It is `prettier --write . && eslint --fix` across the **entire repo** and will reformat ~45 unrelated files. Use the targeted `prettier --check` / `eslint` on the single file above instead.

## Scope

**In scope** (only file to modify):

- `src/routes/reports.cycle.write.$studentId.tsx`

**Out of scope** (do NOT touch):

- `src/components/comms/rich-text-editor.tsx` — the editor's focus-guarded sync is used by many surfaces; the remount makes it irrelevant here without changing it.
- `src/lib/hdp-cycle-store.ts`, `src/lib/hdp-report-commit.ts` — correct as-is.
- `plans/README.md` if a reviewer dispatched you and said they maintain the index.

## Git workflow

- Branch: `advisor/019-write-stage-remount-per-student`.
- One commit, conventional-commit style (e.g. `fix(reports): remount Write stage per student to stop cross-student carry-over`).
- Do NOT push or open a PR.

## Steps

### Step 1: Split the route component into a keyed wrapper + inner component

Rename the existing `function CycleWritePage() { ... }` to `function CycleWriteBody({ studentId }: { studentId: string }) { ... }`, and **remove** the `const { studentId } = Route.useParams()` line from inside it (it now receives `studentId` as a prop — everything else in the body is unchanged).

Then add a new thin route component that reads the param and keys the body:

```tsx
function CycleWritePage() {
  const { studentId } = Route.useParams()
  // key forces a full remount when the active student changes, so per-student
  // editable state (comments/note) and the Tiptap editor content re-initialize
  // cleanly and loadCycle re-reads — otherwise the previous student's text
  // carries over (same-route param change re-renders, it does not remount).
  return <CycleWriteBody key={studentId} studentId={studentId} />
}
```

Keep `CycleWritePage` as the value of `component:` in the `createFileRoute(...)` call (do not change the route registration). `CycleWriteBody` must be defined in the same file.

Notes:

- Everything inside the old function stays identical except: (a) the function name, (b) it takes `{ studentId }` as a prop instead of calling `Route.useParams()`, (c) `Route.useSearch()` / `Route.useParams()` for other values — keep `Route.useSearch()` as-is; only the `studentId` destructure moves up to the wrapper.
- Do NOT otherwise change the effects, the debounce, `goToStudent`, `handleMarkReady`, or the JSX.

**Verify**: `bunx tsc --noEmit 2>&1 | grep "reports.cycle.write"` → no output.

### Step 2: Confirm scope + formatting

**Verify**:

- `git diff --name-only` → only `src/routes/reports.cycle.write.$studentId.tsx`.
- `bunx prettier --check "src/routes/reports.cycle.write.$studentId.tsx"` → clean.
- `bunx eslint "src/routes/reports.cycle.write.$studentId.tsx"` → exit 0.
- `bun run test` → `Tests  65 passed (65)`.

## Test plan

No React Testing Library is configured (tests are logic-only — see `src/lib/hdp-cycle-store.test.ts`). Do NOT invent a framework. Verification = the gates above + a browser behavioral check the **reviewer** runs: enable `hdp-reports` at `/flags`; open `/reports` for `P1-A`, "Set up layout"; open Write for the first student, type "AAA" in the comments editor; click "Next student"; confirm the editor shows the second student's own text, **not** "AAA"; type "BBB", mark ready; return to the first student and confirm their comments are intact. If you (executor) lack browser tooling, say so in NOTES.

## Done criteria

ALL must hold:

- [ ] `bunx tsc --noEmit 2>&1 | grep -c "reports.cycle.write"` → `0`
- [ ] `bun run test` → exits 0, `Tests  65 passed (65)`
- [ ] `bunx prettier --check "src/routes/reports.cycle.write.$studentId.tsx"` → clean; `bunx eslint` on it → exit 0
- [ ] `git diff --name-only` lists exactly `src/routes/reports.cycle.write.$studentId.tsx`
- [ ] The route renders `<CycleWriteBody key={studentId} studentId={studentId} />` and `CycleWriteBody` takes `studentId` as a prop (no `Route.useParams()` inside the body for studentId)

## STOP conditions

Stop and report back (do not improvise) if:

- The "Current state" structure doesn't match (file drifted since `a7c534b`).
- Splitting the component produces type errors not resolved by passing `studentId: string` as a prop.
- You find the component is already keyed/remounted per student — report instead.
- `bun run test` count changes from 65, or a passing test fails.
- You are tempted to run `bun run check` — don't; use the targeted commands.

## Maintenance notes

- The `key={studentId}` remount is the mechanism preventing carry-over; if anyone later removes it in favor of prop-driven updates, they must also make `RichTextEditor` reset content on student change regardless of focus, and re-read `cycle` after writes.
- Reviewer should verify the browser behavior above (both no-carry-over AND returning-to-a-student shows their saved edits).
- Deferred to separate plans: a11y focus-move + aria-live on student navigation (plan 020), characterization tests for `commitCycleReport`/`statusFor` (plan 021).
