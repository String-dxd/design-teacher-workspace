# Plan 048: React/TanStack correctness quickies — dates, navigation, keys, search params, context

> **Executor instructions**: Follow this plan step by step; each step is
> independent — commit per step so any one can be reverted alone. Run every
> verification command. On any STOP condition, stop and report. When done,
> update this plan's row in `plans/README.md` — unless a reviewer dispatched
> you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 41c5962..HEAD -- src/routes/meetings.index.tsx src/routes/_guest.create.tsx 'src/routes/glow.$studentId.tsx' src/routes/reports.tsx src/routes/announcements.tsx src/components/heytalia/heytalia-context.tsx src/components/heytalia/heytalia-panel.tsx src/components/hdp/claim-editor.tsx src/components/hdp/draft-studio.tsx src/components/hdp/report-book.tsx src/components/hdp/report-story.tsx src/lib/hdp-draft-compose.ts`
> On drift vs the excerpts, STOP for that step (other steps may proceed).
>
> **NEVER run `bun run check`.** Targeted `bunx prettier --check <file>` /
> `bunx eslint <file>` only.

## Status

- **Priority**: P2
- **Effort**: M (six small independent steps; step 4 is the largest)
- **Risk**: LOW overall, MED for step 4
- **Depends on**: none
- **Category**: bug / tech-debt
- **Planned at**: commit `41c5962`, 2026-07-19

## Why this matters

A react-doctor scan (32/100) plus a manual TanStack-practices audit surfaced
a small set of real correctness issues worth batching: a module-scope "today"
that freezes at server start on a long-lived SSR process, full-document
reloads where the router should navigate, `navigate()` called during render,
array-index keys on a reorderable list of textareas (caret/focus stick to
the wrong row), layout routes trusting unvalidated search params through
`as` casts, an unmemoized context value, and one leaked `setTimeout`. Each
fix is mechanical; the value is closing the whole list with per-step
verification.

## Current state (per step)

Framework facts: TanStack Start SSR + Router file-based routes; React 19;
Base UI (not Radix) — components use `render={}` composition. Gates baseline
at planning: `bunx tsc --noEmit` = 76 errors; `bunx vitest run` = 190 pass /
6 fail (known-flaky `imported-columns.test.ts`); `bun run build` exit 0.

1. `src/routes/meetings.index.tsx:15` —
   `const TODAY = new Date().toISOString().slice(0, 10)` at module scope,
   used by `getMeetingStatus` (lines 17–25); another render-time
   `new Date().toISOString()` around line 34.
2. `src/routes/_guest.create.tsx:95` — card `onClick` builds
   `window.location.href = option.to + searchStr`; line 134 — close button
   sets `window.location.href = '/announcements'`. `CREATE_OPTIONS` entries
   have `to` (path string) and optional `search` (record).
3. `src/routes/glow.$studentId.tsx:21-24` — inside the component body:
   `if (!isEnabled('lta-intervention')) { navigate({...}); return null }` —
   `navigate()` during render (server/client divergence; React 19 warns).
4. `src/components/hdp/claim-editor.tsx:73` — `<li key={index}>` over claims
   that can be reordered (`move`, lines ~48–55) and removed, each row holding
   a controlled `Textarea`. Same index-keying at
   `src/components/hdp/draft-studio.tsx:703`,
   `src/components/hdp/report-book.tsx:504`,
   `src/components/hdp/report-story.tsx:532`. Claims are created in
   `src/lib/hdp-draft-compose.ts` (`composeDraft`) and persisted via
   `src/lib/hdp-store.ts` drafts; shared books snapshot claims at share time
   (plan 033), so **stored claims without ids must keep working**.
5. `src/routes/reports.tsx:9-12` and `src/routes/announcements.tsx:36-42` —
   layout routes with no `validateSearch`, reading
   `useSearch({ strict: false })` and casting:
   `((search as Record<string, unknown>).scope as string) ?? 'my'`,
   `.view === 'admin'`.
6. `src/components/heytalia/heytalia-context.tsx:14` —
   `<HeyTaliaContext value={{ view, setView }}>` fresh object every render.
   `src/components/heytalia/heytalia-panel.tsx:215-217` —
   `useEffect(() => { if (view === 'chat') setTimeout(() => inputRef.current?.focus(), 150) }, [view])`
   with no cleanup (timer fires after unmount).

**Verified false positives — do NOT "fix"** (react-doctor flagged, code
disproves): `app-sidebar.tsx:287` coach-mark timer (cleanup exists in both
effect return paths); `announcements-admin.tsx:147` (`navigate` inside the
`switchTab` event handler, not render); `lta-dialog.tsx:87` (refs cleared in
the `!isHovered` branch and on unmount).

## Commands you will need

| Purpose       | Command                                                 | Expected                                           |
| ------------- | ------------------------------------------------------- | -------------------------------------------------- |
| Typecheck     | `bunx tsc --noEmit`                                     | 0 new vs baseline (see step 5 caveat)              |
| Tests         | `bunx vitest run`                                       | no new failures; `hdp-draft-compose.test.ts` green |
| Build         | `bun run build`                                         | exit 0                                             |
| Targeted lint | `bunx eslint <files>` / `bunx prettier --check <files>` | clean                                              |

## Scope

**In scope**: exactly the files named per step above, plus
`src/types/hdp.ts` (step 4 adds one optional field) and
`src/lib/hdp-draft-compose.test.ts` (step 4 test).

**Out of scope**: the three false-positive files; any other react-doctor
warning (the remaining ~450 are legacy-file lints below the leverage bar or
tracked elsewhere); `announcements.index.tsx` / `announcements-admin.tsx`
formatDate work (plan 044); provider flash (plan 047).

## Git workflow

- Branch: `advisor/048-react-quickies`
- One conventional commit per step, e.g. `fix(meetings): compute today per render, not at module load`
- No push/PR unless instructed.

## Steps

### Step 1: Per-render "today" in meetings

Move `TODAY` inside `MeetingsPage` (`const today = new Date().toISOString().slice(0, 10)`),
thread it as a parameter (`getMeetingStatus(m, today)`), and replace the
line-34 render-helper `new Date()` the same way. Keep `getMeetingStatus`
module-scope and pure.

**Verify**: `bunx tsc --noEmit` no new errors; `/meetings` renders the same
grouping in the browser.

### Step 2: Router navigation in `_guest.create.tsx`

Replace both `window.location.href` sites with router navigation:
`const navigate = useNavigate()` then
`navigate({ to: option.to, search: option.search })` for the cards (the
`to` values are route paths — if TypeScript rejects the loose string, use
`navigate({ href: option.to + searchStr })`, which TanStack Router accepts
for computed URLs), and `navigate({ to: '/announcements' })` for the close
button.

**Verify**: `bunx tsc --noEmit` no new errors. Browser: from `/create`,
clicking "Announcement" reaches the new-announcement flow **without a full
reload** (network tab shows no document request); the X button returns to
`/announcements` likewise.

### Step 3: Effect-based redirect in glow route

Replace the render-time branch with:

```tsx
const ltaEnabled = isEnabled('lta-intervention')
React.useEffect(() => {
  if (!ltaEnabled) navigate({ to: '/students/$id', params: { id: student.id } })
}, [ltaEnabled, navigate, student.id])
if (!ltaEnabled) return null
```

**Verify**: `bunx tsc --noEmit` no new errors. Browser: with
`lta-intervention` off, visiting `/glow/<id>` lands on the student profile
with no console warning.

### Step 4: Stable claim ids

1. In `src/types/hdp.ts`, add `id?: string` to the draft-claim interface
   (find it via the type of `claims` used in `claim-editor.tsx` — likely
   `DraftClaim` or similar; read the file first).
2. In `src/lib/hdp-draft-compose.ts` (`composeDraft` and any other claim
   constructor, e.g. manual-add in `draft-studio.tsx`), assign
   `id: crypto.randomUUID()` at creation.
3. Key the four render sites on `claim.id ?? \`claim-${index}\`` (fallback
   keeps pre-existing stored drafts and snapshotted shared books rendering;
   they never reorder in read-only views, so the fallback is safe there —
   the _editor_ always sees freshly composed or newly added claims, which
   now carry ids).
