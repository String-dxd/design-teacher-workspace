# Harness feedback log

Ratchet items and standards gaps surfaced while using the tfx-design-ui harness on this repo. Each item is recorded here and shared to the owner repo (`transformteamsg/tfx-design-standard`) as an issue.

| Date       | Item                                                        | Type                     | Source work                                                                             | Owner-repo issue                                                                                           |
| ---------- | ----------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 2026-07-06 | Sanitise user-authored HTML rendered to another user        | Anti-pattern (security)  | HDP report builder + parent guest view (`report-preview.tsx` `dangerouslySetInnerHTML`) | [transformteamsg/tfx-design-standard#26](https://github.com/transformteamsg/tfx-design-standard/issues/26) |
| 2026-07-06 | Domain content must match the real-world artifact it models | Control (CNT family, L2) | HDP P1 reports (Science-at-P1, "Statistics & Probability" P1 LO)                        | [transformteamsg/tfx-design-standard#27](https://github.com/transformteamsg/tfx-design-standard/issues/27) |

## Details

### 1 — Sanitise shared user-authored HTML (#26)

No control covers HTML-injection safety of content authored by one user and rendered to another. Teacher rich-text comments render to parents via `dangerouslySetInnerHTML`; "schema-constrained at author time" is not a render-boundary guarantee. Surfaced as an UNCOVERED finding in both `report-builder.md` and `reports-cycle-hub.md` evaluator passes. Proposed L1 (waivable for isolated prototypes with a recorded note).

### 2 — Domain-content authenticity (#27)

The CNT family covers naming/voice, not factual/domain accuracy. A recognisably-wrong domain detail (Science graded at P1; an invented P1 Maths LO) undermines a concept test even when all other controls pass. Proposed L2: modelled content must be faithful to its source artifact or explicitly labelled illustrative, with a domain reviewer (e.g. HOD) sign-off before user testing.
