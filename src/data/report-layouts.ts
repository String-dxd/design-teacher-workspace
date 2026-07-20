// P1 (lower-primary) Holistic Development Profile — section + layout model.
//
// Grounded in the real HDP artifact (see docs/decisions/report-builder.md):
//   - Lower primary reports learning progress via subject-specific Learning Outcomes
//     (LOs) + qualitative descriptors. Marks/grades/percentages only begin at P3, so
//     NO marks/%/A1–F9 for P1.
//   - Schools also report Conduct/Comments/Attendance and Personal Qualities (with a
//     school-set rating), plus VIA / CCA / NAPFA "where applicable".
//   - At P1, CCA / VIA / NAPFA are typically not applicable, so they ship OFF by
//     default and are labelled accordingly in the builder (no phantom sections).
//
// The exact per-subject P1 LO statements are representative pending HOD sign-off.

import type { ReportBlock, ReportLayout } from '@/types/report'

function block(key: string, order: number): ReportBlock {
  return { key, enabled: true, order }
}

/**
 * P1 low-hanging-fruit default template: the authentic universal P1 sections only.
 * CCA/VIA/physical-fitness are omitted (off by default, "where applicable").
 */
const P1_DEFAULT_LAYOUT: ReportLayout = {
  blocks: [
    block('pupilInfo', 0),
    // Attendance and conduct live inside "Term at a glance" — no separate
    // sections, so the report never states them twice.
    block('termAtAGlance', 1),
    block('subjects', 2),
    block('personalQualities', 3),
    block('conduct', 4),
    // "Where applicable" sections — present but OFF by default at P1, so a teacher
    // can turn one on if it applies, and sees it's not typical at this level.
    { key: 'cca', enabled: false, order: 5 },
    { key: 'via', enabled: false, order: 6 },
    { key: 'physicalFitness', enabled: false, order: 7 },
  ],
}

/**
 * Append any default blocks missing from a stored layout — older saved
 * layouts pre-date newer sections (e.g. "Term at a glance"). Missing blocks
 * slot in near their default position, then orders are re-indexed.
 */
export function withDefaultBlocks(
  blocks: Array<ReportBlock>,
): Array<ReportBlock> {
  const present = new Set(blocks.map((b) => b.key))
  const merged = blocks.map((b) => ({ ...b }))
  for (const def of P1_DEFAULT_LAYOUT.blocks) {
    if (!present.has(def.key)) {
      merged.push({ ...def, order: def.order - 0.5 })
    }
  }
  return merged
    .sort((a, b) => a.order - b.order)
    .map((b, i) => ({ ...b, order: i }))
}
