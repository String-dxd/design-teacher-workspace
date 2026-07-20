# Plan 031: Coverage & Broadcast (F3) — thin records, targeted requests, and the "Nothing stood out" nil

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: plans 028–030 applied on your branch
> (`src/components/hdp/`, `src/lib/hdp-store.ts` with `coverageForClass`,
> `src/data/timetable.ts`). If absent, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW (all new files except one ToolCard flip)
- **Depends on**: plans/028-hdp-module-foundation.md, 029, 030
- **Category**: direction (new feature)
- **Planned at**: commit `9266c4f`, 2026-07-16

## Why this matters

Form teachers who don't teach their own class have no information supply for the
students they must write about — today they chase colleagues over WhatsApp. F3
replaces that chase: the coverage diagnostic surfaces thin records, a broadcast
asks exactly the timetabled teachers, and an explicit "Nothing stood out" nil is
a first-class answer distinct from silence. Guardrails from
`docs/decisions/reports-hdp.md`: results visible to the requester only; 1
outstanding broadcast per form class with a 7-day cooldown; recipients
auto-resolved but editable, never school-wide; no leadership view exists (P7).

Read the **Design constraints** section of `plans/028-hdp-module-foundation.md`
first — binding here too.

## Current state

(After 028–030.)

- `src/lib/hdp-store.ts` — `coverageForClass(classId)` (covered = ≥1 active tag
  OR nil this term), `loadBroadcasts()/saveBroadcast()`, `addTag` (accepts
  `source: 'broadcast'`). Seed data has 6 thin-record 3A students and one past
  broadcast with ≥2 nils.
- `src/data/timetable.ts` — `teachersForStudents(studentIds)` returns the union
  of timetabled teacher ids; `HDP_COLLEAGUES` in `src/data/hdp.ts` provides
  names.
- `src/components/hdp/coverage-bar.tsx` (028), `stream-item.tsx`,
  `disposition-chip.tsx` (029/030).
- `reports-home.tsx` — the "Coverage & Broadcast" ToolCard is still locked;
  flip it live here.
- Repo confirm-dialog convention: `ui/alert-dialog.tsx` (see plan 029 Step 4).

## Commands you will need

Same as plan 028: tsc **82**, vitest 24 known fails, build 0, targeted
prettier/eslint. NEVER `bun run check`.

## Scope

**In scope**:

- `src/routes/reports.broadcast.tsx` (create)
- `src/components/hdp/broadcast-composer.tsx`, `broadcast-responder-card.tsx` (create)
- `src/lib/hdp-store.ts` + test (extend: broadcast lifecycle + cooldown)
- `src/components/hdp/reports-home.tsx` (flip ToolCard)
- `plans/README.md`

**Out of scope**: legacy reports files; notifications integration (the legacy
`hdp-notifications.ts` stays untouched — no popover entry this round); any
leadership/coverage rollup; drafting surfaces.

## Git workflow

Branch `advisor/031-hdp-broadcast` (stacked). Commit per step. No push/PR.

## Steps

### Step 1: Store — broadcast lifecycle + cooldown

Extend `hdp-store.ts`:

- `canBroadcast(formClassId): { ok: true } | { ok: false; reason: 'outstanding' | 'cooldown'; until?: string }`
  — false while a broadcast created <7 days ago exists for the class, or one
  exists with unanswered recipients (outstanding = any recipient×student pair
  without a response).
- `createBroadcast({ formClassId, requesterId, studentIds, recipientIds,
message })` → persists, throws if `canBroadcast` fails.
- `respondToBroadcast(broadcastId, recipientId, studentId, result)` — result is
  `{ kind: 'tag', tagInput }` (creates the tag via `addTag` with
  `source: 'broadcast'`, then stores the reference) or
  `{ kind: 'nothing-stood-out' }`.
- `nilsForStudent(studentId)` → the nil responses this term (feeds "reviewed —
  nothing noted (teacher, date)" markers, already consumed by 030's roster).

Tests per Test plan. **Verify**: `bunx vitest run src/lib/hdp-store.test.ts` →
all pass.

### Step 2: `/reports/broadcast` — diagnostic → compose

`reports.broadcast.tsx` (flag-gated, breadcrumbs Reports → Coverage &
Broadcast), single page. **Region order** (UX grill decision, 2026-07-16):
coverage diagnostic → composer → replies → "Requests for you" LAST — the
diagnostic is the page's focal region and the page must read as Act 1 (find
gaps) → Act 2 (ask) → Act 3 (answer as a colleague). When the current teacher
has an open request, a one-line pointer renders directly under the h1:
"1 request for you · jump down" (an in-page anchor link to the responder
section). Regions top-to-bottom:

1. **Coverage diagnostic** (form class only — render for `CURRENT_TEACHER.formClassId`):
   `CoverageBar` + a real `<table>` of the NOT-covered students (name → river
   link, tags this term = 0, last-reviewed marker if a nil exists). Checkbox per
   row + select-all (visible labels via row association; `ui/checkbox.tsx`).
   This table is the page's focal region.
