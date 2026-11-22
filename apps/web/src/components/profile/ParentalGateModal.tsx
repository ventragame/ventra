'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDialogFocus } from '@/lib/a11y/useDialogFocus';

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

/** A small adult check in front of parent-only areas (backups, deleting a
 * child). It keeps focus inside, opens the numeric keyboard on phones and
 * gives a new question after a wrong answer. */
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
  const [numA, setNumA] = useState<number>(7);
  const [numB, setNumB] = useState<number>(8);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useDialogFocus(dialogRef, isOpen);

  const generateChallenge = (clearError=true) => {
    // 6 - 9 arası iki sayının çarpımı (Ebeveyn doğrulaması)
    const a = Math.floor(Math.random() * 4) + 6;
    const b = Math.floor(Math.random() * 4) + 6;
    setNumA(a);
    setNumB(b);
    setUserAnswer('');
    if(clearError)setHasError(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateChallenge();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userAnswer.trim(), 10);
    if (parsed === numA * numB) {
      onSuccess();
    } else {
      generateChallenge(false);
      setHasError(true);
      inputRef.current?.focus();
    }
  };

  const danger = tone === 'danger';
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-[#030817]/90 p-4 backdrop-blur-md"
      style={{ zIndex }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ventra-parent-gate-title" aria-describedby="ventra-parent-gate-description"
        className={'relative w-full max-w-[420px] overflow-hidden outline-none rounded-[28px] border bg-gradient-to-b from-[#10203f] to-[#0a1328] p-6 text-center text-white shadow-[0_30px_80px_#000a] sm:p-7 '+
          (danger ? 'border-rose-300/35' : 'border-sky-300/30')}>
        <div aria-hidden="true" className={'pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full blur-3xl '+(danger?'bg-rose-500/25':'bg-sky-400/20')} />
        <div aria-hidden="true" className={'relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border text-3xl shadow-lg '+
          (danger ? 'border-rose-200/40 bg-rose-500/15' : 'border-amber-200/40 bg-amber-300/15')}>{danger ? '🗑️' : '🔒'}</div>
        <p className="relative mt-4 text-xs font-black uppercase tracking-[0.2em] text-amber-200">Yalnızca yetişkinler</p>
        <h3 id="ventra-parent-gate-title" className="relative mt-1 text-xl font-black tracking-tight">{title}</h3>
        <p id="ventra-parent-gate-description" className="relative mt-2 text-sm leading-relaxed text-slate-300">
          {description ?? 'Bu alan yalnızca yetişkinlerin bulut yedekleme ve hesap işlemlerini yönetmesi içindir. Devam etmek için lütfen işlemi çözün:'}
        </p>

        <form onSubmit={handleSubmit} className="relative mt-5 flex flex-col gap-3">
          <label htmlFor="ventra-parent-gate-answer" className="rounded-2xl border border-sky-300/25 bg-[#050b1d] px-4 py-4">
            <span className="sr-only">İşlemin sonucunu yaz: </span>
            <span aria-hidden="true" className="block text-3xl font-black tabular-nums text-sky-300">{numA} × {numB} = ?</span>
            <span className="sr-only">{numA} çarpı {numB}</span>
          </label>
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
            placeholder="Sonucu yaz"
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? 'ventra-parent-gate-error' : undefined}
            required
            className="min-h-14 w-full rounded-2xl border border-sky-300/30 bg-[#050b1d] px-4 text-center text-xl font-black tabular-nums text-white outline-none placeholder:text-base placeholder:font-semibold placeholder:text-slate-500 focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/25"
          />
          {hasError && (
            <p id="ventra-parent-gate-error" role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm font-bold text-rose-100">
              Hatalı cevap. Yeni bir işlem geldi, tekrar dene.
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
      </div>
    </div>
  );
};
