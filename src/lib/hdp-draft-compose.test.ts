import { describe, expect, it } from 'vitest'
import { composeDraft, composeFromInsights } from './hdp-draft-compose'
import type { FormingPattern, HdpInsight, HdpTag } from '@/types/hdp'

const DENYLIST = ['resilient', 'gifted', 'weak', 'lazy', 'brilliant', 'natural']
const COMPARATIVE_WORDS = ['best', 'better than', 'top']

/** Strips the per-composition `id` (plan 048) so determinism assertions
 *  compare provenance/text/order, not the random id each call mints. */
function withoutIds<T extends { id?: string }>(claims: Array<T>) {
  return claims.map(({ id: _id, ...rest }) => rest)
}

function makeTag(overrides: Partial<HdpTag> = {}): HdpTag {
  return {
    id: 'tag-1',
    studentId: '1',
    authorId: 'lee-sy',
    disposition: 'perseverance',
    context: 'lesson',
    note: 'returned to failed problems during lessons',
    evidenceIds: [],
    source: 'self',
    entryPoint: 'row',
    schoolYear: '2026',
    term: 3,
    lifecycle: 'active',
    createdAt: '2026-07-05T11:30:00+08:00',
    editableUntil: '2026-07-06T11:30:00+08:00',
    ...overrides,
  }
}

