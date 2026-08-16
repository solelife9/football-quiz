import { describe, it, expect } from 'vitest'
import { normalize, levenshtein, allowedDistance, matchAnswer, type Candidate } from './matchAnswer'

describe('normalize', () => {
  it('NFC 정규화 — 자모 분리(NFD) 입력도 같은 값', () => {
    const nfd = '손흥민'.normalize('NFD')
    expect(nfd).not.toBe('손흥민')
    expect(normalize(nfd)).toBe('손흥민')
  })
  it('소문자화', () => {
    expect(normalize('TAA')).toBe('taa')
    expect(normalize('Van Der Sar')).toBe('vandersar')
  })
  it('공백·하이픈·점·중점 제거', () => {
    expect(normalize('트렌트 알렉산더-아널드')).toBe('트렌트알렉산더아널드')
    expect(normalize('판 데르 사르')).toBe('판데르사르')
    expect(normalize('C. 호날두')).toBe('c호날두')
    expect(normalize('반 데르 사르 · 네덜란드')).toBe('반데르사르네덜란드')
    expect(normalize('  손흥민\t')).toBe('손흥민')
    expect(normalize('알렉산더–아널드')).toBe('알렉산더아널드') // en dash
    expect(normalize('알렉산더—아널드')).toBe('알렉산더아널드') // em dash
    expect(normalize('산토스・지우마르')).toBe('산토스지우마르') // 가타카나 중점
  })
  it('빈 문자열/공백만 → 빈 문자열', () => {
    expect(normalize('')).toBe('')
    expect(normalize('   ')).toBe('')
  })
})

describe('levenshtein', () => {
  it('기본 케이스', () => {
    expect(levenshtein('', '')).toBe(0)
    expect(levenshtein('abc', '')).toBe(3)
    expect(levenshtein('', 'ab')).toBe(2)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('flaw', 'lawn')).toBe(2)
    expect(levenshtein('같다', '같다')).toBe(0)
  })
  it('한글은 음절(코드포인트) 단위로 센다', () => {
    expect(levenshtein('손흥민', '손홍민')).toBe(1)
    expect(levenshtein('호날두', '호나우두')).toBe(2)
  })
})

describe('allowedDistance', () => {
  it('길이 5 이하 → 1, 6 이상 → 2', () => {
    expect(allowedDistance(1)).toBe(1)
    expect(allowedDistance(5)).toBe(1)
    expect(allowedDistance(6)).toBe(2)
    expect(allowedDistance(20)).toBe(2)
  })
})

const salah: Candidate = { id: 'salah', name: '모하메드 살라', aliases: ['살라', 'salah', 'mo salah'] }
const taa: Candidate = {
  id: 'taa',
  name: '트렌트 알렉산더-아널드',
  aliases: ['알렉산더아널드', '트렌트', 'TAA', 'trent'],
}
const vds: Candidate = {
  id: 'vds',
  name: '판 데르 사르',
  aliases: ['판데르사르', '반데사르', 'van der sar', '사르'],
}
const son: Candidate = { id: 'son', name: '손흥민', aliases: ['손', 'son', 'heung-min son'] }
const pool = [salah, taa, vds, son]

