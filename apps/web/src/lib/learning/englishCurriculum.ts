/**
 * Ventra Kids — P0 canonical English outcome map (NOT a formal CEFR/MEB syllabus).
 *
 * This is READ-ONLY instructional metadata. It does not alter saved progress,
 * unlock logic, stars, audio/transcripts, payments or database tables.
 * Vocabulary itself continues to live in the original game catalogs.
 * "authored" means code-backed activities, NOT child-validated mastery.
 */
import type {IslandId} from '@ventra/shared';
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';

export const ENGLISH_CURRICULUM_VERSION='kids-english-p0-2026-11-16' as const;
export const ENGLISH_PLACEMENTS=['Pre-A1','A1','A2'] as const satisfies readonly EnglishPlacement[];
export type EnglishTopicId =
 'letters'|'phonics'|'animals'|'colors'|'numbers'|'food'|'family'|'home'|'routines'|
 'greetings'|'requests'|'descriptions'|'locations'|'actions'|'preferences'|'story'|
 'dialogue'|'spelling'|'writing'|'integrated'|'school'|'clothes'|'body'|'weather'|'calendar'|'hobbies';
export type EnglishSkill='recognition'|'listening'|'reading'|'comprehension'|'sentence'|'dialogue'|'writing'|'pronunciation';
export type CurriculumCoverage='authored'|'partial'|'gap';
export type TeachingSurfaceId=
 'garden.animals'|'garden.colors'|'garden.numbers'|'garden.food'|'garden.family'|'garden.temple'|
 'plaza.sentences'|'forest.discovery'|'forest.sequence'|'forest.detective'|
 'harbor.dialogue'|'workshop.writing'|'academy.atlas';
export type CurriculumSurface={
 id:TeachingSurfaceId; islandId:IslandId; label:string; gameId:string; source:string;
};
export const CURRICULUM_SURFACES:readonly CurriculumSurface[]=[
 {id:'garden.animals',islandId:'word_garden',label:'Hayvan Çayırı',gameId:'island_word_garden_steps',source:'apps/web/src/lib/learning/animalMissionEngine.ts'},
 {id:'garden.colors',islandId:'word_garden',label:'Renk Korusu',gameId:'island_word_garden_colors',source:'apps/web/src/lib/learning/colorMissionEngine.ts'},
 {id:'garden.numbers',islandId:'word_garden',label:'Sayı Vadisi',gameId:'island_word_garden_numbers',source:'apps/web/src/lib/learning/numberValleyEngine.ts'},
 {id:'garden.food',islandId:'word_garden',label:'Lezzet Pazarı',gameId:'island_word_garden_food',source:'apps/web/src/lib/learning/foodMarketEngine.ts'},
 {id:'garden.family',islandId:'word_garden',label:'Aile Köyü',gameId:'island_word_garden_family',source:'apps/web/src/lib/learning/familyVillageEngine.ts'},
 {id:'garden.temple',islandId:'word_garden',label:'Keşif Tapınağı',gameId:'island_word_garden_temple',source:'apps/web/src/lib/learning/templeEngine.ts'},
 {id:'plaza.sentences',islandId:'story_castle',label:'Cümle Meydanı / Uyanan Meydan',gameId:'island_sentence_square_plaza',source:'apps/web/src/lib/learning/sentencePlazaEngine.ts'},
 {id:'forest.discovery',islandId:'listening_forest',label:'Hikâye Ormanı / Keşif',gameId:'island_story_forest_discover',source:'apps/web/src/lib/learning/storyForestJourneyEngine.ts'},
 {id:'forest.sequence',islandId:'listening_forest',label:'Hikâye Ormanı / Olay Sırası',gameId:'island_story_forest_sequence',source:'apps/web/src/lib/learning/storySequenceEngine.ts'},
 {id:'forest.detective',islandId:'listening_forest',label:'Hikâye Ormanı / Dedektif',gameId:'island_story_forest_detective',source:'apps/web/src/lib/learning/storyDetectiveEngine.ts'},
 {id:'harbor.dialogue',islandId:'speaking_harbor',label:'Diyalog Limanı',gameId:'island_speaking_harbor_dialogue',source:'apps/web/src/lib/learning/harborDialogueEngine.ts'},
 {id:'workshop.writing',islandId:'sentence_workshop',label:'Yazı Atölyesi',gameId:'island_sentence_workshop_writing',source:'apps/web/src/lib/learning/writingWorkshopEngine.ts'},
 {id:'academy.atlas',islandId:'language_academy',label:'Keşif Akademisi',gameId:'island_language_academy_atlas',source:'apps/web/src/lib/learning/academyEngine.ts'}
] as const;

