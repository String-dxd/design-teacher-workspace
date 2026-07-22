# Plan 043: Feature-flag hierarchy — parent flags with remembered sub-toggles

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 41c5962..HEAD -- src/lib/feature-flags src/hooks/use-feature-flag.ts src/routes/flags.tsx src/routes/student-analytics.tsx src/routes/insight-buddy.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.
>
> **NEVER run `bun run check`** (repo-wide `prettier --write .` — reformats
> unrelated files). Use targeted `bunx prettier --check <file>` /
> `bunx eslint <file>` only.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `41c5962`, 2026-07-19 (working tree had uncommitted
  changes in unrelated files; the in-scope files above were clean)

## Why this matters

The registry has 24 flags rendered as a flat list per module, but six of them
are really sub-features of another flag, and that relationship exists only as
prose in descriptions and as ad-hoc `&&`/`||` predicates re-derived at every
consumer. Concretely: `report-generation` only means anything under
`agency-reports`; `reports-river-visibility` and `reports-hdp-future` only
matter when `reports-hdp` is on (yet two guest routes read them without the
parent); `forms` and `posts-admin-view` decorate the Posts page gated by
`posts`; and the `student-analytics` / `student-analytics-basic` pair is
resolved by OR-precedence logic copied across 8 files. This plan adds a
one-level `parent` field to the registry, makes `isEnabled()` return the
**effective** value (`parent && child`), and renders children as indented,
parent-disabled sub-toggles on `/flags`. Maintainer decisions (2026-07-19):
child values are **remembered** when the parent is off (switch keeps its
stored value, greyed out; re-enabling the parent restores behavior), and flag
**keys stay unchanged** (Round 7 decided renames churn users' localStorage
for no behavior gain).

## Current state

Files:

- `src/lib/feature-flags/types.ts` — `FeatureFlagKey` union (24 keys),
  `FeatureFlagMeta` interface (`label`, `description`, `stage`, `module`,
  `defaultValue` — no `parent`).
- `src/lib/feature-flags/constants.ts` — `FEATURE_FLAG_MODULES` (5 modules),
  `FEATURE_FLAG_REGISTRY: Record<FeatureFlagKey, FeatureFlagMeta>`,
  `DEFAULT_FEATURE_FLAGS` derived from the registry, storage key
  `FEATURE_FLAGS_STORAGE_KEY = 'feature_flags'`.
- `src/lib/feature-flags/context.tsx` — provider with `loadFlags()` (SSR →
  defaults; client → defaults overlaid with stored booleans), `isEnabled(key)`
  returns `flags[key]` raw (lines 71–76), `setFlag`, `resetFlags`.
- `src/lib/feature-flags/index.ts` — barrel re-exporting all of the above.
- `src/hooks/use-feature-flag.ts` — `useFeatureFlag(key)` returns
  `isEnabled(key)`.
- `src/routes/flags.tsx` — flat per-module cards; rows sorted by
  `STAGE_ORDER` (Release 2 → Release 3 → Experiment); each row = Label +
  stage Badge + description + `<Switch checked={flags[key]} …>`.
- `src/routes/student-analytics.tsx:23-33` and
  `src/routes/insight-buddy.tsx:43-51` — `beforeLoad` guards that **bypass
  the provider**, re-implementing the merge inline:

```tsx
// src/routes/student-analytics.tsx:24-32
beforeLoad: () => {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)
  const flags = stored
    ? { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(stored) }
    : DEFAULT_FEATURE_FLAGS
  if (!flags['student-analytics'] && !flags['student-analytics-basic'])
    throw redirect({ to: '/' })
},
```

Parent/child relationships as they exist in code today (verified 2026-07-19):