describe('matchAnswer — 정확 일치', () => {
  it('name 그대로', () => {
    expect(matchAnswer('트렌트 알렉산더-아널드', pool)).toEqual({ kind: 'exact', id: 'taa' })
  })
  it('alias(한글 표기·영문·성·약칭)', () => {
    expect(matchAnswer('알렉산더아널드', pool)).toEqual({ kind: 'exact', id: 'taa' })
    expect(matchAnswer('trent', pool)).toEqual({ kind: 'exact', id: 'taa' })
    expect(matchAnswer('taa', pool)).toEqual({ kind: 'exact', id: 'taa' })
    expect(matchAnswer('반데사르', pool)).toEqual({ kind: 'exact', id: 'vds' })
    expect(matchAnswer('사르', pool)).toEqual({ kind: 'exact', id: 'vds' })
  })
  it('대소문자·공백·하이픈·점 차이는 무시', () => {
    expect(matchAnswer('  Van Der Sar ', pool)).toEqual({ kind: 'exact', id: 'vds' })
    expect(matchAnswer('Heung-Min Son', pool)).toEqual({ kind: 'exact', id: 'son' })
    expect(matchAnswer('MO SALAH', pool)).toEqual({ kind: 'exact', id: 'salah' })
    expect(matchAnswer('알렉산더 아널드', pool)).toEqual({ kind: 'exact', id: 'taa' })
  })
  it('정확 일치가 있으면 퍼지 후보가 있어도 exact 로 확정', () => {
    // '살라'는 salah 의 alias(exact). 동시에 다른 후보와 거리 1 이내여도 exact 우선.
    const near: Candidate = { id: 'near', name: '살리', aliases: [] }
    expect(matchAnswer('살라', [salah, near])).toEqual({ kind: 'exact', id: 'salah' })
  })
  it('빈 입력·공백만 → none', () => {
    expect(matchAnswer('', pool)).toEqual({ kind: 'none' })
    expect(matchAnswer('   ', pool)).toEqual({ kind: 'none' })
  })
  it('빈 후보 목록 → none', () => {
    expect(matchAnswer('손흥민', [])).toEqual({ kind: 'none' })
  })
  it('빈 alias 문자열은 무시(빈 입력과 매칭되지 않음)', () => {
    const c: Candidate = { id: 'x', name: '아무개', aliases: [''] }
    expect(matchAnswer('', [c])).toEqual({ kind: 'none' })
  })
})

describe('matchAnswer — 퍼지(오타 허용)', () => {
  it('길이 5 이하: 거리 1 허용, 2는 거부', () => {
    // '손홍민'(3) vs '손흥민' → 1
    expect(matchAnswer('손홍민', pool)).toEqual({ kind: 'fuzzy', id: 'son', distance: 1 })
    // '반데샤르'(4) vs '반데사르' → 1
    expect(matchAnswer('반데샤르', pool)).toEqual({ kind: 'fuzzy', id: 'vds', distance: 1 })
    // '손호믄'(3) vs '손흥민' → 2 → 거부
    expect(matchAnswer('손호믄', pool)).toEqual({ kind: 'none' })
  })
  it('길이 6 이상: 거리 2 허용, 3은 거부', () => {
    // 'vanderzar'(9) vs 'vandersar' → 1
    expect(matchAnswer('van der zar', pool)).toEqual({ kind: 'fuzzy', id: 'vds', distance: 1 })
    // '알렉산더아놀도'(7) vs '알렉산더아널드' → 2
    expect(matchAnswer('알렉산더아놀도', pool)).toEqual({ kind: 'fuzzy', id: 'taa', distance: 2 })
    // '알렉산다아놀도'(7) → 3 → 거부
    expect(matchAnswer('알렉산다아놀도', pool)).toEqual({ kind: 'none' })
  })
  it('허용 거리는 "입력"의 정규화 길이로 정한다', () => {
    // 입력 'salaa'(5) → 허용 1. 'salah'와 거리 1 → OK
    expect(matchAnswer('salaa', pool)).toEqual({ kind: 'fuzzy', id: 'salah', distance: 1 })
    // 입력 'salaaa'(6) → 허용 2. 'salah'와 거리 2 → OK
    expect(matchAnswer('salaaa', pool)).toEqual({ kind: 'fuzzy', id: 'salah', distance: 2 })
    // 입력 'salaaaa'(7) → 거리 3 → 거부
    expect(matchAnswer('salaaaa', pool)).toEqual({ kind: 'none' })
  })
  it('후보 안 여러 표기 중 가장 가까운 거리로 판단', () => {
    // 'trnt' vs 'trent' → 1 (name 과는 멀지만 alias 로 잡힘)
    expect(matchAnswer('trnt', pool)).toEqual({ kind: 'fuzzy', id: 'taa', distance: 1 })
  })
  it('전혀 다른 입력 → none', () => {
    expect(matchAnswer('메시', pool)).toEqual({ kind: 'none' })
    expect(matchAnswer('베컴', pool)).toEqual({ kind: 'none' })
  })
})

