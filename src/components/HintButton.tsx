interface Props {
  left: number
  max: number
  disabled?: boolean
  onClick: () => void
}

export function HintButton({ left, max, disabled, onClick }: Props) {
  if (max <= 0) return null
  return (
    <button type="button" className="btn ghost" disabled={disabled || left <= 0} onClick={onClick}>
      힌트 ({left}/{max})
    </button>
  )
}
