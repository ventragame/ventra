'use client';

import React, { useEffect, useState } from 'react';
import './CloudTransition.css';

interface CloudTransitionProps {
  isActive: boolean;
  onCovered?: () => void;
  onComplete?: () => void;
}

type CloudPhase = 'idle' | 'closing' | 'covered' | 'opening';

/**
 * The destination is mounted only AFTER the screen is fully concealed.
 * A single effect owns all timers, including cleanup if navigation is cancelled.
 */
export const CloudTransition: React.FC<CloudTransitionProps> = ({
  isActive,
  onCovered,
  onComplete
}) => {
  const [phase, setPhase] = useState<CloudPhase>('idle');

  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const closeMs = reducedMotion ? 90 : 760;
    const holdMs = reducedMotion ? 90 : 240;
    const openMs = reducedMotion ? 90 : 680;

    setPhase('closing');
    const coverTimer = window.setTimeout(() => {
      setPhase('covered');
      onCovered?.();
    }, closeMs);
    const openTimer = window.setTimeout(() => setPhase('opening'), closeMs + holdMs);
    const completeTimer = window.setTimeout(() => {
      setPhase('idle');
      onComplete?.();
    }, closeMs + holdMs + openMs);

    return () => {
      window.clearTimeout(coverTimer);
      window.clearTimeout(openTimer);
      window.clearTimeout(completeTimer);
    };
  }, [isActive, onCovered, onComplete]);

  if (phase === 'idle') return null;

  return (
    <div className="ventra-cloud-transition" data-phase={phase} aria-hidden="true">
      <div className="ventra-cloud-transition__veil" />
      <div className="ventra-cloud-transition__bank ventra-cloud-transition__bank--left">
        <span className="ventra-cloud-transition__haze" />
      </div>
      <div className="ventra-cloud-transition__bank ventra-cloud-transition__bank--right">
        <span className="ventra-cloud-transition__haze" />
      </div>
      <div className="ventra-cloud-transition__light">
        <span className="ventra-cloud-transition__star">✦</span>
      </div>
    </div>
  );
};
