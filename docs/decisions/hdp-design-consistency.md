# Design decision record — HDP design-consistency pass (report document, hub, write, layout, dialogs)

- **Date:** 2026-07-13
- **Product:** TW (Teacher Workspace)
- **Change type:** modification (restyle + component-reuse) across the Holistic Development Report surfaces
- **Page type:** flow surfaces (cycle hub → layout → write → share) + the shared parent-facing report document, rendered across write / layout preview / PG-preview dialog / parent guest view
- **Run type:** unattended — **approved by operator proxy** (user set a `/goal`, then stated "don't ask me questions, use your judgement" and went AFK). Recorded as operator proxy, not a human plan review.
- **The teacher and the moment:** Ms. Tan, P1 form teacher, the week ~30 holistic reports are due — she moves between the hub, the write page, and the parent preview many times; visual inconsistency between these and the rest of the app (Posts, Student Insights) adds friction and erodes trust in the report she's about to send parents.

## Intent (sprint contract)

Make the HDP surfaces read as the same product as the rest of the app. Done-criteria:

1. No hard-coded colour literals on any HDP surface — every colour resolves to a semantic token or a Radix scale (TOK-1).
2. One single source of truth for the parent-facing accent — the Radix `orange` scale — used identically wherever a Parents-Gateway/parent-action accent appears (COL-2).
3. Components the design system ships (`ui/Button`, `ui/Badge`, `ui/Alert`) are used instead of hand-rolled equivalents; the one justified deviation (a local `DocCard` for the dense document) is recorded here (CMP-1, CMP-7).
4. No all-caps text (TYP-4); no sub-11px type (TYP-2); arbitrary font sizes replaced with scale steps (TYP-3).
5. Gates hold: `tsc` 81 (0 new), `vitest` 98 pass / 24 fail (pre-existing jsdom race), `build` exit 0. No regression on any of the four shared report-document surfaces.

Full findings + exact fixes: `plans/027-hdp-colour-token-hygiene.md` and `plans/028-hdp-component-reuse-and-document-polish.md` (the approved plan). Grounded in an agent-browser visual baseline (cycle hub, write, layout, PG dialog vs. Posts + Student Insights) and a re-verified code audit — this fulfils the critique-first requirement for existing surfaces.

## Chosen approach

Scoped modification loop (structure is fixed — no diverge). Token/colour swaps first (027), then component-reuse + type/polish (028), then the copy pass (029 / `tfx:copy`) — all three landed in this branch. Executed per-file to avoid double-editing the same lines. Conservative, reversible defaults: no layout restructure; deliberate elements (the phone-mockup bezel geometry, the certificate-style identity band) preserved.

### Parent-accent decision, refined after the AA re-check

The initial premise ("parent accent = Radix `orange`, `orange-9` fills with white text") was **wrong on contrast**: `white`/`orange-9` = 2.97:1 and no orange fill step clears AA with white _or_ dark text (`orange-12`/`orange-9` = 3.91). The refined, AA-correct decision:

- **Decorative parent accent = `orange-11` text on the white card** (`orange-11`/white = 4.51:1 ✓) — the student-name header.
- **Primary actions & count indicators = the app's brand primary `twblue`** (`white`/`twblue-9` = 4.92:1 ✓) — the Acknowledge CTA and the filter-count badges. This is also more correct per COL-1/CMP-5 (primary actions use the product's own brand primary), so the Acknowledge button dropped its orange override for the default `Button`.
- **Functional status tints = step-12 text on a step-3 tint** (9–12:1 ✓) everywhere — the report-document pills already did this; the cycle-hub badges and the layout template badge were moved from the failing step-11 (`amber-11`/`amber-3` = 4.25, `lime-11`/`lime-3` = 4.29) to step-12 to match. The `sent` badge (`twblue-11`/`twblue-3` = 5.03) already passed and was left.

### Write-route Alert conversion — deliberately not done

Plan 028 Step 3 listed converting the write page's info/error banners to `ui/Alert`. Left as-is on purpose: the error banner is a focus-managed surface (`errorRef` + `tabIndex={-1}`), and `ui/Alert` adds `role="alert"` — which on a focus target double-announces (A11Y-11). The hand-rolled banners are already fully tokenized, so there was no correctness gain. The write route is untouched by this branch.

## Controls in scope

- **TOK-1/2/3** — no raw colour; on-scale spacing/radii. Primary driver of 027.
- **COL-2** — functional/parent accent from Radix `orange`.
- **COL-1** — brand primary stays TW Blue (`twblue-9`), unchanged.
- **CMP-1/CMP-7** — use DS components at their defaults; hand-rolled buttons/badges/alerts → `ui/*`.
- **TYP-2/3/4** — labels ≥11px, on-scale sizes, no all-caps. Found during implement (the `uppercase` student name and `text-[10px]`), fixed in scope per the "preserved is not waived" rule.
- **A11Y-1** — every colour swap re-checked for AA (`orange-11` for text on tint, `orange-9` for solid fills with white text).
- **SLP-4** — the DocCard decision avoids adding `ui/Card`'s heavy `rounded-3xl` chrome as nested cards inside the report container.

