# Design decision record — AI Draft for the post composer

> One record per page or significant change. Started at the Phase 3 plan gate (the
> approved plan is the fixed artifact the verify phase grades against), finished at
> Phase 6.

- **Date:** 2026-07-24
- **Product:** TW surface (Posts / Parents Gateway)
- **Change type:** modification (adds an AI-draft capability + mini-flow to the composer)
- **Page type:** form (workspace composer) with a pick-template → generate → fill mini-flow
- **Run type:** attended
- **The teacher and the moment:** Mr. Tan, secondary form teacher, has decided to put
  Alice forward for an overseas learning trip and is opening a post *with responses* to
  collect parental consent — and doesn't want to write the trip details, required items,
  deadline, and consent request from a blank page.

## Sprint contract (done-criteria)

1. From **both** post modes (view-only and with-response), a teacher can open AI Draft,
   choose a template, and have the post's fields pre-filled **without leaving the
   composer** — faster than starting blank.
2. AI Draft **never silently overwrites** in-progress work: a non-empty form triggers a
   confirm that states what will be replaced; cancelling leaves work untouched (CMP-2,
   CMP-8).
3. Generation has clear **loading / success / error** states; the result is announced +
   focus-managed for AT, and a visible "Drafted with AI — review before posting" cue sits
   with the filled content (CMP-3, A11Y-11).
4. Fill is **mode-appropriate**: with-response also fills the consent (Yes/No) decision,
   due date, a reminder, and an optional follow-up question; view-only fills title +
   description only (and offers an explicit switch to Yes/No for consent templates).
5. Reuses the existing AI-draft/template pattern and shared primitives — no new bespoke
   AI aesthetic, no purple/violet gradient, TW Blue primary preserved (CMP-1, CMP-7,
   SLP-1, COL-1).
6. The "Overseas Learning Trip" example content is realistic and carries an in-product
   "Example content" marker (CNT-4), in plain TW voice (IDN-3).

## Chosen approach

**Option A — in-form "AI Draft" button → `Dialog` template picker → in-place fill.**
The button sits in the composer header (outline + `Sparkles`), present in both modes,
hidden when editing a live post. The picker is an accessible radiogroup list of four
templates. On "Draft post": a non-empty form pre-confirms (AlertDialog) before replacing;
then an in-dialog generating state; on success the dialog closes, fields fill, focus moves
to Title, and an "Drafted with AI · Example content — review before posting" note appears.
Drafting logic lives in one shared engine (`src/lib/post-ai-draft.ts`); HeyTalia's
`buildDraft` delegates to it and offers the same templates as chips (ADR-0001). AI Draft
fills content + settings only, never recipients/audience (ADR-0002).

## Rejected options

- **Option B — route through HeyTalia.** Maximises reuse of the AI surface, but HeyTalia
  is a free-form chat assistant; templates and structured fields (consent, due date) fit
  awkwardly in chat, and attention leaves the form. (The engine is still shared with it —
  ADR-0001 — just not the doorway.)
- **Option C — empty-state inline on-ramp.** A "start with a template" strip atop an empty
  form. Competes with the Title for first-read (LAY-7) and still needs a header entry once
  content exists, so it ends up with two entry points anyway.

## Tradeoffs, named

- **No free-text prompt in v1** — template selection only; ad-hoc "draft me a post about X"
  stays HeyTalia's job. One clear job per doorway.
- **Two AI doorways on one screen** (HeyTalia + AI Draft) — mitigated by one shared engine
  (ADR-0001); not merged now to keep the change scoped and reversible.
- **Concrete illustrative content** — specifics are realistic but invented, so the draft
  carries an in-product "Example content" marker (CNT-4) rather than a domain-reviewer
  sign-off; a couple of truly teacher-specific values (coordinator name/email) stay
  `[For input: …]`.
- **HeyTalia's "Use draft" delivery left as a fast-follow** — it is a dead button today;
  finishing it is out of the post-composer scope (ADR-0001).
- **Picker is local to this route**, not promoted to `comms/` yet — smallest reversible
  change; promote later if forms wants it.

## Controls in scope

