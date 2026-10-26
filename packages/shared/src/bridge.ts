/**
 * VENTRA — Godot 4 & Next.js İki Yönlü Köprü Protokolü
 * 
 * Güvenlik İlkeleri:
 * 1. Kaynak (window / iframe) doğrulaması
 * 2. Tanımlı mesaj tipleri dışındaki mesajların filtrelenmesi
 * 3. Tip güvenliği (Strict Type Safety)
 */

export const ALLOWED_BRIDGE_EVENT_TYPES = [
  'VENTRA_GAME_READY',
  'VENTRA_GAME_START',
  'VENTRA_GAME_COMPLETED',
  'VENTRA_GAME_PAUSE',
  'VENTRA_SYNC_STATE'
] as const;

export type BridgeEventType = typeof ALLOWED_BRIDGE_EVENT_TYPES[number];

// Godot -> Web Mesaj Tipleri
export interface GameReadyPayload {
  gameId: string;
  gameVersion: string;
  loadedAt: string;
}

export interface GameMetrics {
  durationSeconds: number;
  attemptsCount: number;
  accuracyRate: number; // 0.0 - 1.0
  wrongAttempts?: number;
  hintsUsed?: number;
}

export interface GameCompletedPayload {
  sessionId?: string;
  profileId?: string; // Phase 3.4: Oyuncu Profili UUID
  gameId: string;
  levelId: number;
  outcomeId: string;
  skillId?: string;
  score: number;
  success: boolean;
  starsEarned: number;
  metrics: GameMetrics;
  completedAt: string;
}

// Web -> Godot Mesaj Tipleri
export interface GameStartPayload {
  studentId: string;
  profileId?: string; // Phase 3.4: Oyuncu Profili UUID
  studentName: string;
  levelId: number;
  language: 'tr' | 'en';
}

export interface SyncStatePayload {
  starsBalance: number;
  unlockedLevels: number[];
}

// Birlik (Union) Olay Tanımları
export type VentraBridgeMessage =
  | { type: 'VENTRA_GAME_READY'; payload: GameReadyPayload }
  | { type: 'VENTRA_GAME_START'; payload: GameStartPayload }
  | { type: 'VENTRA_GAME_COMPLETED'; payload: GameCompletedPayload }
  | { type: 'VENTRA_GAME_PAUSE'; payload?: { reason: string } }
  | { type: 'VENTRA_SYNC_STATE'; payload: SyncStatePayload };

/**
 * Tarayıcı eklentileri (Loom, Grammarly vb.), IDE webview'ları (get-iframe-pos, iframe-click)
 * veya derleyici HMR mesajlarını filtreler. Bu mesajlar uygulamanın güvenlik açığı veya
 * köprü hatası olarak değerlendirilmemelidir.
 */
export function isIgnoredSystemMessage(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const msg = data as { type?: unknown };
  if (typeof msg.type === 'string') {
    const knownSystemTypes = [
      'get-iframe-pos',
      'iframe-click',
      'webpackInvalid',
      'webpackOk',
      'webpackWarnings',
      'webpackErrors',
      'react-devtools'
    ];
    if (knownSystemTypes.includes(msg.type) || msg.type.startsWith('webpack')) {
      return true;
    }
  }

  return false;
}

/**
 * Gelen mesajın geçerli ve tanımlı bir Ventra Bridge mesajı olup olmadığını doğrular.
 */
export function isValidVentraMessage(data: unknown): data is VentraBridgeMessage {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const msg = data as { type?: unknown; payload?: unknown };
  if (typeof msg.type !== 'string') {
    return false;
  }

  return (ALLOWED_BRIDGE_EVENT_TYPES as readonly string[]).includes(msg.type);
}


