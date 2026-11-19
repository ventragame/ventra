/** Three disclosure levels keep model answers hidden until explicitly requested.
 * These are scaffolds, never AI scoring or claimed proof of mastery.
 */
import type {WorkshopTask} from './writingWorkshopEngine.ts';
export type WorkshopHintStage=1|2|3;
export function nextWorkshopHintStage(current:number):WorkshopHintStage{
 return current>=2?3:current===1?2:1;
}
export function workshopHint(task:WorkshopTask,stage:WorkshopHintStage):{title:string;description:string;showAnswer:boolean}{
 const words=task.target.trim().split(/\s+/);
 const letters=Array.from(task.target.replace(/[^a-z]/gi,'')).length;
 if(stage===1){
  return {title:'1 · Yapıyı keşfet',description:task.mode==='spell'?
   'Kelime '+letters+' harften oluşuyor. Sesini dinleyip harfleri sıraya koy.':
   (words.length===1?'Yanıtın tek kelimeden oluşuyor.':'Cümlede '+words.length+' kelime var. Önce anlamlı başlangıcı düşün.'),showAnswer:false};
 }
 if(stage===2){
  return {title:'2 · Başlangıcı bul',description:task.mode==='spell'||words.length===1?
   'İlk harf: '+(task.target.match(/[a-z]/i)?.[0].toUpperCase()??'').trim():
   'İlk kelime: '+words[0],showAnswer:false};
 }
 return {title:'3 · Örnekle karşılaştır',description:'Örnek cevabı incele, sonra kendi cevabını oluştur.',showAnswer:true};
}
