# Plan 035: Journey-first IA — consolidate 8 tool doors into 3 destinations

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. STOP conditions are binding. Your
> reviewer maintains `plans/README.md`. Read the "Design constraints" section
> of `plans/028-hdp-module-foundation.md` first — binding here (tokens, type
> rules, a11y, no-nag, coverage-is-diagnostic).

## Status

- **Priority**: P1 (maintainer-requested IA change, 2026-07-16, gate-approved:
  "Yes, 3 destinations")
- **Effort**: M
- **Risk**: MED (moves content between routes; must not lose any capability)
- **Depends on**: plans 028–034 (all on branch `hdp-prototype-v2`; 034 removed
  the legacy Reports code)

## Why this matters

The Reports home currently exposes 8 tool cards; several are views of the same
job. The maintainer wants the home grouped by user journey with fewer doors:

1. **My students** — "know my class, prep for PTM, fill gaps" — absorbs
   Students (roster/river), Term Summary, and Coverage & Broadcast as tabs.
2. **Drafting** — "turn evidence into confirmed comments" — Draft Studio
   absorbs Review & Sync (status strip + confirm queue on the worklist).
3. **Send to parents** — Release Manager as-is (it already hosts the Phase-3
   renderings stub section; the home's separate locked "Renderings Preview"
   card disappears).

Capture stays ambient: the FAB is the door. `/reports/tag` remains as a page
but gets no home card (a quiet text link near the coverage strip suffices).

## Scope

**In scope**:

- `src/routes/reports.students.index.tsx` (becomes the tabbed "My students" hub)
- `src/routes/reports.summary.tsx`, `src/routes/reports.broadcast.tsx`
  (become redirect stubs; their content moves to components)
- `src/components/hdp/` — new/moved presentational components as needed
  (e.g. `term-summary-panel.tsx`, `coverage-broadcast-panel.tsx`) — MOVE code,
  do not rewrite it
- `src/routes/reports.drafts.index.tsx` (gains SyncStatus strip + confirm queue
  - ingest download from reports.review)
- `src/routes/reports.review.tsx` (redirect stub → `/reports/drafts`)
- `src/components/hdp/reports-home.tsx` (3 journey cards with live counts +
  quiet "Tag a student" link)
- Internal links that point at the old routes (`student-river.tsx` empty state,
  `reports.summary` thin-record link, home coverage strip "Review gaps",
  `draft-studio.tsx` "Ask colleagues") — retarget to the new destinations
- `src/routeTree.gen.ts` (regenerated)

**Out of scope**: `hdp-store.ts` API (reuse as-is); the tag composer; release
page content; guest routes; anything outside `src/components/hdp/` +
`src/routes/reports.*`.

## Steps

1. **My students hub**: `reports.students.index.tsx` renders tabs
   (`ui/tabs.tsx`) with `validateSearch` param
   `tab: 'roster' | 'summary' | 'gaps' | 'requests'` (default `roster`).
   Roster = existing table (unchanged). Summary = the current Term Summary
   content extracted into `term-summary-panel.tsx`. **Maintainer feedback
   2026-07-16 (supersedes 031's single-page region order + jump-down pointer)**:
   the broadcast page splits by job into TWO tabs — Gaps = requester journey
   only (coverage diagnostic → composer → replies) extracted into
   `coverage-broadcast-panel.tsx`; Requests = the "Requests for you" responder
   section extracted into `broadcast-requests-panel.tsx` (subtitle "Requests
   from form teachers land here." stays; a count badge on the tab label —
   plain text "Requests (2)", no pulse/dot — is allowed). The jump-down
   pointer dies; anything that linked to the responder section now targets
   `?tab=requests`. Extract by MOVING JSX/logic, not rewriting; keep all store
   calls, focus moves, and copy identical. Page h1: "My students".
2. **Redirect stubs**: `reports.summary.tsx` and `reports.broadcast.tsx` keep
   their routes but `beforeLoad` → `redirect({ to: '/reports/students', search: { tab: … } })`.
   (Old URLs keep working; typed internal links get retargeted anyway.)
3. **Drafting hub**: move the SyncStatus strip, confirm-queue table, and the
   "Download ingest file" footer from `reports.review.tsx` into
   `reports.drafts.index.tsx` (above the worklist table). `reports.review.tsx`
   becomes a redirect stub → `/reports/drafts`. Page h1 stays "Draft Studio".
4. **Home**: `reports-home.tsx` — keep h1/semester/stages/coverage strip
   (+ quiet "Tag a student" text link → `/reports/tag`), then THREE journey
   ToolCards with live count lines derived in the existing mounted effect:
   - My students → `/reports/students` — "14 students · 72 observations · 6 with nothing noted yet" (derive, don't hardcode)
   - Drafting → `/reports/drafts` — "{n} drafts · {m} confirmed · {k} not yet synced" — state "Open — reporting window is open"
   - Send to parents → `/reports/release` — "{s} shared · {a} acknowledged"
     Remove the Capture/Draft/Release group headings and the 5 retired cards
     (Tag Queue, Term Summary, Students, Coverage & Broadcast, Review & Sync,
     Renderings Preview). No percentages, no celebratory styling on counts.

   **ToolCard restyle (maintainer direct-edit feedback, 2026-07-16)** — apply
   in `tool-card.tsx` so all remaining cards get it:
   - Card name `font-medium` → `font-semibold` (stays `text-sm`).
   - Icon gets a colored wrapper copying the student-profile Section pattern
     (`student-profile.tsx:89-96`): `<span className="flex h-10 w-10 shrink-0
items-center justify-center rounded-lg {color}">` around the icon, colors
     from the Radix step-3 bg + step-11 text convention. Add an optional
     `iconClassName` prop; per journey card: My students `bg-twblue-3
text-twblue-11`, Drafting `bg-violet-3 text-violet-11`, Send to parents
     `bg-lime-3 text-lime-11`. Locked/stub cards keep `bg-muted
text-muted-foreground` wrappers. Icon itself drops its standalone
     `text-muted-foreground` class (color comes from the wrapper).

5. **Retarget internal links** listed in Scope to the new destinations
   (`/reports/students?tab=gaps` replaces `/reports/broadcast`, etc.).
6. **Gates + browser**: tsc — no NEW errors vs the post-034 count (034's
   report states it; verify before starting and record); vitest — same pass/fail
   totals as post-034 (this plan moves UI, no store changes); build exit 0.
   Browser: home shows 3 cards with real counts; each tab of My students works
   (roster links to rivers; summary renders per-class sections; gaps composer +
   responder flow work incl. the focus move on send); old URLs redirect;
   drafts page shows sync strip + queue + worklist; ingest download works;
   320px + 1280px sanity on the hub pages; no console errors beyond the known
   ignorable set.

## Done criteria

- [ ] Home renders exactly 3 journey cards + coverage strip + tag link
- [ ] `/reports/summary`, `/reports/broadcast`, `/reports/review` redirect
- [ ] No capability lost: every feature reachable before is reachable after
      (tag page, roster, river, summary, broadcast compose+respond, draft,
      confirm, sync, ingest, release, guest view)
- [ ] Gates per Step 6
- [ ] Browser checks hold

## STOP conditions

- Moving the broadcast content breaks its focus-management or store behavior
  in a way that needs a rewrite (report; don't rewrite).
- Tab state via search params fights TanStack's typed search in a way that
  needs router config changes.
- Any store API change seems needed.
