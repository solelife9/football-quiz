import { useHashRoute } from './hooks/useHashRoute'
import { GAME_RULES } from './config'
import { TOP10, COMBO10, LINEUPS, CAREERS, HONOURS, OXQUIZ } from './data'
import { Home, type GameCard } from './games/Home'
import { Top10Game } from './games/Top10Game'
import { LineupGame } from './games/LineupGame'
import { CareerGame } from './games/CareerGame'
import { HonoursGame } from './games/HonoursGame'
import { OXGame } from './games/OXGame'

const GAMES: GameCard[] = [
  { route: 'top10', name: 'TOP 10', desc: '주제 하나, 정답 10개. 순서 상관없이 맞히기', count: TOP10.length },
  { route: 'combo10', name: '전원 맞히기', desc: '조건에 맞는 선수·감독을 전부 (인원은 제목에)', count: COMBO10.length },
  { route: 'lineup', name: '라인업 맞히기', desc: '등번호만 보고 선발 11명 채우기', count: LINEUPS.length },
  { route: 'career', name: '이적 경로', desc: '소속팀 이력만 보고 누구인지', count: CAREERS.length },
  { route: 'honours', name: '커리어 맞히기', desc: '우승·수상 이력만 보고 누구인지', count: HONOURS.length },
  { route: 'ox', name: 'O/X 퀴즈', desc: '10문제, 맞다/틀리다', count: OXQUIZ.length },
]

export default function App() {
  const [route, navigate] = useHashRoute()
  const back = () => navigate('home')

  switch (route) {
    case 'top10':
      return <Top10Game gameKey="top10" title="TOP 10" questions={TOP10} rules={GAME_RULES.top10} onBack={back} />
    case 'combo10':
      return (
        <Top10Game gameKey="combo10" title="전원 맞히기" questions={COMBO10} rules={GAME_RULES.combo10} onBack={back} />
      )
    case 'lineup':
      return <LineupGame gameKey="lineup" title="라인업 맞히기" questions={LINEUPS} rules={GAME_RULES.lineup} onBack={back} />
    case 'career':
      return <CareerGame gameKey="career" title="이적 경로" questions={CAREERS} rules={GAME_RULES.career} onBack={back} />
    case 'honours':
      return (
        <HonoursGame gameKey="honours" title="커리어 맞히기" questions={HONOURS} rules={GAME_RULES.honours} onBack={back} />
      )
    case 'ox':
      return <OXGame title="O/X 퀴즈" questions={OXQUIZ} onBack={back} />
    default:
      return <Home games={GAMES} onSelect={navigate} />
  }
}
