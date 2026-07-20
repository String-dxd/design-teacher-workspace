# Design decision record — Reports (HDP) module, Prototype A

> Started at the Phase 3 plan gate. This run was **plan-only** (`/improve` authored
> implementation plans 028–033; no code was built). The verify sections below are
> to be completed by the build run(s) that execute those plans.

- **Date:** 2026-07-16
- **Product:** TW
- **Change type:** new page (module: home + 7 tool surfaces + guest view), replacing
  the Reports tab behind a flag
- **Page type:** workspace view (home), form/flow (Tag Queue, Broadcast, Draft
  Studio), stream (river), digest (Term Summary), plus a parent-audience guest view
- **Run type:** attended (all gates answered by the design lead in-session)
- **The teacher and the moment:** Mdm Tan, Sec 2 form teacher who doesn't teach her
  own class, two weeks before the reporting window — sees thin records, broadcasts to
  the right colleagues. Mr Raj, subject teacher with 160 students, tags a moment in
  ~8 seconds without losing his place.
- **Source PRD:** `docs/prd-hdp.md` expected home (authored copy:
  `/Users/rezailmi/Downloads/prd-hdp.md`, v3 2026-07-16)

## Sprint contract (done-criteria)

1. From any authenticated route, a tag starts in one tap (FAB) or one row
   hover-action; the FAB means the same thing on every route and never badges,
   pulses, or nags (P1).
2. FAB → saved tag for a known student in ≤3 interactions; the overlay never mutates
   the underlying screen (F1).
3. Reports home renders all eight tools with correct state labels — locked tools are
   visible, explained cards, never hidden (F0.3).
4. Coverage renders only for the form teacher's own class, styled as a diagnostic,
   never a KPI; UI copy says "reviewed" (P7).
5. Zero tags ⇒ honest empty states everywhere; no generated content without evidence
   (P4, CMP-4).
6. L0s hold: AA contrast; keyboard reach incl. FAB, overlay, chips (keys 1–4,
   Enter/Esc); visible labels; destructive actions confirm with consequences
   (A11Y-1..3, CMP-2).

## Chosen approach

**Option A — PRD-literal tools grid, tempered.** Home = cycle header (`CycleStages`,
stages not a stepper) + form-teacher coverage strip + eight tool cards grouped by
cycle phase (Capture / Draft / Release), each card carrying a state line; locked ≠
hidden. New module lives in `src/components/hdp/` + flat dot-notation routes
(`reports.tag.tsx`, `reports.summary.tsx`, `reports.students.$studentId.tsx`,
`reports.broadcast.tsx`, `reports.drafts.$studentId.tsx`, `reports.review.tsx`,
release/render stubs, `_guest.hdp-report.$token.tsx`), gated by a new
`reports-hdp` flag (default off) that **swaps `/reports`** — the legacy cycle hub
returns when the flag is off. Scope: Prototype A only (A1 parent-facing + A2 teacher
workflow); B appears only as locked "coming later" cards.

## Rejected options

- **Option B — stage-focused workbench** (current stage's work inline as the focal
  region): strongest focal-point story, but the home layout varies per stage (more
  build/states) and deviates from PRD F0.3's explicit "cycle overview + tools grid".
- **Option C — coverage-first home**: role-dependent hero complicates the layout
  contract and quietly promotes coverage toward a KPI, in tension with P7.

## Grill record (plan was grilled; decisions resolved)

1. **Route takeover** — `reports-hdp` on swaps `/reports` to the new home; legacy hub
   reachable by toggling the flag off. No parallel legacy path.
2. **Demo identity** — one fixed dual-role teacher (form teacher of seeded class 3A,
   subject teacher of 2–3 others); no persona switcher.
3. **Time model** — cycle = semester (Sem 1 = Terms 1–2, Sem 2 = Terms 3–4); tags
   stamped `term: 1–4`; drafting/release once per cycle. Recorded in `CONTEXT.md`.
4. **F0.2 scope** — RowQuickTag on the students list + student profile header only
   this round; groups/search deferred.
5. **⌘K** — deferred; `entryPoint` type keeps the `'cmdk'` variant unused.
6. **Profile cross-link** — river mounts on the student profile behind the flag.
   (Adaptation during plan authoring: the profile is a scrolling page of `Section`
   blocks, not tabs — the river mounts as an "Observations" `Section`, same intent.)
7. **A1 data** — fresh self-contained fixtures in `src/data/hdp.ts`; zero imports
   from legacy `mock-reports.ts`. Students/staff reuse app-wide `mock-students.ts` /
   `mock-staff.ts` (not part of the reports teardown).
8. **Draft kinds** — F4-lite ships both `subject` and `overall` drafts.

