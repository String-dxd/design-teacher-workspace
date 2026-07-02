# Design decision record — Home "Featured" card: vertical on mobile

> One record per page or significant change. Started at the Phase 3 plan gate (the
> approved plan is the fixed artifact the verify phase grades against), finished at
> Phase 6. Keeps the human approval, waivers, and verdict traceable.

- **Date:** 2026-06-29
- **Product:** TW
- **Change type:** modification
- **Page type:** workspace view (home / app launcher)
- **Run type:** attended
- **The teacher and the moment:** A teacher opening Teacher Workspace on their phone, scanning the home page to pick a tool. On a narrow screen the Featured card should read in the same top-to-bottom order as the stacked cards directly below it.

## Sprint contract (done-criteria)

1. Below 640px, the Featured card stacks vertically — icon on top, then title (+ Beta badge), then description — matching the Frequently Used cards' orientation.
2. At ≥640px, the Featured card keeps its current horizontal layout unchanged (icon left, text right, fixed `h-[132px]`).
3. Orientation only — no change to copy, icon, colors, border, radius, or hover behavior.
4. Reflows cleanly with no clipping/overflow down to 320px (LAY-2); the card's tap target stays ≥44px on mobile (A11Y-4).

## Chosen approach

Made `FeaturedAppCard` (`src/components/app-card.tsx`) mobile-first vertical, reverting to the original horizontal layout at the `sm` breakpoint. Single className change:

```diff
- group flex h-[132px] w-full items-center gap-4 rounded-[14px] border border-[#C8C8C8] bg-white p-4 transition-colors hover:bg-muted/50
+ group flex w-full flex-col gap-4 rounded-[14px] border border-[#C8C8C8] bg-white p-4 transition-colors hover:bg-muted/50 sm:h-[132px] sm:flex-row sm:items-center
```

This converges the Featured card on the existing `AppCard` `flex flex-col gap-4` pattern (the Frequently Used cards) on mobile, rather than inventing a new responsive scheme. Diverge (Phase 2) was skipped — the structure is fixed and this is a scoped modification.

## Rejected options

- **Vertical at all screen sizes** — rejected by the user at the Phase 1 scope question. On desktop the Featured card is full-width; the horizontal layout (icon left, text right) is the deliberate use of that width. Scope was set to mobile-only to preserve it.

## Tradeoffs, named

- Featured and Frequently Used stay structurally different on desktop (1 wide card vs a 3-col grid) — intentional; the Featured card is meant to stand out, and the change was scoped to mobile.
- Kept the off-scale `h-[132px]` and the pre-existing raw-hex colors (`border-[#C8C8C8]`, `bg-white`) rather than refactoring them — deliberate, to keep this change minimal and reversible. Flagged below as a candidate for a separate token-cleanup pass.

## Controls in scope

LAY-2, A11Y-4, TOK-2, TOK-3, SLP-7, and the Phase-4 conservative-defaults rule. (No async or destructive action on this surface, so CMP-2/CMP-3 do not attach.)

## Waivers granted

| Control | Tier | Reason | Approver | Where recorded |
| ------- | ---- | ------ | -------- | -------------- |
| —       | —    | none   | —        | —              |

> L0 controls are never waivable. L1 waivers need a named human approver. L2 waivers
> need a specific, real reason.

## Plan approval

- **Approved by:** Reza Ilmi (user)
- **Approved on:** 2026-06-29 (typed "implement" after reviewing the plan)

## Verify verdict

- **Screenshots:** (scratchpad, session 5e1772e2)
  - `ok-360.png` — 360px, vertical (clean)
  - `clean-320.png` — 320px reflow, vertical (clean)
  - `clean-768.png` — 768px, horizontal (≥640)
  - `desktop-clean.png` — 1280px, horizontal, fully clean
