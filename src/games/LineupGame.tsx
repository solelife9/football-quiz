import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GameRules } from '../config'
import type { LineupPlayer, LineupQuestion } from '../types'
import { matchAnswer, type Candidate } from '../lib/matchAnswer'
import { pickRandom } from '../lib/random'
import { surnameChoseong } from '../lib/hangul'
import { useLives } from '../hooks/useLives'
import { useQuestionQueue } from '../hooks/useQuestionQueue'
import { Hearts } from '../components/Hearts'
import { HintButton } from '../components/HintButton'
import { AnswerForm, type SubmitOutcome } from '../components/AnswerForm'
import { Feedback, type FeedbackMsg } from '../components/Feedback'
import { ConfirmButton } from '../components/ConfirmButton'
import { QuestionEnd } from '../components/QuestionEnd'
import { Header } from '../components/Header'
import { useSessionScore } from '../hooks/useSessionScore'
import { formatScore, scoreFor } from '../lib/score'

interface Props {
  gameKey: string
  title: string
  questions: readonly LineupQuestion[]
  rules: GameRules
  onBack: () => void
}

/** 'bonus' = 11명 완성 후 보너스 문제 진행 중 */
type Status = 'playing' | 'bonus' | 'won' | 'lost' | 'revealed'

/** 힌트 단계: 0 없음 → 1 포지션 → 2 국적 → 3 성 초성 */
type HintStage = 0 | 1 | 2 | 3
const MAX_STAGE: HintStage = 3

const ROW_LABEL: Record<LineupPlayer['row'], string> = { 1: 'GK', 2: 'DF', 3: 'MF', 4: 'FW' }

export function LineupGame({ gameKey, title, questions, rules, onBack }: Props) {
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
  return <LineupRound key={roundKey} q={current} title={title} rules={rules} onNext={next} onBack={onBack} score={score} />
}

interface RoundProps {
  q: LineupQuestion
  title: string
  rules: GameRules
  onNext: () => void
  onBack: () => void
  score: ReturnType<typeof useSessionScore>
}

function playerKey(p: LineupPlayer): string {
  return `${p.row}-${p.col}`
}

