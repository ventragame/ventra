'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDialogFocus } from '@/lib/a11y/useDialogFocus';
import { useFocusRescue } from '@/lib/a11y/useFocusRescue';
import {
  GATE_MAX_WRONG, createGateChallenge, emptyGuard, formatLock, lockDurationMs, readGuard, registerWrong,
  remainingLockMs, writeGuard, type GateChallenge, type GateGuard
} from '@/lib/profile/parentGate';
import { clearPinRecord, maskEmail, pinMatches, pinSupported, readPinRecord, type ParentPinRecord, type PinOwner } from '@/lib/profile/parentPin';
import { cleanOtpCode, friendlyAccountError } from '@/lib/profile/profileHub';
import { getAdultAccount, sendAdultOtpEmail, verifyAdultOtp } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { PinField } from './PinField';
import './parent-gate.css';

interface ParentalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** What this area is (context only); the gate adds the instruction for
   * its current mode: answer the question, or enter the PIN. */
  description?: string;
  /** Heading override, e.g. for a destructive parent-only action. */
  title?: string;
  /** Submit label; defaults to "Onayla". */
  confirmLabel?: string;
  /** "danger" styles the confirm button for irreversible actions. */
  tone?: 'default' | 'danger';
  zIndex?: number;
}

type Mode = 'question' | 'pin' | 'email';
type EmailPurpose = 'unlock' | 'reset-pin';
const RESEND_SECONDS = 30;

