import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Top10Game } from '../games/Top10Game'
import { LineupGame } from '../games/LineupGame'
import { CareerGame } from '../games/CareerGame'
import { OXGame } from '../games/OXGame'
import type { Top10Question, LineupQuestion, CareerQuestion, OXQuestion } from '../types'

const rules = { lives: 3, hints: 2 }

const top10Q: Top10Question = {
  id: 'q1',
  title: '테스트 TOP 3',
  trivia: '트리비아 한 줄',
  answers: [
    { rank: 1, name: '모하메드 살라', value: '100', hint: { club: '리버풀', nationality: '이집트' }, aliases: ['살라'] },
    { rank: 2, name: '베르나르두 실바', value: '90', hint: { club: '맨시티', nationality: '포르투갈' }, aliases: ['베실바'] },
    { rank: 3, name: '티아구 실바', value: '80', hint: { club: '첼시', nationality: '브라질' }, aliases: ['티실바'] },
  ],
}

async function type(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = screen.getByRole('textbox')
  await user.clear(input)
  await user.type(input, text + '{Enter}')
}

function hearts() {
  return screen.getByRole('img', { name: /목숨/ }).getAttribute('aria-label')
}

describe('Top10Game', () => {
  it('정답 → 칸 열림, 중복 → 이미 맞혔어요(차감 없음), 오답 → 차감+입력 비움, 모호 → 차감 없음', async () => {
    const user = userEvent.setup()
    render(<Top10Game gameKey="t" title="T" questions={[top10Q]} rules={rules} onBack={() => {}} />)
    expect(hearts()).toBe('목숨 3/3')

    await type(user, '살라')
    expect(screen.getByText('모하메드 살라')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()

    await type(user, '살라')
    expect(screen.getByText('이미 맞혔어요')).toBeInTheDocument()
    expect(hearts()).toBe('목숨 3/3')

    await type(user, '메시')
    expect(hearts()).toBe('목숨 2/3')
    expect(screen.getByRole('textbox')).toHaveValue('')

    // '배실바' → 베실바/티실바 둘 다 거리 1 → 모호 → 차감 없음, 값 유지
    await type(user, '배실바')
    expect(screen.getByText(/두 명 이상/)).toBeInTheDocument()
    expect(hearts()).toBe('목숨 2/3')
    expect(screen.getByRole('textbox')).toHaveValue('배실바')
  })

  it('목숨 0 → 못 맞힌 정답 전부 공개 + trivia + 다음 문제', async () => {
    const user = userEvent.setup()
    render(<Top10Game gameKey="t" title="T" questions={[top10Q]} rules={rules} onBack={() => {}} />)
    await type(user, 'x1')
    await type(user, 'x2')
    await type(user, 'x3')
    expect(screen.getByText('목숨을 다 썼어요')).toBeInTheDocument()
    expect(screen.getByText('모하메드 살라')).toBeInTheDocument()
    expect(screen.getByText('베르나르두 실바')).toBeInTheDocument()
    expect(screen.getByText('티아구 실바')).toBeInTheDocument()
    expect(screen.getByText('트리비아 한 줄')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 문제' })).toBeInTheDocument()
  })

  it('힌트 버튼 카운트 + 다 쓰면 비활성 + 칸에 소속/국적 노출', async () => {
    const user = userEvent.setup()
    render(<Top10Game gameKey="t" title="T" questions={[top10Q]} rules={rules} onBack={() => {}} />)
    const btn = screen.getByRole('button', { name: '힌트 (2/2)' })
    await user.click(btn)
    expect(screen.getByRole('button', { name: '힌트 (1/2)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '힌트 (1/2)' }))
    expect(screen.getByRole('button', { name: '힌트 (0/2)' })).toBeDisabled()
    // 힌트 텍스트 2개 노출
    expect(screen.getAllByText(/리버풀 · 이집트|맨시티 · 포르투갈|첼시 · 브라질/)).toHaveLength(2)
  })

  it('정답 보기: 두 번 눌러야 공개', async () => {
    const user = userEvent.setup()
    render(<Top10Game gameKey="t" title="T" questions={[top10Q]} rules={rules} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: '정답 보기' }))
    expect(screen.queryByText('정답 공개')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '정말 볼까요?' }))
    expect(screen.getByText('정답 공개')).toBeInTheDocument()
    expect(screen.getByText('티아구 실바')).toBeInTheDocument()
  })

  it('전부 맞히면 완료', async () => {
    const user = userEvent.setup()
    render(<Top10Game gameKey="t" title="T" questions={[top10Q]} rules={rules} onBack={() => {}} />)
    await type(user, '살라')
    await type(user, '베실바')
    await type(user, '티실바')
    expect(screen.getByText('완료!')).toBeInTheDocument()
  })

  it('value 없으면 순위 열 없이 표시', () => {
    const q: Top10Question = { ...top10Q, answers: top10Q.answers.map((a) => ({ ...a, value: '' })) }
    const { container } = render(<Top10Game gameKey="t" title="T" questions={[q]} rules={rules} onBack={() => {}} />)
    expect(container.querySelector('.slots.unranked')).toBeTruthy()
    expect(container.querySelector('.slot .rank')).toBeNull()
  })
})

const lineupQ: LineupQuestion = {
  id: 'l1',
  title: '테스트 결승',
  formation: '1-1-1',
  bonus: { question: '보너스?', answers: ['보너스정답', 'bonus'] },
  players: [
    { number: 1, row: 1, col: 1, name: '판 데르 사르', position: '골키퍼', nationality: '네덜란드', aliases: ['반데사르'] },
    { number: 5, row: 2, col: 1, name: '퍼디낸드', position: '센터백', nationality: '잉글랜드', aliases: ['리오'] },
    { number: 7, row: 4, col: 1, name: '호날두', position: '윙어', nationality: '포르투갈', aliases: ['cr7'] },
  ],
}

describe('LineupGame', () => {
  it('등번호는 처음부터 전부 노출, 이름 입력하면 해당 칸 채움, 11명(여기선 3) 완성 → 보너스 → 완료', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <LineupGame gameKey="l" title="L" questions={[lineupQ]} rules={rules} onBack={() => {}} />,
    )
    const numbers = [...container.querySelectorAll('.player .number')].map((n) => n.textContent)
    expect(numbers).toEqual(['7', '5', '1']) // 위(공격)→아래(GK)
    expect(container.querySelectorAll('.player.open')).toHaveLength(0)

    await type(user, '반데사르')
    expect(container.querySelectorAll('.player.open')).toHaveLength(1)
    expect(within(container.querySelector('.player.open')!).getByText('판 데르 사르')).toBeInTheDocument()

    await type(user, '리오')
    await type(user, 'cr7')
    expect(screen.getByText('보너스?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /힌트/ })).toBeDisabled()

    await type(user, 'bonus')
    expect(screen.getByText('완료!')).toBeInTheDocument()
    expect(screen.getByText(/맞혔어요 · 보너스정답/)).toBeInTheDocument()
  })

  it('힌트: 한 칸이 포지션 → 국적 → 성 초성 순으로 열린다', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <LineupGame gameKey="l" title="L" questions={[lineupQ]} rules={{ lives: 3, hints: 3 }} onBack={() => {}} />,
    )
    await user.click(screen.getByRole('button', { name: '힌트 (3/3)' }))
    const hinted = container.querySelector('.hint-text')!
    const stage1 = hinted.textContent!
    expect(['골키퍼', '센터백', '윙어']).toContain(stage1)
    await user.click(screen.getByRole('button', { name: '힌트 (2/3)' }))
    expect(container.querySelectorAll('.hint-text')).toHaveLength(1)
    const stage2 = container.querySelector('.hint-text')!.textContent!
    expect(stage2.startsWith(stage1 + ' · ')).toBe(true)
    await user.click(screen.getByRole('button', { name: '힌트 (1/3)' }))
    const stage3 = container.querySelector('.hint-text')!.textContent!
    expect(stage3.split(' · ')).toHaveLength(3)
    expect(['ㅅㄹ', 'ㅍㄷㄴㄷ', 'ㅎ']).toContain(stage3.split(' · ')[2]) // 호날두: 공백 없는 3자 → 첫 글자 초성
  })

  it('목숨 0 → 전원 공개(보너스 정답 포함)', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <LineupGame gameKey="l" title="L" questions={[lineupQ]} rules={rules} onBack={() => {}} />,
    )
    await type(user, 'a')
    await type(user, 'b')
    await type(user, 'c')
    expect(screen.getByText('목숨을 다 썼어요')).toBeInTheDocument()
    expect(container.querySelectorAll('.player.missed')).toHaveLength(3)
    expect(screen.getByText('호날두')).toBeInTheDocument()
    expect(screen.getByText('보너스정답')).toBeInTheDocument()
  })
})

