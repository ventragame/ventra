/**
 * Word comparison shared by the four Cümle Meydanı sentence builders.
 *
 * Letter case is typography, not word order: slot 1 is always displayed with a
 * capital letter (sentencePresentation.visibleWord), so a child who places the
 * "is" tile first sees "Is the cat under the tree?" — exactly the target. Exact
 * string comparison used to reject that sentence and record a mistake.
 * Sentence tiles never contain two words that differ only by case on purpose,
 * so comparing case-insensitively cannot accept a different English word.
 */
export function sentenceWordKey(word:string):string{
 return word.toLocaleLowerCase('en-US');
}
export function sameSentenceWord(expected:string|undefined,picked:string|undefined):boolean{
 return expected!==undefined&&picked!==undefined&&sentenceWordKey(expected)===sentenceWordKey(picked);
}
/** Index of the first wrong or missing word, or -1 when every position matches. */
export function firstSentenceMismatch(tokens:readonly string[],words:readonly string[]):number{
 return tokens.findIndex((token,i)=>!sameSentenceWord(token,words[i]));
}
export function sentenceMatches(tokens:readonly string[],words:readonly string[]):boolean{
 return tokens.length===words.length&&firstSentenceMismatch(tokens,words)<0;
}
/** Drops decoys that are a target word in another case ("is" next to "Is"). */
export function decoysOutsideSentence(candidates:readonly string[],tokens:readonly string[]):string[]{
 const used=new Set(tokens.map(sentenceWordKey));
 return candidates.filter(word=>!used.has(sentenceWordKey(word)));
}