4. Check `composeDraft`'s determinism tests: if any test asserts deep
   equality on claim objects, exclude `id` from the comparison (or assert
   `expect.objectContaining`) — do NOT weaken provenance assertions
   (sources, text, order).

**Verify**: `bunx vitest run src/lib/hdp-draft-compose.test.ts` green (plus
one new test: composed claims carry unique ids). Browser: in Draft Studio,
focus a middle claim's textarea, click its move-up arrow → focus/caret
follows the claim, and typed text lands in the right row.

### Step 5: `validateSearch` on the two layout routes

Add to `src/routes/reports.tsx` and `src/routes/announcements.tsx`:

```ts
validateSearch: (search: Record<string, unknown>) => ({
  scope: search.scope === 'school' ? ('school' as const) : ('my' as const),
  view: search.view === 'admin' ? ('admin' as const) : undefined,
}),
```

Then replace the `useSearch({ strict: false })` + casts with
`Route.useSearch()` reads. **Caveat**: TanStack Router merges same-named
search keys across nested routes for inference — plan 035's record notes 3
pre-existing tsc errors in `announcements.tsx` whose displayed union widens
when search keys change. After this step, `bunx tsc --noEmit` must show the
**same count** (76 at planning) — same lines may re-word. If the count
rises, the child routes' `tab`/`resume` params are colliding: STOP and
report rather than casting again. Also confirm defaulting `scope` to `'my'`
in `validateSearch` doesn't write `?scope=my` into URLs on unrelated
navigations (TanStack strips values equal to `undefined` only — if URLs get
noisy, make `scope` optional in the schema and default at the read site
instead, which preserves today's URLs exactly).

**Verify**: `bunx tsc --noEmit` count unchanged; browser:
`/announcements?view=admin` still shows the admin banner, plain
`/announcements` doesn't, School/My toggle still works, and URLs look the
same as before the change.

### Step 6: HeyTalia context memo + timer cleanup

- `heytalia-context.tsx`:
  `const value = useMemo(() => ({ view, setView }), [view])`.
- `heytalia-panel.tsx:215-217`:

```ts
useEffect(() => {
  if (view !== 'chat') return
  const id = setTimeout(() => inputRef.current?.focus(), 150)
  return () => clearTimeout(id)
}, [view])
```

**Verify**: `bunx tsc --noEmit` no new errors; browser: opening HeyTalia
chat still autofocuses the input.

## Test plan

- Step 4: one new test in `hdp-draft-compose.test.ts` — `composeDraft`
  output claims all have `id` and the ids are unique; existing determinism
  tests updated only to ignore `id` (never sources/text/order).
- Everything else is behavior-preserving refactor verified by the browser
  checks + existing suite (`bunx vitest run` full, no new failures).

## Done criteria

- [ ] All six steps' verifications pass (list them in the completion report)
- [ ] `bunx tsc --noEmit` → count ≤ baseline, no new error codes
- [ ] `bunx vitest run` → no new failures; new claim-id test passes
- [ ] `bun run build` → exit 0
- [ ] `grep -n "window.location.href" src/routes/_guest.create.tsx` → 0
- [ ] `grep -n "strict: false" src/routes/reports.tsx src/routes/announcements.tsx` → 0
- [ ] `git status` → only in-scope files modified
- [ ] `plans/README.md` row updated

## STOP conditions

- Step 4: claims turn out to be persisted with structural sharing that makes
  `id` leak into snapshot-equality guarantees (a failing store/compose test
  you'd have to weaken) — report instead of weakening.
- Step 5: tsc error count rises and the collision isn't resolvable by making
  the params optional — report with the exact new errors.
- Step 2: `navigate` cannot express one of the `CREATE_OPTIONS` targets
  (e.g. a guest-tree path with required search the router won't accept) —
  keep that one site as-is and report it.
- Any drift-check mismatch on the step's files.

## Maintenance notes

- Step 4's `id` is the natural key for any future claim drag-and-drop —
  don't regress to index keys when that lands.
- Step 5 establishes the pattern: layout-level search params get
  `validateSearch`, no `strict: false` + casts. `app-sidebar.tsx:279` also
  reads `location.search` with a cast (`view`) — follow-up candidate once
  043/047 settle that file.
- The ~450 remaining react-doctor warnings are dominated by legacy
  `announcements.new.tsx` / `student-profile.tsx` / `attendance-analytics.tsx`
  lints; re-run `npx react-doctor@latest --verbose` after this plan and 044
  land to get an honest new score before chasing more.
