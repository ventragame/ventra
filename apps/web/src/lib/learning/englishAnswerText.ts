/**
 * Canonical form for comparing a child's typed or recognised English answer
 * with an authored answer. Used by Diyalog Limanı (speech), Yazı Atölyesi
 * (typing) and Keşif Akademisi (typing + speech).
 *
 * It only removes differences that are NOT language errors:
 * - Turkish Q keyboards type "ı" for the I key and "İ" for Shift+i
 *   ("bırd", "İ see a cat" were rejected or even had letters deleted);
 * - letter case, punctuation and typographic apostrophes;
 * - standard contractions ("I'm" = "I am", "let's" = "let us") — speech
 *   recognisers return them and children write them naturally;
 * - recognisers writing small numbers as digits ("I need 2 apples").
 * It never accepts a different word, so it is not fuzzy matching.
 */
const SMALL_NUMBERS=['zero','one','two','three','four','five','six','seven','eight','nine','ten',
 'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

/** English words for 0–100, written the way the normalised answer stores them ("twenty five"). */
export function englishNumberWords(value:number):string|null{
 if(!Number.isInteger(value)||value<0||value>100)return null;
 if(value===100)return 'one hundred';
 if(value<20)return SMALL_NUMBERS[value];
 const ones=value%10;
 return TENS[Math.floor(value/10)]+(ones?' '+SMALL_NUMBERS[ones]:'');
}

export function foldTurkishKeyboardLetters(text:string):string{
 return text.replace(/ı/g,'i').replace(/İ/g,'I');
}

const CONTRACTIONS:readonly (readonly [RegExp,string])[]=[
 [/\bi'm\b/g,'i am'],
 [/\b(it|that|he|she|what|where|there|here|who)'s\b/g,'$1 is'],
 [/\blet's\b/g,'let us'],
 [/\b(we|they|you)'re\b/g,'$1 are'],
 [/\b(i|you|we|they)'ve\b/g,'$1 have'],
 [/\b(i|you|he|she|it|we|they)'ll\b/g,'$1 will'],
 [/\b(i|you|he|she|we|they)'d\b/g,'$1 would'],
 [/\bcan't\b/g,'can not'],
 [/\bcannot\b/g,'can not'],
 [/\bwon't\b/g,'will not'],
 [/\b(do|does|did|is|are|was|were|has|have|had|could|would|should)n't\b/g,'$1 not'],
 // Recognisers sometimes drop the apostrophe. Only forms that are not
 // themselves English words are expanded ("its", "lets", "were", "ill" stay).
 [/\bim\b/g,'i am'],
 [/\b(do|does|did|is|are)nt\b/g,'$1 not'],
 [/\bcant\b/g,'can not'],
 [/\b(that|what)s\b/g,'$1 is'],
 [/\b(they|you)re\b/g,'$1 are']
];

export function canonicalEnglishAnswer(text:string):string{
 let value=foldTurkishKeyboardLetters(text).normalize('NFKD').replace(/[̀-ͯ]/g,'')
  .toLocaleLowerCase('en-US').replace(/[’‘`´]/g,"'");
 for(const [pattern,replacement] of CONTRACTIONS)value=value.replace(pattern,replacement);
 value=value.replace(/\b\d{1,3}\b/g,digits=>englishNumberWords(Number(digits))??digits);
 return value.replace(/'/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
}

export function sameEnglishAnswer(actual:string,expected:string):boolean{
 const left=canonicalEnglishAnswer(actual);
 return left.length>0&&left===canonicalEnglishAnswer(expected);
}
