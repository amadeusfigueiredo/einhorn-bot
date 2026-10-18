# Design

**Subject:** a quiz adventure for a six-year-old who is just learning to read
and loves unicorns. She walks through painted dreamscapes (a rose forest, a
night sky with a rearing unicorn and a rainbow), meets unicorn teachers, and
answers German school questions. A parent is usually sitting next to her.

**Primary job of the UI:** stay out of the way of the paintings, make text
effortless to read for an early reader, and make every right answer feel like
a small celebration.

## What the artwork already tells us
The backgrounds are lush, painterly and mostly *dark* (deep forest green,
space black) with pastel light in them; the NPC portraits are illustrated
unicorns; the win/try-again popups are flat, bright cartoon stickers. Any UI
that is itself bright pink-on-white (the current look) fights the paintings
and looks pasted on.

## Three art directions

### A. Papier-Märchen (cut-paper storybook)
- *Mood:* handmade, tactile, cosy; a picture book you can touch.
- *Palette:* paper `#F7EEDD`, ink plum `#3B2347`, blush `#F4A6B8`, sage
  `#9CC5A1`, honey `#F2C14E`.
- *Type:* a chunky slab-ish display face plus a humanist sans.
- *Characters:* flat cut-paper silhouettes with a drop shadow.
- *Animation:* stop-motion steps (12 fps), paper flips, things "pop" onto
  the page.
- *Risk:* the existing painterly art and glossy cartoon popups would clash
  with a paper-craft frame; we would need to re-draw every asset.

### B. Dämmerlicht (twilight glass) — chosen
- *Mood:* dreamy, quiet, magical; the hush just after sunset when stars start
  to appear.
- *Palette:* night plum `#1B1033`, dusk violet `#3A2272`, moonlight
  `#FFF4E1`, rose glow `#FF7EC7`, mint glow `#7BE0D6`, star gold `#FFD166`.
- *Type:* **Fredoka** (rounded, friendly, big and bold) for titles and
  buttons; **Andika** (designed by SIL for early readers: single-storey `a`
  and `g`, distinct `I`/`l`/`1`) for questions and dialogue.
- *Characters:* the painted portraits stay the stars; UI frames them with
  soft moonlight glow instead of hard borders.
- *Animation:* slow, eased, floating. Things drift in and settle like
  lanterns; stars twinkle; correct answers release a burst of sparkles that
  rise (not fall).
- *Why it fits:* the paintings are already dusk-lit, so translucent
  "frosted night glass" panels with warm moonlight text sit *inside* the
  world instead of on top of it. Light is the only decoration: glows and
  sparkles replace borders and drop shadows.

### C. Klassenzimmer-Sticker (classroom + sticker book)
- *Mood:* playful, loud, rewarding; stickers on a chalkboard.
- *Palette:* chalk green `#2E4A3E`, chalk white `#F5F5F0`, sticker pink
  `#FF5FA2`, sticker yellow `#FFE14D`, sky `#58C4FF`.
- *Type:* a hand-drawn chalk face for titles, rounded sans for body.
- *Characters:* sticker outlines (thick white stroke) around every sprite.
- *Animation:* snappy slaps and wiggles.
- *Risk:* literal "school" is the one thing she's trying to escape on a
  dreamy unicorn adventure; chalkboard green also fights the forest and
  space backgrounds.

## Decision
**B, Dämmerlicht.** It is the only direction that respects the existing
assets instead of asking for a redraw, it makes the already-dark paintings the
hero, and a night-glass UI has naturally high contrast for the large light
text an early reader needs. The memorable element is the **light**: the NPC
you can talk to glows, answers release rising sparkles, stage changes are a
soft lantern-lit title card.

## Plan review (what changed after a second look)
- First draft used a pink-to-violet gradient on every panel. That is the
  current look and the generic "unicorn" default, so panels are now flat
  translucent night glass, and colour is reserved for *meaning*: rose = your
  action, mint = right, gold = reward, a warm lilac shake = "not quite".
