'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDialogFocus } from '@/lib/a11y/useDialogFocus';
import { useFocusRescue } from '@/lib/a11y/useFocusRescue';
import {
  GATE_HARD_TRIES, GATE_MAX_WRONG, canTryHard, createGateChallenge, createHardChallenge, emptyGuard, formatLock,
  lockDurationMs, readGuard, registerHardWrong, registerWrong, remainingLockMs, writeGuard, type GateChallenge, type GateGuard
} from '@/lib/profile/parentGate';
import {
  cancelPinReset, clearPinRecord, formatWait, maskEmail, normaliseRecoveryKey, pinMatches, pinSupported, readPinRecord,
  recoveryMatches, requestPinReset, resetWaitMs, writePinRecord, type ParentPinRecord, type PinOwner
} from '@/lib/profile/parentPin';
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

type Mode = 'question' | 'pin' | 'email' | 'recovery' | 'hard' | 'forgot';
type Purpose = 'unlock' | 'reset-pin';
const RESEND_SECONDS = 30;

/** The adult check in front of parent-only areas (backups, the family panel,
 * deleting a child, speech diagnostics).
 * - Default: a question written in words, beyond the times table.
 * - With a parent PIN: only the PIN opens it, so an older child who can solve
 *   sums still cannot get in.
 * - Three wrong answers lock it (1 / 3 / 10 minutes, survives reloads), but
 *   no parent waits: the family e-mail, the PIN's recovery key, or — without
 *   a PIN — a harder parent question (two tries per lock) opens it at once.
 * - A forgotten PIN: e-mail, recovery key, or a 24-hour reset that entering
 *   the right PIN cancels.
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
  const [hardChallenge, setHardChallenge] = useState<GateChallenge>(() => createHardChallenge());
  const [guard, setGuard] = useState<GateGuard>(emptyGuard);
  const [now, setNow] = useState(() => Date.now());
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [shake, setShake] = useState(0);
  // After the 24-hour wait, answering the question removes the PIN.
  const [resetAfterQuestion, setResetAfterQuestion] = useState(false);
  const [notice, setNotice] = useState('');
  // E-mail code / recovery key (instant unlock, forgotten PIN)
  const [purpose, setPurpose] = useState<Purpose>('unlock');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [sideBusy, setSideBusy] = useState(false);
  const [sideError, setSideError] = useState('');
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
    setResetAfterQuestion(false);
    setNotice('');
    setCodeSent(false);
    setCode('');
    setRecoveryKey('');
    setSideError('');
    setAccount(null);
    let alive = true;
    if (isSupabaseConfigured()) {
      getAdultAccount()
        .then(found => { if (alive && found?.email) setAccount({ id: found.userId, email: found.email }); })
        .catch(() => { /* no family account: the question, PIN or recovery key still work */ });
    }
    return () => { alive = false; };
  }, [isOpen]);

  const lockMs = remainingLockMs(guard, now);
  const locked = lockMs > 0;
  const onMainMode = mode === 'question' || mode === 'pin';

  // While locked the countdown ticks; when it ends a new question is ready.
  // The answer field disappears while locked, so focus moves to "Kapat".
  useEffect(() => {
    if (!isOpen || !locked) return;
    if (onMainMode) requestAnimationFrame(() => closeRef.current?.focus());
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

  // Steps replace the focused control (a started reset, a used-up parent
  // question, a lock): focus returns to the dialog so Escape and Tab still work.
  useFocusRescue(dialogRef, isOpen, [mode, codeSent, locked, notice, pinRecord, sideError, hasError, resetAfterQuestion]);

  if (!isOpen) return null;

  // Whose e-mail can open the gate: the PIN's family first, else the
  // signed-in family account.
  const owner: PinOwner | null = pinRecord?.ownerId && pinRecord.ownerEmail
    ? { id: pinRecord.ownerId, email: pinRecord.ownerEmail } : account;
  const hasRecovery = Boolean(pinRecord?.recoveryHash);
  const resetWait = pinRecord ? resetWaitMs(pinRecord, now) : null;
  const mainMode: Mode = pinRecord && !resetAfterQuestion ? 'pin' : 'question';

  // The parent proved who they are: a pending reset request is withdrawn.
  const pass = (removePin = false) => {
    if (removePin) clearPinRecord();
    else if (pinRecord?.resetRequestedAt) writePinRecord(cancelPinReset(pinRecord));
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
      if (resetAfterQuestion) clearPinRecord();
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

  const goMain = () => {
    setMode(mainMode);
    setSideError('');
    setHasError(false);
  };
  const openSide = (next: Mode, why: Purpose = 'unlock') => {
    setPurpose(why);
    setMode(next);
    setCodeSent(false);
    setCode('');
    setRecoveryKey('');
    setSideError('');
    setNotice('');
    if (next === 'hard') { setHardChallenge(createHardChallenge()); setUserAnswer(''); }
  };

  const sendCode = async () => {
    if (!owner || sideBusy || cooldown > 0) return;
    setSideBusy(true);
    setSideError('');
    try {
      const res = await sendAdultOtpEmail(owner.email);
      if (!res.success) throw new Error(res.error || 'Kod gönderilemedi.');
      setCodeSent(true);
      setCode('');
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      console.warn('[Ebeveyn kapısı] kod gönderilemedi', error);
      setSideError(friendlyAccountError(error, 'Kod gönderilemedi. Biraz sonra yeniden dene.'));
    } finally {
      setSideBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner || sideBusy || code.length < 6) return;
    setSideBusy(true);
    setSideError('');
    try {
      const res = await verifyAdultOtp(owner.email, code);
      if (!res.success) throw new Error(res.error || 'Kod doğrulanamadı.');
      // The code must belong to the same family account, not just any address.
      if (res.user?.id !== owner.id) throw new Error('Bu kod, kapıyı açabilecek aile hesabına ait değil.');
      pass(purpose === 'reset-pin');
    } catch (error) {
      console.warn('[Ebeveyn kapısı] kod doğrulanamadı', error);
      setSideError(friendlyAccountError(error, 'Kod doğrulanamadı. Yeni bir kod isteyip yeniden dene.'));
      setCode('');
    } finally {
      setSideBusy(false);
    }
  };

  const checkRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinRecord || sideBusy || recoveryKey.length < 14) return;
    setSideBusy(true);
    setSideError('');
    try {
      if (await recoveryMatches(recoveryKey, pinRecord)) { pass(purpose === 'reset-pin'); return; }
      setSideError('Anahtar eşleşmedi. Harfleri kontrol et; anahtarda 0, O, 1, I ve L yoktur.');
    } finally {
      setSideBusy(false);
    }
  };

  const submitHard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer || !canTryHard(guard, Date.now())) return;
    if (Number(userAnswer) === hardChallenge.answer) { pass(); return; }
    const next = registerHardWrong(guard, Date.now());
    writeGuard(next);
    setGuard(next);
    setShake(count => count + 1);
    setUserAnswer('');
    if (next.hardLeft > 0) {
      setHardChallenge(createHardChallenge());
      setSideError('Olmadı. Yeni bir ebeveyn sorusu geldi; son hakkın kaldı.');
    } else {
      setSideError('');
      setMode(mainMode);
      setNotice('Ebeveyn sorusu hakları bitti. Süre dolunca yeniden deneyebilirsin.');
    }
  };

  const startReset = () => {
    if (!pinRecord) return;
    const next = requestPinReset(pinRecord);
    writePinRecord(next);
    setPinRecord(next);
    setNow(Date.now());
  };

  const danger = tone === 'danger';
  const triesLeft = GATE_MAX_WRONG - guard.wrong;
  const lockDuration = lockDurationMs(guard);
  const showLock = locked && onMainMode;
  const hardOpen = !pinRecord && canTryHard(guard, now);
  const canSkipWait = Boolean(owner) || hasRecovery || hardOpen;
  const sideIcons: Partial<Record<Mode, string>> = { email: '✉️', recovery: '🔑', hard: '🧮', forgot: '❓' };
  const icon = sideIcons[mode] ?? (showLock ? '⏳' : danger ? '🗑️' : '🔒');
  const heading =
    mode === 'email' ? (purpose === 'reset-pin' ? 'PIN\'i e-postayla sıfırla' : 'E-postayla aç') :
    mode === 'recovery' ? (purpose === 'reset-pin' ? 'PIN\'i anahtarla sıfırla' : 'Kurtarma anahtarıyla aç') :
    mode === 'hard' ? 'Ebeveyn sorusu' :
    mode === 'forgot' ? 'PIN\'imi unuttum' : title;
  const context = description ?? 'Bu alan yetişkinler içindir: yedekleme, aile hesabı ve İngilizce karnesi.';
  const intro =
    mode === 'email' ? (purpose === 'reset-pin' ? 'PIN\'i sıfırlamak için aile hesabının e-postasına bir kod gönderelim.' : 'Beklemeden açmak için aile hesabının e-postasına bir kod gönderelim.') :
    mode === 'recovery' ? (purpose === 'reset-pin' ? 'PIN\'i belirlerken kaydettiğin kurtarma anahtarını yaz; PIN kaldırılır ve kapı açılır.' : 'PIN\'i belirlerken kaydettiğin kurtarma anahtarını yaz; kapı hemen açılır.') :
    mode === 'hard' ? 'Beklemeden açmak için bu biraz daha zor soruyu yanıtla. Hesap makinesi kullanabilirsin.' :
    mode === 'forgot' ? 'Endişelenme; PIN\'i sıfırlamanın bir yolunu seç.' :
    resetAfterQuestion ? 'Sıfırlama süresi doldu. Soruyu yanıtlayınca PIN kaldırılır ve kapı açılır.' :
    `${context} ${mode === 'pin' ? 'Devam etmek için Ebeveyn PIN\'ini gir.' : 'Devam etmek için soruyu yanıtla.'}`;

  const dots = (left: number, total: number, label: string) => (
    <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
      <span aria-hidden="true" className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={'h-2.5 w-2.5 rounded-full ' + (i < left ? 'bg-lime-300' : 'bg-white/20')} />
        ))}
      </span>
      <span>{left} {label}</span>
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
  const optionButton = (key: string, emoji: string, label: string, hint: string, onClick: () => void, primary = false) => (
    <button key={key} type="button" onClick={onClick}
      className={'flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-2 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 ' +
        (primary ? 'bg-gradient-to-r from-amber-200 to-yellow-300 text-slate-950 shadow-lg shadow-amber-950/40 hover:brightness-105' : 'border border-white/20 bg-white/5 text-white hover:bg-white/10')}>
      <span aria-hidden="true" className="text-xl">{emoji}</span>
      <span className="min-w-0 flex-1"><strong className="block text-sm font-black">{label}</strong>
        <span className={'block text-xs ' + (primary ? 'text-slate-800' : 'text-slate-300')}>{hint}</span></span>
    </button>
  );
  const backButton = (
    <button type="button" onClick={goMain}
      className="min-h-11 rounded-2xl px-3 text-sm font-bold text-sky-200 hover:bg-white/5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
      ← Geri
    </button>
  );
  const sideErrorBox = sideError && <p role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm font-bold text-rose-100">{sideError}</p>;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#030817]/90 p-4 backdrop-blur-md"
      style={{ zIndex }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ventra-parent-gate-title" aria-describedby="ventra-parent-gate-description"
        className={'pg-card relative my-auto w-full max-w-[440px] overflow-hidden outline-none rounded-[28px] border bg-gradient-to-b from-[#10203f] to-[#0a1328] p-6 text-center text-white shadow-[0_30px_80px_#000a] sm:p-7 '+
          (danger ? 'border-rose-300/35' : 'border-sky-300/30')}>
        <div aria-hidden="true" className={'pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full blur-3xl '+(danger?'bg-rose-500/25':'bg-sky-400/20')} />
        <div aria-hidden="true" className={'relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border text-3xl shadow-lg '+
          (danger ? 'border-rose-200/40 bg-rose-500/15' : 'border-amber-200/40 bg-amber-300/15')}>{icon}</div>
        <p className="relative mt-4 text-xs font-black uppercase tracking-[0.2em] text-amber-200">Yalnızca yetişkinler</p>
        <h3 id="ventra-parent-gate-title" className="relative mt-1 text-xl font-black tracking-tight">{heading}</h3>
        <p id="ventra-parent-gate-description" className="relative mt-2 text-sm leading-relaxed text-slate-300">{intro}</p>
        {notice && onMainMode && <p role="status" className="relative mt-3 rounded-xl border border-amber-200/30 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-50">{notice}</p>}

        {showLock ? (
          <section aria-labelledby="ventra-parent-gate-lock" className="relative mt-5 rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 py-5">
            <div className="pg-lock mx-auto" style={{ '--pg-progress': String(Math.min(1, lockMs / lockDuration)) } as React.CSSProperties} aria-hidden="true">
              <span className="pg-lock-time tabular-nums">{formatLock(lockMs)}</span>
            </div>
            <h4 id="ventra-parent-gate-lock" className="mt-3 text-base font-black text-amber-100">Çok fazla yanlış deneme</h4>
            <p role="status" className="mt-1 text-sm leading-relaxed text-amber-50/90">
              Kapı {lockDuration / 60000} dakika kilitlendi. Bu, tahminle açılmasını önler.
              {canSkipWait ? ' Ebeveynsen beklemen gerekmez:' : ' Süre bitince yeniden deneyebilirsin.'}
            </p>
            {canSkipWait && (
              <div className="mt-4 flex flex-col gap-2">
                {owner && optionButton('email', '✉️', 'E-postayla hemen aç', `Kod ${maskEmail(owner.email)} adresine gider`, () => openSide('email'), true)}
                {hasRecovery && optionButton('recovery', '🔑', 'Kurtarma anahtarıyla aç', 'PIN\'i belirlerken kaydettiğin anahtar', () => openSide('recovery'), !owner)}
                {hardOpen && optionButton('hard', '🧮', 'Ebeveyn sorusuyla hemen aç', `Biraz daha zor bir soru · ${guard.hardLeft} hak`, () => openSide('hard'), !owner)}
              </div>
            )}
          </section>
        ) : mode === 'email' && owner ? (
          <div className="relative mt-5 flex flex-col gap-3 text-left">
            <div className="rounded-2xl border border-sky-300/25 bg-[#050b1d] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200/80">Aile hesabı</p>
              <p className="mt-1 break-all text-base font-black text-sky-100">{maskEmail(owner.email)}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">Kod yalnızca bu adrese gider. Doğrulama bu cihazda aile hesabına giriş yapar.</p>
            </div>
            {!codeSent ? (
              <button type="button" autoFocus onClick={() => void sendCode()} disabled={sideBusy}
                className="min-h-12 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 px-4 text-sm font-black text-slate-950 shadow-lg shadow-sky-950/40 hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 disabled:opacity-60">
                {sideBusy ? 'Gönderiliyor…' : 'Kodu gönder'}
              </button>
            ) : (
              <form onSubmit={verifyCode} className="flex flex-col gap-3">
                <label htmlFor="ventra-parent-gate-code" className="text-sm font-bold text-sky-100">E-postadaki kod</label>
                <input id="ventra-parent-gate-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={10}
                  autoFocus value={code} onChange={e => setCode(cleanOtpCode(e.target.value))} placeholder="••••••"
                  className="min-h-14 w-full rounded-2xl border border-sky-300/30 bg-[#050b1d] px-4 text-center text-2xl font-black tracking-[0.35em] tabular-nums text-white outline-none placeholder:text-slate-600 focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/25" />
                <button type="submit" disabled={sideBusy || code.length < 6}
                  className="min-h-12 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
                  {sideBusy ? 'Doğrulanıyor…' : purpose === 'reset-pin' ? 'PIN\'i sıfırla ve aç' : 'Doğrula ve aç'}
                </button>
                <button type="button" disabled={sideBusy || cooldown > 0} onClick={() => void sendCode()}
                  className="min-h-11 rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-sky-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                  {cooldown > 0 ? `Yeni kod (${cooldown} sn)` : 'Kodu yeniden gönder'}
                </button>
              </form>
            )}
            {sideErrorBox}
            {purpose === 'reset-pin' && <p className="text-xs leading-relaxed text-slate-400">Doğrulayınca PIN kaldırılır ve kapı açılır; dilersen “Yedekleme ve hesap” bölümünden yeni bir PIN belirlersin.</p>}
            {backButton}
          </div>
        ) : mode === 'recovery' && pinRecord ? (
          <form onSubmit={checkRecovery} className="relative mt-5 flex flex-col gap-3 text-left">
            <label htmlFor="ventra-parent-gate-recovery" className="text-sm font-bold text-sky-100">Kurtarma anahtarı</label>
            <input id="ventra-parent-gate-recovery" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} autoFocus
              value={recoveryKey} onChange={e => setRecoveryKey(normaliseRecoveryKey(e.target.value))} placeholder="XXXX-XXXX-XXXX"
              aria-describedby="ventra-parent-gate-recovery-help"
              className="min-h-14 w-full rounded-2xl border border-sky-300/30 bg-[#050b1d] px-4 text-center font-mono text-xl font-black uppercase tracking-[0.12em] text-white outline-none placeholder:text-slate-600 focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/25" />
            <p id="ventra-parent-gate-recovery-help" className="text-xs leading-relaxed text-slate-400">Büyük-küçük harf ve tireler önemli değil.</p>
            <button type="submit" disabled={sideBusy || recoveryKey.length < 14}
              className="min-h-12 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
              {sideBusy ? 'Kontrol ediliyor…' : purpose === 'reset-pin' ? 'PIN\'i sıfırla ve aç' : 'Anahtarla aç'}
            </button>
            {sideErrorBox}
            {backButton}
          </form>
        ) : mode === 'hard' ? (
          <form onSubmit={submitHard} className="relative mt-5 flex flex-col gap-3">
            <div key={shake} className={'pg-question rounded-2xl border bg-[#050b1d] px-4 pb-4 pt-3 text-left '+(sideError ? 'pg-question--wrong border-rose-300/50' : 'border-amber-200/30')}>
              <span className="text-xs font-black uppercase tracking-[0.18em] text-amber-200/90">Ebeveyn sorusu</span>
              <p id="ventra-parent-gate-hard" className="mt-1 text-2xl font-black leading-snug text-amber-100">{hardChallenge.prompt}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">Cevabı rakamla yaz.</p>
            </div>
            <label htmlFor="ventra-parent-gate-hard-answer" className="sr-only">Ebeveyn sorusunun cevabı, rakamla</label>
            <input ref={inputRef} id="ventra-parent-gate-hard-answer" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" autoFocus
              value={userAnswer} onChange={(e) => setUserAnswer(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Cevap"
              aria-describedby="ventra-parent-gate-hard"
              className="min-h-14 w-full rounded-2xl border border-amber-200/30 bg-[#050b1d] px-4 text-center text-2xl font-black tabular-nums text-white outline-none placeholder:text-base placeholder:font-semibold placeholder:text-slate-500 focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/25" />
            {dots(guard.hardLeft, GATE_HARD_TRIES, 'hak')}
            {sideErrorBox}
            <button type="submit" disabled={!userAnswer}
              className="min-h-12 rounded-2xl bg-gradient-to-r from-amber-200 to-yellow-300 px-4 text-sm font-black text-slate-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
              Yanıtla ve aç
            </button>
            {backButton}
          </form>
        ) : mode === 'forgot' && pinRecord ? (
          <div className="relative mt-5 flex flex-col gap-2 text-left">
            {owner && optionButton('email', '✉️', 'E-postayla sıfırla', `Kod ${maskEmail(owner.email)} adresine gider`, () => openSide('email', 'reset-pin'), true)}
            {hasRecovery && optionButton('recovery', '🔑', 'Kurtarma anahtarıyla sıfırla', 'PIN\'i belirlerken kaydettiğin anahtar', () => openSide('recovery', 'reset-pin'), !owner)}
            <section aria-labelledby="ventra-parent-gate-wait" className="mt-2 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
              <h4 id="ventra-parent-gate-wait" className="text-sm font-black">{owner || hasRecovery ? 'İkisi de yanımda değil' : 'Güvenli sıfırlama'}</h4>
              {resetWait === null ? (
                <>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    PIN 24 saat sonra sıfırlanabilir. Bu bekleme, bir çocuğun PIN'i sessizce kaldırmasını önler:
                    bu sürede doğru PIN girilirse istek iptal olur.
                  </p>
                  <button type="button" onClick={startReset}
                    className="mt-3 min-h-11 w-full rounded-xl border border-amber-200/40 bg-amber-300/10 px-3 text-sm font-black text-amber-50 hover:bg-amber-300/20">
                    24 saatlik sıfırlamayı başlat
                  </button>
                </>
              ) : (
                <p role="status" className="mt-1 text-sm leading-relaxed text-amber-50">
                  {resetWait > 0 ? `Sıfırlama isteği başladı. ${formatWait(resetWait)} sonra kapıda “PIN'i kaldır” seçeneği çıkacak.` : 'Sıfırlama hazır; geri dönüp PIN\'i kaldırabilirsin.'}
                </p>
              )}
            </section>
            {backButton}
          </div>
        ) : mode === 'pin' && pinRecord ? (
          <form onSubmit={(e) => { e.preventDefault(); void checkPin(pin); }} className="relative mt-5 flex flex-col gap-3">
            {resetWait !== null && (
              <div role="status" className="rounded-2xl border border-amber-200/35 bg-amber-300/10 px-3 py-2 text-left text-xs leading-relaxed text-amber-50">
                {resetWait > 0 ? <>
                  <strong className="block text-sm">PIN sıfırlama isteği var · {formatWait(resetWait)} sonra hazır</strong>
                  Bu isteği sen başlatmadıysan PIN'ini gir; istek iptal olur.
                </> : <>
                  <strong className="block text-sm">PIN sıfırlama hazır</strong>
                  <button type="button" onClick={() => { setResetAfterQuestion(true); setMode('question'); newChallenge(); }}
                    className="mt-2 min-h-11 w-full rounded-xl bg-amber-200 px-3 text-sm font-black text-slate-950">Soruyu yanıtla ve PIN'i kaldır</button>
                </>}
              </div>
            )}
            <div key={shake} className={hasError ? 'pg-question--wrong' : ''}>
              <PinField id="ventra-parent-gate-answer" label="Ebeveyn PIN'i, 4 rakam" value={pin} inputRef={inputRef} autoFocus
                onChange={value => { setPin(value); if (value) setHasError(false); }} onComplete={value => void checkPin(value)}
                invalid={hasError} disabled={checking} describedBy={hasError ? 'ventra-parent-gate-error' : undefined} />
            </div>
            {dots(triesLeft, GATE_MAX_WRONG, 'deneme hakkı')}
            {hasError && (
              <p id="ventra-parent-gate-error" role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm font-bold text-rose-100">
                PIN yanlış{triesLeft === 1 ? '; son deneme hakkın kaldı.' : '.'}
              </p>
            )}
            {actions(pin.length < 4 || checking, checking ? 'Kontrol ediliyor…' : confirmLabel)}
            <button type="button" onClick={() => openSide('forgot')}
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
            {dots(triesLeft, GATE_MAX_WRONG, 'deneme hakkı')}
            {hasError && (
              <p id="ventra-parent-gate-error" role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm font-bold text-rose-100">
                Olmadı. Yeni bir soru geldi{triesLeft === 1 ? '; son deneme hakkın kaldı.' : '.'}
              </p>
            )}
            {actions(!userAnswer)}
            {resetAfterQuestion && backButton}
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
