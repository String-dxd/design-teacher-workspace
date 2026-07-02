# Design decision record — Report Builder (HDP, P1 prototype)

> One record per page or significant change. Started at the Phase 3 plan gate (the
> approved plan is the fixed artifact the verify phase grades against), finished at
> Phase 6.

- **Date:** 2026-07-01
- **Product:** TW (Teacher Workspace)
- **Change type:** new page (builder route + share) + modification (reports index entry, guest view)
- **Page type:** flow (multi-step build → generate → share), hosted on a routed page
- **Run type:** attended
- **The teacher and the moment:** Ms. Tan, P1 form teacher, end of Term 2, the week ~30 holistic reports are due — today she'd assemble these in Student Cockpit (SC) and switch tools to write comments.

## The bet & kill-criterion (why this design exists)

- **Bet:** teachers would use this **over SC + Smart Compose**.
- **Kill-criterion:** the bet is lost if teachers can't name a concrete reason to pick it over SC. → the flow must feel *faster* than SC, inline Smart Compose is non-negotiable, and the test script must put SC in the room.
- Full context: `plans/018-hdp-report-builder-prototype.md`.

## Sprint contract (done-criteria)

1. From `/reports` a P1 teacher reaches the builder by **one obvious path** (the per-student profile wizard is hidden while the flag is on).
2. The builder is a **full-screen routed page** (SLP-10), split-view: section controls + a **live-updating** report preview; sections **toggle + reorder (up/down)** and pick a **viz**, all with visible labels, keyboard reach, focus (A11Y-2/3/8). No field-level edits.
3. **Teacher Comments has inline "Suggest"** via the existing `RichTextEditor`, editable and clearly AI-assisted, with **no platform switch**.
4. Sharing is **parents-first**: copyable link + personal message; the **parent-facing** guest view renders the built report + message; generate/share have loading/success/error (CMP-3) + one announcement channel each (A11Y-11).
5. **No P1 report shows exam % or A1–F9** — Learning Outcomes + qualitative descriptors only (grounded in the real HDP artifact; Background page: lower primary reports LOs + descriptors, marks/grades only from P3).
6. Floor: AA contrast, keyboard+focus, labels, destructive confirm (L0); TFX tokens/type; primary CTAs = T&S Blue (COL-1); anti-slop; copy per `tfx-content-style`.

## Chosen approach

**Option A — Split-view builder with live preview** (chosen at diverge). One full-screen route `/reports/build`: left = built-in template `Select` + section list (per-row `Checkbox` toggle + `GripVertical` + up/down `Button`s + viz `Select`); right = live report preview reusing existing section components, with the academic section rendered as **Learning Outcomes + qualitative descriptors** for P1. Teacher Comments uses `RichTextEditor` + an inline AI **Suggest** button (canned, no live API). Parents-first Share via a `Sheet` (link + Copy + personal message) → parent-facing guest view. **Governance:** built-in templates ship with the product; a **role-gated** admin/HOD view (behind `hdp-template-admin`) reuses the *same* builder to create/modify/save the **template definition**, while a teacher's build saves only their **report instance**.

## Rejected options

- **Option B (guided wizard)** — lowest-risk and closest to the existing `generate-hdp-wizard`, but preview is a separate step, not live — weakening the "see it instantly / faster than SC" feel the bet depends on.
- **Option C (edit-in-place preview)** — most WYSIWYG, but edit-in-place on a print-like document is the hardest to build well and the fiddliest for reorder in the 12-day window.

## Tradeoffs, named

- Split-view is dense; it **stacks preview-below on mobile** — teachers build on laptops, so acceptable (verified at 360/768/1280, LAY-2).
- **One builder shared by teacher + admin** keeps build cost low but the role distinction must be loud — mitigated by a prominent role banner; ambiguity here is a verify finding.
- **Guest link uses token = report id (no real auth)** — acceptable for a prototype; already recorded as by-design in `plans/README.md` rejected findings.
- **COL-1:** new CTAs use T&S Blue; the **existing reports feature uses orange-9 accents** — not restyled in this pass (conservative defaults), flagged for a later unify.
- **P1 LO/descriptor content is representative** — structure is authentic (from the artifact); exact per-subject P1 LO statements still need HOD confirmation and are labelled illustrative.
- **Admin template-manager is demo-track** — the P1 concept test won't exercise it; first to cut if velocity slips.

