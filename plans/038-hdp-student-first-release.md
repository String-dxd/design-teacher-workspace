# Plan 038: Prototype B student-first release — reflect, choose a cover, then parents (F5 Acts 1–3, light)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command before moving on. STOP conditions are binding. Your
> reviewer maintains `plans/README.md`. Read the "Design constraints" section
> of `plans/028-hdp-module-foundation.md` first — binding (tokens, sentence
> case, a11y, no-nag; student-facing copy is warm and plain, no gamification,
> no exclamation marks).

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW-MED (new guest route + release-page staging; all flag-gated)
- **Depends on**: plans 028–037 on `hdp-prototype-v2` (037 builds
  `ReportStory`, reflections store, and the `reports-hdp-future` flag gating)

## Why this matters

Prototype B's release is three acts: the STUDENT sees their report first,
reacts and reflects (Act 1), their reflection joins the artefact (Act 2), and
only then do parents get it (Act 3). Today's Release page ships Act 3 only and
stubs the rest as "Coming later". This plan makes the staged flow demoable
end-to-end behind `reports-hdp-future`, replacing those stubs.

## What to build

1. **Store (append to `src/lib/hdp-store.ts`)**:
   - `HdpReportBook` gains optional
     `studentReleasedAt?: string` and `studentReactedAt?: string`
     (additive fields in `src/types/hdp.ts`).
   - `releaseToStudent(studentId): { token: string }` — token
     `hdp-student-{studentId}` (mock convention like `hdp-{studentId}`);
     stamps `studentReleasedAt`; requires a confirmed overall draft (same
     precondition as sharing, throw otherwise).
   - `submitStudentReflection(token, text)` — writes via 037's
     `saveReflection` (`chosenAsCover: true` when it's the student's only
     reflection; a second submission replaces their unshared reflection);
     stamps `studentReactedAt`. Throws after the book is parent-shared
     (reflection freezes at share, consistent with the snapshot rule).
   - `shareReportBook` precondition CHANGE, flag-independent in the store but
     enforced at the call site: the Release page (flag on) only enables
     "Share with parents" once `studentReleasedAt` is set (the UI gate);
     the store function itself stays as-is so Prototype A (flag off) is
     untouched.
2. **Student guest route** — `src/routes/_guest.hdp-student.$token.tsx`:
   - Unknown token → the calm invalid-link pattern from
     `_guest.hdp-report.$token.tsx` (mirror the copy shape).
   - Valid: renders `ReportStory viewer='parent'`-equivalent content for the
     student (their own report; source chips never render) with an h1
     addressed to them, then a **reflection block** at the end (not sticky):
     heading "Add your reflection", helper "A few honest sentences about this
     semester. It appears on your report exactly as you write it — nobody
     edits it.", 600-char textarea with visible label + counter, primary
     Button "Add to my report" → confirm dialog ("This goes on your report,
     in your words. You can rewrite it until it's sent to your parents.") →
     saved state shows the reflection with an "Edit" outline button (until
     parent-shared, then read-only with "Sent with your report").
   - No marks manipulation, no other actions (P8-equivalent for students).
3. **Release page staging** — `src/routes/reports.release.tsx`, flag on:
   - Replace the two Phase-3 stub cards with the real staged flow. The table
     gains a "Student" stage column: "—" → "Released to student {date}" →
     "Reflected {date}".
   - Per-row actions become stage-aware: "Release to student" (enabled when a
     confirmed overall draft exists) → confirm dialog ("{name} sees their
     report first and can add a reflection. Parents come after.") → creates
     the student link (visible + copy, same pattern as the parent link);
     "Share with parents" stays but is DISABLED until `studentReleasedAt`
     (title: "Release to the student first"); once shared, behaviour is
     exactly today's.
   - Flag OFF: the page renders exactly as today (Act-3-only, stub section
     back). Guard every addition.

## Gates

Baselines: whatever plan 037's review records in `plans/README.md`. No new
tsc errors; new tests pass; same known fails; build 0; targeted
prettier/eslint. NEVER `bun run check`.

## Test plan

Extend `hdp-store.test.ts` (append): `releaseToStudent` requires a confirmed
draft and stamps `studentReleasedAt`; `submitStudentReflection` round-trips,
replaces on resubmit, and THROWS after `shareReportBook` (frozen); token
lookup unknown → null/undefined pattern consistent with `bookByToken`.

## Browser verification

1. Flag ON, student C (confirmed draft from the demo funnel): Release →
   "Release to student" → open the student link in a private window → story
   renders, write a reflection → it appears as the cover/on the story; edit
   works; teacher's Release row flips to "Reflected".
2. "Share with parents" disabled before student release (title text), enabled
   after; parent link then shows the story WITH the student's reflection;
   reflection editing locks after share.
3. Flag OFF: Release page identical to pre-plan (stubs back, no Student
   column); parent flow untouched.
4. Keyboard + SR: reflection textarea labelled; confirm dialogs work; no
   focus stealing.
5. 375px: student route single column, no horizontal scroll.

## STOP conditions

- 037's `ReportStory`/reflections store absent or differently shaped.
- The freeze-at-share rule conflicts with how 033 snapshots books (report the
  conflict; don't redesign the snapshot).
- Anything requires touching the legacy-free zones (`composeDraft`, hdp-store
  tag/pattern APIs) beyond appends.

## Maintenance notes

- Full F5 (reaction emoji, curation gate, wrapped share) layers on the same
  `studentReleasedAt`/`studentReactedAt` stamps — keep the field names.
- The student token is mock-grade like all guest tokens here; a pilot needs
  real auth — flagged, not built.
