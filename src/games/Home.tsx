import type { Route } from '../hooks/useHashRoute'
import { Header } from '../components/Header'
import { InstallBanner } from '../components/InstallBanner'
import { UpdateBanner } from '../components/UpdateBanner'
import { PlayerSetup } from '../components/PlayerSetup'

export interface GameCard {
  route: Exclude<Route, 'home'>
  name: string
  desc: string
  count: number
}

interface Props {
  games: GameCard[]
  onSelect: (r: Route) => void
}

export function Home({ games, onSelect }: Props) {
  return (
    <>
      <Header title="축구 퀴즈" />
      <main className="screen home">
        <UpdateBanner />
        <InstallBanner />
        <PlayerSetup />
        <ul className="game-list">
          {games.map((g) => (
            <li key={g.route}>
              <button type="button" className="game-card" onClick={() => onSelect(g.route)}>
                <span className="game-name">{g.name}</span>
                <span className="game-desc">{g.desc}</span>
                <span className="game-count">{g.count}문제</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
