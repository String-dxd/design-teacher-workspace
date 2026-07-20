# Plan 040: Prototype B insight layer (F4-full) + reconcile gate (F4b) — teacher curates, AI composes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. STOP conditions are binding. Your
> reviewer maintains `plans/README.md`. Read the "Design constraints" section
> of `plans/028-hdp-module-foundation.md` first — binding. PRD reference:
> `docs/prd-hdp.md` §6 F4-full/F4b and §7 (`HdpInsight`).

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED (changes the drafting flow when the B flag is on; provenance
  rules must survive)
- **Depends on**: plans 028–039 on `hdp-prototype-v2` (036 = marks +
  `reports-hdp-future` flag + trends; the Draft Studio workspace shape is
  post-035/036)

## Why this matters

Prototype B's authorship model: **before any generation, the student's data
surfaces as numbered, selectable insights** — explicitly a curation list, not
a dashboard. The teacher selects which insights belong in this comment; the
composer builds ONLY from the selection; every claim's source traces to an
insight and its underlying record. This replaces "AI drafts, teacher reviews"
with "teacher curates, AI composes". The reconcile gate (F4b) adds the
sentiment-vs-trajectory tripwire on Confirm. All behind `reports-hdp-future`
— flag off, Draft Studio behaves exactly as today (F4-lite).

## What to build

1. **Types + data** (PRD §7, additive):
   - `src/types/hdp.ts`: copy the PRD's `InsightKind` and `HdpInsight`
     interfaces verbatim (kinds: observation, pattern, trajectory,
     attendance, cca, conduct, via, competition, promotion).
     `HdpDraft` gains optional `insightIds?: Array<string>` and
     `reconcile?: { fired: boolean; resolution?: 'revised' | 'kept-with-context' }`
     (PRD shape).
   - `src/data/insights.ts` (new): `insightsForStudent(studentId):
Array<HdpInsight>` — DERIVE dynamically where possible (observations
     from `tagsForStudent`, patterns from confirmed `FormingPattern`s,
     trajectory inflections from 036's `trendForSubject` — e.g. "Mathematics
     recovering across 3 semesters"), plus SEEDED static facts (attendance,
     CCA, conduct, VIA, competition, promotion status with realistic formats
     e.g. `B4`, "Value-in-Action: 12 hours") for the 3 demo students +
     several 3A students. Every insight: one-line `label` (behaviour/fact in
     context, no trait words), `sourceRef` per the PRD shape,
     `selectable: true` except promotion (selectable false — renders but
     can't be curated into a comment; it's context).
2. **Curation step in the Draft Studio student workspace** (flag on only):
   between the evidence river and the claim editor, an **Insights** section:
   a numbered `<ol>` of insight rows — number (`tabular-nums`), one-line
   label, kind rendered as a `TagPill`, checkbox (`ui/checkbox`, visible
   label = the insight label). "Suggest a draft" is DISABLED until ≥1
   insight is selected, with helper text "Select the insights that belong in
   this comment." Zero insights at all ⇒ the existing P4 empty state
   (unchanged). The B-mode Suggest calls a new pure
   `composeFromInsights(insights, kind, studentName): Array<DraftClaim>`
   in `src/lib/hdp-draft-compose.ts` (append; do NOT change `composeDraft`'s
   signature — it remains the A path): claims derive ONLY from selected
   insights; `source.label` = "Insight {n} · {kind}"; source popover resolves
   through the insight to its underlying tag when `sourceRef.system ===
'tw-river'`, otherwise shows the insight fact line. Same denylist +
   determinism rules as `composeDraft`. Store the selection on the draft
   (`insightIds`).
3. **Reconcile gate (F4b)**, flag on only: on Confirm, run a pure
   `reconcileCheck(claims, trends): { fired: boolean; subject?: string }` —
   fires when any claim text contains positive-progress phrasing (a small
   fixed keyword list, e.g. improved/growth/progress/consistent) while the
   student's trend for the draft's subject (or majority of subjects for
   `overall`) is `easing`, or vice versa (struggle phrasing + `climbing`).
   When fired: an `alert-dialog` — title "The comment and the marks point in
   different directions", body naming the subject + direction, actions
   **"Revise"** (returns to editing) and **"Keep — add context"** (confirms,
   records `reconcile: { fired: true, resolution: 'kept-with-context' }`).
   Not fired ⇒ confirm proceeds, `reconcile: { fired: false }`. This is a
   judgement tripwire, not a nag — no red styling.
4. **Family-facing provenance (PRD B.4, first honest slice)**: in
   `ReportStory` (037), the "Personal qualities"/pattern-chapter prose gains
   one attribution variant: claims whose draft was composed via insights
   render a per-SECTION line "Drafted from {n} insights selected by
   {teacher}; sentences added by the teacher are their own words." — copy
   only, no per-sentence badges (the visual language for per-sentence
   AI-marking is an open design question, PRD §11.12 — do not invent one).

## Gates

Baselines from plan 039's review record in `plans/README.md` (verify + record
first). No new tsc errors; new tests pass; same known fails; build 0;
targeted prettier/eslint. NEVER `bun run check`.

## Test plan

- `hdp-draft-compose.test.ts` (append): `composeFromInsights` — claims only
  from selected insights (feed 5, select 2, assert no claim references the
  unselected 3); denylist holds; deterministic; zero selected → `[]`.
- New `src/lib/hdp-reconcile.test.ts` (or append): fires on
  positive-phrasing + easing trend; fires on struggle-phrasing + climbing;
  does NOT fire when aligned; `overall` uses majority rule.
- `hdp-store.test.ts` (append): draft persists `insightIds` and `reconcile`.

## Browser verification (flag ON unless stated)

1. Draft Studio student page: numbered insight list renders (derived + seeded
   kinds present); Suggest disabled until a selection; suggested claims'
   popovers trace to the selected insights only.
2. Selecting different insights and re-suggesting produces correspondingly
   different claims (curation is real).
3. Reconcile: craft a mismatch (positive comment on an easing subject) →
   dialog fires; "Keep — add context" confirms and the draft records it;
   aligned confirm → no dialog.
4. Flag OFF: Draft Studio identical to pre-plan (no insights section, Suggest
   enabled per the A rules); A provenance unchanged.
5. Story register shows the drafted-from-insights attribution line for an
   insight-composed draft.
6. Keyboard: checkboxes labelled; numbered list order matches visual order.

## STOP conditions

- Preserving `composeDraft` for A while adding `composeFromInsights` proves
  impossible without changing A behaviour — report.
- The reconcile heuristic needs sentiment analysis beyond the keyword list —
  do NOT add a model/library; report if the keyword approach reads as absurd
  in the seeded data.
- Any pressure to make insights a dashboard (charts, aggregates) — the PRD
  explicitly forbids it; render a list.

## Maintenance notes

- The keyword sentiment list is a placeholder tripwire; the PRD's eval-set
  requirement stands before any real model ships.
- `insightsForStudent`'s derived/seeded split is where real data sources
  (Cockpit/SDT/STP, PRD §7.1) later plug in — keep `sourceRef.system` honest.
- Per-sentence AI-vs-teacher marking for parents remains an open design
  question (PRD §11.12) — only the section-level attribution ships here.