export interface EnglishCurriculumOutcome {
 readonly id:string;
 readonly topic:EnglishTopicId;
 readonly topicTitleTr:string;
 readonly placement:EnglishPlacement;
 readonly descriptionTr:string;
 readonly modelEnglish:string;
 readonly skills:readonly EnglishSkill[];
 readonly coverage:CurriculumCoverage;
 /** Refer only to real, existing game surfaces. No placeholder game IDs. */
 readonly surfaceIds:readonly TeachingSurfaceId[];
 /** Recommended teaching order, never a hard access lock or mastery claim. */
 readonly prerequisiteIds:readonly string[];
 /** Non-certifying editorial tag, separate from learner's grade. */
 readonly quality:'author-reviewed-content-pending-pedagogical-acceptance';
}
type TierTriple<T>=readonly [T,T,T];
interface TopicSeed {
 id:EnglishTopicId;
 title:string;
 skills:readonly EnglishSkill[];
 surfaces:readonly TeachingSurfaceId[];
 coverage:TierTriple<CurriculumCoverage>;
 descriptions:TierTriple<string>;
 models:TierTriple<string>;
 prerequisites:readonly EnglishTopicId[];
}
const topic=(id:EnglishTopicId,title:string,skills:readonly EnglishSkill[],
 surfaces:readonly TeachingSurfaceId[],coverage:TierTriple<CurriculumCoverage>,
 descriptions:TierTriple<string>,models:TierTriple<string>,prerequisites:readonly EnglishTopicId[]=[]):TopicSeed=>
 ({id,title,skills,surfaces,coverage,descriptions,models,prerequisites});

/** Placement-specific, editor-authored learning goals.
 * 'gap' is a *curriculum backlog*, not a claim that a lesson already exists.
 */
