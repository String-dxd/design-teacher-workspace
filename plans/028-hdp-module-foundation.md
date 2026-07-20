# Plan 028: HDP Reports module foundation — flags, types, fixtures, store, and the new Reports home

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9266c4f..HEAD -- src/routes/reports.index.tsx src/components/app-sidebar.tsx src/lib/feature-flags/ src/routes/__root.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED (touches the flag registry, sidebar, and the `/reports` index route)
- **Depends on**: none
- **Category**: direction (new feature)
- **Planned at**: commit `9266c4f`, 2026-07-16

## Why this matters

The Reports tab is being replaced by a new HDP (Holistic Development Profile)
Reports module specified in the PRD (see "Design constraints" below): teachers
capture voluntary, in-the-moment observations ("tags") of students; the module
consolidates them per student, diagnoses coverage gaps, and turns them into
evidence-grounded report comments. This plan lays the foundation every later plan
builds on: the feature flags, the domain types, the mock data, the localStorage
store, and the new Reports home that takes over `/reports` when the flag is on.
The old cycle hub must keep working, unchanged, whenever the flag is off — that is
an explicit maintainer decision (rollback safety).

The approved design plan and its grill record live in
`docs/decisions/reports-hdp.md`. The domain vocabulary lives in `CONTEXT.md`
(root) — use those exact terms in identifiers, copy, and comments.

## Design constraints (binding for all HDP plans, 028–033)

