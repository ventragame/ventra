/**
 * Ventra English Learning Journey v2
 * Pedagogical product contract, NOT an official MEB/CEFR certification mapping.
 * Do not rename persistent IDs when expanding worlds: profile game keys and
 * deep links depend on the legacy IDs of our six visual island assets.
 */
import type { IslandId } from '@ventra/shared';
import type { EnglishPlacement, GradeBand } from './gradeAwareLearningPolicy.ts';
export type CommunicationGoal='vocabulary'|'sentence-building'|'story-comprehension'|'dialogue'|'writing'|'integrated-mastery';
export interface LearningIslandPlan{
 id:IslandId;title:string;goal:CommunicationGoal;order:number;
 playable:boolean;prerequisites:readonly CommunicationGoal[];
 atLevel:Readonly<Record<EnglishPlacement,readonly string[]>>;
 futureMechanics:readonly string[];
 evidence:readonly string[];
}
export const ENGLISH_JOURNEY:readonly LearningIslandPlan[]=[
 {id:'word_garden',title:'Kelime Bahçesi',goal:'vocabulary',order:1,playable:true,prerequisites:[],
  atLevel:{
   'Pre-A1':['Kelimeyi görüp keşfet','Ses ile resmi eşleştir','Basit İngilizce yönergeyi takip et'],
   'A1':['Sözcüğü farklı bağlamda tanı','Tanıdık kalıpla kısa ifade seç','Sözcüğü küçük bir görevde uygula'],
   'A2':['Yakın anlamlı sözcükleri bağlamda ayır','Günlük ifadeyi tamamla','Farklı dünyalardaki sözcükleri transfer et']
  },
  futureMechanics:['Görsel keşif ve etkileşim','Kelimelerle dinle-seç','Bağlamlı kısa görevler'],
  evidence:['discovery','recognition','listening','application']},
 {id:'story_castle',title:'Cümle Meydanı',goal:'sentence-building',order:2,playable:false,prerequisites:['vocabulary'],
  atLevel:{
   'Pre-A1':['This is a…','It is red.','I like…'],
   'A1':['There is / There are','The cat is under the table.','Do you like…?'],
   'A2':['Because ile gerekçe','Past simple olay anlatımı','İki cümleyi bağlama']
  },
  futureMechanics:['Sahne içinde sözcük kartlarını diz','Nesneleri yerleştirip doğru cümle kur','Anlamı bozan sözcüğü bul'],
  evidence:['word-order','meaningful-sentence','independent-production']},
 {id:'listening_forest',title:'Hikâye Ormanı',goal:'story-comprehension',order:3,playable:false,prerequisites:['vocabulary','sentence-building'],
  atLevel:{
   'Pre-A1':['2–3 cümlelik resimli olay','Önce–sonra sıralaması','Karakterin duygusunu tanıma'],
   'A1':['Kısa karakter diyalogları','Olay örgüsünü takip','Hikâyede nedeni bul'],
   'A2':['Bağlamdan sonuç çıkar','Konuşmacı niyetini ayır','Alternatif hikâye devamı']
  },
  futureMechanics:['Gezilebilir hikâye sahneleri','Olay kartlarını sıralama','Kısa dinleme ve olay seçimi'],
  evidence:['sequencing','inference','narrative-comprehension']},
 {id:'speaking_harbor',title:'Diyalog Limanı',goal:'dialogue',order:4,playable:false,prerequisites:['sentence-building','story-comprehension'],
  atLevel:{
   'Pre-A1':['Hello! / Goodbye!','My name is…','Yes, please.'],
   'A1':['Yiyecek siparişi verme','Yol sorma','Kısa soru–cevap yapma'],
   'A2':['Tercihleri gerekçelendirme','Nazik istek ve öneri','Çok turlu konuşma']
  },
  futureMechanics:['Karakter seçimli konuşma','Bağlama göre cevap','Mikrofon olmadan diyalog dallanması'],
  evidence:['context-appropriate-response','turn-taking','pragmatic-communication']},
 {id:'sentence_workshop',title:'Yazı Atölyesi',goal:'writing',order:5,playable:false,prerequisites:['sentence-building','dialogue'],
  atLevel:{
   'Pre-A1':['Sözcükten kısa cümle','Harf eşleştirme','Resimli notu tamamlama'],
   'A1':['Kısa mesaj ve açıklama','Yönlendirilmiş üç cümle','Kelime sıralama'],
   'A2':['Kısa paragraf','Bir günü anlatma','Hikâye giriş–gelişme–sonuç']
  },
  futureMechanics:['Kelime mıknatısları','Cümle inşa masası','Kısa yaratıcı yazma'],
  evidence:['spelling','sentence-accuracy','communicative-writing']},
 {id:'language_academy',title:'Keşif Akademisi',goal:'integrated-mastery',order:6,playable:false,prerequisites:['vocabulary','sentence-building','story-comprehension','dialogue','writing'],
  atLevel:{
   'Pre-A1':['Gör–dinle–seç görevleri','Kısa İngilizce talimatla ilerle','Bağımsız tekrar'],
   'A1':['Duruma uygun kısa diyalog','Karakter hikâyesini tamamlama','Beceri karması görev'],
   'A2':['Çok aşamalı İngilizce görev','Düşünceyi neden ile açıklama','Yeni bağlamda dil transferi']
  },
  futureMechanics:['Kişiselleştirilmiş görev zinciri','Çok becerili macera finali','Yanlış öğrenilen beceriye geri dönüş'],
  evidence:['independent-transfer','spaced-retention','multiskill-application']}
];
export const JOURNEY_ORDER:readonly IslandId[]=ENGLISH_JOURNEY.map(x=>x.id);
export type LearnerRoute={
 gradeBand:GradeBand;englishLevel:EnglishPlacement;gradeLabel:string;
 instructionSupport:'supported'|'guided'|'independent';
 goals:readonly string[];
};
/** Grade controls cognitive scaffolding; placement controls English complexity.
 * The two axes must never be silently conflated or used as a formal CEFR test. */
export function describeLearnerRoute(grade:number|null|undefined,level:EnglishPlacement):LearnerRoute{
 const valid=Number.isInteger(grade)&&grade!>=1&&grade!<=8;
 const gradeBand:GradeBand=!valid?'unselected':grade!<=2?'early':grade!<=4?'middle':'upper';
 const instructionSupport=level==='Pre-A1'||gradeBand==='early'?'supported':gradeBand==='upper'?'independent':'guided';
 return {gradeBand,englishLevel:level,gradeLabel:valid?`${grade}. sınıf`:'Sınıf seçilmedi',
  instructionSupport,goals:ENGLISH_JOURNEY[0].atLevel[level]};
}