- First draft had all-caps question text (it exists today). All caps is
  harder for early readers; questions are now sentence case in Andika at 1.4rem+.
- First draft decorated every panel with a rainbow border. Only the
  *question card* gets a thin aurora edge because it is the most important
  surface; everything else is borderless.

## Tokens
All tokens live in `src/styles/tokens.css` (CSS custom properties). Canvas
drawing reads the same variables through `src/styles/canvasTheme.ts`, so
there is exactly one place to change a colour.

### Colour
| Token | Value | Use |
| --- | --- | --- |
| `--night-950` | `#1B1033` | page background, deepest panel |
| `--night-800` | `#2A1A52` | panels (at 78 % opacity over blur) |
| `--dusk-600` | `#4B2F8F` | raised controls, choice rows |
| `--dusk-400` | `#8E6BE0` | focus ring base, secondary glow |
| `--moon-50` | `#FFF4E1` | primary text on night |
| `--moon-300` | `#E4D3F2` | secondary text |
| `--rose-400` | `#FF7EC7` | primary action, hover |
| `--mint-400` | `#7BE0D6` | correct, progress |
| `--gold-400` | `#FFD166` | reward, stars, selected NPC |
| `--lilac-300` | `#C9A7FF` | wrong-answer hint, soft glow |

Contrast (checked in `NOTES.md`): `moon-50` on `night-800` is above 12:1;
`night-950` on `rose-400` (button label) is above 7:1.

### Type
| Token | Value |
| --- | --- |
| `--font-display` | Fredoka, system rounded fallback |
| `--font-body` | Andika, system sans fallback |
| `--fs-sm` / `--fs-md` / `--fs-lg` / `--fs-xl` / `--fs-2xl` | 1rem / 1.25rem / 1.5rem / 2rem / 3rem (fluid with `clamp`) |
| line-height | 1.5 body, 1.15 display |
| line length | questions capped at 32ch |

### Spacing, radii, shadows
- Spacing: 4 px base, `--space-1` … `--space-8` (4, 8, 12, 16, 24, 32, 48, 64).
- Radii: `--radius-sm` 10 px (inputs), `--radius-md` 18 px (choices), `--radius-lg` 28 px
  (cards), `--radius-pill` for buttons and the HUD chip.
- Shadows are *glows*, never grey: `--glow-rose`, `--glow-mint`,
  `--glow-gold`, `--glow-panel` (a violet halo with a 1 px inner highlight).

### Motion
- Easings: `--ease-settle` `cubic-bezier(.22, 1, .36, 1)` (things arrive and
  settle), `--ease-float` `cubic-bezier(.45, 0, .55, 1)` (idle loops).
- Durations: `--dur-quick` 140 ms (hover/press), `--dur-base` 280 ms
  (panels), `--dur-slow` 700 ms (stage card, ending).
- Reduced motion: all non-essential motion is removed (`prefers-reduced-motion`
  *and* Motion's `reducedMotion="user"`); state changes become instant fades.

## Animation principles
1. **Light moves, objects settle.** Glows pulse slowly; panels arrive with a
   small upward drift and stop, no bouncing.
2. **Reward upward, correction sideways.** Right answers throw sparkles up and
   the HUD star fills; a wrong answer shakes the card horizontally ~6 px and
   tints the chosen choice lilac. Nothing red, nothing scolding.
3. **One thing at a time.** Dialogue, then question, then feedback: never two
   moving panels competing.
4. **Text is typed, not dumped,** but any key or tap finishes it instantly so a
   fast reader is never held back.
5. **Silence is a setting.** One mute toggle controls music and effects and is
   remembered.

## Characters
Portraits keep the original paintings; each gets a soft moonlight halo
(gold when you are in talking range) instead of the old rainbow border. The
player unicorn gets a faint ground glow and a walking bob.
