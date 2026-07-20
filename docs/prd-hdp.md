# PRD — Reports (HDP) Module for Teacher Workspace

**Repo:** `String-dxd/design-teacher-workspace` · suggested location: `docs/prd-hdp.md`
**Status:** Draft v3 for team review
**Owner:** Reza (Design)
**Date:** 16 Jul 2026
**v3 changes:** restructured around the two-prototype plan agreed in team sessions — **Prototype A (low-hanging fruit, sub-split A1 parent-facing / A2 teacher-facing)** and **Prototype B (holistic portrait — insight layer, trend lines, richer data)**, per the HDP Prototype Brainstorming (23 Jun), Design Crit — HDP Report Gen (14 Jul), and report-card redesign session with Grace (15 Jul). Smart Compose integration and the insight-selection step added to drafting; data-source dependencies (School Cockpit, SEI, SDP, SDT, STP) made explicit.
**v2 changes:** visible invocation (global FAB + entry points); dedicated Reports module with tools grid; value-loop phasing; retention-led metrics; negative-observations position; data lifecycle.
**Concept lineage:** Concept 06 v2 (Tag Queue → Semester Wrapped) is the concluded design direction, supported by the journey map (01 v2), workload model + national as-is bill (04), three-act release flow (02 v2), and report book rendering (06b).

---

## 1. Background

The HDP is produced twice a year through a workflow nobody owns: form teachers chase subject teachers for comments over WhatsApp and spreadsheets, subject teachers reconstruct a semester from memory in a weekend, everything is merged by hand, re-keyed into School Cockpit, then printed, distributed, signed, and filed. Modelled nationally (207,639 secondary students, 13,049 teachers, ~6,290 form classes), this costs roughly **375,000 hours a year — about 180 full teacher-years** — and the output is still a snapshot that evaporates each cycle.

Singapore teachers report a 47.3-hour week (OECD average 41); the most-cited stress source is administrative work (53%). This module attacks the named problem.

**The product bet:** capture observations as lightweight, _fully discretionary_ tags in the moment; consolidate them automatically per student; repair coverage gaps with targeted broadcasts; draft comments whose every claim carries an inline source; and render one dataset three ways for families — a swipeable story, a chaptered report, and a formal digital report book.

**The riskiest assumption** (everything else is downstream of it): _teachers will voluntarily tag, repeatedly, without a mandate._ §5 sequences the plan to test this as early and cheaply as possible.

## 2. Goals

1. **Reduce reporting-cycle hours** with the explicit floor that no teacher or student is ever worse off than as-is (an uncovered student costs exactly what they cost today).
2. **Raise the quality floor of comments** — evidence-grounded, individual, verifiable.
3. **Give form teachers who don't teach their own class** a structural information supply (river + broadcast) replacing manual collection.
4. **Make the released HDP a conversation artifact**, not a verdict.

### Non-goals

- Replacing School Cockpit as system of record (TW owns workflow; Cockpit keeps the record).
- Marking integration (marking is not in TW; tags may record "while marking" as context only).
- Any scheduled or mandated capture. No tagging quota, ever.
- Ranking, percentiles, or numeric disposition scores anywhere, including internal APIs.
- **Concern/safeguarding records.** HDP observations are strengths-and-growth only (see §6.0.4). A pathway for worrying observations is explicitly out of scope and must not be improvised inside this module.
- Primary schools.

## 3. Guiding principles (product law — each testable in review)

| #   | Principle                                          | Concrete test                                                                                                                                           |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Zero mandated capture**                          | A teacher who never tags experiences no new obligations, nags, badges, or degraded workflow.                                                            |
| P2  | **Floor: no worse than as-is**                     | The uncovered-student path (write from scratch) gains zero added steps.                                                                                 |
| P3  | **Provenance or labelled opinion**                 | Every AI-drafted claim has an inline source; unsourced teacher additions are visibly labelled "your addition" — never given a fabricated source.        |
| P4  | **No draft without evidence**                      | Zero tags ⇒ honest empty state, never a generated comment.                                                                                              |
| P5  | **Patterns are candidates**                        | Cross-context repetition renders as "candidate thread, unconfirmed" until a teacher confirms. Behaviour in context, never traits.                       |
| P6  | **Anti-scoreboard**                                | No number compares students. Trajectories are self-referential. Disposition counts are provenance ("5 observations · 3 teachers"), not scores.          |
| P7  | **Coverage is a diagnostic, not a KPI**            | Coverage is visible only to the form teacher for their own class. No leadership or cross-class view exists. Pilot comms never state a coverage target.  |
| P8  | **Throttled family cadence**                       | Release is per-semester; no live feed exists to poll.                                                                                                   |
| P9  | **Student-first release**                          | Student reacts, reflects, and curates before family release; reflection gates shareability.                                                             |
| P10 | **Capture is ambient, Reports is the destination** | Tagging is invocable from anywhere (FAB, rows, ⌘K); the Reports section is where accumulation becomes output. Tagging is never _filed under_ reporting. |

