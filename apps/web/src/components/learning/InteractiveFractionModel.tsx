'use client';

import React, { useState } from 'react';

export const InteractiveFractionModel: React.FC = () => {
  const [modelType, setModelType] = useState<'pie' | 'strip'>('pie');
  const [denominator, setDenominator] = useState<number>(6);
  const [numerator, setNumerator] = useState<number>(4);

  // Kesir Türü Analizi
  const isProper = numerator < denominator;
  const isWholeOne = numerator === denominator;
  const isImproper = numerator >= denominator;
  const isUnitFraction = numerator === 1;

  const wholeCount = Math.floor(numerator / denominator);
  const remainingNumerator = numerator % denominator;

  const handleSliceClick = (index: number) => {
    if (numerator === index + 1) {
      setNumerator(index);
    } else {
      setNumerator(index + 1);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #091224 0%, #060b18 100%)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* 1. Üst Başlık ve Model Seçici */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
        paddingBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🧪</span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              İnteraktif Kesir Laboratuvarı
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Parça sayılarını değiştir veya dilimlere tıklayarak kesir türlerini canlı keşfet.
          </p>
        </div>

        {/* Model Tipi Butonları */}
        <div style={{
          display: 'flex',
          background: '#040711',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          <button
            onClick={() => setModelType('pie')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: modelType === 'pie' ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'transparent',
              color: modelType === 'pie' ? '#ffffff' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🍕 Daire (Pizza)
          </button>
          <button
            onClick={() => setModelType('strip')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: modelType === 'strip' ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'transparent',
              color: modelType === 'strip' ? '#ffffff' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🍫 Şerit (Çikolata)
          </button>
        </div>
      </div>

      {/* 2. Ana İnteraktif Alan (Görsel Model & Canlı Analiz Kartı) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Model Çizim Alanı */}
        <div style={{
          background: '#040814',
          borderRadius: '16px',
          padding: '24px',
          minHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed rgba(56, 189, 248, 0.3)',
          position: 'relative'
        }}>
          {modelType === 'pie' ? (
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="95" fill="#0f172a" stroke="#0284c7" strokeWidth="3" />
              {Array.from({ length: denominator }).map((_, i) => {
                const angleStep = (2 * Math.PI) / denominator;
                const startAngle = i * angleStep - Math.PI / 2;
                const endAngle = (i + 1) * angleStep - Math.PI / 2;
                const x1 = 110 + 95 * Math.cos(startAngle);
                const y1 = 110 + 95 * Math.sin(startAngle);
                const x2 = 110 + 95 * Math.cos(endAngle);
                const y2 = 110 + 95 * Math.sin(endAngle);
                const isLargeArc = angleStep > Math.PI ? 1 : 0;
                const pathData = `M 110 110 L ${x1} ${y1} A 95 95 0 ${isLargeArc} 1 ${x2} ${y2} Z`;
                const isShaded = i < numerator;

                return (
                  <path
                    key={i}
                    d={pathData}
                    fill={isShaded ? '#38bdf8' : '#1e293b'}
                    stroke="#040814"
                    strokeWidth="2.5"
                    style={{ cursor: 'pointer', transition: 'fill 0.2s ease' }}
                    onClick={() => handleSliceClick(i)}
                  />
                );
              })}
              <circle cx="110" cy="110" r="12" fill="#040814" stroke="#38bdf8" strokeWidth="2" />
            </svg>
          ) : (
            <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${denominator}, 1fr)`,
                height: '64px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid #0284c7',
                background: '#0f172a'
              }}>
                {Array.from({ length: denominator }).map((_, i) => {
                  const isShaded = i < numerator;
                  return (
                    <div
                      key={i}
                      onClick={() => handleSliceClick(i)}
                      style={{
                        background: isShaded ? '#38bdf8' : '#1e293b',
                        borderRight: i < denominator - 1 ? '2px solid #040814' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isShaded ? '#030712' : '#64748b',
                        transition: 'background 0.2s ease',
                        userSelect: 'none'
                      }}
                    >
                      1/{denominator}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '14px' }}>
            💡 Parçalara doğrudan tıklayarak boyamayı değiştirebilirsin
          </span>
        </div>

        {/* Canlı Kesir Analiz Kartı */}
        <div style={{
          background: '#040711',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Büyük Kesir Rakamı & Tür Rozeti */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 14px',
                background: 'rgba(56, 189, 248, 0.08)',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>{numerator}</span>
                <div style={{ width: '100%', height: '3px', background: '#38bdf8', margin: '4px 0', borderRadius: '2px' }} />
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>{denominator}</span>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Okunuşu:</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  {denominator}'de {numerator}
                </div>
              </div>
            </div>

            {/* Tür Rozeti */}
            <div style={{
              padding: '8px 14px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              background: isProper 
                ? 'rgba(16, 185, 129, 0.15)' 
                : isWholeOne 
                  ? 'rgba(245, 158, 11, 0.15)' 
                  : 'rgba(168, 85, 247, 0.15)',
              border: `1px solid ${
                isProper ? '#10b981' : isWholeOne ? '#f59e0b' : '#a855f7'
              }`,
              color: isProper ? '#34d399' : isWholeOne ? '#fbbf24' : '#c084fc'
            }}>
              <span>
                {isProper ? 'Basit Kesir' : isWholeOne ? 'Bileşik Kesir (1 Tam)' : 'Bileşik Kesir'}
              </span>
              {isUnitFraction && (
                <span style={{ fontSize: '10px', color: '#fbbf24', marginTop: '2px' }}>
                  ★ Birim Kesir
                </span>
              )}
            </div>
          </div>

          {/* Açıklama ve Özellik Listesi */}
          <div style={{
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#cbd5e1',
            background: '#091224',
            padding: '12px 14px',
            borderRadius: '10px',
            borderLeft: `4px solid ${isProper ? '#10b981' : isWholeOne ? '#f59e0b' : '#a855f7'}`
          }}>
            {isProper && (
              <>
                <strong>Basit Kesir Özelliği:</strong> Payı ({numerator}), paydasından ({denominator}) küçüktür. 
                Henüz tam bir bütüne ulaşılamamıştır (Değeri 0 ile 1 arasındadır).
              </>
            )}
            {isWholeOne && (
              <>
                <strong>Bileşik Kesir (Tam Bütün):</strong> Payı ({numerator}) ile paydası ({denominator}) birbirine eşittir. 
                Bütünün tüm parçaları eksiksiz alınmıştır. Matematiksel olarak <strong>tam 1 bütüne</strong> eşittir ({numerator}/{denominator} = 1).
              </>
            )}
            {!isProper && !isWholeOne && (
              <>
                <strong>Bileşik Kesir (&gt; 1 Bütün):</strong> Payı ({numerator}), paydasından ({denominator}) büyüktür. 
                1 bütünden daha fazladır.
                {wholeCount > 0 && (
                  <div style={{ marginTop: '4px', color: '#c084fc', fontWeight: 700 }}>
                    Tam Sayılı Gösterimi: {wholeCount} tam {remainingNumerator}/{denominator}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Ayar Butonları / Stepper */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        background: '#040711',
        padding: '16px',
        borderRadius: '14px',
        border: '1px solid rgba(56, 189, 248, 0.15)'
      }}>
        {/* Payda Ayarı (Eş Parça Sayısı) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>Payda (Eş Parça):</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>{denominator}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setDenominator(prev => Math.max(2, prev - 1))}
              disabled={denominator <= 2}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '18px',
                fontWeight: 700,
                cursor: denominator <= 2 ? 'not-allowed' : 'pointer',
                opacity: denominator <= 2 ? 0.4 : 1
              }}
            >
              -
            </button>
            <input
              type="range"
              min="2"
              max="12"
              value={denominator}
              onChange={(e) => setDenominator(parseInt(e.target.value, 10))}
              style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            <button
              onClick={() => setDenominator(prev => Math.min(12, prev + 1))}
              disabled={denominator >= 12}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '18px',
                fontWeight: 700,
                cursor: denominator >= 12 ? 'not-allowed' : 'pointer',
                opacity: denominator >= 12 ? 0.4 : 1
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Pay Ayarı (Alınan Parça Sayısı) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>Pay (Alınan/Boyalı Parça):</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>{numerator}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setNumerator(prev => Math.max(0, prev - 1))}
              disabled={numerator <= 0}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '18px',
                fontWeight: 700,
                cursor: numerator <= 0 ? 'not-allowed' : 'pointer',
                opacity: numerator <= 0 ? 0.4 : 1
              }}
            >
              -
            </button>
            <input
              type="range"
              min="0"
              max={denominator}
              value={numerator}
              onChange={(e) => setNumerator(parseInt(e.target.value, 10))}
              style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            <button
              onClick={() => setNumerator(prev => Math.min(denominator, prev + 1))}
              disabled={numerator >= denominator}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#0f172a',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '18px',
                fontWeight: 700,
                cursor: numerator >= denominator ? 'not-allowed' : 'pointer',
                opacity: numerator >= denominator ? 0.4 : 1
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