const careerQ: CareerQuestion = {
  id: 'c1',
  name: '크리스티아누 호날두',
  clubs: ['스포르팅', '맨유', '레알', '유벤투스'],
  trivia: 'T',
  aliases: ['호날두', 'cr7'],
}

describe('CareerGame', () => {
  it('첫 팀만 보이고, 다음 팀 보기로 하나씩, 맞히면 몇 개 만에 맞혔는지', async () => {
    const user = userEvent.setup()
    render(<CareerGame gameKey="c" title="C" questions={[careerQ]} rules={rules} onBack={() => {}} />)
    expect(screen.getByText('스포르팅')).toBeInTheDocument()
    expect(screen.queryByText('맨유')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /다음 팀 보기 \(1\/4\)/ }))
    expect(screen.getByText('맨유')).toBeInTheDocument()
    await type(user, '호날두')
    expect(screen.getByText(/팀 2개 보고 맞혔어요/)).toBeInTheDocument()
    // 종료 후 전체 이력 공개
    expect(screen.getByText('유벤투스')).toBeInTheDocument()
  })

  it('오답 3번 → 이름 공개', async () => {
    const user = userEvent.setup()
    render(<CareerGame gameKey="c" title="C" questions={[careerQ]} rules={rules} onBack={() => {}} />)
    await type(user, 'a')
    await type(user, 'b')
    await type(user, 'c')
    expect(screen.getByText('크리스티아누 호날두')).toBeInTheDocument()
    expect(screen.getByText('목숨을 다 썼어요')).toBeInTheDocument()
  })

  it('힌트 3단계: 글자 수 → 첫 초성 → 전체 초성', async () => {
    const user = userEvent.setup()
    render(<CareerGame gameKey="c" title="C" questions={[careerQ]} rules={{ lives: 3, hints: 3 }} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: '힌트 (3/3)' }))
    expect(screen.getByText('이름 9글자')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '힌트 (2/3)' }))
    expect(screen.getByText('첫 글자 초성 ㅋ')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '힌트 (1/3)' }))
    expect(screen.getByText('초성 ㅋㄹㅅㅌㅇㄴ ㅎㄴㄷ')).toBeInTheDocument()
  })
})