- **Vocabulary** (`CONTEXT.md`): _tag_ (one observation: disposition + optional
  ≤140-char note + context), _disposition_ (Perseverance, Curiosity,
  Collaboration, Self-direction — fixed set of 4), _tag context_ (lesson, marking,
  cca, form-time, other), _river_ (per-student stream of all teachers' tags),
  _cycle_ (one semester: Sem 1 = Terms 1–2, Sem 2 = Terms 3–4), _reviewed_ (≥1
  active tag OR an explicit nil this term — never say "covered" in UI copy),
  _Reports_ (the module's UI name — never "HDP" in any user-facing string).
- **Tokens**: no raw hex/rgb/hsl anywhere; semantic Tailwind tokens and the
  registered Radix scales only. The module's accent is `--primary` (Teacher &
  School Blue) — used via `bg-primary`, `text-primary`, etc.
- **Typography**: Inter via existing app setup; smallest text 11px (`text-[11px]`
  is NOT allowed — use the existing `text-xs` = 12px, or 11px only if an on-scale
  utility exists); never uppercase (`uppercase` class banned); no mono font for
  labels. Numbers that align use `tabular-nums`.
- **Anti-slop**: no nested cards (a card-styled container inside another); no
  purple/violet gradients; no bounce easing; cards only for interactive units.
- **A11y**: every field has a visible associated label; icon-only buttons carry
  `aria-label`; toggle chips are `<button aria-pressed>`; motion ≤300ms with
  standard easing and disabled under `prefers-reduced-motion` (Tailwind
  `motion-reduce:` variants); status changes announced via the sonner toaster
  (already a polite live region), never by stealing focus.
- **No `dangerouslySetInnerHTML`** anywhere under `src/components/hdp/` or the
  new routes. User-authored content renders as text nodes.
- **Coverage is a diagnostic, not a KPI**: no celebratory motion near coverage
  numbers, percentages never larger than meta text, and coverage renders only for
  the current teacher's own form class.
- **No nagging (P1)**: nothing in the module badges, pulses, or reminds a teacher
  to tag. Zero-tag teachers see calm empty states, no guilt copy.

## Current state

- `src/routes/reports.index.tsx` — the legacy Reports page. Route declaration
  (lines 100–112):

  ```tsx
  export const Route = createFileRoute('/reports/')({
    component: ReportsPage,
    validateSearch: (search: Record<string, unknown>): ReportsSearchParams => {
    ...
  function ReportsPage() {
  ```

  `ReportsPage` reads `useFeatureFlag('hdp-reports')` at line 145 and branches
  internally between a legacy table and the cycle hub. Do not modify anything in
  this file except the `component:` wiring described in Step 6.

- `src/lib/feature-flags/types.ts` — `FeatureFlagKey` union (24 keys, lines 1–25,
  includes `'hdp-reports'`, `'reports'`, `'reports-admin-view'`),
  `FeatureFlagStage = 'Experiment' | 'Release 2' | 'Release 3'`, meta interface
  with `{ label, description, stage, module, defaultValue }`.
- `src/lib/feature-flags/constants.ts` — `FEATURE_FLAG_REGISTRY: Record<FeatureFlagKey, FeatureFlagMeta>`
  (line 42), modules array at line 10 (module id `'reports'` exists, line 26).
  Existing entry shape (lines 43–50):

  ```ts
  'student-analytics-basic': {
    label: 'Analytics',
    description: 'Show Analytics and Profiles pages in the sidebar — ...',
    stage: 'Experiment',
    module: 'student-insights',
    defaultValue: false,
  },
  ```

- `src/components/app-sidebar.tsx` — menu items are plain arrays. "Reports"
  (flag `reports`) and "Reports (Admin)" (flag `reports-admin-view`) at lines
  146–162; a legacy item "Holistic Development Reports" (flag `hdp-reports`,
  url `/reports`) sits in `parentsCommItems` at lines 190–196. Flag reads at
  lines 285–297 (`const hdpReportsEnabled = useFeatureFlag('hdp-reports')` line
  286); `filterItems` maps flag → bool at lines 335–348, e.g. line 339:
  `if (item.featureFlag === 'hdp-reports') return hdpReportsEnabled`.
- `src/routes/__root.tsx` — authenticated shell (second `return`, lines 168–199):
  `<AppSidebar />` + `<SidebarInset>` … `<HeyTaliaPanel />` +
  `<Toaster position="bottom-right" />` (line 190) inside `SidebarProvider`.
- `src/lib/hdp-cycle-store.ts` — the localStorage pattern to model the new store
  on (defensive JSON parse, `typeof window === 'undefined'` guard, lines 62–70).
  Leave this file untouched — it belongs to the legacy hub.
- `src/data/mock-students.ts` — app-wide student data. Class `'3A'` has **14**
  students (corrected 2026-07-16 after an executor STOP — the original "26"
  was a plan-authoring error; 4B/4C/4D have 17 each but 3A is kept for fixture
  coherence). Exposes `mockStudents`, `getStudentById`, `getSchoolLevel`.
  Note: mock-staff gives Mrs Lee Su Yin `formClass: '1A'`; the fixture's
  `formClassId: '3A'` override is deliberate and authorized.
- `src/data/mock-staff.ts` — 48 staff entries with `id`/`name` (e.g.
  `'Mrs Lee Su Yin'`, `'Mr Goh Wei Ting'`, `'Ms Anitha Kumar'`, `'Mr Vijay Raj'`).
- `src/components/empty-state.tsx` — reusable `EmptyState({ title, description,
icon?, action? })`. Reuse it; do not build a new empty-state component.
- Off-state convention for flag-gated routes —
  `src/routes/reports.cycle.write.$studentId.tsx:259-274`:

  ```tsx
  if (!builderEnabled) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Report Builder is off</h1>
        <p className="text-muted-foreground text-sm">
          Turn on “HDP Report Builder” to use this page.
        </p>
        <Link
          to="/flags"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Open feature flags
        </Link>
      </main>
    )
  }
  ```

- Breadcrumbs: pages call `useSetBreadcrumbs([{ label: 'Reports', href: '/reports' }])`
  (see `reports.index.tsx:143`). There is no PageHeader component — pages compose
  their own `<main>` with Tailwind.
- Known pre-existing issue, out of scope: `student-profile.tsx:459` and
  `holistic-reports.$id.tsx:169,182` link to `/reports/$id`, which has no route
  file. Do not "fix" this.

## Commands you will need

| Purpose   | Command                                        | Expected on success                                                                                                                   |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Install   | `bun install`                                  | exit 0                                                                                                                                |
| Typecheck | `bunx tsc --noEmit 2>&1 \| grep -c "error TS"` | **82** (baseline; no new errors)                                                                                                      |
| Tests     | `bunx vitest run`                              | ≥98 pass / 24 fail (the 24 are pre-existing: `hdp-cycle-store.test.ts`, `imported-columns.test.ts` — a known jsdom/localStorage race) |
| Build     | `bun run build`                                | exit 0                                                                                                                                |
| Format    | `bunx prettier --check <changed files>`        | exit 0                                                                                                                                |
| Lint      | `bunx eslint <changed files>`                  | 0 new errors                                                                                                                          |

NEVER run `bun run check` — it is a repo-wide `prettier --write .` and has
destroyed unrelated files in past executor runs. Format/lint only the files you
touched.

## Scope

**In scope** (the only files you may create or modify):

- `src/lib/feature-flags/types.ts` (add 2 keys)
- `src/lib/feature-flags/constants.ts` (add 2 registry entries)
- `src/components/app-sidebar.tsx` (1 menu item + 2 lines in flag wiring)
- `src/routes/reports.index.tsx` (component wiring only, Step 6)
- `src/routes/__root.tsx` (mount `HdpShell`, Step 7)
- `src/types/hdp.ts` (create)
- `src/data/hdp.ts` (create)
- `src/data/timetable.ts` (create)
- `src/lib/hdp-store.ts` (create)
- `src/lib/hdp-store.test.ts` (create)
- `src/components/hdp/reports-home.tsx`, `src/components/hdp/cycle-stages.tsx`,
  `src/components/hdp/tool-card.tsx`, `src/components/hdp/coverage-bar.tsx`,
  `src/components/hdp/hdp-shell.tsx` (create)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):

