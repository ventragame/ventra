/** Child-facing English number-language puzzles (no counting, sums, or money). */
import {englishNumber} from './numberValleyEngine.ts';

export type WordTile={id:number;part:string};
/** Long single number words split into the pieces children hear and reuse
 * (seven|teen, seven|ty, hun|dred), never at arbitrary letter positions. */
const NUMBER_MORPHEMES:Readonly<Record<string,readonly string[]>>={hundred:['hun','dred'],thousand:['thou','sand']};
function meaningfulPieces(word:string):string[]{
 const known=NUMBER_MORPHEMES[word];
 if(known)return [...known];
 for(const suffix of ['teen','ty'])if(word.length>suffix.length+2&&word.endsWith(suffix))return [word.slice(0,-suffix.length),suffix];
 return [word];
}
/** Tiles for building the English number word, in reading order:
 * - one short word (≤6 letters) is spelled letter by letter;
 * - one longer word is built from meaningful pieces (fif|teen, hun|dred);
 * - a phrase is built word by word; a compound keeps its hyphen on the first
 *   half (one · hundred · twenty- · five), so spaces and hyphens stay visible. */
export function numberWordParts(value:number):string[]{
 const phrase=englishNumber(value).toLowerCase().trim();
 const words=phrase.split(/\s+/);
 if(words.length===1&&!phrase.includes('-'))return phrase.length<=6?[...phrase]:meaningfulPieces(phrase);
 return words.flatMap(word=>word.includes('-')
  ?word.split('-').map((piece,i,all)=>i<all.length-1?piece+'-':piece)
  :[word]);
}
export function numberWordTiles(value:number,seed:number):WordTile[]{
 const parts=numberWordParts(value),result=parts.map((part,id)=>({id,part}));
 let x=(seed ^ (value*2654435761))>>>0;
 for(let i=result.length-1;i>0;i--){
  x=(Math.imul(x,1664525)+1013904223)>>>0;
  const j=x%(i+1);
  [result[i],result[j]]=[result[j],result[i]];
 }
 if(result.length>1&&result.every((item,i)=>item.id===i)){
  result.push(result.shift()!);
 }
 return result;
}
export function portalSentence(value:number):string {
 return `I see ${englishNumber(value)} stars.`;
}
