import type {HarborPlace} from './harborQuestContentA';

/** Game art is separate from characters, selectable props and dialogue overlays.
 * Keep the five scenes distinct and supply a portrait-safe mobile composition. */
export type HarborSceneArt={desktop:string;mobile:string};
const root='/assets/harbor-scenes/';
export const HARBOR_SCENE_ASSETS:Readonly<Record<HarborPlace,HarborSceneArt>>={
 dock:{desktop:root+'dock.webp',mobile:root+'dock_mobile.webp'},
 market:{desktop:root+'market.webp',mobile:root+'market_mobile.webp'},
 sea:{desktop:root+'sea.webp',mobile:root+'sea_mobile.webp'},
 lighthouse:{desktop:root+'lighthouse.webp',mobile:root+'lighthouse_mobile.webp'},
 festival:{desktop:root+'festival.webp',mobile:root+'festival_mobile.webp'}
};
