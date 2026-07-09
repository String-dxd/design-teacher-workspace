# Plan 018: HDP "Report Builder" prototype (P1) — generation + sharing, aimed at the "over SC" bet

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm
> the expected result before moving on. If a "STOP conditions" item occurs, stop and report — do not
> improvise. This is a **prototype** (mock data, happy-path only) for teacher concept-testing and an
> STCI/CDC demo — not production. When done, update the status row in `plans/README.md`.
>
> **Prerequisite (non-code, blocking for P1 content — STOP if unmet)**: The P1 report's sections and
> descriptor language must be modeled on a **real P1 HDP artifact** and signed off by a P1 teacher/HOD
> before P1 content is coded (see "Why this matters", decision Q5). If the maintainer has not provided a
> real P1 section/field set, build the UI shell against placeholder data **clearly labeled "illustrative
> — pending P1 sign-off"** and STOP before hardcoding specific P1 descriptors.
>
> **Drift check (run first)**: `git diff --stat 8a71db6..HEAD -- src/components/reports/ src/routes/reports.index.tsx src/routes/reports.\$id.tsx src/routes/_guest.report-view.\$token.tsx src/types/report.ts src/lib/feature-flags/ src/data/mock-reports.ts`
> If any in-scope file changed since `8a71db6`, compare the "Current state" excerpts against the live
> code before proceeding; on a real mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1 (test track A0–A4) · P2 (demo track B1–B3, the cut-line if velocity slips)
- **Effort**: L (multi-surface feature; AI-agent-assisted build assumed)
- **Risk**: MED — feature flag-gated and default-off; risk is scope, authenticity, and demo coherence, not regression of shipped surface
- **Depends on**: `holistic-reports` flag foundation (exists); no other plan
- **Category**: direction / feature (prototype)
- **Planned at**: commit `8a71db6`, 2026-07-01

## Why this matters

The Jul 1 HDP mid-point check-in greenlit a **"Canva for HDP" report builder** prototype. Testing
(Jul 13–21, 3–5 P1 teachers) is **de-risking, not validation**, so the whole build serves ONE bet and
has ONE pre-committed failure signal (decided in a grilling session):

- **The bet**: teachers **would use this over SC + Smart Compose**.
- **Kill-criterion**: the bet is LOST if, after building + sharing a report, teachers **cannot name a
  concrete reason they'd pick this over SC**.
- **Forced consequences**: (1) the flow must feel _faster_ than SC; (2) **inline Smart Compose is
  non-negotiable** ("no platform switching" is a primary reason to defect from SC); (3) the test script
  must put SC in the room — otherwise the kill-criterion is unmeasurable.

**Two audiences — keep them separate in code and demo:**

- **TEST TRACK (A0–A4, P1)** — what P1 teachers touch: one entry door → build → generate → P1
  parents-first share, with inline Smart Compose. Its only job is the bet.
- **DEMO TRACK (B1–B3, P2)** — what STCI/CDC see: bulk (scale), an interactive extended holistic view
  (vision), gamified secondary sharing (delight). **If build velocity slips, cut the demo track first;
  the test track is sacrosanct.**

Decisions locked (grilling): P1 sharing = **parents-first** (not student-first — that's a secondary
model); P1 content = **real artifact + sign-off** (Q5); builder = **sections toggle + up/down reorder +
viz switch, NO field-level edits** (Q7); bulk = built, with **P1 curated authentic class + secondary
auto-hide empty sections** (Q9/Q10); entry = **Reports page only, hide the per-student profile wizard**
(Q11); extended holistic view uses **progression charts, NOT the radar/spider chart**.

## Current state (facts inlined — verified at `8a71db6`)

The HDP surface already exists behind the `holistic-reports` flag (default off). Key files and their role:

- `src/routes/reports.index.tsx` — the entry page: `ClassSelector`, filters, **student multi-select**
  (`selectedIds: Set<string>`), a floating bulk-action bar (currently Send / Send via PG / Request
  Review), `mockReports`. This is where the "Generate" entry attaches.
- `src/routes/reports.$id.tsx` — report detail: `Tabs` Overview/Academic/Holistic, `EmailPreviewDialog`
  / `PgPreviewDialog` / `ParentPreviewDialog`, "Send to Student", "Send to Parents via PG", save-as-PDF.
