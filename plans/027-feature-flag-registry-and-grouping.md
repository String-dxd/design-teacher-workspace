# Plan 027: Consolidate feature flags into a single grouped registry (key-feature modules) and remove the dead `parents-gateway` flag

> **Revision A (2026-07-16, maintainer-approved)**: grouping changed from
> mirror-the-sidebar-IA to **key product features** — Student Insights /
> Contextual Intelligence / Reports / Communications / Manage. The canonical
> module-assignment table, module list, `FeatureFlagModule` union, and the
> `lta-intervention` label below reflect Revision A; superseded sidebar-IA
> wording elsewhere in prose should be read accordingly.

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 9266c4f..HEAD -- src/lib/feature-flags src/routes/flags.tsx src/components/app-sidebar.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (mechanical restructure; no flag default changes; one dead-flag removal)
- **Depends on**: none
- **Category**: tech-debt / dx
- **Planned at**: commit `9266c4f`, 2026-07-16

## Why this matters

Feature-flag knowledge is currently split across three files that must be kept
in sync by hand: the key union in `src/lib/feature-flags/types.ts`, the default
values in `src/lib/feature-flags/constants.ts`, and the labels / descriptions /
stages in `src/routes/flags.tsx`. They have already drifted: `parents-gateway`
exists in the type and defaults but has **no entry on the `/flags` page and no
consumer anywhere** (the sidebar reads it but no menu item declares it), so it
can never do anything and can never be toggled. The `/flags` page itself is a
flat list of 24 switches in ad-hoc order, which makes it hard to see which
flags belong to which part of the product. After this plan: one registry is the
single source of truth (key, default, label, description, stage, module), the
dead flag is gone, stale localStorage keys are dropped on load, and the
`/flags` page renders the flags grouped by the same modules a user sees in the
sidebar (Student Insights → Communications → Manage, plus a General group for
app-shell flags), with each row carrying a short, scannable feature name —
so the list reads as a simple two-level outline (Module → feature, feature,
feature) with the long explanatory text demoted to the row description.

## Current state

Relevant files:

- `src/lib/feature-flags/types.ts` — hand-written `FeatureFlagKey` union (25 keys) + `FeatureFlags` mapped type.
- `src/lib/feature-flags/constants.ts` — `FEATURE_FLAGS_STORAGE_KEY` + hand-written `DEFAULT_FEATURE_FLAGS` object (25 entries).
- `src/lib/feature-flags/context.tsx` — provider; `loadFlags()` merges localStorage over defaults with `{ ...DEFAULT_FEATURE_FLAGS, ...parsed }` (keeps unknown/stale keys).
- `src/lib/feature-flags/index.ts` — barrel: re-exports types, constants, provider.
- `src/routes/flags.tsx` — the `/flags` page; local `featureFlagConfigs` array (24 entries — `parents-gateway` missing) with `label`/`description`/`stage`, rendered as ONE flat Card.
- `src/components/app-sidebar.tsx` — reads flags to filter menu items; lines 287 and 341 read `parents-gateway`, but **no `MenuItem` in this file has `featureFlag: 'parents-gateway'`**, so both lines are dead.
- `src/hooks/use-feature-flag.ts` — `useFeatureFlag(key)` helper. Unchanged by this plan.

Verified consumer facts (audited at `9266c4f`):

- `grep -rn "parents-gateway" src` outside `src/lib/feature-flags/` returns exactly two hits, both in `app-sidebar.tsx` (lines 287, 341), both dead as described.
- Every other flag key has at least one real consumer. Do NOT remove any other key.

Excerpt — `src/lib/feature-flags/constants.ts:5-31` (current defaults, verbatim):

```ts
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  posts: true,
  forms: true,
  notifications: true,
  'hdp-reports': true,
  'parents-gateway': true,
  'student-analytics': false,
  'student-analytics-basic': false,
  'lta-intervention': false,
  'student-groups': false,
  reports: false,
  calendar: false,
  meetings: false,
  'import-data': false,
  'agency-reports': true,
  'report-generation': true,
  'msf-uplift-data': false,
  'date-range-filter': false,
  'attention-tag': false,
  'column-visibility': false,
  'overall-percentage': false,
  'social-links': false,
  export: false,
  'primary-contact': false,
  'posts-admin-view': false,
  'reports-admin-view': false,
}
```

