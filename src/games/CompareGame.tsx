import { useCallback, useMemo, useState } from 'react'
import type { GameRules } from '../config'
import type { Top10Question } from '../types'
import { pickPair, toNumericLists, type NumericItem, type NumericList } from '../lib/compare'
import { pickRandom } from '../lib/random'
import { useLives } from '../hooks/useLives'
import { useSessionScore } from '../hooks/useSessionScore'
import { formatScore } from '../lib/score'
import { Hearts } from '../components/Hearts'
import { Header } from '../components/Header'
import { TurnChip } from '../components/TurnChip'

interface Props {
  gameKey: string
  title: string
  /** 이미 검증된 목록 — 여기서 비교 문제를 파생시킨다(새 데이터 없음) */
  questions: readonly Top10Question[]
  rules: GameRules
  onBack: () => void
}

interface Round {
  list: NumericList
  pair: [NumericItem, NumericItem]
}

/** 연속 정답 1개당 점수. 길게 이어갈수록 가팔라진다 */
function streakPoints(streak: number): number {
  return 1000 + Math.min(streak - 1, 9) * 500
}

/** 게임 8 — 두 명 중 기록이 더 많은 쪽을 고른다. 탭 한 번이라 폰 돌려가며 하기 좋다. */
export function CompareGame({ gameKey, title, questions, rules, onBack }: Props) {
  const lists = useMemo(() => toNumericLists(questions), [questions])
  const score = useSessionScore(gameKey)
  const { lives, loseLife, maxLives } = useLives(rules)

  const draw = useCallback((): Round | null => {
    for (let i = 0; i < 20; i++) {
      const list = pickRandom(lists)
      if (!list) return null
      const pair = pickPair(list)
      if (pair) return { list, pair }
    }
    return null
  }, [lists])

  const [round, setRound] = useState<Round | null>(() => draw())
  const [picked, setPicked] = useState<0 | 1 | null>(null)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [over, setOver] = useState(false)

  if (!round) {
    return (
      <>
        <Header title={title} onBack={onBack} />
        <main className="screen center">
          <p className="muted">비교할 수 있는 기록이 아직 없어요.</p>
        </main>
      </>
    )
  }

  const [a, b] = round.pair
  const winner: 0 | 1 = a.value >= b.value ? 0 : 1

  const choose = (idx: 0 | 1) => {
    if (picked !== null || over) return
    setPicked(idx)
    if (idx === winner) {
      const next = streak + 1
      setStreak(next)
      setBestStreak((s) => Math.max(s, next))
      score.add(streakPoints(next))
    } else {
      setStreak(0)
      loseLife()
      if (lives - 1 <= 0) setOver(true)
    }
  }

  const next = () => {
    setPicked(null)
    setRound(draw())
  }

  const restart = () => {
    setOver(false)
    setStreak(0)
    setPicked(null)
    setRound(draw())
    window.location.reload() // 목숨을 초기화하는 가장 단순한 방법
  }

  if (over) {
    return (
      <>
        <Header title={title} onBack={onBack} />
        <main className="screen center">
          <section className="ox-result">
            <p className="label">최고 연속 정답</p>
            <p className="score">{bestStreak}</p>
            <p className="ox-points">{formatScore(score.total)}점</p>
            <button type="button" className="btn primary wide" onClick={restart} autoFocus>
              다시 하기
            </button>
          </section>
        </main>
      </>
    )
  }

  const card = (item: NumericItem, idx: 0 | 1) => {
    const state = picked === null ? '' : idx === winner ? 'win' : 'lose'
    return (
      <button
        type="button"
        className={`vs-card ${state} ${picked === idx ? 'picked' : ''}`}
        onClick={() => choose(idx)}
        disabled={picked !== null}
      >
        <span className="vs-name">{item.name}</span>
        {item.hintClub && <span className="vs-club">{item.hintClub}</span>}
        <span className="vs-value">{picked !== null ? item.label : '?'}</span>
      </button>
    )
  }

  return (
    <>
      <Header
        title={title}
        onBack={onBack}
        right={
          <div className="header-stack">
            <Hearts lives={lives} max={maxLives} />
            <TurnChip total={score.total} />
          </div>
        }
      />
      <main className="screen">
        <h2 className="q-title">{round.list.subject}</h2>
        <p className="q-subtitle">누가 더 많을까요?</p>

        <div className="vs">
          {card(a, 0)}
          <span className="vs-mid" aria-hidden>
            VS
          </span>
          {card(b, 1)}
        </div>

        <p className={`feedback ${picked === null ? 'empty' : picked === winner ? 'ok' : 'wrong'}`} aria-live="polite">
          {picked === null ? ' ' : picked === winner ? `정답! 연속 ${streak}` : '아쉬워요'}
        </p>

        {picked !== null && (
          <button type="button" className="btn primary wide" onClick={next} autoFocus>
            다음 문제
          </button>
        )}
        {picked === null && streak > 0 && <p className="muted small">연속 {streak}개 맞히는 중</p>}
      </main>
    </>
  )
}
