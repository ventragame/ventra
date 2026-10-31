'use client';

import React from 'react';
import { COLOR_GROVE_WORDS } from '@/lib/progress/colorGroveProgress';
import './color-grove.css';

type GroveMode = 'discovery' | 'matching' | 'painting';

interface ColorGroveSceneProps {
  mode: GroveMode;
  targetHex?: string;
  paintedIds?: string[];
  highlight?: boolean;
  variant?: 'garden' | 'butterfly' | 'paint';
}

const BASE_PALETTE = ['#fbcfe8', '#a7f3d0', '#fde68a', '#c4b5fd', '#93c5fd', '#fda4af'];

function hexFor(id: string): string {
  return COLOR_GROVE_WORDS.find(color => color.id === id)?.hex ?? '#b1c4cb';
}

/**
 * A lightweight vector world. No network assets, WebGL requirement or native
 * plugins: the same scene can be displayed in web, Android and iOS WebViews.
 * The actual learning controls stay accessible HTML buttons outside the SVG.
 */
export function ColorGroveScene({
  mode, targetHex, paintedIds = [], highlight = false, variant = 'garden'
}: ColorGroveSceneProps) {
  const trunks = [115, 292, 528, 698];
  const colors = trunks.map((_, i) => paintedIds[i] ? hexFor(paintedIds[i]) :
    mode === 'painting' ? '#b6c6c4' : BASE_PALETTE[i]);

  return (
    <div className="vg-scene relative isolate mx-auto w-full overflow-hidden rounded-[1.75rem] border border-white/30 shadow-[0_22px_70px_rgba(5,28,33,0.35)]">
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
        <rect width="820" height="340" fill="url(#vg-sky)" />
        <circle cx="681" cy="65" r="88" fill="url(#vg-sun-glow)" />
        <circle cx="681" cy="65" r="28" fill="#fff8ca" />
        <g fill="#fff" opacity=".82">
          <ellipse cx="123" cy="77" rx="52" ry="15" /><circle cx="105" cy="69" r="20"/><circle cx="145" cy="67" r="22"/>
          <ellipse cx="425" cy="57" rx="56" ry="15" /><circle cx="403" cy="48" r="20"/><circle cx="448" cy="46" r="19"/>
        </g>
        <path d="M0 214 Q137 127 301 202 Q472 142 633 192 Q730 142 820 197 V340 H0Z" fill="#8fcf8d" />
        <path d="M0 255 Q179 191 343 247 Q491 175 820 246 V340 H0Z" fill="url(#vg-hill)" />
        <path d="M0 303 Q196 261 333 303 Q537 256 820 303 V340 H0Z" fill="#286d53" opacity=".6"/>
        <path d="M305 340 Q364 289 421 266 Q462 260 516 340" fill="#ebdfab" opacity=".65"/>
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
            {Array.from({length:5},(_,j)=><ellipse key={j} cx={0} cy={-9} rx={5} ry={11} fill={BASE_PALETTE[(i+j)%6]} transform={`rotate(${j*72} 0 -9)`}/>)}
            <circle cy="-9" r="4" fill="#ffed94"/>
          </g>;
        })}
        {mode === 'matching' && targetHex && (
          <g className={highlight ? 'vg-correct-pop' : ''} filter="url(#vg-soft-shadow)">
            <circle cx="409" cy="177" r="80" fill="#fff" opacity=".88"/>
            {Array.from({length:8},(_,i)=><ellipse key={i} cx="409" cy="118" rx="24" ry="52"
              fill={targetHex} stroke="#fff" strokeWidth="3" transform={`rotate(${i*45} 409 177)`}/>)}
            <circle cx="409" cy="177" r="37" fill="#fff0a6" stroke="#fff" strokeWidth="5"/>
            <circle cx="397" cy="173" r="4" fill="#80513f"/><circle cx="422" cy="173" r="4" fill="#80513f"/>
            <path d="M399 190 q10 11 22 0" stroke="#80513f" strokeWidth="3" fill="none" strokeLinecap="round"/>
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
