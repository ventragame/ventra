import type { IslandId } from '@ventra/shared';

/** Artwork-local label anchors (world pixels). Two-tier waterfall compositions
 * cannot share the same plaque offset without overlapping the next island. */
export interface ArchipelagoBadgeAnchor { x:number; y:number; }
export const ARCHIPELAGO_DESKTOP_BADGES:Readonly<Record<IslandId,ArchipelagoBadgeAnchor>>=Object.freeze({
  word_garden:       {x:252,y:174}, // right of waterfall, clear of Academy
  listening_forest:  {x:265,y:140},
  speaking_harbor:   {x:252,y:105}, // right of harbor, clear of Workshop
  sentence_workshop: {x:0,y:-253}, // right of lower island, clear of dock
  story_castle:      {x:0,y:242},  // above castle; below Forest plaque
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

export interface ArchipelagoCameraFrameInput {
  width: number;
  height: number;
  bounds: { width: number; height: number; centerX: number; centerY: number };
  mode: 'focus' | 'overview';
  target?: { x: number; y: number };
}
export interface ArchipelagoCameraFrame { x: number; y: number; zoom: number; }

/** Fit the world into the area not covered by the HUD, detail sheet and dock.
 * An explicit overview ALWAYS fits the six islands, including on portrait phones.
 */
export function archipelagoCameraFraming({
  width, height, bounds, mode, target
}: ArchipelagoCameraFrameInput): ArchipelagoCameraFrame {
  const shortLandscape = width <= 900 && height <= 520;
  const narrow = width <= 640 || shortLandscape;
  const top = narrow ? (shortLandscape ? 64 : 94) : width <= 900 ? 82 : 96;
  const bottom = narrow
    ? (mode === 'overview' ? 86 : shortLandscape ? 88 : 230)
    : width <= 900 ? (mode === 'overview' ? 110 : 210) : 240;
  const availableWidth = Math.max(160, width - (width <= 900 ? 36 : 160));
  const availableHeight = Math.max(110, height - top - bottom);
  let zoom: number;
  let x: number;
  let y: number;

  if (mode === 'focus' && target) {
    // The island illustration spans 460 world pixels in WorldScene.
    zoom = Math.max(0.22, Math.min(1.05, availableWidth / 460, availableHeight / 460));
    x = target.x;
    y = target.y + (bottom - top) / (2 * zoom);
    if (shortLandscape) {
      // Leave the left-hand detail sheet clear in landscape phone layouts.
      x -= Math.min(110, width * 0.12) / zoom;
    }
  } else {
    const inset = narrow ? 100 : 150;
    zoom = Math.max(0.12, Math.min(1.15,
      availableWidth / (bounds.width + inset),
      availableHeight / (bounds.height + inset)));
    x = bounds.centerX;
    y = bounds.centerY + (bottom - top) / (2 * zoom);
  }
  return { x, y, zoom };
}