## 4. Personas

- **Subject teacher** (~160 students, ~5 classes of ~33). Discretionary tagger; wants comments done fast and defensibly.
- **Form teacher** (form class of 33; often co-form; may not teach their own class). Consolidates, broadcasts, authors the overall remark from colleagues' inputs.
- **Student (Sec 1–4).** First audience: reads, reacts, reflects, curates, releases.
- **Parent/guardian.** Receives the release, acknowledges digitally, responds once with a note to the child.
- **School-defined checker** _(unvalidated)_. Configurable review slot only; do not hardcode a role. ("Reporting Officer" means EPMS appraisal supervisor in MOE — do not use the term.)

## 5. The two prototypes — "start here, stretch here"

The team's agreed narrative is deliberate: **Prototype A shows credible small wins on today's data; Prototype B shows the aspirational holistic portrait.** Two versions risk confusing stakeholders, so the framing rule is fixed: A is "your existing report card, and more — not a replacement"; B is "where this goes once the data layer exists." Present them in that order, always together.

### Prototype A — Low-hanging fruit

**A1 — Parent-facing digital HDP.** A "glorified digital HDP" built entirely on **existing data sources** (School Cockpit, SEI, existing SDP data): the digital report book rendering (Concept 06b) with parent prompts ("ask me about"), digital acknowledgement replacing the signature chase, and the collaboration/commenting flow for families. No new capture required — this ships value even if tagging adoption is zero.
_Features: F6 report-book rendering (subset) · parent prompts · acknowledgement · family comment flow._

**A2 — Teacher-facing workflow.** Matches teachers' current mental model and kills the named pain: the WhatsApp-to-Excel comment collection process. Consolidation river, coverage diagnostic, broadcast, and drafting **integrated with Smart Compose** — the drafting step lives inside the workflow rather than requiring teachers to go to Smart Compose separately, which is where today's time is lost.
_Features: F0 entry points & Reports IA · F1 Tag Queue · F2 river · F2b Term Summary · F3 broadcast · F4-lite (Smart Compose in-flow, sourced from river where tags exist)._

### Prototype B — Holistic portrait ("truly holistic")

The stretch vision (direction led with Grace). Everything in A, plus:

1. **Insight layer before generation:** data from School Cockpit, SDT, etc. surfaced as **numbered, selectable insights** — explicitly not a dashboard. The teacher selects which insights matter for this student; the AI generates a personalised summary from the selection. This replaces "AI drafts, teacher reviews" with "teacher curates, AI composes" — a stronger authorship model.
2. **Trend lines & trajectories:** self-referential per-subject trend sparklines (report book results column, full-report direction words, Wrapped climb card), inflection surfacing, and tag-trajectory correlation candidates. All P6-compliant: student vs self only.
3. **Richer data set:** real grade formats (e.g. B4), attendance, CCA, conduct, VIA, competition/event records, promotion status.
4. **Provenance, extended to families:** AI-generated vs teacher-written content explicitly distinguished in parent-facing renderings; personal qualities carry authorship ("based on observations by subject teachers"). Reduce AI-sounding language throughout.
5. **Narrative arc:** the "comeback story" framing retained as the signature of the Wrapped/story rendering.
6. **Explicitly excluded for now:** peer/classmate sections (removed to avoid debate).

_Features: full F4 (insight-selection + sourced generation) · F4b reconcile gate · F5 three-act release · F6 all three renderings incl. Wrapped · forming patterns as selectable insights._

### Feature-to-prototype map

| Feature                      | A1                      | A2                      | B                            |
| ---------------------------- | ----------------------- | ----------------------- | ---------------------------- |
| F0 Entry points & Reports IA | —                       | ●                       | ●                            |
| F1 Tag Queue                 | —                       | ●                       | ●                            |
| F2 River / F2b Term Summary  | —                       | ●                       | ●                            |
| F3 Broadcast                 | —                       | ●                       | ●                            |
| F4 Drafting                  | —                       | ◐ Smart Compose in-flow | ● insight layer + generation |
| F4b Reconcile gate           | —                       | —                       | ●                            |
| F5 Three-act release         | ◐ acknowledgement only  | —                       | ●                            |
| F6 Renderings                | ◐ report book + prompts | —                       | ● all three, trend lines     |

