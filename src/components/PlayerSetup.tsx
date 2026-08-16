import { MAX_PLAYERS, resetScores, setCount, usePlayers } from '../hooks/usePlayers'
import { formatScore } from '../lib/score'

/**
 * 폰 하나로 여럿이 번갈아 할 때의 인원 선택 + 점수판.
 * 이름은 받지 않는다 — 모여서 하는 자리에서 타자 치는 순간 흐름이 끊긴다.
 */
export function PlayerSetup() {
  const { count, current, scores } = usePlayers()
  const multi = count > 1
  const max = Math.max(...scores, 0)

  return (
    <section className="players">
      <div className="players-row">
        <span className="players-label">함께 하는 인원</span>
        <div className="players-pick" role="group" aria-label="인원 선택">
          {Array.from({ length: MAX_PLAYERS }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`pick ${n === count ? 'on' : ''}`}
              aria-pressed={n === count}
              onClick={() => setCount(n)}
            >
              {n === 1 ? '혼자' : `${n}명`}
            </button>
          ))}
        </div>
      </div>

      {multi && (
        <>
          <ol className="scoreboard">
            {scores.map((s, i) => (
              <li key={i} className={`sb ${i === current ? 'now' : ''} ${s === max && s > 0 ? 'top' : ''}`}>
                <span className="who">{i + 1}번</span>
                <span className="pts">{formatScore(s)}</span>
                {i === current && <span className="badge">차례</span>}
              </li>
            ))}
          </ol>
          <button type="button" className="btn ghost small-btn" onClick={resetScores}>
            점수 초기화
          </button>
        </>
      )}
    </section>
  )
}
