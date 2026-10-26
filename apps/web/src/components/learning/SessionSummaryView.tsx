'use client';

import React from 'react';
import Link from 'next/link';
import type { LearningSessionResult } from '@ventra/shared';
import { VENTRA_FRACTION_SKILLS } from '@ventra/shared';

interface SessionSummaryViewProps {
  result: LearningSessionResult;
  onRetry: () => void;
  onGoToLesson: () => void;
  onReturnToGame: () => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  result,
  onRetry,
  onGoToLesson,
  onReturnToGame
}) => {
  const isHighSuccess = result.accuracyRate >= 0.75;
  const isModerateSuccess = result.accuracyRate >= 0.5;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '24px',
      padding: '32px',
      boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      maxWidth: '720px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* 1. Üst Kutlama & Skor Rozeti */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '56px' }}>
          {isHighSuccess ? '🏆' : isModerateSuccess ? '🌟' : '💪'}
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: isHighSuccess ? '#38bdf8' : '#f59e0b', margin: 0 }}>
          {isHighSuccess ? 'Tebrikler! Kesirler Modülünü Tamamladın!' : 'İyi Bir Başlangıç! Öğrenmeye Devam Et!'}
        </h2>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, maxWidth: '480px' }}>
          4. Sınıf Matematik — M.4.1.6.1 Basit, Bileşik ve Tam Sayılı Kesirler alıştırma oturumu tamamlandı.
        </p>
      </div>

      {/* 2. Temel Başarı Metrikleri Kartları */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
      }}>
        <div style={{
          background: '#040711',
          padding: '16px',
          borderRadius: '14px',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Toplam Skor
          </span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
            {result.score}
          </div>
        </div>

        <div style={{
          background: '#040711',
          padding: '16px',
          borderRadius: '14px',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Doğru Cevap
          </span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
            {result.correctCount} / {result.totalQuestions}
          </div>
        </div>

        <div style={{
          background: '#040711',
          padding: '16px',
          borderRadius: '14px',
          border: '1px solid rgba(56, 189, 248, 0.15)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            Doğruluk Oranı
          </span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>
            %{Math.round(result.accuracyRate * 100)}
          </div>
        </div>
      </div>

      {/* 3. Beceri Bazlı Pedagojik Ustalık Raporu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📊 Beceri Ustalık Dağılımı (Ventra Pedagojik Becerileri)
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(result.skillMastery).map(([skillId, stat]) => {
            const skill = VENTRA_FRACTION_SKILLS[skillId];
            const title = skill ? skill.title : skillId;
            const percent = Math.round(stat.accuracy * 100);

            return (
              <div
                key={skillId}
                style={{
                  background: '#040711',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                    {title}
                  </span>
                  <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', marginTop: '6px' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: percent >= 75 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#ef4444',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: percent >= 75 ? '#34d399' : percent >= 50 ? '#fbbf24' : '#f87171'
                  }}>
                    %{percent}
                  </span>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {stat.correct}/{stat.attempts} Doğru
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Veri Saklama ve Ortak Gelişim Sistemi Durum Bilgisi */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.06)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '12px',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>ℹ️</span>
        <span>
          <strong>Gelişim Durumu:</strong> Henüz Supabase veritabanı bağlanmadığı için bu oturum verisi tarayıcı oturumunda doğrulanmıştır; sahte öğrenci kaydı oluşturulmamıştır.
        </span>
      </div>

      {/* 5. Aksiyon Butonları */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        borderTop: '1px solid rgba(56, 189, 248, 0.15)',
        paddingTop: '20px'
      }}>
        <button
          onClick={onRetry}
          style={{
            flex: '1 1 180px',
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid #38bdf8',
            background: 'transparent',
            color: '#38bdf8',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🔄 Alıştırmaları Tekrar Çöz
        </button>

        <button
          onClick={onGoToLesson}
          style={{
            flex: '1 1 180px',
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid #334155',
            background: '#091224',
            color: '#cbd5e1',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          📖 Konu Anlatımına Dön
        </button>

        <Link
          href="/progress"
          style={{
            flex: '1 1 200px',
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            fontSize: '14px',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>📊</span>
          <span>Gelişimimi Gör</span>
        </Link>

        <button
          onClick={onReturnToGame}
          style={{
            flex: '1 1 200px',
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}
        >
          🧭 Macera Evreni'ne Dön
        </button>
      </div>
    </div>
  );
};
