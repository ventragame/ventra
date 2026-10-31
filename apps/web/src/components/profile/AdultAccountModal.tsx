'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase/client';
import { sendAdultOtpEmail, verifyAdultOtp, getAdultAccount, signOutAdult, deleteAdultAccount } from '../../lib/supabase/auth';
import { CloudSyncService } from '../../lib/supabase/sync';
import { getProgressRepository } from '../../lib/progress';
import type { AdultAccountInfo, PlayerProfile, SyncResult } from '@ventra/shared';

interface AdultAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
}

export const AdultAccountModal: React.FC<AdultAccountModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted
}) => {
  const [account, setAccount] = useState<AdultAccountInfo | null>(null);
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [email, setEmail] = useState<string>('');
  const [otpToken, setOtpToken] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const configured = isSupabaseConfigured();

  const loadData = async () => {
    try {
      const acc = await getAdultAccount();
      setAccount(acc);
      const repo = getProgressRepository();
      const profs = await repo.getAllProfiles();
      setProfiles(profs);
    } catch (e) {
      console.error('Yetişkin hesabı yükleme hatası:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setMessage(null);
      setSyncStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    const res = await sendAdultOtpEmail(email);
    setIsLoading(false);

    if (res.success) {
      setIsOtpSent(true);
      setMessage({ type: 'success', text: `Doğrulama kodu ${email} adresine gönderildi. Lütfen gelen 6 haneli kodu giriniz.` });
    } else {
      setMessage({ type: 'error', text: res.error || 'Kod gönderilemedi.' });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    const res = await verifyAdultOtp(email, otpToken);
    setIsLoading(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Giriş başarılı! Hesabınız bağlandı.' });
      setIsOtpSent(false);
      setOtpToken('');
      await loadData();
    } else {
      setMessage({ type: 'error', text: res.error || 'Doğrulama kodu geçersiz.' });
    }
  };

  const handleSyncNow = async () => {
    if (!account || isLoading) return;
    setIsLoading(true);
    setSyncStatus('Bağlı profiller eşitleniyor...');
    setMessage(null);
    try {
      const linked = profiles.filter(p => p.userId === account.userId);
      if (linked.length === 0) {
        setMessage({ type: 'error', text: 'Önce bir profil bağlayın veya buluttan geri getirin.' });
        return;
      }
      let uploaded = 0;
      let downloaded = 0;
      const failures: string[] = [];
      for (const profile of linked) {
        const result = await CloudSyncService.getInstance().syncProfile(profile.id);
        if (!result.success) failures.push(`${profile.nickname}: ${result.errorMessage || 'Eşitleme başarısız'}`);
        else { uploaded += result.uploadedEventsCount; downloaded += result.downloadedEventsCount; }
      }
      await loadData();
      if (failures.length > 0) setMessage({ type: 'error', text: `Eşitlenemeyen profiller: ${failures.join(' | ')}. Başarılı aktarım: ${uploaded} gönderildi, ${downloaded} indirildi.` });
      else {
        setMessage({ type: 'success', text: `Eşitleme tamamlandı. ${uploaded} kayıt gönderildi, ${downloaded} kayıt indirildi.` });
        onSyncCompleted?.();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Eşitleme başarısız oldu.' });
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  const handleLinkProfile = async (profile: PlayerProfile) => {
    if (!account || profile.userId || isLoading) return;
    if (!window.confirm(`"${profile.nickname}" profilini ${account.email} aile hesabına bağlamak istediğine emin misin? Bu sürümde bağlantıyı kaldırmak henüz desteklenmiyor.`)) return;
    setIsLoading(true);
    setSyncStatus('Profil bağlanıyor...');
    setMessage(null);
    try {
      const result = await CloudSyncService.getInstance().syncProfile(profile.id, { allowLink: true });
      if (!result.success) throw new Error(result.errorMessage || 'Bağlantı başarısız.');
      await loadData();
      setMessage({ type: 'success', text: `${profile.nickname} profili bağlandı. ${result.uploadedEventsCount} kayıt gönderildi, ${result.downloadedEventsCount} kayıt indirildi.` });
      onSyncCompleted?.();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Profil bağlanamadı. Yerel ilerleme korunuyor.' });
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!account || isLoading) return;
    setIsLoading(true);
    setSyncStatus('Bulut profilleri getiriliyor...');
    setMessage(null);
    try {
      const restored = await CloudSyncService.getInstance().pullAllCloudProfiles();
      await loadData();
      if (restored.length > 0) {
        onSyncCompleted?.();
        setMessage({ type: 'success', text: `${restored.length} profil kontrol edildi. İlerlemeler birleştirildi; oyuncu seçicisinden istediğiniz profile geçebilirsiniz.` });
      } else {
        setMessage({ type: 'success', text: 'Bu aile hesabında geri getirilecek profil yok. Önce bireysel profil oluşturup aile hesabına bağlayın.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Bulut profilleri getirilemedi. Yerel kayıtlar korunuyor.' });
    } finally {
      setIsLoading(false);
      setSyncStatus(null);
    }
  };

  const handleDeleteLinkedChild = async (profile: PlayerProfile) => {
    if (!account || isLoading || profile.userId !== account.userId) return;
    if (!window.confirm('Bu çocuk profili ve öğrenme kayıtları kalıcı olarak silinsin mi?')) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Bulut bağlantısı yok.');
      const { data, error } = await client.from('player_profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', profile.id).eq('user_id', account.userId)
        .is('deleted_at', null).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Bulut kaydı doğrulanamadı.');
      await getProgressRepository().deleteProfile(profile.id);
      await loadData();
      onSyncCompleted?.();
      setMessage({type:'success',text:'Çocuk profili buluttan ve cihazdan silindi.'});
    } catch (err) {
      setMessage({type:'error',text:err instanceof Error ? err.message : 'Silme başarısız.'});
    } finally { setIsLoading(false); }
  };

  const handleSignOut = async () => {
    await signOutAdult();
    setAccount(null);
    setMessage({ type: 'success', text: 'Oturum kapatıldı. Yerel profiller cihazınızda güvende kalmaya devam eder.' });
    await loadData();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Bulut hesabınızı ve sunucudaki tüm yedekleri silmek istediğinize emin misiniz? (Yerel cihazınızdaki profiller silinmez).');
    if (!confirmed) return;

    setIsLoading(true);
    const res = await deleteAdultAccount();
    setIsLoading(false);

    if (res.success) {
      setAccount(null);
      setMessage({ type: 'success', text: 'Bulut hesabı ve sunucudaki veriler başarıyla silindi.' });
      await loadData();
    } else {
      setMessage({ type: 'error', text: res.error || 'Hesap silinemedi.' });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 9, 20, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 65,
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '540px',
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
              Ebeveyn Alanı & Bulut Yedekleme
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Her çocuk profilini açık onayla bağlayın; başka cihazdan geri getirin ve eşitleyin.
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

        {/* Bilgilendirme ve Uyarı Kutuları */}
        {message && (
          <div style={{
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: message.type === 'success' ? '#34d399' : '#f87171',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            lineHeight: 1.5
          }}>
            {message.text}
          </div>
        )}

        {/* Supabase Yapılandırma Durumu Bilgisi */}
        {!configured && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            padding: '14px',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#fbbf24',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 800, marginBottom: '4px' }}>ℹ️ Çevrimdışı / Yerel Profil Modu Aktif</div>
            Uygulama %100 çevrimdışı ve yerel olarak çalışmaktadır. Bulut yedeklemesini bağlamak için <code>NEXT_PUBLIC_SUPABASE_URL</code> ve <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ortam değişkenlerinin ayarlanması gerekir. Yerel profilleriniz cihazınızda kalıcıdır ve internet bağlantısı gerektirmez.
          </div>
        )}

        {/* 1. GİRİŞ YAPILMIŞ DURUM */}
        {account ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: '#040711',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Bağlı Yetişkin Hesabı
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>
                {account.email}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Bu cihazda {profiles.length} profil var; {profiles.filter(p => p.userId === account.userId).length} tanesi aile hesabına bağlı.
              </div>
            </div>

            <section aria-label="Çocuk profillerini aileye bağlama" style={{ display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid #334155', padding: '12px', borderRadius: '12px' }}>
              <strong style={{ fontSize: '13px', color: '#f8fafc' }}>Çocuk Profilleri</strong>
              {profiles.length === 0 && <p style={{ fontSize: '12px', color: '#cbd5e1' }}>Bu cihazda profil yok. Buluttan getirin veya bir profil oluşturun.</p>}
              {profiles.map(profile => {
                const linked = profile.userId === account.userId;
                const foreign = Boolean(profile.userId && !linked);
                return (
                  <div key={profile.id} style={{ padding: '10px', background: '#0f172a', borderRadius: '10px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '13px' }}>{profile.nickname}</div>
                      <div style={{ color: linked ? '#86efac' : foreign ? '#fca5a5' : '#cbd5e1', fontSize: '11px' }}>
                        {linked ? 'Bu aileye bağlı' : foreign ? 'Başka yetişkin hesabına bağlı' : 'Yalnızca bu cihazda'}
                      </div>
                    </div>
                    {!linked && !foreign && <button disabled={isLoading} onClick={() => void handleLinkProfile(profile)}
                      style={{ borderRadius: '10px', padding: '10px', border: '1px solid #4ade80', background: '#14532d', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Aileye Bağla</button>}
                    {linked && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#86efac', fontSize: '12px', fontWeight: 700 }}>✓ Bağlı</span>
                      <button disabled={isLoading} onClick={() => void handleDeleteLinkedChild(profile)}
                        aria-label={`${profile.nickname} çocuk profilini sil`}
                        style={{ border: '1px solid #f87171', borderRadius: '8px', padding: '9px', background: '#450a0a', color: '#fecaca', fontWeight: 700, fontSize: '11px' }}>
                        Profili Sil
                      </button>
                    </div>}
                  </div>
                );
              })}
              <p style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: 1.6, margin: 0 }}>Bağlamak yıldızları sıfırlamaz. Bir çocuğu başka aile hesabına aktarma henüz desteklenmez.</p>
            </section>
            <button onClick={() => void handleRestoreFromCloud()} disabled={isLoading}
              style={{ padding: '14px', borderRadius: '12px', border: '1px solid #60a5fa', background: '#1e40af', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}>
              ⬇️ Başka Cihazdaki Profilleri Buluttan Getir
            </button>

            {/* Eşitleme Butonu */}
            <button
              onClick={handleSyncNow}
              disabled={isLoading}
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>☁️</span>
              <span>{isLoading ? (syncStatus || 'İşleniyor...') : 'Bağlı Profilleri Eşitle'}</span>
            </button>

            {/* Oturum ve Hesap İşlemleri */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Oturumu Kapat
              </button>

              <button
                onClick={handleDeleteAccount}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Bulut Hesabını Sil
              </button>
            </div>
          </div>
        ) : configured ? (
          /* 2. GİRİŞ YAPILMAMIŞ DURUM (OTP Formu) */
          <div>
            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Yetişkin E-posta Adresi
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="veli@ornek.com"
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
                    Şifresiz, tek kullanımlık e-posta doğrulama kodu (OTP) gönderilecektir.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {isLoading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    6 Haneli Doğrulama Kodu
                  </label>
                  <input
                    type="text"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    placeholder="123456"
                    maxLength={10}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: '#050914',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#ffffff',
                      fontSize: '18px',
                      letterSpacing: '4px',
                      textAlign: 'center',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      background: 'transparent',
                      color: '#94a3b8',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Farklı E-posta
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}

        {/* Gizlilik & KVKK İlkesi */}
        <div style={{
          borderTop: '1px solid rgba(56, 189, 248, 0.12)',
          paddingTop: '14px',
          fontSize: '11px',
          color: '#64748b',
          lineHeight: 1.5
        }}>
          🛡️ <strong>Çocuk Gizliliği İlkesi:</strong> Ventra, çocuk profillerinde hiçbir kişisel veri toplamaz. İsteğe bağlı bulut hesabı yalnızca ilerlemenin aile tarafından yedeklenmesini ve birden çok cihazda korunmasını sağlar.
        </div>
      </div>
    </div>
  );
};

