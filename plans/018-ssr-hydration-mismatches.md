# Plan 018: Eliminate the five SSR hydration-mismatch sources

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b01d78d..HEAD -- src/components/greeting.tsx src/routes/_guest.create.tsx src/routes/students.index.tsx src/routes/announcements.index.tsx src/routes/announcements.new.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M (five small fixes + tests)
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b01d78d`, 2026-07-02

## Why this matters

This app is TanStack Start with SSR **on by default** (there is no `ssr: false`
anywhere in the config). Five components read browser-only or time-dependent
values (`new Date()`, `localStorage`) during the render pass, so the HTML the
server sends differs from what the client renders on hydration. That produces
React hydration-mismatch errors, visible content flips on load, and — as this
project has seen before — *silently broken hydration* where the page looks fine
but event handlers never attach. Four of the five sites are on primary routes:
the home page greeting, `/create`, `/students`, and `/announcements`.

## Current state

The repo already contains the correct patterns to copy:

- **Deferred localStorage hydration**: `src/lib/feature-flags/context.tsx`
  initializes state to `DEFAULT_FEATURE_FLAGS`, then loads the stored value in
  a `useEffect` guarded by an `isHydrated` flag (lines ~40–62). Server and
  first client render always agree; the real value arrives post-mount.
- Another exemplar: `src/components/ui/sidebar.tsx:105-114` (same deferred
  pattern for its persisted open-state).

The five offending sites:

1. `src/components/greeting.tsx:7-19` — rendered by `src/routes/index.tsx`
   (home page):

   ```tsx
   function getGreeting(): string {
     const hour = new Date().getHours()
     if (hour < 12) { return 'Good morning' } ...
   }
   export function Greeting({ userName = 'Mr. Tan' }: GreetingProps) {
     const greeting = getGreeting()
   ```

   Server clock/timezone ≠ client clock near hour boundaries → text mismatch.

2. `src/routes/_guest.create.tsx:120-141` — `getFormsEnabled()` reads
   `localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)` (unguarded; on the server
   the throw is swallowed by `try/catch` → returns default) and is called
   directly in `CreatePage()`'s render body to filter `CREATE_OPTIONS`.
   When the stored flag differs from the default, server and client render
   different option lists.

3. `src/routes/students.index.tsx:310-312`:

   ```tsx
   const [selectedSubjects, setSelectedSubjects] =
     useState<Array<string> | null>(() => loadSelectedSubjects())
   ```

   `loadSelectedSubjects` (line ~44) reads `localStorage` with no window
   guard. `useState` initializers run during SSR too: server gets `null`
   (= all subjects), client gets the stored subset → the "Overall %" column
   differs between server HTML and hydrated tree.

4. `src/routes/announcements.index.tsx:162-175` — the `allAnnouncements`
   `useMemo` calls `loadDraft()` (`src/lib/draft-storage.ts`, unguarded
   `localStorage.getItem`) and prepends a synthetic `id: '__draft__'` row.
   Server renders the list without the draft row; client adds one → list
   length/keys differ.

5. `src/routes/announcements.new.tsx:233-247` — inside the preview component:

   ```tsx
   const previewDate = new Date().toLocaleDateString('en-SG', {...}).toUpperCase()
   const previewTime = new Date().toLocaleTimeString('en-SG', {...}).toUpperCase()
   const timestamp = `${previewDate}, ${previewTime}`
   ```

   Same `new Date()`-in-render class, lower blast radius (deep in the form).

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Install   | `bun install`          | exit 0              |
| Typecheck | `bunx tsc --noEmit`    | ≤41 errors, all pre-existing (baseline at `b01d78d`: 41 errors — 23×TS2322, 9×TS2345, 3×TS2353, 1 each TS7053/TS2769/TS2741/TS2559/TS2367/TS2339). **No new files or error codes.** |
| Tests     | `bunx vitest run`      | baseline: 37 pass / 16 fail (2 test files fail pre-existing). **No new failures**; your new tests pass. |
| Build     | `bun run build`        | exit 0              |
| Dev       | `bun run dev`          | serves on port 3000 |

## Scope

**In scope** (the only files you should modify):

- `src/components/greeting.tsx`
- `src/components/greeting.test.tsx` (create)
- `src/routes/_guest.create.tsx`
- `src/routes/students.index.tsx`
- `src/routes/announcements.index.tsx`
- `src/routes/announcements.new.tsx` (ONLY lines ~233–247, the preview timestamp)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- `src/lib/feature-flags/context.tsx`, `src/lib/draft-storage.ts`,
  `src/components/ui/sidebar.tsx` — these are the *correct* exemplars.
- Everything else in `announcements.new.tsx` (a 2,758-line file; plans 019 and
  022 touch other parts of it — keep your diff surgical).
- The `min={new Date().toISOString().split('T')[0]}` attributes on date inputs
  (`announcements.new.tsx:1813`, `announcements.$id.tsx:291`) — attribute-only,
  mismatches only across a midnight boundary; deliberately deferred.

## Git workflow

- Branch: `advisor/018-ssr-hydration`
- Conventional commits, e.g. `fix(ssr): defer browser-only reads to post-mount effects`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the greeting deterministic on first render

In `src/components/greeting.tsx`:

- Change `getGreeting` to take the hour as a parameter and export it for
  testing: `export function getGreeting(hour: number): string`.
- In `Greeting`, replace the render-time call with:

  ```tsx
  const [greeting, setGreeting] = useState('Good day')
  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()))
  }, [])
  ```

  Server and first client render both say "Good day"; the time-aware greeting
  swaps in immediately after mount.

**Verify**: `grep -n 'new Date' src/components/greeting.tsx` → the only match
is inside the `useEffect`. `bunx tsc --noEmit` → no new errors.

### Step 2: Use the feature-flag context on /create

In `src/routes/_guest.create.tsx`:

- Delete `getFormsEnabled()` (lines ~120–133) and its now-unused imports
  (`FEATURE_FLAGS_STORAGE_KEY`, `DEFAULT_FEATURE_FLAGS`, `FeatureFlags` — check
  what becomes unused).
- In `CreatePage`, replace `const formsEnabled = getFormsEnabled()` with:

  ```tsx
  const { flags } = useFeatureFlags()
  const formsEnabled = flags.forms
  ```

  Import `useFeatureFlags` from `@/lib/feature-flags`. The provider already
  wraps guest routes (`src/routes/__root.tsx:138`) and defers the localStorage
  read behind its `isHydrated` effect, so SSR and hydration agree.

**Verify**: `grep -n 'localStorage' src/routes/_guest.create.tsx` → no matches.
`bunx tsc --noEmit` → no new errors.

### Step 3: Defer the subject-selection load on /students

In `src/routes/students.index.tsx` (line ~310):

- Change the initializer to plain `null` and load post-mount:

  ```tsx
  const [selectedSubjects, setSelectedSubjects] =
    useState<Array<string> | null>(null)
  useEffect(() => {
    setSelectedSubjects(loadSelectedSubjects())
  }, [])
  ```

  `null` already means "all subjects", which is exactly what the server
  renders today, so first paint is unchanged.

**Verify**: `bunx tsc --noEmit` → no new errors; open the file and confirm no
other `localStorage` read runs during render (the save path in
`handleSubjectsApply` is event-handler code — fine, leave it).

### Step 4: Defer the draft row on /announcements

In `src/routes/announcements.index.tsx` (lines ~160–175):

- Add state + effect:

  ```tsx
  const [draft, setDraft] = useState<ReturnType<typeof loadDraft>>(null)
  useEffect(() => {
    setDraft(loadDraft())
  }, [])
  ```

- In the `allAnnouncements` `useMemo`, remove the `loadDraft()` call, use the
  `draft` state instead, and add `draft` to the dependency array.

**Verify**: `grep -n 'loadDraft' src/routes/announcements.index.tsx` → matches
only in the import, the effect, and (if present) event handlers — not inside
`useMemo`'s body. `bunx tsc --noEmit` → no new errors.

### Step 5: Defer the preview timestamp

In `src/routes/announcements.new.tsx` (lines ~233–247), inside the component
that computes `previewDate`/`previewTime`/`timestamp`:

- Replace the three render-time consts with:

  ```tsx
  const [timestamp, setTimestamp] = useState('')
  useEffect(() => {
    const previewDate = new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
    const previewTime = new Date().toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
    setTimestamp(`${previewDate}, ${previewTime}`)
  }, [])
  ```

  Keep the downstream usage of `timestamp` unchanged. An empty string on first
  paint is acceptable for a preview mock.

**Verify**: `bunx tsc --noEmit` → no new errors; `git diff --stat` shows only
this hunk in `announcements.new.tsx`.

### Step 6: Hydration smoke check

Run `bun run dev`, then load `/`, `/create`, `/students`, `/announcements` in a
browser (use the agent-browser skill if available). Check the browser console
for hydration warnings/errors ("Hydration failed", "Text content does not
match", #418/#423). To exercise sites 2–4 properly, first set a non-default
state: on `/flags` toggle the forms flag off; on `/announcements/new` type a
title and leave (creates a draft); on `/students` pick a subject subset via the
Overall % column dialog. Then hard-reload each page.

**Verify**: zero hydration warnings in the console on all four routes, with and
without stored localStorage state.

## Test plan

- Create `src/components/greeting.test.tsx` modeled structurally on the
  existing vitest tests (see `src/lib/` for existing `*.test.ts` patterns; use
  plain function tests, no rendering needed):
  - `getGreeting(8)` → `'Good morning'`; `getGreeting(11)` → `'Good morning'`
  - `getGreeting(12)` → `'Good afternoon'`; `getGreeting(16)` → `'Good afternoon'`
  - `getGreeting(17)` → `'Good evening'`; `getGreeting(23)` → `'Good evening'`
- Verification: `bunx vitest run` → 37 + your new tests pass / 16 pre-existing
  failures unchanged.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bunx tsc --noEmit` → ≤41 errors, no new error codes or files vs baseline
