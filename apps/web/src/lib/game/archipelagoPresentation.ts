import type { IslandId } from '@ventra/shared';

/** Artwork-local label anchors (world pixels). Two-tier waterfall compositions
 * cannot share the same plaque offset without overlapping the next island. */
export interface ArchipelagoBadgeAnchor { x:number; y:number; }
export const ARCHIPELAGO_DESKTOP_BADGES:Readonly<Record<IslandId,ArchipelagoBadgeAnchor>>=Object.freeze({
  word_garden:       {x:252,y:174}, // right of waterfall, clear of Academy
  listening_forest:  {x:0,y:242},
  speaking_harbor:   {x:265,y:140}, // right of harbor, clear of Workshop
  sentence_workshop: {x:252,y:105}, // right of lower island, clear of dock
  story_castle:      {x:0,y:-253},  // above castle; below Forest plaque
  language_academy:  {x:0,y:236}
});
export function archipelagoBadgeAnchor(id:IslandId,portrait:boolean):ArchipelagoBadgeAnchor {
  // On a narrow screen we focus one island at a time; side plaques would
  // leave the viewport. Keep the plaque below the featured illustration.
  return portrait?{x:0,y:223}:ARCHIPELAGO_DESKTOP_BADGES[id];
}

/** Optical correction accounts for the heavy left info card without moving
 * island artwork or permanently biasing the narrow-screen focus camera. */
export function archipelagoOpticalShiftPixels(viewportWidth:number):number {
  if(!Number.isFinite(viewportWidth)||viewportWidth<=1000)return 0;
  return Math.min(86,Math.max(0,(viewportWidth-1000)*0.115));
}
