/** src/data/*.json 스키마. 데이터 파일과 1:1로 대응한다. */

export interface AnswerHint {
  club?: string
  nationality?: string
}

export interface Top10Answer {
  rank: number
  name: string
  /** 비어 있으면("" 또는 생략) 순위 없이 10칸으로만 표시 */
  value?: string
  hint?: AnswerHint
  aliases?: string[]
}

export interface Top10Question {
  id: string
  title: string
  trivia?: string
  answers: Top10Answer[]
}

export interface LineupPlayer {
  number: number
  /** 1=GK, 2=수비, 3=미드필더, 4=공격 (아래에서 위로) */
  row: 1 | 2 | 3 | 4
  /** 해당 줄에서 왼쪽부터 1, 2, 3... */
  col: number
  name: string
  position: string
  nationality: string
  aliases?: string[]
}

export interface LineupBonus {
  question: string
  answers: string[]
}

export interface LineupQuestion {
  id: string
  title: string
  subtitle?: string
  formation: string
  trivia?: string
  bonus?: LineupBonus
  players: LineupPlayer[]
}

export interface CareerQuestion {
  id: string
  name: string
  /** 소속팀 이력, 시간순 */
  clubs: string[]
  trivia?: string
  aliases?: string[]
}

export interface OXQuestion {
  id: string
  statement: string
  answer: boolean
  /** 정답 여부와 무관하게 항상 표시 */
  explanation: string
}