| Child                      | Parent                    | Evidence                                                                                                                                                                                                                                        |
| -------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `report-generation`        | `agency-reports`          | registry description says "Agency reports only"; profile section renders on `agencyReportsEnabled \|\| reportGenerationEnabled` (`src/components/students/student-profile.tsx:1707`), button additionally needs the child (`:1725`)             |
| `reports-river-visibility` | `reports-hdp`             | river renders only inside HDP surfaces (`src/routes/reports.students.$studentId.tsx:30,77`, `src/components/hdp/reports-home.tsx:192`)                                                                                                          |
| `reports-hdp-future`       | `reports-hdp`             | all teacher-side consumers live behind `reports-hdp` (`src/components/hdp/draft-studio.tsx:100`, `release-manager.tsx:69`); guest routes read it parent-free (`src/routes/_guest.hdp-report.$token.tsx:55`, `_guest.hdp-student.$token.tsx:50`) |
| `forms`                    | `posts`                   | Custom Forms tab lives on the Posts page (`src/routes/announcements.index.tsx:266`); create-flow option (`src/routes/_guest.create.tsx:118`)                                                                                                    |
| `posts-admin-view`         | `posts`                   | adds a sidebar link to `/announcements?view=admin` (`src/components/app-sidebar.tsx:324`)                                                                                                                                                       |
| `student-analytics`        | `student-analytics-basic` | sidebar precedence (`src/components/app-sidebar.tsx:333-341`); either-on predicates in 8 files (e.g. `src/components/app-header.tsx:37-38`, `src/routes/students.index.tsx:110`)                                                                |

**Two documented behavior changes this plan makes deliberately** (maintainer
approved the hierarchy 2026-07-19 — record both in the commit message):

1. The agency-report wizard is today reachable with `agency-reports` OFF as
   long as `report-generation` is ON — a decision documented in a code
   comment at `src/routes/students_.$id.agency-report.new.tsx:3613-3616`
   ("Report Generation on its own is sufficient to reach the wizard …").
   With effective values, child-on/parent-off resolves to OFF, so that
   deep-link path dies. **Update that comment** (see Step 6).
2. Guest report/student views today render Prototype-B content whenever
   `reports-hdp-future` is stored ON even if `reports-hdp` is OFF. With
   effective values they fall back to Prototype-A rendering when the parent
   is off. This is more consistent, not less.

Semantics change for the analytics pair: today, `student-analytics` ON with
`student-analytics-basic` OFF still shows the analytics pages (either-on
predicate). Under the hierarchy that combination resolves to everything-off,
so Step 3 includes a **one-time reconcile** in `loadFlags()` that preserves
users' current behavior.

## Commands you will need

| Purpose           | Command                                 | Expected on success                                                                                                       |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Typecheck         | `bunx tsc --noEmit`                     | 76 pre-existing errors, **0 new** (record baseline first)                                                                 |
| Tests             | `bunx vitest run`                       | 190 pass / 6 fail baseline; the 6 are the known-flaky `imported-columns.test.ts` (sometimes passes). **No new failures.** |
| Build             | `bun run build`                         | exit 0                                                                                                                    |
| Format (targeted) | `bunx prettier --check <changed files>` | exit 0                                                                                                                    |
| Lint (targeted)   | `bunx eslint <changed files>`           | 0 new errors                                                                                                              |
| Dev server        | `bun run dev`                           | port 3000                                                                                                                 |

## Scope

**In scope** (the only files you should modify/create):

- `src/lib/feature-flags/types.ts`
- `src/lib/feature-flags/constants.ts`
- `src/lib/feature-flags/context.tsx`
- `src/lib/feature-flags/index.ts`
- `src/lib/feature-flags/feature-flags.test.ts` (create)
- `src/routes/flags.tsx`
- `src/routes/student-analytics.tsx` (beforeLoad only)
- `src/routes/insight-buddy.tsx` (beforeLoad only)
- `src/routes/students_.$id.agency-report.new.tsx` (the one code comment, Step 6)

**Out of scope** (do NOT touch, even though they look related):

- Every other flag consumer (`app-sidebar.tsx`, `student-profile.tsx`,
  `students.index.tsx`, HDP components, guest routes, …). The whole point of
  resolving effective values inside `isEnabled` is that ~25 consumer files
  need **zero edits**. Their `parent || child` predicates become redundant
  but stay correct (`child` effective now implies `parent`); simplifying
  them is a follow-up, not this plan.
- Flag **keys** and localStorage key — unchanged by decision.
- `src/hooks/use-feature-flag.ts` — no change needed; it already delegates
  to `isEnabled`.
- Plan 047 (first-paint flash) — separate plan; do not attempt cookie/SSR
  seeding here.

## Git workflow

- Branch: `advisor/043-feature-flag-hierarchy`
- Conventional commits, e.g. `refactor(flags): parent/sub-toggle hierarchy with remembered children`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add `parent` to the meta type and registry

In `src/lib/feature-flags/types.ts`, add to `FeatureFlagMeta`:

```ts
/** One level only — a parent flag must not itself have a parent. */
parent?: FeatureFlagKey
```

