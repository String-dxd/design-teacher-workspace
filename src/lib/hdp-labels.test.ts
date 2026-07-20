import { describe, expect, it } from 'vitest'
import {
  CONTEXT_LABELS,
  CONTEXT_NOUNS,
  CONTEXT_PHRASES,
  DISPOSITIONS,
  DISPOSITION_LABELS,
} from './hdp-labels'

describe('hdp-labels casing contract', () => {
  it('CONTEXT_LABELS is title-case (chips)', () => {
    expect(CONTEXT_LABELS.lesson).toBe('Lesson')
    expect(CONTEXT_LABELS.marking).toBe('Marking')
    expect(CONTEXT_LABELS.cca).toBe('CCA')
    expect(CONTEXT_LABELS['form-time']).toBe('Form time')
    expect(CONTEXT_LABELS.other).toBe('Other')
  })

  it('CONTEXT_PHRASES is sentence-position phrasing', () => {
    expect(CONTEXT_PHRASES.lesson).toBe('during lesson')
    expect(CONTEXT_PHRASES.marking).toBe('while marking')
    expect(CONTEXT_PHRASES.cca).toBe('CCA')
    expect(CONTEXT_PHRASES['form-time']).toBe('form time')
    expect(CONTEXT_PHRASES.other).toBe('other')
  })

  it('CONTEXT_NOUNS is bare nouns for composed prose', () => {
    expect(CONTEXT_NOUNS.lesson).toBe('lesson')
    expect(CONTEXT_NOUNS.marking).toBe('marking')
    expect(CONTEXT_NOUNS.cca).toBe('CCA')
    expect(CONTEXT_NOUNS['form-time']).toBe('form time')
    expect(CONTEXT_NOUNS.other).toBe('other')
  })

  it('DISPOSITION_LABELS is title-case', () => {
    expect(DISPOSITION_LABELS.perseverance).toBe('Perseverance')
    expect(DISPOSITION_LABELS.curiosity).toBe('Curiosity')
    expect(DISPOSITION_LABELS.collaboration).toBe('Collaboration')
    expect(DISPOSITION_LABELS['self-direction']).toBe('Self-direction')
  })

  it('DISPOSITIONS mirrors DISPOSITION_LABELS as an ordered list', () => {
    expect(DISPOSITIONS).toEqual([
      { id: 'perseverance', label: 'Perseverance' },
      { id: 'curiosity', label: 'Curiosity' },
      { id: 'collaboration', label: 'Collaboration' },
      { id: 'self-direction', label: 'Self-direction' },
    ])
  })
})