const TOPIC_SEEDS:readonly TopicSeed[]=[
 topic("letters","Alfabe ve harf adları",["recognition","listening"],[],["gap","gap","gap"],
  ["Büyük/küçük İngilizce harf adlarını tanır.","Alfabe harflerini kelime bağlamında ayırt eder.","Harf adlarını bağımsız tanıyıp yazımla eşler."],
  ["A, B, C","upper-case A / lower-case a","letter names"],[]),
 topic("phonics","Harf–ses ilişkisi",["listening","reading","pronunciation"],[],["gap","gap","gap"],
  ["Temel harf seslerini kelimelerde ayırt eder.","Düzenli ses eşlemeleriyle kısa kelimeleri okur.","Farklı yazımların seslerini bağlamda ayırt eder."],
  ["/k/ in cat","c-a-t → cat","ship / sheep"],["letters"]),
 topic("animals","Hayvanlar",["recognition","listening"],["garden.animals","garden.temple"],["authored","authored","authored"],
  ["Sık kullanılan hayvan adlarını dinler ve görselle eşleştirir.","Hayvanları nitelik ve eylem bağlamında tanır.","Daha geniş hayvan söz varlığını bağlamsal ipucuyla ayırt eder."],
  ["cat, dog","a small rabbit","The parrot can fly."],[]),
 topic("colors","Renkler",["recognition","listening"],["garden.colors","garden.temple"],["authored","authored","authored"],
  ["Temel İngilizce renk adlarını seçer.","Renkleri nesnelerle eşleştirir.","Daha ayrıntılı renk ifadelerini bağlamda ayırt eder."],
  ["red, blue","a green tree","a colorful garden"],[]),
 topic("numbers","Sayılar",["recognition","listening","reading"],["garden.numbers","garden.temple"],["authored","authored","authored"],
  ["Düzey/sınıf sınırında 1–10 İngilizce sayı adlarını tanır.","Uygun düzeyde 1–100 aralığındaki sayı sözlerini okur/dinler.","Uygun sınıfta 1–1000 aralığındaki sayı sözlerini kullanır."],
  ["one, two","twenty-five","three hundred"],[]),
 topic("food","Yiyecek ve içecekler",["recognition","listening","dialogue"],["garden.food","garden.temple"],["authored","authored","authored"],
  ["Temel yiyecek-içecek adlarını tanır.","Yiyecek isteklerini bağlamda anlar.","Daha ayrıntılı sipariş ve tercihi bağlamda ayırt eder."],
  ["apple, milk","I want an apple.","I would like some juice, please."],[]),
 topic("family","Aile üyeleri",["recognition","listening"],["garden.family","garden.temple"],["authored","authored","authored"],
  ["Temel aile üyelerinin adlarını tanır.","Aile ilişkilerini kısa ifadelerde anlar.","Aile bireylerini daha ayrıntılı betimlemelerde ayırt eder."],
  ["mother, father","This is my sister.","My family helps me."],[]),
 topic("home","Ev ve nesneler",["recognition","listening"],["garden.family","garden.temple"],["authored","authored","authored"],
  ["Odaların ve temel eşyaların adlarını tanır.","Evdeki nesnelerin yerini kısa ifadelerle bulur.","Ev ve eşya ifadelerini bağlam içinde çözümler."],
  ["kitchen, bed","in the bedroom","The book is on the table."],["family"]),
 topic("routines","Günlük rutinler",["recognition","listening","comprehension"],["garden.family"],["authored","authored","authored"],
  ["Basit günlük eylemleri tanır.","Günlük etkinlikleri İngilizce yönergeyle ilişkilendirir.","Bir günlük rutini kısa bağlam içinde anlar."],
  ["eat, sleep","I get up.","I help at home."],["family"]),
 topic("greetings","Selamlaşma ve tanışma",["listening","dialogue"],["harbor.dialogue"],["authored","authored","authored"],
  ["Selamlaşma ve vedalaşmaya uygun yanıtı seçer.","Basit tanışma ve hal hatır ifadelerini anlar.","Daha geniş selamlaşma bağlamında uygun yanıtı ayırt eder."],
  ["Hello! / Bye!","Nice to meet you!","Welcome aboard!"],[]),
 topic("requests","İstek ve nezaket",["listening","dialogue"],["harbor.dialogue","garden.food"],["authored","authored","authored"],
  ["Please ve thank you gibi temel ifadeleri ayırt eder.","Kısa bir istek ve cevabı bağlama uygun seçer.","Nazik bir rica ve teşekkür konuşmasına uygun cevap verir."],
  ["Yes, please.","Can you help me?","Could I have some water?"],["greetings"]),
 topic("descriptions","Nesne ve renk betimleme",["sentence","comprehension"],["plaza.sentences"],["authored","authored","authored"],
  ["Nesne ve özelliği hakkında basit cümleyi kurar.","Renk/sıfat içeren kısa betimlemeyi anlamıyla eşler.","Birden çok özelliği tek cümlede bağlar."],
  ["It is red.","The flower is yellow.","The small bird is blue."],["colors"]),
 topic("locations","Yer ve konum ifadeleri",["sentence","listening"],["plaza.sentences","harbor.dialogue"],["authored","authored","authored"],
  ["Here/there gibi basit yer ifadelerini tanır.","Under/behind/near yapılarıyla yer tarifini anlar.","Birden fazla konum ipucundan doğru yönü çıkarır."],
  ["Here!","The cat is under the tree.","Go straight and turn right."],["descriptions"]),
 topic("actions","Eylemler ve yetenekler",["sentence","comprehension"],["plaza.sentences"],["authored","authored","authored"],
  ["Can + eylem türündeki basit cümleyi anlar.","Şimdiki eylemleri kısa cümlelerde ayırt eder.","Bağlaçlı eylem açıklamalarını anlamına uygun kurar."],
  ["The bird can fly.","The rabbit is jumping.","The dog is running because it is happy."],["animals"]),
 topic("preferences","Sevme ve tercihler",["sentence","dialogue"],["plaza.sentences","harbor.dialogue"],["authored","authored","authored"],
  ["I like kalıbıyla tercih belirtir.","Do you like sorusuna uygun yanıtı seçer.","Because kullanarak tercihini gerekçelendirir."],
  ["I like apples.","Do you like fish?","I like the garden because it is peaceful."],["food"]),
 topic("story","Hikâye anlama ve olay sırası",["listening","comprehension","reading"],["forest.discovery","forest.sequence","forest.detective"],["authored","authored","authored"],
  ["Kısa resimli hikâyede kim/ne sorusuna cevap verir.","Önce/sonra olaylarını sıraya koyar.","Hikâyedeki neden ve sonuç ipuçlarını ayırt eder."],
  ["The bird found a key.","First the rabbit found a key.","Why did the friends return?"],["descriptions","actions"]),
 topic("dialogue","Diyalogda sıra alma",["dialogue","listening"],["harbor.dialogue"],["authored","authored","authored"],
  ["Kısa diyalogda doğru karşılığı seçer.","Yardım, yön ve istekte çok turlu yanıt verir.","Bağlama göre daha nazik ve gerekçeli karşılık seçer."],
  ["How are you?","Where is the lighthouse?","Could you show us the safest way?"],["greetings","requests"]),
 topic("spelling","Harfleri dizerek kelime oluşturma",["reading","writing"],["workshop.writing"],["authored","authored","authored"],
  ["Görsel desteğiyle kısa kelimenin harflerini sıralar.","Daha uzun bir kelimenin harflerini düzenler.","İleri düzey kelimeleri harfleriyle oluşturur."],
  ["c-a-t","p-e-n-c-i-l","e-n-v-e-l-o-p-e"],["animals"]),
 topic("writing","Cümle ve kısa metin yazma",["sentence","writing"],["workshop.writing"],["authored","authored","authored"],
  ["Kısa kelime/cümleyi yardımlı veya bağımsız yazar.","Kısa mesajı tam İngilizce cümleyle yazar.","Bağlantılı kısa metni düzenli şekilde yazar."],
  ["I have a pen.","My friend is kind.","I received a kind letter from my friend."],["spelling","descriptions"]),
 topic("integrated","Beceri birleştirme ve tekrar",["listening","reading","comprehension","dialogue","writing"],["academy.atlas","garden.temple"],["authored","authored","authored"],
  ["Tanıdık kelime ve yönergeleri yeni sahnede uygular.","Kısa diyalog, dinleme ve yazma görevlerini bağlar.","Bir hikâye bağlamında karma beceri görevleri çözer."],
  ["Find the blue star.","Please read my note.","I wrote a postcard while we crossed the sea."],["story","dialogue","writing"]),
 topic("school","Okul ve sınıf dili",["recognition","listening"],[],["gap","gap","gap"],
  ["Sınıf eşyaları ve temel sınıf komutlarını öğrenir.","Okuldaki etkinlikleri kısa ifadelerde anlatır.","Okul yaşamıyla ilgili karşılıklı açıklama yapar."],
  ["book, pencil","Open your book.","What did you do at school?"],[]),
 topic("clothes","Kıyafetler",["recognition","listening"],[],["gap","gap","gap"],
  ["Temel kıyafet adlarını tanır.","Renk ve kıyafetleri kısa cümlelerde kullanır.","Kıyafet tercihlerini bağlamda açıklar."],
  ["shirt, shoes","a red jacket","I wear a coat when it is cold."],["colors"]),
 topic("body","Vücut bölümleri",["recognition","listening"],[],["gap","gap","gap"],
  ["Temel vücut bölümlerini tanır.","Basit hareket komutlarıyla vücut adlarını eşler.","Vücut ve hareket ifadelerini bağlam içinde anlar."],
  ["head, hands","Touch your nose.","I hurt my knee."],[]),
 topic("weather","Hava durumu",["recognition","listening"],[],["gap","gap","gap"],
  ["Temel hava durumu kelimelerini tanır.","Hava durumunu kısa cümleyle belirtir.","Hava koşullarına göre planları açıklar."],
  ["sunny, rainy","It is cloudy today.","Although it was cloudy, we went out."],["colors"]),
 topic("calendar","Günler, aylar ve zaman",["recognition","listening","reading"],[],["gap","gap","gap"],
  ["Haftanın günlerini tanır.","Gün/saat ve günlük program ifadelerini anlar.","Zaman çizelgesini geçmiş/gelecek bağlamında anlatır."],
  ["Monday, Tuesday","at seven o'clock","next Friday afternoon"],["numbers"]),
 topic("hobbies","Hobiler ve serbest zaman",["recognition","listening","dialogue"],[],["gap","gap","gap"],
  ["Basit hobi kelimelerini tanır.","Sevdiği aktiviteleri kısa ifadelerle belirtir.","Hobi tercihlerini sebepleriyle açıklar."],
  ["draw, play","I like swimming.","I enjoy reading because it is relaxing."],["actions"]),
];
export const ENGLISH_CURRICULUM_OUTCOMES:readonly EnglishCurriculumOutcome[]=TOPIC_SEEDS.flatMap(seed=>
 ENGLISH_PLACEMENTS.map((placement,index)=>{
  const coverage=seed.coverage[index];
  return {
   id:`en.${seed.id}.${placement.toLowerCase()}`,
   topic:seed.id,topicTitleTr:seed.title,placement,
   descriptionTr:seed.descriptions[index],modelEnglish:seed.models[index],
   skills:seed.skills,coverage,
   surfaceIds:coverage==='gap'?[]:seed.surfaces,
   prerequisiteIds:[
    ...(index>0?[`en.${seed.id}.${ENGLISH_PLACEMENTS[index-1].toLowerCase()}`]:[]),
    ...seed.prerequisites.map(topic=>`en.${topic}.${placement.toLowerCase()}`)
   ],
   quality:'author-reviewed-content-pending-pedagogical-acceptance' as const
  };
 })
);
export const ENGLISH_CURRICULUM_TOPICS:readonly {id:EnglishTopicId;titleTr:string}[]=
 TOPIC_SEEDS.map(seed=>({id:seed.id,titleTr:seed.title}));
