import { calculateReadingTime } from '@/lib/utils'

describe('calculateReadingTime', () => {
  it('should return 1 for empty content', () => {
    expect(calculateReadingTime('')).toBe(1)
  })

  it('should calculate reading time based on word count', () => {
    // 200 words should take about 1 minute
    const content = 'word '.repeat(200)
    expect(calculateReadingTime(content)).toBe(1)
  })

  it('should handle longer content', () => {
    // 1000 words should take about 5 minutes
    const content = 'word '.repeat(1000)
    expect(calculateReadingTime(content)).toBe(5)
  })

  it('should round up partial minutes', () => {
    // 250 words should round up to 2 minutes
    const content = 'word '.repeat(250)
    expect(calculateReadingTime(content)).toBe(2)
  })
})