- Everything else in `src/routes/reports.*` and `src/components/reports/` — the
  legacy hub keeps working unchanged behind `hdp-reports`.
- `src/lib/hdp-cycle-store.ts`, `hdp-report-commit.ts`, `hdp-comment-draft.ts`,
  `hdp-template-store.ts`, `hdp-notifications.ts` — legacy stores.
- `src/data/mock-reports.ts`, `mock-report-classes.ts`, `mock-cockpit-submissions.ts`,
  `report-layouts.ts` — legacy data (holistic-reports depends on them).
- `holistic-reports.*` routes, `students_.$id.agency-report.new.tsx`.
- The Tag Queue overlay/FAB internals — that is plan 029; this plan only creates
  the shell mount point.

## Git workflow

- Branch: `advisor/028-hdp-foundation` (from current main)
- Commit per step or logical unit; imperative messages in the repo's style, e.g.
  `feat(hdp): flag registry + domain types for the Reports module`
- Do NOT push or open a PR.

## Steps

### Step 1: Register the two feature flags

In `src/lib/feature-flags/types.ts`, add to `FeatureFlagKey`:
`'reports-hdp'` and `'reports-river-visibility'`.

In `src/lib/feature-flags/constants.ts`, add to `FEATURE_FLAG_REGISTRY`
(module `'reports'`, matching the existing entry shape exactly):

```ts
'reports-hdp': {
  label: 'HDP Reports module',
  description:
    'Replace the Reports tab with the new HDP module — ambient tagging, per-student river, coverage broadcast, and in-flow drafting. Turning it off restores the current Reports page.',
  stage: 'Experiment',
  module: 'reports',
  defaultValue: false,
},
'reports-river-visibility': {
  label: 'Full river for subject teachers',
  description:
    'Show subject teachers the full observation river for a student instead of their own tags plus confirmed threads only. Open research question — default off.',
  stage: 'Experiment',
  module: 'reports',
  defaultValue: false,
},
```

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82 (the
`Record<FeatureFlagKey, …>` type forces both entries — a missing one is a compile
error). Visit `/flags` later in Step 8's browser check.

### Step 2: Create `src/types/hdp.ts`

Create the domain types. Copy this shape exactly (it is the PRD §7 data model,
plus the A1 report-book shapes resolved at the plan gate):

