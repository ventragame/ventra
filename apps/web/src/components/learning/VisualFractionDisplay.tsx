'use client';

import React from 'react';

interface VisualFractionProps {
  type: 'pie' | 'strip' | 'mixed_bars' | 'number_line';
  numerator: number;
  denominator: number;
  whole?: number;
  size?: number;
  highlightColor?: string;
  emptyColor?: string;
  borderColor?: string;
}

export const VisualFractionDisplay: React.FC<VisualFractionProps> = ({
  type,
  numerator,
  denominator,
  whole = 0,
  size = 200,
  highlightColor = '#38bdf8',
  emptyColor = '#1e293b',
  borderColor = '#0284c7'
}) => {
  const safeDenom = Math.max(1, denominator);
  const safeNum = Math.max(0, numerator);

  // 1. Daire / Pizza Modeli
  if (type === 'pie') {
    const center = size / 2;
    const radius = center - 8;

    if (safeDenom === 1) {
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill={safeNum >= 1 ? highlightColor : emptyColor}
            stroke={borderColor}
            strokeWidth="3"
          />
        </svg>
      );
    }

    const slices = [];
    const angleStep = (2 * Math.PI) / safeDenom;

    for (let i = 0; i < safeDenom; i++) {
      const startAngle = i * angleStep - Math.PI / 2;
      const endAngle = (i + 1) * angleStep - Math.PI / 2;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const isLargeArc = angleStep > Math.PI ? 1 : 0;
      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${isLargeArc} 1 ${x2} ${y2} Z`;
      const isShaded = i < safeNum;

      slices.push(
        <path
          key={i}
          d={pathData}
          fill={isShaded ? highlightColor : emptyColor}
          stroke={borderColor}
          strokeWidth="2"
          style={{ transition: 'fill 0.25s ease' }}
        />
      );
    }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={borderColor} strokeWidth="3" />
        {slices}
      </svg>
    );
  }

  // 2. Şerit / Dikdörtgen Modeli
  if (type === 'strip') {
    const height = 48;
    const width = Math.max(size, 260);
    const partWidth = width / safeDenom;

    return (
      <svg width="100%" height={height + 6} viewBox={`0 0 ${width} ${height + 6}`} style={{ maxWidth: '480px' }}>
        <rect x="2" y="3" width={width - 4} height={height} rx="8" fill={emptyColor} stroke={borderColor} strokeWidth="2" />
        {Array.from({ length: safeDenom }).map((_, i) => {
          const isShaded = i < safeNum;
          const x = 2 + i * partWidth;
          return (
            <g key={i}>
              <rect
                x={x}
                y="3"
                width={partWidth}
                height={height}
                fill={isShaded ? highlightColor : 'transparent'}
                stroke={borderColor}
                strokeWidth="1.5"
                style={{ transition: 'fill 0.2s ease' }}
              />
              <text
                x={x + partWidth / 2}
                y={3 + height / 2 + 5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={isShaded ? '#0f172a' : '#94a3b8'}
              >
                1/{safeDenom}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // 3. Tam Sayılı ve Bileşik Bloklar (mixed_bars)
  if (type === 'mixed_bars') {
    const totalBars = (whole || Math.floor(safeNum / safeDenom)) + 1;
    const remainingNum = whole ? safeNum : safeNum % safeDenom;
    const barWidth = 140;
    const barHeight = 44;

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
        {Array.from({ length: totalBars }).map((_, barIdx) => {
          const isFull = barIdx < totalBars - 1;
          const partsToShade = isFull ? safeDenom : remainingNum;
          const partW = barWidth / safeDenom;

          return (
            <div key={barIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <svg width={barWidth} height={barHeight} viewBox={`0 0 ${barWidth} ${barHeight}`}>
                <rect x="1" y="1" width={barWidth - 2} height={barHeight - 2} rx="6" fill={emptyColor} stroke={borderColor} strokeWidth="2" />
                {Array.from({ length: safeDenom }).map((__, pIdx) => {
                  const isShaded = pIdx < partsToShade;
                  return (
                    <rect
                      key={pIdx}
                      x={1 + pIdx * partW}
                      y="1"
                      width={partW}
                      height={barHeight - 2}
                      fill={isShaded ? (isFull ? '#10b981' : highlightColor) : 'transparent'}
                      stroke={borderColor}
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: isFull ? '#10b981' : '#38bdf8' }}>
                {isFull ? '1 Tam Bütün' : `${remainingNum}/${safeDenom}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // 4. Sayı Doğrusu Modeli
  if (type === 'number_line') {
    const width = Math.max(size, 320);
    const height = 70;
    const paddingX = 36;
    const lineY = 32;
    const lineWidth = width - paddingX * 2;
    const stepX = lineWidth / safeDenom;
    const markerX = paddingX + safeNum * stepX;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '520px' }}>
        {/* Ana Çizgi ve Oklar */}
        <line x1={paddingX - 10} y1={lineY} x2={width - paddingX + 10} y2={lineY} stroke="#475569" strokeWidth="3" />
        <polygon points={`${paddingX - 12},${lineY} ${paddingX - 4},${lineY - 5} ${paddingX - 4},${lineY + 5}`} fill="#475569" />
        <polygon points={`${width - paddingX + 12},${lineY} ${width - paddingX + 4},${lineY - 5} ${width - paddingX + 4},${lineY + 5}`} fill="#475569" />

        {/* 0 ve 1 Ana İşaretçileri */}
        <line x1={paddingX} y1={lineY - 12} x2={paddingX} y2={lineY + 12} stroke="#f8fafc" strokeWidth="3" />
        <text x={paddingX} y={lineY + 28} textAnchor="middle" fontSize="13" fontWeight="800" fill="#f8fafc">0</text>

        <line x1={width - paddingX} y1={lineY - 12} x2={width - paddingX} y2={lineY + 12} stroke="#f8fafc" strokeWidth="3" />
        <text x={width - paddingX} y={lineY + 28} textAnchor="middle" fontSize="13" fontWeight="800" fill="#f8fafc">1 (Tam)</text>

        {/* Ara Parça Çizgileri */}
        {Array.from({ length: safeDenom - 1 }).map((_, i) => {
          const x = paddingX + (i + 1) * stepX;
          return (
            <g key={i}>
              <line x1={x} y1={lineY - 7} x2={x} y2={lineY + 7} stroke="#64748b" strokeWidth="1.5" />
              <text x={x} y={lineY + 24} textAnchor="middle" fontSize="11" fill="#94a3b8">
                {i + 1}/{safeDenom}
              </text>
            </g>
          );
        })}

        {/* Seçilen Kesir Noktası / Pin */}
        <circle cx={markerX} cy={lineY} r="7" fill={highlightColor} stroke="#ffffff" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px #38bdf8)' }} />
        <polygon points={`${markerX},${lineY - 8} ${markerX - 5},${lineY - 16} ${markerX + 5},${lineY - 16}`} fill={highlightColor} />
        <text x={markerX} y={lineY - 20} textAnchor="middle" fontSize="12" fontWeight="800" fill={highlightColor}>
          {safeNum}/{safeDenom}
        </text>
      </svg>
    );
  }

  return null;
};

