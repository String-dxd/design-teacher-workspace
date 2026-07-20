# Plan 036: Academics in the drafting workspace — marks entry, trend lines, results sync

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. STOP conditions are binding. Your
> reviewer maintains `plans/README.md`. Read the "Design constraints" section
> of `plans/028-hdp-module-foundation.md` first — binding (tokens, Inter
> sentence case — NEVER uppercase/mono labels, tabular-nums on figures, a11y,
> no celebratory styling).

## Status

- **Priority**: P1 (maintainer-requested 2026-07-16, wireframe-referenced)
- **Effort**: L
- **Risk**: MED (restructures the Draft Studio workspace; extends the report book)
- **Depends on**: plans 028–035 on branch `hdp-prototype-v2` (035 restructures
  `/reports/drafts` — this plan builds on its post-035 shape)
- **Decision notes**: trend lines were deferred as "Prototype B" in Round 8;
  the maintainer pulled them forward 2026-07-16. The reference wireframe's
  visual language (dark green, mono/uppercase micro-labels) is adapted to app
  tokens per the established PRD-§9 adaptation: structure yes, styling no.
  The wireframe's story rendering (cover reflection, validated-pattern
  chapters, "Amira adds" callouts) remains Phase 3 — explicitly NOT in scope.

## What to build

Three connected pieces:

1. **Marks data + trends (store layer, pure, tested)**
   - `src/types/hdp.ts` (additive): `AssessmentKind = 'wa1' | 'wa2' | 'exam'`;
     `HdpMarkEntry { subject, schoolYear, semester, assessment: AssessmentKind, score: number }`;
     `HdpMarksRecord { studentId, entries: Array<HdpMarkEntry> }`;
     `TrendDirection = 'climbing' | 'steady' | 'recovering' | 'easing'`.
     `HdpSubjectResult` gains optional `change?: number` (delta vs previous
     semester's semester-average, signed).
   - `src/data/hdp.ts`: `SEED_MARKS` — for every 3A student: 4–6 subjects
     (English, Mathematics, Science, Mother Tongue, Humanities…), FOUR
     semesters of history (2025 S1–2026 S2, current semester partially filled)
     with realistic 45–90 scores shaped so the demo students show each trend
     direction at least once.
   - `src/lib/hdp-store.ts` (append): `loadMarks(studentId)` /
     `saveMarkEntry(studentId, entry)` (upsert by subject+semester+assessment,
     localStorage key `hdp_marks`, seeded via the existing `seedIfEmpty`
     pattern); `semesterAverage(entries, subject, schoolYear, semester)`;
     `syncAcademicResults(studentId)` → snapshots the CURRENT semester's
     per-subject averages into the student's report book `results` (grade =
     rounded score as string, `change` = delta vs previous semester, `term` =
     current), stamps `marksSyncedAt` on the book (add the optional field).
     Snapshot semantics identical to `shareReportBook`: later mark edits do
     NOT mutate an already-synced book until synced again.
   - `src/lib/hdp-trends.ts` (new, pure): `trendForSubject(entries, subject):
{ direction: TrendDirection, points: Array<number> }` — points = the
     last 4 semester averages (oldest→newest, skip empty semesters);
     direction: `climbing` = last delta > +2; `easing` = last delta < −2;
     `recovering` = a dip then a rise (min is neither first nor last point and
     last > min + 2); else `steady`. Deterministic; no Date.now/random.