```ts
export type DispositionId =
  | 'perseverance'
  | 'curiosity'
  | 'collaboration'
  | 'self-direction'
export type TagContext = 'lesson' | 'marking' | 'cca' | 'form-time' | 'other'
export type SchoolYear = `${number}`
export type HdpTerm = 1 | 2 | 3 | 4
export type Semester = 1 | 2
export type CycleStage =
  | 'observing'
  | 'window-open'
  | 'drafting'
  | 'review'
  | 'released'
export type TagEntryPoint = 'fab' | 'topbar' | 'row' | 'cmdk' // cmdk reserved, unused this round

export interface HdpTag {
  id: string
  studentId: string
  authorId: string
  disposition: DispositionId
  context: TagContext
  note?: string // ≤140 chars, enforced at the composer
  evidenceIds: Array<string>
  source: 'self' | 'broadcast'
  entryPoint: TagEntryPoint
  schoolYear: SchoolYear
  term: HdpTerm
  lifecycle: 'active' | 'archived' | 'retired-by-student'
  createdAt: string
  editableUntil: string // createdAt + 24h
}

export interface FormingPattern {
  id: string
  studentId: string
  disposition: DispositionId
  contexts: Array<TagContext> // ≥2 distinct
  tagIds: Array<string>
  status: 'candidate' | 'confirmed' | 'dismissed' | 'retired-by-student'
  confirmedBy?: string
  schoolYear: SchoolYear
}

export interface BroadcastRequest {
  id: string
  formClassId: string
  requesterId: string
  studentIds: Array<string>
  recipientIds: Array<string>
  message: string
  createdAt: string
  responses: Array<BroadcastResponse>
}

export interface BroadcastResponse {
  recipientId: string
  studentId: string
  result: { kind: 'tag'; tagId: string } | { kind: 'nothing-stood-out' }
  respondedAt: string
}

export interface DraftClaim {
  text: string
  source?: { tagId: string; label: string } // absent ⇒ rendered "your addition"
  edited?: boolean // teacher edited a sourced sentence — popover notes it (plan 032)
}

export interface HdpDraft {
  id: string
  studentId: string
  kind: 'subject' | 'overall'
  subject?: string // set when kind === 'subject'
  authorId: string
  claims: Array<DraftClaim>
  status: 'draft' | 'confirmed'
  syncedAt?: string // set by Review & Sync (plan 032)
}

export interface CoverageSnapshot {
  classId: string
  total: number
  covered: number // ≥1 active tag OR explicit nil this term — UI copy says "reviewed"
  reviewedNil: number
}

// ── A1 parent-facing report book (fresh fixtures, no legacy imports) ──
export interface HdpSubjectResult {
  subject: string
  term: HdpTerm
  grade: string // realistic format, e.g. 'B4', '72'
  remark?: string
}

export interface HdpReportBook {
  studentId: string
  schoolYear: SchoolYear
  semester: Semester
  results: Array<HdpSubjectResult>
  attendance: { present: number; total: number }
  conduct: string
  overallComment?: { claims: Array<DraftClaim>; authorId: string }
  subjectComments: Array<{
    subject: string
    authorId: string
    claims: Array<DraftClaim>
  }>
  parentPrompts: Array<string> // "ask me about…"
  sharedAt?: string // set when shared with parents (plan 033)
  acknowledgement?: { at: string; note?: string }
}

export interface HdpCycle {
  schoolYear: SchoolYear
  semester: Semester
  terms: [HdpTerm, HdpTerm]
  stage: CycleStage
  windowOpensAt: string
  releaseAt: string
}
```

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.

### Step 3: Create the fixtures — `src/data/hdp.ts` and `src/data/timetable.ts`

`src/data/hdp.ts` (import types from `@/types/hdp`; import student ids from
`@/data/mock-students` by filtering `mockStudents` to `class === '3A'`; import
staff from `@/data/mock-staff`):

- `export const CURRENT_TEACHER` — pick the mock-staff entry for `'Mrs Lee Su Yin'`
  (form teacher of 3A) and export `{ id, name, formClassId: '3A', teachingClasses: ['3B', '4A'] }`.
- `export const HDP_COLLEAGUES` — 3 more staff entries (e.g. Mr Goh Wei Ting,
  Ms Anitha Kumar, Mr Vijay Raj) with the classes they teach.
