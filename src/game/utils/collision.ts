export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}
export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  )
}

export function dist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx,
    dy = ay - by
  return Math.hypot(dx, dy)
}
