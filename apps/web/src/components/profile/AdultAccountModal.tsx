'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase/client';
import { sendAdultOtpEmail, verifyAdultOtp, getAdultAccount, signOutAdult, deleteAdultAccount } from '../../lib/supabase/auth';
import { CloudSyncService } from '../../lib/supabase/sync';
import { getProgressRepository } from '../../lib/progress';
import type { AdultAccountInfo, PlayerProfile } from '@ventra/shared';
import { useDialogFocus } from '@/lib/a11y/useDialogFocus';
import { useFocusRescue } from '@/lib/a11y/useFocusRescue';
import { AvatarPortrait } from './AvatarPortrait';
import { PinField } from './PinField';
import { GateHistory } from './GateHistory';
import { recordGateEvent, type GateNote } from '@/lib/profile/parentGateLog';
import {
  cancelPinReset, clearPinRecord, createPinRecord, formatWait, maskEmail, pinProblem, pinSupported, readPinRecord, resetWaitMs,
  withNewRecoveryKey, writePinRecord, type ParentPinRecord
} from '@/lib/profile/parentPin';
import { cleanOtpCode, cloudState, friendlyAccountError, isEmailLike, lastSyncLabel, playerDetail } from '@/lib/profile/profileHub';

interface AdultAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
  /** The family panel opens this window itself, so it hides the link to it. */
  showReportLink?: boolean;
}

type Notice = { type: 'success' | 'error'; text: string };
/** One inline confirmation at a time: no browser confirm() dialogs. */
type Pending = { kind: 'link' | 'delete'; profileId: string } | null;
const RESEND_SECONDS = 30;

/** Parent-only window (behind the parental gate): sign in with an e-mail
 * code, back up chosen children, sync, delete a child or the account. */
