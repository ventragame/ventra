/** Child-facing English number-language puzzles (no counting, sums, or money). */
import {englishNumber} from './numberValleyEngine.ts';

export type WordTile={id:number;part:string};
/** A short numeral is spelled letter-by-letter; long numerals use pronounceable-ish
 * two/three character chunks to keep the touch task accessible. */
export function numberWordParts(value:number):string[]{
 const word=englishNumber(value).replace(/[^a-z]/g,'');
 if(word.length<=6)return [...word];
 const size=word.length<=12?2:3;
 const parts:string[]=[];
 for(let i=0;i<word.length;i+=size)parts.push(word.slice(i,i+size));
 return parts;
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
