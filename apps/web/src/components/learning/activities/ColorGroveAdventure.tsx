'use client';

import React, { useEffect, useRef, useState } from 'react';
import { COLOR_GROVE_WORDS, type ColorGroveProgress } from '@/lib/progress/colorGroveProgress';
import { planColorMission, getColorInstruction, getActiveColorQuestion, type PlannedColorMission, type EnglishPlacement } from '@/lib/learning/colorMissionEngine';
import type { ColorAnswerEvidence } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';
import {useAutoQuestionAdvance} from '@/lib/learning/useAutoQuestionAdvance';
import { EventBus } from '@/lib/game/EventBus';
import { ColorGroveScene } from './ColorGroveScene';
import { MobileColorGroveWorld } from './MobileColorGroveWorld';

type Word = (typeof COLOR_GROVE_WORDS)[number];
type Step = 1 | 2 | 3;

function pronounce(text:string,onError?:()=>void):void {
  soundService.speakEnglish(text,{rate:0.88,onError});
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
  onSave: (mission: number, mistakes: number, correct: number, duration: number, answers: ColorAnswerEvidence[], sessionId: string) => Promise<void>;
  profileId: string;
  englishLevel: EnglishPlacement;
  gradeLevel?:number|null;
}

export const ColorGroveAdventure: React.FC<Props> = ({ progress, onBack, onSave, profileId, englishLevel, gradeLevel=null }) => {
  const [step, setStep] = useState<Step>(() => Math.min(3, progress.completedLevels + 1) as Step);
  const [plan, setPlan] = useState<PlannedColorMission | null>(null);
  const [planIdentity, setPlanIdentity] = useState<string | null>(null);
  const [replayNonce, setReplayNonce] = useState(0);
  const [awaitingAdvance, setAwaitingAdvance] = useState(false);
  const [finishedAnswers, setFinishedAnswers] = useState<ColorAnswerEvidence[] | null>(null);
  const [answerHighlight, setAnswerHighlight] = useState<string | null>(null);
  const [wrongAnswerId, setWrongAnswerId] = useState<string | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [speechError, setSpeechError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [paintedIds, setPaintedIds] = useState<string[]>([]);
  const [muted, setMuted] = useState<boolean>(() => soundService.getMuted());
  const runId = useRef(`cg_${profileId}_${Date.now()}_${Math.random().toString(36).slice(2)}`);
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
  const answerLocked = useRef(false);
  const discoveredRef = useRef<Set<string>>(new Set());
  const lastWrongTap = useRef({id:'',at:0});

  // Before the async effect runs, React may render the previous stage's plan.
  // Discovery has zero questions; never read questions[0] on the quiz screen.
  const identity = `${profileId}:${englishLevel}:${gradeLevel??'unset'}:${step}:${replayNonce}`;
  const activePlan = planIdentity === identity && plan?.mission === step ? plan : null;
  const currentQuestion = getActiveColorQuestion(activePlan, step, question);
  const invalidPlan = Boolean(activePlan && !complete && (
    step === 1 ? activePlan.colors.length === 0 : currentQuestion === null
  ));

  useEffect(() => {
    let alive = true;
    setPlan(null);
    setPlanIdentity(null);
    setLoadError(false);
    import('@/lib/progress').then(({ getProgressRepository }) =>
      getProgressRepository().getColorAnswerHistory(profileId)
    ).then((history) => {
      if (alive) {
        setPlan(planColorMission({ mission: step, history, seed: Math.floor(Math.random() * 4294967295), englishLevel, gradeLevel }));
        setPlanIdentity(identity);
      }
    }).catch((err) => {
      console.error('Renk planı yüklenemedi', err);
      if (alive) setLoadError(true);
    });
    return () => { alive = false; };
  }, [step, profileId, englishLevel, replayNonce, identity]);

  useEffect(() => {
    setSpeechAvailable(soundService.hasEnglishSpeech());
  }, []);

  // On small screens, switching activities must return to the start of the
  // lesson, not leave the child scrolled to the previous mission's bottom.
  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    headingRef.current?.focus({ preventScroll: true });
  }, [step, replayNonce]);

  useEffect(() => {
    const onMute = (next: boolean) => {
      setMuted(next);
      if (next) soundService.cancelSpeech();
    };
    setMuted(soundService.getMuted());
    EventBus.on('MUTE_STATE_CHANGED', onMute);
    return () => {
      EventBus.off('MUTE_STATE_CHANGED', onMute);
      soundService.cancelSpeech();
    };
  }, []);

  useEffect(()=>{
    if(speechAvailable) setSpeechError(false);
  },[speechAvailable]);
  const toggleSound = () => {
    const next = soundService.toggleMute();
    setMuted(next);
    if (next) soundService.cancelSpeech();
    if (!next) soundService.playSfx('tap');
  };

  const reset = (next: Step) => {
    if (saving) return;
    setPlan(null);
    setPlanIdentity(null);
    setLoadError(false);
    locked.current = false;
    answerLocked.current = false;
    discoveredRef.current.clear();
    lastWrongTap.current = {id:'',at:0};
    startTime.current = Date.now();
    runId.current = `cg_${profileId}_${next}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setReplayNonce(value => value + 1);
    setAwaitingAdvance(false);
    setFinishedAnswers(null);
    setAnswerHighlight(null);
    setWrongAnswerId(null);
    setHintShown(false);
    setHintUsed(false);
    setSpeechError(false);
    soundService.cancelSpeech();
    setPaintedIds([]);
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
      await onSave(step, mistakes, nextCorrect, (Date.now() - startTime.current) / 1000, answers, runId.current);
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
    if (saving || complete || locked.current || answerLocked.current || !activePlan || !currentQuestion || awaitingAdvance) return;
    const target = currentQuestion.target;
    if (id !== target) {
      const now=Date.now();
      if(lastWrongTap.current.id===id&&now-lastWrongTap.current.at<280)return;
      lastWrongTap.current={id,at:now};
      setWrongAnswerId(id);
      setMistakes((value) => value + 1);
      setQuestionMistakes((value) => value + 1);
      soundService.playSfx('gentle_retry');
      setFeedback('Bu renk değil. Başka bir seçeneğe dokun veya yönergeyi tekrar dinle.');
      return;
    }
    answerLocked.current=true;
    soundService.playSfx('correct');
    setWrongAnswerId(null);
    const nextCorrect = correct + 1;
    setCorrect(nextCorrect);
    const answer: ColorAnswerEvidence = {
      wordId: target, mistakes: questionMistakes,
      firstTryCorrect: questionMistakes === 0 && !hintUsed,
      hintUsed,
      kind: 'recall', skill: step === 3 ? 'application' : 'recognition', timestamp: new Date().toISOString()
    };
    const nextEvidence = [...evidence, answer];
    setEvidence(nextEvidence);
    setQuestionMistakes(0);
    setAnswerHighlight(target);
    if (step === 3) setPaintedIds(list => [...list, target]);
    setFeedback('Doğru! ' + getWord(target).tr + ' = ' + target.toUpperCase());
    setAwaitingAdvance(true);
    if (question + 1 >= activePlan.questions.length) {
      setFinishedAnswers(nextEvidence);
    }
  };
  const advance = () => {
    if (!awaitingAdvance || saving) return;
    if (finishedAnswers) {
      void finish(correct, finishedAnswers);
    } else {
      setQuestion(value => value + 1);
      setFeedback(null);
      setAnswerHighlight(null);
      setWrongAnswerId(null);
      setHintShown(false);
      setHintUsed(false);
      setSpeechError(false);
      soundService.cancelSpeech();
      setAwaitingAdvance(false);
      answerLocked.current=false;
      lastWrongTap.current={id:'',at:0};
    }
  };
  useAutoQuestionAdvance({ready:awaitingAdvance,blocked:saving||complete||Boolean(saveError)||!activePlan,
    delayMs:1100,onAdvance:advance});
  const explore = (id: string) => {
    if (saving || complete) return;
    if (!muted) {
      setSpeechError(false);
      pronounce(id,()=>setSpeechError(true));
    }
    soundService.playSfx('tap');
    if (!discoveredRef.current.has(id)) {
      discoveredRef.current.add(id);
      setDiscovered((old) => [...old, id]);
      setEvidence((old) => [...old, { wordId: id, mistakes: 0, firstTryCorrect: false, kind: 'discovery', timestamp: new Date().toISOString() }]);
    }
  };
  const listen = (text:string) => {
    soundService.unlockAudio();
    setSpeechError(false);
    pronounce(text,()=>setSpeechError(true));
  };
  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Renk Korusu macerası"
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      className="cg-shell fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#10294a] via-[#234b65] to-[#123b37] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-lime-300/10 blur-3xl" />
      </div>
      <div className="cg-main relative mx-auto max-w-5xl px-3 py-4 sm:px-7 sm:py-6"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}>
        <header className="cg-hud flex flex-wrap items-center justify-between gap-2">
          <button onClick={onBack} disabled={saving} aria-label="Kelime Bahçesine dön"
            className="cg-hud-back vg-answer-card min-h-11 rounded-2xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm font-bold hover:bg-white/20 disabled:opacity-50 sm:px-4">
            ← <span className="cg-hud-back-label">Bahçeye Dön</span>
          </button>
          <div className="cg-hud-title cg-mobile-view" aria-label="Renk Korusu">
            <span aria-hidden="true">🎨</span><span><strong>RENK KORUSU</strong><small>{step}. görev / 3</small></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="cg-hud-points rounded-xl border border-lime-300/40 bg-lime-950/60 px-3 py-2.5 text-xs font-black text-lime-100">
              ⭐ {Object.values(progress.starsByLevel).reduce((sum, value) => sum + value, 0)} / 9
            </span>
            <button onClick={toggleSound} className="cg-hud-sound vg-answer-card min-h-11 rounded-xl border border-white/25 bg-white/10 px-3 text-sm font-bold hover:bg-white/20"
              aria-label={muted ? 'Sesi aç' : 'Sesi kapat'} aria-pressed={muted}>
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </header>
        <div className="cg-stage-intro py-4 text-center sm:py-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-lime-200">Büyülü Renkler Hikâyesi · Bölüm {step}/3</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-black tracking-tight outline-none sm:text-5xl">{names[step - 1]}</h1>
          <p className="cg-desktop-description mx-auto mt-2 max-w-xl text-sm leading-relaxed text-sky-100 sm:text-base">
            {step === 1 ? 'Lumi’nin korusunu keşfet. Her turda yeni renkleri bul; İngilizce adlarına dokun ve dinle.' :
            step === 2 ? 'Rengini kaybeden çiçeği kurtar! Gördüğün rengin İngilizce adını seç.' :
            'Koruya renkleri geri getir! İngilizce söylenen rengi boya paletinden bul.'}
          </p>
        </div>

        <div className="cg-mission-tabs mb-4 grid grid-cols-3 gap-2 sm:mb-5">
          {names.map((name, i) => (
            <button key={name}
              onClick={() => { if (i + 1 <= progress.completedLevels + 1) reset((i + 1) as Step); }}
              disabled={i + 1 > progress.completedLevels + 1 || saving}
              aria-current={step === i + 1 ? 'step' : undefined}
              className={`vg-answer-card min-h-14 rounded-xl border px-2 py-3 text-[11px] font-bold sm:text-sm ${step === i + 1 ? 'border-lime-200 bg-emerald-600/55' : 'border-white/20 bg-white/10'} disabled:opacity-40`}>
              {i + 1 <= progress.completedLevels ? '✓ ' : ''}{i + 1}. <span className="cg-tab-long">{name}</span><span className="cg-tab-short">{['Keşif','Eşleştir','Boya'][i]}</span>
            </button>
          ))}
        </div>

        {loadError && <div role="alert" className="mx-auto max-w-md space-y-3 rounded-2xl border border-rose-300/40 bg-rose-950 p-5 text-center">
          <p>Görev planı yüklenemedi. İlerlemen silinmedi.</p>
          <button onClick={() => reset(step)} className="vg-answer-card rounded-xl bg-lime-300 px-5 py-3 font-black text-emerald-950">Yeniden Dene</button>
        </div>}
        {!loadError && !activePlan && !complete && <div role="status" className="p-6 text-center">Yeni macera hazırlanıyor…</div>}
        {!loadError && invalidPlan && (
          <div role="alert" className="mx-auto max-w-md rounded-2xl border border-amber-300/50 bg-slate-950/70 p-5 text-center">
            <p className="mb-4 text-sm">Görev soruları yüklenemedi. Oyuncu kayıtların korunuyor.</p>
            <button onClick={() => reset(step)} className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-emerald-950">
              Görevi Yeniden Yükle
            </button>
          </div>
        )}
        {!loadError && !invalidPlan && (complete ? (
          <section className="cg-complete mx-auto max-w-3xl rounded-3xl border border-lime-300/50 bg-emerald-900/70 p-4 text-center shadow-xl sm:p-7">
            <div className="cg-desktop-view"><ColorGroveScene
              mode={step === 1 ? 'discovery' : step === 2 ? 'matching' : 'painting'}
              paintedIds={paintedIds}
              targetHex={currentQuestion ? getWord(currentQuestion.target).hex : undefined}
              highlight
            /></div>
            <div className="cg-mobile-view"><MobileColorGroveWorld mode="complete" paintedIds={paintedIds}/></div>
            <div className="mt-4 text-6xl" aria-hidden="true">🌟</div>
            <h2 className="mt-3 text-2xl font-black">Koru Canlandı!</h2>
            <p className="mt-2 text-sm text-emerald-100">Görev başarıyla kaydedildi.</p>
            <p className="mt-2 text-sm">Doğru: {correct} · Hatalı deneme: {mistakes}</p>
            <p className="mt-3 rounded-xl bg-lime-300/15 px-4 py-3 text-sm font-bold text-lime-100">
              ⭐ Bu görevdeki en iyi yıldızın: {progress.starsByLevel[step] ?? (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1)} / 3
            </p>
            <button onClick={() => {
              if (step === 3) onBack();
              else reset((step + 1) as Step);
            }} className="mt-6 w-full rounded-2xl bg-lime-300 px-5 py-4 font-black text-emerald-950">
              {step === 3 ? 'Bahçeye Dön →' : 'Sonraki Görev →'}
            </button>
            <button onClick={() => reset(step)} className="mt-3 w-full rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20">
              ↻ Bu Görevi Farklı Sorularla Tekrar Oyna
            </button>
            <button onClick={() => reset(1)} className="mt-3 w-full rounded-2xl border border-sky-200/40 bg-sky-400/15 px-5 py-3 text-sm font-bold text-sky-50 hover:bg-sky-400/25">
              🧭 Yeni Renk Keşif Turu · Kayıtlarım Korunsun
            </button>
          </section>
        ) : !activePlan ? null : step === 1 ? (
          <section className="cg-discovery-panel mx-auto max-w-4xl">
            <div className="cg-desktop-view"><ColorGroveScene mode="discovery" /></div>
            <div className="cg-mobile-view"><MobileColorGroveWorld
              mode="discovery" words={activePlan.colors.map(getWord)}
              discoveredIds={discovered} freshIds={activePlan.freshColorIds}
              disabled={saving} onChoose={explore}
            /></div>
            {speechError&&<p className="mb-2 rounded-xl border border-amber-300/50 bg-amber-900/60 p-2 text-xs text-amber-100" role="status">
              İngilizce ses oynatılamadı. Cihazın İngilizce ses paketini kontrol et; keşfe devam edebilirsin.
            </p>}
            <div className="cg-discovery-progress my-4 flex items-center justify-between rounded-xl border border-white/20 bg-black/20 px-4 py-3 text-sm font-bold">
              <span>🧭 Keşfedilen renkler</span>
              <span className="text-lime-200">{discovered.length} / {activePlan.colors.length}</span>
            </div>
            <p className="cg-discovery-caption mb-3 text-center text-sm font-semibold text-sky-100">
              {activePlan.encounteredCount} / {activePlan.eligibleCount} renk daha önce keşfedildi ·
              {activePlan.freshColorIds.length > 0 ? ` Bu tur ${activePlan.freshColorIds.length} yeni renk` : ' Pekiştirme turu'}
            </p>
            <div className="cg-desktop-view grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {activePlan.colors.map((id) => getWord(id)).map((word) => (
                <button key={word.id} onClick={() => explore(word.id)} disabled={saving}
                  aria-label={`${word.tr}, İngilizce ${word.id}, telaffuzu dinlemek için dokun`}
                  aria-pressed={discovered.includes(word.id)}
                  className={`vg-answer-card group min-h-40 rounded-3xl border bg-slate-950/35 p-3 text-center shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:p-4 ${discovered.includes(word.id) ? 'border-lime-300/80 bg-emerald-500/20' : 'border-white/25 hover:border-sky-200'}`}>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white/40 text-2xl shadow-2xl sm:h-24 sm:w-24" style={{ backgroundColor: word.hex }}>
                    {discovered.includes(word.id) && <span className="rounded-full bg-emerald-950/80 px-2 py-1 text-sm text-lime-100">✓</span>}
                  </div>
                  <div className="mt-3 text-base font-black tracking-wide">{word.id.toUpperCase()} {speechAvailable && !muted && <span aria-hidden="true">🔊</span>}</div>
                  <div className="text-sm text-white/80">{word.tr}</div>
                  {activePlan.freshColorIds.includes(word.id) && <span className="mt-2 inline-block rounded-full border border-lime-200/50 bg-lime-400/20 px-3 py-1 text-[10px] font-black text-lime-100">YENİ KEŞİF</span>}
                </button>
              ))}
            </div>
            <button onClick={() => void finish(discovered.length)} disabled={saving || complete || discovered.length !== activePlan.colors.length}
              className="vg-answer-card mt-5 min-h-14 w-full rounded-2xl bg-lime-300 px-5 py-4 font-black text-emerald-950 shadow-[0_8px_30px_rgba(190,242,100,0.2)] disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? 'Kaydediliyor…' : `Renkleri Tamamla (${discovered.length}/${activePlan.colors.length})`}
            </button>
          </section>
        ) : currentQuestion ? (
          <section className="cg-quiz-panel mx-auto max-w-4xl rounded-3xl border border-white/20 bg-slate-950/20 p-3 sm:p-6">
            <div className="cg-mission-top mb-3 flex items-center justify-between gap-2 text-sm font-bold text-lime-100">
              <span>🪄 Lumi’nin Görevi</span>
              <span aria-label={`Soru ${question + 1} / ${activePlan.questions.length}`}>{question + 1} / {activePlan.questions.length}</span>
            </div>
            {activePlan.reviewColorIds.length > 0 && (
              <p className="cg-review-caption mb-3 rounded-xl border border-sky-200/25 bg-sky-950/40 p-2 text-center text-xs font-bold text-sky-100">
                🔁 Hatırlama turu: {activePlan.reviewColorIds.length} renk daha pekiştiriliyor
              </p>
            )}
            <div aria-hidden="true" className="cg-progress-track mb-5 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-lime-300 to-sky-300 transition-all" style={{ width: `${Math.round(((question + Number(awaitingAdvance)) / activePlan.questions.length) * 100)}%` }} />
            </div>
            <div className="cg-desktop-view"><ColorGroveScene
              mode={step === 2 ? 'matching' : 'painting'}
              targetHex={getWord(currentQuestion.target).hex}
              paintedIds={paintedIds}
              highlight={awaitingAdvance}
              variant={currentQuestion.scene}
            /></div>
            <div className="cg-mission-prompt my-4 rounded-2xl border border-white/20 bg-[#103b47]/90 p-3 text-center sm:p-4">
              <div className="cg-prompt-copy">
              <h2 className="text-xl font-black tracking-wide sm:text-2xl">
                {getColorInstruction(currentQuestion.target, step, englishLevel).title}
              </h2>
              <p className="mt-1 text-sm text-slate-100">
                {getColorInstruction(currentQuestion.target, step, englishLevel).guide}
              </p>
              </div>
              <button disabled={muted || !speechAvailable} onClick={() => listen(getColorInstruction(currentQuestion.target, step, englishLevel).speech)}
                aria-label="İngilizce yönergeyi dinle"
                className="cg-prompt-listen vg-answer-card mt-3 min-h-11 rounded-full border border-sky-200/40 bg-sky-300/15 px-5 text-sm font-black disabled:opacity-45">
                {muted ? '🔇' : speechAvailable ? '🔊' : '🔇'} <span className="cg-prompt-listen-label">{muted ? 'Ses Kapalı' : speechAvailable ? 'Dinle' : 'Bu cihazda ses yok'}</span>
              </button>
              {step === 2 && (
                <div className="cg-hint-wrap mt-3">
                  <button type="button" disabled={awaitingAdvance} onClick={() => {
                    setHintShown(value => !value);
                    setHintUsed(true);
                  }}
                    aria-expanded={hintShown} className="vg-answer-card min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold disabled:opacity-50">
                    {hintShown ? 'Türkçe İpucunu Gizle' : 'Renkleri Ayırt Etmek İçin Türkçe İpucu'}
                  </button>
                  {hintShown && <p role="status" className="mt-2 text-sm font-bold text-lime-100">
                    Bu rengin Türkçe adı: {getWord(currentQuestion.target).tr}
                  </p>}
                </div>
              )}
            </div>
            {speechError && <p role="status" className="mb-2 rounded-xl border border-amber-300/40 bg-amber-900/40 px-3 py-2 text-xs text-amber-100">
              İngilizce ses oynatılamadı; cihazın ses paketini kontrol et. Soruları yazılı olarak cevaplayabilirsin.
            </p>}
            <div className="cg-mobile-view">
              <MobileColorGroveWorld
                mode={step === 2 ? 'matching' : 'painting'}
                words={currentQuestion.choices.map(getWord)}
                targetHex={getWord(currentQuestion.target).hex}
                paintedIds={paintedIds}
                correctId={answerHighlight} wrongId={wrongAnswerId}
                disabled={saving || awaitingAdvance} onChoose={choose}
              />
            </div>
            <div className="cg-desktop-view grid grid-cols-3 gap-2 sm:gap-3">
              {currentQuestion.choices.map((id) => {
                const word = getWord(id);
                return (
                  <button key={id} onClick={() => choose(id)} disabled={saving || awaitingAdvance}
                    aria-label={step === 2 ? `${word.id} rengini seç` : `${word.tr} rengini seç`}
                    aria-pressed={answerHighlight === id}
                    className={`vg-answer-card min-h-24 rounded-2xl border bg-slate-950/45 p-2 text-center transition hover:scale-[1.02] disabled:opacity-60 sm:min-h-28 sm:p-4 ${answerHighlight === id ? 'border-lime-300 bg-lime-300/20 ring-2 ring-lime-300/60' : wrongAnswerId === id ? 'border-rose-300 bg-rose-500/20 ring-2 ring-rose-300/50' : 'border-white/25 hover:border-yellow-200'}`}>
                    {step === 3 && <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/40 shadow-lg" style={{ background: word.hex }}>
                      <span className="text-xl drop-shadow-lg" aria-hidden="true">🖌️</span>
                    </div>}
                    <div className="text-xs font-black sm:text-lg">{step === 2 ? word.id.toUpperCase() : word.tr}</div>
                  </button>
                );
              })}
            </div>
            <div className="cg-feedback mt-5 min-h-12 text-center text-sm font-semibold">
              {feedback && <p role="status" aria-live="polite"
                className={`rounded-xl px-4 py-3 ${awaitingAdvance ? 'text-lime-100' : 'text-amber-100'}`}>
                {feedback}
              </p>}
              {awaitingAdvance&&!saveError&&<p role="status" aria-live="polite"
                className="mt-2 rounded-xl border border-lime-300/40 bg-emerald-900/40 px-5 py-3 text-sm font-black text-lime-100">
                ✨ {question+1===activePlan.questions.length?'Görev sonucu kaydediliyor…':'Yeni renk geliyor…'}
              </p>}
            </div>
          </section>
        ) : null)}
        {saveError && <div role="alert" className="mx-auto mt-4 max-w-lg rounded-xl border border-red-300 bg-red-950/80 p-4 text-center text-sm">
          {saveError} <button disabled={saving} className="ml-3 min-h-11 font-black underline disabled:opacity-50" onClick={() => void finish(correct, finishedAnswers ?? evidence)}>Tekrar Kaydet</button>
        </div>}
<p className="cg-footer py-5 text-center text-xs text-sky-100/70">Sesli telaffuz cihazın konuşma motorunu kullanır. Ses açılmasa da bütün görevler yazılı olarak oynanabilir. Kayıt tamamlanmadan yıldız verilmez.</p>
      </div>
    </div>
  );
};
