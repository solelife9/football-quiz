import { useCallback, useEffect, useState } from 'react'
import { loadJSON, saveJSON } from '../lib/storage'

/** Chromium 계열의 beforeinstallprompt 이벤트(표준 타입 정의가 없어 직접 선언) */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallKind = 'android' | 'ios' | 'none'

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent
  const iOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /WebKit/.test(ua)
  const otherBrowser = /CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
  return iOS && webkit && !otherBrowser
}

const DISMISS_KEY = 'install:dismissed'

/**
 * "홈 화면에 추가" 안내.
 * - 안드로이드(Chromium): beforeinstallprompt 를 잡아 두고 버튼으로 prompt()
 * - iOS 사파리: 공유 메뉴 안내 문구
 * - 이미 설치(standalone)됐거나 닫은 적 있으면 표시하지 않는다
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => loadJSON<boolean>(DISMISS_KEY, false))
  const [standalone] = useState(() => isStandalone())
  const [ios] = useState(() => isIOSSafari())

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setDismissed(true)
      saveJSON(DISMISS_KEY, true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    saveJSON(DISMISS_KEY, true)
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    if (outcome === 'accepted') dismiss()
  }, [deferred, dismiss])

  let kind: InstallKind = 'none'
  if (!standalone && !dismissed) {
    if (deferred) kind = 'android'
    else if (ios) kind = 'ios'
  }

  return { kind, install, dismiss }
}
