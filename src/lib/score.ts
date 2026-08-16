/**
 * 점수 사다리 — Tenable 상금 사다리를 그대로 옮긴 것.
 *
 * 원작: 10칸 중 4개 이하 = 0원, 5개부터 £1,000, 10개 = £25,000.
 * "5개째"에서 긴장이 걸리는 게 이 게임의 핵심이라, 손익분기 개념을 그대로 둔다.
 * 순수 함수 — throw 없음.
 */

/** N개 맞혔을 때의 점수. total = 그 문제의 칸 수(10이 아닐 수도 있다) */
export function scoreFor(found: number, total: number): number {
  if (total <= 0 || found <= 0) return 0
  // 칸 수가 10이 아닌 문제(5명·15명…)도 같은 곡선을 쓰도록 10칸 기준으로 환산한다
  const scaled = Math.round((found / total) * 10)
  const LADDER = [0, 0, 0, 0, 0, 1000, 2000, 4000, 7000, 12000, 25000]
  const idx = Math.max(0, Math.min(10, scaled))
  return LADDER[idx]
}

/** 손익분기(=점수가 붙기 시작하는) 칸 수 */
export function breakEven(total: number): number {
  return Math.ceil(total * 0.5)
}

/**
 * 정답이 하나뿐인 문제(이적 경로·커리어 맞히기)의 점수.
 * 맞히면 만점에서 시작해 쓴 힌트만큼 깎는다. 못 맞히면 0.
 */
export function scoreForSingle(solved: boolean, hintsUsed: number): number {
  if (!solved) return 0
  const MAX = 25000
  const PENALTY = 6000
  return Math.max(1000, MAX - hintsUsed * PENALTY)
}

export function formatScore(n: number): string {
  return n.toLocaleString('ko-KR')
}
