import { useCallback, useState } from 'react'
import { loadJSON, saveJSON } from '../lib/storage'
import { creditAndPass } from '../lib/players'

/** 이번 세션(앱을 켜 둔 동안) 누적 점수 + 최고 기록. 게임별로 따로 센다. */
export function useSessionScore(gameKey: string) {
  const bestKey = `best:${gameKey}`
  const [total, setTotal] = useState(0)
  const [solved, setSolved] = useState(0)
  const [best, setBest] = useState(() => loadJSON<number>(bestKey, 0))

  const add = useCallback(
    (points: number) => {
      // 여럿이 할 때는 현재 차례에 점수를 주고 다음 사람으로 넘긴다(혼자면 아무 일도 안 함)
      creditAndPass(points)
      setTotal((t) => {
        const next = t + points
        setBest((b) => {
          if (next > b) {
            saveJSON(bestKey, next)
            return next
          }
          return b
        })
        return next
      })
      setSolved((n) => n + 1)
    },
    [bestKey],
  )

  return { total, best, solved, add }
}
