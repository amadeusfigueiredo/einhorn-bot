import { Header } from './game/components/Header'
import GameCanvas from './game/GameCanvas'

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <GameCanvas />
    </div>
  )
}
