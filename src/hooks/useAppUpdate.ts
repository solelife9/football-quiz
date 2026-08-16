import { useCallback, useEffect, useState } from 'react'

/**
 * 새 버전이 배포됐는지 감지한다.
 *
 * 서비스워커는 skipWaiting/clientsClaim 이라 새 버전이 즉시 활성화되지만,
 * 이미 그려진 화면은 옛 파일 그대로다 → 다음 실행에야 반영된다.
 * 그래서 감지되면 배너를 띄우고 사용자가 누를 때 새로고침한다.
 * (게임 도중 자동 새로고침하면 풀던 문제가 날아간다)
 */
export function useAppUpdate() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let cancelled = false

    const watch = (reg: ServiceWorkerRegistration) => {
      // 이미 대기 중인 새 버전이 있는 경우
      if (reg.waiting && navigator.serviceWorker.controller) setReady(true)
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        if (!sw) return
        sw.addEventListener('statechange', () => {
          // 첫 설치(controller 없음)는 업데이트가 아니라 최초 설치다
          if (sw.state === 'installed' && navigator.serviceWorker.controller && !cancelled) setReady(true)
        })
      })
      // 앱으로 돌아올 때마다 새 버전 확인
      const onVisible = () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {})
      }
      document.addEventListener('visibilitychange', onVisible)
      return () => document.removeEventListener('visibilitychange', onVisible)
    }

    let off: (() => void) | undefined
    navigator.serviceWorker.ready.then((reg) => {
      if (!cancelled) off = watch(reg)
    })
    return () => {
      cancelled = true
      off?.()
    }
  }, [])

  const apply = useCallback(() => {
    window.location.reload()
  }, [])

  return { ready, apply }
}
