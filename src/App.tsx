import React from 'react'
import GameCanvas from './game/GameCanvas'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#17171a', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', paddingTop: 16 }}>
        🦄 Amaras Einhorn Schule
      </h1>
      <p style={{ textAlign: 'center', opacity: 0.75, marginTop: -6 }}>
        Move with WASD/Arrows. Press <b>E</b> near a unicorn to talk. Enter
        gates to answer.
      </p>
      <GameCanvas />
    </div>
  )
}
