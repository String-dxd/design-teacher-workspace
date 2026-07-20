# Plan 037: Prototype B story rendering — student reflections, pattern chapters, register toggle

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. STOP conditions are binding. Your
> reviewer maintains `plans/README.md`. Read the "Design constraints" section
> of `plans/028-hdp-module-foundation.md` first — binding. The reference
> wireframe's visual language (dark green panels, mono/uppercase chapter
> labels like "CHAPTER 2 — PATTERNS THIS SEMESTER") is adapted to app tokens:
> Inter, sentence case, Radix scales, `text-xs text-muted-foreground` for
> chapter kickers. Structure yes, styling no. NEVER `uppercase`, NEVER mono.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED (new rendering register on the parent-facing surface)
- **Depends on**: plans 028–036 on `hdp-prototype-v2` (036 registers the
  `reports-hdp-future` flag and builds `trend-line.tsx` + `hdp-trends.ts`)

## Why this matters

Prototype B's bet: a report that leads with the student's own voice and
teacher-validated behaviour patterns lands better than a marks-first document.
This plan builds the story register — the maintainer's wireframe: cover
reflection ("Amira's semester, in her own words"), pattern chapters with
evidence and "student adds" annotations, the trends chapter, conversation
starters, and the official results as a closing appendix. All behind
`reports-hdp-future` so a live demo can flip one flag to jump between today's
pragmatic rendering (A) and the future state (B) over the same data.

## What to build

1. **Types + seeds** (additive):
   - `src/types/hdp.ts`: `StudentReflection { studentId, text, writtenAt,
chosenAsCover: boolean }`; `FormingPattern` gains optional
     `studentNote?: string` (the "Amira adds" annotation) and optional
     `headline?: string` (the chapter claim, e.g. "She comes back to hard
     problems" — behaviour phrasing, never trait words).
   - `src/data/hdp.ts`: `SEED_REFLECTIONS` — first-person, age-plausible
     reflections for the 3 report-book students (student B's marked
     `chosenAsCover: true`); add `headline` + `studentNote` to the confirmed
     seed pattern(s). Language rules as ever: behaviour-in-context, no trait
     vocabulary.
   - `src/lib/hdp-store.ts` (append): `loadReflections()/saveReflection()`
     (key `hdp_reflections`, seeded via `seedIfEmpty`).
2. **Story register** — `src/components/hdp/report-story.tsx`:
   `ReportStory({ book, studentName, className, viewer })`, same props as
   `ReportBook`. Single column `max-w-2xl`, order per the wireframe:
   1. **Cover**: kicker line "Holistic development profile — {class} —
      Semester {n}, {year}" (`text-xs text-muted-foreground`, sentence case);
      h1 "{FirstName}'s semester, in {his/her/their} own words" — derive
      nothing about pronouns: use the student's first name again or "their";
      the cover reflection as a large quote (`text-lg`); attribution "Written
      by {name}, {date} · Chosen as {the} cover"; a dashed-border honesty note,
      exactly: "Student reflection, unedited. Teachers see it after release;
      it is never vetted." If no cover reflection exists, the cover falls back
      to the h1 + a quiet "No reflection yet" line — never a fabricated quote.
   2. **Patterns this semester — validated by teachers**: one bordered block
      per CONFIRMED pattern: `headline` as h2 (`text-base font-semibold`),
      the evidence sentence (count + contexts, from tag data), evidence chips
      (reuse `TagPill`) naming contexts/artefacts, the `studentNote` as a
      left-bordered "{FirstName} adds" callout (`border-l-2 pl-3`), and a
      "Validated · {teacher}" pill per confirming teacher. Candidates and
      dismissed patterns NEVER render here (P5).
   3. **Where things are heading**: reuse 036's trends row (TrendLine +
      direction word) verbatim.
   4. **Ask {FirstName} about**: `parentPrompts` as a numbered list (plain
      `tabular-nums` numerals, not mono).
   5. **Appendix — results**: the same results table as `ReportBook` (with
      Change column) — marks close the story, they don't open it.
      No `dangerouslySetInnerHTML`; text nodes only (CMP-9). Sections absent
      (not empty) when their data is missing.
3. **Register switch**:
   - `src/routes/_guest.hdp-report.$token.tsx`: resolve `reports-hdp-future`;
     on → render `ReportStory viewer='parent'` (acknowledgement block
     unchanged, still at the end); off → existing `ReportBook`. Document
     title unchanged.
   - `src/routes/reports.release.tsx`: when the flag is on, the preview
     region gains a two-option segmented control (`<button aria-pressed>`
     pair, same chip mechanics as DispositionChip): "Report book" / "Story" —
     teacher can compare registers before sharing. Flag off → no toggle,
     book only.

## Gates

Baselines: whatever plan 036's review records in `plans/README.md` (tsc count,
vitest totals — verify before starting and record). No new tsc errors; new
tests pass; build exit 0; targeted prettier/eslint. NEVER `bun run check`.

## Test plan

Extend `hdp-store.test.ts` (append): reflections seed + save/load round-trip;
cover selection (exactly the `chosenAsCover` one returned first). Optional
pure helper test if you extract cover-pick logic.

## Browser verification

1. Flag OFF: parent link renders the report book exactly as before (byte-level
   visual parity not required, but no story elements).
2. Flag ON: same token renders the story — cover quote + honesty note,
   pattern chapter with "adds" callout + Validated pills, trends, numbered
   prompts, marks LAST. No uppercase/mono anywhere (grep new files too).
3. Release preview toggle switches registers in place; share/ack flows
   unchanged in both.
4. Student with no reflection: honest fallback cover; no fabricated quote.
5. 375px + 1280px: single column, no horizontal scroll, measure ≤ ~80ch.
6. A11y: h1→h2 hierarchy holds in story register; honesty note is real text
   (not an image/aria-hidden); acknowledgement live region still announces.

## STOP conditions

- 036's flag/trend pieces absent or shaped differently than assumed — report.
- Any pressure to edit `composeDraft`, the claims model, or legacy files.
- The pattern data can't express the wireframe's chapter (e.g. no confirmed
  pattern in seeds for a demo student) — extend SEEDS minimally, don't force
  candidates into the story.

## Maintenance notes

- Plan 038 (student-first release) writes reflections through
  `saveReflection` — keep its signature.
- PRD §5.B.4 (distinguish AI-generated vs teacher-written for parents in B)
  is NOT satisfied by this plan — the story register renders confirmed claims
  as prose like A does; flag for the eval pass when a real model lands.
