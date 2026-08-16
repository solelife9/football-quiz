import { useCallback, useState } from 'react'
import { loadJSON, saveJSON } from '../lib/storage'

/** 이번 세션(앱을 켜 둔 동안) 누적 점수 + 최고 기록. 게임별로 따로 센다. */
export function useSessionScore(gameKey: string) {
  const bestKey = `best:${gameKey}`
  const [total, setTotal] = useState(0)
  const [solved, setSolved] = useState(0)
  const [best, setBest] = useState(() => loadJSON<number>(bestKey, 0))

  const add = useCallback(
    (points: number) => {
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
