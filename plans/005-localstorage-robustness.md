# Plan 005: Harden localStorage persistence (imported columns + drafts)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9f03003..HEAD -- src/lib/imported-columns.ts src/lib/draft-storage.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-test-ci-baseline.md (vitest setup; also creates
  `draft-storage.test.ts`, which this plan extends)
- **Category**: bug
- **Planned at**: commit `9f03003`, 2026-06-10

## Why this matters

The repo has three localStorage modules with inconsistent robustness. The
gold standard is `src/lib/profile-group-storage.ts` — SSR guard
(`typeof window === 'undefined'`), try/catch on every read/write, and an
`Array.isArray` shape check after `JSON.parse`. The other two fall short:

- `src/lib/imported-columns.ts` — `saveImportedColumns()` calls
  `localStorage.setItem` with **no try/catch and no SSR guard**: a quota
  error (announcement drafts store base64 photo thumbnails in the same
  origin, so quota pressure is realistic) crashes the import flow instead of
  degrading; `getImportedColumns()` returns `JSON.parse(raw)` **unvalidated**,
  so corrupted storage (e.g. a number where an array is expected) flows
  typed-as-`Array<ImportedColumn>` into the students table and throws far
  from the cause.
- `src/lib/draft-storage.ts` — `loadDraft()` casts `JSON.parse(raw) as
  DraftData` unvalidated; a draft saved by an older code version (the
  `DraftData` shape has visibly grown — it now has 24 fields) can return an
  object missing arrays the composer then calls `.map` on.

This is a small, mechanical plan: bring both modules up to the existing
in-repo standard and pin the behavior with tests.

## Current state

- `src/lib/imported-columns.ts` — 20 lines, full content at `9f03003`:

  ```ts
  const STORAGE_KEY = 'imported_columns'

  export interface ImportedColumn {
    id: string
    label: string
  }

  export function getImportedColumns(): Array<ImportedColumn> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  export function saveImportedColumns(columns: Array<ImportedColumn>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns))
  }
  ```

- `src/lib/draft-storage.ts` — `loadDraft()` at lines 56-64:

  ```ts
  export function loadDraft(): DraftData | null {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      return JSON.parse(raw) as DraftData
    } catch {
      return null
    }
  }
  ```

  `DraftData` (lines 13-42 of the same file) — load-bearing fields the
  composer iterates without guards: `shortcuts`, `websiteLinks`,
  `recipients`, `staffInCharge`, `questions`, `filesMeta`, `photosMeta`,
  `coverPhotoIndices` (all arrays), plus `title`/`description` strings and
  `savedAt` string.

- Exemplar pattern — `src/lib/profile-group-storage.ts:9-28`:

  ```ts
  function readGroups(): Array<ProfileGroup> {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(GROUPS_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as Array<ProfileGroup>) : []
    } catch {
      return []
    }
  }

  function writeGroups(groups: Array<ProfileGroup>) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
      window.dispatchEvent(new Event(EVENT))
    } catch {
      // ignore quota errors
    }
  }
  ```

  Match this style (SSR guard first, try/catch, shape check, silent
  degradation to the empty value).

- Callers (do not modify, but know them): `getImportedColumns` /
  `saveImportedColumns` are used by `src/routes/students.index.tsx` and the
  import wizard; `loadDraft` / `saveDraft` by
  `src/routes/announcements.new.tsx`.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Install   | `bun install`    | exit 0 |
| Tests     | `bun run test`   | all pass |
| Typecheck | `npx tsc --noEmit 2>&1 \| grep -E "imported-columns\|draft-storage"` | no output |
| Build     | `bun run build`  | exit 0 |

## Scope

**In scope** (the only files you should modify or create):

- `src/lib/imported-columns.ts`
- `src/lib/imported-columns.test.ts` (create)
- `src/lib/draft-storage.ts` (`loadDraft` only)
- `src/lib/draft-storage.test.ts` (extend the file created by plan 001)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- `src/lib/profile-group-storage.ts` — already correct; it is the exemplar.
- All callers (`students.index.tsx`, `import-wizard.tsx`,
  `announcements.new.tsx`) — the function signatures must not change, so
  callers need no edits. If you find yourself editing a caller, stop.
- No toast/UI feedback for quota failures — silent degradation matches the
  exemplar; surfacing errors is a product decision, not this plan.

## Git workflow

- Branch: `advisor/005-localstorage-robustness`
- One commit, e.g. `fix(storage): SSR guards, quota safety, and shape
  validation for imported columns and drafts`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Harden `imported-columns.ts`

