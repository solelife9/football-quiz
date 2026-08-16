import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GameRules } from '../config'
import type { CareerQuestion } from '../types'
import { shuffle } from '../lib/random'
import { useLives } from '../hooks/useLives'
import { useQuestionQueue } from '../hooks/useQuestionQueue'
import { Hearts } from '../components/Hearts'
import { HintButton } from '../components/HintButton'
import { Feedback, type FeedbackMsg } from '../components/Feedback'
import { ConfirmButton } from '../components/ConfirmButton'
import { QuestionEnd } from '../components/QuestionEnd'
import { Header } from '../components/Header'
import { TurnChip } from '../components/TurnChip'
import { useSessionScore } from '../hooks/useSessionScore'
import { formatScore, scoreFor } from '../lib/score'

interface Props {
  gameKey: string
  title: string
  questions: readonly CareerQuestion[]
  rules: GameRules
  onBack: () => void
}

type Status = 'playing' | 'won' | 'lost' | 'revealed'

/**
 * 게임 7 — 소속팀을 섞어 보여주고 '거쳐 간 순서'대로 탭한다.
 * 입력이 탭이라 한글 IME 문제가 없다(정답 판정도 제출 시점 개념이 아니라 탭 1회 = 1판정).
 */
export function OrderGame({ gameKey, title, questions, rules, onBack }: Props) {
  const { current, next, roundKey } = useQuestionQueue(gameKey, questions)
  const score = useSessionScore(gameKey)
  if (!current) {
    return (
      <>
        <Header title={title} onBack={onBack} />
        <main className="screen center">
          <p className="muted">문제가 아직 없어요.</p>
        </main>
      </>
    )
  }
  return <OrderRound key={roundKey} q={current} title={title} rules={rules} onNext={next} onBack={onBack} score={score} />
}

interface RoundProps {
  q: CareerQuestion
  title: string
  rules: GameRules
  onNext: () => void
  onBack: () => void
  score: ReturnType<typeof useSessionScore>
}

function OrderRound({ q, title, rules, onNext, onBack, score }: RoundProps) {
  const { lives, hintsLeft, loseLife, spendHint, maxLives, maxHints } = useLives(rules)
  /** 아직 안 고른 칩(원본 인덱스). 같은 팀을 두 번 거친 경우도 있어 인덱스로 다룬다 */
  const pool = useMemo(() => shuffle(q.clubs.map((_, i) => i)), [q])
  const [placed, setPlaced] = useState<number[]>([])
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>('playing')
  const [msg, setMsg] = useState<FeedbackMsg | null>(null)

  useEffect(() => {
    if (status === 'playing' && lives === 0) setStatus('lost')
  }, [lives, status])

  const earned = scoreFor(placed.length, q.clubs.length)
  const [banked, setBanked] = useState(false)
  useEffect(() => {
    if (status !== 'playing' && !banked) {
      setBanked(true)
      score.add(earned)
    }
  }, [status, banked, earned, score])

  const nextPos = placed.length

  const tap = useCallback(
    (idx: number) => {
      if (status !== 'playing' || placed.includes(idx)) return
      // 같은 이름의 팀이 여러 번 나올 수 있으니 '이름'이 맞으면 정답으로 친다
      if (q.clubs[idx] === q.clubs[nextPos]) {
        const after = [...placed, idx]
        setPlaced(after)
        setMsg({ kind: 'ok', text: `${nextPos + 1}번째 정답` })
        if (after.length === q.clubs.length) setStatus('won')
      } else {
        loseLife()
        setWrongIdx(idx)
        window.setTimeout(() => setWrongIdx(null), 400)
        setMsg({ kind: 'wrong', text: '순서가 달라요' })
      }
    },
    [status, placed, nextPos, q.clubs, loseLife],
  )

  const handleHint = () => {
    if (hintsLeft <= 0 || status !== 'playing') return
    spendHint()
    const answer = q.clubs[nextPos]
    setMsg({ kind: 'info', text: `${nextPos + 1}번째는 ${answer}` })
  }

  const ended = status !== 'playing'

  return (
    <>
      <Header title={title} onBack={onBack} right={
          <div className="header-stack">
            <Hearts lives={lives} max={maxLives} />
            <TurnChip total={score.total} />
          </div>
        } />
      <main className="screen">
        <h2 className="q-title">{q.name}</h2>
        <p className="q-subtitle">거쳐 간 순서대로 눌러 주세요</p>

        <ol className="order-slots">
          {q.clubs.map((club, pos) => {
            const done = pos < placed.length
            return (
              <li key={pos} className={`order-slot ${done ? 'open' : ''} ${ended && !done ? 'missed' : ''}`}>
                <span className="step-no">{pos + 1}</span>
                <span className="club">{done || ended ? club : '·····'}</span>
              </li>
            )
          })}
        </ol>

        {!ended && (
          <>
            <div className="chips">
              {pool.map((idx) => {
                const used = placed.includes(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`chip ${used ? 'used' : ''} ${wrongIdx === idx ? 'shake' : ''}`}
                    disabled={used}
                    onClick={() => tap(idx)}
                  >
                    {q.clubs[idx]}
                  </button>
                )
              })}
            </div>
            <Feedback msg={msg} />
            <div className="toolbar">
              <HintButton left={hintsLeft} max={maxHints} onClick={handleHint} />
              <ConfirmButton label="정답 보기" confirmLabel="정말 볼까요?" onConfirm={() => setStatus('revealed')} />
            </div>
          </>
        )}

        {ended && (
          <QuestionEnd
            status={status as 'won' | 'lost' | 'revealed'}
            summary={
              (status === 'won' ? '순서 전부 맞혔어요' : `${placed.length}/${q.clubs.length}까지 맞혔어요`) +
              ` · ${formatScore(earned)}점`
            }
            trivia={q.trivia?.trim() || undefined}
            onNext={onNext}
          />
        )}
      </main>
    </>
  )
}
