/**
 * 데이터 무결성 검사 — src/data/*.json 을 채운 뒤 `npm test` 로 오타를 잡는다.
 * 실패 메시지에 문제 id 를 넣어 어디를 고칠지 바로 알 수 있게 한다.
 */
import { describe, it, expect } from 'vitest'
import { TOP10, COMBO10, LINEUPS, CAREERS, OXQUIZ } from './index'
import { matchAnswer, normalize, type Candidate } from '../lib/matchAnswer'
import type { Top10Question, LineupQuestion } from '../types'

/**
 * 아직 채우지 않은 스키마 샘플. 개수 규칙(정답 10개 · 선발 11명 · 등번호 0 금지)만 면제한다.
 * ⚠️ 실제 데이터로 채운 뒤에는 여기서 지울 것 — 남겨 두면 검사가 느슨해진다.
 */
const SAMPLE_IDS = new Set(['sample-top10', 'salah-liverpool-english', 'ucl-2008-final-manutd'])

function uniqueIds(list: { id: string }[], label: string) {
  const seen = new Set<string>()
  for (const q of list) {
    expect(q.id, `${label}: id 비어 있음`).toBeTruthy()
    expect(seen.has(q.id), `${label}: id 중복 "${q.id}"`).toBe(false)
    seen.add(q.id)
  }
}

/** name + aliases 각각이 같은 문제 안에서 오직 그 후보에만 정확히 매칭돼야 한다 */
function assertNoAliasCollision(candidates: Candidate[], label: string) {
  for (const c of candidates) {
    for (const key of [c.name, ...(c.aliases ?? [])]) {
      if (!normalize(key)) continue
      const r = matchAnswer(key, candidates)
      expect(
        r.kind === 'exact' && r.id === c.id,
        `${label}: "${key}" 가 후보 "${c.name}" 에만 정확 매칭돼야 하는데 결과=${JSON.stringify(r)} (다른 후보와 alias 충돌)`,
      ).toBe(true)
    }
  }
}

function checkTop10(list: Top10Question[], label: string) {
  describe(label, () => {
    it('id 유일', () => uniqueIds(list, label))
    for (const q of list) {
      describe(q.id, () => {
        it('제목·정답 필수', () => {
          expect(q.title.trim()).not.toBe('')
          expect(q.answers.length).toBeGreaterThan(0)
          for (const a of q.answers) expect(a.name.trim(), `${q.id} rank ${a.rank}: name 비어 있음`).not.toBe('')
        })
        if (!SAMPLE_IDS.has(q.id)) {
          it('정답 10개', () => expect(q.answers.length).toBe(10))
        }
        it('rank 유일 · 1부터 연속', () => {
          const ranks = q.answers.map((a) => a.rank).sort((x, y) => x - y)
          expect(ranks).toEqual(ranks.map((_, i) => i + 1))
        })
        it('value 는 전부 있거나 전부 비어야 함(반만 있으면 표시가 어색)', () => {
          const withValue = q.answers.filter((a) => a.value && a.value.trim() !== '').length
          expect([0, q.answers.length]).toContain(withValue)
        })
        it('alias 충돌 없음', () => {
          assertNoAliasCollision(
            q.answers.map((a) => ({ id: String(a.rank), name: a.name, aliases: a.aliases })),
            q.id,
          )
        })
      })
    }
  })
}

checkTop10(TOP10, 'top10.json')
checkTop10(COMBO10, 'combo10.json')

