/**
 * Stable, word-accurate visual registry for children's English learning.
 * Never use a themed scene as the answer illustration for an unrelated lexeme.
 * Each src is a checked-in author-drawn SVG, not a third-party stock image.
 * Decorative scene artwork is deliberately separate from semantic word art.
 */
import type {ThemeId} from './themeQuestCatalog.ts';
export const THEME_SCENES:Readonly<Record<ThemeId,string>>={
 school:'/assets/learning-art/themes/school.svg',
 body:'/assets/learning-art/themes/body.svg',
 clothes:'/assets/learning-art/themes/clothes.svg',
 weather:'/assets/learning-art/themes/weather.svg',
 calendar:'/assets/learning-art/themes/calendar.svg',
 hobbies:'/assets/learning-art/themes/hobbies.svg',
 transport:'/assets/learning-art/themes/transport.svg',
 feelings:'/assets/learning-art/themes/feelings.svg'
};
export const ALPHABET_ANCHOR_ART:Readonly<Record<string,string>>={
 s:'/assets/learning-art/alphabet/s.svg',
 a:'/assets/learning-art/alphabet/a.svg',
 t:'/assets/learning-art/alphabet/t.svg',
 p:'/assets/learning-art/alphabet/p.svg',
 i:'/assets/learning-art/alphabet/i.svg',
 n:'/assets/learning-art/alphabet/n.svg',
 m:'/assets/learning-art/alphabet/m.svg',
 d:'/assets/learning-art/alphabet/d.svg',
 g:'/assets/learning-art/alphabet/g.svg',
 o:'/assets/learning-art/alphabet/o.svg',
 c:'/assets/learning-art/alphabet/c.svg',
 k:'/assets/learning-art/alphabet/k.svg',
 e:'/assets/learning-art/alphabet/e.svg',
 u:'/assets/learning-art/alphabet/u.svg',
 r:'/assets/learning-art/alphabet/r.svg',
 h:'/assets/learning-art/alphabet/h.svg',
 b:'/assets/learning-art/alphabet/b.svg',
 f:'/assets/learning-art/alphabet/f.svg',
 l:'/assets/learning-art/alphabet/l.svg',
 j:'/assets/learning-art/alphabet/j.svg',
 v:'/assets/learning-art/alphabet/v.svg',
 w:'/assets/learning-art/alphabet/w.svg',
 y:'/assets/learning-art/alphabet/y.svg',
 z:'/assets/learning-art/alphabet/z.svg',
 q:'/assets/learning-art/alphabet/q.svg',
 x:'/assets/learning-art/alphabet/x.svg'
};
export const WORD_VISUALS:Readonly<Record<string,string>>={
 'sun':'/assets/learning-art/alphabet/s.svg',
 'apple':'/assets/learning-art/alphabet/a.svg',
 'top':'/assets/learning-art/alphabet/t.svg',
 'pen':'/assets/learning-art/alphabet/p.svg',
 'insect':'/assets/learning-art/alphabet/i.svg',
 'nest':'/assets/learning-art/alphabet/n.svg',
 'moon':'/assets/learning-art/alphabet/m.svg',
 'dog':'/assets/learning-art/alphabet/d.svg',
 'goat':'/assets/learning-art/alphabet/g.svg',
 'octopus':'/assets/learning-art/alphabet/o.svg',
 'cat':'/assets/learning-art/alphabet/c.svg',
 'kite':'/assets/learning-art/alphabet/k.svg',
 'egg':'/assets/learning-art/alphabet/e.svg',
 'umbrella':'/assets/learning-art/alphabet/u.svg',
 'rabbit':'/assets/learning-art/alphabet/r.svg',
 'hat':'/assets/learning-art/alphabet/h.svg',
 'ball':'/assets/learning-art/alphabet/b.svg',
 'fish':'/assets/learning-art/alphabet/f.svg',
 'lion':'/assets/learning-art/alphabet/l.svg',
 'jam':'/assets/learning-art/alphabet/j.svg',
 'van':'/assets/learning-art/alphabet/v.svg',
 'water':'/assets/learning-art/alphabet/w.svg',
 'yellow':'/assets/learning-art/alphabet/y.svg',
 'zebra':'/assets/learning-art/alphabet/z.svg',
 'queen':'/assets/learning-art/alphabet/q.svg',
 'fox':'/assets/learning-art/alphabet/x.svg',
 'pencil':'/assets/learning-art/concepts/pencil.svg',
 'book':'/assets/learning-art/concepts/book.svg',
 'bag':'/assets/learning-art/concepts/bag.svg',
 'desk':'/assets/learning-art/concepts/desk.svg',
 'chair':'/assets/learning-art/concepts/chair.svg',
 'ruler':'/assets/learning-art/concepts/ruler.svg',
 'eraser':'/assets/learning-art/concepts/eraser.svg',
 'notebook':'/assets/learning-art/concepts/notebook.svg',
 'board':'/assets/learning-art/concepts/board.svg',
 'rainy':'/assets/learning-art/concepts/rainy.svg',
 'cloudy':'/assets/learning-art/concepts/cloudy.svg',
 'windy':'/assets/learning-art/concepts/windy.svg',
 'snowy':'/assets/learning-art/concepts/snowy.svg',
 'bus':'/assets/learning-art/concepts/bus.svg',
 'train':'/assets/learning-art/concepts/train.svg',
 'car':'/assets/learning-art/concepts/car.svg',
 'bike':'/assets/learning-art/concepts/bike.svg',
 'plane':'/assets/learning-art/concepts/plane.svg',
 'happy':'/assets/learning-art/concepts/happy.svg',
 'sad':'/assets/learning-art/concepts/sad.svg',
 'angry':'/assets/learning-art/concepts/angry.svg',
 'shirt':'/assets/learning-art/concepts/shirt.svg',
 'coat':'/assets/learning-art/concepts/coat.svg',
 'shoes':'/assets/learning-art/concepts/shoes.svg',
 'dress':'/assets/learning-art/concepts/dress.svg',
 'head':'/assets/learning-art/concepts/head.svg',
 'hand':'/assets/learning-art/concepts/hand.svg',
 'eye':'/assets/learning-art/concepts/eye.svg',
 'ear':'/assets/learning-art/concepts/ear.svg',
 'nose':'/assets/learning-art/concepts/nose.svg',
 'mouth':'/assets/learning-art/concepts/mouth.svg',
 'foot':'/assets/learning-art/concepts/foot.svg',
 'arm':'/assets/learning-art/concepts/arm.svg',
 'leg':'/assets/learning-art/concepts/leg.svg'
};
/** Exact-match only. An unknown or abstract term has no pictorial claim. */
export function visualForEnglishWord(english:string):string|null{
 return WORD_VISUALS[english.trim().toLocaleLowerCase('en-US')]??null;
}
export function alphabetVisual(letterId:string):string|null{
 return ALPHABET_ANCHOR_ART[letterId.trim().toLowerCase()]??null;
}
export function themeScene(theme:ThemeId):string{
 return THEME_SCENES[theme];
}