- `export const CURRENT_CYCLE: HdpCycle` — `{ schoolYear: '2026', semester: 2,
terms: [3, 4], stage: 'window-open', windowOpensAt: '2026-07-13T00:00:00+08:00',
releaseAt: '2026-11-13T00:00:00+08:00' }`. (Window already open so the Draft
  Studio is demoable; Release tools stay "coming later".)
- `export const SEED_TAGS: Array<HdpTag>` — ~70 tags across the 14 students of
  3A plus a handful in 3B/4A, authored by the 4 teachers across mixed contexts
  and entry points, terms 3 (mostly) and some term-1/2 archived ones. Leave
  exactly **6 students of 3A with zero tags** (the thin records). Notes are short,
  behaviour-in-context, never trait language ("returned to failed problems",
  never "is resilient").
- `export const SEED_PATTERNS: Array<FormingPattern>` — 2 candidates (same
  disposition, ≥2 distinct contexts, real tagIds from SEED_TAGS).
- `export const SEED_BROADCAST: BroadcastRequest` — one prior broadcast with mixed
  responses including ≥2 `nothing-stood-out` nils.
- `export const SEED_REPORT_BOOKS: Array<HdpReportBook>` — books for 3 students of
  3A (results for terms 3–4 in realistic formats, attendance, conduct, 2–3
  parent prompts each).