describe('lineups.json', () => {
  it('id 유일', () => uniqueIds(LINEUPS, 'lineups'))
  for (const q of LINEUPS as LineupQuestion[]) {
    describe(q.id, () => {
      const sample = SAMPLE_IDS.has(q.id)
      it('제목·포메이션 필수', () => {
        expect(q.title.trim()).not.toBe('')
        expect(q.formation.trim()).not.toBe('')
      })
      it('선발 11명', () => expect(q.players.length).toBe(11))
      it('row 는 1~4, 같은 줄 col 중복 없음', () => {
        const seen = new Set<string>()
        for (const p of q.players) {
          expect([1, 2, 3, 4], `${q.id} #${p.number} row=${p.row}`).toContain(p.row)
          expect(Number.isInteger(p.col) && p.col >= 1, `${q.id} #${p.number} col=${p.col}`).toBe(true)
          const k = `${p.row}-${p.col}`
          expect(seen.has(k), `${q.id}: row/col 중복 ${k}`).toBe(false)
          seen.add(k)
        }
      })
      it('col 은 줄마다 1부터 빠짐없이', () => {
        const byRow = new Map<number, number[]>()
        for (const p of q.players) byRow.set(p.row, [...(byRow.get(p.row) ?? []), p.col])
        for (const [row, cols] of byRow) {
          const sorted = [...cols].sort((a, b) => a - b)
          expect(sorted, `${q.id} row ${row}`).toEqual(sorted.map((_, i) => i + 1))
        }
      })
      it('포메이션 문자열과 줄별 인원 일치(GK 1 + 숫자들)', () => {
        const nums = q.formation.split('-').map(Number)
        const count = (row: number) => q.players.filter((p) => p.row === row).length
        expect(count(1), `${q.id}: GK 는 1명`).toBe(1)
        // 3줄 포메이션(4-4-2)만 row 2/3/4 로 직접 대응. 4줄(4-2-3-1)은 미드 두 줄을 row 3 에 합치므로 합계만 본다.
        if (nums.length === 3) {
          expect([count(2), count(3), count(4)], `${q.id}: ${q.formation}`).toEqual(nums)
        } else {
          expect(count(2) + count(3) + count(4), `${q.id}: ${q.formation}`).toBe(nums.reduce((a, b) => a + b, 0))
        }
      })
      it('GK 는 row 1 하나', () => {
        expect(q.players.filter((p) => p.row === 1)).toHaveLength(1)
      })
      if (!sample) {
        it('등번호 유일 · 0 아님 · TODO 없음', () => {
          const nums = q.players.map((p) => p.number)
          expect(new Set(nums).size, `${q.id}: 등번호 중복`).toBe(nums.length)
          for (const p of q.players) {
            expect(p.number, `${q.id}: 등번호 0`).toBeGreaterThan(0)
            expect(p.name.startsWith('TODO'), `${q.id}: TODO 남음`).toBe(false)
            expect(p.position.trim()).not.toBe('')
            expect(p.nationality.trim()).not.toBe('')
          }
        })
      }
      it('alias 충돌 없음', () => {
        assertNoAliasCollision(
          q.players.map((p) => ({ id: `${p.row}-${p.col}`, name: p.name, aliases: p.aliases })),
          q.id,
        )
      })
      if (q.bonus) {
        it('보너스: 질문·정답 필수', () => {
          expect(q.bonus!.question.trim()).not.toBe('')
          expect(q.bonus!.answers.length).toBeGreaterThan(0)
          for (const a of q.bonus!.answers) expect(a.trim()).not.toBe('')
        })
      }
    })
  }
})

describe('careers.json', () => {
  it('id 유일', () => uniqueIds(CAREERS, 'careers'))
  for (const q of CAREERS) {
    it(`${q.id}: 이름·팀 이력 2개 이상`, () => {
      expect(q.name.trim()).not.toBe('')
      expect(q.clubs.length).toBeGreaterThanOrEqual(2)
      for (const c of q.clubs) expect(c.trim()).not.toBe('')
    })
  }
  it('선수끼리 이름/alias 가 겹치지 않음(한 문제 = 한 명이지만 데이터 중복 방지)', () => {
    assertNoAliasCollision(
      CAREERS.map((q) => ({ id: q.id, name: q.name, aliases: q.aliases })),
      'careers',
    )
  })
})

describe('oxquiz.json', () => {
  it('id 유일', () => uniqueIds(OXQUIZ, 'oxquiz'))
  for (const q of OXQUIZ) {
    it(`${q.id}: 문장·해설 필수, answer 는 boolean`, () => {
      expect(q.statement.trim()).not.toBe('')
      expect(q.explanation.trim()).not.toBe('')
      expect(typeof q.answer).toBe('boolean')
    })
  }
})
