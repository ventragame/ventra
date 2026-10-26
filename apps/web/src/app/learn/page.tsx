'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LearningNavigation, LearningCenterTab } from '../../components/learning/LearningNavigation';
import { FractionLessonView } from '../../components/learning/FractionLessonView';
import { InteractiveFractionModel } from '../../components/learning/InteractiveFractionModel';
import { SolvedExamplesView } from '../../components/learning/SolvedExamplesView';
import { ExerciseQuizView } from '../../components/learning/ExerciseQuizView';
import { SessionSummaryView } from '../../components/learning/SessionSummaryView';
import type { LearningSessionResult } from '@ventra/shared';
import { getProgressRepository } from '../../lib/progress';

function LearningCenterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as LearningCenterTab | null;

  const [activeTab, setActiveTab] = useState<LearningCenterTab>('lesson');
  const [sessionResult, setSessionResult] = useState<LearningSessionResult | null>(null);

  useEffect(() => {
    if (tabParam && ['lesson', 'explorer', 'examples', 'exercises', 'summary'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleReturnToAdventure = () => {
    router.push('/');
  };

  const handleExerciseComplete = async (result: LearningSessionResult) => {
    setSessionResult(result);
    try {
      const repo = getProgressRepository();
      const active = await repo.getActiveProfile();
      await repo.recordLearningSession(result, active?.id);
    } catch (err) {
      console.error('Öğrenme oturumu kaydedilirken hata:', err);
    }
    setActiveTab('summary');
  };

  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      backgroundColor: '#050914',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 1. Üst Navigasyon & Sekmeler */}
      <LearningNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onReturnToAdventure={handleReturnToAdventure}
      />

      {/* 2. Ana İçerik Alanı */}
      <main style={{
        flex: 1,
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px 48px 20px',
        boxSizing: 'border-box'
      }}>
        {activeTab === 'lesson' && (
          <FractionLessonView
            onStartExercises={() => setActiveTab('exercises')}
            onOpenExplorer={() => setActiveTab('explorer')}
          />
        )}

        {activeTab === 'explorer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: '0 0 4px 0' }}>
                  Kesirleri Modellerle Keşfet
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Daire ve şerit modellerini kullanarak pay ve paydanın kesir değerini nasıl değiştirdiğini dene.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('exercises')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                Alıştırmalara Geç ➔
              </button>
            </div>

            <InteractiveFractionModel />
          </div>
        )}

        {activeTab === 'examples' && (
          <SolvedExamplesView
            onStartExercises={() => setActiveTab('exercises')}
          />
        )}

        {activeTab === 'exercises' && (
          <ExerciseQuizView
            onComplete={handleExerciseComplete}
            onExit={() => setActiveTab('lesson')}
          />
        )}

        {activeTab === 'summary' && sessionResult && (
          <SessionSummaryView
            result={sessionResult}
            onRetry={() => {
              setSessionResult(null);
              setActiveTab('exercises');
            }}
            onGoToLesson={() => setActiveTab('lesson')}
            onReturnToGame={handleReturnToAdventure}
          />
        )}
      </main>
    </div>
  );
}

export default function LearningCenterPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100dvh',
        backgroundColor: '#050914',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#38bdf8',
        fontSize: '16px',
        fontWeight: 700
      }}>
        Ventra Öğrenme Merkezi Yükleniyor...
      </div>
    }>
      <LearningCenterContent />
    </Suspense>
  );
}
