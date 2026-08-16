import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GameRules } from '../config'
import type { CareerQuestion } from '../types'
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

interface Props {
  gameKey: string
  title: string
  questions: readonly CareerQuestion[]
  rules: GameRules
  onBack: () => void
}

type Status = 'playing' | 'won' | 'lost' | 'revealed'

export function CareerGame({ gameKey, title, questions, rules, onBack }: Props) {
  const { current, next, roundKey } = useQuestionQueue(gameKey, questions)
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
  return <CareerRound key={roundKey} q={current} title={title} rules={rules} onNext={next} onBack={onBack} />
}

interface RoundProps {
  q: CareerQuestion
  title: string
  rules: GameRules
  onNext: () => void
  onBack: () => void
}

/**
 * 이름 힌트 3단계(스키마에 힌트 필드가 없어 이름에서 파생):
 * 1 글자 수 → 2 첫 글자 초성 → 3 전체 초성
 */
function nameHint(name: string, stage: number): string | null {
  const compact = name.replace(/\s+/g, '')
  const chars = Array.from(compact)
  if (stage <= 0) return null
  if (stage === 1) return `이름 ${chars.length}글자`
  if (stage === 2) return `첫 글자 초성 ${toChoseong(chars[0] ?? '')}`
  return `초성 ${toChoseong(name)}`
}

function CareerRound({ q, title, rules, onNext, onBack }: RoundProps) {
  const { lives, hintsLeft, loseLife, spendHint, maxLives, maxHints } = useLives(rules)
  const [shown, setShown] = useState(1)
  const [status, setStatus] = useState<Status>('playing')
  const [msg, setMsg] = useState<FeedbackMsg | null>(null)
  const [solvedAt, setSolvedAt] = useState<number | null>(null)

  const candidates = useMemo<Candidate[]>(() => [{ id: q.id, name: q.name, aliases: q.aliases }], [q])
  const total = q.clubs.length
  const allShown = shown >= total
  const hintStage = maxHints - hintsLeft

  useEffect(() => {
    if (status === 'playing' && lives === 0) setStatus('lost')
  }, [lives, status])

  const handleSubmit = useCallback(
    (raw: string): SubmitOutcome => {
      if (status !== 'playing') return 'empty'
      if (raw.trim() === '') return 'empty'
      const r = matchAnswer(raw, candidates)
      if (r.kind === 'exact' || r.kind === 'fuzzy' || r.kind === 'partial') {
        setSolvedAt(shown)
        setStatus('won')
        setMsg({ kind: 'ok', text: `정답! ${q.name}` })
        return 'correct'
      }
      loseLife()
      setMsg({ kind: 'wrong', text: '오답' })
      return 'wrong'
    },
    [status, candidates, shown, q.name, loseLife],
  )

  const handleHint = () => {
    if (hintsLeft <= 0 || status !== 'playing') return
    spendHint()
    setMsg({ kind: 'info', text: '힌트를 열었어요' })
  }

  const ended = status !== 'playing'
  const hint = nameHint(q.name, hintStage)

  return (
    <>
      <Header title={title} onBack={onBack} right={<Hearts lives={lives} max={maxLives} />} />
      <main className="screen">
        <h2 className="q-title">이 선수는 누구?</h2>

        <ol className="career">
          {q.clubs.map((club, i) => {
            const visible = ended || i < shown
            return (
              <li key={i} className={`career-step ${visible ? 'open' : ''}`}>
                <span className="step-no">{i + 1}</span>
                <span className="club">{visible ? club : '·····'}</span>
              </li>
            )
          })}
        </ol>

        {!ended && !allShown && (
          <button type="button" className="btn ghost wide" onClick={() => setShown((n) => Math.min(total, n + 1))}>
            다음 팀 보기 ({shown}/{total})
          </button>
        )}
        {!ended && allShown && <p className="muted small">팀 이력을 전부 열었어요 ({total}/{total})</p>}

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
              <HintButton left={hintsLeft} max={maxHints} onClick={handleHint} />
              <ConfirmButton label="정답 보기" confirmLabel="정말 볼까요?" onConfirm={() => setStatus('revealed')} />
            </div>
          </>
        )}

        {ended && (
          <QuestionEnd
            status={status as 'won' | 'lost' | 'revealed'}
            summary={
              status === 'won' && solvedAt != null
                ? `팀 ${solvedAt}개 보고 맞혔어요 (${solvedAt}/${total})`
                : `팀 ${shown}개까지 열었어요 (${shown}/${total})`
            }
            trivia={q.trivia?.trim() || undefined}
            onNext={onNext}
          />
        )}
      </main>
    </>
  )
}
