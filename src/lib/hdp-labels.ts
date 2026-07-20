import type { DispositionId, TagContext } from '@/types/hdp'

/** Title-case disposition labels: 'Perseverance', 'Curiosity', … */
export const DISPOSITION_LABELS: Record<DispositionId, string> = {
  perseverance: 'Perseverance',
  curiosity: 'Curiosity',
  collaboration: 'Collaboration',
  'self-direction': 'Self-direction',
}

/** Ordered list for pickers (tag composer, request panels). */
export const DISPOSITIONS: Array<{ id: DispositionId; label: string }> = [
  { id: 'perseverance', label: 'Perseverance' },
  { id: 'curiosity', label: 'Curiosity' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'self-direction', label: 'Self-direction' },
]

/** Title-case chip labels: 'Lesson', 'Marking', … */
export const CONTEXT_LABELS: Record<TagContext, string> = {
  lesson: 'Lesson',
  marking: 'Marking',
  cca: 'CCA',
  'form-time': 'Form time',
  other: 'Other',
}

/** Sentence-position phrases: 'during lesson', 'while marking', … */
export const CONTEXT_PHRASES: Record<TagContext, string> = {
  lesson: 'during lesson',
  marking: 'while marking',
  cca: 'CCA',
  'form-time': 'form time',
  other: 'other',
}

/** Bare nouns for composed prose: 'lesson', 'marking', 'CCA', … */
export const CONTEXT_NOUNS: Record<TagContext, string> = {
  lesson: 'lesson',
  marking: 'marking',
  cca: 'CCA',
  'form-time': 'form time',
  other: 'other',
}
