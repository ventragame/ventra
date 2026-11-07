/** Child-readable typography. Do not change evaluated tokens or persisted evidence. */
export function sentenceStart(text:string,locale='tr-TR'):string{
 return text.replace(/^(\s*)(\p{L})/u,(_match,whitespace:string,char:string)=>
  whitespace+char.toLocaleUpperCase(locale));
}
export function visibleWord(word:string,index:number):string{
 return index===0?sentenceStart(word,'en-US'):word;
}
export function visibleRepairWord(word:string,index:number,length:number,sentence:string):string{
 const base=visibleWord(word,index);
 if(index!==length-1)return base;
 return base+(sentence.endsWith('?')?'?':'.');
}