- `src/routes/_guest.report-view.$token.tsx` — tokenized mobile web-view. **Currently student-first**
  (`Acknowledge Report` → `Send to Parents`). `token` is just a report id (`getReportById(token)`).
- `src/components/reports/generate-hdp-wizard.tsx` — the wizard: `STEPS = ['Template','Selection','Preview','Save']`,
  per-student, full-screen overlay. Holds `selectedTemplate`, `selectedSections: Record<string,boolean>`,
  `generatedReport`. On "Save Reports" calls `addReport(generateReportFromStudent(...))`.
  **Note: `selectedSections` is render-time only — never persisted on the report.**
- `src/components/reports/hdp-template-step.tsx` — `export type TemplateId = 'quarterly' | 'comprehensive' | 'custom'`
  and `export const TEMPLATES` (each has `sections: Record<string,boolean>`). Template cards UI.
- `src/components/reports/hdp-data-step.tsx` — `SECTION_DEFS` (8 sections: `studentInfo` [required],
  `attendance`, `academic`, `teacherComments`, `coreValues`, `physicalFitness`, `via`, `cca`), rendered
  as a checkbox list. **This step becomes the builder.**
- `src/components/reports/hdp-preview-step.tsx` — renders tabs from `selectedSections` (fixed order).
- `src/types/report.ts` — `HolisticReport` (line ~174), `HolisticData`, `AcademicData`
  (`overallPercentage`, `learningOutcomes` with `Accomplished/Competent/Developing/Beginning` — the
  P1-appropriate shape), plus secondary grade types (`A1–F9`). `attendance` is the last field (~line 199).
- `src/data/mock-reports.ts` — `generateReportFromStudent(student, term, year)`, `addReport(report)`,
  `getReportById(id)`, `getAdjacentReportIds(id)`, `CURRENT_ACADEMIC_YEAR`.
- `src/data/mock-students.ts` — `getSchoolLevel(class)` → `'primary' | 'secondary'`.
- `src/lib/feature-flags/` — `types.ts` (`FeatureFlagKey` union), `constants.ts` (`DEFAULT_FEATURE_FLAGS`),
  `context.tsx` (`useFeatureFlags`). Single-flag hook: `src/hooks/use-feature-flag.ts` (`useFeatureFlag(key)`).
  Admin UI: `src/routes/flags.tsx` (`featureFlagConfigs` array).