Excerpt — `src/components/app-sidebar.tsx:287` and `:341` (the two lines to delete):

```ts
  const parentsGatewayEnabled = useFeatureFlag('parents-gateway')
...
      if (item.featureFlag === 'parents-gateway') return parentsGatewayEnabled
```

Excerpt — `src/routes/flags.tsx:27-45` (shape of the config entries; their
`description`/`stage` strings are carried over VERBATIM into the registry,
while `label` is replaced by the simplified name from the table below):

```ts
const featureFlagConfigs: Array<FeatureFlagConfig> = [
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Enable notification features',
    stage: 'Release 2',
  },
  ...
```

Excerpt — `src/lib/feature-flags/context.tsx:22-27` (merge that keeps stale keys):

```ts
const stored = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY)
if (stored) {
  const parsed = JSON.parse(stored) as Partial<FeatureFlags>
  return { ...DEFAULT_FEATURE_FLAGS, ...parsed }
}
```

Sidebar IA (the grouping this plan mirrors, from `app-sidebar.tsx`): an
unlabeled main group (Home, Attendance), then **Student Insights** (Analytics,
Profiles, Insight Buddy), then **Communications** (Posts, Posts (Admin),
Meetings, Holistic Development Reports), then **Manage** (Student Groups,
Calendar, Reports, Reports (Admin)).

### Canonical flag → module assignment (Revision A — key features; use exactly this)

Module order on the page: **Student Insights → Contextual Intelligence → Reports → Communications → Manage**.

| Module                                                | Flags (in this display order)                                                                                                                                                                                                                   | Rationale                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `student-insights` — "Student Insights"               | `student-analytics-basic`, `student-analytics`, `import-data`, `export`, `date-range-filter`, `column-visibility`, `overall-percentage`, `social-links`, `primary-contact`, `student-groups` (Revision B, 2026-07-16: moved here from `manage`) | the student list / profile / analytics / grouping feature set                                   |
| `contextual-intelligence` — "Contextual Intelligence" | `lta-intervention`, `attention-tag`, `msf-uplift-data`                                                                                                                                                                                          | signals and external data about students (LTA intervention, LTA/SEN/FAS tags, MSF-sourced data) |
| `reports` — "Reports"                                 | `hdp-reports`, `agency-reports`, `report-generation`, `reports`, `reports-admin-view`                                                                                                                                                           | every reporting capability unified, regardless of sidebar placement                             |
| `communications` — "Communications"                   | `posts`, `posts-admin-view`, `forms`, `meetings`, `notifications`                                                                                                                                                                               | parent/staff communication surfaces incl. the header notifications bell                         |
| `manage` — "Manage"                                   | `calendar`                                                                                                                                                                                                                                      | planning and organisation tools (Revision B: `student-groups` moved to Student Insights)        |

(The module id `reports` and the flag key `reports` coexist — different
namespaces, no conflict.)

> **Revision C (2026-07-16, maintainer-requested)**: within each module the
> page sorts flags by stage — `Release 2` → `Release 3` → `Experiment` last —
> as a stable sort in `flags.tsx`'s group derivation (registry insertion order
> breaks ties). Display order is therefore stage-then-registry-order, not raw
> registry order.

### Canonical simplified labels (use exactly these)

The maintainer wants the list to read as a simple two-level outline:
module heading → short feature names. Rules applied: sentence case, drop
module-redundant prefixes (no "Student …" inside Student Insights, no
"Posts …" wording repeated), move all qualifying detail into the (unchanged)
description. Flag **keys are NOT renamed** — only display labels change.

