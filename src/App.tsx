import { Header } from './game/components/Header'
import GameCanvas from './game/GameCanvas'

export default function App() {
  return (
    <body
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        background: '#17171a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Header />
      <GameCanvas />
    </body>
  )
}
