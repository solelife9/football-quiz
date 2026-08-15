export type FeedbackKind = 'ok' | 'wrong' | 'dup' | 'ambiguous' | 'info'

export interface FeedbackMsg {
  kind: FeedbackKind
  text: string
}

interface Props {
  msg: FeedbackMsg | null
}

/** 입력 결과 한 줄 안내. 높이를 고정해 레이아웃이 튀지 않게 한다. */
export function Feedback({ msg }: Props) {
  return (
    <p className={`feedback ${msg ? msg.kind : 'empty'}`} aria-live="polite">
      {msg?.text ?? ' '}
    </p>
  )
}
