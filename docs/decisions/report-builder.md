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

## Ratchet

- **Proposed anti-pattern — "sanitise shared user-authored HTML"** `[proposed — pending design-lead approval]`: no current control covers HTML-injection safety of content rendered to another user. The parent guest view renders teacher comments via `dangerouslySetInnerHTML` (`report-preview.tsx`). Acceptable for this mock-data prototype, but a parent-facing surface rendering teacher-authored HTML must sanitise (e.g. DOMPurify) before any non-prototype ship. Same hazard already noted in `plans/README.md` rejected-findings for `announcements.new`.
- **A11Y-4 advisory — accepted with rationale**: reorder buttons use the portfolio-wide `size="icon-sm"` (32px), above the 24px floor but below the 44px mobile clause. The builder is a laptop tool (not a mobile task), so accepted for the prototype; revisit if a mobile/tablet build is targeted. Not a waiver (not a hard fail).
- **RichTextEditor toolbar naming** — pre-existing shared component names toolbar buttons via `title` only; flag for the shared-component owner (out of this surface's scope).
- No new control proposed beyond the sanitisation anti-pattern above.
