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

