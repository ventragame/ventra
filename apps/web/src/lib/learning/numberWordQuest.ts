/** Child-facing English number-language puzzles (no counting, sums, or money). */
import {englishNumber,NUMBER_WORDS} from './numberValleyEngine.ts';

export type WordTile={id:number;part:string;decoy?:true};
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
/** A two-piece word is only a choice of order; one extra piece makes it a real
 * English decision. The extra piece is the one learners actually confuse:
 * -teen against -ty (thirteen/thirty, seventy/seventeen) and, in a compound,
 * a neighbouring units word (twenty-five, not twenty-six). "four"+"ty" is not
 * offered because "fourty" would be a misspelling of forty. */
export function numberWordDecoy(value:number):string|null{
 const parts=numberWordParts(value);
 if(parts.length!==2)return null;
 const [head,tail]=parts;
 if(tail==='teen')return head==='four'?null:'ty';
 if(tail==='ty')return 'teen';
 if(head.endsWith('-')){
  const unit=value%10;
  return NUMBER_WORDS[unit===9?8:unit+1];
 }
 return null;
}
/** The teen/ty pair a decoy stands for: 13 ↔ 30, 70 ↔ 17 (for feedback). */
export function teenTyPartner(value:number):number|null{
 if(value>=13&&value<=19)return (value-10)*10;
 if(value>=30&&value<=90&&value%10===0)return value/10+10;
 return null;
}
function seededShuffle<T extends {id:number}>(items:T[],seed:number):T[]{
 const result=[...items];
 let x=seed>>>0;
 for(let i=result.length-1;i>0;i--){
  x=(Math.imul(x,1664525)+1013904223)>>>0;
  const j=x%(i+1);
  [result[i],result[j]]=[result[j],result[i]];
 }
 // Never hand the answer over in reading order.
 if(result.length>1&&result.every((item,i)=>item.id===i))result.push(result.shift()!);
 return result;
}
export function numberWordTiles(value:number,seed:number):WordTile[]{
 const parts=numberWordParts(value);
 const tiles:WordTile[]=parts.map((part,id)=>({id,part}));
 const decoy=numberWordDecoy(value);
 if(decoy)tiles.push({id:parts.length,part:decoy,decoy:true});
 return seededShuffle(tiles,(seed ^ (value*2654435761))>>>0);
}
/** "I see one star." but "I see five stars." */
export function portalNoun(value:number):'star'|'stars'{
 return value===1?'star':'stars';
}
export function portalWords(value:number):string[]{
 return ['I','see',englishNumber(value),portalNoun(value)];
}
export function portalSentence(value:number):string {
 return `I see ${englishNumber(value)} ${portalNoun(value)}.`;
}
export type PortalTile={id:number;word:string;slot:number|null};
/** Sentence tiles for the portal: the four words of "I see five stars." plus
 * one number word that is not the answer. The child has to pick the right
 * number word and put the sentence in English word order. Shuffled per
 * question, never in reading order. */
export function portalTiles(value:number,decoy:number,seed:number):PortalTile[]{
 const tiles:PortalTile[]=portalWords(value).map((word,slot)=>({id:slot,word,slot}));
 if(decoy!==value)tiles.push({id:tiles.length,word:englishNumber(decoy),slot:null});
 return seededShuffle(tiles,(seed ^ (value*40503))>>>0);
}
