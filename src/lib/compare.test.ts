import { describe, it, expect } from 'vitest'
import { parseValue, toSubject, toNumericLists, pickPair, pickDistinct } from './compare'
import type { Top10Question } from '../types'

describe('parseValue', () => {
  it('숫자+단위만 통과', () => {
    expect(parseValue('260골')).toEqual({ value: 260, unit: '골' })
    expect(parseValue('1,000경기')).toEqual({ value: 1000, unit: '경기' })
    expect(parseValue('4회')).toEqual({ value: 4, unit: '회' })
    expect(parseValue('202클린시트')).toEqual({ value: 202, unit: '클린시트' })
    // 단위 뒤 꼬리표는 허용 — 실제 데이터가 이 형태다
    expect(parseValue('4회 (2001-02·2003-04)')).toEqual({ value: 4, unit: '회' })
    expect(parseValue('36골 · 2022-23')).toEqual({ value: 36, unit: '골' })
  })
  it('연도·클럽명·복합 문자열은 거른다', () => {
    expect(parseValue('2005-06')).toBeNull()
    expect(parseValue('리버풀')).toBeNull()
    expect(parseValue('€1억 4,450만 (£1억 2,500만, 2025년)')).toBeNull()
    expect(parseValue('')).toBeNull()
    expect(parseValue(undefined)).toBeNull()
    expect(parseValue('트로피 35개 (리그 13회)')).toBeNull() // 숫자로 시작하지 않는다
  })
})

describe('toSubject', () => {
  it('순위·인원 꼬리표를 뗀다', () => {
    expect(toSubject('프리미어리그 통산 최다 득점 TOP 10')).toBe('프리미어리그 통산 최다 득점')
    expect(toSubject('프리미어리그 통산 500경기 이상 출전한 선수 전원 (13명)')).toBe(
      '프리미어리그 통산 500경기 이상 출전한 선수',
    )
  })
})

const list = (id: string, vals: [string, string][]): Top10Question => ({
  id,
  title: `${id} TOP 10`,
  answers: vals.map(([name, value], i) => ({ rank: i + 1, name, value, aliases: [] })),
})

describe('toNumericLists', () => {
  it('단위가 섞이거나 숫자가 아니면 제외', () => {
    const qs = [
      list('good', [['A', '10골'], ['B', '5골']]),
      list('mixed', [['A', '10골'], ['B', '5경기']]),
      list('text', [['A', '리버풀'], ['B', '첼시']]),
    ]
    const out = toNumericLists(qs)
    expect(out.map((o) => o.id)).toEqual(['good'])
    expect(out[0].unit).toBe('골')
  })
  it('값이 전부 같으면 제외(비교가 성립 안 함)', () => {
    expect(toNumericLists([list('same', [['A', '3회'], ['B', '3회']])])).toHaveLength(0)
  })
})

describe('pickPair', () => {
  it('항상 값이 다른 두 명', () => {
    const [l] = toNumericLists([list('x', [['A', '10골'], ['B', '10골'], ['C', '5골']])])
    for (let i = 0; i < 50; i++) {
      const pair = pickPair(l)!
      expect(pair[0].value).not.toBe(pair[1].value)
    }
  })
  it('전부 동점이면 애초에 목록에서 빠지므로 null 이 나올 일이 없다', () => {
    expect(toNumericLists([list('y', [['A', '1회'], ['B', '1회']])])).toHaveLength(0)
  })
})

describe('pickDistinct', () => {
  it('요청한 수만큼 서로 다른 값', () => {
    const [l] = toNumericLists([
      list('z', [['A', '10골'], ['B', '9골'], ['C', '8골'], ['D', '8골'], ['E', '7골']]),
    ])
    for (let i = 0; i < 50; i++) {
      const four = pickDistinct(l, 4)!
      expect(four).toHaveLength(4)
      expect(new Set(four.map((f) => f.value)).size).toBe(4)
    }
  })
  it('서로 다른 값이 부족하면 null', () => {
    const [l] = toNumericLists([list('w', [['A', '5골'], ['B', '5골'], ['C', '4골']])])
    expect(pickDistinct(l, 4)).toBeNull()
  })
})
