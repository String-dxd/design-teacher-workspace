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

export interface SectionDef {
  key: string
  label: string
  description: string
  /** Required sections cannot be toggled off (e.g. pupil particulars). */
  required?: boolean
  /**
   * false → not applicable at P1: ships off by default and is labelled
   * "Not applicable at P1" in the builder.
   */
  applicableAtP1?: boolean
}

/** The authentic HDP section set, scoped to P1. Order is the default report order. */
export const P1_SECTION_DEFS: Array<SectionDef> = [
  {
    key: 'pupilInfo',
    label: 'Pupil particulars',
    description: 'Name, class, age, identification, form teacher',
    required: true,
    applicableAtP1: true,
  },
  {
    key: 'termAtAGlance',
    label: 'Term at a glance',
    description: 'Strongest and growing subjects, conduct, and attendance',
    applicableAtP1: true,
  },
  {
    key: 'subjects',
    label: 'Subjects',
    description:
      'Learning outcomes and qualitative descriptors for each subject',
    applicableAtP1: true,
  },
  {
    key: 'personalQualities',
    label: 'Personal qualities',
    description: 'School-set qualities with descriptors',
    applicableAtP1: true,
  },
  {
    key: 'conduct',
    label: 'Form teacher comments',
    description: 'The form teacher’s written note on the term',
    applicableAtP1: true,
  },
  {
    key: 'cca',
    label: 'Co-curricular activities',
    description: 'CCA involvement — where applicable',
    applicableAtP1: false,
  },
  {
    key: 'via',
    label: 'Values in Action',
    description: 'Community involvement — where applicable',
    applicableAtP1: false,
  },
  {
    key: 'physicalFitness',
    label: 'Physical fitness',
    description: 'BMI indicator and NAPFA award — where applicable',
    applicableAtP1: false,
  },
]

function block(key: string, order: number): ReportBlock {
  return { key, enabled: true, order }
}

/**
 * P1 low-hanging-fruit default template: the authentic universal P1 sections only.
 * CCA/VIA/physical-fitness are omitted (off by default, "where applicable").
 */
export const P1_DEFAULT_LAYOUT: ReportLayout = {
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

/** A fresh, mutable copy of the P1 default layout for a new build. */
export function defaultP1Layout(): ReportLayout {
  return { blocks: P1_DEFAULT_LAYOUT.blocks.map((b) => ({ ...b })) }
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

/** Built-in templates a teacher can start from (definitions are not teacher-editable). */
export interface BuiltInTemplate {
  id: string
  name: string
  description: string
  layout: ReportLayout
}

export const BUILT_IN_TEMPLATES: Array<BuiltInTemplate> = [
  {
    id: 'p1-default',
    name: 'Primary Holistic Development',
    description:
      'Lower-primary default — learning outcomes, conduct, attendance, and personal qualities',
    layout: P1_DEFAULT_LAYOUT,
  },
]

export function getTemplateById(id: string): BuiltInTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id)
}
