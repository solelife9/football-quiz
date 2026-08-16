import type { Top10Question } from '../types'

/**
 * 이미 검증된 목록(combo10)에서 '숫자 비교' 문제를 만들어 낸다.
 * 새 데이터를 만들지 않는다 — 같은 목록 안의 값끼리만 비교하므로 틀릴 수가 없다.
 */

export interface NumericItem {
  name: string
  aliases?: readonly string[]
  /** 비교에 쓰는 숫자 */
  value: number
  /** 화면에 보여줄 원래 표기("260골") */
  label: string
  hintClub?: string
}

export interface NumericList {
  id: string
  /** "프리미어리그 통산 최다 득점" 처럼 TOP 10·(N명) 꼬리표를 뗀 제목 */
  subject: string
  unit: string
  items: NumericItem[]
}

/** "260골", "1,000경기", "4회" → 숫자+단위. 그 외(연도·클럽명·복합 문자열)는 null */
export function parseValue(raw: string | undefined): { value: number; unit: string } | null {
  if (!raw) return null
  // ⚠️ \b 는 한글 뒤에서 동작하지 않는다(정규식 단어 경계는 한글을 단어 문자로 보지 않음).
  // 단위 뒤 꼬리표는 허용한다 — 실제 데이터가 "4회 (2001-02·2003-04)" 형태다.
  const m = raw.replace(/,/g, '').match(/^(\d+(?:\.\d+)?)\s*(골|경기|도움|회|클린시트)/)
  if (!m) return null
  return { value: Number(m[1]), unit: m[2] }
}

/** 제목에서 순위·인원 꼬리표를 떼어 "무엇을 비교하는지"만 남긴다 */
export function toSubject(title: string): string {
  return title
    .replace(/\s*TOP\s*10.*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/\s*전원$|\s*전부$/, '')
    .trim()
}

/** 목록들 중 '전부 같은 단위의 숫자'인 것만 비교용으로 추린다 */
export function toNumericLists(questions: readonly Top10Question[]): NumericList[] {
  const out: NumericList[] = []
  for (const q of questions) {
    const parsed = q.answers.map((a) => parseValue(a.value))
    if (parsed.some((p) => p === null)) continue
    const units = new Set(parsed.map((p) => p!.unit))
    if (units.size !== 1) continue
    const items = q.answers.map((a, i) => ({
      name: a.name,
      aliases: a.aliases,
      value: parsed[i]!.value,
      label: a.value!.trim(),
      hintClub: a.hint?.club,
    }))
    // 값이 전부 같으면 비교 문제가 성립하지 않는다
    if (new Set(items.map((i) => i.value)).size < 2) continue
    out.push({ id: q.id, subject: toSubject(q.title), unit: parsed[0]!.unit, items })
  }
  return out
}

/** 서로 값이 다른 두 항목 뽑기(동점이면 "누가 더 위?"가 성립하지 않는다) */
export function pickPair(list: NumericList, rand: () => number = Math.random): [NumericItem, NumericItem] | null {
  const pairs: [NumericItem, NumericItem][] = []
  for (let i = 0; i < list.items.length; i++) {
    for (let j = i + 1; j < list.items.length; j++) {
      if (list.items[i].value !== list.items[j].value) pairs.push([list.items[i], list.items[j]])
    }
  }
  if (pairs.length === 0) return null
  return pairs[Math.floor(rand() * pairs.length)]
}

/** 값이 서로 다른 n개 뽑기(줄 세우기용). 부족하면 null */
export function pickDistinct(list: NumericList, n: number, rand: () => number = Math.random): NumericItem[] | null {
  const byValue = new Map<number, NumericItem[]>()
  for (const it of list.items) {
    const arr = byValue.get(it.value) ?? []
    arr.push(it)
    byValue.set(it.value, arr)
  }
  const values = [...byValue.keys()]
  if (values.length < n) return null
  // 값 하나당 한 명만 (동점자가 섞이면 정답 순서가 유일하지 않다)
  const shuffled = [...values].sort(() => rand() - 0.5).slice(0, n)
  return shuffled.map((v) => {
    const cands = byValue.get(v)!
    return cands[Math.floor(rand() * cands.length)]
  })
}
