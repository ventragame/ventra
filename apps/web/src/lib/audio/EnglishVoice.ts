/** Score installed voices consistently across browser and mobile OS engines. */
export interface VoiceCandidate { lang:string; name?:string; localService?:boolean }
export function preferredEnglishVoiceIndex<T extends VoiceCandidate>(voices:readonly T[]):number{
 let best=-1,score=-Infinity;
 voices.forEach((voice,index)=>{
  const lang=(voice.lang||'').replace(/_/g,'-').toLowerCase();
  if(lang!=='en'&&!lang.startsWith('en-'))return;
  const name=(voice.name||'').toLowerCase();
  let value=lang==='en-us'?24:lang==='en-gb'?18:lang==='en'?8:12;
  if(voice.localService)value+=6;
  if(/neural|natural|enhanced|premium|high.quality/.test(name))value+=22;
  if(/samantha|aria|jenny|google us english|siri|serena|daniel/.test(name))value+=8;
  if(/compact|espeak|robot|basic|legacy/.test(name))value-=18;
  if(value>score){best=index;score=value;}
 });
 return best;
}
