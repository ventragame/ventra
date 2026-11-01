'use client';
import React, {useState} from 'react';
import { PLACEMENT_QUESTIONS, assessStarterVocabulary, type PlacementAnswer } from '@/lib/learning/placementCheck';
import { ANIMAL_MEADOW_WORDS } from '@/lib/learning/animalMissionEngine';
import { COLOR_GROVE_WORDS } from '@/lib/progress/colorGroveProgress';

export function StarterPlacementCheck({onApply,onCancel,saving}:{
  onApply:(suggested:'Pre-A1'|'A1')=>Promise<void>;onCancel:()=>void;saving:boolean;
}) {
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState<PlacementAnswer[]>([]);
  const [error,setError]=useState<string|null>(null);
  const question=PLACEMENT_QUESTIONS[index];
  const result=index>=PLACEMENT_QUESTIONS.length?assessStarterVocabulary(answers):null;
  const choose=(selected:string)=>{
    if(saving||!question)return;
    setAnswers(old=>[...old,{id:question.id,selected}]);setIndex(i=>i+1);
  };
  const apply=async()=>{
    if(!result)return;
    setError(null);
    try {await onApply(result.suggested)} catch {setError('Seviye tercihi kaydedilemedi. Tekrar deneyebilirsin.')}
  };
  return <section aria-label="İngilizce başlangıç kontrolü"
    className="rounded-2xl border border-lime-300/30 bg-sky-950/60 p-4 text-white">
    <h3 className="text-base font-black">🧭 Başlangıç Kelime Yoklaması</h3>
    <p className="mt-2 text-xs leading-relaxed text-slate-200">
      8 kısa görsel destekli soru. Bu bir CEFR veya okul sınavı değildir;
      sadece Pre-A1 / A1 başlangıç önerisi sunar. Cevaplar buluta gönderilmez.
    </p>
    {question&&<>
      <div className="my-4 flex justify-between text-xs font-bold text-lime-200">
        <span>Soru {index+1}/8</span><span>Kelimeyi İngilizce seç</span>
      </div>
      <div className="flex flex-col items-center rounded-2xl border border-white/20 bg-white/10 p-4">
        {question.domain==='animals'
          ? <img src={ANIMAL_MEADOW_WORDS.find(w=>w.id===question.id)?.image} alt={question.tr}
              width={110} height={110} className="h-28 w-28 object-contain"/>
          : <span className="h-24 w-24 rounded-3xl border-4 border-white/60 shadow-lg"
              role="img" aria-label={question.tr}
              style={{backgroundColor:COLOR_GROVE_WORDS.find(w=>w.id===question.id)?.hex}}/>}
        <p className="mt-3 text-xl font-black">{question.tr}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {question.choices.map(choice=><button key={choice} type="button" disabled={saving}
          onClick={()=>choose(choice)}
          className="min-h-14 rounded-xl border border-white/30 bg-white/10 p-2 text-sm font-black uppercase
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300
            hover:border-lime-200 disabled:opacity-50">{choice}</button>)}
      </div>
    </>}
    {result&&<div role="status" className="mt-4 space-y-3 rounded-xl border border-lime-200/30 bg-emerald-950/50 p-4">
      <h4 className="text-base font-black">{result.correct}/{result.total} doğru</h4>
      <p className="text-sm">{result.explanation}</p>
      <p className="text-xs text-slate-200">Öneri: {result.suggested}. İstersen seviye tercihini daha sonra manuel değiştirebilirsin.</p>
      {error&&<p role="alert" className="text-sm text-rose-200">{error}</p>}
      <button onClick={()=>void apply()} disabled={saving} className="min-h-12 w-full rounded-xl bg-lime-300 p-3 font-black text-emerald-950 disabled:opacity-50">
        {saving?'Kaydediliyor…':'Öneriyi Profile Kaydet'}
      </button>
    </div>}
    <button onClick={onCancel} disabled={saving} className="mt-3 min-h-11 w-full rounded-xl border border-white/25 p-2 text-sm font-bold">
      Yoklamadan Çık
    </button>
  </section>;
}
