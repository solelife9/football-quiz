/**
 * 게임별 규칙 상수. 목숨·힌트 횟수를 여기서만 조정한다.
 * O/X 퀴즈는 목숨·힌트가 없다(UI도 렌더링하지 않음).
 */
export type GameId = 'combo10' | 'lineup' | 'career' | 'honours' | 'order' | 'ox'

export interface GameRules {
  /** 오답 허용 횟수. 0이 되면 게임 종료 + 정답 전부 공개 */
  lives: number
  /** 문제당 힌트 횟수 */
  hints: number
}

export const GAME_RULES: Record<Exclude<GameId, 'ox'>, GameRules> = {
  combo10: { lives: 5, hints: 3 },
  lineup: { lives: 5, hints: 3 },
  career: { lives: 5, hints: 3 },
  honours: { lives: 5, hints: 3 },
  order: { lives: 5, hints: 3 },
}

/** O/X 퀴즈 한 세션 문제 수 */
export const OX_QUESTIONS_PER_SESSION = 10

/**
 * 퍼지 매칭 허용 편집 거리. 정규화 후 문자열 길이 기준.
 * 길이 <= SHORT_MAX_LEN → SHORT_DISTANCE, 그 이상 → LONG_DISTANCE
 */
export const FUZZY = {
  SHORT_MAX_LEN: 5,
  SHORT_DISTANCE: 1,
  LONG_DISTANCE: 2,
} as const

/** localStorage 키 접두사 */
export const STORAGE_PREFIX = 'football-quiz:'
