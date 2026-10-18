// Rough runtime cost of the game loop: frame intervals and long tasks while
// the player walks around, with the CPU throttled 4x to magnify differences.
//   node scripts/perf.mjs http://localhost:5199 [seconds]
import { chromium } from 'playwright'

const [baseUrl = 'http://localhost:5199', seconds = '8'] = process.argv.slice(2)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const cdp = await page.context().newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

await page.goto(baseUrl)
await page.evaluate(() => localStorage.clear())
await page.reload()
await page.waitForSelector('.game-frame canvas')
await page.waitForTimeout(3500) // loading + stage card

await page.evaluate(() => {
  window.__frames = []
  window.__long = []
  let last = performance.now()
  const tick = (now) => {
    window.__frames.push(now - last)
    last = now
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__long.push(e.duration)
  }).observe({ entryTypes: ['longtask'] })
})

// Walk back and forth with the keyboard.
const end = Date.now() + Number(seconds) * 1000
let dir = 'ArrowRight'
while (Date.now() < end) {
  await page.keyboard.down(dir)
  await page.waitForTimeout(900)
  await page.keyboard.up(dir)
  dir = dir === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight'
}

const { frames, long } = await page.evaluate(() => ({
  frames: window.__frames.slice(5),
  long: window.__long,
}))
frames.sort((a, b) => a - b)
const avg = frames.reduce((a, b) => a + b, 0) / frames.length
const p = (q) => frames[Math.min(frames.length - 1, Math.floor(frames.length * q))]
console.log(
  JSON.stringify(
    {
      frames: frames.length,
      avgFrameMs: +avg.toFixed(2),
      p95FrameMs: +p(0.95).toFixed(2),
      p99FrameMs: +p(0.99).toFixed(2),
      longTasks: long.length,
      longTaskTotalMs: +long.reduce((a, b) => a + b, 0).toFixed(0),
    },
    null,
    2
  )
)
await browser.close()