describe('composeDraft', () => {
  it('returns [] when there are zero tags (P4 — composition never invents)', () => {
    expect(composeDraft([], [], 'overall', 'Chen Jun Kai')).toEqual([])
  })

  it("every returned claim's source.tagId exists among the input tags (P3 — no invented sources)", () => {
    const tags: Array<HdpTag> = [
      makeTag({
        id: 'tag-a',
        disposition: 'perseverance',
        note: 'returned to failed problems during lessons',
      }),
      makeTag({
        id: 'tag-b',
        disposition: 'curiosity',
        context: 'cca',
        note: "kept asking 'what if' during the case study discussion",
        createdAt: '2026-07-10T11:30:00+08:00',
        editableUntil: '2026-07-11T11:30:00+08:00',
      }),
      makeTag({
        id: 'tag-c',
        disposition: 'collaboration',
        context: 'marking',
        note: 'helped a groupmate catch up without taking over',
        createdAt: '2026-07-12T11:30:00+08:00',
        editableUntil: '2026-07-13T11:30:00+08:00',
      }),
    ]
    const tagIds = new Set(tags.map((t) => t.id))
    const claims = composeDraft(tags, [], 'overall', 'Chen Jun Kai')
    expect(claims.length).toBeGreaterThan(0)
    for (const claim of claims) {
      expect(claim.source).toBeDefined()
      expect(tagIds.has(claim.source!.tagId)).toBe(true)
    }
  })

  it('output text contains no trait/comparative vocabulary from the denylist', () => {
    const tags: Array<HdpTag> = [
      makeTag({
        id: 'tag-a',
        disposition: 'perseverance',
        note: 'returned to failed problems during lessons',
      }),
      makeTag({
        id: 'tag-b',
        disposition: 'curiosity',
        context: 'cca',
        note: "kept asking 'what if' during the case study discussion",
        createdAt: '2026-07-10T11:30:00+08:00',
        editableUntil: '2026-07-11T11:30:00+08:00',
      }),
      makeTag({
        id: 'tag-c',
        disposition: 'collaboration',
        context: 'marking',
        note: 'helped a groupmate catch up without taking over',
        createdAt: '2026-07-12T11:30:00+08:00',
        editableUntil: '2026-07-13T11:30:00+08:00',
      }),
      makeTag({
        id: 'tag-d',
        disposition: 'self-direction',
        context: 'other',
        note: 'set up the next session without being asked',
        createdAt: '2026-07-14T11:30:00+08:00',
        editableUntil: '2026-07-15T11:30:00+08:00',
      }),
    ]
    const claims = composeDraft(tags, [], 'overall', 'Chen Jun Kai')
    const allText = claims.map((c) => c.text.toLowerCase()).join(' ')
    for (const word of [...DENYLIST, ...COMPARATIVE_WORDS]) {
      expect(allText).not.toContain(word)
    }
  })

  it("kind: 'overall' over multi-author input uses tags from ≥2 authors when available; deterministic across two runs", () => {
    const tags: Array<HdpTag> = [
      makeTag({
        id: 'tag-a',
        authorId: 'lee-sy',
        disposition: 'perseverance',
        note: 'returned to failed problems during lessons',
      }),
      makeTag({
        id: 'tag-b',
        authorId: 'goh-wt',
        disposition: 'curiosity',
        context: 'cca',
        note: "kept asking 'what if' during the case study discussion",
        createdAt: '2026-07-10T11:30:00+08:00',
        editableUntil: '2026-07-11T11:30:00+08:00',
      }),
      makeTag({
        id: 'tag-c',
        authorId: 'raj-v',
        disposition: 'collaboration',
        context: 'marking',
        note: 'helped a groupmate catch up without taking over',
        createdAt: '2026-07-12T11:30:00+08:00',
        editableUntil: '2026-07-13T11:30:00+08:00',
      }),
    ]
    const claimsA = composeDraft(tags, [], 'overall', 'Chen Jun Kai')
    const claimsB = composeDraft(tags, [], 'overall', 'Chen Jun Kai')
    expect(withoutIds(claimsA)).toEqual(withoutIds(claimsB))

    const authorsUsed = new Set(
      claimsA
        .map((c) => tags.find((t) => t.id === c.source?.tagId)?.authorId)
        .filter((a): a is string => Boolean(a)),
    )
    expect(authorsUsed.size).toBeGreaterThanOrEqual(2)
  })

  it('a confirmed forming pattern contributes a cross-context claim sourced to one of its tags', () => {
    const tags: Array<HdpTag> = [
      makeTag({
        id: 'tag-a',
        disposition: 'self-direction',
        context: 'lesson',
        note: "set up the next session's equipment without being asked",
        createdAt: '2026-06-01T11:30:00+08:00',
        editableUntil: '2026-06-02T11:30:00+08:00',
      }),
      makeTag({
        id: 'tag-b',
        disposition: 'self-direction',
        context: 'marking',
        note: 'followed up on a returned test with a self-made corrections page',
        createdAt: '2026-06-04T11:30:00+08:00',
        editableUntil: '2026-06-05T11:30:00+08:00',
      }),
    ]
    const pattern: FormingPattern = {
      id: 'pattern-1',
      studentId: '1',
      disposition: 'self-direction',
      contexts: ['lesson', 'marking'],
      tagIds: ['tag-a', 'tag-b'],
      status: 'confirmed',
      confirmedBy: 'lee-sy',
      schoolYear: '2026',
    }
    const claims = composeDraft(tags, [pattern], 'overall', 'Chen Jun Kai')
    const tagIds = new Set(tags.map((t) => t.id))
    const crossContextClaim = claims.find((c) =>
      c.text.toLowerCase().includes('across'),
    )
    expect(crossContextClaim).toBeDefined()
    expect(tagIds.has(crossContextClaim!.source!.tagId)).toBe(true)
  })

  it('composed claims each carry a unique id (plan 048 — stable React keys)', () => {
    const tags: Array<HdpTag> = [
      makeTag({
        id: 'tag-a',
        disposition: 'perseverance',
        note: 'returned to failed problems during lessons',
      }),
      makeTag({
        id: 'tag-b',
        disposition: 'curiosity',
        context: 'cca',
        note: "kept asking 'what if' during the case study discussion",
        createdAt: '2026-07-10T11:30:00+08:00',
        editableUntil: '2026-07-11T11:30:00+08:00',
      }),
    ]
    const claims = composeDraft(tags, [], 'overall', 'Chen Jun Kai')
    expect(claims.length).toBeGreaterThan(0)
    for (const claim of claims) {
      expect(claim.id).toBeTruthy()
    }
    const ids = new Set(claims.map((c) => c.id))
    expect(ids.size).toBe(claims.length)
  })
})

function makeInsight(overrides: Partial<HdpInsight> = {}): HdpInsight {
  return {
    id: 'insight-1',
    studentId: '1',
    kind: 'observation',
    label: 'returned to failed problems during lessons',
    sourceRef: { system: 'tw-river', recordId: 'tag-1' },
    selectable: true,
    ...overrides,
  }
}

