import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GameRules } from '../config'
import type { Top10Question } from '../types'
import { matchAnswer, type Candidate } from '../lib/matchAnswer'
import { pickRandom } from '../lib/random'
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
import { ScoreLadder } from '../components/ScoreLadder'
import { useSessionScore } from '../hooks/useSessionScore'
import { formatScore, scoreFor } from '../lib/score'

interface Props {
  /** localStorage 키·문제 풀 분리용 */
  gameKey: string
  title: string
  /** 입력창 안내문 — 정답이 선수가 아닌 문제(구단·국가)도 있다 */
  placeholder?: string
  questions: readonly Top10Question[]
  rules: GameRules
  onBack: () => void
}

type Status = 'playing' | 'won' | 'lost' | 'revealed'

/** 게임 1·2 공용. 데이터만 다르다. */
export function Top10Game({ gameKey, title, questions, rules, onBack, placeholder = '선수 이름' }: Props) {
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
  return (
    <Top10Round
      key={roundKey}
      q={current}
      title={title}
      rules={rules}
      onNext={next}
      onBack={onBack}
      score={score}
      placeholder={placeholder}
    />
  )
}

interface RoundProps {
  q: Top10Question
  title: string
  rules: GameRules
  onNext: () => void
  onBack: () => void
  score: ReturnType<typeof useSessionScore>
  placeholder: string
}

/** 문제 하나 = 컴포넌트 하나(key=id). 문제 바뀌면 상태가 통째로 초기화된다. */
function Top10Round({ q, title, rules, onNext, onBack, score, placeholder }: RoundProps) {
  const { lives, hintsLeft, loseLife, spendHint, maxLives, maxHints } = useLives(rules)
  const [found, setFound] = useState<Set<number>>(() => new Set())   // 인덱스
  const [hinted, setHinted] = useState<Set<number>>(() => new Set()) // 인덱스
  const [status, setStatus] = useState<Status>('playing')
  const [msg, setMsg] = useState<FeedbackMsg | null>(null)

  const hasRanks = useMemo(() => q.answers.some((a) => a.value && a.value.trim() !== ''), [q])
  /** 단서 타워형: 모든 칸에 단서가 미리 떠 있고, 맞히면 단서가 정답으로 바뀐다 */
  const isClueTower = useMemo(() => q.answers.every((a) => (a.clue ?? '').trim() !== ''), [q])
  // 식별자는 rank 가 아니라 배열 인덱스다 — 10위 동률처럼 같은 rank 가 둘일 수 있다.
  const candidates = useMemo<Candidate[]>(
    () => q.answers.map((a, i) => ({ id: String(i), name: a.name, aliases: a.aliases })),
    [q],
  )

  useEffect(() => {
    if (status === 'playing' && lives === 0) setStatus('lost')
  }, [lives, status])

  const earned = scoreFor(found.size, q.answers.length)
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
      if (r.kind === 'none') {
        loseLife()
        setMsg({ kind: 'wrong', text: '오답' })
        return 'wrong'
      }
      if (r.kind === 'ambiguous') {
        setMsg({ kind: 'ambiguous', text: '두 명 이상에 가까워요. 조금 더 정확히 써 주세요' })
        return 'ambiguous'
      }
      const idx = Number(r.id)
      if (found.has(idx)) {
        setMsg({ kind: 'dup', text: '이미 맞혔어요' })
        return 'duplicate'
      }
      const nextFound = new Set(found).add(idx)
      setFound(nextFound)
      const a = q.answers[idx]
      setMsg({ kind: 'ok', text: hasRanks ? `정답! ${a.rank}위 ${a.name}` : `정답! ${a.name}` })
      if (nextFound.size === q.answers.length) setStatus('won')
      return 'correct'
    },
    [status, candidates, found, q, hasRanks, loseLife],
  )

  // 힌트에 쓸 내용(소속팀·국적)이 실제로 있는 칸만 대상. 빈 hint 객체는 제외한다.
  const hasHintText = (a: (typeof q.answers)[number]) => Boolean(a.hint?.club || a.hint?.nationality)
  const hintable = q.answers
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => !found.has(i) && !hinted.has(i) && hasHintText(a))
  const handleHint = () => {
    if (hintsLeft <= 0 || status !== 'playing') return
    const target = pickRandom(hintable)
    if (!target) return
    setHinted(new Set(hinted).add(target.i))
    spendHint()
    setMsg({ kind: 'info', text: '힌트를 열었어요' })
  }

  const ended = status !== 'playing'
  const missedCount = q.answers.length - found.size

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
        <h2 className="q-title">{q.title}</h2>

        <ol className={`slots ${isClueTower ? 'clued' : hasRanks ? 'ranked' : 'unranked'}`}>
          {q.answers.map((a, i) => {
            const open = found.has(i)
            const showHint = !open && hinted.has(i) && hasHintText(a)
            const missed = ended && !open
            return (
              <li key={i} className={`slot ${open ? 'open' : ''} ${missed ? 'missed' : ''}`}>
                {isClueTower ? (
                  <span className="clue">{a.clue}</span>
                ) : (
                  hasRanks && <span className="rank">{a.rank}</span>
                )}
                <span className="name">
                  {open || ended ? (
                    a.name
                  ) : showHint ? (
                    <span className="hint-text">
                      {[a.hint?.club, a.hint?.nationality].filter(Boolean).join(' · ')}
                    </span>
                  ) : (
                    <span className="blank" aria-label="미공개">
                      ·····
                    </span>
                  )}
                </span>
                {hasRanks && (open || ended) && <span className="value">{a.value}</span>}
              </li>
            )
          })}
        </ol>

        {!ended && (
          <>
            <ScoreLadder found={found.size} total={q.answers.length} />
            <AnswerForm onSubmit={handleSubmit} placeholder={placeholder} />
            <Feedback msg={msg} />
            <div className="toolbar">
              <HintButton left={hintsLeft} max={maxHints} disabled={hintable.length === 0} onClick={handleHint} />
              <ConfirmButton label="정답 보기" confirmLabel="정말 볼까요?" onConfirm={() => setStatus('revealed')} />
            </div>
          </>
        )}

        {ended && (
          <QuestionEnd
            status={status as 'won' | 'lost' | 'revealed'}
            summary={
              (status === 'won'
                ? `${q.answers.length}개 전부 맞혔어요`
                : `${found.size}/${q.answers.length} 맞힘 · 못 맞힌 ${missedCount}개는 표시해 뒀어요`) +
              ` · ${formatScore(earned)}점` +
              (score.best > 0 ? ` (최고 ${formatScore(score.best)}점)` : '')
            }
            trivia={q.trivia?.trim() || undefined}
            onNext={onNext}
          />
        )}
      </main>
    </>
  )
}
