import { formatScore } from '../lib/score'
import { usePlayers } from '../hooks/usePlayers'

interface Props {
  /** 이 게임에서 이번 세션에 쌓은 점수(혼자 할 때 표시) */
  total: number
}

/** 헤더 오른쪽 표시 — 여럿이면 "2번 차례", 혼자면 세션 점수 */
export function TurnChip({ total }: Props) {
  const { count, current, scores } = usePlayers()
  if (count <= 1) return <span className="session-score">{formatScore(total)}점</span>
  return (
    <span className="session-score turn">
      {current + 1}번 차례 · {formatScore(scores[current] ?? 0)}점
    </span>
  )
}