const oxQs: OXQuestion[] = Array.from({ length: 12 }, (_, i) => ({
  id: `ox-${i}`,
  statement: `문장 ${i}`,
  answer: i % 2 === 0,
  explanation: `해설 ${i}`,
}))

describe('OXGame', () => {
  it('10문제 진행, 목숨/힌트 UI 없음, 즉시 정답+해설, 최종 점수', async () => {
    const user = userEvent.setup()
    render(<OXGame title="OX" questions={oxQs} onBack={() => {}} />)
    expect(screen.queryByRole('img', { name: /목숨/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /힌트/ })).not.toBeInTheDocument()
    expect(screen.getByText('1/10')).toBeInTheDocument()

    let correct = 0
    for (let i = 0; i < 10; i++) {
      const stmt = screen.getByText(/^문장 \d+$/).textContent!
      const n = Number(stmt.replace('문장 ', ''))
      // 항상 O 선택 → 짝수면 정답
      await user.click(screen.getByRole('button', { name: /^O,/ }))
      expect(screen.getByText(`해설 ${n}`)).toBeInTheDocument()
      if (n % 2 === 0) correct++
      expect(screen.getByRole('button', { name: /^O,/ })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: i === 9 ? '결과 보기' : '다음' }))
    }
    expect(screen.getByText('최종 점수')).toBeInTheDocument()
    expect(screen.getByText(String(correct))).toBeInTheDocument()
    expect(screen.getByText('/10')).toBeInTheDocument()
    expect(localStorage.getItem('football-quiz:ox:best')).toBe(String(correct))
  })
})

describe('빈 데이터', () => {
  it('문제 없으면 안내만', () => {
    render(<Top10Game gameKey="e" title="E" questions={[]} rules={rules} onBack={() => {}} />)
    expect(screen.getByText(/문제가 아직 없어요/)).toBeInTheDocument()
  })
})

// act 경고 억제용 — 사용 안 하지만 import 유지 방지
void act
void vi

describe('다음 문제', () => {
  it('문제가 1개뿐이어도 다음 문제를 누르면 라운드가 초기화된다', async () => {
    const user = userEvent.setup()
    render(<Top10Game gameKey="one" title="T" questions={[top10Q]} rules={rules} onBack={() => {}} />)
    await user.click(screen.getByRole('button', { name: '정답 보기' }))
    await user.click(screen.getByRole('button', { name: '정말 볼까요?' }))
    await user.click(screen.getByRole('button', { name: '다음 문제' }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(hearts()).toBe('목숨 3/3')
    expect(screen.queryByText('모하메드 살라')).not.toBeInTheDocument()
  })
})
