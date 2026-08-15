import { useEffect, useRef, useState } from 'react'

interface Props {
  label: string
  confirmLabel: string
  onConfirm: () => void
  className?: string
}

/** 두 번 눌러야 실행되는 버튼(정답 보기 오터치 방지). 첫 탭 후 3초 지나면 원래대로. */
export function ConfirmButton({ label, confirmLabel, onConfirm, className }: Props) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const handle = () => {
    if (armed) {
      window.clearTimeout(timer.current)
      setArmed(false)
      onConfirm()
      return
    }
    setArmed(true)
    timer.current = window.setTimeout(() => setArmed(false), 3000)
  }

  return (
    <button type="button" className={`btn ghost ${armed ? 'armed' : ''} ${className ?? ''}`} onClick={handle}>
      {armed ? confirmLabel : label}
    </button>
  )
}
