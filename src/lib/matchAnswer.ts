/**
 * 정답 매칭 — 순수 함수. throw 없음, 입력 불변.
 *
 * 규칙
 * 1. 정규화: NFC → 소문자 → 공백/하이픈/점/중점 제거
 * 2. name 또는 aliases 와 정확히 일치하면 정답(exact)
 * 3. 정확 일치가 없으면 Levenshtein 거리로 오타 허용(fuzzy)
 *    정규화 후 길이 ≤ 5 → 거리 1, 6 이상 → 거리 2
 * 4. 그래도 없으면 부분 일치: 입력이 표기의 앞/뒤 조각과 (오타 허용 안에서) 같으면 인정
 *    — "아놀드" → "알렉산더아널드", "케인" → "해리 케인". 한글 표기가 매체마다 달라서 필요하다.
 * 5. 위 매칭이 같은 문제 안의 다른 정답과도 동시에 걸리면 반려(ambiguous)
 *
 * ⚠️ 호출 시점은 반드시 폼 제출(Enter/버튼)이어야 한다.
 *    안드로이드 한글 조합 중 onChange 는 자모 단위로 발생하므로 실시간 판정 금지.
 */
import { FUZZY } from '../config'

export interface Candidate {
  /** 문제 안에서 유일한 식별자(호출자가 부여) */
  id: string
  name: string
  aliases?: readonly string[]
}

export type MatchResult =
  | { kind: 'exact'; id: string }
  | { kind: 'fuzzy'; id: string; distance: number }
  /** 이름의 일부(성·뒷부분 등)만 입력했고 그게 한 후보에만 걸림 */
  | { kind: 'partial'; id: string; distance: number }
  /** 퍼지 매칭이 둘 이상의 후보에 걸림 → 오답 취급 대상(호출자가 결정) */
  | { kind: 'ambiguous'; ids: string[] }
  | { kind: 'none' }

/** 부분 일치를 허용할 최소 입력 길이(정규화 후). 너무 짧으면 아무 이름에나 걸린다 */
const MIN_PARTIAL_LEN = 2

// 공백(유니코드 전체) · 하이픈류 · 마침표 · 가운뎃점(·, ・, ‧)
const STRIP_RE = /[\s\-‐-―−.·・‧]/gu

export function normalize(input: string): string {
  return input.normalize('NFC').toLowerCase().replace(STRIP_RE, '')
}

/** 표준 Levenshtein 편집 거리(삽입·삭제·치환 각 1). 코드포인트 단위. */
export function levenshtein(a: string, b: string): number {
  const s = Array.from(a)
  const t = Array.from(b)
  if (s.length === 0) return t.length
  if (t.length === 0) return s.length

  let prev = new Array<number>(t.length + 1)
  let curr = new Array<number>(t.length + 1)
  for (let j = 0; j <= t.length; j++) prev[j] = j

  for (let i = 1; i <= s.length; i++) {
    curr[0] = i
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1, // 삭제
        curr[j - 1] + 1, // 삽입
        prev[j - 1] + cost, // 치환
      )
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[t.length]
}

/** 정규화된 입력 길이에 따른 허용 거리 */
export function allowedDistance(normalizedLength: number): number {
  return normalizedLength <= FUZZY.SHORT_MAX_LEN ? FUZZY.SHORT_DISTANCE : FUZZY.LONG_DISTANCE
}

/** 후보 하나의 정규화된 표기 집합(name + aliases, 빈 문자열 제외, 중복 제거) */
function keysOf(c: Candidate): string[] {
  const raw = [c.name, ...(c.aliases ?? [])]
  const set = new Set<string>()
  for (const r of raw) {
    const n = normalize(r)
    if (n) set.add(n)
  }
  return [...set]
}

export function matchAnswer(input: string, candidates: readonly Candidate[]): MatchResult {
  const q = normalize(input)
  if (!q) return { kind: 'none' }

  const keyed = candidates.map((c) => ({ id: c.id, keys: keysOf(c) }))

  // 2. 정확 일치
  const exactIds = keyed.filter((c) => c.keys.includes(q)).map((c) => c.id)
  if (exactIds.length === 1) return { kind: 'exact', id: exactIds[0] }
  if (exactIds.length > 1) return { kind: 'ambiguous', ids: exactIds }

  // 3. 퍼지 — 후보별 최소 거리
  const maxDist = allowedDistance(q.length)
  const fuzzy: { id: string; distance: number }[] = []
  for (const c of keyed) {
    let best = Infinity
    for (const k of c.keys) {
      // 길이 차이가 허용 거리를 넘으면 계산 생략(하한)
      if (Math.abs(k.length - q.length) > maxDist) continue
      const d = levenshtein(q, k)
      if (d < best) best = d
    }
    if (best <= maxDist) fuzzy.push({ id: c.id, distance: best })
  }

  if (fuzzy.length === 1) return { kind: 'fuzzy', id: fuzzy[0].id, distance: fuzzy[0].distance }
  if (fuzzy.length > 1) return { kind: 'ambiguous', ids: fuzzy.map((f) => f.id) }

  // 4. 부분 일치 — 입력이 표기의 앞/뒤 조각과 같거나 거의 같을 때만.
  //    (가운데 조각은 오탐이 많아 보지 않는다)
  if ([...q].length < MIN_PARTIAL_LEN) return { kind: 'none' }
  const partialMax = Math.min(maxDist, [...q].length <= 4 ? 1 : 2)
  const partial: { id: string; distance: number }[] = []
  for (const c of keyed) {
    let best = Infinity
    for (const k of c.keys) {
      const kc = [...k]
      const qc = [...q]
      if (kc.length <= qc.length) continue // 더 짧은 표기는 3단계에서 이미 봤다
      const head = kc.slice(0, qc.length).join('')
      const tail = kc.slice(kc.length - qc.length).join('')
      const d = Math.min(levenshtein(q, head), levenshtein(q, tail))
      if (d < best) best = d
    }
    if (best <= partialMax) partial.push({ id: c.id, distance: best })
  }
  if (partial.length === 1) return { kind: 'partial', id: partial[0].id, distance: partial[0].distance }
  if (partial.length > 1) return { kind: 'ambiguous', ids: partial.map((p) => p.id) }
  return { kind: 'none' }
}
