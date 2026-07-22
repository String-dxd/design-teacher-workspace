# Plan 045: Shared flag-gate + not-found guards for the HDP Reports routes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. On
> any STOP condition, stop and report — do not improvise. When done, update
> this plan's row in `plans/README.md` — unless a reviewer dispatched you and
> told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 41c5962..HEAD -- src/routes/reports.index.tsx src/routes/reports.tag.tsx 'src/routes/reports.students.$studentId.tsx' 'src/routes/reports.drafts.$studentId.tsx' src/components/hdp/hdp-shell.tsx`
> On drift vs the excerpts below, STOP.
>
> **NEVER run `bun run check`.** Targeted `bunx prettier --check <file>` /
> `bunx eslint <file>` only.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (independent of 043 — the gate reads
  `useFeatureFlag('reports-hdp')` either way)
- **Category**: tech-debt
- **Planned at**: commit `41c5962`, 2026-07-19

## Why this matters

Four HDP route files carry a verbatim copy of the same "Reports is off"
screen (heading, explainer, link to `/flags`), and two of them additionally
duplicate a "Student not found" fallback. Any copy or affordance change is a
four-file lockstep edit. The repo's own `AGENTS.md` (§"When it IS appropriate
to create a new component") explicitly sanctions "extracting repeated inline
JSX from multiple routes into a shared component (consolidation, not
creation)". This plan extracts one gate component with byte-identical output.

## Current state

The duplicated block (verified identical across all four, modulo the `Link`
formatting):

```tsx
// src/routes/reports.index.tsx:46-57 (also reports.tag.tsx:23, reports.students.$studentId.tsx:33, reports.drafts.$studentId.tsx:38)
<main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
  <h1 className="text-xl font-semibold">Reports is off</h1>
  <p className="text-muted-foreground text-sm">
    Turn on “HDP Reports module” to use this page.
  </p>
  <Link to="/flags" className={cn(buttonVariants({ variant: 'outline' }))}>
    Open feature flags
  </Link>
