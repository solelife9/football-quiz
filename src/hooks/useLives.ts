import { useCallback, useState } from 'react'
import type { GameRules } from '../config'

/** 목숨·힌트 카운터. 문제가 바뀌면 reset(). */
export function useLives(rules: GameRules) {
  const [lives, setLives] = useState(rules.lives)
  const [hintsLeft, setHintsLeft] = useState(rules.hints)

  const loseLife = useCallback(() => {
    setLives((n) => Math.max(0, n - 1))
  }, [])
  const spendHint = useCallback(() => {
    setHintsLeft((n) => Math.max(0, n - 1))
  }, [])
  const reset = useCallback(() => {
    setLives(rules.lives)
    setHintsLeft(rules.hints)
  }, [rules.lives, rules.hints])

  return { lives, hintsLeft, loseLife, spendHint, reset, maxLives: rules.lives, maxHints: rules.hints }
}
