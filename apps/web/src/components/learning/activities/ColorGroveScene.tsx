'use client';

import React from 'react';
import { GROVE_TREE_POSITIONS, GROVE_PALETTE, getGroveTreeColors, type GroveMode } from '@/lib/learning/colorGroveSceneModel';
import './color-grove.css';

interface ColorGroveSceneProps {
  mode: GroveMode;
  targetHex?: string;
  paintedIds?: string[];
  highlight?: boolean;
  variant?: 'garden' | 'butterfly' | 'paint';
}

/**
 * A lightweight vector world. No network assets, WebGL requirement or native
 * plugins: the same scene can be displayed in web, Android and iOS WebViews.
 * The actual learning controls stay accessible HTML buttons outside the SVG.
 */
export function ColorGroveScene({
  mode, targetHex, paintedIds = [], highlight = false, variant = 'garden'
}: ColorGroveSceneProps) {
  const trunks = GROVE_TREE_POSITIONS;
  const colors = getGroveTreeColors(mode, paintedIds);

  return (
    <div className="vg-scene cg4-desktop-scene relative isolate mx-auto w-full overflow-hidden rounded-[1.75rem] border border-white/30 shadow-[0_22px_70px_rgba(5,28,33,0.35)]">
      <svg viewBox="0 0 820 340" width="100%" role="img"
        aria-label={mode === 'discovery' ? 'Rengârenk çiçeklerle dolu, ağaçlı bir koru' :
          mode === 'matching' ? 'Ortadaki çiçeğin rengini İngilizce eşleştir' :
          'Doğru cevap verdikçe ağaçları renklendirdiğin koru'}
        preserveAspectRatio="xMidYMid slice" className="block w-full" style={{ minHeight: 185, maxHeight: 310 }}>
        <defs>
          <linearGradient id="vg-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#71d9fa" />
            <stop offset="68%" stopColor="#c2f7eb" />
            <stop offset="100%" stopColor="#e9f7c5" />
          </linearGradient>
          <linearGradient id="vg-hill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#72bd77" />
            <stop offset="1" stopColor="#216d52" />
          </linearGradient>
          <radialGradient id="vg-sun-glow">
            <stop offset="0" stopColor="#fff6bd" stopOpacity=".94" />
            <stop offset="1" stopColor="#fff6bd" stopOpacity="0" />
          </radialGradient>
          <filter id="vg-soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#174b44" floodOpacity=".27" />
          </filter>
        </defs>
        <image href="/assets/colors/grove-stage-v4.svg" x="0" y="0" width="820" height="340" preserveAspectRatio="xMidYMid slice" />
        <rect width="820" height="340" fill="#145653" opacity=".08" />
        {trunks.map((x,i) => (
          <g key={x} filter="url(#vg-soft-shadow)">
            <rect x={x - 11} y={163 + (i%2)*17} width="22" height="99" rx="9" fill="#80513f"/>
            <path d={`M${x} 215 q-33 -26 -46 -29 M${x} 231 q29 -25 42 -30`} stroke="#80513f" strokeWidth="9" fill="none" strokeLinecap="round"/>
            <g className="vg-tree-crown" style={{ animationDelay: `${i * -0.63}s` }}>
              <circle cx={x-23} cy={166+(i%2)*17} r="39" fill={colors[i]} stroke="#fff" strokeOpacity=".29" strokeWidth="4"/>
              <circle cx={x+24} cy={159+(i%2)*17} r="44" fill={colors[i]} stroke="#fff" strokeOpacity=".23" strokeWidth="4"/>
              <circle cx={x} cy={133+(i%2)*17} r="49" fill={colors[i]} stroke="#fff" strokeOpacity=".22" strokeWidth="4"/>
              <circle cx={x-13} cy={148+(i%2)*17} r="6" fill="#fff" opacity=".35"/>
              <circle cx={x+20} cy={127+(i%2)*17} r="4" fill="#fff" opacity=".3"/>
            </g>
          </g>
        ))}
        {Array.from({length: 12}, (_,i) => {
          const x=24+i*69, y=275+(i%3)*16;
          return <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0 18 V-2" stroke="#327a52" strokeWidth="3" strokeLinecap="round"/>
            {Array.from({length:5},(_,j)=><ellipse key={j} cx={0} cy={-9} rx={5} ry={11} fill={GROVE_PALETTE[(i+j)%6]} transform={`rotate(${j*72} 0 -9)`}/>)}
            <circle cy="-9" r="4" fill="#ffed94"/>
          </g>;
        })}
        {mode === 'matching' && targetHex && variant === 'butterfly' && (
          <g className={highlight ? 'vg-correct-pop' : ''} filter="url(#vg-soft-shadow)">
            <ellipse cx="385" cy="147" rx="43" ry="68" fill={targetHex} stroke="#fff" strokeWidth="5" transform="rotate(-27 385 147)" />
            <ellipse cx="433" cy="147" rx="43" ry="68" fill={targetHex} stroke="#fff" strokeWidth="5" transform="rotate(27 433 147)" />
            <ellipse cx="385" cy="217" rx="32" ry="45" fill={targetHex} stroke="#fff" strokeWidth="5" transform="rotate(22 385 217)" />
            <ellipse cx="433" cy="217" rx="32" ry="45" fill={targetHex} stroke="#fff" strokeWidth="5" transform="rotate(-22 433 217)" />
            <rect x="399" y="145" width="20" height="91" rx="10" fill="#60443c" />
            <path d="M402 151 Q378 103 368 118 M416 151 Q441 104 453 119" fill="none" stroke="#60443c" strokeWidth="5" strokeLinecap="round"/>
          </g>
        )}
        {mode === 'matching' && targetHex && variant === 'garden' && (
          <g className={highlight ? 'vg-correct-pop' : ''} filter="url(#vg-soft-shadow)">
            <circle cx="409" cy="177" r="80" fill="#fff" opacity=".88"/>
            {Array.from({length:8},(_,i)=><ellipse key={i} cx="409" cy="118" rx="24" ry="52"
              fill={targetHex} stroke="#fff" strokeWidth="3" transform={`rotate(${i*45} 409 177)`}/>)}
            <circle cx="409" cy="177" r="37" fill="#fff0a6" stroke="#fff" strokeWidth="5"/>
            <circle cx="397" cy="173" r="4" fill="#80513f"/><circle cx="422" cy="173" r="4" fill="#80513f"/>
            <path d="M399 190 q10 11 22 0" stroke="#80513f" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </g>
        )}
        {mode === 'matching' && targetHex && variant === 'paint' && (
          <g className={highlight ? 'vg-correct-pop' : ''} filter="url(#vg-soft-shadow)">
            <circle cx="409" cy="174" r="95" fill="#fff5d5" opacity=".82" />
            <path d="M409 70 L483 129 L460 237 L409 280 L358 237 L335 129 Z" fill={targetHex} stroke="#fff9d8" strokeWidth="9"/>
            <path d="M409 70L409 280L460 237L483 129Z" fill="#1c4750" opacity=".17"/>
            <path d="M358 129L409 70L370 162Z" fill="#fff" opacity=".48"/>
          </g>
        )}
        {mode === 'painting' && (
          <g className={highlight ? 'vg-correct-pop' : ''}>
            <path d="M398 261 q-8 -57 0 -110" stroke="#80513f" strokeWidth="16" strokeLinecap="round"/>
            <circle cx="398" cy="143" r="50" fill={highlight && targetHex ? targetHex : '#b6c6c4'}
              stroke="#fff" strokeWidth="5" strokeOpacity=".85"/>
            <path d="M382 139 q-8 -8 -15 0 M414 139 q9 -8 15 0" fill="none" stroke="#375c4d" strokeWidth="3" strokeLinecap="round" />
            <path d="M386 156 q12 11 24 0" fill="none" stroke="#375c4d" strokeWidth="3" strokeLinecap="round"/>
            {variant === 'butterfly' && <g className="vg-butterfly">
              <ellipse cx="468" cy="93" rx="15" ry="24" fill="#d8b4fe" transform="rotate(-24 468 93)"/>
              <ellipse cx="502" cy="93" rx="15" ry="24" fill="#fda4af" transform="rotate(24 502 93)"/>
              <ellipse cx="485" cy="106" rx="5" ry="19" fill="#705789"/>
            </g>}
          </g>
        )}
        {mode === 'painting' && paintedIds.length > 6 && (
          <g className="vg-correct-pop" aria-label="Tekrar edilen renklerle yanan ışıklar">
            {paintedIds.slice(6).map((_,i)=>(
              <g key={i} transform={`translate(${375+i*46} 40)`}>
                <circle r="16" fill="#ffedac" stroke="#fff" strokeWidth="3"/>
                <path d="M-12 0H12M0-12V12" stroke="#fff" strokeWidth="3" opacity=".8" />
              </g>
            ))}
          </g>
        )}
        <g className="vg-butterfly" aria-hidden="true">
          <ellipse cx="226" cy="61" rx="13" ry="18" fill="#fcd34d" transform="rotate(-30 226 61)"/>
          <ellipse cx="249" cy="61" rx="13" ry="18" fill="#f9a8d4" transform="rotate(30 249 61)"/>
          <rect x="234" y="56" width="6" height="23" rx="3" fill="#71504e"/>
        </g>
        <g fill="#fff" opacity=".66"><circle cx="75" cy="210" r="3"/><circle cx="359" cy="88" r="4"/><circle cx="580" cy="62" r="3"/><circle cx="765" cy="236" r="4"/></g>
      </svg>
      <span className="pointer-events-none absolute bottom-2 left-3 rounded-full border border-white/60 bg-emerald-950/60 px-3 py-1 text-[10px] font-extrabold tracking-wider text-white/95 backdrop-blur">
        {mode === 'discovery' ? 'KEŞİF BAHÇESİ' : mode === 'matching' ? 'RENK DEDEKTİFLERİ' : 'SİHİRLİ BOYA KORUSU'}
      </span>
    </div>
  );
}
