# Design decision record — Reports Cycle Hub + Two-Stage Builder (HDP redesign)

- **Date:** 2026-07-03
- **Product:** TW (Teacher Workspace)
- **Change type:** flow redesign (replaces the split-view builder from `report-builder.md`) + report-document redesign + generation refactor
- **Page type:** flow (hub → layout → write → share), plus a redesigned document rendered across builder/detail/parent views
- **Run type:** attended (plan grilled + approved by Reza Ilmi; implementation delegated, verify orchestrated)
- **The teacher and the moment:** Ms. Tan, P1 form teacher, the week ~30 holistic reports are due — she sets the class layout once, writes each student's comments in a marking-flow pass, and shares all ready reports with parents at once.

## The bet & kill-criterion

- Bet unchanged: teachers use this **over SC + Smart Compose**. The cycle hub is now the concept-test artifact (PR #159 evolves in place).
- **Kill-criterion (redesign-specific):** if the concept test says the hub → layout → write loop feels slower or more confusing than one-screen building for ~30 reports, revert to the split-view builder. Two-stage must feel _faster_, not just tidier.

## Locked decisions (grilling, 2026-07-03)

1. Hub scope **P1–P2 only**; P3–P6 primary keep the table view; secondary untouched.
2. Same branch; **PR #159 evolves** — cycle hub supersedes the split-view builder as the test artifact.
3. **Parent note is per-student**, authored in the Write stage; bulk share sends what's written (no generic bulk message).
4. **No HOD review step** — "Mark ready" is the teacher's own gate (known simplification; real flow has review before send).
5. **Per-student section overrides deferred**; Write = comments + parent note.
6. **Report document**: ONE hero visual ("Term at a glance" — attendance ring + conduct + one-line summary); typographic body with descriptor chips; the viz system (`ReportBlockViz`, `vizOptions`, per-section View selects) removed entirely.

## Sprint contract (done-criteria)

1. From `/reports` with a P1/P2 class selected (flag on), the teacher sees the **cycle hub**: term picker, summary strip, per-student status list (Not started / Draft / Ready / Sent) derived from the cycle store only, layout entry, bulk share.
2. **Stage 1 Layout** (once per class+term): full-width template + section toggle/reorder (no viz), live preview with a named sample student; absorbs template-admin mode.
3. **Stage 2 Write** (per student): the document is the page; comments (RichTextEditor + Suggest) and a labelled per-student "Note to parents" field; class-scoped prev/next pager; "Mark ready" with loading/error states (focus-move on error); drafts persist across navigation.
4. **Bulk share**: consequence-stating confirm; commits each ready report + its note; statuses flip to Sent; the parent guest view renders the built document + note; Acknowledge works.
5. **Document redesign**: one hero at-a-glance (attendance ring reused, `aria-hidden` with text equivalent), descriptor chips instead of ~25 status bars, no charts elsewhere; no academic marks/% or A1–F9 at P1.
6. **Refactor**: old wizard deleted (single generation path); `upsertReport` fixes the `addReport` no-op trap; `/reports/$id` honors the built layout for primary; secondary paths unchanged.
7. Floor: L0 (AA contrast, keyboard+focus, labels, destructive confirm), TFX tokens/type, COL-1 T&S Blue CTAs, anti-slop, copy per `tfx-content-style`.

## Chosen approach

Option A from diverge — **reporting-cycle hub + two-stage builder** (rejected: B document-first editor only — kept per-student flow and didn't fix the step structure; C linear stepper — batch-capable but killed the live preview). Document direction: **one hero visual** (rejected: pure typographic — user wanted a "wow" moment; typographic+hero — more build for marginal gain).

## Tradeoffs, named

- Layout is class-uniform: a teacher cannot drop a section for one student (overrides deferred — revisit if the test demands it).
- No review/approval step — teacher-direct share (prototype simplification; noted for the real build).
- Cycle status lives in localStorage only; the seeded mock `parentStatus`/`reviewStatus` on pre-generated reports are ignored by the hub by design.
- P1 LO wording (e.g. "Statistics & Probability" at P1) remains illustrative pending HOD confirmation (carried over from `report-builder.md`).
- Attendance % appears in the hero — attendance percentage is not an academic mark; the P1 no-marks rule applies to grades/exam %, unchanged.

## Controls in scope

Same set as `report-builder.md` §Controls in scope, minus the viz-related surfaces (removed).

**CMP-1:** asserted, no manifest — all new components (`CycleStudentTable`, `SectionLayoutEditor`, `DescriptorChip`, `TermAtAGlance`) are composition of existing ui/table, Badge, Button, Checkbox, Select, Sheet/AlertDialog, AttendanceRing, RichTextEditor.

## Waivers granted

| Control | Tier | Reason | Approver | Where recorded |
| ------- | ---- | ------ | -------- | -------------- |
| (none)  |      |        |          |                |

## Plan approval

- **Approved by:** Reza Ilmi (plan grilled over six structured questions; execution ordered "execute with sonnet xhigh")
- **Approved on:** 2026-07-03
- **Plan artifact:** `~/.claude-work/plans/redesign-this-flow-and-snuggly-platypus.md`

## Verify verdict

- **Implementation gates** (by the implementing agent, re-confirmed after recovery): `bunx tsc --noEmit` 109 errors (baseline 111, zero new); `bun run test` 65/65; route smoke 200s; greps clean (no `reports.build`, `GenerateHdpWizard`, `ReportBlockViz`, `vizOptions`).
- **Deterministic (orchestrator re-run):** `a11y-static.py` clean on all new/changed files. `token-audit.py`: only pre-existing orange accents (out of scope per prior record), the amber admin pill, and chip lime/amber Radix functional scales (adjudicated pattern) — verified manually as COL-2-compliant Radix scale usage.
- **Live evidence** (`scratchpad/shots2/`, 1280 + 360 + 320): secondary regression intact; hub fresh → layout → write (pager, labelled note field) → mark ready (toast) → two ready → bulk share confirm → sent; parent view full document; detail page renders document not tabs; `?fail=1` error banner receives focus (verified via `document.activeElement`); reflow scrollWidth == viewport at 360/320.
- **Dark mode:** N/A — product has no dark mode.

**`tfx-design-evaluator` verdict (verbatim):**

> VERDICT: pass-with-findings
>
> BLOCKING (must fix before ship):
>
> - **LAY-2 fail (hub header at 360 and 320 CSS px) — evidence source: screenshot (14-hub-360.png, 15-hub-320.png) + code-read.** The hub's header action pair is `<div className="flex items-center gap-2">` (reports.index.tsx:827) with no `flex-wrap`, nested in a `flex-wrap justify-between` row. At 360 and 320 the two buttons cannot fit on one line and the second — the hub's primary action "Share with parents (N)" — is clipped at the right viewport edge: its trailing text and count run off-screen and are unreadable in both shots. The orchestrator reports `scrollWidth == viewport`, so the control is truncated/hidden rather than reachable by scroll. LAY-2 fails when "a primary action disappears at the narrowest width." L1, no waiver on file → blocking. Fix: let the inner button pair wrap (`flex-wrap`), or stack the header actions below the term picker at narrow widths. A waiver, if pursued instead, would need to state that the hub is a laptop-only surface and cite that the button remains fully operable — but the button is a parents-first send action, so a laptop-only rationale is weak; recommend the fix. Close-call note: in the captured shots the button is disabled (count 0); a human should confirm the clipping persists (it will, per the code) and that the enabled label is equally cut.
>
> ADVISORY (should fix):
>
> - **Content authenticity (done-criterion 5, carried tradeoff) — evidence: 05-write-stage.png / 10-parent-view.png.** "Statistics & Probability" renders as a P1 Mathematics learning outcome; the record already flags per-subject LO wording as illustrative pending HOD. No in-scope control covers curricular accuracy (CNT covers naming/voice, not domain fidelity), so this is graded against the contract directly: the LO+descriptor format and no-marks/no-grades requirement of criterion 5 are met; the specific LO wording is the known open item. Recommend HOD confirmation before test sessions. Not blocking.
> - **Guest parent view repeats pupil identity — evidence: 10-parent-view.png.** The guest wrapper header ("Chloe Tan Xin Yi / P1-A · Term 2 2025") and the `pupilInfo` block both render the name/class/term, so the student's identity appears twice within one screen. Craft nit in the shared preview + guest chrome composition; not a control fail. Consider suppressing the `pupilInfo` name/class/term when the guest header already carries them.
> - **A11Y-1 chip contrast not machine-scanned (close call) — evidence: code-read (report-preview.tsx:24-37).** DescriptorChip uses `lime-11 on lime-3`, `amber-11 on amber-3`, and `primary/10` bg with `text-primary`. Radix same-hue 11-on-3 is conventionally AA but was not contrast-scanned this pass; `text-primary` on `bg-primary/10` (10% primary over card) is the least certain pairing. Recommend a machine contrast check on the four chip variants before ship.
>
> QUALITY GRADES:
>
> - **Design quality — strong.** The hub reads in task order (term → layout entry → summary strip → student list → bulk share); the two-stage split (layout once, write per student) matches the "~30 reports due" moment. The redesigned document leads with one "Term at a glance" hero then a calm typographic body — clear hierarchy, no repeated-bar noise.
> - **Originality — appropriate.** All stack primitives (Table, Badge, Button, Select, AlertDialog, Textarea, RichTextEditor); the descriptor chips are semantic status colour-coding (COL-2 Radix scales + primary), functional wayfinding, not SLP-1 decoration. Single hero visual is restrained, no gradients/glow. No unwarranted novelty; no new components.
> - **Craft — acceptable.** States are designed (empty class via EmptyState, loading spinner on Mark ready/Share, error banner with focus, disabled pager at ends, required-section lock, "No comments yet" empties). Two dents: the narrow-width header clipping (LAY-2) and the duplicated pupil identity in the guest view.
> - **Functionality — strong.** End-to-end loop completes: hub → set up layout → write → mark ready (commit) → bulk share (commit + message + sentAt) → parent view renders note + hero + chips; statuses derive from the cycle store only (no phantom seeded "sent"); draft persistence via debounced `patchStudent` write-through preserves in-progress work on interrupt/resume; escape paths present (Back link, pager). The detail route is layout-aware and prefers the localStorage shared record for reload resilience. No dead ends.
> - **Dark mode — N/A, product has no dark mode.**
>
> JUDGMENT CONTROL NOTES (in-scope per docs/decisions/report-builder.md control set):
>
> - **A11Y-7 pass** — semantic `<main>`/`<header>`/`<section aria-label>` in both stages; `ul/li` section list; `dl/dt/dd` pupil particulars; `h1/h2/h3` hierarchy (report-preview.tsx, reports.cycle.\*.tsx).
> - **A11Y-8 pass** — pager buttons carry dynamic `aria-label` ("Previous/Next student: {name}") with `disabled` tracking the visual; section checkboxes `aria-label="Include {label}"` + disabled/checked on required rows; reorder buttons `aria-label="Move {label} up/down"` disabled at ends; `GripVertical` and decorative ring `aria-hidden`. State matches visual.
> - **A11Y-11 pass** — Write "Mark ready" error moves focus to the banner via `useEffect` keyed on `markState` (write.$studentId.tsx:102-104), banner carries NO `role="alert"`, single channel (verified live by orchestrator). Hub bulk-share success uses a `role="status" aria-live="polite"` sr-only region + Sonner toast (transient, no focus theft). No double-announce.
> - **CMP-1 pass** — CMP-1: asserted, no manifest — manifest absent for Teacher Workspace. Evidence source: product codebase read. CycleStudentTable and SectionLayoutEditor are compositions of existing Table/Badge/Button/Checkbox/Select/AlertDialog/Textarea; no new primitive.
> - **CMP-2 pass (N/A)** — no destructive action in the flow. "Reset to template" is non-destructive/re-derivable (toast); "Share with parents" is a send with a stated consequence, confirmed via AlertDialog, not destructive.
> - **CMP-3 pass** — Mark ready and Share each have loading (spinner + "Marking ready…"/"Sharing…"), success (toast + navigate/refresh), error (Write banner). Loading is contextual, not a page takeover.
> - **CNT-1 pass** — error copy states what + next step, names the object, no code: "Couldn't mark Chloe Tan Xin Yi's report ready. Check the student's data and try again." (write.$studentId.tsx:246-249).
> - **CNT-2 pass** — "Set up layout", "Edit layout", "Mark ready", "Share with parents", "Note to parents", "Write" — plain, no codenames/portmanteaus. (Curricular LO wording is a content-authenticity item, not a CNT-2 naming fail.)
> - **CNT-3 pass** — second person, active, ≤25 words ("You're adjusting this class's layout only — the template stays the same"; "Each parent will see the note you wrote for their child, if any").
> - **COL-1 pass** — primary CTAs (Save & continue, Mark ready, Share) resolve to `bg-primary` (T&S Blue); attendance ring uses `text-primary`/currentColor. Pre-existing orange-9 filter pill in the legacy view is out of scope per record.
> - **COL-2 pass-with-caveat** — chip lime-3/lime-11, amber-3/amber-11 and template-admin amber pill are Radix functional scales, consistent with existing report surfaces; token-audit flags them but the record documents the manual Radix adjudication. Not re-scanned for contrast this pass (see A11Y-1 advisory).
> - **SLP-1 pass** — no gradients, glow, cyan-on-dark; single hero visual, flat chips.
> - **SLP-9 pass** — no buzzwords, em-dash chains, forced triads, or chatbot artifacts; Suggest canned text reads as plausible teacher prose.
> - **SLP-10 pass** — both stages are full-screen routed pages, not modals; the only dialog is the single-purpose Share confirm (AlertDialog), not a multi-section task-in-a-modal.
> - **LAY-2 fail** — see blocking (hub header primary action clipped at 360/320).
> - **LAY-4 pass** — document prose capped at `max-w-[66ch]` (report-preview.tsx:122), within ≤80ch.
>
> Controls I could NOT independently verify (recommend human/screen-reader confirmation):
>
> - A11Y-1 chip contrast (lime/amber 11-on-3, `text-primary` on `bg-primary/10`) — not machine-scanned this pass.
> - A11Y-2 focus rings and A11Y-4 hit areas on the new pager/reorder/Write controls — code shows standard Button variants (reorder `icon-sm` = 32px, the accepted portfolio pattern; below the 44px mobile clause — same accepted-with-rationale advisory as the prior record); orchestrator reports visible focus rings live, but not captured per-control.
> - Deterministic scripts beyond the orchestrator's re-run: token-audit + a11y-static were re-run (a11y-static clean; token-audit only the known Radix findings); type-scan/contrast/validate were not machine-run this pass.
>
> UNCOVERED (defects no in-scope control covers — feeds the ratchet):
>
> - Carried from the prior record: the parent guest view (and the layout-aware detail) render teacher comments via `dangerouslySetInnerHTML` (report-preview.tsx:258), labelled "schema-constrained Tiptap output (prototype)." No in-scope control covers HTML-injection safety of content rendered to another user. Acceptable for a mock-data prototype; a real parents-facing surface must sanitise before any non-prototype ship. Already a proposed ratchet item.
> - Content-domain authenticity (the "Statistics & Probability" / P1 LO-wording issue) still has no covering control — candidate ratchet: "domain content must match the real-world artifact it claims to model."

**Post-verdict fixes applied (blocking + contrast advisory cleared, verified live):**

- **LAY-2** — the hub header action pair now wraps (`flex-wrap` on the button container, `reports.index.tsx`). Verified at 320px: the "Share with parents (N)" button's right edge is at 227px within a 320px viewport, `scrollWidth == viewport`, no clipping (`17-hub-320-fixed.png`).
- **A11Y-1 (chip contrast)** — the orchestrator machine-scanned the rendered chips: all three coloured variants measured **4.25–4.29:1**, below the 4.5:1 AA floor for 12px text — a real fail, not just a close call. Fixed: chips now use `text-lime-12`/`text-amber-12` on step-3 backgrounds and `bg-twblue-3 text-twblue-11` for Accomplished. Re-measured live: **9.82 / 10.47 / 5.03** — all AA-pass.
- Gates re-run after fixes: `tsc` 109 (baseline 111, zero new), `bun run test` 65/65, `a11y-static` clean.
- Advisories left open by decision: duplicated pupil identity in guest view (craft nit — revisit with the guest chrome), P1 LO wording pending HOD (carried), 32px reorder targets (accepted pattern).

## Recovery note (2026-07-03)

The worktree directory was deleted while uncommitted (likely by worktree cleanup that also stopped the background dev server). Nothing was staged, so git held no copy. The redesign was reconstructed deterministically by replaying the implementing agent's transcript (Write/Edit ops in order) onto a fresh checkout of `5e59766`, then re-applying the two post-verdict fixes above and this record from session context. Gates re-run post-recovery confirm the reconstruction (tsc 109, tests 65/65, a11y-static clean). Lesson for the ratchet: commit at each verified milestone rather than holding a large redesign uncommitted in a worktree.

## Follow-ups (2026-07-06)

- **Guest-view identity duplication (advisory) — fixed.** Added a `compactPupilInfo` prop to `ReportPreview`: the pupil-particulars block now drops name/class/term (the host header already shows them) and keeps only form teacher. Applied to the parent guest view and the layout-aware detail page; the builder/write editing surfaces keep full particulars. Verified live — name renders once, "Class:"/"Term:" labels gone from the body, form teacher retained. Gates: tsc 107 unchanged, 65/65 tests, a11y-static clean.
- **Ratchet items filed** to the standards repo (`transformteamsg/tfx-design-standard`): [#26](https://github.com/transformteamsg/tfx-design-standard/issues/26) (sanitise shared user-authored HTML) and [#27](https://github.com/transformteamsg/tfx-design-standard/issues/27) (domain-content authenticity). Logged in `docs/decisions/HARNESS-FEEDBACK.md`.

### Cleanup pass (2026-07-06, at user request "update it to the rest of the pages")

- **Class selector** simplified to one searchable `Combobox` (flat list of All classes + each level + each class); the Primary/Secondary toggle is gone — `reports.index` now derives its level from the picked class. Shared by attendance/students unchanged.
- **HDP feature flags consolidated** to a single `hdp-reports` flag (was `hdp-report-builder` + `hdp-template-admin` + `holistic-reports`); `report-generation` stays separate (Agency Reports). On → cycle hub; off → legacy table + hidden profile section.
- **Hub scope extended P1–P2 → all primary (P1–P6)** — this supersedes locked decision #1. Rationale: the user asked to apply the updated design to the rest of the pages, and the mock treats all primary reports as learning-outcome-based, so they render correctly in the redesigned document (verified live on P3-A: hero + descriptor chips, authentic P3 subjects incl. Science). **Secondary stays on the legacy table** — its grade/aggregate model needs a different document, which was explicitly out of scope. **Authenticity caveat:** real-world P3+ reports use grades/marks, not LO descriptors; the prototype shows LO descriptors across all primary. Flag for HOD/real-build review — related to ratchet #27.

## Ratchet

- Carried forward from `report-builder.md`: sanitise shared user-authored HTML before any non-prototype ship (`dangerouslySetInnerHTML` in `report-preview.tsx`); domain-content authenticity has no covering control (candidate standard). → **Filed as #26 and #27.**
- New: review/approval workflow is a designed-out gap — if this flow graduates from prototype, the Ready → share hop needs an approval state.
- Process: commit verified milestones; don't leave a multi-hour redesign uncommitted in a worktree (this record was recovered from an agent transcript after the worktree was deleted).