CMP-1, CMP-2 (L0), CMP-3, CMP-5, CMP-7, CMP-8, CMP-9, A11Y-1 (L0), A11Y-2 (L0),
A11Y-3 (L0), A11Y-5, A11Y-6, A11Y-8, A11Y-11, CNT-1, CNT-2, CNT-4, IDN-3, COL-1, SLP-1,
SLP-5, SLP-8, SLP-10, TOK-1..3, TYP-1..3, MOT-1. (LAY-1 N/A — no declared grid.)

## Waivers granted

| Control | Tier | Reason | Approver | Where recorded |
| ------- | ---- | ------ | -------- | -------------- |
| CMP-9 | L1 | Description renders to parents via the **pre-existing** `dangerouslySetInnerHTML`/`linkifyHtml` path (`announcements.new.tsx:446`). AI Draft injects only fixed, safe template HTML (allowlist tags: p, ul, li, strong, br) — no new unsanitised boundary. Sanitising the existing parent-render path is out of scope; flagged as a mock-data prototype deferral per CMP-9's detail. | Reza Ilmi (design-lead, in-session 2026-07-24) | this record |

> L0 controls are never waivable. L1 waivers need a named human approver.

## Plan approval

- **Approved by:** Reza Ilmi (design-lead), in-session
- **Approved on:** 2026-07-24
- **Grilled:** yes (`/grill-with-docs` — `/grilling` + `/domain-modeling`). Decisions the
  grill resolved: approach (Option A); fill scope (content + settings, never audience →
  ADR-0002); consent modeled as a Yes/No post (no new type); cross-mode (view-only +
  consent template → explicit "Switch to Yes/No & draft"); overwrite safety (pre-confirm
  when non-empty, no undo toast); engine sharing (unify engine not delivery → ADR-0001);
  content fidelity (concrete illustrative + in-product marker); naming ("AI Draft", CMP-7;
  glossary disambiguates Draft vs AI Draft). Glossary added to `CONTEXT.md`; ADRs 0001/0002
  written.

## Verify verdict

- **Screenshots:** `docs/decisions/assets/post-ai-draft/` —
  `1280-01-initial.png` (composer + AI Draft button), `1280-02-picker.png`,
  `1280-03-picker-selected.png`, `1280-04-loading.png`, `1280-05-success.png`
  (fill + focus-to-Title), `1280-06-note.png`, `1280-07-overwrite-confirm.png`,
  `1280-08-error.png`, `1280-09-viewonly-switch.png`, `360-picker.png`,
  `360-filled.png`, `768-filled.png`. CMP-3 states loading/success/error all
  captured.
- **Token block line range:** n/a (no `tfx-tokens` raw-colour block introduced)
- **Dark mode:** N/A — product has no dark mode (no theme toggle, no `.dark` layer)

- **CMP-1: asserted, no manifest — manifest absent for TW (Posts).** Evidence
  source (c): the picker composes only existing Base UI/shadcn primitives (Dialog,
  AlertDialog, Button, Badge) + lucide icons, as a local composition in the route
  file (mirroring the existing local `AnnouncementPreview`); no new shared component.

- **Deterministic controls (my changed surface):** all clean; every script
  finding is in pre-existing untouched code (the `AnnouncementPreview` phone mockup,
  existing `uppercase` section headings, HeyTalia's existing styles, the autosave
  `text-lime-11` indicator). Confirmed by line-range attribution and identical
  HEAD-vs-branch counts (lint 26=26, tsc 75=75).

### Verification ledger