In `src/lib/feature-flags/constants.ts`, set `parent` on exactly these six
registry entries (leave every other field as-is unless named below):

- `'report-generation'`: `parent: 'agency-reports'`
- `'reports-river-visibility'`: `parent: 'reports-hdp'`
- `'reports-hdp-future'`: `parent: 'reports-hdp'`
- `forms`: `parent: 'posts'`
- `'posts-admin-view'`: `parent: 'posts'`
- `'student-analytics'`: `parent: 'student-analytics-basic'`

Relabel the analytics pair so the hierarchy reads naturally on `/flags`
(keys unchanged):

- `'student-analytics-basic'` → `label: 'Analytics'`, description:
  `'Show Analytics and Profiles pages in the sidebar — attendance cohort analytics, academic analytics, and export CSV.'`
- `'student-analytics'` → `label: 'Insight Buddy'`, description:
  `'Add the AI-powered Insight Buddy to Analytics — the Insight Buddy sidebar entry and AI student insights.'`

**Verify**: `bunx tsc --noEmit` → error count unchanged from your recorded
baseline (76 at planning time).

### Step 2: Resolve effective values in `isEnabled`

In `src/lib/feature-flags/context.tsx`, change `isEnabled` to:

```ts
const isEnabled = React.useCallback(
  (key: FeatureFlagKey): boolean => {
    const parent = FEATURE_FLAG_REGISTRY[key].parent
    if (parent && !flags[parent]) return false
    return flags[key]
  },
  [flags],
)
```

(Import `FEATURE_FLAG_REGISTRY` from `./constants`.) `flags` in context stays
**raw** stored values — `/flags` needs them for switch positions; only
`isEnabled`/`useFeatureFlag` return effective values. `setFlag`/`resetFlags`
are unchanged (remember semantics: toggling a parent never writes children).

**Verify**: `bunx tsc --noEmit` → no new errors.

### Step 3: One-time analytics reconcile in `loadFlags()`

In `loadFlags()` (context.tsx), after the merge loop and before `return
merged`, add:

```ts
// Migration (plan 043): pre-hierarchy, 'student-analytics' alone implied
// the analytics pages. Under parent/child it needs its parent on.
if (merged['student-analytics'] && !merged['student-analytics-basic']) {
  merged['student-analytics-basic'] = true
}
```

The save-effect already persists the reconciled shape after hydration, so
this runs effectively once per stored payload.

**Verify**: `bunx tsc --noEmit` → no new errors.

### Step 4: Shared non-React loader + fix the two bypassing route guards

Export a plain function from `src/lib/feature-flags/context.tsx` (and re-export
via `index.ts`):

```ts
/** Non-React read for route guards. Returns EFFECTIVE values. */
export function readEffectiveFlags(): FeatureFlags {
  const raw = loadFlags()
  const effective = { ...raw }
  for (const key of Object.keys(raw) as Array<FeatureFlagKey>) {
    const parent = FEATURE_FLAG_REGISTRY[key].parent
    if (parent && !raw[parent]) effective[key] = false
  }
  return effective
}
```

Replace the inline localStorage parsing in both `beforeLoad`s:

- `src/routes/student-analytics.tsx` — guard becomes
  `if (!flags['student-analytics-basic'] && !flags['student-analytics']) throw redirect({ to: '/' })`
  using `const flags = readEffectiveFlags()` (keep the
  `typeof window === 'undefined'` early return). Drop the now-unused
  `FEATURE_FLAGS_STORAGE_KEY`/`DEFAULT_FEATURE_FLAGS` imports.
- `src/routes/insight-buddy.tsx` — same pattern, guard
  `if (!flags['student-analytics']) throw redirect({ to: '/' })`.

**Verify**: `bunx tsc --noEmit` → no new errors, and
`grep -rn "FEATURE_FLAGS_STORAGE_KEY" src/routes/` → no matches.

### Step 5: `/flags` renders sub-toggles nested under parents

In `src/routes/flags.tsx`, restructure each module group into top-level
entries (no `parent`) in the existing stage order, each followed by its
children (registry order). Render a child row indented (e.g. wrapper
`className="ml-6 border-l pl-4"`) below its parent, and disable its switch
when the parent is stored-off:

```tsx
<Switch
  id={key}
  checked={flags[key]} // raw stored value — remembered
  disabled={meta.parent ? !flags[meta.parent] : false}
  onCheckedChange={(checked) => setFlag(key, checked)}
/>
```

