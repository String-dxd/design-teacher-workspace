# Plan 030: The river and the Term Summary (F2/F2b) + the student-profile cross-link

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9266c4f..HEAD -- src/components/students/student-profile.tsx`
> Plans 028 and 029 must be applied on your branch (`src/components/hdp/`,
> `src/lib/hdp-store.ts`, the capture provider). If absent, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (one section added to the shared 1,900-line `student-profile.tsx`)
- **Depends on**: plans/028-hdp-module-foundation.md, plans/029-hdp-tag-capture.md
- **Category**: direction (new feature)
- **Planned at**: commit `9266c4f`, 2026-07-16

## Why this matters

Capture only pays off if teachers can _consume_ what accumulated — before any
report exists. The river (F2) consolidates every teacher's tags per student; the
Term Summary (F2b) is the same-cycle payoff (PTM prep, check-in prompts) that
makes tagging worth it in week 3, not just at report time. The profile
cross-link keeps Reports from becoming a silo. Binding rules from
`docs/decisions/reports-hdp.md`: forming patterns render as "candidate thread,
unconfirmed" until a teacher confirms (P5); the disposition mix bar shows
proportions with no numeric axis (P6); no class-vs-class or teacher-vs-teacher
comparison anywhere (P6/P7); subject-teacher river visibility is flag-gated
(`reports-river-visibility`, default off = own tags + confirmed threads).

Read the **Design constraints** section of `plans/028-hdp-module-foundation.md`
first — binding here too.

## Current state

(After 028/029.)

- `src/lib/hdp-store.ts` — `tagsForStudent`, `tagsByAuthor`,
  `detectFormingPatterns(studentId)`, pattern status persistence,
  `coverageForClass`. `src/data/hdp.ts` — `CURRENT_TEACHER` (form class `'3A'`,
  `teachingClasses`), seed tags with 6 zero-tag 3A students, 2 seed patterns.
- `src/components/hdp/` — `reports-home.tsx` (flip the Term Summary + Students
  cards live in this plan), `row-quick-tag.tsx`, the capture context
  (`openTagQueue`).
- `src/components/students/student-profile.tsx` — one long scrolling page built
  from a local `Section` component (defined line 76). Reports section pattern:
  `ReportRow` (line 449) rendered in a flag-gated section; flags read at lines
  671–680 (`useFeatureFlag('hdp-reports')` etc.). Add the new Observations
  section following the same `Section` + flag-gate pattern; touch nothing else.
- `src/components/empty-state.tsx` — `EmptyState({ title, description, icon?,
action? })`; reuse for empty rivers/summaries.
- Repo table primitive: `src/components/ui/table.tsx`; tabs: `ui/tabs.tsx`.
- Off-state pattern for flag-gated routes: copy from plan 029's
  `reports.tag.tsx` ("Reports is off" / link to `/flags`).

## Commands you will need

Same as plan 028: tsc baseline **82**, vitest 24 known fails, `bun run build`
exit 0, targeted prettier/eslint. NEVER `bun run check`.

## Scope

**In scope**:

- `src/components/hdp/stream-item.tsx`, `tag-pill.tsx`, `pattern-card.tsx`,
  `disposition-mix-bar.tsx`, `student-river.tsx` (create)
- `src/routes/reports.students.$studentId.tsx`, `src/routes/reports.students.index.tsx` (create)
- `src/routes/reports.summary.tsx` (create)
- `src/components/hdp/reports-home.tsx` (flip 2 tool cards live)
- `src/lib/hdp-store.ts` + `src/lib/hdp-store.test.ts` (extend: pattern
  confirm/dismiss, per-term grouping helpers)
- `src/components/students/student-profile.tsx` (ONE new flag-gated Section)
- `plans/README.md` (status row)

**Out of scope**: legacy `reports.*`/`components/reports/`; broadcast surfaces
(plan 031); drafting (032); any edit to `student-profile.tsx` beyond the single
new Section + its imports + one flag read.

## Git workflow

Branch `advisor/030-hdp-river-summary` (stacked). Commit per step. No push/PR.

## Steps

### Step 1: Store extensions

Extend `hdp-store.ts`:

- `confirmPattern(id, teacherId)` / `dismissPattern(id)` — persist status
  transitions (`candidate → confirmed | dismissed`).
- `tagsForStudentVisible(studentId, viewerId)` — visibility rule: form teacher
  of the student's class sees ALL active tags; anyone else sees their own tags +
  tags belonging to CONFIRMED patterns, unless the `reports-river-visibility`
  flag is on (callers pass a boolean `fullRiver` — the store stays React-free).
- `dispositionMix(tags)` → `Record<DispositionId, number>`.
- `summaryForTeacher(teacherId)` → per teaching class: tag count this term,
  most-noted students (top 3 by tag count), recent notable quotes (last 3 notes,
  newest first), candidate patterns across their classes, thin-record count for
  the form class only. **One visibility rule everywhere** (UX grill decision,
  2026-07-16): every input to the summary — counts, most-noted, quotes, and
  patterns — is filtered through the SAME rule as `tagsForStudentVisible`.
  Form class → all tags, candidate patterns included; teaching classes → the
  viewer's own tags + tags in CONFIRMED patterns only, candidates hidden. The
  Term Summary must never surface a note or candidate thread the river would
  hide from the same viewer.

Tests per Test plan. **Verify**: `bunx vitest run src/lib/hdp-store.test.ts` →
all pass.

### Step 2: River building blocks

- `tag-pill.tsx` — `TagPill({ disposition, variant? })`: `text-xs font-medium`
  pill, `bg-muted text-muted-foreground`; `variant="key"` (the accent use):
  `bg-primary/10 text-primary`. Sentence case, never uppercase.
- `stream-item.tsx` — `StreamItem({ tag, authorName, editable, onEdit,
onDelete })`: grid `[34px_1fr]`; left: a week marker ("W3") in
  `text-xs text-muted-foreground tabular-nums`; right: author + context meta
  line (13px/600 name + TagPill + "· during lesson"), the quoted note
  (`text-sm text-muted-foreground`, `line-clamp-3`), an "evidence" chip when
  `evidenceIds.length > 0`, and Edit/Delete ghost buttons when editable
  (delete confirms via alert-dialog, same copy pattern as plan 029 Step 4).
  Rendered inside a `<li>`; the enclosing list is `<ol>` with `<time
