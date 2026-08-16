import { describe, it, expect } from 'vitest'
import { scoreFor, breakEven, formatScore } from './score'

describe('scoreFor', () => {
  it('4개 이하는 0점 (손익분기 미만)', () => {
    for (let i = 0; i <= 4; i++) expect(scoreFor(i, 10)).toBe(0)
  })
  it('5개부터 점수가 붙고 10개에서 크게 뛴다', () => {
    expect(scoreFor(5, 10)).toBe(1000)
    expect(scoreFor(6, 10)).toBe(2000)
    expect(scoreFor(9, 10)).toBe(12000)
    expect(scoreFor(10, 10)).toBe(25000)
  })
  it('항상 증가한다(더 맞혔는데 점수가 줄면 안 됨)', () => {
    for (let i = 1; i <= 10; i++) expect(scoreFor(i, 10)).toBeGreaterThanOrEqual(scoreFor(i - 1, 10))
  })
  it('칸 수가 10이 아니어도 비율로 환산한다', () => {
    expect(scoreFor(5, 5)).toBe(25000)   // 5칸 전부 = 만점
    expect(scoreFor(2, 5)).toBe(0)       // 40% → 손익분기 미만
    expect(scoreFor(15, 15)).toBe(25000)
    expect(scoreFor(8, 15)).toBe(1000)   // 53% → 5칸 상당
  })
  it('경계값', () => {
    expect(scoreFor(0, 0)).toBe(0)
    expect(scoreFor(0, 10)).toBe(0)
    expect(scoreFor(-1, 10)).toBe(0)
    expect(scoreFor(99, 10)).toBe(25000) // 넘겨도 만점에서 멈춘다
  })
})

describe('breakEven', () => {
  it('절반(올림)', () => {
    expect(breakEven(10)).toBe(5)
    expect(breakEven(11)).toBe(6)
    expect(breakEven(5)).toBe(3)
  })
})

describe('formatScore', () => {
  it('천 단위 구분', () => {
    expect(formatScore(25000)).toBe('25,000')
    expect(formatScore(0)).toBe('0')
  })
})