| Key                       | New label                    | Old label (being replaced)                                                              |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| `notifications`           | Notifications                | Notifications                                                                           |
| `student-analytics-basic` | Analytics                    | Student Analytics                                                                       |
| `student-analytics`       | Analytics with Insight Buddy | Student Analytics with Insight buddy                                                    |
| `lta-intervention`        | LTA intervention             | Contextual Intelligence (Revision A: renamed so it doesn't duplicate its group heading) |
| `msf-uplift-data`         | MSF data                     | Student data from MSF via Uplift Office                                                 |
| `import-data`             | Import data                  | Import Data                                                                             |
| `export`                  | Export                       | Export                                                                                  |
| `date-range-filter`       | Date range filter            | Date range filter                                                                       |
| `attention-tag`           | Attention tags               | Attention tag                                                                           |
| `column-visibility`       | Show/hide columns            | Show/hide columns                                                                       |
| `overall-percentage`      | Overall %                    | Overall % across selected subjects                                                      |
| `social-links`            | Social links                 | Social links                                                                            |
| `primary-contact`         | Primary contact              | Primary contact                                                                         |
| `agency-reports`          | Agency reports               | Agency Reports                                                                          |
| `report-generation`       | Agency report generation     | Report Generation                                                                       |
| `posts`                   | Posts                        | Posts                                                                                   |
| `posts-admin-view`        | Posts admin view             | Posts — Admin view                                                                      |
| `forms`                   | Custom forms                 | Posts with Custom Forms                                                                 |
| `meetings`                | Meetings                     | Meetings                                                                                |
| `hdp-reports`             | HDP reports                  | HDP Reports                                                                             |
| `student-groups`          | Student groups               | Student Groups                                                                          |
| `calendar`                | Calendar                     | Calendar                                                                                |
| `reports`                 | Reports                      | Reports                                                                                 |
| `reports-admin-view`      | Reports admin view           | Reports — Admin view                                                                    |

Descriptions and stages are copied VERBATIM from `featureFlagConfigs` — they
keep the detail the shorter labels drop (e.g. "Overall %"'s description still
says "across selected subjects"; "Agency report generation"'s still opens with
"Agency reports only.").

Repo conventions to match: TypeScript strict-ish, kebab-case flag keys, `@/*`
path alias, Prettier + the repo eslint config. UI must reuse existing
primitives (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
`Label`, `Switch`, `Badge` from `src/components/ui/`) — the repo's
CLAUDE.md/AGENTS.md forbid new components; the grouped page is a re-render of
the existing row markup, not a new component.

## Commands you will need

| Purpose                    | Command                                 | Expected on success                                                                                                                                                                                                                                                      |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Typecheck                  | `bunx tsc --noEmit`                     | **82 pre-existing errors** at `9266c4f` (`bunx tsc --noEmit 2>&1 \| grep -c "error TS"` → 82). Gate = no NEW errors and none in touched files.                                                                                                                           |
| Tests                      | `bunx vitest run`                       | **98 pass / 24 fail** baseline. The 24 failures are pre-existing in `hdp-cycle-store.test.ts` + `imported-columns.test.ts` (known vitest/jsdom localStorage race — see plans/README.md Round 5/023 note). Gate = still 98 pass, same two failing files, no new failures. |
| Build                      | `bun run build`                         | exit 0                                                                                                                                                                                                                                                                   |
| Format (targeted)          | `bunx prettier --check <touched files>` | exit 0                                                                                                                                                                                                                                                                   |
| Lint (targeted)            | `bunx eslint <touched files>`           | no NEW errors vs baseline on the same files                                                                                                                                                                                                                              |
| Dev server (browser check) | `bun run dev`                           | serves on port 3000                                                                                                                                                                                                                                                      |

**Never run `bun run check`** — it is repo-wide `prettier --write .` and has
previously destroyed executor scope (see "Executor-tooling incident" in
`plans/README.md`). Targeted commands only.

## Scope

**In scope** (the only files you may modify):

- `src/lib/feature-flags/types.ts`
- `src/lib/feature-flags/constants.ts`
- `src/lib/feature-flags/context.tsx`
- `src/lib/feature-flags/index.ts`
- `src/routes/flags.tsx`
- `src/components/app-sidebar.tsx` — ONLY deleting the two `parents-gateway` lines (287, 341)
- `plans/README.md` — status row

**Out of scope** (do NOT touch, even though they look related):

- Any flag **default value** — every default stays exactly as in the excerpt above.
- Any other consumer of flags (`src/components/students/*`, routes, `app-header.tsx`, `src/hooks/use-feature-flag.ts`).
- The sidebar's own structure/items/groups — this plan changes how flags are _catalogued and displayed on `/flags`_, not the sidebar.
- The duplicated `stage` strings on sidebar `MenuItem`s — known duplication, deferred (see Maintenance notes).
- `src/routes/settings.tsx` and the `Switch`/`Card` primitives.

## Git workflow

- Branch: `advisor/027-feature-flag-registry`
- Commit style: conventional commits, e.g. `refactor(flags): single grouped flag registry; drop dead parents-gateway flag` (matches `git log` style like `fix(reports): …`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove the dead `parents-gateway` flag

1. `src/lib/feature-flags/types.ts` — delete the `| 'parents-gateway'` line from `FeatureFlagKey`.
2. `src/lib/feature-flags/constants.ts` — delete the `'parents-gateway': true,` line.
3. `src/components/app-sidebar.tsx` — delete line 287 (`const parentsGatewayEnabled = useFeatureFlag('parents-gateway')`) and line 341 (`if (item.featureFlag === 'parents-gateway') return parentsGatewayEnabled`). Nothing else in this file.

**Verify**: `grep -rn "parents-gateway\|parentsGateway" src/` → no matches.
**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82 (unchanged; if any error mentions `parents-gateway`, a consumer was missed — STOP).

### Step 2: Add the registry as the single source of truth

In `src/lib/feature-flags/types.ts`, add:

```ts
export type FeatureFlagModule =
  | 'student-insights'
  | 'contextual-intelligence'
  | 'reports'
  | 'communications'
  | 'manage'

export type FeatureFlagStage = 'Experiment' | 'Release 2' | 'Release 3'

export interface FeatureFlagMeta {
  label: string
  description: string
  stage: FeatureFlagStage
  module: FeatureFlagModule
  defaultValue: boolean
}
```

In `src/lib/feature-flags/constants.ts`:

1. Add `FEATURE_FLAG_REGISTRY: Record<FeatureFlagKey, FeatureFlagMeta>` — one
   entry per remaining key (24). For each entry:
   - `label`: the **new simplified label** from the canonical-labels table above.
   - `description`, `stage`: copied **verbatim** from the matching
     `featureFlagConfigs` entry in `src/routes/flags.tsx` (all 24 keys have one).
   - `module`: from the canonical assignment table above.
   - `defaultValue`: from the current `DEFAULT_FEATURE_FLAGS` excerpt above.
   - **Insertion order**: group by module in page order (general →
     student-insights → communications → manage), and within each module use
     the display order from the assignment table. The UI derives row order
     from registry insertion order.
2. Add the module display list:

```ts
export const FEATURE_FLAG_MODULES: Array<{
  id: FeatureFlagModule
  label: string
  description: string
}> = [
  {
    id: 'student-insights',
    label: 'Student Insights',
    description: 'Student list, profiles, and analytics',
  },
  {
    id: 'contextual-intelligence',
    label: 'Contextual Intelligence',
    description: 'Signals and external data about students',
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Holistic, agency, and school reports',
  },
  {
    id: 'communications',
    label: 'Communications',
    description: 'Posts, meetings, and notifications',
  },
  {
    id: 'manage',
    label: 'Manage',
    description: 'Planning and organisation tools',
  },
]
```

3. Replace the hand-written `DEFAULT_FEATURE_FLAGS` object with a derivation:

```ts
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.fromEntries(
  (Object.keys(FEATURE_FLAG_REGISTRY) as Array<FeatureFlagKey>).map((key) => [
    key,
    FEATURE_FLAG_REGISTRY[key].defaultValue,
  ]),
) as FeatureFlags
```

4. In `src/lib/feature-flags/index.ts`, extend the barrel:

```ts
export type {
  FeatureFlagKey,
  FeatureFlags,
  FeatureFlagMeta,
  FeatureFlagModule,
  FeatureFlagStage,
} from './types'
export {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAGS_STORAGE_KEY,
  FEATURE_FLAG_MODULES,
  FEATURE_FLAG_REGISTRY,
} from './constants'
```

The `Record<FeatureFlagKey, FeatureFlagMeta>` type makes the registry
exhaustive: adding a key to the union without a registry entry (or vice versa)
is a compile error — that is the point of this step.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.
**Verify**: `grep -c "defaultValue: true" src/lib/feature-flags/constants.ts` → 6 (posts, forms, notifications, hdp-reports, agency-reports, report-generation).

### Step 3: Drop stale localStorage keys on load

In `src/lib/feature-flags/context.tsx`, replace the merge inside `loadFlags()`
(current lines 24–27) so only known keys are read — a user who toggled
`parents-gateway` (or any future removed flag) has it in localStorage:

```ts
if (stored) {
  const parsed = JSON.parse(stored) as Partial<Record<string, boolean>>
  const merged: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS }
  for (const key of Object.keys(
    DEFAULT_FEATURE_FLAGS,
  ) as Array<FeatureFlagKey>) {
    const value = parsed[key]
    if (typeof value === 'boolean') merged[key] = value
  }
  return merged
}
```

Add `FeatureFlagKey` to the existing type-only import from `./types`. Nothing
else in the provider changes (the save-on-change effect will then persist the
cleaned object on the next toggle — no explicit migration needed).

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.

### Step 4: Render `/flags` grouped by module

Rewrite `src/routes/flags.tsx` to derive its data from the registry instead of
the local `featureFlagConfigs` array (delete that array and the
`FeatureFlagConfig` interface):

- Import `FEATURE_FLAG_MODULES`, `FEATURE_FLAG_REGISTRY` and the types from
  `@/lib/feature-flags`.
- Build the groups once at module scope:

```ts
const flagEntries = Object.entries(FEATURE_FLAG_REGISTRY) as Array<
  [FeatureFlagKey, FeatureFlagMeta]
>

const flagGroups = FEATURE_FLAG_MODULES.map((module) => ({
  ...module,
  flags: flagEntries.filter(([, meta]) => meta.module === module.id),
}))
```

- Render: keep the page wrapper (`<div className="mx-auto w-full max-w-2xl p-6">`)
  and add a page heading block above the cards (reuse the pattern from
  `settings.tsx:45-48`: an `h1` "Feature Flags" + the existing muted
  description sentence "Manage feature flags for this application. Changes are
  stored locally and persist across sessions."). Then render **one `Card` per
  module** (stacked with `space-y-6` or `flex flex-col gap-6`): `CardTitle` =
  module label, `CardDescription` = module description, `CardContent` =
  the existing per-flag row markup **unchanged** (Label + stage Badge with the
  same violet Experiment classes `border-violet-6 bg-violet-3 text-violet-11`,
  muted description `<p>`, `Switch` wired to `flags[key]` / `setFlag`).
- Skip rendering a module whose `flags` array is empty (defensive; all four
  are non-empty today).

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.
**Verify**: `grep -n "featureFlagConfigs" src/routes/flags.tsx` → no matches.

### Step 5: Full gates + browser check

1. `bunx vitest run` → 98 pass / 24 fail, failures confined to
   `hdp-cycle-store.test.ts` and `imported-columns.test.ts`.
2. `bun run build` → exit 0.
3. `bunx prettier --check src/lib/feature-flags/types.ts src/lib/feature-flags/constants.ts src/lib/feature-flags/context.tsx src/lib/feature-flags/index.ts src/routes/flags.tsx src/components/app-sidebar.tsx` → exit 0 (run `bunx prettier --write` on exactly these files first if needed).
4. `bunx eslint` on the same file list → no new errors vs running it on the same files at `9266c4f`.
5. Browser (use the agent-browser skill if available, otherwise report the
   check as not run): `bun run dev`, open `http://localhost:3000/flags` →
   five cards titled Student Insights / Contextual Intelligence / Reports /
   Communications / Manage, 24 switches total; toggle one flag off, reload →
   it stays off; open `/` → sidebar renders normally (Posts, Holistic
   Development Reports visible with default flags).

## Test plan

No new unit tests are required: the registry is static data whose consistency
is enforced by the `Record<FeatureFlagKey, FeatureFlagMeta>` type at compile
time, and the repo has no existing tests for the flag provider or routes. The
behavioral safety net is: existing test suite unchanged (98 pass), typecheck
error count unchanged (82), build green, plus the Step 5 browser check for
persistence and grouping. (Optional, only if trivially green: a
`constants.test.ts` asserting `DEFAULT_FEATURE_FLAGS` has 24 keys and 6 `true`
values, modeled on `src/lib/hdp-report-commit.test.ts` — do not add if it
drags in localStorage/jsdom setup.)

## Done criteria

ALL must hold:

- [ ] `grep -rn "parents-gateway\|parentsGateway" src/` → 0 matches
- [ ] `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82 (no new errors; none referencing touched files)
- [ ] `bunx vitest run` → 98 pass / 24 fail (same two pre-existing failing files, no new failures)
- [ ] `bun run build` → exit 0
- [ ] `grep -n "featureFlagConfigs" src/routes/flags.tsx` → 0 matches; `grep -c "FEATURE_FLAG_REGISTRY" src/lib/feature-flags/constants.ts` → ≥1
- [ ] `DEFAULT_FEATURE_FLAGS` is derived from the registry (no hand-written boolean object remains in `constants.ts`)
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `/flags` renders five module groups (browser check done or explicitly reported as skipped)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows any in-scope file changed since `9266c4f`, or the
  "Current state" excerpts don't match the live code.
- `grep -rn "parents-gateway" src/` returns any hit outside
  `src/lib/feature-flags/` and `app-sidebar.tsx:287,341` — the "dead flag"
  assumption is false.
- Removing the key or deriving `DEFAULT_FEATURE_FLAGS` produces ANY new
  `tsc` error you cannot attribute to a file in scope (means an unseen
  consumer exists).
- The vitest baseline differs from 98/24 **before you change anything** —
  the baseline has moved; re-baseline and note it, or stop if failures touch
  flag code.
- Matching a flags.tsx `label`/`description` to a key is ambiguous (it isn't
  today — every key has exactly one config entry).
- You feel the need to touch any sidebar menu item, any flag default, or any
  student-component consumer.

## Maintenance notes

- **Adding a flag** is now one registry entry (the type union in `types.ts`
  plus one `FEATURE_FLAG_REGISTRY` entry — the exhaustive `Record` makes
  forgetting either a compile error). Reviewers should reject PRs that add
  flag metadata anywhere else.
- **Removing a flag**: delete union member + registry entry + consumers; the
  Step 3 loader silently drops the stale localStorage key for existing users.
- **Known deferred duplication**: sidebar `MenuItem.stage` strings duplicate
  the registry's `stage` (e.g. 'Experiment' on HDP Reports). Deriving the
  sidebar badge from `FEATURE_FLAG_REGISTRY[item.featureFlag].stage` is a
  natural follow-up but touches sidebar rendering for items with no flag —
  intentionally out of scope here.
- **Reviewer scrutiny points**: (1) diff the 24 description/stage strings
  against the deleted `featureFlagConfigs` — they must be verbatim — and the
  24 labels against the canonical-labels table — they must match exactly;
  (2) confirm the 6 `defaultValue: true` flags match the old defaults object;
  (3) confirm `app-sidebar.tsx` diff is exactly −2 lines.
- **Deliberately NOT done — flag consolidation**: the flag _set_ was left
  intact. Candidate merges exist (`student-analytics` vs
  `student-analytics-basic` are mutually exclusive variants;
  `report-generation` is a sub-flag of `agency-reports`; `forms` is a
  sub-feature of `posts`; the two `*-admin-view` flags shadow their parents),
  but merging changes which behavior combinations are toggleable — a product
  decision, not a cleanup. If the maintainer wants a smaller flag set, that is
  a separate plan.
- The copy nit recorded in plans/README.md Round 6 ("Turn on HDP Report
  Builder" off-state copy) is unrelated to this plan — don't fix it here.
