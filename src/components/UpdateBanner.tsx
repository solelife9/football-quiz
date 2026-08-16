import { useAppUpdate } from '../hooks/useAppUpdate'

/** 새 버전이 배포되면 뜨는 알림. 누를 때만 새로고침한다(진행 중인 문제 보호). */
export function UpdateBanner() {
  const { ready, apply } = useAppUpdate()
  if (!ready) return null
  return (
    <div className="update-banner" role="status">
      <span>새 문제가 추가됐어요</span>
      <button type="button" className="btn primary" onClick={apply}>
        새로고침
      </button>
    </div>
  )
}
