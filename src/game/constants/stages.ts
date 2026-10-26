import type { StageConfig, NPC } from '../types'
import { getNpcPosition } from '../utils/npcLayout'
import { STAGE_SPECS, type NpcContent, type StageSpec } from '../data/stageSpecs'
import { WIDTH, HEIGHT } from './dimensions'

// A stage "template": everything except NPC positions, which depend on the
// canvas size they'll actually be rendered at (see buildStages below).
type StageTemplate = Omit<StageConfig, 'npcs'> & { npcs: NpcContent[] }

// Positions are derived instead of hand-typed so NPCs stay spread across the
// full canvas (and reachable by the player) regardless of canvas size.
// `stageSeed` just varies the zig-zag pattern between consecutive stages.
function layoutStage(
  stageSeed: number,
  npcs: NpcContent[],
  width: number,
  height: number
): NPC[] {
  return npcs.map((npc, index) => ({
    ...npc,
    ...getNpcPosition({
      index,
      total: npcs.length,
      stageSeed,
      width,
      height,
    }),
  }))
}

/**
 * Builds the stage list with NPC positions laid out for a specific canvas
 * size. Call this with the *actual* on-screen canvas dimensions (which
 * change between the landscape and portrait design resolutions) rather than
 * relying on the WIDTH/HEIGHT-default `STAGES` export below.
 */
export function buildStages(width: number, height: number): StageConfig[] {
  return STAGE_TEMPLATES.map((template, stageSeed) => ({
    ...template,
    npcs: layoutStage(stageSeed, template.npcs, width, height),
  }))
}

// --- Curriculum ---------------------------------------------------------
// Questions live in data/stageSpecs.ts; this file only adds art and layout.
//
// Art/asset note: there's only enough background/NPC artwork for 12
// distinct-looking stages. Stages 13-15 reuse stage 1-3's portraits (same
// pictures, new questions) but have no background picture: the 2D view draws
// their room in code (`utils/drawRoomBackground.ts`). Swap in new images under
// the same filenames later if more art gets made.
/** How many stages have a background picture of their own. */
const ART_STAGES = 12

function artStage(newStageNumber: number): number {
  return ((newStageNumber - 1) % 12) + 1
}

function imageKeyFor(art: number, index: number): string {
  return index < 3 ? `stage${art}Npc${index + 1}` : 'stage1Npc4'
}

function buildStageTemplate(spec: StageSpec): StageTemplate {
  const { n, subject, difficulty, npcs } = spec
  const art = artStage(n)
  const withArt = npcs.map((npc, i) => ({
    ...npc,
    imageKey: imageKeyFor(art, i),
  }))

  return {
    name: `stage${n}` as StageTemplate['name'],
    background: n <= ART_STAGES ? (`stage${art}Background` as StageTemplate['background']) : undefined,
    requiredToAdvance: 4,
    gates: [],
    subject,
    difficulty,
    npcs: withArt,
  }
}

const STAGE_TEMPLATES: StageTemplate[] = STAGE_SPECS.map(buildStageTemplate)

// Default landscape-laid-out stages, for consumers that only care about
// stage metadata (name, count, nextStage chain) and never render NPCs -
// dev navigation, stage-index lookups, data-integrity tests, etc.
export const STAGES: StageConfig[] = buildStages(WIDTH, HEIGHT)
