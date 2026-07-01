# Plan 012: Color-token sweep — giant files (Phases 7–10, palette + dark-hazard ONLY)

> **Executor instructions**: READ `plans/010-color-sweep-overview.md` FIRST (canonical
> mapping, decisions, gates). Then follow this plan. These are large, **untested** files
> — the build and grep gates are backstopped by a **MANDATORY light+dark visual
> spot-check** (010 §gates). If a "STOP conditions" item occurs, stop and report. Update
> `plans/README.md` when done.
>
> **Drift check (run first)**, per file before you touch it:
> `git diff --stat 6e3d7e5..HEAD -- <the one file>`. Because this plan fences off
> specific line *ranges*, if the file changed you MUST re-locate the fence by content
> (the markers below), not by line number, before editing.

## Status

- **Priority**: P2
- **Effort**: L (5 files, but 1,951–3,703 lines each, no test coverage)
- **Risk**: **HIGH** — no behavioral tests; correctness rests on grep gates + visual review
- **Depends on**: plan 010 (reference); run AFTER plan 011 (proves the mapping on safe files)
- **Category**: tech-debt / design
- **Planned at**: commit `6e3d7e5`, 2026-06-30

## Why this matters

Five files concentrate the highest-risk share of the sweep: `agency-report.new`
(3,703 lines), `announcements.new` (2,759), `attendance-analytics` (2,314),
`academic-analytics` (2,039), `student-profile` (1,951). They have **no behavioral
tests**, and two of them contain **pixel-faithful document/preview renderers** whose
`bg-white`/`text-black` are *correct as-is* — a naive "flip all white" pass would
corrupt them. So each file is isolated to its own phase, **charts are deferred to plan
013**, and document/preview regions are **hard-fenced**.

In each phase here you fix ONLY: Tailwind-default palette classes, non-chart dark-mode
hazards, and non-chart hex in `className`/arbitrary values. You DO NOT touch any
`fill=`/`stroke=`/recharts-inline hex (→ 013) or anything inside a fenced region.

## Branching

These 5 files share no source file with each other, so each phase may run on its own
branch / worktree, even in parallel:
`advisor/012-academic`, `advisor/012-attendance-profile`, `advisor/012-announcements`,
`advisor/012-agency-report`. (They DO collide with plan 013 on the two analytics files —
run 012 first, then 013; see 010 §"double-touch".)

---

## Phase 7 — `students/academic-analytics.tsx` (2,039 lines)

**In scope (this phase):** the non-chart palette/hazard drift only —
`bg-blue-*`/`border-blue-*`/`bg-gray-400` palette classes, `bg-white` card/row/modal
surfaces, the `text-white` count badge, the `bg-black/20` scrim.

**Fenced / deferred — DO NOT touch in this phase:**
- `BAR_COLORS` (~L124), `GRADE_FILL` (~L243), the `CATEGORICAL_6` import (~L26), every
  `<Bar fill=…>` / `<CartesianGrid stroke="#e9ecef">` (~L637+) / recharts color — **→ plan 013.**
- `GRADE_BADGE_STYLE` (~L254) renders into a `<span style=…>` (NOT an SVG), so its
  inline rgba/hex *may* be converted here to `var(--color-*)` — but only after
  confirming each entry is a span style and not piped into a chart. If unsure, defer to 013.

**Verify**: PALETTE grep → 0; DARK-HAZARD grep → 0; RAW-HEX residual = the count of
deferred chart literals (record it). Visual spot-check: candidates table, filter pills,
the grade modal — light + dark.

---

## Phase 8 — `students/attendance-analytics.tsx` (2,314) + `students/student-profile.tsx` (1,951)

Paired because `student-profile.tsx` has **no chart literals** (fully grep-verifiable),
and `attendance-analytics`'s *non-chart* drift is the same recipe.

**`attendance-analytics.tsx` — in scope:** filter pills, status pill, profile-link,
count badge, `bg-white` cards, and the `text-[var(--slate-N)]` arbitrary brackets →
semantic `text-foreground`/`text-muted-foreground`.
**Deferred → 013:** the `typeColor` hex map (`#e03131`, `#f76707`, … ~L171+) and any
ring/box-plot/line `fill=`/`stroke=` — these are reserved attendance-severity chart
semantics (see `src/lib/chart-colors.ts` header). Leave them.

**`student-profile.tsx` — fully in scope** (no charts): all palette + dark-hazard,
including the **pink wellbeing icon → crimson** (decision PINK).

**Verify**: both files PALETTE → 0, DARK-HAZARD → 0; `student-profile` RAW-HEX → 0;
`attendance-analytics` RAW-HEX = deferred chart count (record it). Visual: attendance
charts page + a student profile, light + dark.

---

## Phase 9 — `routes/announcements.new.tsx` (2,759 lines)

**The `slate-*` scale here is ON-token — do not touch it.** Fix only the real
composer-chrome drift:
- scheduling-strip blues (~L1807–1837 region) → `twblue` / `primary`
- Editor-role chip (~L1984 region) → `twblue`
- required asterisk (~L657 region) → `text-destructive`
- success / yes-no mockup colors → `lime` / `crimson`

