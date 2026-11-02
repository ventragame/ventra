'use client';

import React, { useEffect, useRef, memo } from 'react';
import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';
import { EventBus } from '@/lib/game/EventBus';

interface PhaserGameProps {
  wordGardenStatus: 'dormant' | 'blooming';
  wordGardenCompletedLevels?: number;
  wordGardenTotalLevels?: number;
  onOpenLearningPath: (regionId: string) => void;
  onToast: (msg: string) => void;
}

const PhaserGameComponent: React.FC<PhaserGameProps> = ({
  wordGardenStatus,
  wordGardenCompletedLevels = 0,
  wordGardenTotalLevels = 73,
  onOpenLearningPath,
  onToast
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const worldLockedRef = useRef(false);

  const callbacksRef = useRef({ onOpenLearningPath, onToast });
  callbacksRef.current = { onOpenLearningPath, onToast };

  useEffect(() => {
    let isCancelled = false;
    const applyFrameBudget = () => {
      const game=gameRef.current;
      if(!game)return;
      try {
        const sleeping=game.scene.isSleeping('WorldScene');
        const shouldSleep=worldLockedRef.current || document.hidden;
        if(shouldSleep && !sleeping)game.scene.sleep('WorldScene');
        else if(!shouldSleep && sleeping)game.scene.wake('WorldScene');
      } catch {
        // Scene may not have finished its initial Phaser preload.
      }
    };
    const onWorldLock=(locked:boolean)=>{
      worldLockedRef.current=Boolean(locked);
      applyFrameBudget();
    };
    EventBus.on('SET_WORLD_INPUT_LOCKED',onWorldLock);
    document.addEventListener('visibilitychange',applyFrameBudget);

    const timer = setTimeout(() => {
      if (isCancelled || !containerRef.current || gameRef.current) return;
      console.log('[PhaserGame] Initializing archipelago Phaser.Game instance...');

      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      // Phaser WebGL şeffaf kanvas yapılandırması (Gökyüzü CSS kompozitöründe kusursuz render edilir)
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: '100%',
        height: '100%',
        transparent: true,
        render: {
          powerPreference: 'high-performance',
          antialias: true,
          roundPixels: true,
          batchSize: 4096
        },
        fps: {
          target: 60,
          min: 30,
          smoothStep: true
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: [WorldScene]
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;

      if (typeof window !== 'undefined') {
        (window as any).Phaser = Phaser;
        (window as any).__VENTRA_PHASER_GAME__ = game;
        (window as any).__EVENT_BUS__ = EventBus;
      }

      game.scene.start('WorldScene', { wordGardenStatus, wordGardenCompletedLevels,wordGardenTotalLevels });
      applyFrameBudget();
    }, 16);

    const handleOpenPath = (regionId: string) => {
      callbacksRef.current.onOpenLearningPath(regionId);
    };

    const handleToast = (msg: string) => {
      callbacksRef.current.onToast(msg);
    };

    EventBus.on('OPEN_LEARNING_PATH', handleOpenPath);
    EventBus.on('SHOW_TOAST', handleToast);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      console.log('[PhaserGame] Cleaning up archipelago Phaser.Game instance...');
      EventBus.off('OPEN_LEARNING_PATH', handleOpenPath);
      EventBus.off('SHOW_TOAST', handleToast);
      EventBus.off('SET_WORLD_INPUT_LOCKED',onWorldLock);
      document.removeEventListener('visibilitychange',applyFrameBudget);

      if (gameRef.current) {
        if (typeof window !== 'undefined' && (window as any).__VENTRA_PHASER_GAME__ === gameRef.current) {
          delete (window as any).__VENTRA_PHASER_GAME__;
        }
        gameRef.current.destroy(true, false);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    EventBus.emit('UPDATE_REGION_STATE', wordGardenStatus);
  }, [wordGardenStatus]);

  useEffect(() => {
    if (typeof wordGardenCompletedLevels === 'number') {
      EventBus.emit('UPDATE_ISLAND_PROGRESS', {
        islandId: 'word_garden',
        completed: wordGardenCompletedLevels,
        total: wordGardenTotalLevels
      });
    }
  }, [wordGardenCompletedLevels,wordGardenTotalLevels]);

  return (
    <div
      ref={containerRef}
      id="phaser-game-container"
      className="w-full h-full relative overflow-hidden select-none"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        background: 'transparent' // CSS cinematic sky lives below this transparent Phaser canvas
      }}
    />
  );
};

export const PhaserGame = memo(PhaserGameComponent, (prev, next) => {
  return (
    prev.wordGardenStatus === next.wordGardenStatus &&
    prev.wordGardenCompletedLevels === next.wordGardenCompletedLevels &&
    prev.wordGardenTotalLevels === next.wordGardenTotalLevels
  );
});

export default PhaserGame;
