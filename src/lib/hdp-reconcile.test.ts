import { describe, expect, it } from 'vitest'
import { reconcileCheck } from './hdp-reconcile'
import type { SubjectTrend } from './hdp-trends'
import type { DraftClaim } from '@/types/hdp'

function claim(text: string): DraftClaim {
  return { text }
}

function trend(
  subject: string,
  direction: SubjectTrend['direction'],
): SubjectTrend {
  return { subject, direction, points: [60, 65] }
}

describe('reconcileCheck', () => {
  it('fires on positive-progress phrasing when the subject trend is easing', () => {
    const result = reconcileCheck(
      [claim('Chen Jun Kai has shown consistent progress in Mathematics.')],
      [trend('Mathematics', 'easing')],
    )
    expect(result.fired).toBe(true)
    expect(result.subject).toBe('Mathematics')
    expect(result.direction).toBe('easing')
  })

  it('fires on struggle phrasing when the subject trend is climbing', () => {
    const result = reconcileCheck(
      [claim('Chen Jun Kai continues to struggle with word problems.')],
      [trend('Mathematics', 'climbing')],
    )
    expect(result.fired).toBe(true)
    expect(result.subject).toBe('Mathematics')
    expect(result.direction).toBe('climbing')
  })

  it('does not fire when the comment and trend are aligned', () => {
    const risingAligned = reconcileCheck(
      [claim('Chen Jun Kai has shown consistent progress in Mathematics.')],
      [trend('Mathematics', 'climbing')],
    )
    expect(risingAligned.fired).toBe(false)

    const strugglingAligned = reconcileCheck(
      [claim('Chen Jun Kai continues to struggle with word problems.')],
      [trend('Mathematics', 'easing')],
    )
    expect(strugglingAligned.fired).toBe(false)
  })

  it('does not fire when the comment carries neither phrasing', () => {
    const result = reconcileCheck(
      [claim('Chen Jun Kai helped a groupmate catch up during marking.')],
      [trend('Mathematics', 'easing')],
    )
    expect(result.fired).toBe(false)
  })

  it("'overall' drafts use the majority trend direction across subjects", () => {
    const result = reconcileCheck(
      [claim('Overall, Chen Jun Kai has made consistent progress this term.')],
      [
        trend('Mathematics', 'easing'),
        trend('Science', 'easing'),
        trend('English', 'climbing'),
      ],
    )
    expect(result.fired).toBe(true)
    expect(result.direction).toBe('easing')
    expect(result.subject).toBeUndefined()

    const alignedMajority = reconcileCheck(
      [claim('Overall, Chen Jun Kai has made consistent progress this term.')],
      [
        trend('Mathematics', 'climbing'),
        trend('Science', 'climbing'),
        trend('English', 'easing'),
      ],
    )
    expect(alignedMajority.fired).toBe(false)
  })
})