- **Token block line range:** n/a — no `tfx-tokens` exempt region.
- **Dark mode:** N/A for this change — the diff is layout-only and touches no color tokens. The product has partial dark-mode infrastructure (`.dark` layer in `src/styles.css`, `dark:` variants in some `ui/` primitives), but `FeaturedAppCard`'s colors (`bg-white`, `border-[#C8C8C8]`) are pre-existing and unchanged here.
- **Deterministic controls:** `token-audit.py` run on `app-card.tsx` → 7 findings (TOK-1 `#0064ff`×2 + `#C8C8C8`; COL-2 four palette hover classes), all confirmed **pre-existing** (lines unchanged by this diff), **0 new**. LAY-2 / A11Y-4 / TOK-2 / TOK-3 / SLP-7 verified manually from code + screenshots and independently by the evaluator. `a11y-static.py` not run — no form fields, focus changes, or new click handlers in this layout-only diff.
- **Note (diff vs git HEAD):** `app-card.tsx` had an uncommitted modification at session start (`M` in git status). The working-tree baseline I edited already contained `w-full`, which I preserved; the evaluator's diff against git HEAD therefore flagged `w-full` as net-new vs HEAD — a verified no-op (the parent `<section className="flex flex-col">` in `src/routes/index.tsx:20` already stretches the card to full width). The change I made is exactly the 1-line edit above (1 insertion / 1 deletion).
- **Evaluator verdict:** (`tfx-design-evaluator`, verbatim)

  > VERDICT: pass
  >
  > BLOCKING (must fix before ship):
  >
  > - None.
  >
  > ADVISORY (should fix):
  >
  > - None within scope. One note for the decision record (not a control failure): the stated "before" className in the sprint brief included `w-full`, but the actual committed `before` (git HEAD, line 151) did NOT — `w-full` is a net-new utility added by this diff, not a relocation. It is a verified no-op (parent `<section className="flex flex-col">` in `src/routes/index.tsx:20` already stretches the card to full width, and the prior version had no width constraint), so behavior is unchanged and reversible. Flagging only because the brief's diff text and the real diff disagree; the real diff is 1 insertion / 1 deletion as claimed.
  >
  > QUALITY GRADES:
  >
  > - Design quality — strong. The vertical stack at 320/360 (icon → "Student Insights" + "Beta" badge → "Holistic insights that help every student thrive") reads top-to-bottom in task order and now matches the Frequently Used cards' orientation directly below it (verified ok-360.png, clean-320.png); hierarchy and gap rhythm are preserved.
  > - Originality — strong (appropriate, non-novel). The change makes the Featured card converge on the existing `AppCard` `flex flex-col gap-4` pattern rather than inventing a new responsive scheme; no unwarranted novelty.
  > - Craft — strong. The responsive boundary is deliberate and clean: horizontal `h-[132px]` layout intact at 768/1280 (clean-768.png, desktop-clean.png), vertical with no clipping or overflow at 320 (clean-320.png). Edge content length (the full description, un-truncated since `FeaturedAppCard` has no `line-clamp`) wraps cleanly at every width.
  > - Functionality — strong. The card remains a single link to the app at every width; no dead ends, no state regressions. Hover (`hover:bg-muted/50`) and the icon `mix-blend` hover are untouched by a layout-only diff.
  >
  > JUDGMENT CONTROL NOTES (one line per in-scope control):
  >
  > - [LAY-2] pass — verified from screenshot (clean-320.png at 320 CSS px): single-column reflow, no horizontal scroll on the page body, reading order icon→title+badge→description intact, the card (the only primary control on this surface) fully reachable. The 320 target was explicitly tested, satisfying the control's "do not rely on 360" caveat.
  > - [A11Y-4] pass — verified from code + screenshot: the entire card is one `<a>`/`<Link>` (app-card.tsx:168-185); at 320/360 it renders as a full-width block far exceeding 44px in both dimensions (the `AppIcon` alone is `size-16` = 64px). Tap target stays ≥44px on mobile.
  > - [TOK-2] pass — verified from code: this diff introduces no new spacing values. Spacing utilities are `gap-4`, `p-4` (on-scale), plus layout-only `flex-col`/`sm:flex-row`/`sm:items-center`/`w-full`. No off-scale margin/padding/gap added.
  > - [TOK-3] pass — verified from code + screenshot: no new radius introduced. `rounded-[14px]` is pre-existing (git HEAD line 151) and is shared by both `AppCard` and `FeaturedAppCard` (app-card.tsx:84, 151) and the icon tiles — peer cards on this surface use one consistent radius (visible in desktop-clean.png), so the peer-consistency half of TOK-3 also holds.
  > - [SLP-7] pass — verified from code + screenshot: spacing rhythm preserved — outer `gap-4` between icon and text block, inner `gap-2` between title row and description (app-card.tsx:151,158,159). Related items grouped tighter than the section-level `gap-8` (index.tsx:17); not a single uniform value.
  > - [Conservative-defaults rule, Phase 4] pass — verified from diff: colors (`border-[#C8C8C8]`, `bg-white`, `bg-muted/50`), border, radius (`rounded-[14px]`), icon, and copy are byte-for-byte unchanged; the diff is purely orientation utilities and is trivially reversible (1 insertion / 1 deletion).
  >
  > Contract compliance (items 1–4):
  >
  > - Contract 1 (stacks vertically <640px: icon → title+badge → description, matching Frequently Used) — MET. Verified clean-320.png and ok-360.png: vertical order is icon, then "Student Insights" + "Beta", then description, mirroring the SC/SC Mobile cards below.
  > - Contract 2 (≥640px keeps horizontal layout unchanged, fixed h-[132px]) — MET. Verified clean-768.png and desktop-clean.png: icon left, text right, fixed-height card; `sm:h-[132px] sm:flex-row sm:items-center` restores the original behavior at the `sm` breakpoint.
  > - Contract 3 (orientation only — no copy/icon/color/border/radius/hover change) — MET. Verified from diff: only flex-direction/alignment/height-breakpoint/width utilities changed; everything else identical.
  > - Contract 4 (clean reflow to 320, no clipping/overflow, LAY-2; tap target ≥44px, A11Y-4) — MET. clean-320.png shows clean reflow with no clipping/overflow; tap target is the full card link (≥44px).
  >
  > Pre-existing issues confirmation:
  >
  > - `border-[#C8C8C8]` and `bg-white` on `FeaturedAppCard` — CONFIRMED pre-existing (git HEAD line 151 carries both); untouched by this diff (TOK-1/COL-1/COL-2, not introduced or worsened).
  > - `bg-[#0064ff]`, `text-[#0064ff]`, and Tailwind-palette hover classes (`group-hover:text-pink-500`, `orange-500`, `green-500`, `purple-500`) in `AppIcon` — CONFIRMED pre-existing (git HEAD lines 8,10,11,12,39,54); `AppIcon` was not modified (TOK-1/COL-1/COL-2, not introduced or worsened).
  > - `rounded-[14px]` off-scale radius — CONFIRMED pre-existing on both `AppCard` and `FeaturedAppCard` (git HEAD lines 84, 151); not introduced or worsened.
  > - All 7 token-audit findings are attributable to lines unchanged by this diff. Note: I did not re-run token-audit.py myself; I confirmed pre-existence by diffing against git HEAD, which is sufficient to establish the diff did not introduce them.
  >
  > UNCOVERED (defects no control covers):
  >
  > - None.
  >
  > Overall verdict: SHIP. The diff is a minimal, reversible, layout-only change (1 insertion / 1 deletion) that fully satisfies all four contract items and passes every in-scope control on verified evidence. The 320px reflow target was explicitly captured and is clean (the most important control here, LAY-2). All TOK-1/COL-1/COL-2 violations present on the surface are confirmed pre-existing via git HEAD and were deliberately left out of scope. The only thing worth recording is the cosmetic discrepancy between the brief's stated "before" and the real `before` (`w-full` is added, not relocated) — a verified no-op, not a blocker.

## Ratchet

ratchet: no proposal — nothing uncovered. (The pre-existing raw-hex / off-scale-radius issues on `app-card.tsx` are already covered by TOK-1/TOK-3 and are out of scope here; worth a dedicated token-cleanup task, not a new control.)
