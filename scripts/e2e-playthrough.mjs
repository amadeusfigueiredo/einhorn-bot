// Drives the real game in a browser from stage 1 to the ending and writes a
// timing-independent trace, so two runs (e.g. before/after a refactor) can be
// diffed. Needs a running dev server (it imports stage data through Vite).
//
//   pnpm dev --port 5199
//   node scripts/e2e-playthrough.mjs /abs/out.json http://localhost:5199
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const [outPath, baseUrl = 'http://localhost:5199'] = process.argv.slice(2)
if (!outPath) throw new Error('usage: e2e-playthrough.mjs <out.json> [url]')

const WAIT_POPUP_GONE_MS = 6500
const trace = []

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
page.on('pageerror', (e) => trace.push({ pageerror: String(e) }))

async function readState() {
  return page.evaluate(() => {
    const frame = document.querySelector('.game-frame')
    const popupEl = frame?.querySelector('.scrim--popup')
    return {
      stage: document.querySelector('.stage-selector-current')?.textContent,
      progress: window.localStorage.getItem(
        'amaras-einhorn-schule:progress:v1'
      ),
      choices: frame?.querySelectorAll('.choice').length ?? 0,
      dialogue: Boolean(frame?.querySelector('.dialogue')),
      popup: popupEl
        ? (popupEl.querySelector('.popup__title, .ending__title')?.textContent ?? '?')
        : null,
    }
  })
}

async function snap(label, extra = {}) {
  trace.push({ label, ...extra, ...(await readState()) })
}

async function popupGone() {
  await page.waitForFunction(
    () => !document.querySelector('.game-frame .scrim--popup'),
    null,
    { timeout: WAIT_POPUP_GONE_MS }
  )
}

async function clickNpc(npc) {
  const box = await page.locator('.game-frame canvas').boundingBox()
  const size = await page.evaluate(() => {
    const c = document.querySelector('.game-frame canvas')
    return { w: c.width, h: c.height }
  })
  await page.mouse.click(
    box.x + (npc.x / size.w) * box.width,
    box.y + (npc.y / size.h) * box.height
  )
  // Greeting first (the first Enter finishes the typing, the second moves on).
  await page.waitForSelector('.game-frame .dialogue', { timeout: 15000 })
  await snap(`${npc.id}:talking`)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.game-frame .choice', { timeout: 15000 })
}

async function pick(index) {
  await page.locator('.game-frame .choice').nth(index).click()
}

await page.goto(baseUrl)
await page.evaluate(() => window.localStorage.clear())
await page.reload()
await page.waitForSelector('.game-frame canvas')
await page.waitForTimeout(1500)

const stages = await page.evaluate(async () => {
  const m = await import('/src/game/constants/stages.ts')
  return m.STAGES.map((s) => ({
    n: s.npcs.length,
    required: s.requiredToAdvance,
    npcs: s.npcs.map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y,
      correct: n.question.correctIndex,
      prompt: n.question.prompt,
    })),
  }))
})

await snap('start')

for (let si = 0; si < stages.length; si++) {
  const stage = stages[si]
  for (let ni = 0; ni < stage.npcs.length; ni++) {
    const npc = stage.npcs[ni]
    await clickNpc(npc)
    const prompt = await page
      .locator('.game-frame .question__prompt')
      .first()
      .textContent()
    await snap(`${npc.id}:asking`, { prompt })

    if (si === 0 && ni === 0) {
      // Wrong answer first: expect TRY_AGAIN and no progress.
      await pick((npc.correct + 1) % 4)
      await snap(`${npc.id}:wrong`)
      await popupGone()
      await snap(`${npc.id}:wrong-popup-gone`)
      await clickNpc(npc)
    }

    await pick(npc.correct)
    await snap(`${npc.id}:correct`)

    if (si === 2 && ni === 1) {
      // Mid-game reload must restore stage + answered NPCs.
      await popupGone()
      await page.reload()
      await page.waitForSelector('.game-frame canvas')
      await page.waitForTimeout(1500)
      await snap('after-reload')
    } else if (si === stages.length - 1 && ni === stage.npcs.length - 1) {
      // WIN popup, then GAME_END popup that needs a manual close.
      await page.waitForSelector('.game-frame .ending', { timeout: 15000 })
      await snap('game-end')
      await page.locator('.game-frame .ending .btn').click()
      await snap('after-restart')
    } else {
      await popupGone()
    }
  }
  await snap(`stage${si + 1}:done`)
}

await browser.close()
writeFileSync(outPath, JSON.stringify(trace, null, 2))
console.log(`wrote ${trace.length} trace entries to ${outPath}`)
