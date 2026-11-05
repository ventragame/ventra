'use client';

import React from 'react';
import { COLOR_GROVE_WORDS } from '@/lib/progress/colorGroveProgress';
import './color-grove.css';
import './color-grove-v4.css';

type ColorWord = (typeof COLOR_GROVE_WORDS)[number];
type MobileMode = 'discovery' | 'matching' | 'painting' | 'complete';
type Scene = 'garden' | 'butterfly' | 'paint';

interface Props {
  mode: MobileMode;
  words?: readonly ColorWord[];
  targetHex?: string;
  variant?: Scene;
  discoveredIds?: readonly string[];
  freshIds?: readonly string[];
  paintedIds?: readonly string[];
  wrongId?: string | null;
  correctId?: string | null;
  disabled?: boolean;
  onChoose?: (id: ColorWord['id']) => void;
}

const FINISH_COLORS = ['#ff9eaf', '#f9d671', '#a593f1', '#84d6c7', '#8cc8f5', '#eaa3e2'];

function Blossom({ color, size = 'normal' }: { color: string; size?: 'normal' | 'hero' }) {
  return <span className={'cg4-blossom cg4-blossom--' + size}
    style={{ '--cg4-color': color } as React.CSSProperties} aria-hidden="true">
    <span className="cg4-petal-ring"/><span className="cg4-blossom-heart"/>
  </span>;
}

/** One shared learning interaction with a responsive, touch-safe illustrated stage.
 * Color names remain readable when a child cannot distinguish neighboring hues. */
export function MobileColorGroveWorld({
  mode, words = [], targetHex, variant = 'garden', discoveredIds = [], freshIds = [],
  paintedIds = [], wrongId = null, correctId = null, disabled = false, onChoose
}: Props) {
  const isDiscovery = mode === 'discovery';
  const isPainting = mode === 'painting';
  const isDone = mode === 'complete';
  const scene = isDiscovery ? 'garden' : variant;
  const caption = isDiscovery ? 'Dokun, dinle, renkleri keşfet' :
    isDone ? 'Koru yeniden renklerle doldu' :
    isPainting ? 'İngilizce rengi duy, doğru boyayı seç' : 'Gördüğün rengin İngilizce adını bul';
  const blossoms = Array.from({length:6}, (_, index) => {
    const word = COLOR_GROVE_WORDS.find(color => color.id === paintedIds[index]);
    return word?.hex ?? FINISH_COLORS[index];
  });

  return <section className={'cg-world cg4-stage cg4-stage--' + mode} data-scene={scene} aria-label={caption}>
    <div className="cg4-atmosphere" aria-hidden="true">
      <span className="cg4-sunbeam"/><span className="cg4-firefly cg4-firefly--one"/>
      <span className="cg4-firefly cg4-firefly--two"/><span className="cg4-firefly cg4-firefly--three"/>
    </div>
    <div className="cg4-topbar">
      <span className="cg4-scene-pill">{isDiscovery ? '✿ RENK KEŞFİ' : isDone ? '✦ RENKLER GERİ DÖNDÜ' : isPainting ? '✦ SİHİRLİ BOYA' : '✿ RENK DEDEKTİFİ'}</span>
      {isDiscovery && <span className="cg4-counter" aria-label={discoveredIds.length + ' renk keşfedildi'}>{discoveredIds.length} / {words.length} <span aria-hidden="true">✓</span></span>}
      {isPainting && <span className="cg4-counter" aria-label={paintedIds.length + ' renk boyandı'}>{paintedIds.length} <span aria-hidden="true">✦</span></span>}
    </div>

    {isDone ? (
      <div className="cg4-finale" aria-label="Renkleri geri gelen çiçek bahçesi">
        <div className="cg4-finale-garden">
          {blossoms.map((hex, index) => <span key={index} className="cg4-finale-bloom"
            style={{ '--cg4-delay': index * 65 + 'ms' } as React.CSSProperties}><Blossom color={hex}/></span>)}
        </div>
        <p className="cg4-finale-title">Koru yeniden ışıldıyor!</p>
      </div>
    ) : isDiscovery ? (
      <div className="cg4-discovery-grid" role="group" aria-label="Renk çiçeklerini keşfet">
        {words.map((word,index) => {
          const discovered = discoveredIds.includes(word.id);
          return <button type="button" key={word.id} disabled={disabled}
            className="cg4-discover-card vg-answer-card" data-found={discovered}
            style={{ '--cg4-delay': index * 55 + 'ms' } as React.CSSProperties}
            aria-pressed={discovered} aria-label={word.tr + ', İngilizce ' + word.id + '. Dinlemek için dokun'}
            onClick={()=>onChoose?.(word.id)}>
            {freshIds.includes(word.id) && <span className="cg4-new-badge">YENİ</span>}
            <span className={'cg4-card-art cg4-card-art--' + (index%3)}>
              <Blossom color={word.hex}/>
            </span>
            <span className="cg4-discover-name">{word.id.toUpperCase()}</span>
            <span className="cg4-discover-sub">{word.tr}</span>
            <span className="cg4-discover-status" aria-hidden="true">{discovered ? '✓' : '♪'}</span>
          </button>;
        })}
      </div>
    ) : (
      <>
        <div className="cg4-focus" aria-label={isPainting ? 'Boyanmayı bekleyen çiçek' : 'Rengini bulman gereken büyülü nesne'}>
          <div className={'cg4-focus-platform cg4-focus-platform--' + scene}
            style={{ '--cg4-color': isPainting && !correctId ? '#c9d7d4' : targetHex ?? '#f5d78b' } as React.CSSProperties}>
            <span className="cg4-focus-halo" aria-hidden="true"/>
            {scene === 'butterfly' ? <span className="cg4-butterfly" aria-hidden="true">
              <span className="cg4-wing cg4-wing--left"/><span className="cg4-wing cg4-wing--right"/>
              <span className="cg4-butterfly-body"/>
            </span> : scene === 'paint' ? <span className="cg4-gem" aria-hidden="true"/> :
              <Blossom color={isPainting && !correctId ? '#c9d7d4' : targetHex ?? '#f5d78b'} size="hero"/>}
            {correctId && <span className="cg4-correct-burst" aria-hidden="true">✦</span>}
          </div>
          <span className="cg4-focus-label">{isPainting ? 'BOYAYI BUL' : 'RENK HANGİSİ?'}</span>
        </div>
        <div className="cg4-choice-grid" role="group" aria-label={isPainting ? 'Boya paleti' : 'İngilizce renk seçenekleri'}>
          {words.map(word => <button key={word.id} type="button" disabled={disabled}
            onClick={()=>onChoose?.(word.id)}
            data-correct={correctId===word.id} data-wrong={wrongId===word.id}
            className={'cg4-choice vg-answer-card' + (isPainting ? ' cg4-choice--paint' : '')}
            aria-pressed={correctId===word.id}
            aria-label={isPainting?word.tr+' boyasını seç':word.id+' İngilizce renk adını seç'}>
            {isPainting && <span className="cg4-paint-swatch" style={{'--cg4-color':word.hex} as React.CSSProperties} aria-hidden="true"/>}
            <span className="cg4-choice-label">{isPainting ? word.tr : word.id.toUpperCase()}</span>
            {correctId===word.id && <span className="cg4-choice-check" aria-hidden="true">✓</span>}
          </button>)}
        </div>
      </>
    )}
    <div className="cg4-grassline" aria-hidden="true">✦ · ✿ · ✦ · ✿ · ✦</div>
  </section>;
}