**Exemplars to copy patterns from (do NOT rebuild — `AGENTS.md`: compose/extend, don't create):**

- Up/down reorder: `src/components/comms/question-builder.tsx:46-58` (array-swap `moveUp`/`moveDown`,
  `GripVertical`/`ArrowUp`/`ArrowDown`, boundary-disabled).
- Editor + live-preview split layout: `src/routes/announcements.new.tsx:882-890`
  (`lg:grid-cols-[1fr_320px] lg:items-start`, sticky preview).
- Copy-link + toast: `navigator.clipboard.writeText(...)` then `toast.success('Link copied')` — pattern
  in `src/components/heytalia/heytalia-panel.tsx`.
- Chart palette + chrome tokens: `src/lib/chart-colors.ts` (`CATEGORICAL_6`, `SERIES_BLUE`,
  `CHART_GRID/AXIS/TICK/LABEL`). Recharts usage: `src/components/students/*-analytics.tsx`.
- Rich text: `src/components/comms/rich-text-editor.tsx` (`value`/`onChange`/`toolbar="simple"`).
- Canned AI (no live API): `src/components/insight-buddy.tsx`.
- Feature-flag add pattern: any existing key across `types.ts` + `constants.ts` + `flags.tsx`.

## Commands you will need

| Purpose                  | Command             | Expected                                                               |
| ------------------------ | ------------------- | ---------------------------------------------------------------------- |
| Install (fresh worktree) | `bun install`       | exit 0 — **required; hydration silently fails without it**             |
| Dev server               | `bun run dev`       | serves http://localhost:3000                                           |
| Build                    | `bun run build`     | exit 0                                                                 |
| Typecheck                | `bunx tsc --noEmit` | error count **≤ baseline** (see below), no NEW errors in touched files |
| Tests                    | `bun run test`      | no regression vs baseline                                              |
| Lint/format              | `bun run check`     | exit 0 after auto-fix                                                  |

**Capture the baseline BEFORE any change** (this repo has pre-existing failures; do not try to fix them):
`bun install && bun run build && bunx tsc --noEmit 2>&1 | tail -1 && bun run test 2>&1 | tail -5`.
Per `plans/README.md` the documented baseline near this commit is **build 0 / `tsc` ~113 errors /
vitest 37 passed, 16 failed** (the 16 failures are unrelated to this plan). Record your actual numbers
and gate on "no regression."

## Scope

**In scope (test track A0–A4 — build first):**

- `src/lib/feature-flags/types.ts`, `src/lib/feature-flags/constants.ts`, `src/routes/flags.tsx`
- `src/types/report.ts`
- `src/data/report-layouts.ts` (create — data/config)
- `src/data/mock-reports.ts`, `src/data/mock-students.ts`
- `src/components/reports/generate-hdp-wizard.tsx`, `hdp-template-step.tsx`, `hdp-data-step.tsx`,
  `hdp-preview-step.tsx`
- `src/routes/reports.index.tsx`, `src/routes/reports.$id.tsx`, `src/routes/_guest.report-view.$token.tsx`

**In scope (demo track B1–B3 — additive, lower priority):**

- `src/components/reports/progression-chart.tsx` (create — new domain chart type, justified per policy)
- plus the same wizard/index files above for bulk + extended template

**Out of scope (do NOT touch):**

- Real PG integration, real link auth/expiry, real School Cockpit / SEI data pull.
- A data-gathering stage, error flows, field-level toggles, true drag-and-drop / any dnd dependency.
- The radar/spider chart (`radar-chart.tsx`) in the extended view — use progression charts instead.
- Secondary academic data model, `src/components/ui/*` primitives, the 16 pre-existing failing tests.
- Server-persisted templates; the Instagram-stories cover-page concept.

## Git workflow

- You are already on branch `worktree-sdp+hdp-report-builder-prototype` (a worktree off `origin/main`).
- Commit per phase or logical unit; conventional-commit style (repo uses e.g.
  `feat(agency-report): …`, `fix(reports): …`). Suggested prefix: `feat(hdp-builder): …`.
- Do NOT push or open a PR unless the maintainer asks.

## Steps

### TEST TRACK (P1 — this is what de-risks the bet; build and verify before touching the demo track)

#### Step A0.1 — Add feature flags

In `src/lib/feature-flags/types.ts`, add to the `FeatureFlagKey` union (after `'primary-contact'`):
`'hdp-report-builder'` and `'hdp-extended-template'`.
In `src/lib/feature-flags/constants.ts`, add both to `DEFAULT_FEATURE_FLAGS` as `false`.
In `src/routes/flags.tsx`, add two `featureFlagConfigs` entries, `stage: 'Experiment'`, with clear
descriptions ("Enable the HDP report builder — Reports-page entry, section builder, and P1 share flow";
"Enable the aspirational extended holistic template with progression charts").

**Verify**: `bunx tsc --noEmit` → no new errors; `bun run dev`, open `/flags` → both toggles render and persist across reload.

#### Step A0.2 — Authentic P1 data (gated on the Q5 prerequisite)

Confirm `mockStudents` has a **Primary 1 class** (`getSchoolLevel` → `'primary'`) with ~6–8 students; add
one if absent. Model P1 report content on **developmental descriptors** using the existing
`AcademicData.learningOutcomes` (`Accomplished/Competent/Developing/Beginning`); **do NOT surface
`overallPercentage`/`A1–F9` for P1**. Populate the P1 class as a **curated, complete class** for the
universal P1 sections only — **no CCA/VIA for P1** (P1 pupils generally have none; a populated CCA
section is a recognizable fake).

**STOP** if a real P1 section/field set has not been provided (see the header prerequisite) — build the
shell with clearly-labeled placeholder content and report.

**Verify**: `/reports` → primary level → the P1 class and its students appear; no percentage/letter-grade fields show for P1.

#### Step A1 — Persist the layout ("what you build is the template")

In `src/types/report.ts` (additive, backward-compatible), add:

```ts
export type ReportBlockViz = 'bar' | 'table' | 'progress' | 'line'
export interface ReportBlock {
  key: string
  enabled: boolean
  order: number
  viz?: ReportBlockViz
}
export interface ReportLayout {
  blocks: Array<ReportBlock>
}
```

and add `layout?: ReportLayout` to `HolisticReport` (optional → existing reports still render).
Create `src/data/report-layouts.ts` exporting `P1_DEFAULT_LAYOUT` (studentInfo, attendance, academic,
teacherComments; bar/table viz — the low-hanging-fruit set) and `SECONDARY_EXTENDED_LAYOUT` (adds
holistic blocks with `progress`/`line` viz). Keys must match `SECTION_DEFS` keys in `hdp-data-step.tsx`.

**Verify**: `bunx tsc --noEmit` → no new errors; `grep -c "export const P1_DEFAULT_LAYOUT" src/data/report-layouts.ts` → 1.

#### Step A2 — Turn the data step into a section builder (extend, don't duplicate)

Rework `src/components/reports/hdp-data-step.tsx` so each `SECTION_DEFS` row supports: enable/disable
(`Checkbox`; keep `studentInfo` required/locked), **up/down reorder** (copy the swap logic from
`question-builder.tsx:46-58`, with `GripVertical` + `ArrowUp`/`ArrowDown` disabled at boundaries), and a
per-section **viz `Select`** (`bar`/`table`/`progress`) for chartable sections. **No field-level
toggles.** Lift ordered state into `generate-hdp-wizard.tsx` as a `ReportLayout` (replace the flat
`selectedSections` where needed) and render the live preview beside the builder using the
`announcements.new.tsx:882-890` split-grid. Update `hdp-preview-step.tsx` to iterate `layout.blocks` in
`order`, honoring `enabled`. Add a P1 template to `TEMPLATES` (+ `'p1'` to the `TemplateId` union) whose
`sections`/order equal `P1_DEFAULT_LAYOUT`. On wizard save, attach the built `layout` to the report.

**Verify**: `bun run dev` → open the builder → toggling, reordering (up/down), and switching a viz all update the live preview; `bunx tsc --noEmit` → no new errors.

#### Step A3 — Inline Smart Compose in Teacher Comments (non-negotiable)

In the Teacher-Comments block, reuse `RichTextEditor` (`toolbar="simple"`) and add a "Suggest" button
that inserts a canned suggestion (reuse the canned-response approach in `insight-buddy.tsx`; **no live
API**). Make it feel native to the editor — this is the "no platform switching" reason-to-switch.

**Verify**: in the builder, clicking Suggest inserts editable text into the comment field without leaving the page.

#### Step A4 — P1 parents-first share (link + personal message)

Add a Share action on `src/routes/reports.$id.tsx` (gated on `hdp-report-builder`), composed from
`Sheet`/`Dialog` + `Textarea` + `Button` (model on `pg-preview-dialog.tsx`). It shows: a generated
**share link** with copy-to-clipboard + `toast.success('Link copied')`, and a **personal text-message
field**. Target is the **parent** via the PG web-view — no student intermediary for P1. Update
`src/routes/_guest.report-view.$token.tsx` to (a) render as a **parent-facing** view (replace the
student-first `Acknowledge → Send to Parents` sequence with a parent acknowledge), (b) show the personal
message near the header, and (c) render report content from the report's persisted `layout` (Step A1).

**Verify**: from a P1 report → Share → type a message → Copy link → open the link in a new tab → the parent-facing view shows the built layout + the message; acknowledge works. `bunx tsc --noEmit` → no new errors.

#### Step A5 — One entry door (Reports page); hide the profile wizard

Wire `src/routes/reports.index.tsx` (gated on `hdp-report-builder`) so a "Generate report" **row
action** (single student) and the existing multi-select open the builder from the Reports page. **Hide
the per-student profile-launched wizard entry for the test build** so there is exactly one door.

**Verify**: `/reports` → select one P1 student → Generate → the full A2→A4 flow runs end-to-end; the student-profile "Generate" entry is not shown when `hdp-report-builder` is on.

### DEMO TRACK (P2 — additive; the cut-line if velocity slips)

#### Step B1 — Bulk generate + secondary auto-hide

Add a "Generate report(s)" action to the Reports-page floating bulk-action bar: configure one layout
once, then loop the selected students calling `generateReportFromStudent` + `addReport`, and
`toast.success('N reports generated')`. For **secondary** reports, render `layout ∩ available-data`
(auto-hide sections a student has no data for). P1 stays curated/complete (Step A0.2), so P1 shows no
empty sections.

**Verify**: multi-select 3 P1 students → Generate → 3 reports appear; for a secondary student lacking CCA, that section is absent (not an empty placeholder).

#### Step B2 — Extended holistic view (flag-gated, progression charts, NOT radar)

Behind `hdp-extended-template`, add an "Extended" template whose holistic blocks use **progression
visualizations**: recharts `LineChart`/`BarChart` of growth across terms + simple progress bars, colored
from `src/lib/chart-colors.ts` (`CATEGORICAL_6`, `SERIES_BLUE`, `CHART_*`). Create at most one new
component `src/components/reports/progression-chart.tsx`. **Do not use `radar-chart.tsx` here.**

**Verify**: enable `hdp-extended-template` → the Extended template appears; its holistic sections render progression/simple charts with no radar; `bun run build` → 0.

#### Step B3 — Gamified secondary sharing (blocked on design)

Behind a flag, a secondary share flow where the student adds a reflection, picks an illustration, and
customizes before forwarding to parents. **Blocked on Mun-Yee design assets** (illustration set,
reflection prompts). Build only after A0–A5 are solid and assets exist; otherwise leave a labeled stub
and report.

**Verify**: (when unblocked) secondary share flow runs happy-path with a chosen illustration + reflection visible in the shared view.

## Test plan

This is a prototype; do not chase the pre-existing 16 failing unit tests. Add focused tests only where
logic is non-trivial and side-effect-free:

- `src/data/report-layouts.test.ts` (create) — assert `P1_DEFAULT_LAYOUT` excludes `cca`/`via` and its
  block `key`s are a subset of `SECTION_DEFS` keys; model after an existing `src/data/*` or `src/lib/*`
  test structure.
- If a layout-merge/auto-hide helper is extracted (Step B1), unit-test `layout ∩ available-data`:
  a section with no data is dropped; a section with data is kept in order.
- Verification: `bun run test` → new tests pass; total = baseline + N, with the 37/16 baseline otherwise unchanged.

## Done criteria

ALL must hold:

- [ ] `bun run build` → exit 0.
- [ ] `bunx tsc --noEmit` → no NEW errors vs the captured baseline (touched files introduce 0).
- [ ] `bun run test` → no regression vs baseline; new layout tests pass.
- [ ] `bun run check` → exit 0.
- [ ] With `holistic-reports` + `hdp-report-builder` on: Reports → P1 student → Generate → build (toggle,
      reorder, viz) → Smart Compose → Share (message + copy link) → parent web-view shows the built
      layout + message. (Test-track walkthrough passes.)
- [ ] With `hdp-extended-template` on: Extended template renders progression charts, **no radar**.
- [ ] No P1 report surfaces `overallPercentage`/`A1–F9`.
- [ ] Only in-scope files modified (`git status`); no new dependency added to `package.json`.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report (do not improvise) if:

- The header **P1 prerequisite** is unmet (no real P1 section/field set) and you'd otherwise hardcode
  specific P1 descriptors.
- A "Current state" excerpt doesn't match the live code at HEAD (drift).
- Any step's verification fails twice after a reasonable fix.
- A step appears to require an out-of-scope file, a new npm dependency (e.g. a dnd library), or touching
  `radar-chart.tsx` for the extended view.
- Build velocity forces a cut: **cut the demo track (B1–B3) before touching the test track (A0–A5)** —
  and record it in `plans/README.md`.

## Maintenance notes

- **This prototype answers one question** (would teachers use it over SC). The test protocol — not code —
  must put SC in the room and ask "would you switch, and why"; otherwise the kill-criterion is
  unmeasurable. Recruit **P1** teachers for the test track; the gamified flow is a **secondary** concern.
- The real critical path is **human**: the P1 artifact sign-off (Q5) and Mun-Yee design (B3). Both can
  stall while code sits ready.
- **Session hygiene**: flags are in localStorage and `mockReports` mutates in memory — reset between the
  3–5 test sessions (hard refresh + seed reset, or a fresh browser profile) or session #3 shows dirty state.
- `layout` is intentionally a _template of intent_: P1 renders it fully (curated data); secondary
  auto-hides empty sections. A reviewer should confirm the two render behaviors and that `layout` stays
  optional (old reports still render).
- PG + data access are FLAGs in the source brief — the prototype mocks both; engineering must confirm the
  real path before any of this is de-prototyped.