### Validation sequence (unchanged in spirit)

**Phase 0 behavioural probe** (voluntary tagging, kill/proceed criterion pre-registered) and the **as-is time-diary study** run before A2's capture loop is treated as validated. A1 does not depend on the probe — it is buildable immediately on existing data, which is exactly why it leads the stakeholder story.

**Prototype-specific risks (from team sessions):**

- **STP data needed for B may not currently exist** — pre-work required; B's data appendix (§7.1) must be verified field-by-field before commitment.
- **Change management is a real cost**, not just build effort — A's "existing report card, and more" framing is the mitigation.
- **Generic-comment risk already exists today** — both prototypes must demonstrably beat the current quality floor, or the AI angle reads as automating the existing problem.
- **Two-version stakeholder confusion** — the framing rule at the top of this section is the control; never show B without A.

**Cross-cutting dependency:** School Cockpit sync (format unknown, §11). Prototypes ship "Download ingest file" fallback + persistent `Synced · Xm ago` status pattern.

**Build priority within A2 (if cut):** F0 + F1 → F2 → F2b → F3.

---

## 6. Feature specifications

### F0 — Entry points & information architecture

_Design position: invocation must be visible, not memorised. Capture is ambient (P10); the Reports section is the destination that shows the whole cycle and all its tools._

**F0.1 Global Tag FAB**

1. One floating action button, **global and single-purpose**: it always means "tag a student." It is never a speed-dial and never changes meaning per module — predictability is the habit mechanism.
2. Placement: bottom-right, thumb-zone, safe-area aware on mobile. **Slot conflict with the AI assistant bubble must be resolved at app level** — proposed: FAB owns bottom-right; assistant moves to top-bar entry. Decide before build; do not stack them.
3. Tap → Tag Queue overlay (F1), context pre-filled from current route (class page → "during lesson"; CCA group → "cca").
4. Desktop parity: persistent `+ Tag` button in the top bar; `⌘K` retained as accelerator only (never the sole path).
5. FAB is present on all authenticated routes except inside the Tag Queue itself and full-screen release previews.
6. Suppression rule (P1): the FAB never badges, pulses, or nags. It is an offer, not a reminder.

**F0.2 Row-level entry points**
Anywhere a student row renders (class rosters, groups, student profile header, search results): a quick-tag affordance (hover action desktop / swipe or overflow mobile) opening F1 with the student pre-selected. This is the second-most-used invocation after the FAB; it removes the search step entirely.

**F0.3 The Reports section (sidebar item: "Reports")**
A dedicated module in primary navigation housing the end-to-end workflow. Named in teacher-language ("Reports"), not policy-language ("HDP").

_Reports home = cycle overview + tools grid:_

1. **Cycle header:** current semester, reporting-window dates, cycle state (Observing → Window open → Drafting → Review → Released) shown as **stages, not a stepper** — Observe never closes, and no stage visually locks the others for capture-related tools.
2. **My classes strip (form teachers):** per-class coverage diagnostic (n/33, thin-record count) — visible to that form teacher only (P7).
3. **Tools grid — all tools visible with states:**

| Tool                 | Route                             | State logic                                             |
| -------------------- | --------------------------------- | ------------------------------------------------------- |
| Tag Queue            | `/reports/tag` (also FAB/overlay) | Always available                                        |
| Term Summary         | `/reports/summary`                | Always available (F2b)                                  |
| Students / River     | `/reports/students/$id`           | Always available                                        |
| Coverage & Broadcast | `/reports/broadcast`              | Always; broadcast actions rate-limited                  |
| Draft Studio         | `/reports/drafts`                 | "Opens when the reporting window opens" until then      |
| Review & Sync        | `/reports/review`                 | Locked until drafts exist; shows Cockpit sync status    |
| Release Manager      | `/reports/release`                | Phase 3 — visible, labelled "coming later" in prototype |
| Renderings Preview   | `/reports/render/$id`             | Phase 3 — same                                          |

Locked tools render as visible, explained cards ("opens when…") — the grid passively teaches the whole cycle. Locked ≠ hidden.

4. **Cross-links:** the river also surfaces as a tab on the existing Student profile in the Students module; Reports is not a silo.

