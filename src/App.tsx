import { useHashRoute } from './hooks/useHashRoute'
import { GAME_RULES } from './config'
import { COMBO10, CLUES, LINEUPS, CAREERS, HONOURS, OXQUIZ } from './data'
import { Home, type GameCard } from './games/Home'
import { Top10Game } from './games/Top10Game'
import { LineupGame } from './games/LineupGame'
import { CareerGame } from './games/CareerGame'
import { HonoursGame } from './games/HonoursGame'
import { OrderGame } from './games/OrderGame'
import { OXGame } from './games/OXGame'

/** 이적 순서 게임은 4~6팀인 선수만 — 3팀은 너무 쉽고 7팀 이상은 칩이 화면을 넘는다 */
const ORDERABLE = CAREERS.filter((c) => c.clubs.length >= 4 && c.clubs.length <= 6)

const GAMES: GameCard[] = [
  { route: 'combo10', name: '조건 겹치기', desc: '조건에 맞는 선수·감독을 전부 맞히기', count: COMBO10.length },
  { route: 'clues', name: '단서 맞히기', desc: '구장·별명·연도를 보고 답 맞히기', count: CLUES.length },
  { route: 'lineup', name: '라인업 맞히기', desc: '등번호만 보고 선발 11명 채우기', count: LINEUPS.length },
  { route: 'career', name: '이적 경로', desc: '소속팀 이력만 보고 누구인지', count: CAREERS.length },
  { route: 'honours', name: '커리어 맞히기', desc: '우승·수상 이력만 보고 누구인지', count: HONOURS.length },
  { route: 'order', name: '이적 순서', desc: '거쳐 간 팀을 순서대로 (4~6팀)', count: ORDERABLE.length },
  { route: 'ox', name: 'O/X 퀴즈', desc: '10문제, 맞다/틀리다', count: OXQUIZ.length },
]

export default function App() {
  const [route, navigate] = useHashRoute()
  const back = () => navigate('home')

  switch (route) {
    case 'combo10':
      return (
        <Top10Game gameKey="combo10" title="조건 겹치기" questions={COMBO10} rules={GAME_RULES.combo10} onBack={back} />
      )
    case 'clues':
      return (
        <Top10Game
          gameKey="clues"
          title="단서 맞히기"
          questions={CLUES}
          rules={GAME_RULES.clues}
          onBack={back}
          placeholder="정답 입력"
        />
      )
    case 'lineup':
      return <LineupGame gameKey="lineup" title="라인업 맞히기" questions={LINEUPS} rules={GAME_RULES.lineup} onBack={back} />
    case 'career':
      return <CareerGame gameKey="career" title="이적 경로" questions={CAREERS} rules={GAME_RULES.career} onBack={back} />
    case 'honours':
      return (
        <HonoursGame gameKey="honours" title="커리어 맞히기" questions={HONOURS} rules={GAME_RULES.honours} onBack={back} />
      )
    case 'order':
      return <OrderGame gameKey="order" title="이적 순서" questions={ORDERABLE} rules={GAME_RULES.order} onBack={back} />
    case 'ox':
      return <OXGame title="O/X 퀴즈" questions={OXQUIZ} onBack={back} />
    default:
      return <Home games={GAMES} onSelect={navigate} />
  }
}