describe('matchAnswer — 모호성 반려', () => {
  it('퍼지가 두 후보에 동시에 걸리면 ambiguous', () => {
    const silvaB: Candidate = { id: 'b', name: '베르나르두 실바', aliases: ['b실바', '베실바'] }
    const silvaT: Candidate = { id: 't', name: '티아구 실바', aliases: ['t실바', '티실바'] }
    // '배실바'(3): '베실바'와 1, '티실바'와 1 → 둘 다 → 반려
    const r = matchAnswer('배실바', [silvaB, silvaT])
    expect(r.kind).toBe('ambiguous')
    if (r.kind === 'ambiguous') expect(r.ids.sort()).toEqual(['b', 't'])
  })
  it('한 후보만 거리 안이면 정상 fuzzy', () => {
    const silvaB: Candidate = { id: 'b', name: '베르나르두 실바', aliases: ['b실바', '베실바'] }
    const silvaT: Candidate = { id: 't', name: '티아구 실바', aliases: ['t실바', '티실바'] }
    expect(matchAnswer('베실', [silvaB, silvaT])).toEqual({ kind: 'fuzzy', id: 'b', distance: 1 })
  })
  it('정확 일치가 두 후보에 동시에 있으면(데이터 중복) ambiguous', () => {
    const a: Candidate = { id: 'a', name: '실바', aliases: [] }
    const b: Candidate = { id: 'b', name: '다른 실바', aliases: ['실바'] }
    const r = matchAnswer('실바', [a, b])
    expect(r.kind).toBe('ambiguous')
  })
  it('같은 후보 안에서 여러 표기가 걸리는 건 모호성이 아니다', () => {
    // '트렌트'와 'trent' 둘 다 taa 소속. 입력 '트렌드' → 후보는 taa 하나뿐.
    expect(matchAnswer('트렌드', pool)).toEqual({ kind: 'fuzzy', id: 'taa', distance: 1 })
  })
})

describe('matchAnswer — 불변성', () => {
  it('입력 배열을 변경하지 않는다', () => {
    const before = JSON.stringify(pool)
    matchAnswer('손흥민', pool)
    matchAnswer('알렉산다아놀도', pool)
    expect(JSON.stringify(pool)).toBe(before)
  })
})

describe('matchAnswer — 부분 일치(성만·표기 차이)', () => {
  const taa: Candidate = { id: 'taa', name: '트렌트 알렉산더아널드', aliases: ['알렉산더아널드'] }
  const kane: Candidate = { id: 'kane', name: '해리 케인', aliases: [] }
  const ramos: Candidate = { id: 'ramos', name: '세르히오 라모스', aliases: [] }
  const pool2 = [taa, kane, ramos]

  it('뒷부분만 입력해도 맞는다', () => {
    expect(matchAnswer('알렉산더아널드', pool2).kind).toBe('exact')
    expect(matchAnswer('케인', pool2)).toMatchObject({ kind: 'partial', id: 'kane' })
    expect(matchAnswer('라모스', pool2)).toMatchObject({ kind: 'partial', id: 'ramos' })
  })
  it('표기가 조금 달라도 맞는다 (아널드 vs 아놀드)', () => {
    expect(matchAnswer('아놀드', pool2)).toMatchObject({ kind: 'partial', id: 'taa' })
    expect(matchAnswer('알렉산더 아놀드', pool2)).toMatchObject({ id: 'taa' })
    expect(matchAnswer('트렌트 알렉산더 아놀드', pool2)).toMatchObject({ id: 'taa' })
  })
  it('앞부분만 입력해도 맞는다', () => {
    expect(matchAnswer('트렌트', pool2)).toMatchObject({ kind: 'partial', id: 'taa' })
    expect(matchAnswer('세르히오', pool2)).toMatchObject({ kind: 'partial', id: 'ramos' })
  })
  it('두 후보에 걸리면 반려(목숨 안 깎임)', () => {
    const b: Candidate = { id: 'b', name: '베르나르두 실바', aliases: [] }
    const d: Candidate = { id: 'd', name: '다비드 실바', aliases: [] }
    expect(matchAnswer('실바', [b, d]).kind).toBe('ambiguous')
  })
  it('한 글자는 부분 일치로 인정하지 않는다', () => {
    expect(matchAnswer('케', pool2).kind).toBe('none')
  })
  it('가운데 조각만으로는 인정하지 않는다', () => {
    // "산더" 는 이름 가운데라 통과시키지 않는다(오탐 방지)
    expect(matchAnswer('산더', pool2).kind).toBe('none')
  })
  it('정확·퍼지가 있으면 그쪽이 우선', () => {
    expect(matchAnswer('해리 케인', pool2).kind).toBe('exact')
    expect(matchAnswer('해리 케임', pool2).kind).toBe('fuzzy')
  })
})
