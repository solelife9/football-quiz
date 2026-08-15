interface Props {
  /** 'won' 전부 맞힘 · 'lost' 목숨 소진 · 'revealed' 정답 보기 */
  status: 'won' | 'lost' | 'revealed'
  summary?: string
  trivia?: string
  onNext: () => void
}

/** 문제 종료 패널: 결과 한 줄 + trivia + 다음 문제 */
export function QuestionEnd({ status, summary, trivia, onNext }: Props) {
  const headline = status === 'won' ? '완료!' : status === 'lost' ? '목숨을 다 썼어요' : '정답 공개'
  return (
    <section className={`question-end ${status}`}>
      <h3>{headline}</h3>
      {summary && <p className="summary">{summary}</p>}
      {trivia && <p className="trivia">{trivia}</p>}
      <button type="button" className="btn primary wide" onClick={onNext} autoFocus>
        다음 문제
      </button>
    </section>
  )
}