describe('composeFromInsights', () => {
  it('returns [] when there are zero (selected) insights (P4)', () => {
    expect(composeFromInsights([], 'overall', 'Chen Jun Kai')).toEqual([])
  })

  it('claims come only from the selected insights it is given — feed 5, select 2, no claim references the unselected 3', () => {
    const allFive: Array<HdpInsight> = [
      makeInsight({
        id: 'insight-a',
        kind: 'observation',
        label: 'returned to failed problems during lessons',
        sourceRef: { system: 'tw-river', recordId: 'tag-a' },
      }),
      makeInsight({
        id: 'insight-b',
        kind: 'pattern',
        label: 'has shown perseverance across lesson and marking',
        sourceRef: { system: 'tw-river', recordId: 'tag-b' },
      }),
      makeInsight({
        id: 'insight-c',
        kind: 'trajectory',
        label: 'Mathematics recovering across 3 semesters',
        sourceRef: { system: 'sdt', recordId: 'trend-mathematics' },
      }),
      makeInsight({
        id: 'insight-d',
        kind: 'attendance',
        label: '96% attendance this term',
        sourceRef: { system: 'cockpit', recordId: 'attendance-1' },
      }),
      makeInsight({
        id: 'insight-e',
        kind: 'conduct',
        label: 'Good conduct grading, Semester 2',
        sourceRef: { system: 'cockpit', recordId: 'conduct-1' },
      }),
    ]
    const selected = [allFive[1], allFive[3]] // insight-b, insight-d
    const claims = composeFromInsights(selected, 'overall', 'Chen Jun Kai')

    expect(claims.length).toBe(2)
    const referencedIds = new Set(claims.map((c) => c.source!.tagId))
    // insight-b is tw-river ⇒ resolves to its real tag id; insight-d is a
    // cockpit fact with no HdpTag to resolve ⇒ resolves to its own insight id.
    expect(referencedIds.has('tag-b')).toBe(true)
    expect(referencedIds.has('insight-d')).toBe(true)
    // None of the excluded three's underlying records ever appear.
    for (const excludedId of [
      'tag-a',
      'insight-a',
      'trend-mathematics',
      'insight-c',
      'conduct-1',
      'insight-e',
    ]) {
      expect(referencedIds.has(excludedId)).toBe(false)
    }
  })

  it('output text contains no trait/comparative vocabulary from the denylist', () => {
    const insights: Array<HdpInsight> = [
      makeInsight({
        kind: 'observation',
        label: 'returned to failed problems during lessons',
      }),
      makeInsight({
        id: 'insight-2',
        kind: 'trajectory',
        label: 'Mathematics recovering across 3 semesters',
        sourceRef: { system: 'sdt', recordId: 'trend-mathematics' },
      }),
    ]
    const claims = composeFromInsights(insights, 'overall', 'Chen Jun Kai')
    const allText = claims.map((c) => c.text.toLowerCase()).join(' ')
    for (const word of [...DENYLIST, ...COMPARATIVE_WORDS]) {
      expect(allText).not.toContain(word)
    }
  })

  it('is deterministic across two runs on the same input', () => {
    const insights: Array<HdpInsight> = [
      makeInsight({ id: 'insight-a' }),
      makeInsight({
        id: 'insight-b',
        kind: 'attendance',
        label: '96% attendance this term',
        sourceRef: { system: 'cockpit', recordId: 'attendance-1' },
      }),
    ]
    const a = composeFromInsights(insights, 'overall', 'Chen Jun Kai')
    const b = composeFromInsights(insights, 'overall', 'Chen Jun Kai')
    expect(withoutIds(a)).toEqual(withoutIds(b))
  })

  it('sources a non-tw-river insight to itself (no fabricated tag id)', () => {
    const insight = makeInsight({
      id: 'insight-x',
      kind: 'attendance',
      label: '96% attendance this term',
      sourceRef: { system: 'cockpit', recordId: 'attendance-9' },
    })
    const claims = composeFromInsights([insight], 'subject', 'Chen Jun Kai')
    // No real HdpTag backs a cockpit fact — the claim resolves through the
    // insight's own id (not a fabricated tag id, and not the opaque
    // cockpit recordId, which the app has no way to look up).
    expect(claims[0].source?.tagId).toBe('insight-x')
    expect(claims[0].source?.label).toBe('Insight 1 · attendance')
  })
})
