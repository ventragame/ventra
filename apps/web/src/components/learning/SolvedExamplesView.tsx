'use client';

import React, { useState } from 'react';
import { FRACTIONS_MODULE_DATA, SolvedExample, LearningModuleData } from '../../data/learning/fractions';
import { VisualFractionDisplay } from './VisualFractionDisplay';

interface SolvedExamplesViewProps {
  onStartExercises: () => void;
  moduleData?: LearningModuleData;
}

export const SolvedExamplesView: React.FC<SolvedExamplesViewProps> = ({ onStartExercises, moduleData }) => {
  const activeModule = moduleData || FRACTIONS_MODULE_DATA;
  const examples: SolvedExample[] = activeModule.solvedExamples;
  const [activeExampleIndex, setActiveExampleIndex] = useState<number>(0);
  const [revealedSteps, setRevealedSteps] = useState<number>(3); // Tüm adımları varsayılan açık göster veya adım adım aç

  const safeIndex = Math.min(activeExampleIndex, examples.length - 1);
  const currentExample = examples[safeIndex] || examples[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Örnek Seçim Sekmeleri */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {examples.map((ex, idx) => {
          const isActive = idx === activeExampleIndex;
          return (
            <button
              key={ex.id}
              onClick={() => {
                setActiveExampleIndex(idx);
                setRevealedSteps(3);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                background: isActive ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)' : '#091224',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📖 {ex.title}
            </button>
          );
        })}
      </div>

      {/* 2. Örnek Kartı */}
      <div style={{
        background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '20px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Soru / Problem Metni */}
        <div style={{
          background: '#040711',
          padding: '18px 20px',
          borderRadius: '14px',
          borderLeft: '4px solid #f59e0b',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
            Örnek Problem
          </span>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, lineHeight: 1.5 }}>
            {currentExample.problem}
          </p>
        </div>

        {/* Görsel Çözüm Modeli & Adımlar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Görsel Çözüm Şeması */}
          <div style={{
            background: '#040814',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <VisualFractionDisplay
              type={currentExample.model.type === 'pie' ? 'pie' : 'strip'}
              numerator={currentExample.model.numerator}
              denominator={currentExample.model.denominator}
              whole={currentExample.model.whole}
              size={180}
            />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>
              Model Temsili: {currentExample.model.whole ? `${currentExample.model.whole} tam ` : ''}{currentExample.model.numerator}/{currentExample.model.denominator}
            </span>
          </div>

          {/* Adım Adım Çözüm Aşamaları */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentExample.steps.map((step) => (
              <div
                key={step.stepNumber}
                style={{
                  background: '#040711',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {step.stepNumber}
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', margin: '0 0 4px 0' }}>
                    {step.title}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kesin Sonuç Kutusu */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>
            {currentExample.finalConclusion}
          </span>
        </div>

        {/* Butonlar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(56, 189, 248, 0.15)', paddingTop: '16px' }}>
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
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            Alıştırmaları Çözmeye Başla →
          </button>
        </div>
      </div>
    </div>
  );
};

