import { breakEven, formatScore, scoreFor } from '../lib/score'

interface Props {
  found: number
  total: number
}

/**
 * 진행 중인 문제의 점수 상태.
 * Tenable 상금 사다리를 그대로 옮겼다 — 절반을 넘겨야 점수가 붙기 시작하고,
 * 마지막 한 칸에서 점수가 크게 뛴다. 그 긴장이 이 게임의 핵심이다.
 */
export function ScoreLadder({ found, total }: Props) {
  const need = breakEven(total)
  const now = scoreFor(found, total)
  const reached = found >= need
  const perfect = found === total

  return (
    <div className={`ladder ${reached ? 'reached' : ''} ${perfect ? 'perfect' : ''}`}>
      <div className="ladder-bar" aria-hidden>
        <span className="fill" style={{ width: `${Math.min(100, (found / total) * 100)}%` }} />
        <span className="mark" style={{ left: `${(need / total) * 100}%` }} />
      </div>
      <p className="ladder-text">
        {reached ? (
          <>
            <strong>{formatScore(now)}점</strong>
            <span className="muted small"> · {found}/{total}</span>
          </>
        ) : (
          <span className="muted small">
            {need}개부터 점수 · 앞으로 {need - found}개
          </span>
        )}
      </p>
    </div>
  )
}