**HARD FENCE — the PG-app phone-preview block (verified at `6e3d7e5`).** The preview
mimics the Parents-Gateway app in permanent light mode. Its terracotta brand accent
`#c47565` appears at **L584, L608, L621**, and the surrounding phone mockup (around
L584–740, "This is a preview" at ~L723) uses intentional `bg-[#c47565]`,
`text-white`, and light-mode surfaces. **Do NOT flip any white/black or retoken
`#c47565` inside this preview block** unless decision BRAND is explicitly extended to it
by design. `#c47565` is the FLAGGED report/PG terracotta — hold for sign-off.

> Note: there is a pre-existing `new Date()` SSR pattern at ~L233/240 — **out of scope**,
> do not touch (it is a separate known issue in the README).

**Verify**: PALETTE grep → 0 *outside the fence*; DARK-HAZARD residual = the preview
block's intentional whites (record the count and confirm each is inside the fence);
`#c47565` remains (flagged). Visual: open `/announcements/new`, exercise the composer +
the phone preview, light + dark — the composer chrome themes, the preview stays
light-mode by design.

---

## Phase 10 — `routes/students_.$id.agency-report.new.tsx` (3,703 lines — largest)

Status-color drift dominates and is safe to fix: amber (empty/stale/in-review) → `amber`
scale, red (restricted/overdue) → `crimson`/`destructive`, purple (AI badge) → `violet`,
green (verified/complete) → `lime`, blue links → `twblue`, many `bg-white` surfaces →
`bg-card`. A `bg-primary text-white` step badge → `bg-primary text-primary-foreground`
is safe.

**HARD FENCE — the paper-PDF facsimile (verified at `6e3d7e5`).** Two renderers
reproduce the printed report pixel-for-pixel (document-ink fidelity):
- the "faithful PDF replication" building blocks starting ~**L1761** (`bg-[#D9D9D9]`
  header at L1774; `border border-black` cells at L1783/L1793), and
- the condensed PDF page renderers at ~**L2021–2616** (`mx-auto bg-white px-12 py-8
  text-black` at **L2108 and L2556**; `border-black` rules throughout, e.g. L2128,
  L2518, L2531–2539).

**Inside this ~L1761–2616 range, do NOT flip any `bg-white`/`text-black`/`border-black`
or retoken `#D9D9D9`** — it is document ink, correct in every theme. Only *catalog* the
`#D9D9D9` as an intentional residual. Defer any `Select`/`Textarea`/`Input` primitive
rewrites (out of scope — PRIMITIVE-REUSE).

**Verify**: PALETTE grep → 0 *outside the fence*; DARK-HAZARD residual = the facsimile's
whites/blacks (record and confirm each line is within L1761–2616); `#D9D9D9` remains.
Visual: open the agency-report builder, switch templates, open the PDF preview modal —
the builder chrome themes, the PDF facsimile stays black-on-white.

---

## Commands you will need

See `plans/010` §"Verification gates". Per phase: per-file PALETTE/DARK-HAZARD/
NO-STRAY-ALPHA/RAW-HEX greps, then `bun run build` (0), `npx tsc --noEmit | grep -c "error TS"`
(=113), `bunx vitest run` (37/16), `bun run check`, and the **mandatory visual
spot-check in light + dark**.

## Done criteria

Machine-checkable + visual. ALL must hold, per phase:

- [ ] PALETTE COUNT-DROP grep → 0 (excluding fenced regions, which contain no Tailwind
      palette classes anyway).
- [ ] DARK-HAZARD residual exactly equals the documented fenced/intentional whites for
      that file — every remaining `bg-white`/`text-white`/`bg-black` line confirmed to be
      inside a fence or a fixed brand fill.
- [ ] RAW-HEX residual = the recorded deferred-chart + fenced-document literal count;
      each remaining hex justified (chart→013, facsimile/preview→fence, brand→flagged).
- [ ] NO-STRAY-ALPHA grep → empty.
- [ ] `bun run build` 0; `tsc` = 113; `bunx vitest run` 37/16.
- [ ] Visual spot-check done in BOTH themes; screenshot the touched screens.
- [ ] `git status` shows only the phase's one (or two) files + `plans/README.md`.
- [ ] `plans/README.md` row updated.

## STOP conditions

In addition to 010 §"Global STOP conditions":

- You cannot confidently locate a fence boundary by its content markers (file drifted) —
  STOP; do not guess where the facsimile/preview begins or ends.
- A `bg-white`/`text-black` you're about to change is inside (or ambiguously near) a
  fenced range — leave it and report.
- The visual spot-check shows any chart/preview/PDF rendering differently than before —
  STOP (you likely touched a deferred/fenced element).
- `#c47565` or report-orange needs design sign-off and you're about to merge.

## Maintenance notes

- `academic-analytics.tsx` and `attendance-analytics.tsx` are revisited in plan 013 for
  their chart colors — after 013, re-run their PALETTE/DARK-HAZARD/RAW-HEX gates to
  confirm 013 didn't undo this phase.
- The fenced document/preview regions are deliberate exceptions to the dark-mode
  rule. If dark mode is later enabled app-wide, these renderers should stay
  light/ink — they reproduce printed PDFs and an external app's light UI. Document this
  in any future dark-mode plan so they aren't "fixed."
