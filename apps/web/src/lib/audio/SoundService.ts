/**
 * VENTRA — Ses Yönetim Servisi (SoundService)
 * 
 * Özellikler:
 * - Çevrimdışı yerel WAV sesleri
 * - Havuzlanmış ses önbelleği (DOM Audio yeniden kullanım, sıfır GC baskısı)
 * - Mobil tarayıcı / Capacitor AudioContext kilit açma (user gesture)
 * - SFX ve Konuşma kanalları
 * - Global sessize alma (mute) durumu senkronizasyonu ve kalıcılığı (localStorage)
 * - Tüm aktif sesleri tek hamlede durdurma (Mute anında anında sessizlik)
 */

import { EventBus } from '@/lib/game/EventBus';

// 1-örnekli geçerli sessiz WAV data URI (Tarayıcı NotSupportedError hatasını engeller)
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
const STORAGE_KEY_MUTED = 'ventra_sound_muted';

class SoundService {
  private audioPool: Map<string, HTMLAudioElement[]> = new Map();
  private isUnlocked: boolean = false;
  private isMuted: boolean = false;
  private gestureListenerAttached: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMuted = localStorage.getItem(STORAGE_KEY_MUTED);
        this.isMuted = savedMuted === 'true';
      } catch {
        this.isMuted = false;
      }
      this.attachGlobalGestureUnlock();
    }
  }

  /**
   * İlk kullanıcı etkileşiminde (dokunma/tıklama/tuş) AudioContext ve HTMLAudio kilidini açar.
   */
  private attachGlobalGestureUnlock(): void {
    if (this.gestureListenerAttached || typeof window === 'undefined') return;
    this.gestureListenerAttached = true;

    const unlockHandler = () => {
      this.unlockAudio();
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true, once: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true, once: true });
    window.addEventListener('keydown', unlockHandler, { passive: true, once: true });
  }

  unlockAudio(): void {
    if (this.isUnlocked || typeof window === 'undefined') return;

    try {
      // 1. DOM Audio nesnesini sessiz WAV ile kilit aç
      const silent = new Audio(SILENT_WAV);
      silent.play().then(() => {
        this.isUnlocked = true;
      }).catch(() => {
        // İlk kullanıcı hareketinde tekrar tetiklenecektir
      });

      // 2. Web Audio AudioContext varsa kilidini aç
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = (window as any).__ventra_audio_ctx || new AudioCtx();
        (window as any).__ventra_audio_ctx = ctx;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    } catch {
      // Sessizce geç
    }
  }

  private getAudioInstance(url: string): HTMLAudioElement {
    if (!this.audioPool.has(url)) {
      this.audioPool.set(url, []);
    }
    const pool = this.audioPool.get(url)!;

    // Havuzda boşta (paused veya ended) bir ses varsa onu yeniden kullan
    const available = pool.find(a => a.paused || a.ended);
    if (available) {
      available.currentTime = 0;
      return available;
    }

    // Maksimum 4 kopya havuzla, aşarsa en eski olanı başa sar
    if (pool.length >= 4) {
      const oldest = pool[0];
      oldest.currentTime = 0;
      return oldest;
    }

    const audio = new Audio(url);
    pool.push(audio);
    return audio;
  }

  play(url: string, volume: number = 1.0): HTMLAudioElement | null {
    if (typeof window === 'undefined' || this.isMuted) return null;

    try {
      this.unlockAudio();
      const audio = this.getAudioInstance(url);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch((err) => {
        // Otomatik oynatma engellendiyse kullanıcı hareketini bekle
        if (err.name !== 'NotAllowedError') {
          console.warn(`[SoundService] Ses oynatılamadı (${url}):`, err.message);
        }
      });
      return audio;
    } catch (e) {
      console.warn(`[SoundService] Ses başlatma hatası:`, e);
      return null;
    }
  }

  playSfx(name: 'tap' | 'correct' | 'fanfare' | 'whoosh' | 'gentle_retry', volume: number = 0.8): void {
    this.play(`/audio/sfx/${name}.wav`, volume);
  }

  playSpeech(path: string, volume: number = 1.0): void {
    this.play(path, volume);
  }

  toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  setMuted(muted: boolean): boolean {
    this.isMuted = muted;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_MUTED, String(this.isMuted));
      } catch {}
    }

    // Sessize alındığında tüm aktif sesleri durdur
    if (this.isMuted) {
      this.stopAllAudio();
    }

    // Tüm UI bileşenlerine bildir
    EventBus.emit('MUTE_STATE_CHANGED', this.isMuted);
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Havuzdaki tüm aktif sesleri anında durdurur ve başa sarar.
   */
  stopAllAudio(): void {
    this.audioPool.forEach((instances) => {
      instances.forEach((audio) => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
      });
    });
  }
}

export const soundService = new SoundService();