| Control | Method | Evidence |
| --- | --- | --- |
| A11Y-1 | manual | No visible low-contrast text. `contrast.py`'s 3 flags (`#0064ff on #0064ff`) are opacity-modifier false positives on decorative `aria-hidden` icons (`announcements.new.tsx:3036`, selected-icon `bg-primary/10 text-primary`), identical to the pre-existing selector at 2454/2640. |
| A11Y-2 | manual | `a11y-static` (script) 0 findings in new code (the 2 flags at 800/814 are pre-existing preview mockup); manual keyboard pass: AI Draft button, template radios, footer buttons, dialog focus-trap all reachable; Title focus ring visible in `1280-05-success.png`. |
| A11Y-3 | script | `a11y-static` NAME: my buttons carry accessible names (snapshot: `button "AI Draft"`, named radios, `Draft post`, `Try again`, `Dismiss AI draft note`). |
| A11Y-8 | manual | `role="radiogroup"` + `role="radio"` + `aria-checked` (snapshot); `alertdialog` role; `role="alert"` on error. |
| A11Y-11 | manual | loading → `aria-live="polite"` (no focus steal); success → focus moves to `#title` (visible ring, `1280-05`); error → `role="alert"`. No double-announce (no success toast). |
| CMP-1 | manual | See CMP-1 verdict line above. |
| CMP-2 | manual | Overwrite `AlertDialog` states consequence + Replace (destructive variant) / Keep my draft (`1280-07`). |
| CMP-3 | manual | loading (`1280-04`), success (`1280-05`), error (`1280-08`) captured; `?aiFail=1` demo hook. |
| CMP-5 | manual | One filled primary per view (Post in header; Draft post / Switch in dialog); AI Draft outline, Preview ghost. |
| CMP-7 | manual | Picker selected-state matches the existing response-type selector; "AI Draft" label matches the agency-report precedent. |
| CMP-8 | manual | Cancel / Esc close the picker (focus returns to trigger); overwrite-confirm protects in-progress work; autosave draft unchanged. |
| CMP-9 | manual | Waived (L1) — see Waivers: pre-existing render boundary, fixed safe template HTML (allowlist p/ul/li/strong/br); prototype deferral flagged. |
| TOK-1..3 | script | `token-audit`: 0 findings in new code (`post-ai-draft.ts` clean; additions use only semantic tokens). File exit-1 = pre-existing palette/raw-colour in the mockup + HeyTalia. |
| TYP-1..4 | script | `type-scan`: 0 findings in new code. Pre-existing sub-14px / `uppercase` in the mockup + existing headings. |
| CNT-1 | manual | Error copy: "Couldn't draft the post. Something interrupted the draft. Check your connection and try again." (what happened → next step). |
| CNT-2 | manual | "AI Draft" plain-language; glossary disambiguates Draft vs AI Draft (`CONTEXT.md`). |
| CNT-3 | script | `content-lint` clean after tightening the 27-word intro to two sentences. |
| CNT-4 | manual | Concrete illustrative content + in-product "Example content" marker + `[For input: …]` placeholders for specifics. |
| CNT-6 | manual | L2 rationale — "please" retained only in parent-facing consent-letter bodies (register-appropriate courtesy; CNT-6 clarity exception). UI chrome carries no filler. |
| SLP-1 | manual | No purple/violet gradient; TW Blue + neutrals throughout (all frames). |
| SLP-5 | manual | Picker is a vertical selectable list, not an identical-card grid. |
| SLP-8 | manual | Base UI dialog transitions (zoom/fade); no bounce/elastic. |
| SLP-10 | manual | Template pick is single-section, single-choice → Dialog is appropriate (not forced into a page). |
| MOT-1 / A11Y-5 | manual | Dialog/overlay motion `duration-100` with `motion-reduce:animate-none` (Base UI); spinner is functional loading feedback. |
| LAY-2 | manual | Reflow verified at 360 (`360-picker.png`, `360-filled.png` — single column, no overflow), 768 (`768-filled.png`), 1280. |
| LAY-1 | manual | N/A — no declared grid (`.tfx/design.json` absent). |
| LAY-3/5/6/7 | manual | Judged by the evaluator (round 2 verdict): form/composer template, comfortable density, edges align at 1280, one focal region. |

### Post-evaluation fixes (round 1)

The first evaluator verdict was **FAIL** on one L0 (A11Y-1). Fixes applied before
re-verify:

1. **A11Y-1 (L0, blocker) — destructive button contrast.** Root cause was the shared
   Button `destructive` variant (`src/components/ui/button.tsx:21`): `text-destructive`
   = crimson-9 (`#e93d82`) on `bg-destructive/10` = 3.38:1. Changed to **`text-crimson-11`**
   (`#cb1d63` = 4.74:1, clears AA) — the repo's established functional-red-on-tint
   convention (already used in `question-builder.tsx`, `form-response-table.tsx`,
   `data-card.tsx`) and token-audit-allowlisted (`--color-crimson-11`). **This is a
   shared-primitive change, flagged per the conservative-defaults rule:** it repairs
   every destructive button product-wide (a latent L0), is a pure contrast improvement,
   and reverts by restoring `text-destructive`. See Ratchet.
2. **A11Y-2 (L0) — visible focus.** Added `focus-visible:outline-none focus-visible:ring-2
   focus-visible:ring-ring` to the template radio buttons and the dismiss-note button
   (raw `<button>`s that previously relied on the UA outline).