2. **Composer** (`broadcast-composer.tsx`), enabled when ≥1 student selected:
   - Recipients: auto-resolved via `teachersForStudents(selected)`, shown as
     removable person chips with visible label "Send to"; an "Add teacher"
     combobox scoped to `HDP_COLLEAGUES` + timetable teachers. NEVER an
     "everyone" option.
   - Message `<Textarea>` (visible label), pre-filled template:
     "Anything stood out about these students this term? Two taps is plenty —
     'Nothing stood out' is a real answer." (editable).
   - Primary Button "Send request" → confirm `alert-dialog` stating exactly
     what happens: "This asks {n} teachers about {m} students. They can reply
     with an observation or 'Nothing stood out'. You can send one request per
     class every 7 days." → on confirm: `createBroadcast`, then REPLACE the
     composer region with a success panel (icon + "Request sent to {n}
     teachers" + "You'll see replies here.") and MOVE FOCUS to that panel's
     heading (`tabIndex={-1}` + `.focus()` — context replacement, so focus
     move, not a toast).
   - Cooldown/outstanding state (`canBroadcast` false): the composer renders
     disabled with an explanation line — "One request is already out for 3A
     (sent {date}). You can send another after {date+7d}." — visible, not
     hidden (CMP-8/CMP-3 error-state honesty).
3. **Replies** (requester view): under the composer, the outstanding/last
   broadcast's responses as `broadcast-responder-card.tsx` rows: responder
   name, student, then either the created tag (render via `StreamItem`) or a
   dashed-border "Nothing stood out" chip (same size as disposition chips) +
   "marks {name} reviewed — nothing noted ({teacher}, {date})" meta line.

### Step 3: The responder experience (mock inbox)

Real recipients don't exist in a mock — make the responder flow demoable
honestly: as the LAST section of `/reports/broadcast` (see the region order in
Step 2 — reachable via the "jump down" pointer under the h1), when the CURRENT
teacher is a _recipient_ of any open broadcast (seed one such in
`SEED_BROADCAST` where `CURRENT_TEACHER` is a recipient), render a "Requests
for you" section:
per student — student name, requester, the 4 `DispositionChip`s + a first-class
dashed **"Nothing stood out"** chip (equal size, `aria-pressed` like the
others), optional note field, "Send" ghost button per row → calls
`respondToBroadcast`. A chip answer + Send is the promised 2-tap path. Answered
rows collapse to a "Responded ({answer})" line.

Label the section honestly for the prototype: subtitle "Requests from form
teachers land here." Do not fabricate push notifications; do not touch the
notification popover.

**Verify**: `bun run build` → exit 0.

### Step 4: Flip the ToolCard + home coverage link

Flip "Coverage & Broadcast" in `reports-home.tsx` to
`<Link to="/reports/broadcast">`, state "Always available" — and confirm the
home coverage strip's "Review gaps" link (028) points here.

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.

### Step 5: Browser verification

0. Region order top-to-bottom: diagnostic → composer → replies → "Requests for
   you"; the "1 request for you · jump down" pointer under the h1 anchors to
   the responder section.
1. Diagnostic table lists exactly the 6 seeded thin-record students; selecting
   3 resolves recipients to the union of their timetabled teachers (verify
   against `TIMETABLE` by hand); removing a recipient chip works.
2. Send → confirm dialog states teachers/students/rate-limit → success panel
   receives focus (screen-reader announce = the heading).
3. Immediately after sending, the composer shows the cooldown explanation;
   `canBroadcast` blocks a second send.
4. Responder section: chip + Send records a nil; the student's roster row (030)
   now shows "reviewed — nothing noted"; `coverageForClass` counts them.
5. A tag reply appears in the student's river with `source: 'broadcast'`.
6. Requester-only visibility: responses render only in the requester's view —
   there is no other view (assert no other route/component reads
   `loadBroadcasts`; `grep -rn "loadBroadcasts" src/ --include='*.tsx'` → only
   `reports.broadcast.tsx`).
7. 320px: table scrolls inside its own container; page has no horizontal
   scroll; chips wrap.

## Test plan

Extend `src/lib/hdp-store.test.ts` (MemoryStorage stub):

1. `canBroadcast` false with an outstanding request; false within 7 days of the
   last one (mock `Date.now`); true after 7 days with all responses in.
2. `createBroadcast` throws when blocked.
3. `respondToBroadcast` with `nothing-stood-out` → `coverageForClass` counts the
   student covered; with a tag → tag exists with `source: 'broadcast'` and the
   response references it.
4. `teachersForStudents` (in `timetable.ts`'s own small test or here): union,
   no duplicates, never returns teachers with no timetabled class overlap.

`bunx vitest run` → all new pass; 24 known fails unchanged.

## Done criteria

- [ ] tsc 82 / vitest 24-known-fails / build 0
- [ ] `grep -rn "loadBroadcasts" src --include='*.tsx'` → only `reports.broadcast.tsx`
- [ ] `grep -rn "uppercase\|dangerouslySetInnerHTML" src/components/hdp/ src/routes/reports.broadcast.tsx` → no matches
- [ ] Browser checks 1–7 hold
- [ ] `plans/README.md` status row updated

## STOP conditions

- 028–030 missing/failing.
- `SEED_BROADCAST` can't be shaped so the current teacher is also a recipient
  without contradicting 028's fixtures — report the conflict instead of
  reshaping 028's data silently.
- Anything requires touching `hdp-notifications.ts` or the notification popover.

## Maintenance notes

- The 7-day cooldown and 1-outstanding limit are research-tunable constants —
  keep them as named exports (`BROADCAST_COOLDOWN_DAYS`,
  `MAX_OUTSTANDING_PER_CLASS`).
- If a notifications integration is added later, it must respect P1: a
  broadcast request may notify (it's a colleague's direct ask), but nothing may
  nag about tagging in general.
- Reviewer scrutiny: recipient resolution correctness, the focus move on send
  success (A11Y-11 context replacement), and that no coverage data leaks
  outside the requester's page.
