import { loadJSON, saveJSON } from './storage'

/**
 * 여러 명이 폰 하나로 번갈아 할 때의 차례·점수.
 *
 * 게임 화면이 6개라 컴포넌트 트리로 내리면 배선이 지저분해진다.
 * 그래서 아주 작은 외부 스토어로 두고 useSyncExternalStore 로 구독한다.
 * (상태관리 라이브러리는 쓰지 않는다 — 이 파일이 전부다)
 */
export interface PlayersState {
  /** 1이면 혼자 하는 모드(차례·점수판 UI 를 아예 숨긴다) */
  count: number
  /** 0-based 현재 차례 */
  current: number
  /** 사람별 누적 점수 */
  scores: number[]
}

const KEY = 'players'
const MAX = 6

function normalize(s: Partial<PlayersState> | null): PlayersState {
  const count = Math.max(1, Math.min(MAX, Math.round(s?.count ?? 1)))
  const scores = Array.from({ length: count }, (_, i) => Math.max(0, Math.round(s?.scores?.[i] ?? 0)))
  const current = Math.max(0, Math.min(count - 1, Math.round(s?.current ?? 0)))
  return { count, current, scores }
}

let state: PlayersState = normalize(loadJSON<PlayersState | null>(KEY, null))
const listeners = new Set<() => void>()

function commit(next: PlayersState) {
  state = next
  saveJSON(KEY, state)
  listeners.forEach((l) => l())
}

export function subscribe(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getSnapshot(): PlayersState {
  return state
}

export function setCount(count: number) {
  const c = Math.max(1, Math.min(MAX, Math.round(count)))
  commit(normalize({ count: c, current: 0, scores: Array.from({ length: c }, () => 0) }))
}

/** 문제 하나가 끝났을 때: 현재 차례에 점수를 주고 다음 사람으로 넘긴다 */
export function creditAndPass(points: number) {
  if (state.count <= 1) return
  const scores = [...state.scores]
  scores[state.current] = (scores[state.current] ?? 0) + Math.max(0, points)
  commit({ ...state, scores, current: (state.current + 1) % state.count })
}

export function resetScores() {
  commit({ ...state, current: 0, scores: state.scores.map(() => 0) })
}

export const MAX_PLAYERS = MAX
