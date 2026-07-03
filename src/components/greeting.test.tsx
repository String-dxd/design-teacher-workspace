import { describe, expect, it } from 'vitest'
import { getGreeting } from './greeting'

describe('getGreeting', () => {
  it('returns "Good morning" before noon', () => {
    expect(getGreeting(8)).toBe('Good morning')
    expect(getGreeting(11)).toBe('Good morning')
  })

  it('returns "Good afternoon" from noon to before 5pm', () => {
    expect(getGreeting(12)).toBe('Good afternoon')
    expect(getGreeting(16)).toBe('Good afternoon')
  })

  it('returns "Good evening" from 5pm onward', () => {
    expect(getGreeting(17)).toBe('Good evening')
    expect(getGreeting(23)).toBe('Good evening')
  })
})
