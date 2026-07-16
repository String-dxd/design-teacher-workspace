import { describe, expect, it } from 'vitest'
import { composeDraft } from './hdp-draft-compose'
import type { FormingPattern, HdpTag } from '@/types/hdp'

const DENYLIST = ['resilient', 'gifted', 'weak', 'lazy', 'brilliant', 'natural']
const COMPARATIVE_WORDS = ['best', 'better than', 'top']

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
    expect(claimsA).toEqual(claimsB)

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
})