Rewrite the two functions following the exemplar:

- `getImportedColumns()`: add `if (typeof window === 'undefined') return []`
  first; after `JSON.parse`, validate the shape — keep only well-formed
  entries:

  ```ts
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) return []
  return parsed.filter(
    (c): c is ImportedColumn =>
      typeof c === 'object' &&
      c !== null &&
      typeof (c as Record<string, unknown>).id === 'string' &&
      typeof (c as Record<string, unknown>).label === 'string',
  )
  ```

- `saveImportedColumns()`: add the SSR guard and wrap `setItem` in
  try/catch with the exemplar's `// ignore quota errors` comment.

**Verify**: `npx tsc --noEmit 2>&1 | grep imported-columns` → no output.

### Step 2: Validate `loadDraft()` in `draft-storage.ts`

Change only `loadDraft()`. After parsing, reject obviously-broken payloads
and patch missing arrays so the composer's `.map` calls are safe:

```ts
export function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const draft = parsed as Partial<DraftData>
    if (typeof draft.savedAt !== 'string') return null
    const arrayFields = [
      'shortcuts', 'websiteLinks', 'recipients', 'staffInCharge',
      'questions', 'filesMeta', 'photosMeta', 'coverPhotoIndices',
    ] as const
    for (const f of arrayFields) {
      if (!Array.isArray(draft[f])) (draft as Record<string, unknown>)[f] = []
    }
    return draft as DraftData
  } catch {
    return null
  }
}
```

Do not change `saveDraft`, `clearDraft`, or `daysRemaining`.

**Verify**: `npx tsc --noEmit 2>&1 | grep draft-storage` → no output.

### Step 3: Tests

Create `src/lib/imported-columns.test.ts` (model on
`src/lib/draft-storage.test.ts` from plan 001 — same vitest + jsdom style,
`afterEach(() => localStorage.clear())`):

1. Round-trip: save two columns, get them back.
2. Empty storage → `[]`.
3. Corrupted JSON (`'{nope'`) → `[]`.
4. Non-array JSON (`'42'`) → `[]`.
5. Array with malformed entries (`[{id:'a',label:'A'}, {id: 7}, null]`) →
   only the well-formed entry survives.
6. Quota failure: `vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })`
   → `saveImportedColumns([...])` does NOT throw. Restore the spy.

Extend `src/lib/draft-storage.test.ts` with:

7. Stored object missing `questions`/`photosMeta` (simulating an old-version
   draft) → `loadDraft()` returns a draft where both are `[]`.
8. Stored value `"null"` or `'"a string"'` → `loadDraft()` returns `null`.
9. Stored object without `savedAt` → `null`.

**Verify**: `bun run test` → all pass, including ≥ 6 new tests in
`imported-columns.test.ts` and ≥ 3 new in `draft-storage.test.ts`.

### Step 4: Full pass

**Verify**: `bun run test` → exit 0; `bun run build` → exit 0.

## Test plan

Step 3 is the test plan. The regression pins that matter: quota-failure
no-throw (case 6) and old-draft array patching (case 7).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run test` exits 0 with the new tests present and passing
- [ ] `grep -n "typeof window" src/lib/imported-columns.ts` → 2 matches
- [ ] `grep -c "try" src/lib/imported-columns.ts` → ≥ 2
- [ ] `bun run build` exits 0
- [ ] `git status` shows changes only in the in-scope files
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 001 has not landed (no `vitest.config.ts` / no
  `draft-storage.test.ts` to extend).
- Any caller breaks type-wise after step 1/2 — the signatures were supposed
  to be unchanged; a break means the repo drifted.
- You find additional un-guarded `localStorage` call sites elsewhere and are
  tempted to fix them here — list them in your report instead (candidates
  exist in route files, e.g. `students.index.tsx` `saveSelectedSubjects`;
  they are out of scope).

## Maintenance notes

- The repo now has three storage modules all following the same pattern
  (SSR guard → try/catch → shape check). Reviewers should hold new storage
  code to it; better yet, a future change could extract a shared
  `safeLocalStorage` helper in `src/lib/` — deferred because three small
  modules don't yet justify the abstraction.
- `saveSelectedSubjects` / `loadSelectedSubjects` inside
  `src/routes/students.index.tsx` (~lines 40-58) have the same weaknesses;
  they were left in place because plan 003 rewrites that file's filter logic
  and touching it twice concurrently invites conflicts. Fold a fix into any
  later cleanup of that route.
