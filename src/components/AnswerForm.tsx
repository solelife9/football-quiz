import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useShake } from '../hooks/useShake'

export type SubmitOutcome = 'correct' | 'wrong' | 'duplicate' | 'ambiguous' | 'empty'

interface Props {
  /** 제출 시점에만 호출된다(입력 중 판정 금지). 결과에 따라 입력창 처리. */
  onSubmit: (value: string) => SubmitOutcome
  placeholder?: string
  disabled?: boolean
  buttonLabel?: string
}

/**
 * 정답 입력창. 판정은 오직 폼 제출(Enter/버튼)에서만.
 * 안드로이드 한글 조합 중 onChange 는 자모 단위로 오므로 onChange 에선 값만 저장한다.
 * IME 조합 중 Enter(keyCode 229 / isComposing)는 제출로 치지 않는다.
 */
export function AnswerForm({ onSubmit, placeholder = '이름 입력', disabled, buttonLabel = '확인' }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { shaking, shake } = useShake()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (disabled) return
    const outcome = onSubmit(value)
    if (outcome === 'wrong') {
      shake()
      setValue('')
    } else if (outcome === 'correct' || outcome === 'duplicate') {
      setValue('')
    }
    // ambiguous / empty: 값 유지 — 사용자가 고쳐 쓰게
    inputRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
      e.preventDefault()
    }
  }

  return (
    <form className="answer-form" onSubmit={submit} autoComplete="off">
      <input
        ref={inputRef}
        className={`answer-input ${shaking ? 'shake' : ''}`}
        type="text"
        inputMode="text"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label={placeholder}
      />
      <button type="submit" className="btn primary" disabled={disabled}>
        {buttonLabel}
      </button>
    </form>
  )
}
