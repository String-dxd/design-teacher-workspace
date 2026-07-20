# Plan 033: A1 parent-facing digital report book — rendering, prompts, acknowledgement (F6 subset + F5 Act 3 slice)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: plans 028 and 032 applied (`SEED_REPORT_BOOKS`
> in `src/data/hdp.ts`; confirmed drafts + `loadReportBooks/saveReportBook` in
> `hdp-store.ts`). 029–031 are not strictly required but will normally be
> present. If 028/032 absent, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (new guest route + one send surface; no shared-file edits)
- **Depends on**: plans/028-hdp-module-foundation.md, plans/032-hdp-draft-studio.md
- **Category**: direction (new feature)
- **Planned at**: commit `9266c4f`, 2026-07-16

## Why this matters

A1 is the prototype's "credible small win on today's data": a digital HDP that
ships value even if tagging adoption is zero — the report book rendering, parent
prompts ("ask me about"), and digital acknowledgement replacing the signature
chase. It is also the stakeholder story's opening act ("your existing report
card, and more — not a replacement"). Audience: parents — formal register, marks
lead by design in this rendering. Constraints from
`docs/decisions/reports-hdp.md`: one parent note max, addressed to the child; no
feed (P8); teacher-authored content renders as text nodes only (CMP-9); the
existing legacy guest route `_guest.report-view.$token.tsx` stays untouched.

Read the **Design constraints** section of `plans/028-hdp-module-foundation.md`
first — binding here too. Copy register: parent-facing copy is plain, warm,
formal — no exclamation marks, no gamification.

## Current state

(After 028 + 032.)

- `src/data/hdp.ts` — `SEED_REPORT_BOOKS`: 3 students of 3A with per-subject
  term-3/4 results (realistic formats), attendance `{present,total}`, conduct,
  `parentPrompts`. Staged per 028's funnel staging: student B's book is already
  shared (`sharedAt` set, comments snapshotted from a synced seed draft) AND
  acknowledged with a parent note — its guest link
  (`/hdp-report/hdp-{studentId}`) must render the completed parent state cold;
  the other two books have empty comment slots and no acknowledgement.
- `src/lib/hdp-store.ts` — `loadReportBooks()/saveReportBook()`; confirmed
  `HdpDraft`s with `claims` (sourced + "your addition") from plan 032.
- Guest routing convention: `src/routes/_guest.report-view.$token.tsx` (legacy,
  untouched) shows the shape — `_guest.` prefix routes render outside the
  authenticated shell; its token is a mock lookup, "by-design mock, no real
  data" (recorded in plans/README.md). Follow the same mock-token convention.
- `src/components/hdp/source-tag.tsx` (032) — has a `mine`/"your addition"
  variant. Parent rendering REUSES the distinction but with parent-appropriate
  labels (see Step 2).
- The FAB/shell (029) already suppresses itself on `_guest` routes.
- Sparkline rule from the design plan: trend sparklines are Prototype B — NOT
  in this plan. Results render as a table, marks appendix LAST is the
  full-report register; in the report-book register marks lead (PRD F6) — this
  plan builds the report-book register only.

## Commands you will need

Same as plan 028: tsc **82**, vitest 24 known fails, build 0, targeted
prettier/eslint. NEVER `bun run check`.

## Scope

**In scope**:

- `src/components/hdp/report-book.tsx` (create — shared rendering)
- `src/routes/_guest.hdp-report.$token.tsx` (create — parent view)
- `src/routes/reports.release.tsx` (create — the send surface + Phase-3 stubs)
- `src/lib/hdp-store.ts` + test (extend: share tokens, acknowledgement)
- `src/components/hdp/reports-home.tsx` (flip "Release Manager" to the send
  surface; "Renderings Preview" stays "Coming later")
- `plans/README.md`

**Out of scope**: `_guest.report-view.$token.tsx` (legacy); F5 Acts 1–2
(student-first window, curation — Phase 3); Wrapped/story rendering and the
full chaptered report (Phase 3); trend sparklines (Prototype B); email/PG
delivery mechanics.

## Git workflow

Branch `advisor/033-hdp-report-book` (stacked). Commit per step. No push/PR.

## Steps

### Step 1: Store — share tokens + acknowledgement

Extend `hdp-store.ts`:

