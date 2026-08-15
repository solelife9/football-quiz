import { useCallback, useEffect, useState } from 'react'
import { loadJSON, saveJSON } from '../lib/storage'
import { pickRandom } from '../lib/random'

/**
 * 같은 게임 안에서 랜덤 출제. 이미 낸 문제는 localStorage 에 기억해
 * 전부 돌기 전까진 반복하지 않는다. 다 돌면 초기화하고 다시 랜덤.
 * (StrictMode 이중 실행에 안전하도록 '본 것 기록'은 effect 에서 한다.)
 */
export function useQuestionQueue<T extends { id: string }>(gameKey: string, questions: readonly T[]) {
  const storageKey = `seen:${gameKey}`

  const pick = useCallback(
    (excludeId?: string): T | undefined => {
      if (questions.length === 0) return undefined
      const seen = new Set(loadJSON<string[]>(storageKey, []))
      let pool = questions.filter((q) => !seen.has(q.id) && q.id !== excludeId)
      if (pool.length === 0) {
        saveJSON(storageKey, []) // 한 바퀴 다 돎 → 초기화
        pool = questions.filter((q) => q.id !== excludeId)
        if (pool.length === 0) pool = [...questions] // 문제가 1개뿐
      }
      return pickRandom(pool)
    },
    [questions, storageKey],
  )

  const [current, setCurrent] = useState<T | undefined>(() => pick())
  /** 몇 번째 출제인지. 같은 문제가 다시 나와도(문제 1개뿐) 라운드가 새로 시작되도록 key 에 쓴다. */
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!current) return
    const seen = new Set(loadJSON<string[]>(storageKey, []))
    if (!seen.has(current.id)) {
      seen.add(current.id)
      saveJSON(storageKey, [...seen])
    }
  }, [current, storageKey])

  const next = useCallback(() => {
    setCurrent((prev) => pick(prev?.id))
    setRound((n) => n + 1)
  }, [pick])

  /** 라운드 컴포넌트의 key */
  const roundKey = current ? `${current.id}#${round}` : ''

  return { current, next, roundKey, total: questions.length }
}