**Acceptance criteria (F0)**

- From any authenticated route, a tag can be started in one tap (FAB) or one hover-action (row).
- The FAB's meaning is identical on every route.
- Reports home renders all eight tools with correct state labels; no tool is hidden by phase.

---

### F1 — Tag Queue

**User story:** As any teacher, when I notice a student behaviour worth remembering, I record it in ~8 seconds from anywhere without losing my place.

**Requirements**

1. Invocation: FAB / top-bar `+ Tag` / row-level quick-tag / `⌘K` accelerator (F0). Opens as overlay (Base UI Dialog); full-sheet on mobile.
2. Search: type-ahead across the teacher's associated students (teaching classes, form class, CCA groups). Must handle Singapore's name space: Chinese, Malay (incl. bin/binte), Indian names; match on any name token and preferred name; row shows class, relationship, term tag count.
3. Composer is **stacked, never horizontal-cramped**: search → selected student → disposition chips (wrapping) → actions.
4. Dispositions: Perseverance, Curiosity, Collaboration, Self-direction (ship fixed; configurable later). Number keys 1–4 select chips (desktop speed path).
5. Save on `Enter` / tap. Toast (sonner); overlay persists for consecutive tags; `Esc` closes and restores focus.
6. Optional, never required: 1-line note (≤140 chars), evidence attach (mock).
7. Context auto-suggested from invoking route; editable.
8. Side panel (desktop): "Your term in numbers" — totals, median seconds, disposition mix bar, per-class coverage diagnostic.
9. Recent stream of own tags; editable/deletable within 24h.
10. **Scope rule (per §2 non-goals):** the composer offers no negative/concern categories. Microcopy near the note field: "For concerns about a student's wellbeing, use your school's usual channels."

**Acceptance criteria**

- FAB → saved tag with a known student: ≤3 interactions.
- Zero-tag teacher sees no nag anywhere (P1).
- Overlay never mutates the underlying screen's state.

**Analytics (prototype: localStorage):** `tag_created {duration_ms, context, entry_point, has_note, has_evidence}`, `entry_point ∈ fab | topbar | row | cmdk`.

---

### F2 — Consolidated student view ("the river")

1. Per-student route: header (name, `11 tags · 4 teachers · 3 contexts`), `+ Add my observation` (opens F1 pre-filled).
2. Stream item: week marker, author + context, disposition pill, quoted note, evidence indicator; own items editable.
3. **Forming patterns:** same disposition in ≥2 _distinct_ contexts ⇒ candidate card labelled "candidate thread, unconfirmed" (P5); contributing pills are the screen's only accent elements (§9).
4. Disposition mix bar — proportions, no numeric axis (P6).
5. Visibility: form teachers see the full river for their form class; subject-teacher visibility (own tags vs full river) is **open question Q4** — build behind a flag defaulting to own-tags + confirmed threads.

### F2b — Term Summary (the same-cycle payoff)

_The value loop for Phase 1: consumption of capture before drafts exist._

1. Route `/reports/summary`: per teacher, per class — tags this term, moments worth revisiting (most-noted students, recent notable quotes), forming patterns across their classes, thin-record diagnostic.
2. Framed as _useful now_ (PTM prep, check-in prompts), not as reporting progress.
3. Never renders a class-vs-class or teacher-vs-teacher comparison (P6/P7).

### F3 — Broadcast

1. Entry: coverage diagnostic → thin-record list → compose.
2. Recipients auto-resolved as the union of teachers timetabled to the selected students — **depends on timetable/association data in mock (`src/data/timetable.ts`); listed dependency**. Editable; never school-wide.
3. Templated message with the effort promise ("2 taps, 10 seconds").
4. Responder card: student, requester, disposition chips, **first-class `Nothing stood out` chip** — an explicit nil is recorded, distinct from silence, and marks the student "reviewed — nothing noted (teacher, date)".
5. Rate limit: 1 outstanding broadcast per form class; 7-day cooldown (tune in research).
6. Results visible to requester only; never to leadership views (P7).

### F4 — Drafting: Smart Compose in-flow (A2) → insight layer + generation (B)

**F4-lite (Prototype A2).** Drafting integrates **Smart Compose inside the reporting workflow** — teachers never leave the flow to generate a comment, which is where today's time is lost. Where a student has river content, Smart Compose is seeded with it and outputs carry inline sources; where the river is empty, it behaves as Smart Compose does today (no fabricated provenance — P3/P4 hold even in lite mode).

**F4-full (Prototype B) — the insight layer.**

