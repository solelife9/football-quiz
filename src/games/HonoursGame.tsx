import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GameRules } from '../config'
import type { HonoursQuestion } from '../types'
import { matchAnswer, type Candidate } from '../lib/matchAnswer'
import { toChoseong } from '../lib/hangul'
import { useLives } from '../hooks/useLives'
import { useQuestionQueue } from '../hooks/useQuestionQueue'
import { Hearts } from '../components/Hearts'
import { HintButton } from '../components/HintButton'
import { AnswerForm, type SubmitOutcome } from '../components/AnswerForm'
import { Feedback, type FeedbackMsg } from '../components/Feedback'
import { ConfirmButton } from '../components/ConfirmButton'
import { QuestionEnd } from '../components/QuestionEnd'
import { Header } from '../components/Header'
import { TurnChip } from '../components/TurnChip'
import { useSessionScore } from '../hooks/useSessionScore'
import { formatScore, scoreForSingle } from '../lib/score'

interface Props {
  gameKey: string
  title: string
  questions: readonly HonoursQuestion[]
  rules: GameRules
  onBack: () => void
}

type Status = 'playing' | 'won' | 'lost' | 'revealed'

/** 게임 6 — 우승·수상 이력을 처음부터 전부 보여주고 누구인지 맞힌다. */
export function HonoursGame({ gameKey, title, questions, rules, onBack }: Props) {
  const { current, next, roundKey } = useQuestionQueue(gameKey, questions)
  const score = useSessionScore(gameKey)
  if (!current) {
    return (
      <>
        <Header title={title} onBack={onBack} />
        <main className="screen center">
          <p className="muted">문제가 아직 없어요. src/data 에 추가해 주세요.</p>
        </main>
      </>
    )
  }
  return <HonoursRound key={roundKey} q={current} title={title} rules={rules} onNext={next} onBack={onBack} score={score} />
}

interface RoundProps {
  q: HonoursQuestion
  title: string
  rules: GameRules
  onNext: () => void
  onBack: () => void
  score: ReturnType<typeof useSessionScore>
}

/** 힌트 3단계: 글자 수 → 첫 글자 초성 → 전체 초성 */
function nameHint(name: string, stage: number): string | null {
  const chars = Array.from(name.replace(/\s+/g, ''))
  if (stage <= 0) return null
  if (stage === 1) return `이름 ${chars.length}글자`
  if (stage === 2) return `첫 글자 초성 ${toChoseong(chars[0] ?? '')}`
  return `초성 ${toChoseong(name)}`
}

function HonoursRound({ q, title, rules, onNext, onBack, score }: RoundProps) {
  const { lives, hintsLeft, loseLife, spendHint, maxLives, maxHints } = useLives(rules)
  const [status, setStatus] = useState<Status>('playing')
  const [msg, setMsg] = useState<FeedbackMsg | null>(null)

  const candidates = useMemo<Candidate[]>(() => [{ id: q.id, name: q.name, aliases: q.aliases }], [q])
  const hintStage = maxHints - hintsLeft

  useEffect(() => {
    if (status === 'playing' && lives === 0) setStatus('lost')
  }, [lives, status])

  const earned = scoreForSingle(status === 'won', hintStage)
  const [banked, setBanked] = useState(false)
  useEffect(() => {
    if (status !== 'playing' && !banked) {
      setBanked(true)
      score.add(earned)
    }
  }, [status, banked, earned, score])

  const handleSubmit = useCallback(
    (raw: string): SubmitOutcome => {
      if (status !== 'playing') return 'empty'
      if (raw.trim() === '') return 'empty'
      const r = matchAnswer(raw, candidates)
      if (r.kind === 'exact' || r.kind === 'fuzzy' || r.kind === 'partial') {
        setStatus('won')
        setMsg({ kind: 'ok', text: `정답! ${q.name}` })
        return 'correct'
      }
      loseLife()
      setMsg({ kind: 'wrong', text: '오답' })
      return 'wrong'
    },
    [status, candidates, q.name, loseLife],
  )

  const ended = status !== 'playing'
  const hint = nameHint(q.name, hintStage)

  return (
    <>
      <Header title={title} onBack={onBack} right={
          <div className="header-stack">
            <Hearts lives={lives} max={maxLives} />
            <TurnChip total={score.total} />
          </div>
        } />
      <main className="screen">
        <h2 className="q-title">이 커리어의 주인공은?</h2>

        <ul className="honours">
          {q.honours.map((h, i) => (
            <li key={i} className="honour">
              <span className="medal" aria-hidden>
                ●
              </span>
              <span className="honour-text">{h}</span>
            </li>
          ))}
        </ul>

        {!ended && hint && <p className="name-hint">{hint}</p>}

        {ended && (
          <p className="reveal-name">
            <span className="label">정답</span> {q.name}
          </p>
        )}

        {!ended && (
          <>
            <AnswerForm onSubmit={handleSubmit} placeholder="선수 이름" />
            <Feedback msg={msg} />
            <div className="toolbar">
              <HintButton left={hintsLeft} max={maxHints} onClick={() => spendHint()} />
              <ConfirmButton label="정답 보기" confirmLabel="정말 볼까요?" onConfirm={() => setStatus('revealed')} />
            </div>
          </>
        )}

        {ended && (
          <QuestionEnd
            status={status as 'won' | 'lost' | 'revealed'}
            summary={status === 'won' ? `맞혔어요 · ${formatScore(earned)}점` : `${formatScore(earned)}점`}
            trivia={q.trivia?.trim() || undefined}
            onNext={onNext}
          />
        )}
      </main>
    </>
  )
}
