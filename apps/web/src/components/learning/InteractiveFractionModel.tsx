'use client';

import React, { useState } from 'react';

export const InteractiveFractionModel: React.FC = () => {
  const [modelType, setModelType] = useState<'pie' | 'strip' | 'unit_compare'>('pie');
  const [denominator, setDenominator] = useState<number>(6);
  const [numerator, setNumerator] = useState<number>(4);

  // Birim Kesir Karşılaştırma Modu için State (MEB Üst Sınırı: 20)
  const [unitDenom1, setUnitDenom1] = useState<number>(3);
  const [unitDenom2, setUnitDenom2] = useState<number>(8);

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
            {modelType === 'unit_compare'
              ? 'Aynı bütünü farklı sayılarda bölerek birim kesirlerin boy farkını canlı test et.'
              : 'Parça sayılarını değiştir veya dilimlere tıklayarak kesir türlerini canlı keşfet.'}
          </p>
        </div>

        {/* Model Tipi Butonları */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          background: '#040711',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          gap: '4px'
        }}>
          <button
            onClick={() => setModelType('pie')}
            style={{
              padding: '8px 14px',
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
              padding: '8px 14px',
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
          <button
            onClick={() => setModelType('unit_compare')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: modelType === 'unit_compare' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent',
              color: modelType === 'unit_compare' ? '#ffffff' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ⚖️ Birim Kesir Karşılaştır
          </button>
        </div>
      </div>

      {modelType === 'unit_compare' ? (
        /* BIRIM KESIR KARSILASTIRMA GÖSTERIMI (M.4.1.6.2) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Karşılaştırma Canlı Sonuç Kartı */}
          <div style={{
            background: '#040814',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.1)',
                  padding: '6px 14px',
                  borderRadius: '10px'
                }}>
                  1/{unitDenom1}
                </span>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: unitDenom1 < unitDenom2 ? '#10b981' : unitDenom1 > unitDenom2 ? '#f43f5e' : '#fbbf24'
                }}>
                  {unitDenom1 < unitDenom2 ? '>' : unitDenom1 > unitDenom2 ? '<' : '='}
                </span>
                <span style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '6px 14px',
                  borderRadius: '10px'
                }}>
                  1/{unitDenom2}
                </span>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#94a3b8'
              }}>
                MEB Üst Sınırı: Payda ≤ 20
              </div>
            </div>

            {/* Strip 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>1. Bütün ({unitDenom1} Eş Parça)</span>
                <span style={{ color: '#94a3b8' }}>Birim Kesir: 1/{unitDenom1}</span>
              </div>
              <svg width="100%" height="46" viewBox="0 0 500 46" style={{ background: '#0a0f1d', borderRadius: '8px', border: '1px solid #1e293b' }}>
                {Array.from({ length: unitDenom1 }).map((_, i) => {
                  const partW = 500 / unitDenom1;
                  const isShaded = i === 0;
                  return (
                    <g key={i}>
                      <rect
                        x={i * partW}
                        y="0"
                        width={partW}
                        height="46"
                        fill={isShaded ? '#0284c7' : '#0f172a'}
                        stroke="#0369a1"
                        strokeWidth="1.5"
                      />
                      {partW > 24 && (
                        <text
                          x={i * partW + partW / 2}
                          y="28"
                          textAnchor="middle"
                          fill={isShaded ? '#ffffff' : '#64748b'}
                          fontSize={partW < 40 ? '10' : '12'}
                          fontWeight="700"
                        >
                          {isShaded ? `1/${unitDenom1}` : ''}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Strip 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>2. Bütün ({unitDenom2} Eş Parça)</span>
                <span style={{ color: '#94a3b8' }}>Birim Kesir: 1/{unitDenom2}</span>
              </div>
              <svg width="100%" height="46" viewBox="0 0 500 46" style={{ background: '#0a0f1d', borderRadius: '8px', border: '1px solid #1e293b' }}>
                {Array.from({ length: unitDenom2 }).map((_, i) => {
                  const partW = 500 / unitDenom2;
                  const isShaded = i === 0;
                  return (
                    <g key={i}>
                      <rect
                        x={i * partW}
                        y="0"
                        width={partW}
                        height="46"
                        fill={isShaded ? '#059669' : '#0f172a'}
                        stroke="#047857"
                        strokeWidth="1.5"
                      />
                      {partW > 24 && (
                        <text
                          x={i * partW + partW / 2}
                          y="28"
                          textAnchor="middle"
                          fill={isShaded ? '#ffffff' : '#64748b'}
                          fontSize={partW < 40 ? '10' : '12'}
                          fontWeight="700"
                        >
                          {isShaded ? `1/${unitDenom2}` : ''}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Açıklayıcı Pedagojik Kart */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.4)',
              borderLeft: '4px solid #10b981',
              padding: '12px 16px',
              borderRadius: '0 8px 8px 0',
              fontSize: '13px',
              color: '#cbd5e1',
              lineHeight: 1.5
            }}>
              {unitDenom1 < unitDenom2 ? (
                <span>
                  💡 <strong>1/{unitDenom1} parçası, 1/{unitDenom2} parçasından daha büyüktür!</strong> Çünkü bütün daha az parçaya (sadece {unitDenom1} parçaya) bölünmüştür. Payda büyüdükçe parçanın boyutu küçülür.
                </span>
              ) : unitDenom1 > unitDenom2 ? (
                <span>
                  💡 <strong>1/{unitDenom1} parçası, 1/{unitDenom2} parçasından daha küçüktür!</strong> Çünkü bütün daha çok parçaya ({unitDenom1} parçaya) bölünmüştür. Payda ne kadar büyürse dilim o kadar daralır.
                </span>
              ) : (
                <span>
                  💡 İki bütün de eşit sayıda ({unitDenom1}) parçaya bölündüğü için dilim boyutları tamamen eşittir!
                </span>
              )}
            </div>
          </div>

          {/* Ayarlar ve Kaydırıcılar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            {/* 1. Payda Slider */}
            <div style={{ background: '#060b18', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>1. Kesir Paydası:</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>{unitDenom1}</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                value={unitDenom1}
                onChange={(e) => setUnitDenom1(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                <span>2 (En Geniş)</span>
                <span>20 (En Dar)</span>
              </div>
            </div>

            {/* 2. Payda Slider */}
            <div style={{ background: '#060b18', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>2. Kesir Paydası:</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>{unitDenom2}</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                value={unitDenom2}
                onChange={(e) => setUnitDenom2(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                <span>2 (En Geniş)</span>
                <span>20 (En Dar)</span>
              </div>
            </div>
          </div>

          {/* Hızlı Karşılaştırma Ön Ayarları */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Hızlı Örnekler:</span>
            {[
              { label: '1/2 vs 1/4', d1: 2, d2: 4 },
              { label: '1/3 vs 1/6', d1: 3, d2: 6 },
              { label: '1/4 vs 1/12', d1: 4, d2: 12 },
              { label: '1/5 vs 1/20 (Sınır)', d1: 5, d2: 20 },
              { label: '1/7 vs 1/14', d1: 7, d2: 14 }
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => {
                  setUnitDenom1(preset.d1);
                  setUnitDenom2(preset.d2);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#091224',
                  border: '1px solid #1e293b',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* MEVCUT PİE VE STRİP GÖSTERİMİ */
        <>
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
                        fill={isShaded ? '#0284c7' : '#0f172a'}
                        stroke="#38bdf8"
                        strokeWidth="2"
                        onClick={() => handleSliceClick(i)}
                        style={{ cursor: 'pointer', transition: 'fill 0.2s ease' }}
                      />
                    );
                  })}
                </svg>
              ) : (
                <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <svg width="100%" height="60" viewBox="0 0 380 60">
                    <rect x="2" y="2" width="376" height="56" rx="8" fill="#0f172a" stroke="#0284c7" strokeWidth="2" />
                    {Array.from({ length: denominator }).map((_, i) => {
                      const partW = 376 / denominator;
                      const isShaded = i < numerator;
                      return (
                        <g key={i} onClick={() => handleSliceClick(i)} style={{ cursor: 'pointer' }}>
                          <rect
                            x={2 + i * partW}
                            y="2"
                            width={partW}
                            height="56"
                            fill={isShaded ? '#0284c7' : 'transparent'}
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            style={{ transition: 'fill 0.2s ease' }}
                          />
                          <text
                            x={2 + i * partW + partW / 2}
                            y="34"
                            textAnchor="middle"
                            fill={isShaded ? '#ffffff' : '#64748b'}
                            fontSize="11"
                            fontWeight="700"
                          >
                            1/{denominator}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', margin: 0 }}>
                    Parçaların üzerine tıklayarak boyayabilir veya boyayı kaldırabilirsiniz.
                  </p>
                </div>
              )}
            </div>

            {/* Canlı Analiz Kartı */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#050914',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: '#091224',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: '1px solid #38bdf8'
                }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>{numerator}</span>
                  <div style={{ width: '28px', height: '3px', background: '#38bdf8', margin: '4px 0' }} />
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>{denominator}</span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Kesir Türü:</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: isUnitFraction ? '#10b981' : isProper ? '#38bdf8' : isWholeOne ? '#fbbf24' : '#f59e0b'
                  }}>
                    {isUnitFraction
                      ? 'Birim Kesir (Payı 1)'
                      : isProper
                        ? 'Basit Kesir'
                        : isWholeOne
                          ? 'Bileşik Kesir (1 Tam)'
                          : 'Bileşik Kesir'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {isUnitFraction
                      ? 'Bütünün eş parçalarından 1 tanesi.'
                      : isProper
                        ? 'Pay, paydadan küçüktür (1 bütünden az).'
                        : `${wholeCount} tam bütün ve ${remainingNumerator}/${denominator} parça.`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ayarlar ve Slayt Çubukları */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '16px'
          }}>
            {/* Payda Ayarı */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>Payda (Bölünen Parça):</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>{denominator}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    const newDen = Math.max(2, denominator - 1);
                    setDenominator(newDen);
                    if (numerator > newDen) setNumerator(newDen);
                  }}
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
                  onChange={(e) => {
                    const newDen = parseInt(e.target.value, 10);
                    setDenominator(newDen);
                    if (numerator > newDen) setNumerator(newDen);
                  }}
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

            {/* Pay Ayarı */}
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
        </>
      )}
    </div>
  );
};
