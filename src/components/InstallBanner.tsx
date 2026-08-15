import { useInstallPrompt } from '../hooks/useInstallPrompt'

/** iOS 공유 아이콘(상자 + 위 화살표) — 텍스트/도형만 */
function ShareIcon() {
  return (
    <svg className="share-glyph" width="16" height="18" viewBox="0 0 16 18" aria-label="공유" role="img">
      <path d="M8 1.5v10M4.5 5 8 1.5 11.5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7.5H1.5v9h13v-9H13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function InstallBanner() {
  const { kind, install, dismiss } = useInstallPrompt()
  if (kind === 'none') return null

  return (
    <div className="install-banner" role="dialog" aria-label="홈 화면에 추가">
      <div className="install-text">
        <strong>홈 화면에 추가</strong>
        {kind === 'ios' ? (
          <span>
            사파리 하단 <ShareIcon /> 공유 버튼 → <b>홈 화면에 추가</b>
          </span>
        ) : (
          <span>앱처럼 설치하면 오프라인에서도 열려요</span>
        )}
      </div>
      <div className="install-actions">
        {kind === 'android' && (
          <button type="button" className="btn primary" onClick={install}>
            설치
          </button>
        )}
        <button type="button" className="btn ghost" onClick={dismiss} aria-label="닫기">
          닫기
        </button>
      </div>
    </div>
  )
}