export function findEnglishOutcome(id:string):EnglishCurriculumOutcome|undefined{
 return ENGLISH_CURRICULUM_OUTCOMES.find(o=>o.id===id);
}
export function getEnglishCurriculum(input:{
 placement:EnglishPlacement;topics?:readonly EnglishTopicId[];islandId?:IslandId;
 includeGaps?:boolean;
}):readonly EnglishCurriculumOutcome[]{
 return ENGLISH_CURRICULUM_OUTCOMES.filter(o=>o.placement===input.placement&&
  (input.includeGaps!==false||o.coverage!=='gap')&&
  (!input.topics||input.topics.includes(o.topic))&&
  (!input.islandId||o.surfaceIds.some(id=>CURRICULUM_SURFACES.some(s=>s.id===id&&s.islandId===input.islandId))));
}
export function getEnglishCurriculumByIsland(
 islandId:IslandId,placement:EnglishPlacement
):readonly EnglishCurriculumOutcome[]{
 return getEnglishCurriculum({placement,islandId,includeGaps:false});
}
/** Informational prerequisites. Never infer mastery from stars or enforce locks. */
export function missingEnglishPrerequisites(
 outcomeId:string,verifiedOutcomeIds:readonly string[]
):readonly EnglishCurriculumOutcome[]{
 const outcome=findEnglishOutcome(outcomeId);
 if(!outcome)throw new RangeError('Unknown English curriculum outcome');
 const verified=new Set(verifiedOutcomeIds);
 return outcome.prerequisiteIds.filter(id=>!verified.has(id))
  .map(id=>findEnglishOutcome(id)!).filter(Boolean);
}
export function getEnglishCurriculumCoverage(){
 return ENGLISH_PLACEMENTS.map(placement=>({
  placement,
  authored:ENGLISH_CURRICULUM_OUTCOMES.filter(o=>o.placement===placement&&o.coverage==='authored').length,
  partial:ENGLISH_CURRICULUM_OUTCOMES.filter(o=>o.placement===placement&&o.coverage==='partial').length,
  gap:ENGLISH_CURRICULUM_OUTCOMES.filter(o=>o.placement===placement&&o.coverage==='gap').length
 }));
}
/** Strict, independent QA: unique IDs, valid surfaces, coherent DAG and no fake lessons. */
export function validateEnglishCurriculum():string[]{
 const errors:string[]=[];
 const seen=new Set<string>();
 const byId=new Map(ENGLISH_CURRICULUM_OUTCOMES.map(o=>[o.id,o]));
 const surfaces=new Set(CURRICULUM_SURFACES.map(s=>s.id));
 const topics=new Set(ENGLISH_CURRICULUM_TOPICS.map(t=>t.id));
 if(topics.size!==TOPIC_SEEDS.length)errors.push('Duplicate curriculum topic');
 if(surfaces.size!==CURRICULUM_SURFACES.length)errors.push('Duplicate teaching surface');
 for(const outcome of ENGLISH_CURRICULUM_OUTCOMES){
  if(seen.has(outcome.id))errors.push('Duplicate outcome '+outcome.id);
  seen.add(outcome.id);
  if(!outcome.descriptionTr||!outcome.modelEnglish||!outcome.skills.length)errors.push('Missing language objective '+outcome.id);
  if(outcome.coverage==='gap'&&outcome.surfaceIds.length)errors.push('Gap falsely mapped '+outcome.id);
  if(outcome.coverage!=='gap'&&!outcome.surfaceIds.length)errors.push('No playable surface '+outcome.id);
  if(outcome.surfaceIds.some(id=>!surfaces.has(id)))errors.push('Unknown surface '+outcome.id);
  if(new Set(outcome.prerequisiteIds).size!==outcome.prerequisiteIds.length)errors.push('Duplicate prerequisite '+outcome.id);
  if(outcome.prerequisiteIds.includes(outcome.id))errors.push('Self prerequisite '+outcome.id);
  for(const id of outcome.prerequisiteIds)if(!byId.has(id))errors.push('Missing prerequisite '+id);
 }
 const active=new Set<string>(),visited=new Set<string>();
 const visit=(id:string):void=>{
  if(active.has(id)){errors.push('Prerequisite cycle '+id);return;}
  if(visited.has(id))return;
  active.add(id);
  for(const dep of byId.get(id)?.prerequisiteIds??[])if(byId.has(dep))visit(dep);
  active.delete(id);visited.add(id);
 };
 for(const id of byId.keys())visit(id);
 return errors;
}
