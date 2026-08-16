import { useMemo, useState } from 'react'
import { OX_QUESTIONS_PER_SESSION } from '../config'
import type { OXQuestion } from '../types'
import { shuffle } from '../lib/random'
import { loadJSON, saveJSON } from '../lib/storage'
import { Header } from '../components/Header'
import { TurnChip } from '../components/TurnChip'
import { useSessionScore } from '../hooks/useSessionScore'
import { formatScore, scoreFor } from '../lib/score'

interface Props {
  title: string
  questions: readonly OXQuestion[]
  onBack: () => void
}

/**
 * O/X — 목숨·힌트 없음. 틀려도 계속. 한 세션 = 최대 10문제(풀이 적으면 전부).
 * 세션은 컴포넌트 key 로 재시작한다.
 */
export function OXGame({ title, questions, onBack }: Props) {
  const [sessionNo, setSessionNo] = useState(0)
  if (questions.length === 0) {
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
    <OXSession
      key={sessionNo}
      title={title}
      questions={questions}
      onBack={onBack}
      onRestart={() => setSessionNo((n) => n + 1)}
    />
  )
}

interface SessionProps extends Props {
  onRestart: () => void
}

function OXSession({ title, questions, onBack, onRestart }: SessionProps) {
  const sessionScore = useSessionScore('ox')
  const session = useMemo(() => shuffle(questions).slice(0, OX_QUESTIONS_PER_SESSION), [questions])
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [best, setBest] = useState(() => loadJSON<number>('ox:best', 0))

  const total = session.length
  const q = session[index]

  const answer = (v: boolean) => {
    if (choice !== null) return
    setChoice(v)
    if (v === q.answer) setScore((s) => s + 1)
  }

  const next = () => {
    if (index + 1 >= total) {
      setDone(true)
      // 10문제 세션을 하나의 '문제'로 보고 같은 사다리를 적용한다 —
      // 절반(5문제)을 넘겨야 점수가 붙는다
      sessionScore.add(scoreFor(score, total))
      if (score > best) {
        setBest(score)
        saveJSON('ox:best', score)
      }
      return
    }
    setIndex((i) => i + 1)
    setChoice(null)
  }

  if (done) {
    return (
      <>
        <Header title={title} onBack={onBack} />
        <main className="screen center">
          <section className="ox-result">
            <p className="label">최종 점수</p>
            <p className="score">
              {score}
              <span className="of">/{total}</span>
            </p>
            <p className="ox-points">{formatScore(scoreFor(score, total))}점</p>
            {best > 0 && <p className="muted small">최고 {best}/{OX_QUESTIONS_PER_SESSION}</p>}
            <button type="button" className="btn primary wide" onClick={onRestart} autoFocus>
              다시 하기
            </button>
          </section>
        </main>
      </>
    )
  }

  const answered = choice !== null
  const correct = answered && choice === q.answer

  return (
    <>
      <Header
        title={title}
        onBack={onBack}
        right={
          <div className="header-stack">
            <span className="progress">{index + 1}/{total}</span>
            <TurnChip total={sessionScore.total} />
          </div>
        }
      />
      <main className="screen">
        <div className="progress-bar" aria-hidden>
          <span style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }} />
        </div>

        <p className="ox-statement">{q.statement}</p>

        <div className="ox-buttons">
          <button
            type="button"
            className={`ox o ${answered ? (q.answer ? 'is-answer' : choice ? 'chosen-wrong' : '') : ''}`}
            onClick={() => answer(true)}
            disabled={answered}
            aria-label="O, 맞다"
          >
            O
          </button>
          <button
            type="button"
            className={`ox x ${answered ? (!q.answer ? 'is-answer' : choice === false ? 'chosen-wrong' : '') : ''}`}
            onClick={() => answer(false)}
            disabled={answered}
            aria-label="X, 틀리다"
          >
            X
          </button>
        </div>

        {answered && (
          <section className={`ox-reveal ${correct ? 'correct' : 'wrong'}`}>
            <p className="verdict">
              {correct ? '정답!' : '오답'} · 정답은 <strong>{q.answer ? 'O' : 'X'}</strong>
            </p>
            <p className="explanation">{q.explanation}</p>
            <button type="button" className="btn primary wide" onClick={next} autoFocus>
              {index + 1 >= total ? '결과 보기' : '다음'}
            </button>
          </section>
        )}
      </main>
    </>
  )
}