## Controls in scope

L0: A11Y-1, A11Y-2, A11Y-3, CMP-2. L1: A11Y-4, A11Y-6, A11Y-7, A11Y-8, A11Y-9, A11Y-10, A11Y-11, TOK-1, TOK-2, TOK-3, TYP-1, TYP-2, TYP-3, COL-1, COL-2, CMP-1, CMP-3, CNT-1, CNT-2, SLP-1, SLP-2, SLP-3, SLP-4, SLP-8, SLP-10, LAY-2, IDN-1. L2: TYP-4, CNT-3, SLP-5, SLP-6, SLP-7, SLP-9, LAY-4, MOT-1.

**CMP-1 verdict:** `CMP-1: asserted, no manifest — manifest absent for Teacher Workspace` (evidence: reviewed the product codebase directly; the section-row is composition of existing `Checkbox` + `Button` + `Select` + lucide icons — not a new component).

## Waivers granted

| Control | Tier | Reason | Approver | Where recorded |
|---------|------|--------|----------|----------------|
| (none) | | No one-offs; all surfaces compose existing stack components. | | |

## Plan approval

- **Approved by:** Reza Ilmi
- **Approved on:** 2026-07-01

## Verify verdict

- **Screenshots** (test track): builder at `builder-320.png` / `builder-360.png` / `builder-768.png` / `builder-1280.png`; generate **error** state `builder-error.png`; **share** sheet `builder-share.png`; **parent** guest view `parent-view.png` (session scratchpad `.../shots/`). Loading state is coded (button → spinner + "Generating report…" / "Sharing…", ~600ms) and reachable but not frozen in a still.
- **Deterministic controls**: `bunx tsc --noEmit` no regression (111 baseline, 0 in new files). `checks/a11y-static.py` (FOCUS/KBD/NAME subset of A11Y-2/3/8) clean on the new files. `checks/token-audit.py` flags `amber-3/11` + `lime-3/11` → **verified manually**: Radix Colors scale tokens (COL-2 requires Radix scales), matching existing report surfaces; harness script lacks this repo's project-token allowlist.
- **CMP-1**: `CMP-1: asserted, no manifest — manifest absent for Teacher Workspace` (evidence: reviewed the product codebase directly).
- **Dark mode**: N/A — product has no dark-mode toggle (documented in `plans/README.md`).
- **Post-verdict fixes applied** (all three blocking L1s cleared): TYP-2/TYP-3 — the two 10px micro-labels ("Required", "Not applicable at P1") raised to `text-[11px]`; A11Y-9 — the parent guest view now sets a descriptive title (`document.title` → "{student} · Holistic Development Profile", verified live). LAY-2 320px reflow subsequently captured (`builder-320.png`).

**`tfx-design-evaluator` verdict (verbatim):**

