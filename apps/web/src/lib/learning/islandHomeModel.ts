/**
 * One home-screen grammar for every island (Learning Journey v2).
 *
 * Each island keeps its own game IDs, progress rules and art; this module only
 * decides how its chapters are PRESENTED: which chapter the "continue" hero
 * points at, what a card's state is called and how the island greets the child.
 * Nothing here reads or writes progress.
 */

export type IslandHomeId='word_garden'|'sentence'|'story'|'harbor'|'writing'|'academy';

/** done = finished at least once · current = the next one to play ·
 *  open = playable but not the suggested one · locked = waits for the previous chapter. */
export type IslandChapterState='done'|'current'|'open'|'locked';

export interface IslandChapterProgress{
 /** 1-based position on the island. */
 id:number;
 done:boolean;
 unlocked:boolean;
 /** A saved, unfinished run of this chapter exists on this device. */
 resumable?:boolean;
}

export type IslandHeroMode='start'|'continue'|'resume'|'complete';

export interface IslandHeroPlan{
 /** Chapter the main button opens. */
 chapterId:number;
 mode:IslandHeroMode;
 done:number;
 total:number;
}

/** The chapter the hero suggests: a saved run first, then the first unfinished
 *  unlocked chapter, otherwise (everything finished) the first chapter again. */
export function islandHeroPlan(chapters:readonly IslandChapterProgress[]):IslandHeroPlan{
 const done=chapters.filter(x=>x.done).length;
 const total=chapters.length;
 const resume=chapters.find(x=>x.unlocked&&x.resumable);
 if(resume)return {chapterId:resume.id,mode:'resume',done,total};
 const next=chapters.find(x=>x.unlocked&&!x.done);
 if(next)return {chapterId:next.id,mode:done>0?'continue':'start',done,total};
 return {chapterId:chapters[0]?.id??1,mode:'complete',done,total};
}

export function islandChapterState(chapter:IslandChapterProgress,plan:IslandHeroPlan):IslandChapterState{
 if(!chapter.unlocked)return 'locked';
 if(plan.mode!=='complete'&&chapter.id===plan.chapterId)return 'current';
 return chapter.done?'done':'open';
}

export const ISLAND_HERO_KICKER:Readonly<Record<IslandHeroMode,string>>={
 start:'İLK MACERAN SENİ BEKLİYOR',
 continue:'SIRADAKİ MACERAN',
 resume:'KALDIĞIN YERDEN DEVAM ET',
 complete:'HEPSİNİ TAMAMLADIN!'
};
export const ISLAND_HERO_ACTION:Readonly<Record<IslandHeroMode,string>>={
 start:'Başla',continue:'Devam Et',resume:'Devam Et',complete:'Tekrar Oyna'
};

/** The same four words on every island's chapter cards. */
export function islandChapterLabel(state:IslandChapterState,resumable=false):string{
 if(state==='locked')return 'Önceki bölümü bitir';
 if(state==='current')return resumable?'Kaldığın yerden':'Şimdi oyna';
 if(state==='done')return 'Tekrar oyna';
 return 'Oyna';
}

/** Short, A1-safe English welcome per island; the Turkish line is its meaning.
 *  It is a greeting only: it never asks for or reveals an assessed answer. */
export const ISLAND_GREETINGS:Readonly<Record<IslandHomeId,{en:string;tr:string}>>={
 word_garden:{en:'Welcome to the Word Garden!',tr:'Kelime Bahçesi’ne hoş geldin!'},
 sentence:{en:'Hello! Let’s make sentences!',tr:'Merhaba! Hadi cümle kuralım!'},
 story:{en:'Hello! Let’s listen to a story!',tr:'Merhaba! Hadi bir hikâye dinleyelim!'},
 // Not "Hello": the harbor's first task asks the child to answer "Hello!" on their own.
 harbor:{en:'Welcome to the harbor, sailor!',tr:'Limana hoş geldin, denizci!'},
 writing:{en:'Hello! Let’s write in English!',tr:'Merhaba! Hadi İngilizce yazalım!'},
 academy:{en:'Welcome to the Academy! Let’s explore!',tr:'Akademiye hoş geldin! Hadi keşfedelim!'}
};

/** The island greets aloud once per app session; the 🔊 button repeats it. */
const greeted=new Set<IslandHomeId>();
export function claimIslandGreeting(id:IslandHomeId):boolean{
 if(greeted.has(id))return false;
 greeted.add(id);
 return true;
}

/** Section headings: Görev→Görevler, Oyun→Oyunlar, Durak→Duraklar (last-vowel harmony). */
export function turkishPlural(noun:string):string{
 const vowels=[...noun.toLocaleLowerCase('tr')].filter(ch=>'aıoueiöü'.includes(ch));
 return noun+('aıou'.includes(vowels[vowels.length-1]??'e')?'lar':'ler');
}
