'use client';

import React, { useState, useEffect } from 'react';
import { 
  VENTRA_AVATARS, 
  getAvatarById, 
  type PlayerProfile, 
  type PlayerAvatar 
} from '@ventra/shared';
import { getProgressRepository } from '../../lib/progress';

interface ProfileSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSwitched: (profile: PlayerProfile) => void;
  onOpenParentGate?: () => void;
}

export const ProfileSelectorModal: React.FC<ProfileSelectorModalProps> = ({
  isOpen,
  onClose,
  onProfileSwitched,
  onOpenParentGate
}) => {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('avatar_explorer');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadProfiles = async () => {
    try {
      const repo = getProgressRepository();
      const all = await repo.getAllProfiles();
      const active = await repo.getActiveProfile();
      setProfiles(all);
      setActiveProfile(active);
    } catch (e) {
      console.error('Profiller yüklenemedi:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
      setIsCreating(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const updatePlacement = async (updates: Partial<Pick<PlayerProfile, 'gradeLevel' | 'englishLevel'>>) => {
    if (!activeProfile || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const updated = await getProgressRepository().updateProfile(activeProfile.id, updates);
      setActiveProfile(updated);
      setProfiles((profiles) => profiles.map((p) => p.id === updated.id ? updated : p));
      onProfileSwitched(updated);
    } catch (error) {
      console.error(error);
      setErrorMessage('Öğrenme seviyesi güncellenemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleSelectProfile = async (p: PlayerProfile) => {
    if (p.id === activeProfile?.id) {
      onClose();
      return;
    }
    try {
      const repo = getProgressRepository();
      const updated = await repo.switchActiveProfile(p.id);
      setActiveProfile(updated);
      onProfileSwitched(updated);
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Profile geçiş yapılamadı.');
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      setErrorMessage('Takma ad en az 2 karakter olmalıdır.');
      return;
    }
    if (trimmed.length > 15) {
      setErrorMessage('Takma ad en fazla 15 karakter olabilir.');
      return;
    }

    setIsSubmitting(true);
    try {
      const repo = getProgressRepository();
      const created = await repo.createProfile({
        nickname: trimmed,
        avatarId: selectedAvatarId
      });
      await repo.switchActiveProfile(created.id);
      setNickname('');
      setIsCreating(false);
      await loadProfiles();
      onProfileSwitched(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Profil oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfile = async (p: PlayerProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      alert('En az 1 oyuncu profili bulunmalıdır.');
      return;
    }
    const confirmed = window.confirm(`"${p.nickname}" profilini ve bu profile ait oyun/öğrenme verilerini silmek istediğinden emin misin?`);
    if (!confirmed) return;

    try {
      const repo = getProgressRepository();
      await repo.deleteProfile(p.id);
      const remaining = await repo.getAllProfiles();
      const newActive = await repo.getActiveProfile();
      setProfiles(remaining);
      setActiveProfile(newActive);
      if (newActive) onProfileSwitched(newActive);
    } catch (err: any) {
      setErrorMessage(err.message || 'Profil silinemedi.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 9, 20, 0.88)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#091122',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Üst Başlık & Kapat Butonu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              {isCreating ? 'Yeni Oyuncu Profili' : 'Oyuncu Seçimi'}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              {isCreating
                ? 'Kendine havalı bir avatar ve takma ad seç!'
                : 'Maceraya kiminle devam etmek istiyorsun?'}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px'
          }}>
            {errorMessage}
          </div>
        )}

        {/* 1. PROFİL LİSTESİ */}
        {!isCreating && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profiles.map((p) => {
                const avatar = getAvatarById(p.avatarId);
                const isActive = p.id === activeProfile?.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    style={{
                      background: isActive ? 'rgba(56, 189, 248, 0.12)' : '#050914',
                      border: isActive ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.15)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: avatar.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        boxShadow: `0 0 10px ${avatar.accentColor}40`
                      }}>
                        {avatar.emoji}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                            {p.nickname}
                          </span>
                          {isActive && (
                            <span style={{
                              background: '#38bdf8',
                              color: '#050914',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Aktif
                            </span>
                          )}
                          {p.isCloudSynced && (
                            <span title="Buluta Yedekli" style={{ fontSize: '12px' }}>
                              ☁️
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {avatar.name} • {p.lastPlayedAt ? `Son etkinlik: ${new Date(p.lastPlayedAt).toLocaleDateString('tr-TR')}` : 'Yeni profil'}
                        </div>
                      </div>
                    </div>

                    {profiles.length > 1 && (
                      <button
                        title="Profili Sil"
                        onClick={(e) => handleDeleteProfile(p, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: '6px'
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {activeProfile && (
              <div className="rounded-2xl border border-sky-400/25 bg-sky-950/40 p-4">
                <h3 className="text-sm font-extrabold text-white">Öğrenme Ayarları · {activeProfile.nickname}</h3>
                <p className="mt-1 text-xs text-slate-300">Sınıf ve İngilizce seviyesi farklı şeylerdir. Bu seviye bir sınav sonucu değil, başlangıç tercihidir.</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-sky-200">
                    Sınıf
                    <select value={activeProfile.gradeLevel ?? ''} disabled={isSubmitting}
                      onChange={(e) => void updatePlacement({ gradeLevel: e.target.value ? Number(e.target.value) : null })}
                      className="mt-2 w-full rounded-xl border border-slate-500 bg-slate-900 p-3 text-sm text-white">
                      <option value="">Belirtilmedi</option>
                      {[1,2,3,4,5,6,7,8].map((grade) => <option key={grade} value={grade}>{grade}. sınıf</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-sky-200">
                    İngilizce seviyesi
                    <select value={activeProfile.englishLevel ?? 'Pre-A1'} disabled={isSubmitting}
                      onChange={(e) => void updatePlacement({ englishLevel: e.target.value as 'Pre-A1' | 'A1' | 'A2' })}
                      className="mt-2 w-full rounded-xl border border-slate-500 bg-slate-900 p-3 text-sm text-white">
                      <option value="Pre-A1">Pre-A1 · Yeni başlayan</option>
                      <option value="A1">A1 · Başlangıç</option>
                      <option value="A2">A2 · Temel</option>
                    </select>
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Sınıf mevcut oyunda içerik filtresi değildir. A1 ve A2 tercihleri ilerideki içerik çeşitliliğini hazırlamak içindir.</p>
              </div>
            )}

            {/* Yeni Profil Butonu */}
            <button
              onClick={() => setIsCreating(true)}
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px dashed rgba(56, 189, 248, 0.4)',
                borderRadius: '14px',
                color: '#38bdf8',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>➕</span>
              <span>Yeni Profil Ekle</span>
            </button>

            {/* Ebeveyn / Bulut Hesabı Girişi */}
            {onOpenParentGate && (
              <div style={{ borderTop: '1px solid rgba(56, 189, 248, 0.15)', paddingTop: '14px', textAlign: 'center' }}>
                <button
                  onClick={onOpenParentGate}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🔒</span>
                  <span>Ebeveyn Alanı & Bulut Yedekleme</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* 2. YENİ PROFİL OLUŞTURMA FORMU */}
        {isCreating && (
          <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Avatar Seçim Alanı */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
                Avatarını Seç
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
              }}>
                {VENTRA_AVATARS.map((av) => {
                  const isSelected = av.id === selectedAvatarId;
                  return (
                    <div
                      key={av.id}
                      onClick={() => setSelectedAvatarId(av.id)}
                      style={{
                        background: isSelected ? 'rgba(56, 189, 248, 0.15)' : '#050914',
                        border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.15)',
                        borderRadius: '12px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: av.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px'
                      }}>
                        {av.emoji}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#38bdf8' : '#cbd5e1' }}>
                        {av.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Takma Ad Input */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Takma Adın (Kullanıcı Adı)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Örn: Yıldız Avcısı, Cesur Kaşif"
                maxLength={15}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#050914',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Gerçek adını veya kişisel bilgilerini yazmana gerek yoktur.
              </span>
            </div>

            {/* Aksiyon Butonları */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Geri Dön
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
                }}
              >
                {isSubmitting ? 'Oluşturuluyor...' : 'Profili Kaydet ve Başla'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

