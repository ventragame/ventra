'use client';

import React, { useEffect, useState } from 'react';

interface CloudTransitionProps {
  isActive: boolean;
  onCovered?: () => void;
  onComplete?: () => void;
}

export const CloudTransition: React.FC<CloudTransitionProps> = ({
  isActive,
  onCovered,
  onComplete
}) => {
  const [phase, setPhase] = useState<'idle' | 'closing' | 'covered' | 'opening'>('idle');

  useEffect(() => {
    if (isActive) {
      setPhase('closing');
      const coverTimer = setTimeout(() => {
        setPhase('covered');
        onCovered?.();
        const openTimer = setTimeout(() => {
          setPhase('opening');
          const completeTimer = setTimeout(() => {
            setPhase('idle');
            onComplete?.();
          }, 450);
          return () => clearTimeout(completeTimer);
        }, 250);
        return () => clearTimeout(openTimer);
      }, 400);
      return () => clearTimeout(coverTimer);
    } else {
      setPhase('idle');
    }
  }, [isActive]);

  if (phase === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Sol Bulut Grubu */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-3/4 bg-gradient-to-r from-sky-100 via-sky-50 to-transparent transition-transform duration-500 ease-out flex items-center ${
          phase === 'closing' || phase === 'covered' ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          filter: 'drop-shadow(0 15px 30px rgba(2, 132, 199, 0.3))'
        }}
      >
        <div className="w-full flex flex-col justify-around h-full py-10 opacity-95">
          <img src="/assets/island/cloud.svg" alt="bulut" className="w-72 -ml-16 transform scale-125" />
          <img src="/assets/island/cloud.svg" alt="bulut" className="w-96 -ml-8" />
          <img src="/assets/island/cloud.svg" alt="bulut" className="w-64 -ml-12" />
        </div>
      </div>

      {/* Sağ Bulut Grubu */}
      <div
        className={`absolute top-0 bottom-0 right-0 w-3/4 bg-gradient-to-l from-sky-100 via-sky-50 to-transparent transition-transform duration-500 ease-out flex items-center justify-end ${
          phase === 'closing' || phase === 'covered' ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          filter: 'drop-shadow(0 15px 30px rgba(2, 132, 199, 0.3))'
        }}
      >
        <div className="w-full flex flex-col justify-around items-end h-full py-10 opacity-95">
          <img src="/assets/island/cloud.svg" alt="bulut" className="w-80 -mr-12" />
          <img src="/assets/island/cloud.svg" alt="bulut" className="w-64 -mr-6 transform scale-110" />
          <img src="/assets/island/cloud.svg" alt="bulut" className="w-96 -mr-16" />
        </div>
      </div>
    </div>
  );
};

