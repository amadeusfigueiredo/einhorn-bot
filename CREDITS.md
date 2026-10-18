# Credits

## Sound
- **Sound effects** (select, typing tick, correct, wrong, stage change,
  ending fanfare) are synthesised at runtime with the Web Audio API in
  `src/game/audio/sfx.ts`. No audio files, nothing to license.
- **Music** (`public/assets/stage1.m4a`, `stage2.m4a`, `stage11.mp4`,
  `stage12.mp4`): supplied with the project before this work started.
  **Source and licence are not recorded anywhere in the repo. TODO: the
  project owner should confirm where these tracks come from** (and that they
  may be used) or replace them with royalty-free music, e.g. from
  <https://freepd.com> (CC0) or <https://incompetech.com> (CC BY, credit
  required). Nothing was added or replaced in this phase.

## Images
All paintings and portraits in `public/assets` (backgrounds, NPC portraits,
player, popup stickers) were supplied with the project. As with the music,
their origin is not recorded. Four files are named
`Screenshot … unicornio - Google Suche.png`, which means they are screenshots
of web search results, **so their licence is probably not clear for anything
beyond private use. TODO: confirm or replace before publishing the game.**

## Fonts (loaded from Google Fonts, SIL Open Font License 1.1)
- **Fredoka**: Milena Brandão, Hafontia
- **Andika**: SIL International

## Libraries
React, Vite, Vitest, Zustand, Motion (`framer-motion`): MIT. Playwright
(dev only, for the playthrough and screenshot scripts): Apache-2.0.
