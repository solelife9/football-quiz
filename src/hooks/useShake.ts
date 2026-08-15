import { useCallback, useEffect, useRef, useState } from 'react'

const SHAKE_MS = 400 // index.css 의 @keyframes shake 길이와 맞춘다

/**
 * 오답 시 입력창 흔들기. 클래스 토글 → 일정 시간 뒤 해제.
 * animationend 에 기대지 않는다(prefers-reduced-motion 등으로 애니메이션이 없으면 이벤트도 없다).
 */
export function useShake() {
  const [shaking, setShaking] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const shake = useCallback(() => {
    window.clearTimeout(timer.current)
    setShaking(false)
    // 연속 오답에도 다시 재생되도록 다음 프레임에 켠다
    requestAnimationFrame(() => {
      setShaking(true)
      timer.current = window.setTimeout(() => setShaking(false), SHAKE_MS)
    })
  }, [])

  return { shaking, shake }
}
