# Plan 026: Hub scope filter, four-checkpoint table, per-row pipeline actions, parent acknowledgement, and a shared Parents Gateway preview

> **Executor instructions**: Follow step by step; verify each step. On any STOP condition, stop and report. Update this plan's row in `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat a2c2db2..HEAD -- src/routes/reports.index.tsx src/components/reports/cycle-student-table.tsx src/lib/hdp-cycle-store.ts src/routes/reports.cycle.write.$studentId.tsx src/routes/reports.cycle.layout.tsx`
> On any change since this plan was written, compare the excerpts below to live code; on mismatch, STOP.

## Status

- **Priority**: P1 (user-requested feature round)
- **Effort**: L
- **Risk**: MEDIUM (touches the hub table's shape; legacy/non-pipeline classes must render unchanged)
- **Depends on**: shipped HDP pipeline work (commits through `a2c2db2`)
- **Planned at**: commit `a2c2db2`, 2026-07-09
- **Serves**: user requirements session 2026-07-09 (landing-page checklist)

## Locked decisions (user-confirmed 2026-07-09)

1. **Table shows four checkpoint columns** — Results (SC) · Comments · Approval (RO/SL) · Parents — not one merged badge.
2. **One combined scope selector** — "My form class · P1-A" pinned on top, then level groups each with an "All Px classes" option and its classes. Term selector unchanged beside it.
3. **One contextual action button per row** — label/target follows the stage.
4. **Staggered auto-acknowledge** after sending — most parents acknowledge over a visible staggered window; a designated one or two never do.
5. **One shared Parents-Gateway-framed dialog** (phone frame, PG header, report document, tappable **Acknowledge**) used by both the layout page and the write page.

Confirmed assumptions: sibling classes in a level view are **read-only** (statuses visible, actions disabled — the user is only P1-A's form teacher); the six-state pipeline *display* extends to other primary classes, but the interactive end-to-end flow stays on P1-A; secondary keeps the legacy view.

## Hard constraints

- **Do NOT touch the Students page**: no edits to `src/components/students/class-selector.tsx`, `src/routes/students.*`, or the `classGroups` data in `src/data/mock-students.ts` (only P1-A exists under Primary 1 there, and the Students page consumes it). Sibling classes are seeded in a **reports-only** mock module.
- Component reuse policy: compose `ui/` primitives (Select groups, Badge, Table, Dialog). The one new component file, the shared PG dialog, is an **extraction** of the write page's existing inline parent-preview dialog so two routes can share it — not a new pattern. The legacy `pg-preview-dialog.tsx` (tabbed, used by the old holistic-reports flow) stays untouched.
- No grades anywhere; parent-facing surfaces stay calm and parent-voiced.

## Current state (anchors)

- `src/routes/reports.index.tsx` — `CycleHub` renders `ClassSelector` + `TermSelector`, a stage-aware layout button (`{cycle ? 'Edit layout' : 'Set up layout'}` — requirement 5 of the checklist is already met), bulk "Share with parents (N)" `AlertDialog`, five pipeline metric cards (Students / Results in / Pending comments / Pending review / Sent to parents), auto-approve `useEffect` (in_review > 15 s → approved, 5 s interval — the pattern step 3 copies for ack).
- `src/components/reports/cycle-student-table.tsx` — columns Student / Status / Comments / Action; `statusFor(cycle, studentId, pipeline)` (8 states); action is a single "Write" button, disabled while `awaiting_results`.
- `src/lib/hdp-cycle-store.ts` — `PerStudentDraft { comments, parentMessage, ready, reviewStatus?, submittedAt?, sentAt? }` with defensive `loadCycle`.
- `src/routes/reports.cycle.write.$studentId.tsx` — "Preview as parent" opens an inline 375 px phone-frame `Dialog` (parent note card + `ReportPreview`), "Send for review" sets `reviewStatus: 'in_review'`.
- `src/routes/reports.cycle.layout.tsx` — sticky inline document preview; no parent-framed preview.
- `src/data/mock-cockpit-submissions.ts` — `hasAllResults()`; only student '48' (Ho Jia Min) is missing a subject.

## Steps

### Step 1 — Reports-only sibling classes + acknowledgement mock data

New `src/data/mock-report-classes.ts` (data module, not a component):

- `REPORT_LEVELS`: ordered levels P1…P6 with their classes for the **reports hub only** — Primary 1 gets `P1-A` (real roster from `mock-students`) plus synthetic `P1-B` and `P1-C` (≈8–10 pupils each: `{ id: 'p1b-01'…, name, class }`, Singaporean names consistent with existing mock style). Other levels reuse their single existing class.
- `getReportRoster(scope)`: for a class id returns its students; for a level returns the concatenated rosters (P1-A pupils from `mock-students`, siblings from here).
- Deterministic **display statuses** for sibling-class students (they have no cycle store): a seeded spread across the six pipeline states so the level view looks alive.
- `NEVER_ACK_STUDENT_IDS`: one or two P1-A ids (pick pupils early in the roster so demos hit them) whose parents never acknowledge.

**Verify**: unit test — `getReportRoster('level:P1').length === P1-A roster + siblings`; sibling statuses deterministic across two calls; `bun run test` green.

### Step 2 — Combined scope selector + Class column + scoped metrics (`reports.index.tsx`)

- Replace the hub's `ClassSelector` usage (this file only) with an inline grouped `Select` composed from `ui/select`: pinned item **"My form class · P1-A"** (value `P1-A`), then one `SelectGroup` per level from `REPORT_LEVELS`: "All P1 classes" (value `level:P1`), then each class. Secondary classes keep their existing entries/behaviour.
- Scope state: a class id or `level:Px`. Level scope ⇒ pass `showClass` to the table and aggregate metrics across the level (P1-A live from the cycle store, siblings from their seeded statuses).
- "Sent to parents" metric card gains an acknowledged sub-line: `9 acknowledged` in `text-muted-foreground text-base font-normal` (matches the "of N" styling on the Results card).
- Bulk share + auto-approve remain wired to P1-A only; in level scope the Share button counts only P1-A sendables.

**Verify (browser)**: default landing still P1-A pipeline unchanged; picking "All P1 classes" shows Class column, ~28 rows, re-counted cards; picking P3-A still shows the legacy strip. No console errors.

### Step 3 — `ackAt` + staggered auto-acknowledge

- `PerStudentDraft` += `ackAt?: string` (defensive load in `loadCycle`, same style as `sentAt`).
- In `CycleHub`, extend the existing demo-tick pattern (or add a sibling `useEffect`): a sent draft acknowledges when `Date.now() - sentAt > (stableIndex % 3 + 1) * 8_000`, unless the student is in `NEVER_ACK_STUDENT_IDS`. Toast once per batch: "N parents acknowledged". `stableIndex` = position in roster order, so staggering is deterministic.

**Verify**: store round-trip test with `ackAt`; browser — send reports, watch Parents cells flip Sent → Acknowledged over ~8–24 s, never-ack pupil stays Sent.

### Step 4 — Four checkpoint columns (`cycle-student-table.tsx`, pipeline mode only)

- New exported `checkpointsFor(cycle, studentId): { results: 'in'|'awaiting'; comments: 'none'|'draft'|'done'; approval: 'none'|'pending'|'approved'; parents: 'none'|'sent'|'acknowledged' }` derived from the same inputs as `statusFor` (+ `ackAt`). `comments: 'done'` once submitted or beyond (a submitted comment is no longer "draft").
- Pipeline header: Student / (Class) / Results / Comments / Approval / Parents / Action. Cells are compact badges reusing the existing palette: lime = done-positive (In, Approved, Acknowledged), muted = in-progress (Draft, Sent uses `twblue` like today), outline/em-dash = not yet. `—` (muted) for not-applicable-yet states so the table stays quiet.
- Non-pipeline (legacy) classes keep today's Status + Comments excerpt columns **unchanged** — branch on `pipeline`.
- Sibling-class rows render their seeded checkpoint states; P1-A rows read the cycle store.
- Update `cycle-student-table.test.ts`: keep `statusFor` cases, add `checkpointsFor` cases (incl. sent-then-acked, never-submitted).

**Verify**: tests green; browser — P1-A shows mixed checkpoint rows matching each student's known state; P3-A table identical to before (screenshot compare).

### Step 5 — Contextual row action

Replace the fixed "Write" button (pipeline mode) with one stage-driven action:

| Row stage | Button | Behaviour |
|---|---|---|
| awaiting_results | "Enter comments" **disabled**, title "Waiting on results from School Cockpit" | — |
| pending_comments | "Enter comments" | link to write page |
| draft | "Review & submit" | link to write page (submit lives there) |
| in_review | "Enter comments"-slot shows **disabled** "Awaiting approval" | — |
| approved | **"Send to parents"** (primary variant) | per-row send: reuse the exact bulk-share commit path (`commitCycleReport` + `saveShareMessage` + `patchStudent sentAt`) for this one student, confirm via the existing `AlertDialog` copy |
| sent | "View" | link to write page (read state) |
| sibling-class rows | disabled "View only", title "You're not this class's form teacher" | — |

Legacy classes keep the current Write button. **Verify (browser)**: walk one student through the whole ladder — each stage shows exactly one action; per-row Send flips only that row to Sent; bulk Share still works.

### Step 6 — Shared Parents Gateway preview dialog

- Extract the write page's inline phone-frame preview into `src/components/reports/pg-report-preview-dialog.tsx` (props: `report`, `layoutBlocks`, `parentMessage?`, `open`, `onOpenChange`). Dress it as PG: compact header bar ("Parents Gateway" wordmark-style text + school name), scrollable document (`ReportPreview`, compact pupil info), and a sticky bottom **Acknowledge** button that flips to "Acknowledged ✓" locally in the dialog (mock of the parent's tap; does not write to the store).
- Write page: replace the inline dialog with the shared one (button label stays "Preview as parent").
- Layout page: add an outline button "Preview in Parents Gateway" beside the existing preview caption, opening the same dialog with the sample pupil.
- Legacy `pg-preview-dialog.tsx` untouched.

**Verify (browser)**: both entry points open the identical PG-framed dialog; Acknowledge is tappable and flips label; the document inside matches the live layout selection; existing inline layout preview unaffected.

### Step 7 — Gates + bookkeeping

`bunx tsc --noEmit` (no new errors vs baseline), `bun run check`, `bun run test`, full browser pass of the P1-A end-to-end flow (results gate → comments → submit → auto-approve → per-row send → staggered ack) plus P3-A legacy regression. Update `plans/README.md` row and `todos/project-todos.json`.

## STOP conditions

- Any edit would touch `src/components/students/**`, `src/routes/students.*`, or `classGroups` in `mock-students.ts` → STOP.
- Legacy (non-pipeline) hub rendering changes in any visible way for P3-A → STOP and re-scope.
- The write page's document renderer (`report-preview.tsx`) needs structural changes beyond consuming the extracted dialog → STOP (it's shared by four surfaces).