</main>
```

Each route reads `const enabled = useFeatureFlag('reports-hdp')` (import from
`@/hooks/use-feature-flag`) and early-returns the block when off.
`reports.students.$studentId.tsx` and `reports.drafts.$studentId.tsx` also
each render their own "Student not found" `<main>` block when the
`$studentId` param resolves to no student — open both files and diff the two
blocks before extracting (they are near-identical; if they differ
meaningfully, keep them separate and extract only the flag gate).

Shared HDP chrome already lives in `src/components/hdp/hdp-shell.tsx`
(mounts the TagFab/queue overlay; reads `reports-hdp` at line 19) — the new
gate belongs in this file or next to it, matching the module's flat
`src/components/hdp/` layout. Components in that directory are plain named
exports, kebab-case filenames.

## Commands you will need

| Purpose   | Command             | Expected                                                                       |
| --------- | ------------------- | ------------------------------------------------------------------------------ |
| Typecheck | `bunx tsc --noEmit` | 76 baseline errors, 0 new                                                      |
| Tests     | `bunx vitest run`   | 190 pass / 6 fail baseline (flaky `imported-columns.test.ts`); no new failures |
| Build     | `bun run build`     | exit 0                                                                         |

## Scope

**In scope**:

- `src/components/hdp/hdp-shell.tsx` (add the exported gate component here —
  do NOT create a new file; extending an existing shared module is the
  repo-preferred move)
- `src/routes/reports.index.tsx`
- `src/routes/reports.tag.tsx`
- `src/routes/reports.students.$studentId.tsx`
- `src/routes/reports.drafts.$studentId.tsx`

**Out of scope**:

- `src/routes/students.$id.tsx`, `student-profile.tsx`, `student-table.tsx` —
  they read the flag for _inline_ sub-features, not a page gate.
- The redirect stub routes (`reports.summary.tsx`, `reports.release.tsx`,
  `reports.broadcast.tsx`, `reports.review.tsx`, `reports.drafts.index.tsx`,
  `reports.students.index.tsx`) — intentional stubs, leave them.
- Any copy change. Output must stay byte-identical (same classes, same text,
  same “smart quotes” in "…HDP Reports module…").

## Git workflow

- Branch: `advisor/045-reports-flag-gate`
- One or two conventional commits, e.g. `refactor(reports): shared HdpFlagGate for the four route guards`
- No push/PR unless instructed.

## Steps

### Step 1: Add the gate to `hdp-shell.tsx`

```tsx
export function HdpFlagGate({ children }: { children: React.ReactNode }) {
  const enabled = useFeatureFlag('reports-hdp')
  if (!enabled) {
    return (
      /* the exact <main> block from Current state, verbatim */
    )
  }
  return <>{children}</>
}
```

Move the needed imports (`Link`, `cn`, `buttonVariants`) into
`hdp-shell.tsx`. Match the file's existing import style.

**Verify**: `bunx tsc --noEmit` → no new errors.

### Step 2: Wrap the four routes

In each route file, delete the local flag read + early-return block and wrap
the page body with `<HdpFlagGate>…</HdpFlagGate>`. Remove imports that
become unused (`useFeatureFlag`, `cn`, `buttonVariants`, `Link` — only where
genuinely unused; `reports.index.tsx` and the student routes may still need
`Link` elsewhere).

Note for `reports.index.tsx`: the current component branches
`if (hdpModuleEnabled) { return <HdpReportsHome …/> }` — restructure to
`return (<HdpFlagGate><HdpReportsHome …/></HdpFlagGate>)`.

**Verify** after each file: `bunx tsc --noEmit` → no new errors. After all
four: `grep -rn "Reports is off" src/routes/` → 0 matches (it now lives only
in `hdp-shell.tsx`).

### Step 3: (Conditional) extract the not-found block

Diff the "Student not found" blocks in the two `$studentId` routes. If
byte-identical: add `export function HdpStudentNotFound()` next to the gate
and repoint both. If they differ (copy or affordances), leave both in place
and record the difference in your completion report.

**Verify**: `bunx tsc --noEmit` → no new errors.

### Step 4: Gates + browser check

**Verify**: `bunx vitest run` → no new failures; `bun run build` → exit 0.
Browser (`bun run dev`): visit `/flags`, toggle "HDP Reports module" OFF,
then visit `/reports`, `/reports/tag`, and a student drafting URL (navigate
from `/reports` first while ON to learn a valid id, e.g.
`/reports/drafts/<id>`) → all three show the identical "Reports is off"
screen with a working "Open feature flags" link. Toggle back ON → pages
render as before.

## Test plan

No new unit tests — this is a pure JSX extraction with no logic beyond the
existing flag read; the browser check in Step 4 is the verification. (If
Step 3 extracts the not-found block, same rationale.)

## Done criteria

- [ ] `grep -rn "Reports is off" src/routes/` → 0 matches
- [ ] `bunx tsc --noEmit` → no new errors; `bun run build` → exit 0
- [ ] `bunx vitest run` → no new failures
- [ ] Browser check in Step 4 passed (both flag states)
- [ ] `git status` → only the five in-scope files modified
- [ ] `plans/README.md` row updated

## STOP conditions

- The four "Reports is off" blocks are NOT byte-identical (drift since
  planning) — report the diff rather than picking a winner.
- Wrapping breaks `reports.index.tsx`'s search-param/tab handling (its
  `Route.useSearch()` usage must stay inside the component that is rendered
  in both flag states — if hooks-order issues appear, STOP).
- You find yourself wanting to edit a redirect stub or `students.$id.tsx`.

## Maintenance notes

- Plan 043 makes `useFeatureFlag` return effective (parent-aware) values;
  this gate composes with that automatically — no coordination needed.
- Future HDP routes must use `HdpFlagGate` — reviewers should reject a new
  inline "Reports is off" block.
- The gate's off-state copy is the natural single place for a later
  copy-skill pass (the phrasing "Turn on “HDP Reports module”" was flagged
  once before in Round 6 as copy-drift-prone).
