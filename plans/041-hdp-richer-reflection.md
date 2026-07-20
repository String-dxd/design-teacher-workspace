# Plan 041: Prototype B richer reflection — per-pattern reactions, "adds" annotations, cover gating, light curation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. STOP conditions are binding. Your
> reviewer maintains `plans/README.md`. Read the "Design constraints" section
> of `plans/028-hdp-module-foundation.md` first — binding. Student-facing
> copy: warm, plain, no gamification, no exclamation marks.

## Status

- **Priority**: P2
- **Effort**: M–L
- **Risk**: MED (extends the student guest flow + story rendering)
- **Depends on**: plans 037 (ReportStory, reflections store) + 038 (student
  guest route, release staging) on `hdp-prototype-v2`
- **Provenance note**: the maintainer's reference artifact
  (`claude.ai/public/artifacts/df17ee10-…`) was NOT retrievable (Cloudflare
  bot wall; authenticated fetch → not found). This plan is specified from the
  maintainer's wireframe screenshots (story report with per-pattern
  "Amira adds" callouts + "Chosen as her cover" attribution) and PRD
  `docs/prd-hdp.md` §6 F5 Acts 1–2, which describe the same design. If the
  maintainer later supplies the artifact and it differs, reconcile then.

## Why this matters

038 gives the student ONE reflection box. The B vision (PRD F5 Act 1–2) makes
reflection a dialogue with the report itself: the student reacts to each
validated pattern (Agree / It's more complicated / Add my side), their "adds"
join the pattern chapters in their own words, a ≥3-sentence cover reflection
gates parent sharing, and light curation lets the student choose their cover
and retire items from the family rendering. Reflections are never vetted.

## What to build (all behind `reports-hdp-future`)

1. **Types/store** (append):
   - `FormingPattern` reuse: 037 added `studentNote?`. Add
     `studentReaction?: 'agree' | 'more-complicated' | 'add-my-side'` and
     honor the existing `'retired-by-student'` status (PRD lifecycle — the
     field already exists in the union).
   - `src/lib/hdp-store.ts` (append): `reactToPattern(patternId, reaction,
note?)` — persists reaction + optional note (note ≤300 chars; a
     reaction of `agree` may omit the note; the other two prompt for one but
     never require it); `retirePatternFromFamily(patternId)` /
     `restorePattern(patternId)` — toggles `retired-by-student` (teacher-
     facing record UNCHANGED — the river still shows the pattern with a quiet
     "hidden from the family report by {name}" line); reflection gate helper
     `reflectionGatesShare(studentId): boolean` — true when the cover
     reflection has ≥3 sentences (split on `.?!`, trimmed, count ≥3).
2. **Student guest route** (`_guest.hdp-student.$token.tsx`, extend 038):
   - Each pattern chapter gains a reaction row: three `<button aria-pressed>`
     chips — "Agree", "It's more complicated", "Add my side" — selecting the
     latter two reveals a labelled note field ("Your side (optional)") whose
     saved text renders immediately as the "{FirstName} adds" callout in the
     chapter. One reaction per pattern, changeable until parent-share.
   - Each chapter gains a quiet ghost action "Don't show my family this one"
     → confirm dialog ("This hides the pattern from the report your family
     sees. Your teachers still see it.") → chapter collapses to a one-line
     "Hidden from your family report — undo". (Act 2 retire rights, light.)
   - The cover reflection block (038) gains the gate: helper text "At least
     three sentences — this becomes the cover of your report."; a quiet
     count indicator; and the 038 flow is unchanged otherwise.
3. **Release staging update** (`reports.release.tsx`, flag on): "Share with
   parents" is now enabled only when `studentReleasedAt` AND
   `reflectionGatesShare(studentId)` — disabled title: "Waiting for
   {name}'s reflection (at least three sentences)". The Student column shows
   "Reflected" only when the gate passes.
4. **Story rendering** (`report-story.tsx`): pattern chapters render the
   reaction as a quiet meta line when not `agree` ("{FirstName} says it's
   more complicated" — with their note as the adds-callout); retired patterns
   NEVER render in parent view (teacher-preview shows them collapsed with the
   hidden-by line). Reflections/notes render as text nodes (CMP-9), never
   vetted, never edited.

## Gates

Baselines from plan 040's review record (or the latest in `plans/README.md`)
— verify + record first. No new tsc errors; new tests pass; build 0; targeted
prettier/eslint. NEVER `bun run check`.

## Test plan (append to `hdp-store.test.ts`)

- `reactToPattern` persists reaction+note; reaction changeable until the book
  is parent-shared, throws after (freeze like reflections).
- `retirePatternFromFamily` flips status; `restorePattern` restores; teacher
  visibility unaffected (pattern still in `loadPatterns`).
- `reflectionGatesShare`: 2 sentences → false; 3 → true; trailing whitespace/
  punctuation handled.

## Browser verification (flag ON)

1. Student link: react "Add my side" + note → callout appears in-place; changes
   persist on reload; retire a pattern → collapsed with undo; parent preview
   (Release) no longer shows it; teacher river still does.
2. Share gating: 2-sentence reflection → Share disabled with the waiting
   title; add a third sentence → enabled.
3. After parent-share: reactions, notes, retire toggles all read-only.
4. Flag OFF: student route (if reachable) and Release behave as post-038;
   parent A rendering untouched.
5. Keyboard/AT: reaction chips `aria-pressed`, labelled note fields, confirm
   dialogs; no focus stealing.
6. 375px: chips wrap, no horizontal scroll.

## STOP conditions

- 037/038 shapes differ from assumed (report actual).
- Any pressure to add moderation/vetting of student text beyond length limits
  — PRD says never vetted (profanity filter explicitly out of prototype
  scope); report if asked.
- The Wrapped 5-card swipeable rendering — NOT this plan; if it seems
  required, report instead (recorded as the remaining Phase-3 item).

## Maintenance notes

- Full F5 remainders after this plan: per-thread reactions on individual
  observations (we do patterns only), ≤5 spotlight curation, the Wrapped
  card rendering, school-configurable Act-1 window. Recorded, not built.
- If the maintainer's artifact resurfaces, diff it against this plan before
  the next B iteration.
