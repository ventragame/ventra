/**
 * VENTRA — React ve Phaser Arası Çift Yönlü İletişim Olay Veri Yolu (EventBus)
 */

type EventCallback = (...args: any[]) => void;

class VentraEventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(callback);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach((cb) => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`[EventBus] Hata (${event}):`, e);
        }
      });
    }
  }

  clear(): void {
    this.events.clear();
  }
}

export const EventBus = new VentraEventBus();

/**
 * Latest archipelago input lock (an island, game or modal is open). The lock
 * used to exist only as an event, so a world scene that (re)started after it
 * was sent (the hub remounts the Phaser game shortly after a child enters, and
 * a ?open= link opens an island before the scene exists) began unlocked under
 * the open island: a click inside the game also reached the island drawn
 * underneath and opened it. Scenes and the frame budget read this value.
 */
let worldInputLocked = false;

export function setWorldInputLocked(locked: boolean): void {
  worldInputLocked = locked;
  EventBus.emit('SET_WORLD_INPUT_LOCKED', locked);
}

export function isWorldInputLocked(): boolean {
  return worldInputLocked;
}