2. **Draft Studio → two-column workspace with a student switcher**
   (`src/routes/reports.drafts.$studentId.tsx`, building on the post-035 file)
   - Left rail (≥1024px; collapses to a top select/combobox below):
     the form-class student list — name, compact status line (evidence count ·
     draft status · marks synced?), current student highlighted
     (`aria-current="page"`), each row a `<Link>` to
     `/reports/drafts/{id}` so switching students never loses autosaved work.
   - Right column, top to bottom: **Marks** section — editable grid, one row
     per subject, columns WA1 / WA2 / Exam (this semester) as `<Input
inputMode="numeric">` with visible column headers + `<caption
class="sr-only">`, `tabular-nums`, autosave on blur via `saveMarkEntry`
     (quiet "Saved" indicator, same pattern as the draft autosave); each row
     ends with an inline trend: a small SVG sparkline (see piece 3's spec —
     same component) + the direction word in sentence case. Below the grid, a
     secondary Button "Sync academic results" → confirm dialog ("This writes
     {name}'s current marks into their report book. Comments are synced
     separately.") → `syncAcademicResults`, toast, "Synced {time}" line.
     Then the existing **Evidence** river (collapsible `<details>` or a
     region with a toggle — keep it reachable, it carries P3) and the existing
     **Comment** drafting sections (Suggest/ClaimEditor/Confirm — UNCHANGED
     mechanics).
   - Exactly one filled primary per state still holds (Suggest/Confirm own
     primary; "Sync academic results" stays secondary/outline).
3. **Report book: trends + change column** (`src/components/hdp/report-book.tsx`)
   **Flag gating (maintainer decision 2026-07-16)**: register a new flag
   `reports-hdp-future` in the feature-flag types + registry (label
   `'Future state (Prototype B)'`, description `'Switch the report rendering
and release flow to the Prototype B future state — trend lines, story
register with student reflections, student-first release. Off shows the
pragmatic Prototype A rendering.'`, stage `'Experiment'`, module
   `'reports'`, defaultValue `false`). The "Where things are heading" section
   AND the results Change column render ONLY when this flag is on (resolve the
   flag in the routes/pages that render `ReportBook` and pass a boolean prop —
   the component stays flag-free). The marks grid + sync in the workspace
   (piece 2) are Prototype A tooling — NOT flag-gated.
   - New component `src/components/hdp/trend-line.tsx`: pure inline `<svg>`
     polyline (viewBox ~120×24, `fill="none"`, `stroke="currentColor"`,
     `stroke-width="1.5"`, end dot `<circle>`), rendered `aria-hidden` — the
     adjacent direction word carries the meaning. Neutral color
     (`text-muted-foreground`); the direction WORD gets `font-medium
text-foreground`. No per-direction color coding, no axes, no numbers on
     the line.
   - New book section "Where things are heading", placed AFTER "Personal
     qualities" and BEFORE "Ask {name} about": one row per subject with ≥2
     semesters of data — subject name · TrendLine · direction word (sentence
     case: Climbing / Steady / Recovering / Easing). Quiet caption below:
     "Direction, not numbers, leads. Drawn from weighted assessments already
     recorded." Renders in BOTH `teacher-preview` and `parent` views; section
     absent (not empty) when no marks history exists.
   - Results table (appendix, stays LAST): add a right-aligned "Change" column
     rendering `+6` / `−2` (`tabular-nums`, true minus sign, no color), "—"
     when `change` is absent. Populated only via `syncAcademicResults`.

## Commands / gates

Use the baselines recorded by plan 035's review in `plans/README.md` (tsc
count, vitest totals — 034 changed both; verify before starting and record
what you see). Gates: tsc no NEW errors; vitest = prior passes + your new
tests, same known fails; `bun run build` exit 0; targeted prettier/eslint.
NEVER `bun run check`.

## Test plan

- `src/lib/hdp-trends.test.ts` (new, pure): one case per direction incl. the
  recovering shape (dip then rise); <2-semester input → `steady` with the
  points it has; deterministic across two runs.
- Extend `hdp-store.test.ts` (append; MemoryStorage stub): `saveMarkEntry`
  upserts (no duplicate subject+sem+assessment rows); `syncAcademicResults`
  writes results+change and is a snapshot (a later `saveMarkEntry` does not
  change the synced book); change math vs previous semester average.

## Browser verification

1. `/reports/drafts/{id}`: left rail lists the form class, current student
   highlighted; switching students preserves the previous student's unsaved-
   autosaved marks and draft (go back and check).
2. Marks grid: enter a score → blur → "Saved"; reload → persists; trend
   sparkline + word update after edits that cross a threshold.
3. Sync academic results → confirm → book preview (Release page) shows the
   updated Results with Change column; editing a mark AFTER sync does not
   change the book until re-synced.
4. Parent view (`/hdp-report/hdp-{id}` of a shared student): "Where things are
   heading" renders between comments and prompts with sparkline + direction
   words; appendix table has the Change column; NO uppercase, NO mono labels
   anywhere (grep the new files for `uppercase|font-mono` too).
5. Keyboard: marks grid tabbable in reading order; sparklines skipped by AT
   (aria-hidden) with direction words read.
6. 375px: left rail collapses; grid scrolls inside its container; no page-level
   horizontal scroll. 1280px: book measure unchanged (≤ ~80ch).

## STOP conditions

- Plan 035's post-state differs materially from what this plan assumes about
  `/reports/drafts` (report the actual shape; don't improvise a merge).
- The trend derivation needs more than the 4 mark shapes above to render the
  wireframe honestly — do not invent extra assessment kinds.
- Any need to touch `_guest.report-view` remnants, legacy files, or
  `composeDraft`'s signature.

## Maintenance notes

- `trendForSubject` is the single trend authority — the wireframe's "tap a
  line for the assessments behind it" is a natural follow-up (popover reusing
  the SourceTag lineage pattern); not in scope now.
- The story rendering (cover reflection, pattern chapters) remains Phase 3;
  when built, it consumes the same marks/trends data.
- Direction thresholds (±2) are demo-tuned constants — export them named.
