'use client';

import React, { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, CloudOff, GraduationCap, ShieldCheck, Sparkles, UserRound, UsersRound } from 'lucide-react';
import { VENTRA_STARTER_AVATARS, type PlayerProfile } from '@ventra/shared';
import { AvatarPortrait } from '../profile/AvatarPortrait';
import { soundService } from '@/lib/audio/SoundService';
import type { CreateProfileInput } from '@/lib/progress';

type Screen = 'choose' | 'individual' | 'family' | 'school';

interface KidsWelcomeGateProps {
  onCreateProfile: (input: CreateProfileInput) => Promise<void>;
  onOpenParent: () => void;
  existingProfile?: PlayerProfile | null;
  onContinue?: () => void;
}

export function KidsWelcomeGate({ onCreateProfile, onOpenParent, existingProfile, onContinue }: KidsWelcomeGateProps) {
  const [screen, setScreen] = useState<Screen>('choose');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(VENTRA_STARTER_AVATARS[0].id);
  const [grade, setGrade] = useState('');
  const [englishLevel, setEnglishLevel] = useState<'Pre-A1' | 'A1' | 'A2'>('Pre-A1');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 15) {
      setError('Takma ad 2–15 karakter arasında olmalı.');
      return;
    }
    if (!VENTRA_STARTER_AVATARS.some((item) => item.id === avatar)) {
      setError('Geçerli bir avatar seç.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onCreateProfile({
        nickname: trimmed,
        avatarId: avatar,
        gradeLevel: grade ? Number(grade) : null,
        englishLevel
      });
    } catch (err) {
      console.error('Çocuk profili oluşturulamadı:', err);
      setError('Profil kaydedilemedi. Cihazının depolama izinlerini kontrol edip yeniden dene.');
    } finally {
      setIsSaving(false);
    }
  }

  const section = screen === 'choose' ? (existingProfile ? 'Nasıl devam edeceksin?' : 'Macera yolunu seç') :
    screen === 'individual' ? 'Kendi kaşifini oluştur' :
    screen === 'family' ? 'Aile hesabıyla devam et' : 'Okul macerası';

  return (
    <div className="relative min-h-screen overflow-y-auto bg-[#06152f] px-4 py-6 text-white sm:px-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-20 h-[30rem] w-[30rem] rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute -right-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-slate-100 hover:bg-white/20">
            <ArrowLeft size={16} /> Ana Sayfa
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-900/40 px-3 py-2 text-xs font-bold text-sky-100">
            <Sparkles size={15} /> VENTRA KIDS
          </span>
        </header>

        <div className="mx-auto max-w-2xl pb-6 pt-9 text-center sm:pt-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] border border-white/25 bg-gradient-to-br from-sky-400/35 to-emerald-400/20 text-5xl shadow-2xl shadow-sky-500/20" aria-hidden="true">🏝️</div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-sky-200">Bir dünya, sonsuz keşif</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{section}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-sky-100/85 sm:text-base">
            {screen === 'choose' ? (existingProfile ? `${existingProfile.nickname}, yıldızların, avatarın ve görevlerin korunacak. Dilediğin zaman oyun yolunu değiştirebilirsin.` : 'İngilizce öğrenirken adalarını canlandır, yeni görevler keşfet. Başlamak için bir yol seç.') :
             screen === 'individual' ? 'Gerçek adını yazmana gerek yok. Takma ad ve ücretsiz bir avatar yeterli.' :
             screen === 'family' ? 'Ebeveyn hesabıyla bulut yedekleme ayarlarına eriş. Ailece aynı anda oyun modu henüz yok.' :
             'Okul sınıfları ve veli davet kodları yetişkin hesabı ile yönetilir.'}
          </p>
        </div>

        {existingProfile && onContinue && (
          <div className="mx-auto mb-5 flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true"><AvatarPortrait id={existingProfile.avatarId} size={44} className="h-11 w-11 rounded-xl" /></span>
              <div><p className="text-sm font-extrabold">{existingProfile.nickname}</p><p className="text-xs text-sky-100/80">Aynı çocuk profiliyle devam ediyorsun</p></div>
            </div>
            <button onClick={onContinue} className="rounded-xl border border-white/25 bg-slate-900/70 px-3 py-3 text-xs font-bold hover:bg-white/20">Oyuna Dön</button>
          </div>
        )}
        {screen === 'choose' && (
          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
            <button onClick={() => { if (existingProfile && onContinue) onContinue(); else { setScreen('individual'); setError(null); } }} className="group flex min-h-[270px] flex-col rounded-[2rem] border-2 border-emerald-300/60 bg-gradient-to-br from-emerald-700/80 via-teal-800/80 to-sky-900/90 p-6 text-left shadow-xl shadow-emerald-950/30 transition hover:-translate-y-1 hover:border-lime-300 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"><UserRound size={34} /></span>
              <strong className="mt-6 text-xl font-black">Bireysel Oyna</strong>
              <span className="mt-2 text-sm leading-relaxed text-white/85">{existingProfile ? 'Kaldığın adadan devam et; yeni kelimeler keşfet, görevlerini tamamla, yıldızlarını topla.' : 'Kendi kaşifini seç, sihirli adalara yolculuğa çık ve İngilizceyi oynayarak keşfet.'}</span>
              <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-extrabold text-lime-200">Hemen Başla <ArrowRight size={18} /></span>
            </button>

            <button onClick={() => setScreen('family')} className="group flex min-h-[270px] flex-col rounded-[2rem] border border-white/25 bg-gradient-to-br from-indigo-800/85 to-sky-950 p-6 text-left transition hover:-translate-y-1 hover:border-sky-300 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-300">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"><UsersRound size={34} /></span>
              <strong className="mt-6 text-xl font-black">Ailemle Oyna</strong>
              <span className="mt-2 text-sm leading-relaxed text-white/80">Çocuğunun İngilizce macerasına eşlik et; keşfettiği adaları ve kazandığı yıldızları birlikte kutla.</span>
              <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-sky-200">Aile Alanı <ArrowRight size={18} /></span>
            </button>

            <button onClick={() => setScreen('school')} className="group flex min-h-[270px] flex-col rounded-[2rem] border border-white/25 bg-gradient-to-br from-violet-800/80 to-slate-950 p-6 text-left transition hover:-translate-y-1 hover:border-violet-300 focus-visible:outline focus-visible:outline-4 focus-visible:outline-violet-300">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"><GraduationCap size={34} /></span>
              <strong className="mt-6 text-xl font-black">Okulumla Oyna</strong>
              <span className="mt-2 text-sm leading-relaxed text-white/80">Öğretmeninin sınıfına katıl, kelimelerle tanış ve hikâyelerle dolu adaları keşfet.</span>
              <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-violet-200">Okul Paneli <ArrowRight size={18} /></span>
            </button>
          </div>
        )}

        {screen === 'individual' && (
          <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-[2rem] border border-white/20 bg-slate-950/65 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
            <button type="button" disabled={isSaving} onClick={() => setScreen('choose')} className="mb-5 flex min-h-10 items-center gap-2 text-sm font-semibold text-sky-100 hover:text-white"><ArrowLeft size={16} /> Seçeneklere Dön</button>
            <label htmlFor="kid-nickname" className="block text-sm font-bold text-white">Kaşifinin takma adı</label>
            <input id="kid-nickname" required minLength={2} maxLength={15} autoComplete="off" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Örnek: Minik Kaşif" className="mt-2 w-full rounded-2xl border border-white/25 bg-slate-900 p-4 text-base text-white placeholder-slate-400 outline-none focus-visible:border-sky-300" />
            <fieldset className="mt-6">
              <legend className="text-sm font-bold">İlk macera arkadaşını seç · 3 ücretsiz kahraman</legend>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {VENTRA_STARTER_AVATARS.map((item) => (
                  <button type="button" key={item.id} aria-pressed={avatar === item.id} onClick={() => { setAvatar(item.id); soundService.playSfx('tap', 0.4); }}
                    className={`group flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-2 transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300 ${avatar === item.id ? 'border-lime-300 bg-emerald-500/20 shadow-[0_0_26px_#9ef1bc60]' : 'border-white/20 bg-white/5 hover:border-sky-300'}`}>
                    <AvatarPortrait id={item.id} size={90} className="h-[68px] w-[68px] max-w-full transition-transform group-hover:scale-105" /><span className="text-[11px] font-bold">{item.name}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label htmlFor="kid-grade" className="block text-sm font-bold">Sınıf <span className="font-normal text-slate-400">(isteğe bağlı)</span>
                <select id="kid-grade" value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-2 w-full rounded-xl border border-white/25 bg-slate-900 p-3 text-white">
                  <option value="">Şimdilik seçme</option>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}. sınıf</option>)}
                </select>
              </label>
              <label htmlFor="kid-english" className="block text-sm font-bold">İngilizce başlangıç seviyesi
                <select id="kid-english" value={englishLevel} onChange={(e) => setEnglishLevel(e.target.value as 'Pre-A1' | 'A1' | 'A2')} className="mt-2 w-full rounded-xl border border-white/25 bg-slate-900 p-3 text-white">
                  <option value="Pre-A1">Yeni başlıyorum (Pre-A1)</option>
                  <option value="A1">Biraz biliyorum (A1)</option>
                  <option value="A2">Temel biliyorum (A2)</option>
                </select>
              </label>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-300"><BookOpen size={16} className="mt-0.5 shrink-0" /> Bu seçim seviye sınavı değildir; oyunlar sana göre gelişirken değiştirilebilir.</p>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-100/85"><CloudOff size={16} className="mt-0.5 shrink-0" /> Bireysel ilerleme bu cihazda saklanır. Tarayıcı verilerini temizlersen kaybolabilir; aile hesabına bağlama sonraki aşamada geliştirilecek.</p>
            {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/50 bg-rose-950/70 px-4 py-3 text-sm text-rose-100">{error}</p>}
            <button type="submit" disabled={isSaving} className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-6 text-base font-black text-emerald-950 shadow-lg shadow-emerald-800/40 transition hover:brightness-110 disabled:opacity-60">
              {isSaving ? 'Kaşifin kaydediliyor…' : 'Macera Evrenine Gir'} <ArrowRight size={20} />
            </button>
          </form>
        )}

        {(screen === 'family' || screen === 'school') && (
          <section className="mx-auto max-w-xl rounded-[2rem] border border-white/20 bg-slate-950/65 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-200">
              {screen === 'family' ? <ShieldCheck size={34} /> : <GraduationCap size={34} />}
            </div>
            <h2 className="mt-5 text-xl font-extrabold">{screen === 'family' ? 'Ebeveyn alanı mevcut' : 'Okul ve sınıf yönetimi'}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {screen === 'family'
                ? 'Yetişkin hesabı ve mevcut bulut eşitleme araçları açılabilir. Yeni cihazda aynı profilden kesintisiz devam etme ve profil bağlama işlemleri henüz doğrulanmadı; P2 kapsamında tamamlanacak.'
                : 'Öğretmenler sınıf oluşturabilir; ebeveynler davet koduyla mevcut çocuk profillerini okula bağlayabilir. Bulut hesabı gerekir.'}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {screen === 'family' && (
                <button onClick={onOpenParent} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 font-extrabold text-slate-950">
                  <ShieldCheck size={18} /> Ebeveyn Alanını Aç
                </button>
              )}
              {screen === 'school' && (
                <Link href="/school" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-300 px-5 font-extrabold text-slate-950">
                  <GraduationCap size={18} /> Öğretmen / Ebeveyn Okul Paneli <ArrowRight size={18} />
                </Link>
              )}
              <button onClick={() => { if (existingProfile && onContinue) onContinue(); else { setScreen('individual'); setError(null); } }} className="min-h-12 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-bold hover:bg-white/20">
                {existingProfile ? 'Bireysel Oynamaya Dön' : 'Bireysel Profil Oluştur'}
              </button>
              <button onClick={() => setScreen('choose')} className="min-h-10 text-sm font-semibold text-sky-200">← Geri Dön</button>
            </div>
          </section>
        )}
        <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-relaxed text-sky-100/65">
          ✨ Her ada yeni bir macera! Dinle, oyna, keşfet ve öğrendiğin her kelimeyle yolculuğunu büyüt.
        </p>
      </div>
    </div>
  );
}