- [ ] `bunx vitest run` → no new failures; new greeting tests pass
- [ ] `bun run build` → exit 0
- [ ] `grep -rn 'localStorage' src/routes/_guest.create.tsx` → 0 matches
- [ ] In `greeting.tsx`, `students.index.tsx`, `announcements.index.tsx`,
      `announcements.new.tsx`: every `new Date()`/`localStorage`/`loadDraft()`/
      `loadSelectedSubjects()` read that feeds rendered output runs inside a
      `useEffect` or event handler, not in render/initializer
- [ ] Browser console clean of hydration warnings on `/`, `/create`,
      `/students`, `/announcements` (step 6)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at any cited location doesn't match the excerpts (drift).
- After step 2, `/create` renders no options or throws
  "useFeatureFlags must be used within a FeatureFlagProvider" — the provider
  assumption is wrong for that route; report instead of adding a provider.
- Step 6 still shows hydration warnings on a route after its fix — there is a
  second mismatch source on that route; report it, don't hunt beyond scope.
- Fixing a site appears to require modifying `feature-flags/context.tsx` or
  `draft-storage.ts`.

## Maintenance notes

- Any future component reading `localStorage`, `Date`, `Math.random`, or
  `window` must do so in `useEffect`/event handlers (or the feature-flag
  context). Reviewers: reject render-time reads of those in SSR'd routes.
- The deferred `min=` date-input attributes (out of scope above) are a known
  micro-mismatch across midnight; fix opportunistically if that code is touched.
- Plan 023 proposes decomposing `announcements.new.tsx`; if it lands first,
  re-locate the step-5 site by grepping for `previewDate`.
