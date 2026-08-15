# football-quiz

친구들과 모여 같이 푸는 축구 퀴즈 PWA. 백엔드 없음, 정적 JSON + localStorage.

## 구조
```
src/
  config.ts            목숨·힌트 횟수·퍼지 허용 거리·O/X 문제 수 (게임별 조정)
  types.ts             데이터 JSON 스키마(타입)
  data/
    top10.json         게임 1  TOP 10
    combo10.json       게임 2  조건 겹치기 TOP 10 (게임 1과 화면·로직 동일)
    lineups.json       게임 3  라인업 맞히기
    careers.json       게임 4  이적 경로 맞히기
    oxquiz.json        게임 5  O/X 퀴즈
  lib/
    matchAnswer.ts     정답 매칭(정규화 → 정확 일치 → Levenshtein → 모호성 반려)
    matchAnswer.test.ts
    hangul.ts          초성 유틸(라인업 3단계 힌트 · 이적 경로 힌트)
    storage.ts         localStorage 안전 래퍼 · random.ts 셔플
  games/               Top10Game(게임 1·2 공용) · LineupGame · CareerGame · OXGame · Home
  components/          Hearts · HintButton · AnswerForm(제출 시점 판정) · Feedback · ConfirmButton · QuestionEnd · InstallBanner
  hooks/               useHashRoute · useLives · useQuestionQueue · useShake · useInstallPrompt
  test/                컴포넌트 테스트(jsdom) + setup
public/                아이콘(icon.svg 원본 → png 렌더본)
.github/workflows/     main push 시 GitHub Pages 자동 배포
```

## 규칙 요약
- 목숨 5 · 힌트 3 (`config.ts` `GAME_RULES`). O/X 는 둘 다 없음.
- 정답 판정은 **폼 제출 시점에만**(안드로이드 한글 조합 대응). 오답=흔들림+비움, 이미 맞힌 답=차감 없음,
  **오타가 두 명 이상에 걸리면(모호) 차감 없이 "더 정확히" 안내**하고 입력값 유지.
- 목숨 0 또는 「정답 보기」(두 번 탭) → 못 맞힌 정답 전부 공개 + trivia + 다음 문제.
- 라인업 힌트: 한 칸을 골라 포지션 → 국적 → 성 초성 순으로 열린다(3회면 한 칸 다 열림).
- 이적 경로 힌트(스키마에 힌트 필드가 없어 이름에서 파생): 글자 수 → 첫 글자 초성 → 전체 초성.
- 같은 게임 안에서 랜덤 출제, 이미 낸 문제는 localStorage 에 기억해 한 바퀴 돌기 전엔 반복 안 함.

## PWA
- `vite-plugin-pwa` (autoUpdate). 앱 셸·번들(문제 JSON 포함)·아이콘 전부 프리캐시 → 오프라인 동작.
- 첫 방문 배너: 안드로이드 = `beforeinstallprompt` 설치 버튼, iOS 사파리 = 공유 → 홈 화면에 추가 안내. 닫으면 다시 안 뜸.
- 아이콘 원본은 `public/icon.svg`. PNG 를 다시 만들려면 SVG 를 192/512/180 으로 렌더해 같은 이름으로 덮어쓴다.

## 명령
- `npm run dev` · `npm run build` · `npm run preview`
- `npm test` — vitest · `npm run typecheck` — tsc · `npm run lint` — oxlint

## 데이터 채우기
- `src/data/*.json` 의 샘플은 **스키마 확인용**이다. `lineups.json` 의 `TODO` 항목(등번호 0)은
  자리만 잡아 둔 것 — 실제 값으로 바꿔야 한다.
- `aliases` 에는 한글 표기·영문 풀네임·성만·흔한 오표기를 전부 넣는다. `name` 자체는 자동으로 매칭 대상이라 중복해 넣지 않아도 된다.
- TOP 10 의 `value` 를 비우면(`""` 또는 생략) 순위 없이 10칸으로만 표시된다.
- 라인업 `row`: 1=GK, 2=수비, 3=미드필더, 4=공격. `col`: 그 줄에서 왼쪽부터 1, 2, …
- **채운 뒤 `npm test`** — `src/data/data.test.ts` 가 id 중복·alias 충돌(한 입력이 두 정답에 걸림)·rank 연속·row/col 중복·
  포메이션 인원·등번호 0/TODO 잔존 등을 잡아 준다. 샘플 3개는 `SAMPLE_IDS` 로 개수 규칙만 면제돼 있으니
  실제 데이터로 바꾸면 그 목록에서 지운다.

## 배포
GitHub Pages. `vite.config.ts` 의 `BASE` 와 `index.html` 의 아이콘 경로가 저장소 이름과 같아야 한다(현재 `/football-quiz/`).
저장소 Settings → Pages → Source 를 **GitHub Actions** 로 바꾸면 main push 마다 자동 배포된다.