When disabled, also dim the row text (`className={parentOff ? 'opacity-50' : …}`)
and keep the Label/description structure otherwise identical (reuse the
existing row JSX — do not build a new component; this is a layout change
inside the page per the repo's component-reuse policy in `AGENTS.md`).

**Verify**: `bun run dev`, open `http://localhost:3000/flags` → Reports card
shows "HDP Reports module" with "Full river for subject teachers" and
"Future state (Prototype B)" indented beneath it; toggling the parent off
greys/disables both children but their switch positions persist; toggling
the parent back on re-enables them at their prior positions. Communications
card shows "Custom forms" and "Posts admin view" under "Posts"; Student
Insights shows "Insight Buddy" under "Analytics"; Reports shows "Agency
report generation" under "Agency reports".

### Step 6: Update the wizard deep-link comment

In `src/routes/students_.$id.agency-report.new.tsx` (~line 3613), replace the
comment block that begins `// Report Generation on its own is sufficient to
reach the wizard —` with:

```ts
// Since plan 043, 'report-generation' is a sub-toggle of 'agency-reports':
// useFeatureFlag returns the EFFECTIVE value (parent && child), so the
// wizard needs both on. The pre-043 deep-link path (generation on, agency
// reports off) no longer exists.
```

Do not change any logic in this file — the existing
`if (!reportGenerationEnabled)` guard is now automatically parent-aware.

**Verify**: `bunx tsc --noEmit` → no new errors.

### Step 7: Tests

Create `src/lib/feature-flags/feature-flags.test.ts` (see Test plan), run the
full gates.

**Verify**: `bunx vitest run` → all new tests pass, no new failures vs the
190-pass/6-fail baseline. `bun run build` → exit 0.
`bunx prettier --check` + `bunx eslint` on every modified file → clean.

## Test plan

New file `src/lib/feature-flags/feature-flags.test.ts` (model the structure
on `src/lib/hdp-store.test.ts` — plain vitest, no jsdom needed for the pure
parts; use a `beforeEach` localStorage stub as in
`src/lib/draft-storage.test.ts` for `readEffectiveFlags`):

1. **Registry integrity**: every `parent` in `FEATURE_FLAG_REGISTRY` (a) is
   a key of the registry, (b) has no `parent` itself (depth ≤ 1), (c) shares
   its child's `module`.
2. **Effective resolution**: with a stored payload
   `{ 'reports-hdp': false, 'reports-hdp-future': true }`,
   `readEffectiveFlags()['reports-hdp-future']` is `false`; flipping
   `'reports-hdp'` to `true` makes it `true` (remember semantics).
3. **Analytics reconcile**: stored `{ 'student-analytics': true }` (basic
   absent) → `readEffectiveFlags()['student-analytics-basic']` is `true`.
4. **Non-boolean junk ignored**: stored `{ posts: 'yes' }` → `posts` falls
   back to its default.

## Done criteria

- [ ] `bunx tsc --noEmit` → no errors beyond the recorded baseline
- [ ] `bunx vitest run` → new feature-flags tests pass; no new failures
- [ ] `bun run build` → exit 0
- [ ] `grep -rn "localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)" src/routes/` → 0 matches
- [ ] `/flags` shows the 6 children indented + disabled-when-parent-off (browser check)
- [ ] `git status` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `Current state` excerpts don't match the live code (drift).
- `isEnabled` turning effective breaks a consumer in a way visible in tsc or
  tests — the design assumes child-implies-parent is safe everywhere; if a
  consumer _requires_ child-on/parent-off (other than the two documented
  behavior changes above), stop.
- You find a registry entry needing a parent chain of depth > 1.
- The `/flags` Switch component does not support `disabled` (check
  `src/components/ui/switch.tsx` first — it's a Base UI wrapper and should).

## Maintenance notes

- Plan 047 (first-paint flash) builds on `readEffectiveFlags` and the
  provider; land 043 first.
- Consumers still contain now-redundant `parent || child` predicates
  (e.g. `student-profile.tsx:1707`, the 8 analytics OR-predicates). They are
  correct but can be simplified in a later pass — do not simplify here.
- Reviewer should scrutinize: the analytics reconcile (only migration
  touching stored data) and the two documented behavior changes (wizard
  deep-link, guest future rendering).
- If a future flag needs child-visible-while-parent-off semantics, add an
  explicit `independent: true` escape to the meta rather than removing the
  effective resolution.
