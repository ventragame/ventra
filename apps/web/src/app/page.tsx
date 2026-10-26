'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ALLOWED_BRIDGE_EVENT_TYPES, 
  isValidVentraMessage, 
  isIgnoredSystemMessage,
  GameCompletedPayload, 
  MVP_LEARNING_OUTCOMES,
  type PlayerProfile,
  getAvatarById
} from '@ventra/shared';
import { getProgressRepository } from '../lib/progress';
import { ProfileSelectorModal } from '../components/profile/ProfileSelectorModal';
import { ParentalGateModal } from '../components/profile/ParentalGateModal';
import { AdultAccountModal } from '../components/profile/AdultAccountModal';

interface BridgeLogItem {
  id: string;
  timestamp: string;
  direction: 'IN' | 'OUT';
  type: string;
  payloadSummary: string;
}

export default function VentraGameShell() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Oyun ve Köprü Durumu
  const [isGameReady, setIsGameReady] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<GameCompletedPayload | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isNativeMobile, setIsNativeMobile] = useState<boolean>(false);

  // Phase 3.4: Oyuncu Profili ve Ebeveyn Modalleri
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isParentGateOpen, setIsParentGateOpen] = useState<boolean>(false);
  const [isAdultAccountModalOpen, setIsAdultAccountModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function initProfile() {
      try {
        const repo = getProgressRepository();
        let prof = await repo.getActiveProfile();
        if (!prof) {
          prof = await repo.createProfile({ nickname: 'Kaşif', avatarId: 'avatar_explorer' });
        }
        setActiveProfile(prof);
      } catch (err) {
        console.warn('Aktif profil yükleme hatası:', err);
      }
    }
    initProfile();
  }, []);

  const handleProfileSwitched = async (newProf: PlayerProfile) => {
    setActiveProfile(newProf);
    try {
      const repo = getProgressRepository();
      const stars = await repo.getTotalStars(newProf.id);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'VENTRA_SYNC_STATE',
          payload: {
            starsBalance: stars,
            unlockedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
          }
        }, '*');
      }
    } catch (e) {
      console.warn('Profil değişimi sonrası yıldız senkronizasyonunda hata:', e);
    }
  };
  
  // Geliştirici Araçları (Yalnızca Geliştirme Ortamında)
  const [isDevToolsOpen, setIsDevToolsOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<BridgeLogItem[]>([]);
  const isDevMode = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
      if (cap?.isNativePlatform?.()) {
        setIsNativeMobile(true);
      }
    }
  }, []);

  const addLog = (direction: 'IN' | 'OUT', type: string, payload: unknown) => {
    if (!isDevMode) return;
    const item: BridgeLogItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('tr-TR'),
      direction,
      type,
      payloadSummary: JSON.stringify(payload)
    };
    setLogs((prev) => [item, ...prev.slice(0, 24)]);
  };

  // İki Yönlü Köprü Dinleyicisi
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 1. IDE veya eklenti gürültülerini (get-iframe-pos, iframe-click) sessizce yoksay
      if (isIgnoredSystemMessage(event.data)) {
        return;
      }

      // 2. Kaynak Doğrulaması (Sadece oyun iframe'inden gelen mesajları kabul et)
      const isFromTargetIframe = iframeRef.current && event.source === iframeRef.current.contentWindow;
      if (!isFromTargetIframe) {
        return;
      }

      // 3. Katı Şema ve Tip Doğrulaması
      const data = event.data;
      if (!isValidVentraMessage(data)) {
        return;
      }

      // Doğrulanmış köprü olayını işle
      addLog('IN', data.type, data.payload);

      switch (data.type) {
        case 'VENTRA_GAME_READY': {
          setIsGameReady(true);
          try {
            const repo = getProgressRepository();
            repo.getActiveProfile().then(async (prof) => {
              const profileId = prof?.id;
              const stars = await repo.getTotalStars(profileId);
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                  type: 'VENTRA_SYNC_STATE',
                  payload: {
                    starsBalance: stars,
                    unlockedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                  }
                }, '*');
              }
            });
          } catch (e) {
            console.warn('Godot senkronizasyonunda hata:', e);
          }
          break;
        }
        case 'VENTRA_GAME_COMPLETED': {
          setGameResult(data.payload);
          try {
            const repo = getProgressRepository();
            repo.getActiveProfile().then(async (prof) => {
              const targetProfileId = data.payload.profileId || prof?.id;
              const recordRes = await repo.recordGameCompleted(data.payload, targetProfileId);
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                  type: 'VENTRA_SYNC_STATE',
                  payload: {
                    starsBalance: recordRes.totalStarsBalance,
                    unlockedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                  }
                }, '*');
              }
            });
          } catch (e) {
            console.error('Oyun sonucu kaydedilirken hata:', e);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isDevMode]);

  // Tam Ekran Yönetimi
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      console.warn('Tam ekran geçişi desteklenmiyor veya engellendi:', e);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Web -> Godot Komut Gönderici (Geliştirici testi için)
  const sendToGame = (type: typeof ALLOWED_BRIDGE_EVENT_TYPES[number], payload: any) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({ type, payload }, '*');
    addLog('OUT', type, payload);
  };

  const outcomeInfo = gameResult ? MVP_LEARNING_OUTCOMES[gameResult.outcomeId] : null;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: '#050914',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 1. Üst Sağ Kompakt Oyun Kontrolleri (Çift başlık kaldırıldı, tek HUD entegrasyonu) */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 25,
        pointerEvents: 'auto'
      }}>
        {activeProfile && (
          <button
            onClick={() => setIsProfileModalOpen(true)}
            title="Oyuncu Profilini Değiştir veya Yönet"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: '10px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
            }}
          >
            <span>{getAvatarById(activeProfile.avatarId).emoji}</span>
            <span>{activeProfile.nickname}</span>
            <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
          </button>
        )}

        <Link
          href="/learn"
          title="Ventra Öğrenme Merkezi"
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '10px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
            textDecoration: 'none'
          }}
        >
          <span>📖</span>
          <span>Öğrenme Merkezi</span>
        </Link>

        <Link
          href="/progress"
          title="Ventra Gelişim ve Ustalık Paneli"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(2, 132, 199, 0.25) 100%)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
            textDecoration: 'none'
          }}
        >
          <span>📊</span>
          <span>Gelişim</span>
        </Link>

        {isDevMode && (
          <button
            onClick={() => setIsDevToolsOpen(prev => !prev)}
            title="Geliştirici Tanı Paneli"
            style={{
              background: isDevToolsOpen ? '#2563eb' : 'rgba(11, 18, 32, 0.85)',
              color: isDevToolsOpen ? '#ffffff' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            🛠️ Dev
          </button>
        )}

        {!isNativeMobile && (
          <button
            data-testid="fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
            style={{
              background: 'rgba(11, 18, 32, 0.88)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '10px',
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
            }}
          >
            <span style={{ fontSize: '13px' }}>{isFullscreen ? '✕' : '⛶'}</span>
            <span>{isFullscreen ? 'Çık' : 'Tam Ekran'}</span>
          </button>
        )}
      </div>

      {/* 2. Gerçek Godot Oyun Viewport (Tam Kullanılabilir Alan) */}
      <main style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        flex: 1,
        backgroundColor: '#050914',
        overflow: 'hidden'
      }}>
        <iframe
          ref={iframeRef}
          src="/game/index.html"
          title="Ventra Macera Evreni — Godot 4 Web"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          sandbox="allow-scripts allow-same-origin"
          allow="fullscreen; autoplay; clipboard-write"
          allowFullScreen
        />
      </main>

      {/* 3. Oyun Tamamlandı Kutlama Modalı */}
      {gameResult && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(4, 7, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px'
        }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            background: '#091122',
            border: '2px solid rgba(56, 189, 248, 0.65)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(56, 189, 248, 0.25)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ fontSize: '44px' }}>
              {gameResult.success ? '🎉' : '💡'}
            </div>

            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 800,
                color: gameResult.success ? '#38bdf8' : '#f59e0b',
                marginBottom: '4px'
              }}>
                {gameResult.success ? 'Bölüm Tamamlandı!' : 'Güzel Deneme!'}
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                {outcomeInfo ? `4. Sınıf ${outcomeInfo.unit} • ${outcomeInfo.title}` : '4. Sınıf Kesirler Atölyesi'}
              </p>
            </div>

            {/* İstatistikler */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              background: '#050914',
              padding: '14px',
              borderRadius: '14px',
              border: '1px solid #1e293b'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Skor</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>{gameResult.score}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Yıldız</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>+{gameResult.starsEarned}⭐</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Doğruluk</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                  %{Math.round(gameResult.metrics.accuracyRate * 100)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                href="/progress"
                onClick={() => setGameResult(null)}
                style={{
                  padding: '12px 18px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>📊</span>
                <span>Gelişimimi ve Ustalığımı İncele</span>
              </Link>

              <Link
                href="/learn"
                onClick={() => setGameResult(null)}
                style={{
                  padding: '12px 18px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>📖</span>
                <span>Kesirler Konu Anlatımı ve Alıştırmalar</span>
              </Link>

              <button
                onClick={() => setGameResult(null)}
                style={{
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  minHeight: '48px'
                }}
              >
                Haritaya Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Geliştirici Çekmecesi (Yalnızca Dev Modunda ve Açıkken) */}
      {isDevMode && isDevToolsOpen && (
        <aside style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          width: '380px',
          maxHeight: '420px',
          background: 'rgba(8, 14, 25, 0.96)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #1e293b',
          borderRadius: '14px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 40,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
              🛠️ Köprü Tanı & Olay Kayıtları
            </span>
            <button 
              onClick={() => setIsDevToolsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '8px' }}>
            <span>Durum: {isGameReady ? '● Hazır' : '○ Bekleniyor'}</span>
          </div>

          <div style={{
            flex: 1,
            maxHeight: '220px',
            overflowY: 'auto',
            background: '#040711',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '10px',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#475569', textAlign: 'center', padding: '8px' }}>Olay bekleniyor...</div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: '4px', color: log.direction === 'IN' ? '#38bdf8' : '#34d399' }}>
                  <span style={{ color: '#64748b' }}>[{log.timestamp}]</span>
                  <span style={{ fontWeight: 700 }}>{log.direction}</span>
                  <span style={{ fontWeight: 600 }}>{log.type}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => sendToGame('VENTRA_GAME_START', { studentId: 'dev_user', studentName: 'Öğrenci', levelId: 1, language: 'tr' })}
              style={{ flex: 1, padding: '6px 8px', background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            >
              Simüle Et: START
            </button>
            <button
              onClick={() => sendToGame('VENTRA_SYNC_STATE', { starsBalance: 10, unlockedLevels: [1] })}
              style={{ flex: 1, padding: '6px 8px', background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
            >
              Simüle Et: SYNC
            </button>
          </div>
        </aside>
      )}
      {/* 5. Profil ve Ebeveyn Modalleri */}
      <ProfileSelectorModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileSwitched={handleProfileSwitched}
        onOpenParentGate={() => {
          setIsProfileModalOpen(false);
          setIsParentGateOpen(true);
        }}
      />

      <ParentalGateModal
        isOpen={isParentGateOpen}
        onClose={() => setIsParentGateOpen(false)}
        onSuccess={() => {
          setIsParentGateOpen(false);
          setIsAdultAccountModalOpen(true);
        }}
      />

      <AdultAccountModal
        isOpen={isAdultAccountModalOpen}
        onClose={() => setIsAdultAccountModalOpen(false)}
        onSyncCompleted={async () => {
          if (activeProfile) {
            handleProfileSwitched(activeProfile);
          }
        }}
      />
    </div>
  );
}