# Plan 039: Narrative-first A1 parent report — story leads, academics as appendix, conversation prompts at share

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. STOP conditions are binding. Your
> reviewer maintains `plans/README.md`. Read the "Design constraints" section
> of `plans/028-hdp-module-foundation.md` first — binding (tokens, sentence
> case — never uppercase/mono, tabular-nums, a11y; parent-facing copy is
> plain, warm, formal — no exclamation marks).

## Status

- **Priority**: P1 — the maintainer's "most important missing piece":
  the parent-facing example of what the low-hanging fruit looks like.
- **Effort**: M
- **Risk**: LOW-MED (reorders the parent-facing rendering; no store changes
  beyond copy-through)
- **Depends on**: plans 028–036 on `hdp-prototype-v2` (036 adds marks/trends
  behind `reports-hdp-future`; this plan restructures the ALWAYS-ON Prototype
  A rendering)
- **Decision reversal (maintainer, 2026-07-16)**: plan 033 rendered the A
  report book **marks-first** ("marks lead in the report-book register by
  design", PRD F6). The maintainer has reversed this for the low-hanging
  rendering: **narrative first, academics as a closing appendix**, matching
  the wireframe direction. Record stands here; do not re-litigate.

## Why this matters

Prototype A's parent view is the stakeholder story's opening act ("your
existing report card, and more"). As built, it opens with the marks table —
which reads as "the same report card, digitised". The maintainer wants the
low-hanging version to _demonstrate the thesis in its structure_: the
teacher's evidence-grounded narrative leads, the student's conversation
prompts follow (the artifact starts a conversation, P8/goal 4), and the
official academic record closes as an appendix — present, unchanged, but no
longer the headline.

## Scope

**In scope**:

- `src/components/hdp/report-book.tsx` (reorder + small additions)
- `src/routes/reports.release.tsx` (share-dialog copy; preview unaffected
  beyond the reorder)
- `src/routes/_guest.hdp-report.$token.tsx` (no structural change — verify
  only; the reorder lives in ReportBook)
- `src/data/hdp.ts` ONLY if a seeded book lacks `parentPrompts` (top up
  minimally)
- `plans/README.md` is the reviewer's job — skip.

**Out of scope**: `ReportStory` (plan 037's B register); marks grid/workspace
(036); acknowledgement mechanics; legacy files.

## What to change

1. **Section order in `ReportBook`** (both `teacher-preview` and `parent`
   viewers — one register, one order):
   1. Header (unchanged: year/semester line, name h1, class)
   2. **Personal qualities** — the narrative — now leads. Keep the
      authorship-attribution line and the A-rule that parents see no source
      chips (teacher-preview keeps chips).
   3. **Ask {FirstName} about** — the conversation prompts, promoted directly
      under the narrative. Add one quiet framing line above the list, exactly:
      "{FirstName} can start the conversation — ask about these."
   4. **Attendance & conduct** (the quiet one-liners, unchanged content).
   5. **Results — appendix** (LAST): retitle the section heading to
      "Results (appendix)" rendered as h2 "Results" with a
      `text-xs text-muted-foreground` kicker line "Appendix — the official
      record". Table content unchanged (Change column stays gated behind
      `reports-hdp-future` per 036).
      The trends section (036, flag-gated) sits between Attendance & conduct and
      the Results appendix when the flag is on.
2. **Empty-narrative honesty**: a shared book with NO comments (results-only
   share, plan 033 Step 5.5 behaviour) must still read sensibly with the new
   order — when Personal qualities is absent, the prompts section leads; when
   both are absent, the book opens with attendance/conduct then the appendix.
   No placeholder text, no "undefined".
3. **Share-time conversation prompt** (`reports.release.tsx`): the
   share-with-parents confirm dialog gains one sentence after the existing
   copy, exactly: "The report leads with {name}'s story and conversation
   starters; results follow as an appendix." (Sets the teacher's expectation
   of what parents see — no new mechanics in A.)
4. **Seed check**: every seeded report-book student must have 2–3
   `parentPrompts` (they should from 028 — verify; top up in the same voice
   if any is missing: concrete, behaviour-anchored, e.g. "Ask her about the
   experiment she wouldn't give up on.").

## Gates

Baselines: whatever plan 036's review records in `plans/README.md` (verify
before starting and record what you see). No new tsc errors; vitest same
totals (rendering-only change — if you add a test for section order via a
render test, note the framework cost first; a DOM-order browser check is
acceptable instead); build 0; targeted prettier/eslint. NEVER `bun run check`.

## Browser verification

1. Parent view of a shared student with comments: DOM order = header →
   Personal qualities → Ask-about (with the framing line) → attendance/conduct
   → Results appendix last (verify via the accessibility tree / heading
   order, not just visually).
2. Same with `reports-hdp-future` ON: trends slot between conduct and the
   appendix; Change column present; order otherwise identical.
3. Results-only book (no confirmed draft shared): no narrative section, no
   crash, appendix kicker present.
4. Teacher preview (Release page): same order, source chips still render on
   sourced claims.
5. Share confirm dialog shows the new sentence.
6. 375px + 1280px: no horizontal scroll; measure ≤ ~80ch; heading hierarchy
   h1→h2 intact.

## STOP conditions

- 036's trend/flag work absent or shaped differently than assumed.
- The reorder requires touching `ReportStory` or the acknowledgement flow.
- Any seeded book structurally cannot render the new order without store
  changes beyond `parentPrompts` top-ups.

## Maintenance notes

- This makes A and B structurally rhyme (both narrative-first); B (037)
  differs by register (student voice, chapters, trends) not by order — keep
  it that way so the A→B flag flip demos as "same story, richer telling".
- If a future stakeholder asks for marks-first again, that's a product
  decision reversal — point at this plan's Status note.
