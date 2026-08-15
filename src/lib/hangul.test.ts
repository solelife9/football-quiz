import { describe, it, expect } from 'vitest'
import { toChoseong, surnameOf, surnameChoseong, isHangulSyllable } from './hangul'

describe('hangul', () => {
  it('isHangulSyllable', () => {
    expect(isHangulSyllable('가')).toBe(true)
    expect(isHangulSyllable('힣')).toBe(true)
    expect(isHangulSyllable('ㄱ')).toBe(false)
    expect(isHangulSyllable('a')).toBe(false)
    expect(isHangulSyllable('')).toBe(false)
  })
  it('toChoseong — 음절만 초성으로, 나머지 유지', () => {
    expect(toChoseong('손흥민')).toBe('ㅅㅎㅁ')
    expect(toChoseong('사르')).toBe('ㅅㄹ')
    expect(toChoseong('판 데르 사르')).toBe('ㅍ ㄷㄹ ㅅㄹ')
    expect(toChoseong('cr7')).toBe('cr7')
    expect(toChoseong('')).toBe('')
    expect(toChoseong('까치')).toBe('ㄲㅊ')
  })
  it('surnameOf', () => {
    expect(surnameOf('판 데르 사르')).toBe('사르')
    expect(surnameOf('모하메드 살라')).toBe('살라')
    expect(surnameOf('트렌트 알렉산더-아널드')).toBe('알렉산더-아널드')
    expect(surnameOf('손흥민')).toBe('손')
    expect(surnameOf('박지성')).toBe('박')
    expect(surnameOf('네이마르')).toBe('네이마르')
    expect(surnameOf('  손흥민  ')).toBe('손')
    expect(surnameOf('')).toBe('')
  })
  it('surnameChoseong', () => {
    expect(surnameChoseong('판 데르 사르')).toBe('ㅅㄹ')
    expect(surnameChoseong('손흥민')).toBe('ㅅ')
    expect(surnameChoseong('네이마르')).toBe('ㄴㅇㅁㄹ')
    expect(surnameChoseong('크리스티아누 호날두')).toBe('ㅎㄴㄷ')
  })
})