- **Stage the funnel** (UX grill decision, 2026-07-16 — every surface must demo
  cold, while the live demo walks ONE fresh student end-to-end):
  - Most 3A students: tags only (as above), incl. the 6 thin records.
  - **Student A** (one of the 3 with a report book): `export const SEED_DRAFTS:
Array<HdpDraft>` containing one CONFIRMED, unsynced (`syncedAt` absent)
    `overall` draft for them — 2–3 claims whose `source.tagId`s are real
    SEED_TAGS ids, plus one sourceless "your addition" claim. Their book's
    comments stay empty (not yet shared). This makes Review & Sync populated
    from first load.
  - **Student B** (another of the 3): book pre-shared AND acknowledged —
    comments filled from a second confirmed+synced seed draft (snapshotted into
    the book), `sharedAt` set, `acknowledgement: { at, note }` with a short
    parent note addressed to the child. Their guest link
    (`/hdp-report/hdp-{studentId}`, plan 033's token convention) demos the
    completed parent state cold.
  - **Student C** (the third): book present, comments empty, no draft — the
    fresh student the live demo carries through the whole funnel.
- All dates in ISO with `+08:00`; content faithful to Singapore secondary
  schooling (subjects: English, Mathematics, Science, Mother Tongue, Humanities…).
  Mark clearly illustrative values with realistic formats.

`src/data/timetable.ts`:

```ts
// Which teachers are timetabled to which students (mock). Used by broadcast
// recipient resolution (plan 031) and Tag Queue search scoping (plan 029).
export interface TimetableEntry {
  teacherId: string
  classId: string
  subject: string
}
export const TIMETABLE: Array<TimetableEntry> = [
  /* the 4 seeded teachers × their classes */
]
export function teachersForStudents(studentIds: Array<string>): Array<string> {
  /* union via class membership from mock-students */
}
export function classesForTeacher(teacherId: string): Array<string> {
  /* … */
}
```

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.

### Step 4: Create `src/lib/hdp-store.ts` + tests

Model the file header and defensive-load style on `src/lib/hdp-cycle-store.ts`
(lines 62–70: `typeof window === 'undefined'` guard, try/JSON.parse/shape-check).
One store for the whole module, localStorage-backed, seeded from `src/data/hdp.ts`
on first load:

- Keys: `hdp_tags`, `hdp_patterns`, `hdp_broadcasts`, `hdp_drafts`,
  `hdp_report_books`, `hdp_analytics` (single-key JSON arrays; include a
  `seedIfEmpty()` that merges SEED\_\* data in when a key is absent).
- API (all pure load/save + derivation helpers, no React):
  `loadTags()`, `addTag(input): HdpTag` (stamps `createdAt`, `editableUntil` =
  +24h, `schoolYear`/`term` from `CURRENT_CYCLE`), `updateTag(id, patch)` /
  `deleteTag(id)` (both must throw if `Date.now() > editableUntil`),
  `tagsForStudent(studentId)`, `tagsByAuthor(authorId)`,
  `detectFormingPatterns(studentId): Array<FormingPattern>` (same disposition in
  ≥2 distinct contexts among active tags, current school year; merge with stored
  confirmed/dismissed statuses), `coverageForClass(classId): CoverageSnapshot`
  (covered = students with ≥1 active tag this term OR a nil response),
  `loadBroadcasts()/saveBroadcast()`, `loadDrafts()/saveDraft()`,
  `loadReportBooks()/saveReportBook()`,
  `logEvent(name, payload)` → appends `{ name, at, ...payload }` to `hdp_analytics`.
- SSR safety: every function short-circuits when `typeof window === 'undefined'`.
  NEVER call these during render — routes read them in `useEffect`/event handlers
  (the repo's plan-018 hydration rule).

`src/lib/hdp-store.test.ts` — see Test plan. IMPORTANT: stub localStorage with a
test-local MemoryStorage exactly as `src/lib/draft-storage.test.ts` does — the
repo has a known jsdom race when tests touch real `globalThis.localStorage`.

**Verify**: `bunx vitest run src/lib/hdp-store.test.ts` → all new tests pass.
`bunx vitest run` → ≥98+N pass / 24 fail (no new failures).

### Step 5: Build the Reports home — `src/components/hdp/`

Create four presentational components plus the home:

- `cycle-stages.tsx` — `CycleStages({ stage })`: a horizontal row of the five
  stage labels (Observing, Window open, Drafting, Review, Released) as plain
  text; the current one in `text-primary font-medium`, the rest
  `text-muted-foreground`; NO connective line, NO checkmarks, NO progress bar
  (explicitly not a stepper). Semantic: `<ol aria-label="Reporting cycle">` with
  `aria-current="step"` on the active item.
- `coverage-bar.tsx` — `CoverageBar({ snapshot })`: label
  `"{covered} of {total} reviewed"` (+ `· {n} with nothing noted yet` when
  `reviewedNil > 0`) in `text-sm tabular-nums`, an 8px track (`h-2 rounded-full
bg-muted`) with a `bg-primary` fill sized by fraction; no percentage text, no
  axis. Render as a plain `<div>` — not a card.
- `tool-card.tsx` — `ToolCard({ icon, name, description, state, href, locked })`:
  a `<Link>` card (border, radius, background — interactive, so a card is
  legitimate); icon left, name `text-sm font-medium`, description
  `text-sm text-muted-foreground`, and a state line `text-xs text-muted-foreground`
  (e.g. "Opens when the reporting window opens", "Coming later"). Locked cards
  keep full opacity and render `aria-disabled="true"` + no navigation (render a
  `<div role="link" aria-disabled>` instead of Link) — locked ≠ dimmed, locked ≠
  hidden. Hover: border-color shift only (no scale/shadow bloom).
- `reports-home.tsx` — `HdpReportsHome()`: `useSetBreadcrumbs([{ label:
'Reports', href: '/reports' }])`; `<main>` with an `h1` "Reports", the
  semester + window dates line, `CycleStages`, then (form teacher only — current
  user IS the form teacher of 3A, so it renders) a "My class" block with
  `CoverageBar` for 3A + a link "Review gaps" → `/reports/broadcast`; then three
  labelled groups (`h2`s: "Capture", "Draft", "Release") of ToolCards:

  | Tool                 | href                                                                                                                                                                                               | state                                                                                                                                                                                                           |
  | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Tag Queue            | `/reports/tag`                                                                                                                                                                                     | Always available                                                                                                                                                                                                |
  | Term Summary         | `/reports/summary`                                                                                                                                                                                 | Always available                                                                                                                                                                                                |
  | Students             | `/reports/students/$firstStudentId` (link to the class list view built in plan 030 — until then point at `/reports/summary` and mark state "Available with Term Summary"; plan 030 fixes the href) | Always available                                                                                                                                                                                                |
  | Coverage & Broadcast | `/reports/broadcast`                                                                                                                                                                               | Always available                                                                                                                                                                                                |
  | Draft Studio         | `/reports/drafts`                                                                                                                                                                                  | "Open — reporting window is open" (derive from `CURRENT_CYCLE.stage`)                                                                                                                                           |
  | Review & Sync        | `/reports/review`                                                                                                                                                                                  | "Locked until drafts exist" (derive from `loadDrafts()` in an effect — with the staged seeds a confirmed draft exists, so this renders live/available from first load; keep the derivation for a cleared store) |
  | Release Manager      | —                                                                                                                                                                                                  | locked, "Coming later"                                                                                                                                                                                          |
  | Renderings Preview   | —                                                                                                                                                                                                  | locked, "Coming later"                                                                                                                                                                                          |

  Layout: groups stack vertically; cards in a responsive grid
  (`grid gap-3 sm:grid-cols-2 lg:grid-cols-3`) that reflows to one column at
  narrow widths. Coverage numbers derive in a `useEffect` (store read), with a
  deterministic SSR-safe initial render (render the bar only after mount, via a
  `mounted` state — no hydration mismatch).

- `hdp-shell.tsx` — `HdpShell()`: for now returns `null` unless
  `useFeatureFlag('reports-hdp')`; renders a `React.Fragment` placeholder where
  plan 029 will mount the FAB + overlay provider. Keep it so `__root.tsx` is
  touched once, in this plan only.

Routes for the tools do not exist yet (plans 029–033). Cards pointing at
not-yet-existing routes must NOT link there in this plan — give Draft Studio,
Review & Sync the locked/`aria-disabled` rendering with their real state lines,
and Tag Queue / Term Summary / Coverage & Broadcast the same until their plans
land, EXCEPT: to keep this plan self-contained and the home honest, render every
not-yet-built tool as locked with state "Coming in this prototype" — plans
029–033 each flip their own card to a live Link. Note this in the code with one
comment per card.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82;
`bunx prettier --check src/components/hdp/*.tsx` → exit 0.

### Step 6: Wire the `/reports` takeover

In `src/routes/reports.index.tsx`, change ONLY the route wiring (keep
`validateSearch` and everything else byte-identical):

```tsx
// before
export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
  ...
// after
export const Route = createFileRoute('/reports/')({
  component: ReportsIndexSwitch,
  ...
```

and add, near `ReportsPage`:

```tsx
function ReportsIndexSwitch() {
  const hdpModuleEnabled = useFeatureFlag('reports-hdp')
  if (hdpModuleEnabled) return <HdpReportsHome />
  return <ReportsPage />
}
```

with `import { HdpReportsHome } from '@/components/hdp/reports-home'`.
This is hook-safe (the flag hook runs unconditionally; `ReportsPage`'s own hooks
run only when it renders).

In `src/components/app-sidebar.tsx`:

1. Add a flag read next to line 286: `const reportsHdpEnabled = useFeatureFlag('reports-hdp')`.
2. Add a menu item to the array that ends at line 163 (after "Reports (Admin)"):
   `{ title: 'Reports', url: '/reports', icon: FileText, stage: 'Experiment', featureFlag: 'reports-hdp' }`.
3. In `filterItems` (lines 335–348): add
   `if (item.featureFlag === 'reports-hdp') return reportsHdpEnabled` and change
   the `hdp-reports` line to
   `if (item.featureFlag === 'hdp-reports') return hdpReportsEnabled && !reportsHdpEnabled`
   (hide the legacy "Holistic Development Reports" item while the new module owns
   `/reports`).

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82. Browser check in
Step 8.

### Step 7: Mount the shell in `__root.tsx`

In the authenticated `return` (lines 168–199), add `<HdpShell />` as a sibling
immediately before `<Toaster position="bottom-right" />`, with the import at the
top. Touch nothing else in the file. (Plan 029 gives HdpShell its real content
and adjusts the toaster offset.)

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82;
`bun run build` → exit 0.

### Step 8: Browser smoke check

`bun run dev` (port 3000), then verify by hand (or with the agent-browser CLI if
available):

1. `/flags` shows the two new flags under the Reports module card, both off.
2. `/reports` with `reports-hdp` OFF → the legacy page renders exactly as before
   (compare against a screenshot taken on main before your changes).
3. Toggle `reports-hdp` ON in `/flags` → `/reports` renders the new home: h1
   "Reports", five cycle stages with "Window open" accented, an "8 of 14
   reviewed" coverage line for 3A, three groups, eight tool cards, all
   locked with honest state lines, none hidden.
4. Sidebar shows one "Reports" item for the new module; the legacy "Holistic
   Development Reports" item is gone while the flag is on, back when off.
5. Keyboard: tab through the home — every card focusable or properly
   `aria-disabled`; nothing uppercase; no console errors or hydration warnings.

**Verify**: all five hold. Screenshot the ON state to
`docs/decisions/assets/028-reports-home.png` if the capture tool is available
(skip silently otherwise).

## Test plan

New file `src/lib/hdp-store.test.ts`, modelled structurally on
`src/lib/draft-storage.test.ts` (its MemoryStorage stub is mandatory — copy the
pattern):

1. `addTag` stamps `schoolYear: '2026'`, `term: 3`, and `editableUntil` =
   createdAt + 24h.
2. `updateTag`/`deleteTag` succeed inside 24h and throw after (mock `Date.now`).
3. `detectFormingPatterns` returns a candidate only for ≥2 _distinct_ contexts
   (same-context repeats do NOT form a pattern), and respects a stored
   `dismissed` status.
4. `coverageForClass('3A')` counts a student with only a nil response as
   covered, and a zero-tag/zero-nil student as not covered; seeded value = 8 of
   14 covered.
5. `seedIfEmpty` is idempotent (second call adds nothing).
6. `logEvent` appends with a timestamp.

`bunx vitest run src/lib/hdp-store.test.ts` → 6+ tests pass.

## Done criteria

ALL must hold:

- [ ] `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82
- [ ] `bunx vitest run` → 24 failed (unchanged) and ≥104 passed
- [ ] `bun run build` → exit 0
- [ ] `grep -rn "dangerouslySetInnerHTML\|uppercase\|#[0-9a-fA-F]\{6\}" src/components/hdp src/types/hdp.ts src/data/hdp.ts src/data/timetable.ts src/lib/hdp-store.ts` → no matches
- [ ] `grep -rn "mock-reports\|report-layouts\|hdp-cycle-store" src/components/hdp src/data/hdp.ts src/lib/hdp-store.ts` → no matches (zero legacy imports)
- [ ] With `reports-hdp` off, `git diff` shows `reports.index.tsx` changed only in the Route `component:` line + the added `ReportsIndexSwitch` and import
- [ ] Browser checks 1–5 in Step 8 pass
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift since `9266c4f`).
- Adding the flag keys produces type errors anywhere OTHER than the registry
  (that would mean some consumer exhaustively switches on `FeatureFlagKey`).
- `ReportsPage` cannot be wrapped without moving its hooks (i.e. the component
  isn't cleanly callable from a switch component).
- The vitest baseline shows failures outside `hdp-cycle-store.test.ts` /
  `imported-columns.test.ts` before you start.
- You need to modify any file on the out-of-scope list.

## Maintenance notes

- Plans 029–033 each flip one or more locked ToolCards to live links — the cards
  carry a one-line comment naming their plan.
- The `hdp-reports` sidebar suppression (`&& !reportsHdpEnabled`) is temporary
  scaffolding; the eventual legacy-teardown plan removes it.
- `CoverageSnapshot.covered` counts _reviewed_ students (tag OR nil) — if a
  richer "record depth" diagnostic is ever added, keep the UI word "reviewed"
  (see CONTEXT.md) and P7: no leadership or cross-class coverage view, ever.
- Reviewer scrutiny: the `reports.index.tsx` diff (must be minimal), SSR safety
  of store reads (effects only), and that no fixture note uses trait language.
