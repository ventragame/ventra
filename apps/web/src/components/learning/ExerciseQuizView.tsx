'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FRACTIONS_MODULE_DATA, ExerciseQuestion } from '../../data/learning/fractions';
import type { ExerciseAttemptDetail, LearningSessionResult } from '@ventra/shared';
import { VisualFractionDisplay } from './VisualFractionDisplay';

interface ExerciseQuizViewProps {
  onComplete: (result: LearningSessionResult) => void;
  onExit: () => void;
}

export const ExerciseQuizView: React.FC<ExerciseQuizViewProps> = ({ onComplete, onExit }) => {
  const questions: ExerciseQuestion[] = FRACTIONS_MODULE_DATA.exercises;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<ExerciseAttemptDetail[]>([]);
  const questionStartTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<string>(new Date().toISOString());

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
  }, [currentIndex]);

  const handleSubmitAnswer = () => {
    if (!selectedOptionId || isAnswerSubmitted) return;

    const timeSpent = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;

    const attempt: ExerciseAttemptDetail = {
      questionId: currentQuestion.id,
      skillId: currentQuestion.skillId,
      curriculumCode: currentQuestion.curriculumCode,
      givenAnswer: selectedOptionId,
      expectedAnswer: currentQuestion.correctOptionId,
      isCorrect,
      timeSpentSeconds: timeSpent
    };

    setAttempts(prev => [...prev, attempt]);
    setIsAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Oturum Sonucunu Hesapla
      const allAttempts = attempts;
      const total = questions.length;
      const correctCount = allAttempts.filter(a => a.isCorrect).length;
      const accuracyRate = total > 0 ? correctCount / total : 0;
      const score = Math.round(accuracyRate * 100);

      // Beceri bazlı ustalık analizi
      const skillMastery: Record<string, { attempts: number; correct: number; accuracy: number; mastered: boolean }> = {};
      allAttempts.forEach(att => {
        if (!skillMastery[att.skillId]) {
          skillMastery[att.skillId] = { attempts: 0, correct: 0, accuracy: 0, mastered: false };
        }
        skillMastery[att.skillId].attempts += 1;
        if (att.isCorrect) skillMastery[att.skillId].correct += 1;
        const rate = skillMastery[att.skillId].correct / skillMastery[att.skillId].attempts;
        skillMastery[att.skillId].accuracy = rate;
        skillMastery[att.skillId].mastered = rate >= 0.75;
      });

      const result: LearningSessionResult = {
        sessionId: 'sess-' + Math.random().toString(36).substring(2, 9),
        moduleId: FRACTIONS_MODULE_DATA.id,
        topicTitle: FRACTIONS_MODULE_DATA.title,
        startedAt: sessionStartTimeRef.current,
        completedAt: new Date().toISOString(),
        totalQuestions: total,
        correctCount,
        accuracyRate,
        score,
        skillMastery,
        attempts: allAttempts,
        isPersistedToBackend: false
      };

      onComplete(result);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const progressPercent = Math.round(((currentIndex + (isAnswerSubmitted ? 1 : 0)) / questions.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Üst İlerleme ve Bilgi Çubuğu */}
      <div style={{
        background: '#091224',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '16px',
        padding: '14px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '8px'
            }}>
              Soru {currentIndex + 1} / {questions.length}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Kazanım: M.4.1.6.1 (Kesirler)
            </span>
          </div>

          <button
            onClick={onExit}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ✕ Alıştırmadan Çık
          </button>
        </div>

        {/* İlerleme Çubuğu */}
        <div style={{ width: '100%', height: '6px', background: '#040814', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* 2. Soru Kartı */}
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
        {/* Soru Metni */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0', lineHeight: 1.5 }}>
            {currentQuestion.question}
          </h3>
          <p style={{ fontSize: '14px', color: '#38bdf8', margin: 0, fontWeight: 600 }}>
            {currentQuestion.prompt}
          </p>
        </div>

        {/* Varsa Görsel Model (Daire, Şerit, Sayı Doğrusu, Karışık Bloklar) */}
        {currentQuestion.model && (
          <div style={{
            background: '#040814',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <VisualFractionDisplay
              type={currentQuestion.model.type}
              numerator={currentQuestion.model.numerator}
              denominator={currentQuestion.model.denominator}
              whole={currentQuestion.model.whole}
              size={180}
            />
          </div>
        )}

        {/* 4 Seçenek Kutusu */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px'
        }}>
          {currentQuestion.options.map((opt, optIdx) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.id === currentQuestion.correctOptionId;
            const optionLetters = ['A', 'B', 'C', 'D'];

            let borderStyle = '1px solid rgba(255, 255, 255, 0.1)';
            let bgStyle = '#040711';
            let textColor = '#cbd5e1';

            if (isAnswerSubmitted) {
              if (isCorrect) {
                borderStyle = '2px solid #10b981';
                bgStyle = 'rgba(16, 185, 129, 0.15)';
                textColor = '#34d399';
              } else if (isSelected && !isCorrect) {
                borderStyle = '2px solid #ef4444';
                bgStyle = 'rgba(239, 68, 68, 0.15)';
                textColor = '#f87171';
              }
            } else if (isSelected) {
              borderStyle = '2px solid #38bdf8';
              bgStyle = 'rgba(56, 189, 248, 0.12)';
              textColor = '#38bdf8';
            }

            return (
              <div
                key={opt.id}
                onClick={() => !isAnswerSubmitted && setSelectedOptionId(opt.id)}
                style={{
                  background: bgStyle,
                  border: borderStyle,
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: isAnswerSubmitted ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isSelected ? '#38bdf8' : '#0f172a',
                  color: isSelected ? '#040711' : '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {optionLetters[optIdx]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: textColor }}>
                    {opt.label}
                  </span>
                  {opt.sublabel && (
                    <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {opt.sublabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Anında Pedagojik Açıklama ve Geri Bildirim Banner'ı */}
        {isAnswerSubmitted && (
          <div style={{
            background: selectedOptionId === currentQuestion.correctOptionId ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${selectedOptionId === currentQuestion.correctOptionId ? '#10b981' : '#f59e0b'}`,
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>
                {selectedOptionId === currentQuestion.correctOptionId ? '🎉 Harika!' : '💡 Öğrenme İpucu'}
              </span>
              <strong style={{
                fontSize: '14px',
                color: selectedOptionId === currentQuestion.correctOptionId ? '#34d399' : '#fbbf24'
              }}>
                {selectedOptionId === currentQuestion.correctOptionId ? 'Doğru Cevap!' : 'Tekrar İnceleyelim:'}
              </strong>
            </div>
            <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
              {currentQuestion.explanation}
            </p>
            {currentQuestion.misconceptionAlert && (
              <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                ⚠️ Dikkat: {currentQuestion.misconceptionAlert}
              </span>
            )}
          </div>
        )}

        {/* Aksiyon Butonu */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid rgba(56, 189, 248, 0.15)',
          paddingTop: '16px'
        }}>
          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOptionId}
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                border: 'none',
                background: selectedOptionId ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : '#1e293b',
                color: selectedOptionId ? '#ffffff' : '#64748b',
                fontSize: '14px',
                fontWeight: 800,
                cursor: selectedOptionId ? 'pointer' : 'not-allowed',
                boxShadow: selectedOptionId ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none'
              }}
            >
              Cevabı Onayla ✓
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              style={{
                padding: '12px 28px',
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
              {isLastQuestion ? 'Sonuçları Gör 🏆' : 'Sonraki Soru →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