1. **Before any generation**, the student's data is surfaced as **numbered, selectable insights** — river observations, forming patterns, trajectory inflections, attendance/CCA/VIA/conduct facts. Explicitly _not_ a dashboard: a curation list. The teacher selects which insights belong in this comment.
2. Generation composes **only from selected insights**; every claim carries an inline `SourceTag` tracing to the insight and its underlying record. Selection is the authorship act — "teacher curates, AI composes."
3. Zero selectable insights ⇒ honest empty state: write from scratch or broadcast first (P4).
4. Unsourced teacher-added sentences auto-label `your addition`; no mechanism can attach a source content doesn't derive from (P3). In family renderings, AI-generated and teacher-written content are **explicitly distinguished** (B provenance requirement).
5. Actions: Confirm · Edit (Tiptap) · Regenerate from selection. Confirm freezes content + provenance snapshot.
6. **F4b Reconcile gate (B):** fires on Confirm only when comment sentiment and subject trajectory disagree. _Revise_ / _Keep — add context_ (legitimate; recorded for the form teacher).
7. **Language:** reduce AI-sounding phrasing; the eval set (below) includes a register check against sampled real teacher comments.
8. **Prototype honesty:** in this repo, generation is handcrafted fixtures per seeded student; flows validate UI, not model behaviour. Model behaviour ships only with an **eval set**: fixture rivers + insight selections with known ground truth, asserting zero invented facts, zero causal claims, zero trait language, zero cross-student comparison, and register within tolerance.

**AI behaviour spec (binding):** the model may compress, order, and connect **selected, sourced** insights; it may not introduce facts, traits, causal claims, diagnoses, or comparisons. Trajectory statements must verify against the markbook mock. Behaviour-in-context phrasing only ("returned to failed problems", never "is resilient").

### F5 — Three-act release · F6 — Renderings _(Phase 3 — directional)_

Summarised for continuity; acceptance criteria intentionally deferred to a Phase 3 spec.