function LineupRound({ q, title, rules, onNext, onBack, score }: RoundProps) {
  const { lives, hintsLeft, loseLife, spendHint, maxLives, maxHints } = useLives(rules)
  const [found, setFound] = useState<Set<string>>(() => new Set())
  const [hintStage, setHintStage] = useState<Record<string, HintStage>>({})
  /** 현재 힌트를 진행 중인 칸. 그 칸이 맞혀지거나 3단계까지 열리면 다음 칸으로. */
  const [hintTarget, setHintTarget] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('playing')
  const [bonusSolved, setBonusSolved] = useState(false)
  const [msg, setMsg] = useState<FeedbackMsg | null>(null)

  const candidates = useMemo<Candidate[]>(
    () => q.players.map((p) => ({ id: playerKey(p), name: p.name, aliases: p.aliases })),
    [q],
  )
  const bonusCandidates = useMemo<Candidate[]>(
    () => (q.bonus ? [{ id: 'bonus', name: q.bonus.answers[0] ?? '', aliases: q.bonus.answers }] : []),
    [q],
  )

  // 줄별로 묶어서 위(공격)→아래(GK) 순서로 렌더
  const rows = useMemo(() => {
    const byRow = new Map<number, LineupPlayer[]>()
    for (const p of q.players) {
      const list = byRow.get(p.row) ?? []
      list.push(p)
      byRow.set(p.row, list)
    }
    return [4, 3, 2, 1]
      .filter((r) => byRow.has(r))
      .map((r) => ({ row: r as LineupPlayer['row'], players: byRow.get(r)!.slice().sort((a, b) => a.col - b.col) }))
  }, [q])

  useEffect(() => {
    if ((status === 'playing' || status === 'bonus') && lives === 0) setStatus('lost')
  }, [lives, status])

  const earned = scoreFor(found.size, q.players.length)
  const [banked, setBanked] = useState(false)
  useEffect(() => {
    // 보너스 문제 진행 중(bonus)은 아직 끝난 게 아니다
    if (status !== 'playing' && status !== 'bonus' && !banked) {
      setBanked(true)
      score.add(earned)
    }
  }, [status, banked, earned, score])

  const handleSubmit = useCallback(
    (raw: string): SubmitOutcome => {
      if (raw.trim() === '') return 'empty'

      if (status === 'bonus') {
        const r = matchAnswer(raw, bonusCandidates)
        if (r.kind === 'exact' || r.kind === 'fuzzy' || r.kind === 'partial') {
          setBonusSolved(true)
          setStatus('won')
          setMsg({ kind: 'ok', text: '보너스 정답!' })
          return 'correct'
        }
        loseLife()
        setMsg({ kind: 'wrong', text: '오답' })
        return 'wrong'
      }

      if (status !== 'playing') return 'empty'
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
      if (found.has(r.id)) {
        setMsg({ kind: 'dup', text: '이미 맞혔어요' })
        return 'duplicate'
      }
      const nextFound = new Set(found).add(r.id)
      setFound(nextFound)
      const p = q.players.find((x) => playerKey(x) === r.id)!
      setMsg({ kind: 'ok', text: `정답! ${p.number}번 ${p.name}` })
      if (hintTarget === r.id) setHintTarget(null)
      if (nextFound.size === q.players.length) {
        if (q.bonus && q.bonus.answers.length > 0) {
          setStatus('bonus')
          setMsg({ kind: 'info', text: '11명 완성! 보너스 문제' })
        } else {
          setStatus('won')
        }
      }
      return 'correct'
    },
    [status, candidates, bonusCandidates, found, q, hintTarget, loseLife],
  )

  /** 힌트 대상 결정: 진행 중인 칸이 아직 3단계 미만이면 그 칸, 아니면 새 칸 */
  const pickHintTarget = (): string | null => {
    if (hintTarget && !found.has(hintTarget) && (hintStage[hintTarget] ?? 0) < MAX_STAGE) return hintTarget
    const fresh = q.players.filter((p) => !found.has(playerKey(p)) && (hintStage[playerKey(p)] ?? 0) < MAX_STAGE)
    const pick = pickRandom(fresh)
    return pick ? playerKey(pick) : null
  }
  const canHint = status === 'playing' && hintsLeft > 0 && pickHintTarget() !== null

  const handleHint = () => {
    if (!canHint) return
    const key = pickHintTarget()
    if (!key) return
    const stage = Math.min(MAX_STAGE, ((hintStage[key] ?? 0) + 1) as HintStage) as HintStage
    setHintStage({ ...hintStage, [key]: stage })
    setHintTarget(key)
    spendHint()
    setMsg({ kind: 'info', text: `힌트 ${stage}단계 공개` })
  }

  const ended = status === 'won' || status === 'lost' || status === 'revealed'

  const hintText = (p: LineupPlayer): string | null => {
    const stage = hintStage[playerKey(p)] ?? 0
    if (stage === 0) return null
    const parts = [p.position]
    if (stage >= 2) parts.push(p.nationality)
    if (stage >= 3) parts.push(surnameChoseong(p.name))
    return parts.join(' · ')
  }

  return (
    <>
      <Header title={title} onBack={onBack} right={
          <div className="header-stack">
            <Hearts lives={lives} max={maxLives} />
            <span className="session-score">{formatScore(score.total)}점</span>
          </div>
        } />
      <main className="screen">
        <h2 className="q-title">{q.title}</h2>
        {q.subtitle && <p className="q-subtitle">{q.subtitle}</p>}
        <p className="formation-label">{q.formation}</p>

        <div className="pitch" aria-label={`포메이션 ${q.formation}`}>
          {rows.map(({ row, players }) => (
            <div key={row} className="pitch-row" data-row={ROW_LABEL[row]}>
              {players.map((p) => {
                const key = playerKey(p)
                const open = found.has(key)
                const missed = ended && !open
                const hint = !open && !ended ? hintText(p) : null
                return (
                  <div key={key} className={`player ${open ? 'open' : ''} ${missed ? 'missed' : ''}`}>
                    <span className="number">{p.number}</span>
                    <span className="pname">
                      {open || ended ? p.name : hint ? <span className="hint-text">{hint}</span> : ' '}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {status === 'bonus' && q.bonus && (
          <div className="bonus">
            <span className="tag">보너스</span>
            <p className="bonus-q">{q.bonus.question}</p>
          </div>
        )}

        {!ended && (
          <>
            <AnswerForm onSubmit={handleSubmit} placeholder={status === 'bonus' ? '보너스 정답' : '선수 이름'} />
            <Feedback msg={msg} />
            <div className="toolbar">
              <HintButton left={hintsLeft} max={maxHints} disabled={!canHint} onClick={handleHint} />
              <ConfirmButton label="정답 보기" confirmLabel="정말 볼까요?" onConfirm={() => setStatus('revealed')} />
            </div>
          </>
        )}

        {ended && (
          <>
            {q.bonus && q.bonus.answers.length > 0 && (
              <div className={`bonus ${bonusSolved ? 'solved' : 'missed'}`}>
                <span className="tag">보너스</span>
                <p className="bonus-q">{q.bonus.question}</p>
                <p className="bonus-a">
                  {bonusSolved ? '맞혔어요 · ' : ''}
                  {q.bonus.answers[0]}
                </p>
              </div>
            )}
            <QuestionEnd
              status={status as 'won' | 'lost' | 'revealed'}
              summary={
                status === 'won'
                  ? `선발 ${q.players.length}명 전부 맞혔어요 · ${formatScore(earned)}점`
                  : `${found.size}/${q.players.length} 맞힘 · ${formatScore(earned)}점`
              }
              trivia={q.trivia?.trim() || undefined}
              onNext={onNext}
            />
          </>
        )}
      </main>
    </>
  )
}