- `shareReportBook(studentId): { token: string }` — deterministic mock token
  (`hdp-{studentId}` — mock convention, matching the legacy guest route's
  spirit; no crypto), persists `sharedAt` on the book; assembles the book's
  comments at share time from CONFIRMED drafts for that student (overall +
  subject), snapshotting claims into the book (the book is frozen content, not
  a live view of drafts).
- `bookByToken(token)` — lookup.
- `acknowledgeReport(token, note?)` — sets `acknowledgement: { at, note }`;
  note ≤ 500 chars; second call replaces nothing (first acknowledgement wins —
  idempotent; the note is one-shot per PRD Act 3).

Tests per Test plan. **Verify**: `bunx vitest run src/lib/hdp-store.test.ts` →
all pass.

### Step 2: The report book rendering (shared)

`report-book.tsx` — `ReportBook({ book, studentName, className, viewer })`
(`viewer: 'teacher-preview' | 'parent'`):

Formal register, single column, `max-w-2xl mx-auto` (measure ≤80ch). Order
(marks lead — report-book register by design):

1. **Header**: school-year/semester line, student name (h1 on the guest route),
   class. Plain type hierarchy, no card chrome.
2. **Results**: a real `<table>` (`ui/table.tsx`) — rows = subjects, columns =
   Term 3 / Term 4 grades, right-aligned `tabular-nums`, `<th>` headers,
   `<caption class="sr-only">` naming it. No colour-coding of grades.
3. **Attendance & conduct**: one quiet line each ("Present 92 of 96 days" ·
   conduct descriptor), `tabular-nums` on figures.
4. **Personal qualities** (the comments): overall remark first, then per-subject
   comments. Each claim renders as running prose (text nodes — never HTML
   injection). Authorship provenance, parent-appropriate: sourced claims carry
   NO chips in parent view (the provenance story for parents is authorship, not
   tag ids); instead the SECTION carries one attribution line — overall:
   "Written by {form teacher} from observations by {n} subject teachers";
   sentences whose claim lacks a source render normally (they are the teacher's
   own words — exactly what a parent expects). In `viewer='teacher-preview'`,
   SourceTags DO render (the teacher checks provenance before sending).
5. **Ask {name} about**: the `parentPrompts` as a short plain list — 2–3
   conversation starters ("Ask him about the science fair experiment he
   wouldn't give up on") — the conversation-artifact goal, quiet styling,
   no icons-above-headings template.
6. **Acknowledgement** (parent view only): see Step 3.

No `dangerouslySetInnerHTML` anywhere; every figure `tabular-nums`; headings a
real h1→h2 hierarchy; adjacent type steps ≥1.25× (use `text-2xl` h1 /
`text-lg` h2 / `text-sm` body).

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.

### Step 3: The parent guest route

`_guest.hdp-report.$token.tsx` (`/hdp-report/$token`):

- `bookByToken` in an effect; unknown token → a calm full-page message
  ("This report link isn't valid. Check with your child's school." — no error
  codes) with no app chrome.
- Valid: `ReportBook viewer='parent'` + document title "{Name} — Semester 2
  report".
- **Acknowledgement block** at the end (not a sticky bar — the report is meant
  to be read through): heading "Acknowledge this report", explanation "This
  replaces the printed signature slip.", primary Button "Acknowledge" →
  pending → replaced by "Acknowledged on {date}" (`role="status"` live region);
  then reveal the one-time note field: visible label "A note to {child's first
  name} (optional)", helper "One note, addressed to your child — they'll see it
  with their report.", 500-char textarea + outline "Send note" → confirm dialog
  ("Your note goes to {name} with their report. You can send one note.") →
  saved state renders the note read-only. Already-acknowledged token on revisit
  → the saved state directly (idempotent).
- No further actions exist: no feed, no reply thread, no share (P8).
- Illustrative-data honesty: a quiet footer line "Prototype — sample data", same
  as the legacy guest route's spirit (check its footer; mirror the wording if it
  has one).

**Verify**: `bun run build` → exit 0.

### Step 4: The send surface + Phase-3 stubs

`reports.release.tsx` (`/reports/release`, flag-gated, breadcrumbs Reports →
Release):

- A real `<table>` of the form class: student, draft status (from 032),
  book-ready marker (has `SEED_REPORT_BOOKS` entry or assembled book), shared
  status ("Shared {date}" / "—"), acknowledgement status ("Acknowledged {date}"
  / "Awaiting" / "—"), all plain text, `tabular-nums` dates.