export const AdultAccountModal: React.FC<AdultAccountModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted,
  showReportLink = true
}) => {
  const [account, setAccount] = useState<AdultAccountInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<Notice | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  // Parent lock: an optional PIN tied to the family account.
  const [pinRecord, setPinRecord] = useState<ParentPinRecord | null>(null);
  const [pinStep, setPinStep] = useState<'idle' | 'new' | 'confirm' | 'key' | 'remove'>('idle');
  // A new PIN (or a new recovery key) is saved only after the parent shows
  // they kept the key: they type its last four characters.
  const [pendingPin, setPendingPin] = useState<{ record: ParentPinRecord; recoveryKey: string; isNew: boolean } | null>(null);
  const [keyCheck, setKeyCheck] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);
  const [pinFirst, setPinFirst] = useState('');
  const [pinSecond, setPinSecond] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinBusy, setPinBusy] = useState(false);
  // Bumped after every PIN change so the gate history shows it at once.
  const [gateVersion, setGateVersion] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, isOpen);
  useFocusRescue(dialogRef, isOpen, [account, checked, isOtpSent, pending, deleteAccountOpen, message, profiles, isLoading, pinStep, pinRecord, pendingPin]);

  const configured = isSupabaseConfigured();

  const loadData = useCallback(async () => {
    try {
      setAccount(await getAdultAccount());
      setProfiles(await getProgressRepository().getAllProfiles());
    } catch (e) {
      console.error('Yetişkin hesabı yükleme hatası:', e);
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadData();
    setMessage(null);
    setSyncStatus(null);
    setPending(null);
    setDeleteAccountOpen(false);
    setDeleteEmail('');
    setPinRecord(readPinRecord());
    setPinStep('idle');
    setPinFirst('');
    setPinSecond('');
    setPinMessage('');
  }, [isOpen, loadData]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(seconds => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const fail = (where: string, error: unknown, fallback: string) => {
    // Handled and explained on screen: a warning, not an error report.
    console.warn('[Yetişkin hesabı] ' + where, error);
    setMessage({ type: 'error', text: friendlyAccountError(error, fallback) });
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading) return;
    const clean = email.trim().toLowerCase();
    if (!isEmailLike(clean)) {
      setMessage({ type: 'error', text: 'E-posta adresini kontrol et.' });
      return;
    }
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await sendAdultOtpEmail(clean);
      if (!res.success) {
        fail('kod gönderilemedi', res.error, 'Kod gönderilemedi. Biraz sonra yeniden dene.');
        return;
      }
      setEmail(clean);
      setIsOtpSent(true);
      setOtpToken('');
      setCooldown(RESEND_SECONDS);
      setMessage({ type: 'success', text: `Kodu ${clean} adresine gönderdik. Gelen kutunu ve gereksiz klasörünü kontrol et.` });
    } catch (error) {
      fail('kod gönderilemedi', error, 'Kod gönderilemedi. Biraz sonra yeniden dene.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || otpToken.length < 6) return;
    setMessage(null);
    setIsLoading(true);
    try {
      const res = await verifyAdultOtp(email, otpToken);
      if (!res.success) {
        fail('kod doğrulanamadı', res.error, 'Kod doğrulanamadı. Yeni bir kod isteyip yeniden dene.');
        return;
      }
      setIsOtpSent(false);
      setOtpToken('');
      await loadData();
      setMessage({ type: 'success', text: 'Giriş yapıldı. Yedeklemek istediğin çocuk profillerini aşağıdan ekleyebilirsin.' });
    } catch (error) {
      fail('kod doğrulanamadı', error, 'Kod doğrulanamadı. Yeni bir kod isteyip yeniden dene.');
    } finally {
      setIsLoading(false);
    }
  };

  const recordSuccess = (userId: string) => {
    const now = new Date().toISOString();
    try { window.localStorage.setItem('ventra-last-sync:' + userId, now); } catch {}
    setAccount(current => current?.userId === userId ? { ...current, lastSyncedAt: now } : current);
  };

  // One action both ways: this device's progress goes up, children backed up
  // on another device come down, deletions travel as tombstones.
  const handleSyncNow = async () => {
    if (!account || isLoading) return;
    setIsLoading(true);
    setPending(null);
    setSyncStatus('Eşitleniyor…');
    setMessage(null);
    try {
      // Includes existing cloud children and local deletion tombstones.
      // Syncing only the current local profile list would miss deleted ones.
      const updated = await CloudSyncService.getInstance().pullAllCloudProfiles();
      await loadData();
      const allLocal = await getProgressRepository().getAllProfiles();
      const guests = allLocal.filter(profile => !profile.userId).length;
      recordSuccess(account.userId);
      onSyncCompleted?.();
      setMessage({ type: 'success', text:
        (updated.length ? `Eşitlendi: ${updated.length} aile profili güncel.` : 'Eşitlendi. Aile hesabında henüz yedeklenmiş profil yok.') +
        (guests ? ` ${guests} profil yalnızca bu cihazda; yedeklemek için “Yedeklemeye ekle” düğmesine dokun.` : '')
      });
    } catch (error) {
      fail('eşitleme', error, 'Eşitleme tamamlanamadı. Bu cihazdaki ilerleme korunuyor; biraz sonra yeniden dene.');
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  const handleLinkProfile = async (profile: PlayerProfile) => {
    if (!account || profile.userId || isLoading) return;
    setIsLoading(true);
    setPending(null);
    setSyncStatus(`${profile.nickname} yedeklemeye ekleniyor…`);
    setMessage(null);
    try {
      const result = await CloudSyncService.getInstance().syncProfile(profile.id, { allowLink: true });
      if (!result.success) throw new Error(result.errorMessage || 'Bağlantı başarısız.');
      await loadData();
      recordSuccess(account.userId);
      setMessage({ type: 'success', text: `${profile.nickname} artık aile hesabında yedekleniyor. ${result.uploadedEventsCount} oyun kaydı buluta gönderildi.` });
      onSyncCompleted?.();
    } catch (error) {
      fail('profil bağlanamadı', error, 'Profil yedeklemeye eklenemedi. Bu cihazdaki ilerleme korunuyor.');
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  const handleDeleteLinkedChild = async (profile: PlayerProfile) => {
    if (!account || isLoading || profile.userId !== account.userId) return;
    setIsLoading(true);
    setPending(null);
    setSyncStatus(`${profile.nickname} siliniyor…`);
    setMessage(null);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Bulut bağlantısı yok.');
      // One server transaction deletes all progress events and leaves a
      // profile tombstone, allowing the other family device to remove its copy.
      const { data, error } = await client.rpc('delete_child_profile', {
        p_profile_id: profile.id
      });
      if (error) {
        console.error('[Yetişkin hesabı] delete_child_profile', error);
        throw new Error('Profil buluttan silinemedi.');
      }
      if (data !== profile.id) throw new Error('Sunucu çocuk profilinin silindiğini doğrulamadı.');
      await getProgressRepository().deleteProfile(profile.id);
      await loadData();
      onSyncCompleted?.();
      setMessage({ type: 'success', text: `${profile.nickname} profili ve öğrenme kayıtları buluttan ve bu cihazdan silindi.` });
    } catch (err) {
      fail('profil silinemedi', err, 'Profil silinemedi. Bu cihazdaki profil korunuyor; yeniden dene.');
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  const handleSignOut = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try { await signOutAdult(); } catch (error) { console.error('[Yetişkin hesabı] oturum kapatma', error); }
    finally { setIsLoading(false); }
    setAccount(null);
    setPending(null);
    setDeleteAccountOpen(false);
    setMessage({ type: 'success', text: 'Oturum kapatıldı. Profiller ve ilerleme bu cihazda kalmaya devam ediyor.' });
    await loadData();
  };

  const emailMatches = Boolean(account && deleteEmail.trim().toLowerCase() === account.email.toLowerCase());

  const handleDeleteAccount = async () => {
    if (!account || isLoading || !emailMatches) return;
    const accountId = account.userId;
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await deleteAdultAccount();
      if (!res.success) {
        fail('hesap silinemedi', res.error, 'Hesap silinemedi. Biraz sonra yeniden dene.');
        return;
      }
      // The cloud copy is gone. Children on this device stay playable and
      // become local profiles again (not tied to a deleted account), with every
      // game queued so a future family link uploads the whole history.
      const repo = getProgressRepository();
      for (const profile of await repo.getAllProfiles()) {
        if (profile.userId === accountId) await repo.releaseProfileFromCloud(profile.id);
      }
      // A PIN tied to the deleted account can no longer use its e-mail: the
      // e-mail link goes, the PIN and its recovery key stay (an old PIN
      // without a recovery key is removed — nothing could reset it any more).
      const tied = readPinRecord();
      const pinWasTied = tied?.ownerId === accountId;
      if (tied && pinWasTied) {
        if (tied.recoveryHash) {
          const kept = { ...tied, ownerId: null, ownerEmail: null };
          writePinRecord(kept); setPinRecord(kept);
        } else { clearPinRecord(); setPinRecord(null); noteGate('pin-removed'); }
        setPinStep('idle');
      }
      try { window.localStorage.removeItem('ventra-last-sync:' + accountId); } catch {}
      setAccount(null);
      setDeleteAccountOpen(false);
      setDeleteEmail('');
      onSyncCompleted?.();
      setMessage({ type: 'success', text: 'Aile hesabı ve buluttaki tüm yedekler silindi. Bu cihazdaki profiller ve ilerleme yerinde duruyor.' +
        (pinWasTied ? (tied?.recoveryHash ? ' Ebeveyn PIN\'i ve kurtarma anahtarın geçerli; e-postayla açma kaldırıldı.' : ' Bu hesaba bağlı eski Ebeveyn PIN\'i kaldırıldı; kapı yeniden yazılı soruyu soruyor.') : '') });
      await loadData();
    } catch (error) {
      fail('hesap silinemedi', error, 'Hesap silinemedi. Biraz sonra yeniden dene.');
    } finally {
      setIsLoading(false);
    }
  };

  // A PIN works with or without a family account: the recovery key always
  // resets it; a family account adds the e-mail code. Changing a PIN keeps
  // the family it was tied to unless another account is signed in.
  const pinOwner = account ? { id: account.userId, email: account.email }
    : pinRecord?.ownerId && pinRecord.ownerEmail ? { id: pinRecord.ownerId, email: pinRecord.ownerEmail } : null;
  const noteGate = (note: GateNote) => { recordGateEvent({ e: note }); setGateVersion(version => version + 1); };
  const startPin = () => { setPinStep('new'); setPinFirst(''); setPinSecond(''); setPinMessage(''); setPendingPin(null); };
  const stopPin = () => { setPinStep('idle'); setPinFirst(''); setPinSecond(''); setPinMessage(''); setPendingPin(null); setKeyCheck(''); setKeyCopied(false); };
  const advancePin = async (value: string) => {
    if (pinBusy) return;
    if (pinStep === 'new') {
      const problem = pinProblem(value);
      if (problem) { setPinMessage(problem); setPinFirst(''); return; }
      setPinMessage('');
      setPinStep('confirm');
      return;
    }
    if (pinStep !== 'confirm') return;
    if (value !== pinFirst) {
      setPinMessage('PIN\'ler eşleşmedi. Baştan belirleyelim.');
      setPinStep('new'); setPinFirst(''); setPinSecond('');
      return;
    }
    setPinBusy(true);
    try {
      const created = await createPinRecord(value, pinOwner);
      setPendingPin({ ...created, isNew: true });
      setKeyCheck(''); setKeyCopied(false); setPinMessage('');
      setPinStep('key');
    } catch (error) {
      console.warn('[Yetişkin hesabı] PIN hazırlanamadı', error);
      setPinMessage(friendlyAccountError(error, 'PIN kaydedilemedi. Yeniden dene.'));
    } finally {
      setPinBusy(false);
    }
  };
  const newRecoveryKey = async () => {
    if (!pinRecord || pinBusy) return;
    setPinBusy(true);
    try {
      const next = await withNewRecoveryKey(pinRecord);
      setPendingPin({ ...next, isNew: false });
      setKeyCheck(''); setKeyCopied(false); setPinMessage('');
      setPinStep('key');
    } finally {
      setPinBusy(false);
    }
  };
  const keyTail = pendingPin ? pendingPin.recoveryKey.slice(-4) : '';
  const keyConfirmed = Boolean(pendingPin) && keyCheck.trim().toUpperCase() === keyTail;
  const finishKey = () => {
    if (!pendingPin || !keyConfirmed) return;
    writePinRecord(pendingPin.record);
    setPinRecord(pendingPin.record);
    const fresh = pendingPin.isNew;
    noteGate(fresh ? 'pin-set' : 'key-renewed');
    stopPin();
    setMessage({ type: 'success', text: fresh
      ? 'Ebeveyn kilidi açık: kapı artık yalnızca PIN\'i soracak. Kilitlenirse ya da PIN\'i unutursan kurtarma anahtarınla' + (pinOwner ? ' veya e-postanla' : '') + ' hemen açarsın.'
      : 'Yeni kurtarma anahtarı kaydedildi; eskisi artık çalışmıyor.' });
  };
  const copyKey = () => {
    if (!pendingPin) return;
    void navigator.clipboard?.writeText(pendingPin.recoveryKey).then(() => setKeyCopied(true)).catch(() => setKeyCopied(false));
  };
  const cancelReset = () => {
    if (!pinRecord) return;
    const next = cancelPinReset(pinRecord);
    writePinRecord(next);
    setPinRecord(next);
    noteGate('reset-cancel');
    setMessage({ type: 'success', text: 'PIN sıfırlama isteği iptal edildi.' });
  };
  const removePin = () => {
    clearPinRecord();
    setPinRecord(null);
    noteGate('pin-removed');
    stopPin();
    setMessage({ type: 'success', text: 'PIN kaldırıldı. Kapı yeniden yazılı soruyu soruyor.' });
  };
  const pendingReset = pinRecord ? resetWaitMs(pinRecord) : null;
  // Two-step sums are 4th-grade work: from then on a child can solve the
  // written question, so the window recommends a PIN by name.
  const solvers = profiles.filter(p => (p.gradeLevel ?? 0) >= 4);

  const linkedCount = account ? profiles.filter(p => p.userId === account.userId).length : 0;
  const localCount = profiles.filter(p => !p.userId).length;
  const subtitle = !configured
    ? 'Bu kurulumda profiller yalnızca bu cihazda saklanıyor.'
    : account
      ? 'Çocukların ilerlemesini aile hesabına yedekle, başka cihazda kaldığı yerden devam etsin.'
      : 'Şifre yok: her girişte e-postana tek kullanımlık bir kod gelir.';

  const lockSection = checked ? (
            <section aria-labelledby="acct-pin-title" className="rounded-3xl border border-amber-200/25 bg-gradient-to-br from-amber-300/10 to-transparent p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-300/15 text-2xl">🔐</span>
                <div className="min-w-0 flex-1">
                  <h3 id="acct-pin-title" className="text-base font-black">Ebeveyn kilidi</h3>
                  <p className="mt-0.5 text-sm text-sky-100/80">
                    {!pinRecord ? 'Şu an iki adımlı yazılı bir soru soruluyor.' :
                      <>PIN açık{pinRecord.recoveryHash ? ' · kurtarma anahtarı var' : ''}{pinRecord.ownerEmail ? <> · <span className="break-all">{maskEmail(pinRecord.ownerEmail)}</span></> : ''}</>}
                  </p>
                </div>
                {pinRecord && <span className="shrink-0 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-black text-emerald-100">✓ Açık</span>}
              </div>
              {pinRecord && pendingReset !== null && pinStep === 'idle' && (
                <div role="status" className="mt-3 rounded-2xl border border-amber-200/40 bg-amber-300/10 p-3 text-sm leading-relaxed text-amber-50">
                  <strong className="block">Bu cihazda bir PIN sıfırlama isteği var{pendingReset > 0 ? ` · ${formatWait(pendingReset)} sonra hazır` : ' · hazır'}.</strong>
                  Sen başlatmadıysan iptal et; PIN aynen kalır.
                  <button type="button" onClick={cancelReset}
                    className="mt-2 block min-h-11 w-full rounded-xl bg-amber-200 px-3 text-sm font-black text-slate-950 sm:w-auto">İsteği iptal et</button>
                </div>
              )}
              {!pinSupported() ? (
                <p className="mt-3 text-sm leading-relaxed text-sky-100/80">PIN yalnızca güvenli bağlantıda (https ya da uygulama) kullanılabilir.</p>
              ) : pinStep === 'idle' ? (
                pinRecord ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={startPin}
                      className="min-h-12 rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-sky-50 hover:bg-white/10">PIN'i değiştir</button>
                    <button type="button" onClick={() => void newRecoveryKey()} disabled={pinBusy}
                      className="min-h-12 rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-sky-50 hover:bg-white/10 disabled:opacity-60">Yeni kurtarma anahtarı</button>
                    <button type="button" onClick={() => setPinStep('remove')}
                      className="min-h-12 rounded-2xl border border-rose-300/40 px-3 text-sm font-bold text-rose-100 hover:bg-rose-500/15">PIN'i kaldır</button>
                  </div>
                ) : (
                  <>
                    {solvers.length > 0 && (
                      <p className="mt-3 rounded-2xl border border-amber-200/40 bg-amber-300/10 px-3 py-2 text-sm leading-relaxed text-amber-50">
                        <strong>{solvers.length === 1 ? `${solvers[0].nickname} ${solvers[0].gradeLevel}. sınıfta:` : `Bu cihazda ${solvers.length} oyuncu 4. sınıf ya da üstünde:`}</strong>{' '}
                        iki adımlı soruyu çözebilir{solvers.length === 1 ? '' : 'ler'}. Yalnızca senin bildiğin bir PIN öneririz.
                      </p>
                    )}
                    <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-sky-100/85">
                      <li>• Soru, okuyup iki adım işlem yapamayan küçük çocukları durdurur; büyük çocuklar çözebilir. Bilmedikleri bir PIN'i açamazlar.</li>
                      <li>• PIN'le her girişte 4 rakam yeter; soru hiç gelmez.</li>
                      <li>• Beklemek yok: kapı kilitlense de kurtarma anahtarınla{account ? ' ya da e-postanla' : ''} hemen açarsın.</li>
                      <li>• PIN'i unutursan da aynı yolla sıfırlarsın. Aile hesabı gerekmez.</li>
                    </ul>
                    <button type="button" onClick={startPin}
                      className="mt-3 min-h-12 w-full rounded-2xl bg-gradient-to-r from-amber-200 to-yellow-300 px-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/40 hover:brightness-105 sm:w-auto">
                      🔐 PIN belirle
                    </button>
                  </>
                )
              ) : pinStep === 'remove' ? (
                <div role="group" aria-label="PIN kaldırılsın mı?" className="mt-3 rounded-2xl border border-rose-300/35 bg-rose-950/40 p-3">
                  <p className="text-sm leading-relaxed">PIN kaldırılsın mı? Kapı yeniden yazılı soruyu sorar; büyük çocuklar soruyu çözebilir.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={stopPin} className="min-h-11 rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-bold">Vazgeç</button>
                    <button type="button" onClick={removePin} className="min-h-11 rounded-xl bg-rose-600 px-3 text-sm font-black text-white">PIN'i kaldır</button>
                  </div>
                </div>
              ) : pinStep === 'key' && pendingPin ? (
                <form onSubmit={e => { e.preventDefault(); finishKey(); }} className="mt-4 flex flex-col gap-3">
                  <p className="text-sm font-bold text-amber-50">Kurtarma anahtarın</p>
                  <p className="rounded-2xl border border-amber-200/40 bg-[#050b1d] px-3 py-4 text-center font-mono text-2xl font-black tracking-[0.12em] text-amber-100"
                    aria-label={'Kurtarma anahtarı: ' + pendingPin.recoveryKey.split('').join(' ')}>{pendingPin.recoveryKey}</p>
                  <ul className="space-y-1 text-sm leading-relaxed text-sky-100/85">
                    <li>• Kapı kilitlenirse ya da PIN'i unutursan bununla hemen açarsın.</li>
                    <li>• Bir kâğıda yaz, ekran görüntüsünü al ya da şifre yöneticine kaydet. Çocukların göremeyeceği bir yerde dursun.</li>
                    <li>• Anahtar bir daha gösterilmez{pendingPin.isNew ? '' : '; eskisi artık çalışmaz'}.</li>
                  </ul>
                  <button type="button" onClick={copyKey}
                    className="min-h-11 rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-sky-50 hover:bg-white/10">{keyCopied ? '✓ Kopyalandı' : '📋 Anahtarı kopyala'}</button>
                  <label htmlFor="acct-key-check" className="text-sm font-bold text-amber-50">Kaydettiğini göstermek için son 4 karakteri yaz</label>
                  <input id="acct-key-check" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={4}
                    value={keyCheck} onChange={e => setKeyCheck(e.target.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase())} placeholder="••••"
                    className="min-h-12 w-full rounded-2xl border border-amber-200/30 bg-[#050b1d] px-4 text-center font-mono text-xl font-black tracking-[0.3em] text-white outline-none focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/25" />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={stopPin} className="min-h-12 rounded-2xl border border-white/25 bg-white/5 px-3 text-sm font-bold">Vazgeç</button>
                    <button type="submit" disabled={!keyConfirmed}
                      className="min-h-12 rounded-2xl bg-gradient-to-r from-amber-200 to-yellow-300 px-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">
                      {pendingPin.isNew ? 'Kaydettim, PIN\'i aç' : 'Kaydettim'}
                    </button>
                  </div>
                  {pendingPin.isNew && <p className="text-xs leading-relaxed text-sky-100/70">Vazgeçersen PIN kaydedilmez.</p>}
                </form>
              ) : (
                <form onSubmit={e => { e.preventDefault(); void advancePin(pinStep === 'new' ? pinFirst : pinSecond); }}
                  className="mt-4 flex flex-col gap-3 text-center">
                  <p className="text-sm font-bold text-amber-50" aria-live="polite">{pinStep === 'new' ? 'Yeni PIN: 4 rakam' : 'Aynı PIN\'i tekrar yaz'}</p>
                  <PinField key={pinStep} id="acct-pin" label={pinStep === 'new' ? 'Yeni Ebeveyn PIN\'i, 4 rakam' : 'Ebeveyn PIN\'ini tekrar yaz'}
                    value={pinStep === 'new' ? pinFirst : pinSecond} autoFocus disabled={pinBusy} invalid={Boolean(pinMessage)}
                    describedBy={pinMessage ? 'acct-pin-message' : 'acct-pin-help'}
                    onChange={value => { if (pinStep === 'new') setPinFirst(value); else setPinSecond(value); if (value) setPinMessage(''); }}
                    onComplete={value => void advancePin(value)} />
                  {pinMessage && <p id="acct-pin-message" role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/60 px-3 py-2 text-sm font-bold text-rose-100">{pinMessage}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={stopPin} className="min-h-12 rounded-2xl border border-white/25 bg-white/5 px-3 text-sm font-bold">Vazgeç</button>
                    <button type="submit" disabled={pinBusy || (pinStep === 'new' ? pinFirst : pinSecond).length < 4}
                      className="min-h-12 rounded-2xl bg-gradient-to-r from-amber-200 to-yellow-300 px-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">
                      {pinBusy ? 'Hazırlanıyor…' : 'Devam'}
                    </button>
                  </div>
                  <p id="acct-pin-help" className="text-xs leading-relaxed text-sky-100/70">
                    Kolay tahmin edilen PIN'ler (1111, 1234, 1212 gibi) kabul edilmez. PIN bu cihazda şifrelenmiş olarak saklanır;
                    sonraki adımda bir kurtarma anahtarı alırsın.
                  </p>
                </form>
              )}
              {pinStep === 'idle' && <GateHistory version={gateVersion} hasPin={Boolean(pinRecord)} />}
            </section>
  ) : null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#030817]/90 p-2 backdrop-blur-xl sm:p-4"
      onKeyDown={e => { if (e.key === 'Escape' && !isLoading) { e.stopPropagation(); onClose(); } }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="adult-account-title" aria-describedby="adult-account-subtitle"
        className="acct-panel relative flex max-h-[96dvh] outline-none w-full max-w-[640px] flex-col overflow-hidden rounded-[28px] border border-sky-200/25 bg-gradient-to-b from-[#0f2146] via-[#0b1734] to-[#09122a] text-white shadow-[0_30px_90px_#000b]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <header className="relative flex items-start justify-between gap-3 border-b border-white/10 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">🛡️ Ebeveyn alanı</p>
            <h2 id="adult-account-title" className="mt-1 text-2xl font-black tracking-tight sm:text-[1.7rem]">Yedekleme ve hesap</h2>
            <p id="adult-account-subtitle" className="mt-1 text-sm leading-relaxed text-sky-100/80">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isLoading} aria-label="Pencereyi kapat"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 text-lg font-black hover:bg-white/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 disabled:opacity-50">✕</button>
        </header>

        <div className="acct-body relative flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
          {message && (
            <p role={message.type === 'error' ? 'alert' : 'status'}
              className={'rounded-2xl border px-4 py-3 text-sm font-semibold leading-relaxed ' + (message.type === 'success'
                ? 'border-emerald-300/40 bg-emerald-500/15 text-emerald-50'
                : 'border-rose-300/45 bg-rose-950/60 text-rose-50')}>
              {message.type === 'success' ? '✓ ' : '⚠️ '}{message.text}
            </p>
          )}

          {!configured && (
            <section aria-labelledby="acct-offline-title" className="rounded-3xl border border-amber-200/30 bg-amber-300/10 p-5">
              <h3 id="acct-offline-title" className="text-base font-black text-amber-100">☁️ Bulut yedekleme bu kurulumda kapalı</h3>
              <p className="mt-2 text-sm leading-relaxed text-amber-50/90">
                Ventra internet olmadan tam çalışır. {profiles.length ? `Bu cihazdaki ${profiles.length} profil ve ilerlemesi` : 'Profiller ve ilerleme'} yalnızca bu cihazda saklanır;
                tarayıcı verileri silinirse ya da cihaz değişirse geri getirilemez.
              </p>
            </section>
          )}
          {!configured && lockSection}

          {configured && !account && !checked && (
            <p role="status" className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-sky-100">Hesap bilgisi okunuyor…</p>
          )}

          {configured && !account && checked && (
            <>
              <ul className="grid gap-2 sm:grid-cols-3" aria-label="Aile hesabı ne sağlar?">
                {[
                  ['☁️', 'İlerleme güvende', 'Tarayıcı verisi silinse de yıldızlar ve görevler korunur.'],
                  ['📱', 'Her cihazda aynı kaşif', 'Tablette başlayan macera telefonda kaldığı yerden sürer.'],
                  ['🔐', 'Şifre gerekmez', 'Her girişte e-postana tek kullanımlık bir kod gelir.']
                ].map(([icon, title, text]) => (
                  <li key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                    <span aria-hidden="true" className="text-2xl">{icon}</span>
                    <strong className="mt-1 block text-sm font-black">{title}</strong>
                    <span className="mt-0.5 block text-xs leading-relaxed text-sky-100/80">{text}</span>
                  </li>
                ))}
              </ul>

              <section aria-labelledby="acct-signin-title" className="rounded-3xl border border-sky-200/20 bg-[#071229]/70 p-5">
                <ol className="flex items-center gap-2 text-xs font-black" aria-label="Giriş adımları">
                  <li className={'rounded-full px-3 py-1 ' + (!isOtpSent ? 'bg-sky-300 text-slate-950' : 'bg-emerald-400/20 text-emerald-100')} aria-current={!isOtpSent ? 'step' : undefined}>{isOtpSent ? '✓' : '1'} E-posta</li>
                  <li aria-hidden="true" className="h-px flex-1 bg-white/15" />
                  <li className={'rounded-full px-3 py-1 ' + (isOtpSent ? 'bg-sky-300 text-slate-950' : 'bg-white/10 text-sky-100/80')} aria-current={isOtpSent ? 'step' : undefined}>2 Kod</li>
                </ol>
                <h3 id="acct-signin-title" className="mt-4 text-lg font-black">{isOtpSent ? 'E-postana gelen kodu yaz' : 'Aile hesabına giriş yap'}</h3>
                {!isOtpSent ? (
                  <form onSubmit={handleSendOtp} className="mt-3 space-y-3">
                    <label htmlFor="acct-email" className="block text-sm font-bold text-sky-100">E-posta adresin</label>
                    <input id="acct-email" type="email" inputMode="email" autoComplete="email" required value={email}
                      onChange={e => setEmail(e.target.value)} placeholder="ornek@eposta.com"
                      className="min-h-14 w-full rounded-2xl border border-sky-200/30 bg-[#040a1a] px-4 text-base text-white outline-none placeholder:text-slate-500 focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/20" />
                    <button type="submit" disabled={isLoading || !email.trim()}
                      className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 px-5 text-base font-black text-slate-950 shadow-lg shadow-sky-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-60">
                      {isLoading ? 'Gönderiliyor…' : 'Kodu gönder →'}
                    </button>
                    <p className="text-xs leading-relaxed text-sky-100/70">Hesabın yoksa bu adresle yeni bir aile hesabı açılır.</p>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="mt-3 space-y-3">
                    <p className="text-sm leading-relaxed text-sky-100/85">Kod <strong className="break-all text-white">{email}</strong> adresine gitti.</p>
                    <label htmlFor="acct-otp" className="sr-only">E-postadaki doğrulama kodu</label>
                    <input id="acct-otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={10}
                      required value={otpToken} onChange={e => setOtpToken(cleanOtpCode(e.target.value))} placeholder="••••••" autoFocus
                      className="min-h-16 w-full rounded-2xl border border-sky-200/30 bg-[#040a1a] px-4 text-center text-2xl font-black tracking-[0.4em] tabular-nums text-white outline-none placeholder:text-slate-600 focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/20" />
                    <button type="submit" disabled={isLoading || otpToken.length < 6}
                      className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 text-base font-black text-emerald-950 shadow-lg shadow-emerald-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-60">
                      {isLoading ? 'Doğrulanıyor…' : 'Giriş yap'}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" disabled={isLoading || cooldown > 0} onClick={() => void handleSendOtp()}
                        className="min-h-12 rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-sky-100 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                        {cooldown > 0 ? `Yeni kod (${cooldown} sn)` : 'Kodu yeniden gönder'}
                      </button>
                      <button type="button" disabled={isLoading} onClick={() => { setIsOtpSent(false); setOtpToken(''); setMessage(null); }}
                        className="min-h-12 rounded-2xl border border-white/20 bg-white/5 px-3 text-sm font-bold text-sky-100 hover:bg-white/10">
                        E-postayı değiştir
                      </button>
                    </div>
                  </form>
                )}
              </section>
              {lockSection}
            </>
          )}

          {account && (
            <>
              <section aria-labelledby="acct-family-title" className="rounded-3xl border border-sky-200/25 bg-gradient-to-br from-sky-400/15 via-indigo-500/10 to-transparent p-5">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-300/20 text-2xl">👨‍👩‍👧</span>
                  <div className="min-w-0">
                    <h3 id="acct-family-title" className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">Aile hesabı</h3>
                    <p className="mt-0.5 break-all text-base font-black text-white">{account.email}</p>
                    <p className="mt-1 text-sm text-sky-100/85">
                      {linkedCount ? `${linkedCount} profil yedekleniyor` : 'Henüz yedeklenen profil yok'}{localCount ? ` · ${localCount} profil yalnızca bu cihazda` : ''}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-sky-100/70">{lastSyncLabel(account.lastSyncedAt)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => void handleSyncNow()} disabled={isLoading}
                  className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 to-teal-300 px-5 text-base font-black text-emerald-950 shadow-lg shadow-emerald-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-300 disabled:cursor-wait disabled:opacity-70">
                  <span aria-hidden="true">☁️</span>{isLoading && syncStatus ? syncStatus : 'Şimdi eşitle'}
                </button>
                <p className="mt-2 text-xs leading-relaxed text-sky-100/70">Bu cihazdaki ilerleme buluta gider; başka cihazda yedeklenen profiller buraya gelir.</p>
              </section>

              <section aria-labelledby="acct-children-title" className="rounded-3xl border border-white/10 bg-[#071229]/60 p-4 sm:p-5">
                <h3 id="acct-children-title" className="text-base font-black">Çocuk profilleri</h3>
                {profiles.length === 0 && (
                  <p className="mt-2 text-sm leading-relaxed text-sky-100/80">Bu cihazda henüz profil yok. “Şimdi eşitle” ile aile hesabındaki profilleri getirebilirsin.</p>
                )}
                <ul className="mt-3 space-y-2">
                  {profiles.map(profile => {
                    const state = cloudState(profile, account.userId);
                    const open = pending?.profileId === profile.id ? pending.kind : null;
                    return (
                      <li key={profile.id} className={'rounded-2xl border p-3 ' + (open === 'delete' ? 'border-rose-300/45 bg-rose-950/30' : 'border-white/10 bg-white/[0.05]')}>
                        <div className="flex flex-wrap items-center gap-3">
                          <AvatarPortrait id={profile.avatarId} size={48} className="h-12 w-12 shrink-0 rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black">{profile.nickname}</p>
                            <p className="truncate text-xs text-sky-100/75">{playerDetail(profile)}</p>
                            <span className={'mt-1 inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ' + (state === 'linked'
                              ? 'bg-emerald-400/15 text-emerald-100' : state === 'foreign' ? 'bg-rose-400/15 text-rose-100' : 'bg-amber-300/15 text-amber-100')}>
                              {state === 'linked' ? '☁️ Yedekleniyor' : state === 'foreign' ? '🔒 Başka bir aile hesabında' : '📱 Yalnızca bu cihazda'}
                            </span>
                          </div>
                          {state === 'local' && !open && (
                            <button type="button" disabled={isLoading} onClick={() => setPending({ kind: 'link', profileId: profile.id })}
                              className="min-h-11 w-full rounded-xl border border-emerald-300/60 bg-emerald-500/20 px-3 text-sm font-black text-emerald-50 hover:bg-emerald-500/30 disabled:opacity-60 sm:w-auto">
                              Yedeklemeye ekle
                            </button>
                          )}
                          {state === 'linked' && !open && (
                            <button type="button" disabled={isLoading} onClick={() => setPending({ kind: 'delete', profileId: profile.id })}
                              aria-label={`${profile.nickname} çocuk profilini sil`}
                              className="min-h-11 w-full rounded-xl border border-rose-300/45 bg-transparent px-3 text-sm font-bold text-rose-100 hover:bg-rose-500/15 disabled:opacity-60 sm:w-auto">
                              Profili sil
                            </button>
                          )}
                        </div>
                        {state === 'foreign' && (
                          <p className="mt-2 text-xs leading-relaxed text-sky-100/75">Bu profil başka bir yetişkin hesabıyla yedekleniyor. Güvenlik için bu oturumla değiştirilemez.</p>
                        )}
                        {open === 'link' && (
                          <div role="group" aria-label={`${profile.nickname} yedeklemeye eklensin mi?`} className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                            <p className="text-sm leading-relaxed">
                              <strong>{profile.nickname}</strong> aile hesabına yedeklensin mi? Takma ad, avatar, seviye tercihi ve oyun sonuçları buluta gider.
                              Bu sürümde yedekleme bağlantısı sonradan kaldırılamaz.
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => setPending(null)} className="min-h-11 rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-bold">Vazgeç</button>
                              <button type="button" disabled={isLoading} onClick={() => void handleLinkProfile(profile)}
                                className="min-h-11 rounded-xl bg-emerald-300 px-3 text-sm font-black text-emerald-950 disabled:opacity-60">Evet, yedekle</button>
                            </div>
                          </div>
                        )}
                        {open === 'delete' && (
                          <div role="group" aria-label={`${profile.nickname} kalıcı olarak silinsin mi?`} className="mt-3 rounded-xl border border-rose-300/35 bg-rose-950/40 p-3">
                            <p className="text-sm leading-relaxed">
                              <strong>{profile.nickname}</strong> ve tüm öğrenme kayıtları <strong>hem buluttan hem bu cihazdan</strong> kalıcı olarak silinir.
                              Aileye bağlı diğer cihazlardan da kalkar. Bu işlem geri alınamaz.
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button type="button" onClick={() => setPending(null)} className="min-h-11 rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-bold">Vazgeç</button>
                              <button type="button" disabled={isLoading} onClick={() => void handleDeleteLinkedChild(profile)}
                                className="min-h-11 rounded-xl bg-rose-600 px-3 text-sm font-black text-white disabled:opacity-60">Kalıcı olarak sil</button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              {lockSection}

              <section aria-labelledby="acct-session-title" className="rounded-3xl border border-white/10 bg-[#071229]/60 p-4 sm:p-5">
                <h3 id="acct-session-title" className="text-base font-black">Hesap</h3>
                {!deleteAccountOpen ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => void handleSignOut()} disabled={isLoading}
                      className="min-h-12 rounded-2xl border border-white/20 bg-white/5 px-4 text-sm font-bold text-sky-50 hover:bg-white/10 disabled:opacity-60">
                      Oturumu kapat
                    </button>
                    <button type="button" onClick={() => { setDeleteAccountOpen(true); setPending(null); }} disabled={isLoading}
                      className="min-h-12 rounded-2xl border border-rose-300/40 px-4 text-sm font-bold text-rose-100 hover:bg-rose-500/15 disabled:opacity-60">
                      Aile hesabını sil
                    </button>
                  </div>
                ) : (
                  <div role="group" aria-labelledby="acct-delete-title" className="mt-3 rounded-2xl border border-rose-300/40 bg-rose-950/40 p-4">
                    <h4 id="acct-delete-title" className="text-sm font-black text-rose-100">Aile hesabı kalıcı olarak silinsin mi?</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-rose-50/90">
                      <li>Buluttaki tüm profil yedekleri ve öğrenme kayıtları silinir.</li>
                      <li>Bu cihazdaki profiller ve ilerleme <strong>silinmez</strong>; yalnızca bu cihazda kalır.</li>
                      <li>Bu işlem geri alınamaz.</li>
                    </ul>
                    <label htmlFor="acct-delete-email" className="mt-3 block text-sm font-bold">Onaylamak için <span className="break-all">{account.email}</span> adresini yaz</label>
                    <input id="acct-delete-email" type="email" autoComplete="off" value={deleteEmail} onChange={e => setDeleteEmail(e.target.value)}
                      className="mt-1 min-h-12 w-full rounded-xl border border-rose-200/30 bg-[#12060c] px-3 text-base text-white outline-none placeholder:text-rose-200/40 focus-visible:border-rose-200" />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { setDeleteAccountOpen(false); setDeleteEmail(''); }} disabled={isLoading}
                        className="min-h-12 rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-bold">Vazgeç</button>
                      <button type="button" onClick={() => void handleDeleteAccount()} disabled={isLoading || !emailMatches}
                        className="min-h-12 rounded-xl bg-rose-600 px-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
                        {isLoading ? 'Siliniyor…' : 'Hesabı kalıcı olarak sil'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {showReportLink && (
            <Link href="/progress" className="flex min-h-14 items-center gap-3 rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 text-sm font-bold text-amber-50 hover:bg-amber-300/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
              <span aria-hidden="true" className="text-2xl">📊</span>
              <span className="min-w-0 flex-1"><strong className="block font-black">Aile Paneli</strong><span className="block text-xs font-semibold text-amber-50/80">İngilizce karnesi: kelimeler, tekrar listesi, beceriler</span></span>
              <span aria-hidden="true">→</span>
            </Link>
          )}

          <p className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-relaxed text-sky-100/75">
            <span aria-hidden="true">🛡️</span>
            <span>Buluta yalnızca takma ad, avatar, seviye tercihi ve oyun sonuçları (yıldız, görev, doğru/yanlış) gider.
              Gerçek ad, ses kaydı, konuşma dökümü ya da çocuğun yazdığı metin gönderilmez.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
