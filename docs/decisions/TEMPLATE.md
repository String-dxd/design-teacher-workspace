# Design decision record — <page or change name>

> One record per page or significant change. Started at the Phase 3 plan gate (the
> approved plan is the fixed artifact the verify phase grades against), finished at
> Phase 6. Keeps the human approval, waivers, and verdict traceable.

- **Date:**
- **Product:** TW | CaseSync | Glow | TW surface (Posts / PG Staff Portal)
- **Change type:** new page | modification
- **Page type:** workspace view | form | flow step | dashboard | settings | empty state | onboarding
- **Run type:** attended | unattended (operator-proxy approvals)
- **The teacher and the moment:** (name the specific workflow this serves)

## Sprint contract (done-criteria)

1.
2.
3.

## Chosen approach

What was built, and the option chosen at diverge.

## Rejected options

- **Option B** — why not.
- **Option C** — why not.

## Tradeoffs, named

What this design sacrifices and why that's acceptable (TFX-DS principle 4: Name the
Tradeoff). A record without this section is incomplete.

## Controls in scope

List the catalog controls the changed surface pulls in (by id). Note: any surface
with an async or destructive action inherits the `applies_to: [flow]` controls
(CMP-2, CMP-3) even as a single page.

## Waivers granted

| Control | Tier | Reason | Approver | Where recorded                   |
| ------- | ---- | ------ | -------- | -------------------------------- |
|         |      |        |          | inline `tfx-waive` / this record |

> L0 controls are never waivable. L1 waivers need a named human approver. L2 waivers
> need a specific, real reason.

## Plan approval

- **Approved by:**
- **Approved on:**

## Verify verdict

- **Screenshots:** (paths — width evidence at 360/768/1280, plus one frame per state
  asserted by each in-scope hybrid control, loading included)
- **Token block line range:** (the `tfx-tokens` region exempt from token-audit, e.g.
  `attendance.html:12-68`)
- **Dark mode:** supported (dark frame captured at <path>) | N/A — product has no
  dark mode
- **Deterministic controls:** which were script-checked vs. verified manually vs.
  left unverified — per control.
- **Evaluator verdict:** paste the full `tfx-design-evaluator` verdict **verbatim** — a
  summary here is a defect; this record is the durable artifact.

## Ratchet

Any defect no control covered → the new control or anti-pattern proposed as a result,
marked `[proposed — pending design-lead approval]`. If nothing qualifies, record
"ratchet: no proposal — nothing uncovered" — a valid outcome, not a blank.
