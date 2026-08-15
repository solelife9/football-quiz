/** 한글 초성 유틸 — 라인업 3단계 힌트("성 초성")용. 순수 함수. */

const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const

const HANGUL_START = 0xac00
const HANGUL_END = 0xd7a3

export function isHangulSyllable(ch: string): boolean {
  const code = ch.codePointAt(0)
  return code !== undefined && code >= HANGUL_START && code <= HANGUL_END
}

/** 문자열의 각 글자를 초성으로. 한글 음절이 아니면 그대로 둔다. */
export function toChoseong(s: string): string {
  return Array.from(s)
    .map((ch) => {
      if (!isHangulSyllable(ch)) return ch
      const idx = Math.floor((ch.codePointAt(0)! - HANGUL_START) / 588)
      return CHOSEONG[idx]
    })
    .join('')
}

/**
 * "성"에 해당하는 부분을 고른다.
 * - 공백으로 나뉘면 마지막 토큰("판 데르 사르" → "사르", "모하메드 살라" → "살라")
 * - 공백 없고 한글 3자 이하면 한국식 성명으로 보고 첫 글자("손흥민" → "손")
 * - 그 외(외국인 단일 표기 "네이마르" 등)는 전체
 */
export function surnameOf(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return ''
  if (tokens.length >= 2) return tokens[tokens.length - 1]
  const only = tokens[0]
  const chars = Array.from(only)
  if (chars.length <= 3 && chars.every(isHangulSyllable)) return chars[0]
  return only
}

/** 라인업 3단계 힌트 텍스트: 성 초성 */
export function surnameChoseong(name: string): string {
  return toChoseong(surnameOf(name))
}