dateTime>` on the marker.
- `pattern-card.tsx` — `PatternCard({ pattern, onConfirm, onDismiss })`: the
  screen's accent element — `border-primary/50 border-[1.5px] rounded-lg p-3`
  (a card IS legitimate: it carries Confirm/Dismiss actions). Label line:
  "Forming pattern — candidate thread, unconfirmed" (`text-xs font-medium
text-primary`, sentence case); basis line "Curiosity in 2 contexts · 4
  observations"; actions: outline "Confirm" + ghost "Not a thread". Confirmed
  state: label becomes "Confirmed thread · by {name}", actions disappear.
- `disposition-mix-bar.tsx` — a single horizontal stacked bar (h-2, rounded)
  of the four dispositions' proportions using `bg-primary` for the largest and
  `bg-muted-foreground/40`, `bg-muted-foreground/25`, `bg-muted` for the rest —
  NO numeric axis, NO percentages, NO legend counts; an `aria-label` sentence
  ("Mostly curiosity and collaboration") for AT. Below it, plain-text legend
  chips (TagPill per disposition present).

**Verify**: `bunx tsc --noEmit 2>&1 | grep -c "error TS"` → 82.

### Step 3: `StudentRiver` + the two river routes

`student-river.tsx` — `StudentRiver({ studentId, viewerId })`:

- Header: student name (h2 when embedded, h1 on the route), meta line
  "11 observations · 4 teachers · 3 contexts" (`tabular-nums`), and a secondary
  Button "+ Add my observation" → `openTagQueue({ studentId, entryPoint:
'row' })`.
- `DispositionMixBar` under the header.
- Candidate `PatternCard`s (from `detectFormingPatterns`), then the stream
  (`<ol>` of `StreamItem`s newest-first, grouped by week marker).
- Visibility via `tagsForStudentVisible(studentId, viewerId, fullRiver)` with
  `fullRiver = useFeatureFlag('reports-river-visibility')` resolved by the
  caller component (keep `StudentRiver` itself flag-free; pass a prop).
- Empty state (zero visible tags): `EmptyState` with title
  "No observations yet this term", description "Add one when a moment stands
  out, or ask colleagues who teach {name}." and TWO actions: secondary "Add my
  observation" (opens the composer) + ghost link "Ask colleagues" →
  `/reports/broadcast`. No guilt copy, no skeletons.
- All store reads in `useEffect` after mount (SSR safety), with a `mounted`
  guard as in `reports-home.tsx`.

Routes:

- `reports.students.index.tsx` (`/reports/students/`): flag-gated; a simple
  roster of the form class (name, class, tag count this term, "reviewed —
  nothing noted" marker for nil-only students) — a real `<table>` from
  `ui/table.tsx`, numeric column right-aligned `tabular-nums`, each row linking
  to the river. Teachers without a form class (not our demo user) would see
  their teaching classes; implement as: tabs per associated class
  (`ui/tabs.tsx`) with the form class first.
- `reports.students.$studentId.tsx` (`/reports/students/$studentId`):
  flag-gated; breadcrumbs Reports → Students → {name}; renders `StudentRiver`
  full-page. Unknown id → the "Student not found" pattern from
  `reports.cycle.write.$studentId.tsx:276-285` (link back to `/reports`).

Flip the "Students" ToolCard in `reports-home.tsx` to `/reports/students`.

**Verify**: `bun run build` → exit 0; browser: river renders for a seeded
student; pattern card confirm persists across reload.

### Step 4: Term Summary route

`reports.summary.tsx` (`/reports/summary`), flag-gated, breadcrumbs Reports →
Term Summary:

- h1 "Term Summary", subtitle "Term 3 · what you've noticed so far" —
  framed as useful now (PTM prep), NOT as reporting progress. No completion
  language anywhere.
- Per associated class (form class first), a section (`h2` = class name):
  - Stat line: "14 observations this term · 9 students" (`tabular-nums`).
  - "Worth revisiting" — the accent elements of this screen: top-3 most-noted
    students as rows (name → link to river, tag count, latest note quote) plus
    the last 3 notable quotes as quiet `<blockquote>`s with author/context
    attribution.
  - Candidate patterns (compact `PatternCard`s, confirm/dismiss inline).
  - Form class ONLY: thin-record line "6 students with nothing noted yet" +
    ghost link "Ask colleagues" → `/reports/broadcast`. Never render this for
    non-form classes (P7).
- NO cross-class totals row, NO teacher comparisons, NO percentages (P6/P7).
- Zero tags everywhere → `EmptyState`: "Nothing tagged yet this term" /
  "Your Term Summary fills up as you tag moments worth remembering." + action
  "Tag a student" (opens composer). No guilt copy.
- Group content with headings + spacing + dividers — NOT cards (SLP-11: nothing
  here is an interactive unit except links).

Flip the "Term Summary" ToolCard live.

**Verify**: `bun run build` → exit 0; browser: summary shows 3A first with the
thin-record line; 3B/4A sections without it.

### Step 5: Student-profile Observations section

In `src/components/students/student-profile.tsx`:

1. Add `const reportsHdpEnabled = useFeatureFlag('reports-hdp')` beside the
   existing flag reads (lines 671–680).
2. Add ONE new section, placed immediately after the existing reports section,
   using the local `Section` component exactly as neighbours do:
   `{reportsHdpEnabled && (<Section title="Observations">…</Section>)}` —
   containing `<StudentRiver studentId={student.id} viewerId={CURRENT_TEACHER.id} fullRiver={…flag…} />`.
3. Imports: `StudentRiver` + `CURRENT_TEACHER` only. NOTHING else changes in
   this file — no reformatting, no import reordering beyond the additions.

**Verify**: `git diff --stat src/components/students/student-profile.tsx` →
one file, additions only in the flag block, imports, and the one section
(≈ +12 lines); flag OFF renders the profile byte-identically.

### Step 6: Browser verification

1. `/reports/students/{seeded-id}`: header meta counts correct; mix bar shows
   proportions with no numbers; candidate pattern labelled exactly
   "candidate thread, unconfirmed"; Confirm flips it and persists on reload.
2. Own tag <24h old shows Edit/Delete; a colleague's tag shows neither.
3. With `reports-river-visibility` OFF, viewing a 3B student (not the form
   class) shows only own tags + confirmed threads; ON shows everything.
4. `/reports/summary`: no class-vs-class comparison exists; thin-record line
   only under 3A; every student link lands on the right river.
5. Profile of a 3A student: Observations section present with flag on, absent
   with flag off.
6. Zero-tag student river: honest empty state, both actions work, no skeleton.
7. 320px width: river and summary reflow to one column, no horizontal scroll.

## Test plan

Extend `src/lib/hdp-store.test.ts` (same MemoryStorage stub):

1. `confirmPattern` persists and survives a reload (`loadPatterns` reflects it).
2. `tagsForStudentVisible`: form-teacher viewer sees all; other viewer sees own
   - confirmed-pattern tags only; `fullRiver: true` sees all.
3. `dispositionMix` proportions sum to the tag count.
4. `summaryForTeacher`: most-noted top-3 ordering; thin-record count only
   reported for the form class; classes with zero tags return empty sections
   (not omitted).
5. `summaryForTeacher` visibility: for a teaching (non-form) class, a
   colleague's note outside any confirmed pattern never appears in quotes or
   counts; candidate patterns appear only for the form class.

`bunx vitest run` → all new pass; 24 known fails unchanged.

## Done criteria

- [ ] tsc 82 / vitest 24-known-fails / build 0 (as plan 028)
- [ ] `grep -rn "uppercase\|dangerouslySetInnerHTML\|animate-bounce" src/components/hdp/` → no matches
- [ ] `grep -rn "%\b" src/routes/reports.summary.tsx` → no percentage rendered in summary copy (manual read acceptable)
- [ ] `student-profile.tsx` diff ≈ +12 lines, additive only, flag-off identical
- [ ] Browser checks 1–7 hold
- [ ] `plans/README.md` status row updated

## STOP conditions

- 028/029 not applied or their done criteria failing.
- `Section` in `student-profile.tsx` no longer matches the described pattern
  (line 76) — report the actual structure.
- The visibility rule requires knowing a student's form teacher and the data
  can't express it (mock-students lacks the mapping) — report; do not invent a
  role model.
- Any need to edit files on the out-of-scope list.

## Maintenance notes

- P6/P7 are load-bearing product law: any future "just add a percentage/leaderboard"
  request contradicts the PRD — push back, don't comply silently.
- `tagsForStudentVisible` is where the Q4 research decision (river visibility)
  lands; the flag defaults off until research decides.
- Reviewer scrutiny: the `student-profile.tsx` diff (must be tiny), pattern
  status persistence, and that the summary renders no comparison surface.