- **Act 1 Private:** student-first window (default 3 days, school-configurable); per-thread reactions (Agree / It's more complicated / Add my side); reflection ≥3 sentences gates sharing; reflections never vetted (profanity filter only).
- **Act 2 Curated:** reflection becomes the cover; ≤5 spotlighted evidence items; retire rights; exact family preview.
- **Act 3 Shared:** one parent note, addressed to the child; digital acknowledgement replaces the signature chase; no feed.
- **Renderings:** Story (5 cards ≈45s, all stats self-referential, one peak card), Full report (chaptered, marks appendix last), Report book (formal register, trend sparklines, sourced serif prose, dispositions as observation counts, student's words section, tap-to-acknowledge). Marks lead in the report-book register by design.

---

## 6.0.4 Position: negative & sensitive observations

HDP tags are **strengths-and-growth only**. The disposition set contains no negative categories, and the composer's microcopy routes concerns to existing school channels. Rationale: (a) family-facing renderings and broadcast responder cards are the eventual destinations of river content — safeguarding-adjacent notes must never travel those paths; (b) a growth record that quietly accepts concern notes becomes a shadow discipline file with none of the governance that requires. The known cost — the record is structurally positive and therefore partial — is accepted and should be stated in teacher onboarding, not hidden. A proper concerns pathway is a separate product with different visibility, retention, and access rules.

## 7. Data model (→ `src/types/hdp.ts`)

```ts
export type DispositionId =
  | 'perseverance'
  | 'curiosity'
  | 'collaboration'
  | 'self-direction'
export type TagContext = 'lesson' | 'marking' | 'cca' | 'form-time' | 'other'
export type SchoolYear = `${number}` // e.g. '2026'

export interface HdpTag {
  id: string
  studentId: string
  authorId: string
  disposition: DispositionId
  context: TagContext
  note?: string // ≤140 chars
  evidenceIds: string[]
  source: 'self' | 'broadcast'
  entryPoint: 'fab' | 'topbar' | 'row' | 'cmdk'
  schoolYear: SchoolYear
  term: 1 | 2 | 3 | 4
  lifecycle: 'active' | 'archived' | 'retired-by-student' // archived at year rollover; retirement per F5 Act 2
  createdAt: string
  editableUntil: string // createdAt + 24h
}

export interface HdpEvidence {
  id: string
  kind: 'image' | 'file' | 'link' | 'assessment-ref'
  title: string
  ref: string
  lifecycle: 'active' | 'archived' | 'retired-by-student'
}

export interface FormingPattern {
  id: string
  studentId: string
  disposition: DispositionId
  contexts: TagContext[] // ≥2 distinct
  tagIds: string[]
  status: 'candidate' | 'confirmed' | 'dismissed' | 'retired-by-student'
  confirmedBy?: string
  schoolYear: SchoolYear
}

export interface BroadcastRequest {
  id: string
  formClassId: string
  requesterId: string
  studentIds: string[]
  recipientIds: string[] // resolved from timetable mock — listed dependency
  message: string
  createdAt: string
  responses: BroadcastResponse[]
}

export interface BroadcastResponse {
  recipientId: string
  studentId: string
  result: { kind: 'tag'; tagId: string } | { kind: 'nothing-stood-out' }
  respondedAt: string
}

export interface DraftClaim {
  text: string
  source?: { tagId: string; label: string } // absent ⇒ rendered "your addition"
}

export interface HdpDraft {
  id: string
  studentId: string
  kind: 'subject' | 'overall'
  authorId: string
  claims: DraftClaim[]
  status: 'draft' | 'confirmed'
  reconcile?: { fired: boolean; resolution?: 'revised' | 'kept-with-context' }
}

export interface CoverageSnapshot {
  classId: string
  total: number
  covered: number // ≥1 active tag OR explicit nil this term — measures process, not richness; label it "reviewed" in UI copy
  reviewedNil: number
}
```

**Lifecycle rules (minimum viable position, governance review pending):** tags archive (read-only, still thread-eligible for longitudinal views) at school-year rollover; student transfer moves the river with the student within MOE; a departing teacher's tags remain school records with authorship intact; student retirement (F5 Act 2) removes items from family renderings but not from the teacher-facing record; hard retention limits TBD with governance (§11 Q7).

**Mock data:** `src/data/hdp.ts` — one form class (33 students), 4 teachers, ~120 tags across mixed entry points, 6 thin records, 2 forming patterns, 1 broadcast with mixed responses including nils; `src/data/timetable.ts` for recipient resolution; **`src/data/insights.ts`** (Prototype B) — per-student numbered insights spanning river, trajectory inflections, attendance, CCA, conduct, VIA, competitions, promotion status, with realistic grade formats (e.g. B4).

```ts
// Prototype B — insight layer
export type InsightKind =
  | 'observation' // river tag/note
  | 'pattern' // forming pattern
  | 'trajectory' // trend/inflection, self-referential
  | 'attendance'
  | 'cca'
  | 'conduct'
  | 'via'
  | 'competition'
  | 'promotion'

export interface HdpInsight {
  id: string
  studentId: string
  kind: InsightKind
  label: string // one-line, numbered in UI
  sourceRef: {
    system: 'tw-river' | 'cockpit' | 'sdt' | 'sei' | 'sdp'
    recordId: string
  }
  selectable: boolean
}
```

### 7.1 Data-source dependency map (verify before Prototype B commitment)

| Source                 | Feeds                                          | Status                                                                   |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| School Cockpit         | grades (B4 formats), conduct, promotion status | Exists; ingest/egress format unknown (§11 Q1)                            |
| SEI                    | A1 parent-facing data                          | Exists per team sessions                                                 |
| SDP (existing)         | A1 report content                              | Exists per team sessions                                                 |
| SDT                    | B insight layer                                | To verify field-by-field                                                 |
| STP                    | B holistic fields                              | **May not currently exist — pre-work required** (flagged in Design Crit) |
| TW river (this module) | observations, patterns                         | Built here                                                               |

## 8. Routes & repo integration

```
src/routes/reports/
  index.tsx                    // F0.3 Reports home: cycle stages + tools grid + coverage strip
  tag.tsx                      // F1 full-page variant (overlay is global)
  summary.tsx                  // F2b Term Summary
  students/$studentId.tsx      // F2 river
  broadcast/index.tsx          // F3
  drafts/$studentId.tsx        // F4 (phase 2)
  review.tsx                   // sync status + confirm queue (phase 2)
  release/$studentId.tsx       // F5/F6 (phase 3 — stub with "coming later")
src/components/hdp/            // module components (§9.3) incl. TagFab, ToolsGrid
src/lib/flags.ts               // flags: 'reports', 'reports-river-visibility'
```

Conventions: Bun only; Shadcn on Base UI primitives (`base-maia`) via `bunx shadcn@latest add`; Tailwind v4 CSS variables; Lucide; sonner; sparklines as hand-rolled inline SVG (skip Recharts unless a chart genuinely needs it). River tab also mounts on the existing Student profile route (cross-link, F0.3.4).

## 9. Design specification

### 9.1 Direction

Concept artifacts use a "minimal wireframe + single accent" system deliberately: grayscale is structure; **one accent marks each screen's key element**. Implementation uses the app's existing Kind Utility tokens; where a token below conflicts, **the app token wins** — this spec defines roles, not new hex values.

### 9.2 Tokens (Tailwind v4 `@theme`)

```css
--color-hdp-accent: var(--color-primary, #0f6b54);
--color-hdp-accent-soft: #edf4f1;
--color-hdp-ink: #111214;
--color-hdp-soft: #6e7073;
--color-hdp-faint: #a8aaad;
--color-hdp-border: #ececeb;
--color-hdp-border-strong: #dededc;
--radius-hdp-card: 10px;
--radius-hdp-chip: 9999px;
```

Micro-labels (eyebrows, provenance): mono stack, 10px, 0.08em tracking, uppercase. No new display face.

**Single-accent rule (binding):** exactly one accent-coloured element class per screen — F1 the selected chip; F2 the pattern trace; F2b the "worth revisiting" items; F3 the broadcast card; F4 the source tags; Wrapped the peak card; Reports home the current cycle stage. The **Tag FAB is the sanctioned exception**: it is accent-filled globally because it _is_ the key element of the whole app's capture story. Status colours (amber/red) from app tokens, state only.

### 9.3 New components (`src/components/hdp/`)

| Component                                      | Anatomy & rules                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `TagFab`                                       | 56px (48px compact), accent fill, Lucide `tag` or `plus`; fixed bottom-right, `env(safe-area-inset-*)` aware; z-index below dialogs, above content; hidden inside Tag Queue and full-screen previews; **never badges or pulses** (P1). Desktop top-bar sibling `+ Tag` button, secondary style. |
| `TagQueueOverlay`                              | Command-palette pattern (Base UI Dialog + Input); stacked rows; chips wrap; `Enter` saves, `Esc` restores focus; 560px desktop, full-sheet mobile; number keys 1–4 select chips.                                                                                                                |
| `DispositionChip`                              | Pill, 1px border-strong, 5/12px padding, 11.5px/500; selected: accent border + soft fill; ≥44px touch target on mobile.                                                                                                                                                                         |
| `RowQuickTag`                                  | Hover action (desktop) / overflow item (mobile) on any student row; opens overlay pre-selected.                                                                                                                                                                                                 |
| `ToolsGrid` / `ToolCard`                       | Reports home grid; card = icon, name, one-line description, state line ("opens when the reporting window opens"); locked cards full-opacity with state label — **locked ≠ dimmed-out-of-existence**.                                                                                            |
| `CycleStages`                                  | Horizontal stage labels (Observing → Window → Drafting → Review → Released); current stage accented; explicitly _not_ a stepper — no connective progress line, no checkmarks.                                                                                                                   |
| `StreamItem`                                   | Grid `34px                                                                                                                                                                                                                                                                                      | 1fr`; name 13px/600 ink + `TagPill` + context meta; quote 12px soft, min 2 lines before truncation. |
| `TagPill`                                      | Mono 9px uppercase, 3/8px, gray fill; `.key` variant accent-soft.                                                                                                                                                                                                                               |
| `PatternCard`                                  | 1.5px accent border; label "FORMING PATTERN"; basis line includes context count; literal status "candidate thread, unconfirmed".                                                                                                                                                                |
| `CoverageBar`                                  | 8px track, accent fill, no axis; percentage never larger than meta text (P7 anti-KPI styling); UI copy says "reviewed", not "covered".                                                                                                                                                          |
| `SourceTag`                                    | Inline-flex, mono ≥9.5px (AA check), accent-soft, 4px radius, `white-space: nowrap`, vertical-align 2px; tap → popover with original tag + evidence; `mine` variant grey.                                                                                                                       |
| `BroadcastComposer` / `BroadcastResponderCard` | Responder card includes dashed `Nothing stood out` chip, same size as disposition chips.                                                                                                                                                                                                        |
| `WrappedCard`                                  | 9:14, radius 16; grayscale outline in prototype; one `key` variant per story; stat 700/−0.04em; dots pagination; ≤250ms transitions; honour `prefers-reduced-motion`.                                                                                                                           |
| `SyncStatus`                                   | `✓ Synced with School Cockpit · Xm ago · n students`; stale: `n changes not yet synced` + Sync action.                                                                                                                                                                                          |

### 9.4 Interaction & motion

- Full keyboard operability (FAB focusable; ⌘K accelerator; 1–4 chip keys; Enter/Esc).
- Overlay fade/scale ≤150ms; no celebratory motion near coverage numbers (P7).
- Instrument tag duration overlay-open → save; per-entry-point breakdown feeds the "median 8 sec" stat and tells us which invocation actually gets used.

### 9.5 States (must-design)

Empty river ("No observations yet this term" + Add / Broadcast, no guilt copy) · thin record → "reviewed — nothing noted" after nils · no-draft empty state (P4) · stale sync · broadcast cooldown · reflection-pending (share controls disabled with explanation) · locked tool cards.

### 9.6 Accessibility

WCAG 2.1 AA. Verify accent-on-soft contrast at small mono sizes (SourceTag minimum 9.5px). Chips are buttons with `aria-pressed`; pattern cards announce status; overlay traps focus; FAB labelled "Tag a student"; stream uses list + datetime semantics.

## 10. Success metrics (retention-led)

| Metric                                                    | Target (pilot)                       | Notes / guardrails                                                     |
| --------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| **Week-6 tagger retention** (tagged in wk 1–2 AND wk 5–6) | ≥ 50%                                | The metric for a discretionary tool. Primary.                          |
| Weekly active taggers / pilot teachers                    | ≥ 40% by wk 4                        | —                                                                      |
| Median tag duration                                       | ≤ 10s                                | Per entry point; FAB vs row vs ⌘K mix reported                         |
| Coverage at reporting                                     | **observed, no communicated target** | Diagnostic only (P7). Never in pilot-school comms.                     |
| Broadcast response rate                                   | ≥ 60% in 72h                         | Rate limit holds; nil responses counted as responses                   |
| Draft confirm-without-edit (Phase 2)                      | 30–60%                               | >80% ⇒ suspect rubber-stamping; audit edit depth                       |
| Reconcile gate fire rate                                  | <15% of confirms                     | "Keep with context" ≥25% of fires (proves it's judgement, not nagging) |
| Subject-teacher hours per cycle                           | ↓ vs **measured** as-is              | Time-diary baseline is a Phase 0 gate                                  |

## 11. Dependencies, risks, open questions

1. **Cockpit ingest format** — decides sync feasibility; fallback is file download. One meeting with the Cockpit team also answers Q2.
2. **Vetting practice** — unvalidated, school-specific; build the configurable review slot only.
3. **Comment-bank reality** — if as-is comments are bank-generated, the pitch shifts to "individuality regained at equal time". Time diary resolves.
4. **River visibility for subject teachers** — own-tags vs full river; behind `reports-river-visibility` flag; decide in research.
5. **Coverage → soft-obligation drift** — P7 is the mitigation; refuse leadership coverage-dashboard requests at design level; pilot comms carry no coverage target.
6. **Wrapped register with struggling students' families** — test with those families first; fallback: default such releases to the full-report register.
7. **PDPA / governance for observational records of minors** — retention limits, transfer rules, and student retirement rights need governance review before any real-data pilot; §7 lifecycle rules are the interim position.
8. **FAB slot conflict with AI assistant** — app-level decision required before A2 build.
9. **Timetable/association data** — broadcast recipient resolution and F1 search scoping depend on it; mock in prototype, real source TBD.
10. **Smart Compose integration surface** — API/embed contract for in-flow drafting (A2); confirm whether Smart Compose can accept seeded context (river content) and return structured output for source tagging.
11. **STP/SDT field availability** — B's insight layer depends on data that may not exist yet; verify §7.1 before any B commitment or stakeholder demo that implies it.
12. **AI-vs-teacher content marking for parents** — the B requirement to distinguish authorship in family renderings needs a visual language that informs without undermining trust in the teacher; design exploration required (relates to Q6 register testing).

## 12. Appendix — artifact index

| Artifact                           | Content                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `hdp_journey_v2_minimal.html`      | As-is vs to-be journey, emotion curves, shift summary                       |
| `hdp_workload_model.html`          | Coverage-coupled savings calculator + national as-is bill (~375k h/yr)      |
| `hdp_tag_queue_wrapped_v2.html`    | **Concluded concept** — Tag Queue, river, broadcast, sourced draft, Wrapped |
| `hdp_share_format_v2_minimal.html` | Three-act release flow + chaptered report format                            |
| `hdp_report_book_format.html`      | Formal digital report book rendering                                        |
