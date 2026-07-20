import { describe, expect, it } from 'vitest'
import { formatDate, getInitials } from './format'

describe('formatDate', () => {
  it('includes the year by default', () => {
    expect(formatDate('2026-07-17T11:30:00+08:00')).toBe('17 Jul 2026')
  })

  it('omits the year when { year: false }', () => {
    expect(formatDate('2026-07-17T11:30:00+08:00', { year: false })).toBe(
      '17 Jul',
    )
  })

  it("returns '—' for undefined", () => {
    expect(formatDate(undefined)).toBe('—')
  })
})

describe('getInitials', () => {
  it('takes the first letter of the first two words, uppercased', () => {
    expect(getInitials('Chen Jun Kai')).toBe('CJ')
  })

  it('handles double spaces without producing blank initials', () => {
    expect(getInitials('Chen  Jun Kai')).toBe('CJ')
  })

  it('handles a single name', () => {
    expect(getInitials('Chen')).toBe('C')
  })

  it('uppercases lowercase input', () => {
    expect(getInitials('chen jun kai')).toBe('CJ')
  })
})
