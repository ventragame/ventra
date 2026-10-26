'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAvatarById, type PlayerProfile } from '@ventra/shared';
import { getProgressRepository } from '../../lib/progress';
import { ProfileSelectorModal } from '../profile/ProfileSelectorModal';

export type LearningCenterTab = 'lesson' | 'explorer' | 'examples' | 'exercises' | 'summary';

interface LearningNavigationProps {
  activeTab: LearningCenterTab;
  onTabChange: (tab: LearningCenterTab) => void;
  onReturnToAdventure: () => void;
}

export const LearningNavigation: React.FC<LearningNavigationProps> = ({
  activeTab,
  onTabChange,
  onReturnToAdventure
}) => {
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadActive() {
      try {
        const repo = getProgressRepository();
        const prof = await repo.getActiveProfile();
        setActiveProfile(prof);
      } catch (err) {
        console.warn('Nav profil yükleme hatası:', err);
      }
    }
    loadActive();
  }, []);
  return (
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
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Üst Sıra: Logo, Breadcrumb ve Macera Evreni Butonu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Sol Logo & Konu Yolu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }} onClick={onReturnToAdventure}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#ffffff',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)'
            }}>
              🧭
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '1px', color: '#38bdf8' }}>
                VENTRA
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Öğrenme Merkezi
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#334155' }} />

          {/* Breadcrumb */}
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

        {/* Sağ Butonlar: Profil, Gelişim ve Macera Evreni */}
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
            href="/progress"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(2, 132, 199, 0.2) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              color: '#10b981',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>📊</span>
            <span>Gelişim</span>
          </Link>

          <button
            onClick={onReturnToAdventure}
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '10px',
              color: '#c084fc',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>🏝️</span>
            <span>Macera Evreni</span>
          </button>
        </div>
      </div>

      {/* Alt Sıra: Modül İçi Sekmeler */}
      <div 
        className="no-scrollbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none'
        }}
      >
        <button
          onClick={() => onTabChange('lesson')}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            border: activeTab === 'lesson' ? '1px solid #38bdf8' : '1px solid transparent',
            background: activeTab === 'lesson' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'lesson' ? '#38bdf8' : '#94a3b8',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>📖</span> Konu Anlatımı
        </button>

        <button
          onClick={() => onTabChange('explorer')}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            border: activeTab === 'explorer' ? '1px solid #38bdf8' : '1px solid transparent',
            background: activeTab === 'explorer' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'explorer' ? '#38bdf8' : '#94a3b8',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>🧪</span> İnteraktif Kesir Modeli
        </button>

        <button
          onClick={() => onTabChange('examples')}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            border: activeTab === 'examples' ? '1px solid #38bdf8' : '1px solid transparent',
            background: activeTab === 'examples' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'examples' ? '#38bdf8' : '#94a3b8',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>💡</span> Çözümlü Örnekler
        </button>

        <button
          onClick={() => onTabChange('exercises')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'exercises' ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
            background: activeTab === 'exercises' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.08)',
            color: activeTab === 'exercises' ? '#34d399' : '#10b981',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <span>🎯</span> Alıştırmalar (8 Soru)
        </button>
      </div>

      <ProfileSelectorModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileSwitched={(p) => setActiveProfile(p)}
      />
    </header>
  );
};
