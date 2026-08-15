import { STORAGE_PREFIX } from '../config'

/** localStorage 안전 래퍼. 사파리 프라이빗 모드 등 예외 시 조용히 폴백. */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    /* 저장 실패는 게임 진행에 영향 없음 */
  }
}
