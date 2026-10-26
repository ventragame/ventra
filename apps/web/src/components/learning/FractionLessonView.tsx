'use client';

import React, { useState } from 'react';
import { FRACTIONS_MODULE_DATA, FractionLessonSection } from '../../data/learning/fractions';
import { VisualFractionDisplay } from './VisualFractionDisplay';

interface FractionLessonViewProps {
  onStartExercises: () => void;
  onOpenExplorer: () => void;
}

export const FractionLessonView: React.FC<FractionLessonViewProps> = ({
  onStartExercises,
  onOpenExplorer
}) => {
  const sections = FRACTIONS_MODULE_DATA.sections;
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const currentSection: FractionLessonSection = sections[activeSectionIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Konu Adımları Gezinme Sekmeleri */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '8px'
      }}>
        {sections.map((sec, idx) => {
          const isActive = idx === activeSectionIndex;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSectionIndex(idx)}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(37, 99, 235, 0.25) 100%)' 
                  : '#091224',
                color: isActive ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 14px rgba(2, 132, 199, 0.25)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: isActive ? '#38bdf8' : '#64748b' }}>
                  ADIM {idx + 1}
                </span>
                {isActive && <span style={{ fontSize: '10px', color: '#10b981' }}>● Aktif</span>}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: isActive ? '#ffffff' : '#cbd5e1' }}>
                {sec.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Aktif Konu Kartı */}
      <div style={{
        background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Başlık ve Rozet */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
          paddingBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8'
              }}>
                {currentSection.badge}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                M.4.1.6.1 • 4. Sınıf Matematik
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              {currentSection.title}
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              {currentSection.subtitle}
            </p>
          </div>

          <button
            onClick={onOpenExplorer}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              background: 'rgba(2, 132, 199, 0.15)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🧪</span> İnteraktif Modeli Aç
          </button>
        </div>

        {/* Ana Açıklama ve Görsel Model Alanı */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Sol Kolon: Açıklama ve Kural */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#e2e8f0', margin: 0 }}>
              {currentSection.content.explanation}
            </p>

            {/* Önemli Kural Kutusu */}
            <div style={{
              background: '#040711',
              borderLeft: '4px solid #38bdf8',
              borderRadius: '0 12px 12px 0',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📌 Önemli Kural
              </span>
              <pre style={{
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: 1.5,
                color: '#f8fafc',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {currentSection.content.keyRule}
              </pre>
            </div>
          </div>

          {/* Sağ Kolon: Görsel Kesir Temsili */}
          <div style={{
            background: '#040814',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px'
          }}>
            <VisualFractionDisplay
              type={currentSection.content.visualType === 'mixed' ? 'mixed_bars' : currentSection.content.visualType === 'anatomy' ? 'pie' : 'strip'}
              numerator={currentSection.content.visualData.numerator}
              denominator={currentSection.content.visualData.denominator}
              whole={currentSection.content.visualData.whole}
              size={180}
            />
            {currentSection.content.visualData.label && (
              <span style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '4px 12px',
                borderRadius: '20px'
              }}>
                {currentSection.content.visualData.label}
              </span>
            )}
          </div>
        </div>

        {/* Günlük Hayat Örneği ve Eğlenceli Bilgi */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          background: '#040711',
          padding: '16px 20px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>🍎</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>
                GÜNLÜK HAYAT: {currentSection.content.realLifeExample.title}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 4px 0', lineHeight: 1.4 }}>
              {currentSection.content.realLifeExample.story}
            </p>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
              ➔ {currentSection.content.realLifeExample.fraction}
            </span>
          </div>

          {currentSection.content.funFact && (
            <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px' }}>💡</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>
                  VENTRA İPUCU
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                {currentSection.content.funFact}
              </p>
            </div>
          )}
        </div>

        {/* Alt Butonlar (Geri / İleri / Alıştırmalara Başla) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(56, 189, 248, 0.15)',
          paddingTop: '16px'
        }}>
          <button
            onClick={() => setActiveSectionIndex(prev => Math.max(0, prev - 1))}
            disabled={activeSectionIndex === 0}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid #334155',
              background: '#091224',
              color: activeSectionIndex === 0 ? '#475569' : '#cbd5e1',
              fontSize: '13px',
              fontWeight: 700,
              cursor: activeSectionIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Önceki Adım
          </button>

          {activeSectionIndex < sections.length - 1 ? (
            <button
              onClick={() => setActiveSectionIndex(prev => Math.min(sections.length - 1, prev + 1))}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}
            >
              Sonraki Adım: {sections[activeSectionIndex + 1].title} →
            </button>
          ) : (
            <button
              onClick={onStartExercises}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)'
              }}
            >
              🎯 Alıştırmalara Başla (8 Soru) →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