## Waivers / documented deviations

| Control | Deviation                                                                                                                       | Reason                                                                                                                                                                                                                                                                                                                                              | Approver                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| CMP-1   | Six hand-rolled document sub-cards consolidated into ONE local `DocCard` in `report-preview.tsx` rather than adopting `ui/Card` | `ui/Card` is `rounded-3xl ring-1 py-6` — far heavier than the dense, print-like report sub-cards (`rounded-xl border px-3.5 py-4`), and it renders _inside_ the report container, so adopting it would create nested-card chrome (SLP-4 tension). DocCard keeps identical classes → zero visual regression while removing the six-copy duplication. | operator proxy (unattended) |

## Tradeoffs, named

- Copy fixes (Title Case → sentence case, "Good job!", apostrophes, "Issued date") **landed in this branch** via plan 029 / `tfx:copy` — the visual (027/028) and copy (029) passes ship together.
- `DocCard` is a local helper, not a design-system component — accepted CMP-1 deviation (inline `tfx-waive` at its definition + the table above); if the pattern recurs elsewhere it should graduate to the DS. Approver is operator proxy (unattended) — a human should ratify this L1 deviation on review.
- The app defines a complete `.dark` token layer in `src/styles.css` but ships **no UI theme toggle**, so dark mode can't be enabled today; removing `bg-white`/default-slate makes the surfaces genuinely dark-correct (verified by token-correctness, since no live dark render is possible).

## Verify verdict

**Round 1 (evaluator agent): FAIL** — blocking L0 A11Y-1 contrast failures on the colour swaps (the token/component/copy hygiene was otherwise clean and complete):

1. `white`/`orange-9` = 2.97:1 — Acknowledge button (`pg-report-preview-dialog.tsx`) + filter-count badges (`holistic-reports.index.tsx`, and the identical pre-existing one in `reports.index.tsx`).
2. `amber-11`/`amber-3` = 4.25:1 — layout template badge (`reports.cycle.layout.tsx`).
3. `amber-11`/`amber-3` + `lime-11`/`lime-3` (4.25 / 4.29) — cycle-hub status badges (`cycle-student-table.tsx`, pre-existing, on the in-scope hub surface; the pass had fixed the report pills to step-12 but left the hub badges at step-11, so the two surfaces disagreed on the exact axis this pass targeted).

Advisories: CMP-7 colour-override AA re-check was skipped (root cause of the above); the DocCard waiver lacked an inline annotation + named approver; the record's copy/dark-mode notes were inaccurate.

**Remediation (this branch):** all three blocking items fixed with computed AA proof — Acknowledge CTA + count badges → `twblue` primary (4.92:1); template + hub badges → step-12 (`amber-12`/`amber-3` = 10.47, `lime-12`/`lime-3` = 9.82); the two remaining `orange-11`/`lime-11` usages are on the white card (4.51 / 4.80), not tints. Advisories addressed: `tfx-waive CMP-1` annotation added at DocCard; record corrected (copy landed, dark-layer exists sans toggle, write-route skip documented). Gates held throughout: tsc 81 (0 new), vitest 98/24, build 0, eslint clean.

**Round 2 (re-verify by the same evaluator agent, contrast-only): PASS** — verbatim:

> RE-VERDICT (contrast re-check only): PASS. All three blocking L0 A11Y-1 failures are resolved in the current diff, and no new step-11-on-tint or white-on-bright-9 pairing was introduced. Computed from the actual Radix/twblue hexes: Acknowledge button + both filter-count badges → white on twblue-9 = 4.92:1 ✓ (also COL-1/CMP-5-correct); layout template badge amber-12/amber-3 = 10.47:1 ✓; cycle-hub status badges amber-12/amber-3 = 10.47, lime-12/lime-3 = 9.82 ✓ (no `-11` remain); `sent` badge twblue-11/twblue-3 = 5.03 ✓ correctly left; student name twblue-11/white = 5.63 ✓; check icon lime-11/white = 4.80 ✓. Residual ADVISORY (non-blocking): PG-mockup student name orange-11 on white = 4.51:1 — clears the 4.5 floor by 0.01; a human should confirm with a picker (the scale ships a P3 wide-gamut variant). No residual blocking item; the contrast dimension is clean.

**Post-fix visual verification** (agent-browser, `127.0.0.1:3000` — pixel capture recovered late in the run): hub, write page (report document), and PG preview dialog all render correctly — proper-case student name (TYP-4 fix visible), sentence-case labels, tokenized orange accent, `ui/Badge`/`ui/Button` throughout. The one still-owed human eyeball: the marginal `orange-11` name (4.51:1) with a colour picker, and the DocCard/Badge layout rhythm across all four `report-preview` surfaces.
