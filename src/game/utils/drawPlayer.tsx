import type { LoaderImageAssets } from '../types'
import { roundRect } from './roundRect'
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; w: number; h: number },
  assets?: LoaderImageAssets
) {
  if (!assets?.player1) {
    // Fallback
    ctx.save()
    ctx.fillStyle = '#f0f8ff'
    roundRect(ctx, p.x, p.y, p.w, p.h, 12)
    ctx.fill()
    ctx.restore()
    return
  }

  const BORDER_RADIUS = 12 // Abgerundete Ecken für den Spieler
  const BORDER_WIDTH = 4 // Dicke des Regenbogen-Rands
  const drawX = p.x
  const drawY = p.y
  const drawW = p.w
  const drawH = p.h

  // --- SCHRITT 1: BILD ZUSCHNEIDEN (CLIP) ---
  ctx.save()

  // Definiere den Pfad für den Zuschnitt mit dem importierten roundRect
  ctx.beginPath()
  roundRect(ctx, drawX, drawY, drawW, drawH, BORDER_RADIUS)
  ctx.clip()

  // Zeichne das Bild innerhalb des zugeschnittenen Bereichs
  ctx.drawImage(assets.player1, drawX, drawY, drawW, drawH)

  ctx.restore() // Clipping-Maske entfernen

  // --- SCHRITT 2: REGENBOGEN-RAND ZEICHNEN ---
  ctx.save()

  ctx.lineWidth = BORDER_WIDTH

  // RAINBOW GRADIENT SETUP
  const gradient = ctx.createLinearGradient(drawX, 0, drawX + drawW, 0)
  gradient.addColorStop(0, '#FF00A0')
  gradient.addColorStop(0.25, '#FFD700')
  gradient.addColorStop(0.5, '#00FFFF')
  gradient.addColorStop(0.75, '#5D3FD3')
  gradient.addColorStop(1, '#FF69B4')
  ctx.strokeStyle = gradient

  // Zeichne den Randpfad mit dem importierten roundRect
  // Die Randbreite (lineWidth) wird zur Hälfte nach außen und zur Hälfte nach innen gezeichnet.
  roundRect(ctx, drawX, drawY, drawW, drawH, BORDER_RADIUS)
  ctx.stroke()

  ctx.restore()
}
