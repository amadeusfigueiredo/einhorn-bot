// Screenshots the main game states at desktop and mobile sizes.
//   pnpm exec vite --port 5199 &
//   node scripts/shoot.mjs /abs/outDir http://localhost:5199 [prefix]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const [outDir, baseUrl = 'http://localhost:5199', prefix = ''] = process.argv.slice(2)
if (!outDir) throw new Error('usage: shoot.mjs <outDir> [url] [prefix]')
mkdirSync(outDir, { recursive: true })

const PROGRESS_KEY = 'amaras-einhorn-schule:progress:v1'
const VIEWPORTS = {
  desktop: { width: 1600, height: 1000 },
  mobile: { width: 390, height: 844 },
}

const browser = await chromium.launch()

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({
    viewport,
    hasTouch: name === 'mobile',
    isMobile: name === 'mobile',
  })
  const page = await ctx.newPage()
  const shot = (label) =>
    page.screenshot({ path: `${outDir}/${prefix}${name}-${label}.png` })

  await page.goto(baseUrl)
  await page.evaluate((k) => localStorage.removeItem(k), PROGRESS_KEY)
  await page.reload()
  await page.waitForSelector('.game-frame canvas')
  await page.waitForTimeout(500)
  await shot('1-loading-or-card')
  await page.waitForTimeout(2800)
  await shot('2-exploring')

  const stages = await page.evaluate(async () => {
    const m = await import('/src/game/constants/stages.ts')
    const c = document.querySelector('.game-frame canvas')
    const big = c.width < c.height
    const stagesNow = m.buildStages(c.width, c.height)
    return stagesNow.map((s) => s.npcs.map((n) => ({ id: n.id, x: n.x, y: n.y, c: n.question.correctIndex })))
  })

  async function clickNpc(npc) {
    const box = await page.locator('.game-frame canvas').boundingBox()
    const size = await page.evaluate(() => {
      const c = document.querySelector('.game-frame canvas')
      return { w: c.width, h: c.height }
    })
    const x = box.x + (npc.x / size.w) * box.width
    const y = box.y + (npc.y / size.h) * box.height
    if (name === 'mobile') await page.touchscreen.tap(x, y)
    else await page.mouse.click(x, y)
  }

  const [a, b] = stages[0]
  await clickNpc(a)
  await page.waitForSelector('.dialogue', { timeout: 15000 })
  await page.waitForTimeout(600)
  await shot('3-dialogue-typing')
  await page.waitForTimeout(2800)
  await shot('4-dialogue-done')
  await page.locator('.dialogue').click()
  await page.waitForSelector('.question')
  await page.waitForTimeout(500)
  await shot('5-question')
  // wrong answer
  await page.locator('.choice').nth((a.c + 1) % 4).click()
  await page.waitForSelector('.popup--wrong')
  await page.waitForTimeout(450)
  await shot('6-wrong')
  await page.waitForSelector('.popup', { state: 'detached', timeout: 8000 })
  await clickNpc(a)
  await page.waitForSelector('.dialogue', { timeout: 15000 })
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.question')
  await page.locator('.choice').nth(a.c).click()
  await page.waitForSelector('.popup--win')
  await page.waitForTimeout(500)
  await shot('7-correct')

  // Ending: restore a save one answer short on the last stage.
  await page.evaluate(
    ([k, ids]) =>
      localStorage.setItem(k, JSON.stringify({ stageIndex: 14, answeredIds: ids })),
    [PROGRESS_KEY, stages[14].slice(0, 3).map((n) => n.id)]
  )
  await page.reload()
  await page.waitForSelector('.game-frame canvas')
  await page.waitForTimeout(3200)
  await shot('8-last-stage')
  await clickNpc(stages[14][3])
  await page.waitForSelector('.dialogue', { timeout: 15000 })
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.waitForSelector('.question')
  await page.locator('.choice').nth(stages[14][3].c).click()
  await page.waitForSelector('.ending', { timeout: 15000 })
  await page.waitForTimeout(1800)
  await shot('9-ending')
  await ctx.close()
}

await browser.close()
console.log('screenshots in', outDir)
