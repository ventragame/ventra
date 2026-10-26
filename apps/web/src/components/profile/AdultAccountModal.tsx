'use client';

import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase/client';
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
    setMessage(null);
    setSyncStatus('Senkronizasyon yapılıyor...');
    setIsLoading(true);

    try {
      const syncService = CloudSyncService.getInstance();
      let totalUploaded = 0;
      let totalDownloaded = 0;

      for (const p of profiles) {
        const res = await syncService.syncProfile(p.id);
        if (res.success) {
          totalUploaded += res.uploadedEventsCount;
          totalDownloaded += res.downloadedEventsCount;
        }
      }

      setSyncStatus(null);
      setMessage({
        type: 'success',
        text: `Bulut eşitlemesi tamamlandı! (${totalUploaded} yeni etkinlik yedeklendi, ${totalDownloaded} etkinlik indirildi).`
      });
      await loadData();
      if (onSyncCompleted) onSyncCompleted();
    } catch (err: any) {
      setSyncStatus(null);
      setMessage({ type: 'error', text: err.message || 'Senkronizasyon başarısız oldu.' });
    } finally {
      setIsLoading(false);
    }
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
              İlerleme verilerini cihazlar arasında güvenle yedekleyin ve eşitleyin.
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
                Bu cihaza bağlı {profiles.length} çocuk profili bulunmaktadır.
              </div>
            </div>

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
              <span>{isLoading ? (syncStatus || 'İşleniyor...') : 'Şimdi Buluta Yedekle ve Eşitle'}</span>
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

