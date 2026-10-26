'use client';

import React, { useState, useEffect } from 'react';

interface ParentalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ParentalGateModal: React.FC<ParentalGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [numA, setNumA] = useState<number>(7);
  const [numB, setNumB] = useState<number>(8);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  const generateChallenge = () => {
    // 6 - 9 arası iki sayının çarpımı (Ebeveyn doğrulaması)
    const a = Math.floor(Math.random() * 4) + 6;
    const b = Math.floor(Math.random() * 4) + 6;
    setNumA(a);
    setNumB(b);
    setUserAnswer('');
    setHasError(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateChallenge();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(userAnswer.trim(), 10);
    if (parsed === numA * numB) {
      onSuccess();
    } else {
      setHasError(true);
      generateChallenge();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 9, 20, 0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 70,
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        backgroundColor: '#091122',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '36px' }}>🔒</div>

        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0' }}>
            Ebeveyn Doğrulaması
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            Bu alan yalnızca yetişkinlerin bulut yedekleme ve hesap işlemlerini yönetmesi içindir. Devam etmek için lütfen işlemi çözün:
          </p>
        </div>

        <div style={{
          background: '#040711',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          fontSize: '24px',
          fontWeight: 900,
          color: '#38bdf8'
        }}>
          {numA} × {numB} = ?
        </div>

        {hasError && (
          <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
            Hatalı cevap. Lütfen tekrar deneyin.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="number"
            autoFocus
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Sonucu giriniz"
            required
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: '#050914',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#ffffff',
              fontSize: '16px',
              textAlign: 'center',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Onayla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

