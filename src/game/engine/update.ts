import type { UpdateParams } from '../types'
import { rectsOverlap, dist } from '../utils/collision'

export function updateGame(params: UpdateParams) {
  const { dt, keys, player, stage, answered, onTrigger } = params

  const left = keys['arrowleft'] || keys['a']
  const right = keys['arrowright'] || keys['d']
  const up = keys['arrowup'] || keys['w']
  const down = keys['arrowdown'] || keys['s']

  const vx = (right ? 1 : 0) - (left ? 1 : 0)
  const vy = (down ? 1 : 0) - (up ? 1 : 0)

  player.x = Math.max(
    0,
    Math.min(player.x + vx * player.speed * dt, 960 - player.w)
  )
  player.y = Math.max(
    0,
    Math.min(player.y + vy * player.speed * dt, 540 - player.h)
  )

  // Only trigger when not already answered.
  // 1) Gate contact triggers immediately
  const gates = stage.gates ?? []
  for (const g of gates) {
    if (answered.has(g.id)) continue
    const pRect = { x: player.x, y: player.y, w: player.w, h: player.h }
    if (rectsOverlap(pRect, g.area)) {
      onTrigger('gate', g.id)
      return
    }
  }

  // 2) NPC proximity -> requires E or Enter key to trigger
  const npcs = stage.npcs ?? []
  const cx = player.x + player.w / 2
  const cy = player.y + player.h / 2
  for (const n of npcs) {
    if (answered.has(n.id)) continue
    const r = n.talkRadius ?? 80
    if (dist(cx, cy, n.x, n.y) <= r) {
      // If user pressed E/Enter
      if (keys['e'] || keys['enter']) {
        // consume keys here by clearing flags (caller must write back to keysRef if needed)
        onTrigger('npc', n.id)
        return
      }
    }
  }
}
