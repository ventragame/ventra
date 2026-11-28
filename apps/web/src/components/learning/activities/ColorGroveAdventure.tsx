'use client';

import React, { useEffect, useRef, useState } from 'react';
import {useQuestionFocus} from './useQuestionFocus';
import { COLOR_GROVE_WORDS, type ColorGroveProgress } from '@/lib/progress/colorGroveProgress';
import { planColorMission, getColorInstruction, getActiveColorQuestion, type PlannedColorMission, type EnglishPlacement } from '@/lib/learning/colorMissionEngine';
import type { ColorAnswerEvidence } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';
import {useAutoQuestionAdvance} from '@/lib/learning/useAutoQuestionAdvance';
import { EventBus } from '@/lib/game/EventBus';
import './garden-game-foundation.css';
import {GardenHelp} from '../GardenHelp';
import { MobileColorGroveWorld } from './MobileColorGroveWorld';
import './color-grove-premium.css';
import {LearningMotion} from '@/components/learning/motion/LearningMotion';
import {GameFinale} from '../GameFinale';
import {GameTopBar,GameStepRail,GameResult} from '../game/GameFrame';

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
  const questionHeading = useQuestionFocus<HTMLHeadingElement>(`${step}:${question}`);
  const [mistakes, setMistakes] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; good: boolean; detail?: string; lang?: 'en' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  // Same rule for the end-of-mission panel: the last answer is gone with it.
  const doneHeading = useQuestionFocus<HTMLHeadingElement>(complete ? 'done' : 'play');
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
      setFeedback({ text: 'Bir daha dene! 🎨', good: false, detail: 'Yönergeyi yeniden dinleyebilirsin.' });
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
    setFeedback({ text: '✨ ' + target.toUpperCase() + '!', good: true, lang: 'en', detail: getWord(target).tr });
    // Matching rounds show a colour and ask for its name: the right answer is
    // also heard once, as in the other worlds. Painting rounds already played it.
    if (step === 2 && !muted) pronounce(target);
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
  // Discovery saves automatically after the final tapped color; reward screens
  // between chapters still require an intentional next-mission choice.
  useAutoQuestionAdvance({
    ready:step===1&&Boolean(activePlan?.colors.length)&&discovered.length===activePlan?.colors.length,
    blocked:saving||complete||Boolean(saveError)||!activePlan,
    delayMs:900,onAdvance:()=>{void finish(discovered.length);}
  });
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
  // The words this mission practised, for the tap-to-hear recap on the reward screen.
  const recap: Word[] = (activePlan ? (step === 1 ? activePlan.colors : Array.from(new Set(activePlan.questions.map(q => q.target)))) : [])
    .map(id => getWord(id));
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
      className="cg-shell cg4-shell gg-game-shell fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#10294a] via-[#234b65] to-[#123b37] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-lime-300/10 blur-3xl" />
      </div>
      <GameTopBar island="garden" gameExit backClassName="gg-game-control" backDisabled={saving} onBack={onBack}
        backLabel="Bölgeler" backAriaLabel="Kelime Bahçesi bölgelerine dön" crest="🎨" accent="#ffb3d9"
        eyebrow="Kelime Bahçesi" title="Renk Korusu" titleAs="p"
        progress={!complete && activePlan ? (step === 1
          ? { current: discovered.length, total: activePlan.colors.length, label: 'Keşif' }
          : { current: question + 1, total: activePlan.questions.length, label: 'Soru' }) : undefined}
        stars={{ earned: Object.values(progress.starsByLevel).reduce((sum, value) => sum + value, 0), total: 9 }}
        tools={<>
          <GardenHelp label="Renk Korusu nasıl oynanır?">
            <p>{step === 1 ? 'Lumi’nin korusunu keşfet. Her turda yeni renkleri bul; İngilizce adlarına dokun ve dinle.' :
            step === 2 ? 'Rengini kaybeden çiçeği kurtar! Gördüğün rengin İngilizce adını seç.' :
            'Koruya renkleri geri getir! İngilizce söylenen rengi boya paletinden bul.'}</p>
            <p>Ses açılmasa da bütün görevler yazılı olarak oynanabilir. Yıldızlar görev kaydedilince verilir.</p>
          </GardenHelp>
          <button type="button" onClick={toggleSound} className="gf-tool gg-game-control"
            aria-label={muted ? 'Sesi aç' : 'Sesi kapat'} aria-pressed={muted}>
            {muted ? '🔇' : '🔊'}
          </button>
        </>}/>
      <div className="cg-main relative mx-auto max-w-5xl px-3 py-4 sm:px-7 sm:py-6"
        style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}>
        <div className="cg-stage-intro sr-only">
          <p>Büyülü Renkler Hikâyesi · Bölüm {step}/3</p>
          <h1 ref={headingRef} tabIndex={-1} className="outline-none">{names[step - 1]}</h1>
        </div>
        <GameStepRail island="garden" className="cg-mission-tabs" ariaLabel="Renk Korusu görevleri"
          steps={names.map((name, i) => {
            const order = (i + 1) as Step, locked = order > progress.completedLevels + 1;
            return { key: name, label: name, short: ['Keşif','Eşleştir','Boya'][i], className: 'gg-game-control',
              state: step === order ? 'current' : locked ? 'locked' : order <= progress.completedLevels ? 'done' : 'upcoming',
              disabled: saving, onSelect: () => { if (!locked) reset(order); } };
          })}/>

        {loadError && <div role="alert" className="mx-auto max-w-md space-y-3 rounded-2xl border border-rose-300/40 bg-rose-950 p-5 text-center">
          <p>Görev planı yüklenemedi. İlerlemen silinmedi.</p>
          <button type="button" onClick={() => reset(step)} className="gf-btn gf-btn--primary">Yeniden Dene</button>
        </div>}
        {!loadError && !activePlan && !complete && <div role="status" className="p-6 text-center">Yeni macera hazırlanıyor…</div>}
        {!loadError && invalidPlan && (
          <div role="alert" className="mx-auto max-w-md rounded-2xl border border-amber-300/50 bg-slate-950/70 p-5 text-center">
            <p className="mb-4 text-sm">Görev soruları yüklenemedi. Oyuncu kayıtların korunuyor.</p>
            <button type="button" onClick={() => reset(step)} className="gf-btn gf-btn--primary">
              Görevi Yeniden Yükle
            </button>
          </div>
        )}
        {!loadError && !invalidPlan && (complete ? (
          <GameResult island="garden" className="cg-complete" titleRef={doneHeading}
            art={<><LearningMotion variant="victory" trigger={complete?'grove-complete-'+step+'-'+replayNonce:null}/>
              <MobileColorGroveWorld mode="complete" paintedIds={paintedIds}/></>}
            kicker={'Renk Korusu · '+names[step - 1]} title="Koru Canlandı!"
            stars={{ earned: progress.starsByLevel[step] ?? (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1) }}
            message={<>Görev başarıyla kaydedildi. <span className="cg-done-stats">{step === 1 ? `${discovered.length} rengin İngilizce adını dinledin` : `${correct} doğru · ${mistakes} yanlış deneme`}</span></>}
            actions={<>
              <button type="button" onClick={() => {
                if (step === 3) onBack();
                else reset((step + 1) as Step);
              }} className="gf-btn gf-btn--primary gg-game-control">
                {step === 3 ? 'Bahçeye Dön →' : 'Sonraki Görev →'}
              </button>
              <button type="button" onClick={() => reset(step)} className="gf-btn gf-btn--secondary gg-game-control">
                ↻ Bu Görevi Farklı Sorularla Tekrar Oyna
              </button>
              <button type="button" onClick={() => reset(1)} className="gf-btn gf-btn--secondary gg-game-control">
                🧭 Yeni Renk Keşif Turu · Kayıtlarım Korunsun
              </button>
            </>}>
            {recap.length > 0 && <div className="cg-recap" role="group" aria-label="Bu görevin İngilizce renkleri">
              <p className="cg-recap-title">Bu görevin renkleri · dokun ve dinle</p>
              <div className="cg-recap-list">{recap.map(word => <button key={word.id} type="button" className="cg-recap-word gg-game-control"
                onClick={() => listen(word.id)} disabled={muted || !speechAvailable} aria-label={`${word.tr}, İngilizce ${word.id}, dinle`}>
                <span className="cg-recap-swatch" style={{ '--cg4-color': word.hex } as React.CSSProperties} aria-hidden="true"/>
                <span lang="en">{word.id}</span></button>)}</div>
            </div>}
            {step === 3 && <GameFinale tone="dark" title="Renk Korusu tamamlandı!"
              detail="Üç görevin hepsinde İngilizce renkleri çalıştın." />}
          </GameResult>
        ) : !activePlan ? null : step === 1 ? (
          <section className="cg-discovery-panel mx-auto max-w-4xl">
            <MobileColorGroveWorld
              mode="discovery" words={activePlan.colors.map(getWord)}
              discoveredIds={discovered} freshIds={activePlan.freshColorIds}
              disabled={saving} onChoose={explore}
            />
            {speechError&&<p className="mb-2 rounded-xl border border-amber-300/50 bg-amber-900/60 p-2 text-xs text-amber-100" role="status">
              İngilizce ses oynatılamadı. Cihazın İngilizce ses paketini kontrol et; keşfe devam edebilirsin.
            </p>}
            <p className="sr-only">
              {activePlan.encounteredCount} / {activePlan.eligibleCount} renk daha önce keşfedildi ·
              {activePlan.freshColorIds.length > 0 ? ` Bu tur ${activePlan.freshColorIds.length} yeni renk` : ' Pekiştirme turu'}
            </p>
            <p className="cg4-discovery-note" role="status" aria-live="polite">
              {discovered.length === activePlan.colors.length
                ? (saving ? 'Keşif kaydediliyor…' : 'Tüm renkler keşfedildi! Görev otomatik tamamlanıyor…')
                : 'Çiçeklere dokun; İngilizce isimlerini keşfet. Son renkten sonra görev kendiliğinden tamamlanır.'}
            </p>
          </section>
        ) : currentQuestion ? (
          <section className="cg-quiz-panel mx-auto max-w-4xl rounded-3xl border border-white/20 bg-slate-950/20 p-3 sm:p-6">
            <div className="cg-mission-top mb-3 flex items-center justify-between gap-2 text-sm font-bold text-lime-100">
              <span>🪄 Lumi’nin Görevi</span>
              <span className="cg-quest-meta">{activePlan.reviewColorIds.length > 0 && <span className="cg-review-chip">🔁 Hatırlama<span className="sr-only">: {activePlan.reviewColorIds.length} renk daha pekiştiriliyor</span></span>}
              </span>
            </div>
            <div className="cg-mission-prompt my-4 rounded-2xl border border-white/20 bg-[#103b47]/90 p-3 text-center sm:p-4">
              <div className="cg-prompt-copy">
              <h2 ref={questionHeading} tabIndex={-1} lang={step === 3 ? 'en' : undefined} className="text-xl font-black tracking-wide sm:text-2xl">
                {getColorInstruction(currentQuestion.target, step, englishLevel).title}
              </h2>
              <p className="sr-only">
                {getColorInstruction(currentQuestion.target, step, englishLevel).guide}
              </p>
              </div>
              <button disabled={muted || !speechAvailable} onClick={() => listen(getColorInstruction(currentQuestion.target, step, englishLevel).speech)}
                aria-label="İngilizce yönergeyi dinle"
                className="cg-prompt-listen gf-btn gf-btn--tool mt-3">
                {muted ? '🔇' : speechAvailable ? '🔊' : '🔇'} <span className="cg-prompt-listen-label">{muted ? 'Ses Kapalı' : speechAvailable ? 'Dinle' : 'Bu cihazda ses yok'}</span>
              </button>
              {step === 2 && (
                <div className="cg-hint-wrap mt-3">
                  <button type="button" disabled={awaitingAdvance} onClick={() => {
                    setHintShown(value => !value);
                    setHintUsed(true);
                  }}
                    aria-expanded={hintShown} className="gf-btn gf-btn--tool">
                    {hintShown ? 'İpucunu gizle' : '💡 Türkçe ipucu'}
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
            <MobileColorGroveWorld
                mode={step === 2 ? 'matching' : 'painting'}
                words={currentQuestion.choices.map(getWord)}
                targetHex={getWord(currentQuestion.target).hex}
                paintedIds={paintedIds} variant={currentQuestion.scene}
                correctId={answerHighlight} wrongId={wrongAnswerId}
                disabled={saving || awaitingAdvance} onChoose={choose}
                toast={feedback ? { ...feedback, detail: feedback.good && finishedAnswers && !saveError ? 'Görev kaydediliyor…' : feedback.detail } : null}
              />
          </section>
        ) : null)}
        {saveError && <div role="alert" className="mx-auto mt-4 max-w-lg rounded-xl border border-red-300 bg-red-950/80 p-4 text-center text-sm">
          {saveError} <button disabled={saving} className="ml-3 min-h-11 font-black underline disabled:opacity-50" onClick={() => void (step === 1 ? finish(discovered.length) : finish(correct, finishedAnswers ?? evidence))}>Tekrar Kaydet</button>
        </div>}
      </div>
    </div>
  );
};
