import type { ReactNode } from 'react'

interface Props {
  title: string
  onBack?: () => void
  right?: ReactNode
}

export function Header({ title, onBack, right }: Props) {
  return (
    <header className="app-header">
      {onBack ? (
        <button type="button" className="back" onClick={onBack} aria-label="홈으로">
          ‹
        </button>
      ) : (
        <span className="back placeholder" />
      )}
      <h1>{title}</h1>
      <div className="header-right">{right}</div>
    </header>
  )
}