- Per-row actions: "Preview" → an inline expanding region or link to a
  `?preview={id}` search-param view rendering `ReportBook
viewer='teacher-preview'` (SLP-10: the preview is a page region, not a modal
  with its own scrolling); "Share with parents" (only when a confirmed overall
  draft exists — otherwise the action renders disabled with title text "Confirm
  a draft first") → confirm dialog ("This makes {name}'s report available at a
  parent link. In the pilot, links go out via Parents Gateway.") → creates the
  token, then shows a copyable link (`/hdp-report/{token}`) with a Copy button
  (`navigator.clipboard`, toast on success).
- **Phase-3 honesty stubs**: a section at the bottom — "Coming later:
  student-first release" — two locked ToolCards (from 028's component): "Three-
  act release (student reacts and reflects first)" and "Story & full-report
  renderings", state "Planned — Prototype B / Phase 3". This is the PRD's
  visible-not-hidden rule applied to the roadmap.
- Flip the home's "Release Manager" ToolCard live → `/reports/release`, state
  "Share report books"; "Renderings Preview" card stays locked ("Coming
  later").

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82;
`bun run build` → exit 0.

### Step 5: Browser verification

1. Confirm a draft (032 flow) → `/reports/release` → Share → copy link → open
   in a private window: the parent view renders the book with THAT draft's
   sentences, marks table first, attribution line correct, NO source chips.
2. Teacher preview of the same book DOES show source chips.
3. Acknowledge → status flips; reload the token → still acknowledged; note
   sends once, renders read-only after; a second acknowledgement attempt
   changes nothing.
4. Unknown token → the calm invalid-link message, no stack traces.
5. Student without a confirmed draft: Share disabled with the explanatory
   title; the row still shows results-only preview (a book can render without
   comments — comments section simply absent, not "undefined").
6. Keyboard + SR pass on the parent route: single h1, table semantics, the
   acknowledge status announced via the live region, focus never stolen.
7. 320px: table scrolls in its container; the acknowledge block usable; no
   horizontal scroll. 1280px: measure of prose ≤ ~80ch.
8. Legacy `_guest.report-view.$token.tsx` route still renders (untouched).

## Test plan

Extend `hdp-store.test.ts` (MemoryStorage stub):

1. `shareReportBook` snapshots confirmed-draft claims into the book (mutating
   the draft afterwards does NOT change the shared book).
2. `shareReportBook` with no confirmed overall draft still shares a
   results-only book (comments absent) — matches Step 5.5 behaviour.
3. `acknowledgeReport` idempotence: second call leaves `at` and `note`
   unchanged.
4. `bookByToken` unknown → null.

`bunx vitest run` → all new pass; 24 known fails unchanged.

## Done criteria

- [ ] tsc 82 / vitest 24-known-fails / build 0
- [ ] `grep -rn "dangerouslySetInnerHTML" src/components/hdp/report-book.tsx src/routes/_guest.hdp-report.\$token.tsx src/routes/reports.release.tsx` → no matches
- [ ] `git diff --stat` shows `_guest.report-view.$token.tsx` untouched
- [ ] Browser checks 1–8 hold
- [ ] `plans/README.md` status row updated

## STOP conditions

- 028/032 missing/failing.
- The snapshot-at-share model conflicts with how 032 stored drafts (e.g. claims
  not serialisable as stored) — report; do not redesign the draft store here.
- Anything requires editing the legacy guest route or `mock-reports.ts`.

## Maintenance notes

- F5 Acts 1–2 (student-first window, reflection gate, curation) insert BETWEEN
  confirm and parent share — `shareReportBook` becomes the Act-3 tail of that
  flow; keep its signature.
- The parent-view "no source chips" decision is A-scope; Prototype B requires
  explicitly distinguishing AI-generated vs teacher-written for parents (PRD
  §5.B.4) — that lands as a rendering variant, not a store change.
- Token scheme is mock-grade (`hdp-{studentId}`), consistent with the legacy
  guest route's documented "by-design mock" stance; a real pilot needs real
  tokens + auth — flagged, not built.
- Reviewer scrutiny: snapshot integrity (test 1), CMP-9 (text nodes only), and
  the acknowledge idempotence.
