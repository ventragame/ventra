'use client';

import React, { useEffect, useRef, useState } from 'react';
import { COLOR_GROVE_WORDS, type ColorGroveProgress } from '@/lib/progress/colorGroveProgress';
import { planColorMission, getColorInstruction, type PlannedColorMission, type EnglishPlacement } from '@/lib/learning/colorMissionEngine';
import type { ColorAnswerEvidence } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';

type Word = (typeof COLOR_GROVE_WORDS)[number];
type Step = 1 | 2 | 3;

function pronounce(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'en-US';
  voice.rate = 0.8;
  window.speechSynthesis.speak(voice);
}
function getWord(id: string): Word {
  const word = COLOR_GROVE_WORDS.find((item) => item.id === id);
  if (!word) throw new Error('Unknown color: ' + id);
  return word;
}
const names = ['Renkleri Keşfet', 'Kelimeyi Eşleştir', 'Ormanı Renklendir'] as const;

interface Props {
  progress: ColorGroveProgress;
  onBack: () => void;
  onSave: (mission: number, mistakes: number, correct: number, duration: number, answers: ColorAnswerEvidence[]) => Promise<void>;
  profileId: string;
  englishLevel: EnglishPlacement;
}

export const ColorGroveAdventure: React.FC<Props> = ({ progress, onBack, onSave, profileId, englishLevel }) => {
  const [step, setStep] = useState<Step>(() => Math.min(3, progress.completedLevels + 1) as Step);
  const [plan, setPlan] = useState<PlannedColorMission | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [evidence, setEvidence] = useState<ColorAnswerEvidence[]>([]);
  const [questionMistakes, setQuestionMistakes] = useState(0);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [question, setQuestion] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const startTime = useRef(Date.now());
  const locked = useRef(false);

  useEffect(() => {
    let alive = true;
    setPlan(null);
    setLoadError(false);
    import('@/lib/progress').then(({ getProgressRepository }) =>
      getProgressRepository().getColorAnswerHistory(profileId)
    ).then((history) => {
      if (alive) setPlan(planColorMission({ mission: step, history, seed: Math.floor(Math.random() * 4294967295), englishLevel }));
    }).catch((err) => {
      console.error('Renk planı yüklenemedi', err);
      if (alive) setLoadError(true);
    });
    return () => { alive = false; };
  }, [step, profileId, englishLevel, complete]);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const reset = (next: Step) => {
    locked.current = false;
    startTime.current = Date.now();
    setStep(next);
    setDiscovered([]);
    setEvidence([]);
    setQuestionMistakes(0);
    setQuestion(0);
    setMistakes(0);
    setCorrect(0);
    setFeedback(null);
    setSaveError(null);
    setComplete(false);
  };
  const finish = async (nextCorrect: number, answers: ColorAnswerEvidence[] = evidence) => {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(step, mistakes, nextCorrect, (Date.now() - startTime.current) / 1000, answers);
      soundService.playSfx('fanfare');
      setComplete(true);
    } catch (error) {
      console.error('Color Grove could not save mission', error);
      setSaveError('İlerleme kaydedilemedi. Tekrar dene.');
      locked.current = false;
    } finally {
      setSaving(false);
    }
  };
  const choose = (id: string) => {
    if (saving || complete || locked.current || feedback || !plan) return;
    const target = plan.questions[question].target;
    if (id !== target) {
      setMistakes((value) => value + 1);
      setQuestionMistakes((value) => value + 1);
      soundService.playSfx('gentle_retry');
      setFeedback('Bir daha dene. Renk kelimesini dikkatle oku veya dinle.');
      return;
    }
    soundService.playSfx('correct');
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    const answer: ColorAnswerEvidence = { wordId: target, mistakes: questionMistakes, firstTryCorrect: questionMistakes === 0, kind: 'recall', timestamp: new Date().toISOString() };
    const nextEvidence = [...evidence, answer];
    setEvidence(nextEvidence);
    setQuestionMistakes(0);
    setFeedback('Doğru! ' + getWord(target).tr + ' = ' + target.toUpperCase());
    if (question + 1 >= plan.questions.length) {
      void finish(nextCorrect, nextEvidence);
    } else {
      setQuestion((value) => value + 1);
    }
  };
  const explore = (id: string) => {
    pronounce(id);
    soundService.playSfx('tap');
    if (!discovered.includes(id)) {
      setDiscovered((old) => [...old, id]);
      setEvidence((old) => [...old, { wordId: id, mistakes: 0, firstTryCorrect: false, kind: 'discovery', timestamp: new Date().toISOString() }]);
    }
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Renk Korusu macerası"
      className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-violet-950 via-fuchsia-950 to-emerald-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBack} className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20">
            ← Bahçeye Dön
          </button>
          <div className="rounded-xl bg-black/30 px-4 py-2 text-sm font-bold">🎨 Renk Korusu · {step}/3</div>
        </header>
        <div className="py-6 text-center">
          <div className="text-5xl" aria-hidden="true">🌈</div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">{names[step - 1]}</h1>
          <p className="mt-2 text-sm text-white/80">
            {step === 1 ? 'Altı rengi keşfet; dokun ve İngilizce telaffuzlarını dinle.' :
            step === 2 ? 'Gösterilen rengin İngilizce karşılığını bul.' :
            'Doğru renkleri seçerek korunun renklerini geri getir.'}
          </p>
        </div>

        <div className="mb-7 grid grid-cols-3 gap-2">
          {names.map((name, i) => (
            <button key={name}
              onClick={() => { if (i + 1 <= progress.completedLevels + 1) reset((i + 1) as Step); }}
              disabled={i + 1 > progress.completedLevels + 1 || saving}
              className={`rounded-xl border px-2 py-3 text-xs font-bold sm:text-sm ${step === i + 1 ? 'border-yellow-200 bg-fuchsia-500/40' : 'border-white/20 bg-white/10'} disabled:opacity-40`}>
              {i + 1 <= progress.completedLevels ? '✓ ' : ''}{i + 1}. {name}
            </button>
          ))}
        </div>

        {loadError && <div role="alert" className="rounded-xl bg-rose-950 p-5 text-center">Görev yüklenemedi. Bahçeye dönüp tekrar dene.</div>}
        {!loadError && !plan && !complete && <div role="status" className="p-6 text-center">Yeni macera hazırlanıyor…</div>}
        {!loadError && (complete ? (
          <section className="mx-auto max-w-lg rounded-3xl border border-lime-300/50 bg-emerald-900/70 p-7 text-center shadow-xl">
            <div className="text-6xl">🌟</div>
            <h2 className="mt-3 text-2xl font-black">Görev Tamamlandı!</h2>
            <p className="mt-2 text-sm">Doğru: {correct} · Hatalı deneme: {mistakes}</p>
            <button onClick={() => {
              if (step === 3) onBack();
              else reset((step + 1) as Step);
            }} className="mt-6 w-full rounded-2xl bg-lime-300 px-5 py-4 font-black text-emerald-950">
              {step === 3 ? 'Bahçeye Dön →' : 'Sonraki Görev →'}
            </button>
          </section>
        ) : !plan ? null : step === 1 ? (
          <section className="mx-auto max-w-3xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {plan.colors.map((id) => getWord(id)).map((word) => (
                <button key={word.id} onClick={() => explore(word.id)}
                  className="rounded-3xl border border-white/20 bg-white/10 p-4 text-center transition-transform hover:-translate-y-1">
                  <div className="mx-auto h-20 w-20 rounded-full border-4 border-white/40 shadow-2xl sm:h-28 sm:w-28" style={{ backgroundColor: word.hex }} />
                  <div className="mt-3 text-lg font-black">{word.id.toUpperCase()} 🔊</div>
                  <div className="text-sm text-white/70">{word.tr}</div>
                  {discovered.includes(word.id) && <div className="mt-2 text-xs text-lime-300">✓ Keşfedildi</div>}
                </button>
              ))}
            </div>
            <button onClick={() => void finish(discovered.length)} disabled={saving || discovered.length !== plan.colors.length}
              className="mt-5 w-full rounded-2xl bg-lime-300 px-5 py-4 font-black text-emerald-950 disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? 'Kaydediliyor…' : `Renkleri Tamamla (${discovered.length}/${plan.colors.length})`}
            </button>
          </section>
        ) : (
          <section className="mx-auto max-w-3xl rounded-3xl border border-white/20 bg-black/20 p-5 sm:p-8">
            <div className="mb-4 text-center text-sm font-bold text-lime-200">
              Görev {question + 1} / {plan.questions.length}
            </div>
            <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full border-8 border-white/30 shadow-2xl sm:h-40 sm:w-40"
              style={{ background: step === 2 ? getWord(plan.questions[question].target).hex : 'rgba(255,255,255,0.12)' }}>
              {step === 3 && <span className="text-5xl">🌳</span>}
            </div>
            <h2 className="mb-5 text-center text-xl font-black">
              {getColorInstruction(plan.questions[question].target, step, englishLevel).title}
            </h2>
            {step === 3 && <p className="mb-3 text-center text-sm text-sky-100">{getColorInstruction(plan.questions[question].target, step, englishLevel).guide}</p>}
            {step === 3 && <button onClick={() => pronounce(getColorInstruction(plan.questions[question].target, step, englishLevel).speech)}
              className="mx-auto mb-5 block rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold">
              🔊 Yönergeyi Dinle
            </button>}
            <div className="grid grid-cols-3 gap-3">
              {plan.questions[question].choices.map((id) => {
                const word = getWord(id);
                return (
                  <button key={id} onClick={() => choose(id)}
                    className="rounded-2xl border border-white/25 bg-white/10 p-3 text-center hover:border-yellow-200 sm:p-5">
                    {step === 3 && <div className="mx-auto mb-3 h-14 w-14 rounded-full border-4 border-white/40" style={{ background: word.hex }} />}
                    <div className="text-sm font-black sm:text-xl">{step === 2 ? word.id.toUpperCase() : word.tr}</div>
                  </button>
                );
              })}
            </div>
            <div aria-live="polite" className="mt-5 min-h-12 text-center text-sm font-semibold text-yellow-100">
              {feedback && (
                <button className="rounded-xl bg-white/10 px-5 py-3" onClick={() => setFeedback(null)}>
                  {feedback} · Devam etmek için dokun
                </button>
              )}
            </div>
          </section>
        ))}
        {saveError && <div role="alert" className="mx-auto mt-4 max-w-lg rounded-xl border border-red-300 bg-red-950/80 p-4 text-center text-sm">
          {saveError} <button className="ml-3 font-black underline" onClick={() => void finish(correct)}>Tekrar Kaydet</button>
        </div>}
        <p className="py-7 text-center text-xs text-white/55">Sesli telaffuz cihazın tarayıcı ses motorunu kullanır. Ses desteği yoksa yazılı seçenekler kullanılabilir.</p>
      </div>
    </div>
  );
};