/** The adult check in front of parent-only areas (backups, the family panel,
 * deleting a child, speech diagnostics).
 * - Default: a question written in words, beyond the times table.
 * - With a parent PIN (set in "Yedekleme ve hesap"): only the PIN opens it,
 *   so an older child who can solve sums still cannot get in.
 * - Three wrong answers lock it for 1 / 3 / 10 minutes (survives reloads);
 *   a parent with a family account never has to wait: a code sent to the
 *   family e-mail opens it at once, and resets a forgotten PIN.
 * Rules: lib/profile/parentGate and lib/profile/parentPin. */
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
  const [mode, setMode] = useState<Mode>('question');
  const [pinRecord, setPinRecord] = useState<ParentPinRecord | null>(null);
  const [account, setAccount] = useState<PinOwner | null>(null);
  const [challenge, setChallenge] = useState<GateChallenge>(() => createGateChallenge());
  const [guard, setGuard] = useState<GateGuard>(emptyGuard);
  const [now, setNow] = useState(() => Date.now());
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [shake, setShake] = useState(0);
  // E-mail code (instant unlock / forgotten PIN)
  const [purpose, setPurpose] = useState<EmailPurpose>('unlock');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocus(dialogRef, isOpen);

  const newChallenge = (clearError = true) => {
    setChallenge(createGateChallenge());
    setUserAnswer('');
    if (clearError) setHasError(false);
  };

  // Every opening: the stored lock, the PIN if a parent set one, a fresh
  // question, and the family account (for the e-mail code) if signed in.
  useEffect(() => {
    if (!isOpen) return;
    const record = pinSupported() ? readPinRecord() : null;
    setPinRecord(record);
    setMode(record ? 'pin' : 'question');
    setGuard(readGuard());
    setNow(Date.now());
    newChallenge();
    setPin('');
    setCodeSent(false);
    setCode('');
    setEmailError('');
    setAccount(null);
    let alive = true;
    if (isSupabaseConfigured()) {
      getAdultAccount()
        .then(found => { if (alive && found?.email) setAccount({ id: found.userId, email: found.email }); })
        .catch(() => { /* no family account: the question or PIN still works */ });
    }
    return () => { alive = false; };
  }, [isOpen]);

  const lockMs = remainingLockMs(guard, now);
  const locked = lockMs > 0;

  // While locked the countdown ticks; when it ends a new question is ready.
  // The answer field disappears while locked, so focus moves to "Kapat".
  useEffect(() => {
    if (!isOpen || !locked) return;
    if (mode !== 'email') requestAnimationFrame(() => closeRef.current?.focus());
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (remainingLockMs(guard, current) <= 0) {
        window.clearInterval(timer);
        newChallenge();
        setPin('');
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, locked, guard]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(seconds => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useFocusRescue(dialogRef, isOpen, [mode, codeSent, locked]);

  if (!isOpen) return null;

  // Whose e-mail can open the gate: the PIN's family first, else the
  // signed-in family account. None → the parent waits out the lock.
  const owner: PinOwner | null = pinRecord ? { id: pinRecord.ownerId, email: pinRecord.ownerEmail } : account;

  const pass = () => {
    writeGuard(emptyGuard());
    onSuccess();
  };

  const recordWrong = () => {
    const current = Date.now();
    const next = registerWrong(guard, current);
    writeGuard(next);
    setGuard(next);
    setNow(current);
    setShake(count => count + 1);
    setHasError(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || !userAnswer) return;
    if (Number(userAnswer) === challenge.answer) {
      writeGuard(emptyGuard());
      onSuccess();
      return;
    }
    recordWrong();
    newChallenge(false);
    inputRef.current?.focus();
  };

  const checkPin = async (value: string) => {
    if (!pinRecord || locked || checking || value.length < 4) return;
    setChecking(true);
    try {
      if (await pinMatches(value, pinRecord)) { pass(); return; }
      recordWrong();
      setPin('');
      inputRef.current?.focus();
    } finally {
      setChecking(false);
    }
  };

  const openEmail = (next: EmailPurpose) => {
    setPurpose(next);
    setMode('email');
    setCodeSent(false);
    setCode('');
    setEmailError('');
  };

  const leaveEmail = () => {
    setMode(pinRecord ? 'pin' : 'question');
    setEmailError('');
  };

  const sendCode = async () => {
    if (!owner || emailBusy || cooldown > 0) return;
    setEmailBusy(true);
    setEmailError('');
    try {
      const res = await sendAdultOtpEmail(owner.email);
      if (!res.success) throw new Error(res.error || 'Kod gönderilemedi.');
      setCodeSent(true);
      setCode('');
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      console.warn('[Ebeveyn kapısı] kod gönderilemedi', error);
      setEmailError(friendlyAccountError(error, 'Kod gönderilemedi. Biraz sonra yeniden dene.'));
    } finally {
      setEmailBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner || emailBusy || code.length < 6) return;
    setEmailBusy(true);
    setEmailError('');
    try {
      const res = await verifyAdultOtp(owner.email, code);
      if (!res.success) throw new Error(res.error || 'Kod doğrulanamadı.');
      // The code must belong to the same family account, not just any address.
      if (res.user?.id !== owner.id) throw new Error('Bu kod, kapıyı açabilecek aile hesabına ait değil.');
      if (purpose === 'reset-pin') clearPinRecord();
      pass();
    } catch (error) {
      console.warn('[Ebeveyn kapısı] kod doğrulanamadı', error);
      setEmailError(friendlyAccountError(error, 'Kod doğrulanamadı. Yeni bir kod isteyip yeniden dene.'));
      setCode('');
    } finally {
      setEmailBusy(false);
    }
  };

  const danger = tone === 'danger';
  const triesLeft = GATE_MAX_WRONG - guard.wrong;
  const lockDuration = lockDurationMs(guard);
  const showLock = locked && mode !== 'email';
  const icon = mode === 'email' ? '✉️' : showLock ? '⏳' : danger ? '🗑️' : '🔒';
  const context = description ?? 'Bu alan yetişkinler içindir: yedekleme, aile hesabı ve İngilizce karnesi.';
  const intro = mode === 'email'
    ? (purpose === 'reset-pin' ? 'PIN\'i sıfırlamak için aile hesabının e-postasına bir kod gönderelim.' : 'Beklemeden açmak için aile hesabının e-postasına bir kod gönderelim.')
    : `${context} ${mode === 'pin' ? 'Devam etmek için Ebeveyn PIN\'ini gir.' : 'Devam etmek için soruyu yanıtla.'}`;
  const tries = (
    <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
      <span aria-hidden="true" className="flex gap-1.5">
        {Array.from({ length: GATE_MAX_WRONG }, (_, i) => (
          <span key={i} className={'h-2.5 w-2.5 rounded-full ' + (i < triesLeft ? 'bg-lime-300' : 'bg-white/20')} />
        ))}
      </span>
      <span>{triesLeft} deneme hakkı</span>
    </div>
  );
  const actions = (submitDisabled: boolean, submitLabel = confirmLabel) => (
    <div className="mt-1 grid grid-cols-2 gap-3">
      <button type="button" onClick={onClose}
        className="min-h-12 rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
        Vazgeç
      </button>
      <button type="submit" disabled={submitDisabled}
        className={'min-h-12 rounded-2xl px-3 text-sm font-black text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-60 '+
          (danger ? 'bg-gradient-to-r from-rose-600 to-rose-700 shadow-rose-950/50' : 'bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-950/50')}>
        {submitLabel}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#030817]/90 p-4 backdrop-blur-md"
      style={{ zIndex }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ventra-parent-gate-title" aria-describedby="ventra-parent-gate-description"
        className={'pg-card relative w-full max-w-[440px] overflow-hidden outline-none rounded-[28px] border bg-gradient-to-b from-[#10203f] to-[#0a1328] p-6 text-center text-white shadow-[0_30px_80px_#000a] sm:p-7 '+
          (danger ? 'border-rose-300/35' : 'border-sky-300/30')}>
        <div aria-hidden="true" className={'pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full blur-3xl '+(danger?'bg-rose-500/25':'bg-sky-400/20')} />
        <div aria-hidden="true" className={'relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border text-3xl shadow-lg '+
          (danger ? 'border-rose-200/40 bg-rose-500/15' : 'border-amber-200/40 bg-amber-300/15')}>{icon}</div>
        <p className="relative mt-4 text-xs font-black uppercase tracking-[0.2em] text-amber-200">Yalnızca yetişkinler</p>
        <h3 id="ventra-parent-gate-title" className="relative mt-1 text-xl font-black tracking-tight">
          {mode === 'email' ? (purpose === 'reset-pin' ? 'PIN\'i e-postayla sıfırla' : 'E-postayla aç') : title}
        </h3>
        <p id="ventra-parent-gate-description" className="relative mt-2 text-sm leading-relaxed text-slate-300">{intro}</p>

        {showLock ? (
          <section aria-labelledby="ventra-parent-gate-lock" className="relative mt-5 rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 py-5">
            <div className="pg-lock mx-auto" style={{ '--pg-progress': String(Math.min(1, lockMs / lockDuration)) } as React.CSSProperties} aria-hidden="true">
              <span className="pg-lock-time tabular-nums">{formatLock(lockMs)}</span>
            </div>
            <h4 id="ventra-parent-gate-lock" className="mt-3 text-base font-black text-amber-100">Çok fazla yanlış cevap</h4>
            <p role="status" className="mt-1 text-sm leading-relaxed text-amber-50/90">
              Kapı {lockDuration / 60000} dakika kilitlendi; süre bitince yeniden deneyebilirsin.
              Bu bekleme, kapının tahminle açılmasını önler.
            </p>
            {owner ? (
              <button type="button" onClick={() => openEmail('unlock')}
                className="mt-4 min-h-12 w-full rounded-2xl bg-gradient-to-r from-amber-200 to-yellow-300 px-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/40 hover:brightness-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
                ✉️ Ebeveynim: e-postayla hemen aç
              </button>
            ) : (
              <p className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-amber-50/85">
                Beklememek için: “Yedekleme ve hesap” bölümünden aile hesabına giriş yaparsan, kapı kilitlense de e-postana gelen kodla hemen açabilirsin.
              </p>
            )}
          </section>
        ) : mode === 'email' ? (
          owner && <div className="relative mt-5 flex flex-col gap-3 text-left">
            <div className="rounded-2xl border border-sky-300/25 bg-[#050b1d] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200/80">Aile hesabı</p>
              <p className="mt-1 break-all text-base font-black text-sky-100">{maskEmail(owner.email)}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">Kod yalnızca bu adrese gider. Doğrulama bu cihazda aile hesabına giriş yapar.</p>
            </div>
            {!codeSent ? (
              <button type="button" autoFocus onClick={() => void sendCode()} disabled={emailBusy}
                className="min-h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 px-4 text-sm font-black text-slate-950 shadow-lg shadow-sky-950/40 hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 disabled:opacity-60">
                {emailBusy ? 'Gönderiliyor…' : 'Kodu gönder'}
              </button>
            ) : (
              <form onSubmit={verifyCode} className="flex flex-col gap-3">
                <label htmlFor="ventra-parent-gate-code" className="text-sm font-bold text-sky-100">E-postadaki kod</label>
                <input id="ventra-parent-gate-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={10}
                  autoFocus value={code} onChange={e => setCode(cleanOtpCode(e.target.value))} placeholder="••••••"
                  className="min-h-14 w-full rounded-2xl border border-sky-300/30 bg-[#050b1d] px-4 text-center text-2xl font-black tracking-[0.35em] tabular-nums text-white outline-none placeholder:text-slate-600 focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/25" />
                <button type="submit" disabled={emailBusy || code.length < 6}
                  className="min-h-12 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
                  {emailBusy ? 'Doğrulanıyor…' : purpose === 'reset-pin' ? 'PIN\'i sıfırla ve aç' : 'Doğrula ve aç'}
                </button>
                <button type="button" disabled={emailBusy || cooldown > 0} onClick={() => void sendCode()}
                  className="min-h-11 rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-sky-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                  {cooldown > 0 ? `Yeni kod (${cooldown} sn)` : 'Kodu yeniden gönder'}
                </button>
              </form>
            )}
            {emailError && <p role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm font-bold text-rose-100">{emailError}</p>}
            {purpose === 'reset-pin' && <p className="text-xs leading-relaxed text-slate-400">Doğrulayınca PIN kaldırılır ve kapı açılır; dilersen “Yedekleme ve hesap” bölümünden yeni bir PIN belirlersin.</p>}
            <button type="button" onClick={leaveEmail}
              className="min-h-11 rounded-2xl px-3 text-sm font-bold text-sky-200 hover:bg-white/5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
              ← Geri
            </button>
          </div>
        ) : mode === 'pin' && pinRecord ? (
          <form onSubmit={(e) => { e.preventDefault(); void checkPin(pin); }} className="relative mt-5 flex flex-col gap-3">
            <div key={shake} className={hasError ? 'pg-question--wrong' : ''}>
              <PinField id="ventra-parent-gate-answer" label="Ebeveyn PIN'i, 4 rakam" value={pin} inputRef={inputRef} autoFocus
                onChange={value => { setPin(value); if (value) setHasError(false); }} onComplete={value => void checkPin(value)}
                invalid={hasError} disabled={checking} describedBy={hasError ? 'ventra-parent-gate-error' : undefined} />
            </div>
            {tries}
            {hasError && (
              <p id="ventra-parent-gate-error" role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm font-bold text-rose-100">
                PIN yanlış{triesLeft === 1 ? '; son deneme hakkın kaldı.' : '.'}
              </p>
            )}
            {actions(pin.length < 4 || checking, checking ? 'Kontrol ediliyor…' : confirmLabel)}
            <button type="button" onClick={() => openEmail('reset-pin')}
              className="min-h-11 rounded-2xl px-3 text-sm font-bold text-sky-200 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
              PIN'imi unuttum
            </button>
          </form>
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
            {tries}
            {hasError && (
              <p id="ventra-parent-gate-error" role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm font-bold text-rose-100">
                Olmadı. Yeni bir soru geldi{triesLeft === 1 ? '; son deneme hakkın kaldı.' : '.'}
              </p>
            )}
            {actions(!userAnswer)}
          </form>
        )}
        {showLock && (
          <button ref={closeRef} type="button" onClick={onClose}
            className="relative mt-4 min-h-12 w-full rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
            Kapat
          </button>
        )}
      </div>
    </div>
  );
};
