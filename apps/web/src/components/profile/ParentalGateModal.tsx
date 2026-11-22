'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDialogFocus } from '@/lib/a11y/useDialogFocus';
import {
  GATE_MAX_WRONG, createGateChallenge, emptyGuard, formatLock, lockDurationMs, readGuard, registerWrong,
  remainingLockMs, writeGuard, type GateChallenge, type GateGuard
} from '@/lib/profile/parentGate';
import './parent-gate.css';

interface ParentalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Optional copy for a parent-only operation other than cloud backups. */
  description?: string;
  /** Heading override, e.g. for a destructive parent-only action. */
  title?: string;
  /** Submit label; defaults to "Onayla". */
  confirmLabel?: string;
  /** "danger" styles the confirm button for irreversible actions. */
  tone?: 'default' | 'danger';
  zIndex?: number;
}

/** The adult check in front of parent-only areas (backups, the family panel,
 * deleting a child, speech diagnostics). The question is written in words
 * and goes beyond the times table; three wrong answers lock the gate for a
 * growing time that survives closing it (rules: lib/profile/parentGate). */
export const ParentalGateModal: React.FC<ParentalGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  description,
  title = 'Ebeveyn Doğrulaması',
  confirmLabel = 'Onayla',
  tone = 'default',
  zIndex = 70
}) => {
  const [challenge, setChallenge] = useState<GateChallenge>(() => createGateChallenge());
  const [guard, setGuard] = useState<GateGuard>(emptyGuard);
  const [now, setNow] = useState(() => Date.now());
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const [shake, setShake] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(dialogRef, isOpen);

  const newChallenge = (clearError = true) => {
    setChallenge(createGateChallenge());
    setUserAnswer('');
    if (clearError) setHasError(false);
  };

  // Every opening: a fresh question and the lock state stored on this device.
  useEffect(() => {
    if (!isOpen) return;
    setGuard(readGuard());
    setNow(Date.now());
    newChallenge();
  }, [isOpen]);

  const lockMs = remainingLockMs(guard, now);
  const locked = lockMs > 0;

  // While locked the countdown ticks; when it ends a new question is ready.
  // The answer field disappears while locked, so focus moves to "Kapat".
  useEffect(() => {
    if (!isOpen || !locked) return;
    requestAnimationFrame(() => closeRef.current?.focus());
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (remainingLockMs(guard, current) <= 0) {
        window.clearInterval(timer);
        newChallenge();
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, locked, guard]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || !userAnswer) return;
    if (Number(userAnswer) === challenge.answer) {
      writeGuard(emptyGuard());
      onSuccess();
      return;
    }
    const current = Date.now();
    const next = registerWrong(guard, current);
    writeGuard(next);
    setGuard(next);
    setNow(current);
    setShake(count => count + 1);
    newChallenge(false);
    setHasError(true);
    inputRef.current?.focus();
  };

  const danger = tone === 'danger';
  const triesLeft = GATE_MAX_WRONG - guard.wrong;
  const lockDuration = lockDurationMs(guard);
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#030817]/90 p-4 backdrop-blur-md"
      style={{ zIndex }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ventra-parent-gate-title" aria-describedby="ventra-parent-gate-description"
        className={'pg-card relative w-full max-w-[440px] overflow-hidden outline-none rounded-[28px] border bg-gradient-to-b from-[#10203f] to-[#0a1328] p-6 text-center text-white shadow-[0_30px_80px_#000a] sm:p-7 '+
          (danger ? 'border-rose-300/35' : 'border-sky-300/30')}>
        <div aria-hidden="true" className={'pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full blur-3xl '+(danger?'bg-rose-500/25':'bg-sky-400/20')} />
        <div aria-hidden="true" className={'relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border text-3xl shadow-lg '+
          (danger ? 'border-rose-200/40 bg-rose-500/15' : 'border-amber-200/40 bg-amber-300/15')}>{locked ? '⏳' : danger ? '🗑️' : '🔒'}</div>
        <p className="relative mt-4 text-xs font-black uppercase tracking-[0.2em] text-amber-200">Yalnızca yetişkinler</p>
        <h3 id="ventra-parent-gate-title" className="relative mt-1 text-xl font-black tracking-tight">{title}</h3>
        <p id="ventra-parent-gate-description" className="relative mt-2 text-sm leading-relaxed text-slate-300">
          {description ?? 'Bu alan yetişkinler içindir: yedekleme, aile hesabı ve İngilizce karnesi. Devam etmek için soruyu yanıtla.'}
        </p>

        {locked ? (
          <section aria-labelledby="ventra-parent-gate-lock" className="relative mt-5 rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 py-5">
            <div className="pg-lock mx-auto" style={{ '--pg-progress': String(Math.min(1, lockMs / lockDuration)) } as React.CSSProperties} aria-hidden="true">
              <span className="pg-lock-time tabular-nums">{formatLock(lockMs)}</span>
            </div>
            <h4 id="ventra-parent-gate-lock" className="mt-3 text-base font-black text-amber-100">Çok fazla yanlış cevap</h4>
            <p role="status" className="mt-1 text-sm leading-relaxed text-amber-50/90">
              Kapı {lockDuration / 60000} dakika kilitlendi; süre bitince yeni bir soru gelir.
              Bu bekleme, kapının tahminle açılmasını önler.
            </p>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="relative mt-5 flex flex-col gap-3">
            <div key={shake} className={'pg-question rounded-2xl border bg-[#050b1d] px-4 pb-4 pt-3 text-left '+(hasError ? 'pg-question--wrong border-rose-300/50' : 'border-sky-300/25')}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-sky-200/80">Soru</span>
                <button type="button" onClick={() => { newChallenge(false); inputRef.current?.focus(); }}
                  className="min-h-11 rounded-xl px-3 text-sm font-bold text-sky-100 hover:bg-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
                  ↻ Başka soru
                </button>
              </div>
              <p id="ventra-parent-gate-question" className="mt-1 text-2xl font-black leading-snug text-sky-200">{challenge.prompt}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">Cevabı rakamla yaz.</p>
            </div>
            <label htmlFor="ventra-parent-gate-answer" className="sr-only">Cevabın, rakamla</label>
            <input
              ref={inputRef}
              id="ventra-parent-gate-answer"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoFocus
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="Cevap"
              aria-invalid={hasError || undefined}
              aria-describedby={'ventra-parent-gate-question' + (hasError ? ' ventra-parent-gate-error' : '')}
              required
              className="min-h-14 w-full rounded-2xl border border-sky-300/30 bg-[#050b1d] px-4 text-center text-2xl font-black tabular-nums text-white outline-none placeholder:text-base placeholder:font-semibold placeholder:text-slate-500 focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/25"
            />
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
              <span aria-hidden="true" className="flex gap-1.5">
                {Array.from({ length: GATE_MAX_WRONG }, (_, i) => (
                  <span key={i} className={'h-2.5 w-2.5 rounded-full ' + (i < triesLeft ? 'bg-lime-300' : 'bg-white/20')} />
                ))}
              </span>
              <span>{triesLeft} deneme hakkı</span>
            </div>
            {hasError && (
              <p id="ventra-parent-gate-error" role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm font-bold text-rose-100">
                Olmadı. Yeni bir soru geldi{triesLeft === 1 ? '; son deneme hakkın kaldı.' : '.'}
              </p>
            )}
            <div className="mt-1 grid grid-cols-2 gap-3">
              <button type="button" onClick={onClose}
                className="min-h-12 rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
                Vazgeç
              </button>
              <button type="submit" disabled={!userAnswer}
                className={'min-h-12 rounded-2xl px-3 text-sm font-black text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-60 '+
                  (danger ? 'bg-gradient-to-r from-rose-600 to-rose-700 shadow-rose-950/50' : 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-950/50')}>
                {confirmLabel}
              </button>
            </div>
          </form>
        )}
        {locked && (
          <button ref={closeRef} type="button" onClick={onClose}
            className="relative mt-4 min-h-12 w-full rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
            Kapat
          </button>
        )}
      </div>
    </div>
  );
};