3. **A11Y-11 (L1) — error-path focus.** Added `autoFocus` to the "Try again" button so
   focus lands on it when the error state renders (the triggering button unmounts).
4. **CNT-2 (L1) — vocabulary.** Picker tags aligned to the composer/glossary:
   "Read only" → **View-only**, "Yes / No" → **Yes or No** (matches the response-type
   card and `CONTEXT.md`).
5. **CNT-4 (suggestion) — illustrative accuracy.** Event Notice date corrected: 5 Jul
   2026 is a Sunday → **4 July 2026 (Saturday)**.

Pass-with-caveat items left as-is with rationale: the hand-rolled `role="radio"`
radiogroup (no wrapped RadioGroup component exists; the pattern is accessible and
consistent with the file's existing selectors — CMP-1 "asserted, no manifest"); 12px
caption/description text (matches the file's existing caption pattern, passed type-scan).

- **Evaluator verdict (round 1 — FAIL, A11Y-1):** superseded by round 2 after the fixes above.

### Post-round-2 fixes

The round-2 verdict PASSED with two minor advisories, both fixed:
- **A11Y-1 (hover)** — destructive `hover:bg-destructive/20` gave crimson-11 = 4.12:1 on
  the darker hover tint. Added **`hover:text-crimson-12`** to the destructive variant
  (`button.tsx:21`), so text darkens on hover to clear AA at rest **and** hover.
- **CNT-2 (residual)** — the view-only secondary button "Draft as read-only" →
  **"Draft as view-only"** (`announcements.new.tsx:3086`), matching the "View-only" badge.

### Evaluator verdict (round 2 — verbatim)

VERDICT: pass-with-findings

The round-1 L0 blocker (A11Y-1, the destructive "Replace" button at 3.38:1) is **RESOLVED**. The fix corrects the root cause at the shared Button `destructive` variant (`src/components/ui/button.tsx:21`), switching `text-destructive` (crimson-9, `#e93d82`) to `text-crimson-11` (`#cb1d63`), giving 4.74:1 on `bg-destructive/10` — confirmed by computation and by the darker crimson label in the re-captured `1280-07-overwrite-confirm.png`. This is a conservative, revertible shared-primitive change that repairs every destructive button product-wide, documented in the record's "Post-evaluation fixes" section. All four round-1 advisories were addressed. No blockers remain. Two minor advisories are new/residual.

ROUND-1 FINDINGS — DISPOSITION:

- **A11Y-1 (L0) — RESOLVED.** `button.tsx:21` now `text-crimson-11`; resting contrast 4.74:1 (clears AA). See new hover advisory below.
- **A11Y-2 (L0) — RESOLVED.** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` added to the template radios (`announcements.new.tsx:3027`) and the dismiss-note button (`:2033`).
- **A11Y-11 (L1) — RESOLVED.** `autoFocus` on the "Try again" button (`:2986`) lands focus on the recovery action when the triggering button unmounts. No double-announce.
- **CNT-2 (L1) — MOSTLY RESOLVED.** Picker badges now "View-only" / "Yes or No" / "Acknowledge" (`:3013-3017`), switch note "switch this post to Yes or No" (`:3070`), CTA "Switch to Yes or No & draft" (`:3095`). One residual (fixed post-round-2 above).
- **CNT-4 (suggestion) — RESOLVED.** Event Notice date corrected to "4 July 2026 (Saturday)".
- **CMP-1 (L1, pass-with-caveat) — accepted.** No `RadioGroup` primitive exists in `src/components/ui/`; the `role="radio"` group is accessible and matches the file's existing selector pattern; "asserted, no manifest" recorded. Clean pass.
- **TYP-2 (L1, close call) — accepted.** 12px caption/description text matches the file's existing caption convention and passed type-scan.

ADVISORY (should fix):
- **A11Y-1 (hover state)** — destructive button text marginally sub-AA on hover: crimson-11 on `hover:bg-destructive/20` ≈ 4.12:1. Hover-only, transient; resting + focus clear AA. Recommend holding hover bg at `/10` or `text-crimson-12`. [Fixed post-round-2 via `hover:text-crimson-12`.]
- **CNT-2 (residual)** — the view-only switch state's action button still read "Draft as read-only" while its badge says "View-only". Recommend "Draft as view-only". [Fixed post-round-2.]

SUGGESTIONS (not violations):
- If keeping the custom radiogroup, add roving tabindex + arrow-key handling to complete the ARIA radio pattern (Tab + Enter/Space already work).
- Consider a `tabindex="-1"` focus target on the AI-note on success (weigh against double-announce).

QUALITY GRADES:
- **Design quality — strong.** Clean hierarchy; scannable single-column picker; AI note sits with the filled content; selected-state reuses the form's own card affordance.
- **Originality — strong.** Restrained and appropriate; reuses the existing selectable-card pattern, TW Blue accent, single Sparkles signifier; no AI-purple/gradient slop. The one custom (radiogroup) is justified — no stack primitive exists.
- **Craft — strong.** All states designed; contrast, focus, error-focus, vocabulary, and the illustrative date all corrected. Held back marginally by hover-contrast and one residual label (both since fixed).
- **Functionality — strong.** Completes the task, escapable at every step; work preserved or explicitly confirmed before overwrite; mode-appropriate fill; audience never auto-filled (ADR-0002); error recovery lands focus on the fix. All six done-criteria met.
- **Dark mode — N/A.** A `.dark` layer exists but no toggle activates it; never renders, no dark frame captured.

JUDGMENT CONTROL NOTES:
- **CMP-1** pass — no `RadioGroup` in `src/components/ui/`; `role="radio"` group `:3020` has no stack component to reuse; "asserted, no manifest" recorded.
- **CMP-2** pass — names objects + consequence; Replace/Keep my draft (`:3117-3139`).
- **CMP-3** pass — loading/success/error present and reachable (`1280-04/05/08`, `?aiFail=1`).
- **CMP-5** pass — one filled primary per view; AI Draft outline, Preview ghost, Replace destructive.
- **CMP-7** pass — picker selected-state (`:3029`) matches sibling selector (`:2699`); destructive fix is token-level, not an override.
- **CMP-8** pass — visible non-destructive exit at every step; `applyAiDraft` gated behind confirm (`:1156`).
- **CMP-9** pass (waived, L1) — `dangerouslySetInnerHTML` (`:478`) is same-user preview; AI Draft injects fixed `esc()`-escaped template HTML; L1 waiver with named approver + prototype-deferral flag.
- **A11Y-1** pass (resting) — Replace crimson-11 on `bg-destructive/10` = 4.74:1; primary 4.92:1. Caveat: destructive hover 4.12:1 (advisory; fixed post-round-2).
- **A11Y-2** pass — Button CVA rings; raw radios (`:3027`) + dismiss (`:2033`) now carry `focus-visible:ring-2 focus-visible:ring-ring`.
- **A11Y-3** pass — no unlabelled inputs; radiogroup `aria-label` (`:3000`); Title labelled.
- **A11Y-6** pass — decorative icons `aria-hidden`; dismiss `aria-label` (`:2034`).
- **A11Y-8** pass-with-caveat — `role=radiogroup`/`role=radio`/`aria-checked` (`:2999-3024`); `role=alert` on error. Caveat: no arrow-key/roving tabindex (Tab+Enter/Space operable).
- **A11Y-11** pass — loading `aria-live=polite` (`:2968`); success focus→`#title` (`:1163`); error `autoFocus`→Try again (`:2986`) + single `role=alert`.
- **CNT-1** pass — "Couldn't draft the post. Something interrupted the draft. Check your connection and try again."
- **CNT-2** pass-with-caveat — aligned except the residual "Draft as read-only" (`:3086`; fixed post-round-2).
- **CNT-4** pass — concrete-illustrative with "Example content" marker (`:2023`) + `[For input:]`; corrected weekday.
- **CNT-6** pass (rationale, L2) — "please" only in parent-facing letter bodies; UI chrome clean.
- **COL-1** pass — primary `bg-primary` twblue-9 `#0064ff`, white 4.92:1; TW Blue preserved.
- **IDN-3** pass — plain TW register; no switched voice.
- **SLP-1** pass — TW Blue + neutrals + functional crimson; no purple/violet gradient, cyan-on-dark, glow.
- **SLP-5** pass — vertical selectable list, not an identical feature-card grid.
- **SLP-8** pass — Base UI transitions + `active:scale-[0.96]`; no overshoot/bounce.
- **SLP-10** pass — single-section single-choice pick; Dialog appropriate.
- **TOK-1/2/3** pass — semantic tokens (incl. allowlisted `text-crimson-11`), scale spacing/radii; `post-ai-draft.ts` style-free.
- **TYP-1/3** pass — Inter/Plus Jakarta only; sizes on scale.
- **TYP-2** pass-with-caveat — 12px full-sentence captions accepted per rationale.
- **MOT-1** pass — 100-150ms, explicit transitions, no `transition-all` in new code; spinner is functional feedback.
- **LAY-2** pass — single-column reflow across 360/768 (`360-picker.png`/`360-filled.png`/`768-filled.png`); 320 not literally captured.
- **LAY-3** pass — form/composer template + modal mini-flow.
- **LAY-5** pass — comfortable data-entry density.
- **LAY-6** pass — shared edges align at 1280.
- **LAY-7** pass — one focal region; correct reading order.
- **LAY-1** N/A — no declared grid.

UNCOVERED (defects no in-scope control covers):
- None introduced by this change. Pre-existing observations (out of scope, correctly attributed to untouched code): the response-type selector uses `transition-all` (`:2697`, MOT-1 tell); the AnnouncementPreview phone mockup uses raw `text-slate-*` colours, `text-[10px]` (below the 11px floor), and `uppercase` headings (`:472`, `:2669`). Worth a future ratchet pass.

## Follow-up UX fixes (post-acceptance, same session)

User-requested after trying the build:

1. **Composer action bar now sticky.** The composer's top bar (title · AI Draft ·
   Hide Preview · Post) was `sticky top-0` inside the same scroll container as the app
   header (`sticky top-0 z-30 h-14`), so it hid *behind* the app header on scroll.
   Changed to `sticky top-14 z-20` (`announcements.new.tsx`) so it pins just below the
   app header and the actions stay reachable while scrolling. Verified in
   `assets/post-ai-draft/1280-11-sticky-scrolled.png`.
2. **Sidebar no longer auto-collapses on tablet.** At tablet widths (768–1023px) the
   sidebar defaulted to the icon rail and treated "expand" as ephemeral. Persisted the
   tablet expand choice (`sidebar_tablet_state` in localStorage, seeded hydration-safe
   in the provider's layout effect — same pattern as the desktop `open` preference),
   so once expanded it survives reloads. Verified: 900px → default collapsed → toggle →
   expanded → reload → still expanded. Shell change in `src/components/ui/sidebar.tsx`
   (builds on the in-flight sidebar refactor already in the working tree).

## Ratchet

**No new catalog control proposed.** The one systemic defect the evaluator surfaced —
the shared Button `destructive` variant failing A11Y-1 (crimson-9 text on a crimson
tint, 3.38:1, product-wide) — is already covered by A11Y-1; it was a latent
non-compliance, not an uncovered gap. Fixed at the root (`text-crimson-11` +
`hover:text-crimson-12`).

**Harness-feedback candidate (check limitation, not a control gap) — pending go-ahead.**
The deterministic `checks/contrast.py` **missed** this real L0 and simultaneously
emitted false positives (`#0064ff on #0064ff = 1.00:1` on the picker's decorative
icons). Both stem from two blind spots: (a) it does not resolve Tailwind **opacity
modifiers** (`text-primary` + `bg-primary/10` is read as same-colour, not text-on-tint),
and (b) it only reads **line-local** class strings, so a contrast pairing that lives in a
shared `cva()` variant (here `button.tsx`) is never checked against the surfaces that use
it. Proposed feedback to the harness repo (via the `feedback` skill): teach
`contrast.py` to (a) apply opacity modifiers when computing the tint, and (b) optionally
resolve `cva()`/`buttonVariants` class strings so shared-component contrast is caught at
the definition. This is exactly the "default-contrast miss CMP-7's rationale warns about"
that the evaluator had to catch manually. **Not yet filed — outward action; awaiting the
maintainer's go-ahead.**

**Pre-existing cleanup candidates (out of scope for this change, noted for a future
pass):** the response-type selector uses `transition-all` (`announcements.new.tsx:2697`,
an MOT-1 tell); the `AnnouncementPreview` phone mockup uses raw `text-slate-*` colours,
`text-[9px/10px]` (below the 11px type-scale floor), and `uppercase` section headings.
None introduced by this change.