> **VERDICT: pass-with-findings**
>
> The build meets all six done-criteria substantively and the L0 floor is clean. Three in-scope L1 controls fail (TYP-2, TYP-3, A11Y-9-guest), all narrow and easily fixed, so no L0 blocker exists — but per the mechanical rule, unwaived L1 fails are blocking.
>
> **BLOCKING (must fix before ship):**
> - **TYP-3** fail — Two visible micro-labels render at `text-[10px]` (10px), off the TFX type scale `{…,12,11}`. Evidence: `reports.build.tsx:413` ("Required") and `:418` ("Not applicable at P1"). Fix: `text-[11px]` or a scale token. No waiver.
> - **TYP-2** fail — Same two labels below the 11px label floor. Same evidence. Fixing to 11px clears both. No waiver.
> - **A11Y-9** fail (guest) — Parent guest view is a distinct view with no descriptive document title; inherits root static `'MOE Workspace Homepage'`. `_guest.report-view.$token.tsx` sets no title. Builder route sets its title correctly. Fix: set "{student} · Holistic Development Profile". No waiver.
>
> **ADVISORY (should fix):**
> - **A11Y-4** close call — Reorder buttons `size="icon-sm"` = 32×32px (above 24px floor, below the 44px mobile clause; don't enlarge at 360). Builder is a stated laptop tool; portfolio-wide `icon-sm` pattern. Not a hard fail at 32px.
> - **RichTextEditor** toolbar icon buttons name via `title` only, no `aria-label` (`comms/rich-text-editor.tsx:64`) — `title` computes an accessible name (fallback), weaker mechanism. Pre-existing shared component, out of new-file scope. The new "Suggest" button has a visible text label — clean.
> - **LAY-2** note — 360 capture shows correct single-column reflow (controls above preview, order preserved, no horizontal scroll); the 320px/400%-zoom target was not run. Recommend a 320px pass. [Done post-verdict — `builder-320.png`.]
>
> **QUALITY GRADES:** Design quality — strong (clear hierarchy, role pill + context line, spacing rhythm, "you're adjusting this report only" pre-empts shared-template anxiety). Originality — appropriate (all stack primitives; status bars are functional wayfinding, not slop). Craft — strong (empty/loading/success/error states designed, disabled reorder at ends, required section locked; one nit: the two 10px labels). Functionality — strong (end-to-end, no dead ends, error recoverable, escapable; parent view renders layout + message + Acknowledge). Dark mode — N/A.
>
> **JUDGMENT/HYBRID CONTROLS:** SLP-10 pass (routed full-screen page, not a modal; Share sheet is single-purpose). CMP-3 pass (all three states per async action; loading contextual, not a page takeover). A11Y-11 pass (transient → Sonner polite live region no focus theft; error → focus-move with NO role=alert; no double-announce). CNT-1 pass (what happened + next step, names object, no code). CNT-2 pass (plain names). CMP-1 pass (asserted, no manifest; composition, not a new component). CMP-2 N/A/pass (no destructive action; "Reset to template" is non-destructive + re-derivable). COL-1 pass (new CTAs → bg-primary → twblue-9 #0064ff; pre-existing orange out of scope). COL-2 pass-with-caveat (amber/lime are Radix functional scales). A11Y-7 pass (semantic h1/h2/h3, ul/li, dl/dt/dd, landmarks). A11Y-8 pass (reorder/checkbox/copy carry aria-label + state; grip aria-hidden). LAY-2 pass-with-caveat (360 correct; 320 not exercised at verdict time). LAY-4 pass (preview prose max-w-[66ch]). CNT-3 pass (second person, active, ≤25 words). SLP-9 pass (no AI-writing tells).
>
> **UNCOVERED (feeds the ratchet):** The parent guest view renders the teacher comment via `dangerouslySetInnerHTML` (`report-preview.tsx:197`), labelled in-code "schema-constrained Tiptap output (prototype)." No in-scope control covers HTML-injection safety of shared content. Acceptable for a mock-data prototype; flag: a real parent-facing surface rendering teacher HTML needs sanitisation before any non-prototype ship.

## Re-audit — 2026-07-02 (end-to-end flow review, live browser)

Requested review of the shipped flow end to end. Fresh evidence captured live (agent-browser, ports isolated session): entry from `/reports` → builder (toggle/reorder/viz/Suggest exercised) → generate loading/error (`?fail=1`) and success (navigates to `/reports/36-2025-2` + toast) → share sheet with personal message → parent guest view (note + report + Acknowledge, title verified) → acknowledge (toast + inline confirm). Widths 1280/768/360/320 (scrollWidth = viewport at 320, no horizontal scroll); keyboard traversal logical with visible focus rings. Deterministic re-run this pass: `a11y-static.py` clean; `token-audit.py` flags only the known amber/lime Radix-scale tokens (previously adjudicated repo-convention pass). Prior three blocking L1 fixes (TYP-2/3, A11Y-9-guest) confirmed live.

**`tfx-design-evaluator` re-audit verdict (verbatim):**

> VERDICT: pass-with-findings
>
> This is a verify re-audit of an existing surface. The prior three blocking L1s (TYP-2, TYP-3, A11Y-9-guest) are confirmed fixed in code: the two micro-labels now render `text-[11px]` (`reports.build.tsx:413,418`), and the guest view sets a descriptive title (`_guest.report-view.$token.tsx:40-44`, "{studentName} · Holistic Development Profile" — verified live in 08-parent-view). But a runtime check surfaced one new blocking A11Y-11 failure that the prior static read missed, plus a content-authenticity defect against done-criterion 5.
>
> **BLOCKING (must fix before ship):**
>
> - **A11Y-11 fail (generate error) — verified from code + runtime observation, evidence source: code-read + orchestrator live-run.** `reports.build.tsx:232-236`: on failure the handler calls `setGenState('error')` then `errorRef.current?.focus()` synchronously in the same tick. The error `<div ref={errorRef} tabIndex={-1}>` is conditionally rendered on `genState === 'error'` (`:330`) and is not yet in the DOM when `.focus()` runs, so `errorRef.current` is `null` and focus never moves. The banner carries NO `role="alert"` / `aria-live` (grep confirms zero live regions in the file). The declared channel (focus-move, no live region) therefore never fires and there is no fallback — the error is silent to assistive technology. This is the "state change visually obvious but silent to AT" fail case in a11y-11.md. L1, no waiver on file → blocking. Fix: either wrap the focus call so it runs after paint (e.g. `requestAnimationFrame` / effect keyed on `genState`), or give the banner `role="alert"` and drop the focus move (pick one channel, not both). Recommend human re-test with a screen reader after the fix.
>
> - **Done-criterion 5 (content authenticity) partially not met — verified from code + screenshots, evidence source: code-read + 08-parent-view-full / 13-builder-320.** Criterion 5 requires P1 content "grounded in the real HDP artifact." The P1 student's Subjects section renders seven graded LO subjects — English Language, Chinese Language, Mathematics, **Science**, **Music**, **Art**, **Physical Education** — because `generateSubjects` (`mock-reports.ts:294`) maps over every key of `SUBJECT_OUTCOMES` uniformly for any student. Science is not a P1 subject in Singapore (starts P3), and graded LOs for Music/Art/PE at P1 are not authentic. The report itself does keep to LOs + descriptors with no % or A1–F9 (the numeric/grade half of criterion 5 is met), so this is *partial*: the format is right, the subject set undermines the "authentic P1" claim the concept test depends on. The record labels per-subject LO *wording* illustrative, but the subject *list* is a recognizable fake and reads as such in the parent view. Not covered by a specific in-scope control (CNT controls cover naming/voice, not domain accuracy), so this is graded against the contract criterion directly. Recommend HOD confirmation of the P1 subject set before test sessions.
>
> **ADVISORY (should fix):**
>
> - **A11Y-4 close call (unchanged from prior)** — reorder buttons are `size="icon-sm"` (32×32px, `reports.build.tsx:428-445`), above the 24px floor, below the 44px mobile clause. Builder is a stated laptop tool; accepted with rationale in the record's ratchet. Not a hard fail. No re-litigation.
> - **Draft persistence (functionality edge)** — builder state (toggles, order, comments) is component state only; leaving `/reports/build` and returning re-derives from the template and loses in-progress work. Escapable and safe, but not forgiving of partial completion/resume. Acceptable for a happy-path prototype; flag for the real build.
> - **RichTextEditor toolbar naming (pre-existing, out of new-file scope)** — shared `comms/rich-text-editor.tsx` names toolbar icon buttons via `title` only. Flag for the shared-component owner; the new "Suggest" button has a visible text label (`report-preview.tsx:189-191`), clean.
>
> **QUALITY GRADES:**
>
> - **Design quality — strong.** Clear hierarchy: role pill ("Editing this report"), context line ("Chloe Tan Xin Yi · P1-A · Term 2"), split controls/preview with sticky preview; the "you're adjusting this report only — the template stays the same" copy pre-empts shared-template anxiety. Reads in task order.
> - **Originality — appropriate.** All stack primitives (Checkbox, Button, Select, Sheet, RichTextEditor); status bars are functional wayfinding using the primary token, not SLP-1 rainbow decoration. No unwarranted novelty.
> - **Craft — strong with one nit.** Empty/loading/success/error states all designed; reorder disabled at boundaries; required section locked; "Not applicable at P1" labelling on off-by-default sections is a thoughtful touch. Nit: the error-state focus wiring is broken at runtime (see A11Y-11) — a craft miss in an otherwise well-designed state.
> - **Functionality — acceptable (down from prior "strong").** End-to-end flow completes (16-generate-success → /reports/36-2025-2 + toast; share → parent view renders layout + note + Acknowledge, 08/09). Two dents: the error state is silent to AT (recovery works visually but not for SR users), and no draft persistence on interrupt/resume. Not dead-ended, but the interruption case in the flow map is not preserved.
> - **Dark mode — N/A, product has no dark mode** (no toggle; confirmed by record and orchestrator observation 6).
>
> **JUDGMENT/HYBRID CONTROL NOTES:**
>
> - **A11Y-11 fail** — generate-error channel never fires (ref null at focus time, no live region); see blocking. Success/share/copy toasts are compliant single-channel transients.
> - **A11Y-7 pass** — semantic h1/h2/h3, `ul/li` for the section list, `dl/dt/dd` for pupil particulars, `<main>`/`<header>`/`<section aria-label>` landmarks (`reports.build.tsx`, `report-preview.tsx:106`).
> - **A11Y-8 pass** — reorder buttons carry `aria-label` ("Move {label} up/down"), checkbox `aria-label` ("Include {label}") with disabled+checked state tracking the visual for required rows; `GripVertical` is `aria-hidden`. State matches visual.
> - **CMP-1 pass** — asserted, no manifest — manifest absent for Teacher Workspace. Evidence source: product codebase read. Section row and share sheet are composition of existing Checkbox/Button/Select/Sheet/Input/Textarea, not a new component.
> - **CMP-2 pass/N-A** — no destructive action in the flow; "Reset to template" is non-destructive and re-derivable (toast confirms).
> - **CMP-3 pass** — loading (button spinner + "Generating report…"/"Sharing…"), success (toast + navigate / inline confirm), error (banner) exist per async action; loading is contextual, not a page takeover. (The error state's *announcement* fails A11Y-11, but the visible-state trio CMP-3 requires is present.)
> - **CNT-1 pass** — error copy states what happened + next step, names the object, no code: "Couldn't generate Chloe Tan Xin Yi's report. Check the student's data and try again." (`reports.build.tsx:337-340`).
> - **CNT-2 pass** — "Report Builder", "Share with parents", "Generate report", "Acknowledge report" — plain, no codenames/portmanteaus.
> - **CNT-3 pass** — second person, active, ≤25 words ("You're adjusting this report only…", "Parents open a private link to view Chloe's report on Parents Gateway").
> - **COL-1 pass** — primary CTAs (Generate report, Acknowledge, Share-with-parents) resolve to `bg-primary` (T&S Blue); existing orange report accents out of scope per record.
> - **COL-2 pass-with-caveat** — `amber-3/amber-11` (role pill) and `lime-3/lime-11` (sent/acknowledged) are Radix functional scales, consistent with existing report surfaces. Token-audit script flags them but the record documents the manual Radix verification; not re-run this pass.
> - **SLP-10 pass** — builder is a full-screen routed page (`/reports/build`), not a modal; the Share Sheet is a single-purpose side panel, not a multi-section task-in-a-modal.
> - **SLP-9 pass** — no buzzwords, em-dash chains, forced triads, or chatbot artifacts in the copy; the Suggest canned text reads as plausible teacher prose.
> - **LAY-2 pass** — 13-builder-320 confirms single-column reflow, no two-dimensional scroll, controls-above-preview reading order preserved; 11-builder-360 / 12-builder-768 consistent.
> - **LAY-4 pass** — preview prose capped at `max-w-[66ch]` (`report-preview.tsx:69`), within the ≤80ch measure.
>
> **Controls I could NOT independently verify (recommend human/screen-reader confirmation):**
> - A11Y-11 error announcement post-fix — I verified the *defect* from code + the orchestrator's runtime note; the fix (whichever channel) needs a real SR pass.
> - Deterministic scripts (validate, token-audit, type-scan, contrast) were NOT re-run this pass; TYP-2/TYP-3/TOK/COL token and type checks are code-review-verified only, not machine-verified this pass. [Orchestrator note: token-audit + a11y-static WERE re-run this pass by the orchestrator — a11y-static clean; token-audit only the known amber/lime findings.]
> - A11Y-1 contrast on `amber-11`-on-`amber-3` pill and `lime-11`-on-`lime-3` confirmation not machine-scanned this pass; Radix same-step pairings are conventionally AA but not verified here.
>
> **UNCOVERED (feeds the ratchet):**
> - Unchanged from prior: the parent guest view renders teacher comments via `dangerouslySetInnerHTML` (`report-preview.tsx:197`), labelled "schema-constrained Tiptap output (prototype)." No in-scope control covers HTML-injection safety of content rendered to another user. Acceptable for a mock-data prototype; a real parent-facing surface must sanitise (e.g. DOMPurify) before any non-prototype ship. Already recorded as a proposed anti-pattern in the record's Ratchet section.
> - Content-domain authenticity (the Science-at-P1 issue) has no covering control — the CNT family covers naming/voice, not curricular accuracy. This is a candidate ratchet item: "domain content must match the real-world artifact it claims to model" is not currently a checkable standard.

**Post-re-audit fixes applied (both blockers cleared, verified live):**

- **A11Y-11** — the generate-error focus move now runs in a `useEffect` keyed on `genState` (`reports.build.tsx`), so it fires after the banner renders. Verified live: after a failed generate, `document.activeElement` is the error banner. Single channel (focus move, no `role="alert"`), per the plan. Screen-reader re-test still recommended (`17-error-focus-fixed.png`).
- **Done-criterion 5** — lower-primary (P1–P2) reports now grade LOs for English Language, Chinese Language, and Mathematics only (`LOWER_PRIMARY_SUBJECTS` in `mock-reports.ts`); Science/Music/Art/PE no longer appear as graded P1 subjects. Verified live in the builder preview. Exact per-subject LO wording remains illustrative pending HOD confirmation (unchanged tradeoff).
- Gates re-run: `bunx tsc --noEmit` at the 111-error baseline (no regression); `a11y-static.py` clean.

## Ratchet

- **Proposed anti-pattern — "sanitise shared user-authored HTML"** `[proposed — pending design-lead approval]`: no current control covers HTML-injection safety of content rendered to another user. The parent guest view renders teacher comments via `dangerouslySetInnerHTML` (`report-preview.tsx`). Acceptable for this mock-data prototype, but a parent-facing surface rendering teacher-authored HTML must sanitise (e.g. DOMPurify) before any non-prototype ship. Same hazard already noted in `plans/README.md` rejected-findings for `announcements.new`.
- **A11Y-4 advisory — accepted with rationale**: reorder buttons use the portfolio-wide `size="icon-sm"` (32px), above the 24px floor but below the 44px mobile clause. The builder is a laptop tool (not a mobile task), so accepted for the prototype; revisit if a mobile/tablet build is targeted. Not a waiver (not a hard fail).
- **RichTextEditor toolbar naming** — pre-existing shared component names toolbar buttons via `title` only; flag for the shared-component owner (out of this surface's scope).
- No new control proposed beyond the sanitisation anti-pattern above.
