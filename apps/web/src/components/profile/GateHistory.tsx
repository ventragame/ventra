'use client';

import React, { useEffect, useState } from 'react';
import { gateHistory, gateSummary, readGateLog, type GateEvent } from '@/lib/profile/parentGateLog';

interface GateHistoryProps {
  /** Changes whenever the window wrote an entry (PIN set, removed…). */
  version?: unknown;
  hasPin: boolean;
}

const TONES = { ok: 'text-sky-50', info: 'text-sky-100/85', warn: 'text-amber-100' } as const;

/** "Kapı geçmişi": when the parent area was opened, how, and failed tries.
 * Opens by itself when someone tried in the last 7 days. */
export const GateHistory: React.FC<GateHistoryProps> = ({ version, hasPin }) => {
  const [log, setLog] = useState<GateEvent[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const read = readGateLog();
    setLog(read);
    if (gateSummary(read, Date.now()).wrong > 0) setOpen(true);
  }, [version]);

  if (!log) return null;
  const now = Date.now();
  const week = gateSummary(log, now);
  const items = gateHistory(log, now, 8);
  const summary = week.passes || week.wrong
    ? `Son 7 gün: ${week.passes} giriş · ${week.wrong} yanlış deneme${week.locks ? ` · ${week.locks} kilit` : ''}`
    : 'Son 7 günde kayıt yok';

  return (
    <div className="mt-4 rounded-2xl border border-white/12 bg-[#050b1d]/60">
      <button type="button" aria-expanded={open} aria-controls="acct-gate-history" onClick={() => setOpen(value => !value)}
        className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-white/5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
        <span aria-hidden="true" className="text-lg">🕒</span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-black">Kapı geçmişi</strong>
          <span className="block text-xs text-sky-100/70">{summary}</span>
        </span>
        {week.wrong > 0 && <span className="shrink-0 rounded-full bg-amber-300/15 px-2.5 py-1 text-xs font-black text-amber-100">{week.wrong} yanlış</span>}
        <span aria-hidden="true" className={'shrink-0 text-sky-100/70 transition-transform ' + (open ? 'rotate-180' : '')}>▾</span>
      </button>
      <div id="acct-gate-history" hidden={!open} className="border-t border-white/10 px-3 pb-3 pt-2">
        {items.length ? (
          <ol aria-label="Son kayıtlar, en yenisi önce" className="divide-y divide-white/[0.06]">
            {items.map(item => (
              <li key={item.key} className="flex items-start gap-2.5 py-2">
                <span aria-hidden="true" className="mt-0.5 text-base leading-none">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className={'block text-sm font-bold ' + TONES[item.tone]}>{item.text}</span>
                  <span className="block text-xs text-slate-400">{item.when}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-2 text-sm text-sky-100/70">Henüz kayıt yok.</p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-sky-100/65">
          {hasPin
            ? 'Tanımadığın yanlış denemeler görürsen PIN\'ini kimsenin görmediği bir yerde girdiğinden emin ol. '
            : 'Tanımadığın bir giriş görürsen bir çocuk soruyu çözmüş olabilir; PIN belirlersen yalnızca sen açarsın. '}
          Yalnızca bu cihazda, son 30 gün tutulur; yazılan cevaplar kaydedilmez.
        </p>
      </div>
    </div>
  );
};
