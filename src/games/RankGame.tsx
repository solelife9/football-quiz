import { useCallback, useMemo, useState } from 'react'
import type { GameRules } from '../config'
import type { Top10Question } from '../types'
import { pickDistinct, toNumericLists, type NumericItem, type NumericList } from '../lib/compare'
import { pickRandom, shuffle } from '../lib/random'
import { useLives } from '../hooks/useLives'
import { useSessionScore } from '../hooks/useSessionScore'
import { formatScore, scoreFor } from '../lib/score'
import { Hearts } from '../components/Hearts'
import { Header } from '../components/Header'
import { TurnChip } from '../components/TurnChip'
import { QuestionEnd } from '../components/QuestionEnd'
import { Feedback, type FeedbackMsg } from '../components/Feedback'

interface Props {
  gameKey: string
  title: string
  questions: readonly Top10Question[]
  rules: GameRules
  onBack: () => void
}

/** 한 문제에 세우는 인원 */
const N = 4

interface Round {
  list: NumericList
  /** 정답 순서(값 큰 순) */
  answer: NumericItem[]
  /** 섞어서 보여줄 순서 */
  shuffled: NumericItem[]
}

/** 게임 9 — 기록이 많은 순서대로 4명을 줄 세운다. 탭만 쓴다. */
export function RankGame({ gameKey, title, questions, rules, onBack }: Props) {
  const lists = useMemo(() => toNumericLists(questions), [questions])
  const score = useSessionScore(gameKey)

  const draw = useCallback((): Round | null => {
    for (let i = 0; i < 30; i++) {
      const list = pickRandom(lists)
      if (!list) return null
      const picked = pickDistinct(list, N)
      if (!picked) continue
      const answer = [...picked].sort((x, y) => y.value - x.value)
      return { list, answer, shuffled: shuffle(picked) }
    }
    return null
  }, [lists])

  const [round, setRound] = useState<Round | null>(() => draw())
  const [roundNo, setRoundNo] = useState(0)

  if (!round) {
    return (
      <>
        <Header title={title} onBack={onBack} />
        <main className="screen center">
          <p className="muted">줄 세울 만한 기록이 아직 없어요.</p>
        </main>
      </>
    )
  }

  return (
    <RankRound
      key={roundNo}
      round={round}
      title={title}
      rules={rules}
      score={score}
      onBack={onBack}
      onNext={() => {
        setRound(draw())
        setRoundNo((n) => n + 1)
      }}
    />
  )
}

interface RoundProps {
  round: Round
  title: string
  rules: GameRules
  score: ReturnType<typeof useSessionScore>
  onBack: () => void
  onNext: () => void
}

function RankRound({ round, title, rules, score, onBack, onNext }: RoundProps) {
  const { lives, loseLife, maxLives } = useLives(rules)
  const [placed, setPlaced] = useState<NumericItem[]>([])
  const [wrong, setWrong] = useState<string | null>(null)
  const [msg, setMsg] = useState<FeedbackMsg | null>(null)
  const [ended, setEnded] = useState<false | 'won' | 'lost'>(false)
  const [banked, setBanked] = useState(false)

  const earned = scoreFor(placed.length, round.answer.length)
  if (ended && !banked) {
    setBanked(true)
    score.add(earned)
  }

  const tap = (item: NumericItem) => {
    if (ended || placed.includes(item)) return
    if (item === round.answer[placed.length]) {
      const after = [...placed, item]
      setPlaced(after)
      setMsg({ kind: 'ok', text: `${placed.length + 1}번째 정답 · ${item.label}` })
      if (after.length === round.answer.length) setEnded('won')
    } else {
      loseLife()
      setWrong(item.name)
      window.setTimeout(() => setWrong(null), 400)
      setMsg({ kind: 'wrong', text: '순서가 달라요' })
      if (lives - 1 <= 0) setEnded('lost')
    }
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
        <p className="q-subtitle">많은 순서대로 눌러 주세요</p>

        <ol className="order-slots">
          {round.answer.map((ans, pos) => {
            const done = pos < placed.length
            return (
              <li key={pos} className={`order-slot ${done ? 'open' : ''} ${ended && !done ? 'missed' : ''}`}>
                <span className="step-no">{pos + 1}</span>
                <span className="club">
                  {done || ended ? `${ans.name} · ${ans.label}` : '·····'}
                </span>
              </li>
            )
          })}
        </ol>

        {!ended && (
          <>
            <div className="chips">
              {round.shuffled.map((item) => {
                const used = placed.includes(item)
                return (
                  <button
                    key={item.name}
                    type="button"
                    className={`chip ${used ? 'used' : ''} ${wrong === item.name ? 'shake' : ''}`}
                    disabled={used}
                    onClick={() => tap(item)}
                  >
                    {item.name}
                  </button>
                )
              })}
            </div>
            <Feedback msg={msg} />
          </>
        )}

        {ended && (
          <QuestionEnd
            status={ended}
            summary={
              (ended === 'won' ? '순서 전부 맞혔어요' : `${placed.length}/${round.answer.length}까지 맞혔어요`) +
              ` · ${formatScore(earned)}점`
            }
            onNext={onNext}
          />
        )}
      </main>
    </>
  )
}
