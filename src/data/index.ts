import type { Top10Question, LineupQuestion, CareerQuestion, HonoursQuestion, OXQuestion } from '../types'
import top10Raw from './top10.json'
import combo10Raw from './combo10.json'
import lineupsRaw from './lineups.json'
import careersRaw from './careers.json'
import honoursRaw from './honours.json'
import oxRaw from './oxquiz.json'

// JSON 리터럴 타입(row: number 등)을 스키마 타입으로 고정
export const TOP10: Top10Question[] = top10Raw as Top10Question[]
export const COMBO10: Top10Question[] = combo10Raw as Top10Question[]
export const LINEUPS: LineupQuestion[] = lineupsRaw as LineupQuestion[]
export const CAREERS: CareerQuestion[] = careersRaw as CareerQuestion[]
export const HONOURS: HonoursQuestion[] = honoursRaw as HonoursQuestion[]
export const OXQUIZ: OXQuestion[] = oxRaw as OXQuestion[]
