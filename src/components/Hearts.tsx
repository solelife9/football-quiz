interface Props {
  lives: number
  max: number
}

export function Hearts({ lives, max }: Props) {
  return (
    <div className="hearts" role="img" aria-label={`목숨 ${lives}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < lives ? 'heart on' : 'heart off'} aria-hidden>
          ♥
        </span>
      ))}
    </div>
  )
}
