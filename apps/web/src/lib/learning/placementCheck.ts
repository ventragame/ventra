/**
 * P3 starter check: eight illustrated vocabulary prompts, not a formal
 * language examination. Does not claim to certify CEFR A1/A2.
 * No personal answers are uploaded; the parent chooses whether to apply
 * the suggested starter level to the existing profile.
 */
export const PLACEMENT_QUESTIONS = [
  { id:'red', domain:'colors', tr:'Kırmızı', choices:['red','blue','green'] },
  { id:'cat', domain:'animals', tr:'Kedi', choices:['cat','dog','bird'] },
  { id:'yellow', domain:'colors', tr:'Sarı', choices:['pink','yellow','purple'] },
  { id:'dog', domain:'animals', tr:'Köpek', choices:['rabbit','cow','dog'] },
  { id:'green', domain:'colors', tr:'Yeşil', choices:['green','orange','blue'] },
  { id:'bird', domain:'animals', tr:'Kuş', choices:['fish','bird','cat'] },
  { id:'orange', domain:'colors', tr:'Turuncu', choices:['purple','orange','yellow'] },
  { id:'rabbit', domain:'animals', tr:'Tavşan', choices:['horse','rabbit','sheep'] }
] as const;
export type PlacementAnswer = {id:string;selected:string};
export interface PlacementResult {
  total:number;
  correct:number;
  suggested:'Pre-A1'|'A1';
  explanation:string;
}
export function assessStarterVocabulary(answers:readonly PlacementAnswer[]):PlacementResult {
  const unique=new Map<string,string>();
  for(const answer of answers){
    if(PLACEMENT_QUESTIONS.some(q=>q.id===answer.id) && !unique.has(answer.id))
      unique.set(answer.id,answer.selected);
  }
  if(unique.size!==PLACEMENT_QUESTIONS.length)throw new Error('Başlangıç kontrolü tamamlanmadı.');
  const correct=PLACEMENT_QUESTIONS.filter(q=>unique.get(q.id)===q.id).length;
  return {correct,total:PLACEMENT_QUESTIONS.length,suggested:correct>=7?'A1':'Pre-A1',
    explanation:correct>=7?'Temel kelimelerde güçlü başlangıç. A1 içerik denenebilir.':
      'Önce görsel destekli başlangıç kelimeleri önerilir.'};
}
