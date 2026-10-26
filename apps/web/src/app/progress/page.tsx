'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  VENTRA_FRACTION_SKILLS, 
  type UnifiedProgressSummary, 
  type SkillMasteryRecord, 
  type LevelProgressRecord, 
  type ActivityLogEntry,
  type PlayerProfile,
  getAvatarById
} from '@ventra/shared';
import { getProgressRepository } from '../../lib/progress';
import { ProfileSelectorModal } from '../../components/profile/ProfileSelectorModal';
import { ParentalGateModal } from '../../components/profile/ParentalGateModal';
import { AdultAccountModal } from '../../components/profile/AdultAccountModal';

export default function ProgressDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<UnifiedProgressSummary | null>(null);
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'learning' | 'game'>('all');

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isParentGateOpen, setIsParentGateOpen] = useState<boolean>(false);
  const [isAdultAccountModalOpen, setIsAdultAccountModalOpen] = useState<boolean>(false);

  const loadProgress = async (targetProf?: PlayerProfile | null) => {
    try {
      const repo = getProgressRepository();
      let prof = targetProf;
      if (!prof) {
        prof = await repo.getActiveProfile();
        if (!prof) {
          prof = await repo.createProfile({ nickname: 'Kaşif', avatarId: 'avatar_explorer' });
        }
      }
      setActiveProfile(prof);

      const data = await repo.getProgressSummary(prof?.id);
      setSummary(data);
      setIsLoading(false);
    } catch (err) {
      console.error('İlerleme verileri yüklenirken hata:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleProfileSwitched = (newProf: PlayerProfile) => {
    setActiveProfile(newProf);
    setIsLoading(true);
    loadProgress(newProf);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100dvh',
        backgroundColor: '#050914',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#38bdf8',
        fontSize: '16px',
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '32px', animation: 'spin 1.5s linear infinite' }}>🧭</div>
          <div>Gelişim Verileri Yükleniyor...</div>
        </div>
      </div>
    );
  }

  const hasData = summary?.hasData ?? false;
  const skillList: SkillMasteryRecord[] = summary ? Object.values(summary.skillMasteries) : [];
  const levelList: LevelProgressRecord[] = summary ? Object.values(summary.levelProgress) : [];
  const recReview = summary?.recommendedReview;

  const filteredActivities = (summary?.recentActivities || []).filter(act => {
    if (selectedFilter === 'all') return true;
    return act.type === selectedFilter;
  });

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#050914',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 1. Üst Navigasyon Çubuğu */}
      <header style={{
        background: 'rgba(5, 9, 20, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Sol Logo & Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#ffffff',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)'
            }}>
              📊
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '1px', color: '#38bdf8' }}>
                VENTRA
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Gelişim ve Ustalık Paneli
              </div>
            </div>
          </Link>

          <div style={{ width: '1px', height: '24px', background: '#334155' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
            <span style={{ color: '#cbd5e1' }}>4. Sınıf</span>
            <span>›</span>
            <span style={{ color: '#cbd5e1' }}>Matematik</span>
            <span>›</span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>Kesirler</span>
            <span style={{
              fontSize: '10px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '2px 6px',
              borderRadius: '6px',
              marginLeft: '4px'
            }}>
              M.4.1.6.1
            </span>
          </div>
        </div>

        {/* Sağ Butonlar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeProfile && (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              title="Oyuncu Profilini Değiştir"
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
                gap: '6px'
              }}
            >
              <span>{getAvatarById(activeProfile.avatarId).emoji}</span>
              <span>{activeProfile.nickname}</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
            </button>
          )}

          <Link
            href="/learn"
            style={{
              background: 'rgba(11, 18, 32, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none'
            }}
          >
            <span>📖</span>
            <span>Öğrenme Merkezi</span>
          </Link>

          <Link
            href="/"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              color: '#f8fafc',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none'
            }}
          >
            <span>🧭</span>
            <span>Macera Evreni</span>
          </Link>
        </div>
      </header>

      {/* 2. Ana Gövde */}
      <main style={{
        flex: 1,
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        padding: '28px 20px 60px 20px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px'
      }}>
        {/* BOŞ DURUM (Honest Empty State) */}
        {!hasData && (
          <div style={{
            background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '24px',
            padding: '48px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '56px' }}>✨</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Henüz Gelişim Verisi Bulunmuyor
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, maxWidth: '520px', lineHeight: 1.6 }}>
              Öğrenme Merkezi'ndeki etkileşimli dersleri ve alıştırmaları tamamladığında veya Macera Evreni'ndeki <strong>Kesir Atölyesi</strong> bölümlerini oynadığında, akademik beceri ustalığın ve oyun kazanımların burada görüntülenecektir.
            </p>
            <div style={{
              display: 'flex',
              gap: '14px',
              marginTop: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <Link
                href="/learn?tab=lesson"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                }}
              >
                📖 Öğrenme Merkezi'ne Başla
              </Link>
              <Link
                href="/"
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  textDecoration: 'none'
                }}
              >
                🎮 Kesir Atölyesi'ne Git
              </Link>
            </div>
          </div>
        )}

        {/* DOLU DURUM (Populated State) */}
        {hasData && summary && (
          <>
            {/* A. TAVSİYE EDİLEN TEKRAR BANNERI */}
            {recReview && (
              <div style={{
                background: recReview.reason === 'struggling'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                border: recReview.reason === 'struggling'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '18px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '720px' }}>
                  <div style={{ fontSize: '32px' }}>
                    {recReview.reason === 'struggling' ? '💡' : '🎯'}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      color: recReview.reason === 'struggling' ? '#f59e0b' : '#38bdf8',
                      marginBottom: '4px'
                    }}>
                      Tavsiye Edilen Tekrar Konusu
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '2px' }}>
                      {recReview.skillTitle}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                      {recReview.explanation}
                    </div>
                  </div>
                </div>

                <Link
                  href={recReview.targetUrl}
                  style={{
                    background: recReview.reason === 'struggling'
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    color: '#ffffff',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {recReview.suggestedAction === 'learn_lesson' ? 'Konuyu İncele →' : 'Alıştırma Yap →'}
                </Link>
              </div>
            )}

            {/* B. GENEL METRİK KARTLARI (Öğrenme vs Oyun Ayrımı) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px'
            }}>
              {/* Kart 1: Oyun Ekonomisi (Yıldızlar) */}
              <div style={{
                background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                    Oyun Ekonomisi
                  </span>
                  <span style={{ fontSize: '20px' }}>⭐</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#fbbf24' }}>
                  {summary.totalStarsEarned} <span style={{ fontSize: '16px', color: '#64748b' }}>/ 30</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Kesir Atölyesi'nde kazanılan benzersiz en iyi yıldızlar.
                </div>
              </div>

              {/* Kart 2: Tamamlanan Bölümler */}
              <div style={{
                background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Tamamlanan Seviyeler
                  </span>
                  <span style={{ fontSize: '20px' }}>🏆</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#38bdf8' }}>
                  {summary.completedLevelsCount} <span style={{ fontSize: '16px', color: '#64748b' }}>/ 10</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Kazanılan ve geçilen atölye bölümleri.
                </div>
              </div>

              {/* Kart 3: Akademik Başarı (Öğrenme Merkezi Doğruluğu) */}
              <div style={{
                background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                    Akademik Doğruluk
                  </span>
                  <span style={{ fontSize: '20px' }}>🎯</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#10b981' }}>
                  %{Math.round(summary.overallLearningAccuracy * 100)}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Öğrenme Merkezi alıştırmalarındaki başarı oranı.
                </div>
              </div>

              {/* Kart 4: Toplam Tamamlanan Oturum */}
              <div style={{
                background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>
                    Toplam Etkinlik
                  </span>
                  <span style={{ fontSize: '20px' }}>⚡</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#c084fc' }}>
                  {summary.totalActivitiesCompleted}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {summary.totalLearningSessions} alıştırma + {summary.totalGameSessions} oyun tamamlandı.
                </div>
              </div>
            </div>

            {/* C. PEDAGOJİK BECERİ USTALIK MATRİSİ */}
            <div style={{
              background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  Kesirler Beceri Ustalık Matrisi
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Ventra iç pedagojik kazanımlarına göre akademik yeterlilik durumu. En az 2 kanıt (deneme) olmadan öğrenci usta kabul edilmez.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {skillList.map((skill) => {
                  const statusColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
                    'mastered': { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#10b981', label: 'Usta' },
                    'developing': { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', text: '#38bdf8', label: 'İyi / Gelişiyor' },
                    'struggling': { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#f59e0b', label: 'Geliştirilmeli' },
                    'insufficient_data': { bg: 'rgba(100, 116, 139, 0.15)', border: 'rgba(100, 116, 139, 0.3)', text: '#94a3b8', label: 'Yetersiz Kanıt' }
                  };
                  const badge = statusColors[skill.status] || statusColors['insufficient_data'];

                  return (
                    <div
                      key={skill.skillId}
                      style={{
                        background: '#040711',
                        border: '1px solid rgba(56, 189, 248, 0.12)',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                              {skill.skillTitle}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              color: '#38bdf8',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {skill.curriculumCode}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Öğrenme Merkezi: {skill.learningCorrect}/{skill.learningAttempts} Doğru • Kesir Atölyesi: {skill.gameAttempts} Bölüm Denemesi
                          </div>
                        </div>

                        {/* Durum Rozeti */}
                        <div style={{
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.text,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          {badge.label} {skill.status !== 'insufficient_data' && `(%${skill.combinedScore})`}
                        </div>
                      </div>

                      {/* İlerleme Çubuğu */}
                      <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${skill.status === 'insufficient_data' ? 5 : skill.combinedScore}%`,
                          height: '100%',
                          background: skill.status === 'mastered' ? '#10b981' : skill.status === 'developing' ? '#38bdf8' : skill.status === 'struggling' ? '#f59e0b' : '#475569',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D. KESİR ATÖLYESİ BÖLÜM HARİTASI (10 Bölüm) */}
            <div style={{
              background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  Kesir Atölyesi Bölüm Başarıları
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Her bölüm için kazanılan en yüksek yıldız derecesi (1–3 ⭐) ve tamamlanma durumu.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px'
              }}>
                {levelList.map((lvl) => {
                  const isCompleted = lvl.bestStars > 0;
                  return (
                    <div
                      key={lvl.levelId}
                      style={{
                        background: isCompleted ? 'rgba(15, 23, 42, 0.85)' : 'rgba(10, 15, 28, 0.5)',
                        border: isCompleted ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid rgba(51, 65, 85, 0.3)',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                          Bölüm {lvl.levelId}
                        </span>
                        <div style={{ display: 'flex', gap: '2px', fontSize: '13px' }}>
                          {[1, 2, 3].map((starIdx) => (
                            <span key={starIdx} style={{ color: starIdx <= lvl.bestStars ? '#fbbf24' : '#334155' }}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {isCompleted ? `En İyi Skor: ${lvl.bestScore}` : 'Henüz Oynanmadı'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* E. SON ETKİNLİKLER (Zaman Çizelgesi) */}
            <div style={{
              background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 4px 0' }}>
                    Son Etkinlikler
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Tamamlanan son alıştırmalar ve mini oyun seviyeleri.
                  </p>
                </div>

                {/* Filtre Butonları */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['all', 'learning', 'game'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setSelectedFilter(filterKey)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: selectedFilter === filterKey ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.2)',
                        background: selectedFilter === filterKey ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        color: selectedFilter === filterKey ? '#38bdf8' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {filterKey === 'all' ? 'Tümü' : filterKey === 'learning' ? 'Öğrenme' : 'Oyun'}
                    </button>
                  ))}
                </div>
              </div>

              {filteredActivities.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '20px' }}>
                  Seçilen filtrede etkinlik bulunamadı.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        background: '#040711',
                        border: '1px solid rgba(56, 189, 248, 0.12)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: act.type === 'learning' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}>
                          {act.type === 'learning' ? '📖' : '🎮'}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                            {act.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {act.subtitle}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(act.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {act.starsEarned !== undefined && (
                          <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 800 }}>
                            {act.starsEarned} ⭐
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Profil ve Ebeveyn Modalleri */}
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
        onSyncCompleted={() => {
          loadProgress(activeProfile);
        }}
      />
    </div>
  );
}