## UX grill addendum (2026-07-16, second grill — UX pass)

A second grill focused on the UX of plans 028–033. Calibration set by the
maintainer mid-grill: **prototype for demos — happy path first**; edge-case
hardening deliberately dropped. Seven decisions, all folded into the plans:

1. **Tag save behaviour splits by entry point** (plan 029) — `row` entry
   closes the overlay on save (single-tag intent, focus back to the row);
   `fab`/`topbar` stays open and resets for consecutive tags.
2. **Context is a visible chip row, not a select** (plan 029) — route prefill
   kept, but the stamped value is glanceable and one tap to correct; a
   mis-stamped context silently poisons forming patterns.
3. **Student search gets an escape hatch** (plan 029) — associated classes
   first; no in-scope hit → "showing all students" divider + school-wide
   matches. CCA/relief moments must be capturable (CCA is a first-class
   context).
4. **One visibility rule everywhere** (plan 030) — Term Summary reads through
   the same filter as the river; it never shows a colleague's note or a
   candidate pattern the river would hide from the same viewer.
5. **Broadcast page order: diagnostic first** (plan 031) — diagnostic →
   composer → replies → "Requests for you" last, with a "jump down" pointer
   under the h1. The page reads Act 1 find gaps → Act 2 ask → Act 3 answer.
6. **Seed data stages the funnel** (plans 028/032/033) — student A: confirmed
   unsynced draft (Review & Sync populated cold); student B: shared +
   acknowledged with a parent note (parent view demos cold); student C: fresh,
   walked live end-to-end. Every surface looks inhabited without a live
   warm-up.
7. **Provenance framed as lineage** (plan 032) — edits keep the source (no
   removal affordance), the popover leads with "Based on:" and notes
   "Sentence edited by you" on edited claims. The chip promises lineage, not
   verbatim fidelity.

Canonical demo flow (happy path): home → FAB double-tag + row-tag → river
(confirm a pattern) → Term Summary → broadcast (send, then answer a request
with a nil) → Draft Studio on student C (Suggest, edit, add, confirm) →
Review & Sync → Release (share, copy link) → parent view (acknowledge + note);
student B already shows the completed parent state.

## Tradeoffs, named

- **A launcher home, not a workbench** — home teaches the cycle rather than doing
  work; the coverage strip keeps one working element above the fold. PRD names this
  as F0.3's purpose.
- **Old + new coexist behind flags** — doubles the `/reports` surface until a later
  teardown; accepted for rollback safety (maintainer's explicit call).
- **Mock Suggest validates UI, not model behaviour** — PRD F4.8's own honesty rule;
  the eval set is out of prototype scope.
- **Micro-label restyle** — the PRD's mono/9–10px/uppercase micro-label system
  violates TYP-1/2/3/4; adapted to Inter 11px/500 sentence case. PRD §9.1 licenses
  this ("the app token wins — this spec defines roles, not new hex values"). No
  waiver needed; recorded as an adaptation.
- **Seeded class is 26 students, not the PRD's 33** — reuses the largest existing
  secondary class (3A) instead of growing the shared `mock-students.ts`.

## Controls in scope

A11Y-1..11; TOK-1..3; TYP-1..5 (tabular-nums on counts); COL-1..2 (accent =
`--primary`; functional colours Radix, step-12 on tints ≤12px); CMP-1..9 (CMP-9
satisfied structurally: no `dangerouslySetInnerHTML` anywhere in the module —
user-authored content renders as text nodes); CNT-1..7 (module named "Reports";
"HDP" never in UI copy — CNT-2); MOT-1; SLP-1..11 (SLP-5 rationale: grouped,
state-differentiated navigational cards, not an identical-card default grid);
LAY-2..7. IDN-4 n/a (CaseSync-scoped). LAY-1 n/a (no declared grid).

## Waivers granted

| Control | Tier | Reason | Approver | Where recorded |
| ------- | ---- | ------ | -------- | -------------- |
| — none  |      |        |          |                |

## Plan approval

- **Approved by:** Reza Ilmi (design lead), structured Approve/Adjust gate
- **Approved on:** 2026-07-16, after an 8-question grill (record above)
- **Implementation plans:** `plans/028-*.md` … `plans/033-*.md` (Round 8 in
  `plans/README.md`)

## Verify verdict

_To be completed by the build run(s) executing plans 028–033. Required evidence per
surface: 320/360/768/1280 widths; tag journey incl. Esc-recovery; empty / locked /
cooldown / stale-sync states; Phase-1 component-inventory checkoff; evaluator verdict
pasted verbatim._

## Ratchet

_To be completed at Phase 6 of the build run(s)._
