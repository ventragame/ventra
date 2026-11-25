/** A word or phrase shown on an end-of-lesson recap, tap to hear it. */
export interface RecapWord{en:string;tr:string;icon?:string}

/** Unique words of a round, in order, at most `limit` (repeats are dropped). */
export function uniqueRecapWords(words:readonly (RecapWord|null|undefined)[],limit=8):RecapWord[]{
 const seen=new Set<string>(),out:RecapWord[]=[];
 for(const word of words){
  if(!word?.en)continue;
  const key=word.en.trim().toLowerCase();
  if(seen.has(key))continue;
  seen.add(key);out.push(word);
  if(out.length>=limit)break;
 }
 return out;
}
