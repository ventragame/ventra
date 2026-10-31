import Phaser from 'phaser';
import { EventBus } from '@/lib/game/EventBus';
import { soundService } from '@/lib/audio/SoundService';
import {
  ARCHIPELAGO_ISLANDS_CATALOG,
  ARCHIPELAGO_ISLANDS_ORDERED,
  type IslandId,
  type IslandDefinition
} from '@ventra/shared';

export interface WorldSceneConfig {
  wordGardenStatus: 'dormant' | 'blooming';
  wordGardenCompletedLevels?: number;
}

interface IslandEntity {
  id: IslandId;
  definition: IslandDefinition;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Image;
  mistBack: Phaser.GameObjects.Image;
  mistFront: Phaser.GameObjects.Image;
  hitZone: Phaser.GameObjects.Arc;
  badgeContainer?: Phaser.GameObjects.Container;
  plateBg?: Phaser.GameObjects.Graphics;
  progressFill?: Phaser.GameObjects.Graphics;
  progressText?: Phaser.GameObjects.Text;
  completedLevels: number;
  totalLevels: number;
  floatTween?: Phaser.Tweens.Tween;
  scaleTween?: Phaser.Tweens.Tween;
  worldX: number;
  worldY: number;
  baseScale: number;
  isHovered: boolean;
  isUnlocked: boolean;
  contentPublished: boolean;
}

interface ProgressionBubble {
  halo: Phaser.GameObjects.Arc;
  core: Phaser.GameObjects.Arc;
  x: number;
  y: number;
}

export class WorldScene extends Phaser.Scene {
  // Kompakt Sanal Dünya Boyutları (Merkezi Oval Takımada)
  private readonly WORLD_WIDTH = 2400;
  private readonly WORLD_HEIGHT = 1600;
  private readonly ISLAND_TARGET_DISPLAY_SIZE = 460; // Dengeli, net ada çapı

  // Görsel Katmanlar
  private backgroundClouds: Phaser.GameObjects.Image[] = [];
  private foregroundClouds: Phaser.GameObjects.Image[] = [];
  private islands: Map<IslandId, IslandEntity> = new Map();
  private progressionBubbles: ProgressionBubble[] = [];

  // Durumlar
  private wordGardenStatus: 'dormant' | 'blooming' = 'dormant';
  private wordGardenCompletedLevels: number = 0;
  private isTransitioning: boolean = false;
  private isOverviewMode: boolean = false;
  private isInputLocked: boolean = false;
  private activeFocusedIslandId: IslandId = 'word_garden';

  // Kamera Sürükleme / Pan Yönetimi
  private isPointerDown: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private cameraStartX: number = 0;
  private cameraStartY: number = 0;
  private hasDragged: boolean = false;
  private readonly dragThreshold: number = 6;

  // Çiçek / Canlanma Dekorasyonları
  private bloomDecorations: Phaser.GameObjects.Image[] = [];

  // Dinleyiciler
  private regionStateListener?: (data: any) => void;
  private islandProgressListener?: (data: { islandId: IslandId; completed: number; total: number }) => void;
  private focusIslandListener?: (islandId: IslandId) => void;
  private worldOverviewListener?: () => void;
  private inputLockListener?: (locked: boolean) => void;
  private canvasMouseLeaveListener?: () => void;
  private windowBlurListener?: () => void;

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: Partial<WorldSceneConfig>): void {
    if (data.wordGardenStatus) {
      this.wordGardenStatus = data.wordGardenStatus;
    }
    if (typeof data.wordGardenCompletedLevels === 'number') {
      this.wordGardenCompletedLevels = data.wordGardenCompletedLevels;
    }
    this.isTransitioning = false;
    this.isInputLocked = false;
  }

  preload(): void {
    const isMobile = this.isMobileDevice();

    // 1. Altı Bağımsız Ada WebP Asset'leri (Desktop / Mobile Varyantı)
    ARCHIPELAGO_ISLANDS_ORDERED.forEach((island) => {
      const assetPath = isMobile ? island.mobileAsset : island.desktopAsset;
      this.load.image(`island_${island.id}`, assetPath);
    });

    // 2. Ortam Efektleri & Çiçekler
    this.load.svg('cloud', '/assets/island/cloud.svg', { width: 280, height: 140 });
    this.load.svg('flower_bloom', '/assets/island/flower_bloom.svg', { width: 90, height: 90 });
  }

  create(): void {
    this.isTransitioning = false;

    // 1. Kamera Sınırlarını Kompakt Takımada Çevresine Ayarla
    this.cameras.main.setBounds(-200, -200, this.WORLD_WIDTH + 400, this.WORLD_HEIGHT + 400);

    // 2. Arka Plan Masalsı Bulutlar
    this.createAtmosphericClouds(true);

    // 3. Adalar Arası İlerleme Yolu (Dairesel Bézier Bağlantı Düğümleri)
    this.createProgressionPaths();

    // 4. Altı Bağımsız Adayı İnşa Et (Kompakt Dairesel/Oval Düzen)
    this.createAllIslands();

    // 5. Ön Plan Yumuşak Bulutlar
    this.createAtmosphericClouds(false);

    // 6. Kamera Pozisyonunu ve Auto-Fit Zoom Değerini Başlat (%100 Tarayıcı Zoom'unda Kusursuz Kadraj)
    if (typeof window !== 'undefined' && window.location.search.includes('overview=1')) {
      this.showWorldOverview(0);
    } else {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const focusParam = params.get('island') as IslandId;
        if (focusParam && this.islands.has(focusParam)) {
          this.activeFocusedIslandId = focusParam;
        }
      }
      this.fitCameraToViewport(0);
    }

    // 7. Kamera Sürükleme / Dokunmatik Pan & Wheel Kontrolleri
    this.setupCameraControls();

    // 8. EventBus ve Pencere Dinleyicilerini Bağla
    this.setupEventListeners();

    // 9. Resize Dinleyicisi
    this.scale.on('resize', this.handleResize, this);

    // 10. Sahne Kapanış Temizliği
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

    EventBus.emit('PHASER_READY');
  }

  // --- MOBİL CİHAZ TESPİTİ ---
  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 768 ||
      ('ontouchstart' in window && window.matchMedia('(pointer: coarse)').matches)
    );
  }

  // --- 1. ORTAM BULUTLARI (ATMOSPHERIC CLOUDS) ---
  private createAtmosphericClouds(isBackground: boolean): void {
    const cloudCount = isBackground ? 6 : 3;
    const depth = isBackground ? -10 : 35;
    const baseAlpha = isBackground ? 0.32 : 0.42;

    for (let i = 0; i < cloudCount; i++) {
      const startX = i * (this.WORLD_WIDTH / cloudCount) + 120;
      const startY = isBackground ? 180 + (i % 3) * 160 : 1050 + (i % 2) * 180;
      const scale = isBackground ? 0.75 + (i % 3) * 0.18 : 1.05 + (i % 2) * 0.2;

      const cloud = this.add
        .image(startX, startY, 'cloud')
        .setAlpha(baseAlpha)
        .setScale(scale)
        .setTint(0xffffff)
        .setDepth(depth)
        .setScrollFactor(isBackground ? 0.45 : 0.8);

      if (isBackground) {
        this.backgroundClouds.push(cloud);
      } else {
        this.foregroundClouds.push(cloud);
      }

      const duration = 50000 + i * 12000;
      this.tweens.add({
        targets: cloud,
        x: this.WORLD_WIDTH + 300,
        duration,
        ease: 'Linear',
        repeat: -1,
        onRepeat: () => {
          cloud.x = -300;
        }
      });
    }
  }

  // --- 2. ADALAR ARASI İLERLEME YOLU (CIRCULAR/OVAL PROGRESSION PATH) ---
  private createProgressionPaths(): void {
    // 6 Ada arasındaki 5 bağlantı eğrisi (Dairesel çember boyunca adaların içinden GEÇMEYEN kavisler)
    // 1: Word Garden (640, 530) -> 2: Listening Forest (1240, 430)
    // 2: Listening Forest (1240, 430) -> 3: Speaking Harbor (1800, 590)
    // 3: Speaking Harbor (1800, 590) -> 4: Sentence Workshop (1750, 1000)
    // 4: Sentence Workshop (1750, 1000) -> 5: Story Castle (1160, 1090)
    // 5: Story Castle (1160, 1090) -> 6: Language Academy (620, 930)
    const curveDefinitions = [
      {
        from: 'word_garden',
        p0: { x: 770, y: 495 },
        p1: { x: 1110, y: 440 },
        ctrl: { x: 940, y: 380 },
        isActive: true // 1 -> 2 rotası açık
      },
      {
        from: 'listening_forest',
        p0: { x: 1370, y: 465 },
        p1: { x: 1670, y: 550 },
        ctrl: { x: 1530, y: 425 },
        isActive: false
      },
      {
        from: 'speaking_harbor',
        p0: { x: 1810, y: 710 },
        p1: { x: 1780, y: 880 },
        ctrl: { x: 1910, y: 795 },
        isActive: false
      },
      {
        from: 'sentence_workshop',
        p0: { x: 1620, y: 1030 },
        p1: { x: 1290, y: 1080 },
        ctrl: { x: 1450, y: 1145 },
        isActive: false
      },
      {
        from: 'story_castle',
        p0: { x: 1030, y: 1060 },
        p1: { x: 740, y: 960 },
        ctrl: { x: 880, y: 1105 },
        isActive: false
      }
    ];

    curveDefinitions.forEach((curve, i) => {
      const nodeCount = 6;
      for (let step = 1; step <= nodeCount; step++) {
        const t = step / (nodeCount + 1);

        // Quadratic Bézier Formülü
        const bx = Math.round(
          (1 - t) * (1 - t) * curve.p0.x + 2 * (1 - t) * t * curve.ctrl.x + t * t * curve.p1.x
        );
        const by = Math.round(
          (1 - t) * (1 - t) * curve.p0.y + 2 * (1 - t) * t * curve.ctrl.y + t * t * curve.p1.y
        );

        const coreRadius = curve.isActive ? 4 + (step % 2) * 1.5 : 3.5;
        const haloRadius = coreRadius * 2.2;

        const haloColor = curve.isActive ? 0x38bdf8 : 0x94a3b8;
        const coreColor = curve.isActive ? 0xfef08a : 0xe2e8f0;
        const baseAlpha = curve.isActive ? 0.35 : 0.18;
        const coreAlpha = curve.isActive ? 0.85 : 0.45;

        // Dış Hale ve İç Çekirdek
        const halo = this.add.circle(bx, by, haloRadius, haloColor, baseAlpha).setDepth(12);
        const core = this.add.circle(bx, by, coreRadius, coreColor, coreAlpha).setDepth(13);

        this.progressionBubbles.push({ halo, core, x: bx, y: by });

        if (curve.isActive) {
          this.tweens.add({
            targets: halo,
            scale: 1.35,
            alpha: baseAlpha * 0.4,
            duration: 1800 + step * 220,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });

          this.tweens.add({
            targets: core,
            alpha: 1.0,
            duration: 1800 + step * 220,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }
    });
  }

  // --- 3. ALTI BAĞIMSIZ ADANIN İNŞASI & HOVER/SCALE MİMARİSİ ---
  private createAllIslands(): void {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    ARCHIPELAGO_ISLANDS_ORDERED.forEach((def) => {
      const worldX = def.defaultWorldPos.x;
      const worldY = def.defaultWorldPos.y;

      const container = this.add.container(worldX, worldY).setDepth(20);

      // Ada Altı Doğal Şelale Sisi / Bulut Halesi (Arka Katman)
      const mistColor = def.id === 'word_garden' ? 0xe0f2fe : 0xf1f5f9;
      const mistBack = this.add
        .image(-30, 195, 'cloud')
        .setAlpha(0.55)
        .setScale(0.85, 0.42)
        .setTint(mistColor);
      container.add(mistBack);

      // Ada Sprite'ı
      const sprite = this.add.image(0, 0, `island_${def.id}`).setOrigin(0.5, 0.5);

      // DEĞİŞMEZ TEMEL ÖLÇEK (IMMUTABLE BASE SCALE HESAPLAMASI)
      // Dokunun gerçek piksel boyutunu (1254px veya 768px) hedef ada çapına (460px) oranla
      const textureWidth = sprite.width || 1254;
      const baseScale = this.ISLAND_TARGET_DISPLAY_SIZE / textureWidth;
      sprite.setScale(baseScale);
      container.add(sprite);

      // Ada Altı Şelale Sisi (Ön Katman — Yumuşak buhar ve bulut geçişi)
      const mistFront = this.add
        .image(15, 205, 'cloud')
        .setAlpha(0.52)
        .setScale(0.95, 0.45)
        .setTint(0xffffff);
      container.add(mistFront);

      this.tweens.add({
        targets: [mistBack, mistFront],
        scaleX: '+=0.04',
        alpha: '+=0.06',
        duration: 2800 + def.order * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Kilitli ada için hafif gizem tonlaması
      if (!def.isUnlockedDefault) {
        sprite.setTint(0xd2d6dc);
      }

      // Dokunmatik / Fare Hit-Zone Dairesi
      const hitZone = this.add.circle(0, 0, def.hitRadius, 0x000000, 0.001);
      hitZone.setInteractive({ useHandCursor: true });
      container.add(hitZone);

      // Kelime Bahçesi çiçek dekorasyonu
      if (def.id === 'word_garden' && this.wordGardenStatus === 'blooming') {
        this.attachBloomingFlowers(container);
      }

      // Organik Salınım (Bobbing) Animasyonu — Container Y Pozisyonunu Salındırır (Scale Etkilenmez)
      let floatTween: Phaser.Tweens.Tween | undefined;
      if (!reducedMotion) {
        const floatPeriod = 5800 + def.order * 360;
        const floatOffset = def.order % 2 === 0 ? 5 : -5;
        floatTween = this.tweens.add({
          targets: container,
          y: worldY + floatOffset,
          duration: floatPeriod,
          delay: def.order * 280,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }

      // Dinamik Ada Seviye & İlerleme Kartı (Container Y: +175)
      const badgeContainer = this.add.container(0, 175);

      // Kart Arka Plan Plakası (Genişlik: 172, Yükseklik: 48)
      const plateBg = this.add.graphics();
      const borderColor = def.id === 'word_garden' ? 0x10b981 : def.isUnlockedDefault ? 0x38bdf8 : 0x475569;
      plateBg.fillStyle(0x030712, 0.90);
      plateBg.fillRoundedRect(-86, -24, 172, 48, 12);
      plateBg.lineStyle(1.5, borderColor, 0.85);
      plateBg.strokeRoundedRect(-86, -24, 172, 48, 12);
      badgeContainer.add(plateBg);

      // Ada Başlığı (Emoji + Ad)
      const titleText = this.add.text(0, -13, `${def.emoji} ${def.nameTr}`, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5, 0.5);
      badgeContainer.add(titleText);

      // İlerleme / Durum Metni (örn: "0/5 Seviye (%0)" veya "✓ Tamamlandı (%100)" veya "🔒 Kilitli")
      const progressText = this.add.text(0, -1, '', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '9.5px',
        fontStyle: 'bold',
        color: '#94a3b8',
        align: 'center'
      }).setOrigin(0.5, 0.5);
      badgeContainer.add(progressText);

      // İlerleme Barı Rayı (Track)
      const barTrack = this.add.graphics();
      barTrack.fillStyle(0x1e293b, 0.95);
      barTrack.fillRoundedRect(-70, 11, 140, 5, 2.5);
      badgeContainer.add(barTrack);

      // İlerleme Barı Dolgusu (Fill)
      const progressFill = this.add.graphics();
      badgeContainer.add(progressFill);

      container.add(badgeContainer);

      const initialCompleted = def.id === 'word_garden' ? this.wordGardenCompletedLevels : 0;

      const entity: IslandEntity = {
        id: def.id,
        definition: def,
        container,
        sprite,
        mistBack,
        mistFront,
        hitZone,
        badgeContainer,
        plateBg,
        progressFill,
        progressText,
        completedLevels: initialCompleted,
        totalLevels: 5,
        floatTween,
        worldX,
        worldY,
        baseScale,
        isHovered: false,
        isUnlocked: def.isUnlockedDefault,
        contentPublished: def.contentPublished
      };

      this.renderIslandBadgeProgress(entity);

      // KUSURSUZ HOVER ETKİLEŞİMİ (KESİNLİKLE BÜYÜME BİRİKMESİ YAPMAZ)
      hitZone.on('pointerover', () => {
        if (this.isInputLocked) return;
        this.setIslandHoverState(entity, true);
      });

      hitZone.on('pointerout', () => {
        if (this.isInputLocked) return;
        this.setIslandHoverState(entity, false);
      });

      // Tıklama / Dokunma
      hitZone.on('pointerup', () => {
        if (this.isInputLocked || this.hasDragged || this.isTransitioning) return;
        this.handleSelectIsland(def.id);
      });

      this.islands.set(def.id, entity);
    });
  }

  // --- 4. GÜVENLİ VE DETERMİNİSTİK HOVER YÖNETİMİ ---
  private setIslandHoverState(entity: IslandEntity, hovered: boolean): void {
    if (this.isInputLocked || this.isMobileDevice()) return; // Kilitliyken veya mobilde hover tetiklenmez
    if (this.hasDragged || this.isTransitioning) return;

    if (entity.isHovered === hovered) return;
    entity.isHovered = hovered;

    // Hedef üzerindeki mevcut scale tween'lerini anında ve temiz şekilde sonlandır
    if (entity.scaleTween) {
      entity.scaleTween.stop();
      this.tweens.remove(entity.scaleTween);
      entity.scaleTween = undefined;
    }
    this.tweens.killTweensOf(entity.sprite);

    // HEDEF ÖLÇEK HER ZAMAN baseScale * factor İLE MUTLAK OLARAK HESAPLANIR
    // Asla mevcut scale ile çarpılmaz; bu sayede birikme matematiksel olarak imkânsızdır!
    const targetScale = hovered ? entity.baseScale * 1.025 : entity.baseScale;

    if (hovered && entity.definition.isUnlockedDefault) {
      soundService.playSfx('tap', 0.2);
    }

    // Ada plakasında yumuşak sınır aydınlatması (Soft Glow)
    if (entity.plateBg) {
      const borderColor = hovered
        ? 0x38bdf8
        : entity.id === 'word_garden'
        ? 0x10b981
        : entity.isUnlocked
        ? 0x38bdf8
        : 0x475569;
      entity.plateBg.clear();
      entity.plateBg.fillStyle(0x030712, hovered ? 0.96 : 0.90);
      entity.plateBg.fillRoundedRect(-86, -24, 172, 48, 12);
      entity.plateBg.lineStyle(hovered ? 2 : 1.5, borderColor, hovered ? 1 : 0.85);
      entity.plateBg.strokeRoundedRect(-86, -24, 172, 48, 12);
    }

    entity.scaleTween = this.tweens.add({
      targets: entity.sprite,
      scale: targetScale,
      duration: 160,
      ease: 'Quad.easeOut',
      onComplete: () => {
        entity.scaleTween = undefined;
        // Animasyon bitiminde mutlak hedef scale değerini güvenceye al
        entity.sprite.setScale(targetScale);
      }
    });
  }

  // --- 4.1. ADA SEVİYE & İLERLEME PLAKASI ÇİZİMİ ---
  private renderIslandBadgeProgress(entity: IslandEntity): void {
    if (!entity.progressFill || !entity.progressText) return;

    // Yayımlanmış içeriği bulunmayan adalar için sahte 0/5 gösterilmez
    if (!entity.contentPublished) {
      if (!entity.isUnlocked) {
        entity.progressText.setText('🔒 Kilitli • Pek Yakında');
        entity.progressText.setColor('#94a3b8');
      } else {
        entity.progressText.setText('✨ Keşfedildi • Pek Yakında');
        entity.progressText.setColor('#38bdf8');
      }
      entity.progressFill.clear();
      return;
    }

    const completed = entity.completedLevels;
    const total = entity.totalLevels || 5;
    const percent = Math.round((completed / total) * 100);
    const isCompleted = completed >= total && total > 0;

    // Metin ve renk güncelle
    if (isCompleted) {
      entity.progressText.setText(`✓ ${completed}/${total} Tamamlandı (%100)`);
      entity.progressText.setColor('#34d399');
    } else {
      entity.progressText.setText(`${completed}/${total} Seviye (%${percent})`);
      entity.progressText.setColor('#38bdf8');
    }

    // Dolgu grafiğini yeniden çiz
    entity.progressFill.clear();
    if (completed > 0) {
      const fillWidth = Math.max(6, Math.round(140 * (completed / total)));
      const fillColor = isCompleted ? 0x34d399 : 0x10b981;
      entity.progressFill.fillStyle(fillColor, 1);
      entity.progressFill.fillRoundedRect(-70, 11, fillWidth, 5, 2.5);
    }
  }

  // DIŞARIDAN VEYA EVENTLERLE DİNAMİK SEVİYE VE İLERLEME GÜNCELLEME
  public updateIslandProgress(
    islandId: IslandId,
    completed: number,
    total: number = 5
  ): void {
    const entity = this.islands.get(islandId);
    if (!entity) return;

    entity.completedLevels = Phaser.Math.Clamp(completed, 0, total);
    entity.totalLevels = total;
    if (islandId === 'word_garden') {
      this.wordGardenCompletedLevels = entity.completedLevels;
    }

    this.renderIslandBadgeProgress(entity);
  }

  // TÜM DÜNYA GİRİŞİNİ GÜVENLİ ŞEKİLDE KİLİTLEME / AÇMA (ÖĞRENME ETKİNLİĞİ & MODALLAR İÇİN)
  public setInputLocked(locked: boolean): void {
    this.isInputLocked = locked;
    this.isPointerDown = false;
    this.hasDragged = false;
    this.resetAllHoverStates();

    if (this.input) {
      this.input.enabled = !locked;
    }
  }

  // TÜM ADALARIN HOVER VE ÖLÇEKLERİNİ SIFIRLAYAN GÜVENLİK YARDIMCISI
  public resetAllHoverStates(): void {
    this.islands.forEach((entity) => {
      entity.isHovered = false;
      if (entity.scaleTween) {
        entity.scaleTween.stop();
        this.tweens.remove(entity.scaleTween);
        entity.scaleTween = undefined;
      }
      this.tweens.killTweensOf(entity.sprite);
      entity.sprite.setScale(entity.baseScale);
    });
  }

  // --- 5. ADA SEÇİMİ VE KAMERA ODAKLANMASI ---
  public handleSelectIsland(islandId: IslandId): void {
    if (this.isInputLocked) return;
    const entity = this.islands.get(islandId);
    if (!entity) return;

    this.activeFocusedIslandId = islandId;

    // Hover durumunu anında sıfırla (seçim sonrasında hiçbir ada takılı kalmaz)
    this.resetAllHoverStates();

    // React HUD tarafını güncelle
    EventBus.emit('SELECT_ISLAND', islandId);

    // 1. Kilitli Ada: Yumuşak micro-pulse ve bilgilendirme toast'ı
    if (!entity.isUnlocked) {
      soundService.playSfx('gentle_retry', 0.4);

      // Nazik micro-pulse
      this.tweens.killTweensOf(entity.sprite);
      this.tweens.add({
        targets: entity.sprite,
        scale: entity.baseScale * 1.018,
        duration: 90,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          entity.sprite.setScale(entity.baseScale);
        }
      });

      this.focusCameraOnIsland(islandId, 500);

      const notice =
        entity.definition.unlockRequirementNotice ||
        `🔒 ${entity.definition.nameTr} kilitli!`;
      EventBus.emit('SHOW_TOAST', `🔒 ${entity.definition.nameTr}: ${notice}`);
      return;
    }

    // 2. Kilidi Açık Ancak İçeriği Henüz Yayımlanmamış Ada
    if (!entity.contentPublished) {
      soundService.playSfx('tap', 0.5);

      this.tweens.killTweensOf(entity.sprite);
      this.tweens.add({
        targets: entity.sprite,
        scale: entity.baseScale * 1.02,
        duration: 100,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          entity.sprite.setScale(entity.baseScale);
        }
      });

      this.focusCameraOnIsland(islandId, 500);

      EventBus.emit(
        'SHOW_TOAST',
        `✨ ${entity.definition.nameTr} açıldı! Maceralar çok yakında eklenecektir.`
      );
      return;
    }

    // 3. Kilidi Açık ve İçeriği Yayımlanmış Ada (Kelime Bahçesi)
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    soundService.playSfx('whoosh', 0.8);

    // Kamerayı yumuşakça adaya yaklaştır (Aşırı zoom yok: 1.05)
    this.cameras.main.pan(entity.worldX, entity.worldY, 480, 'Cubic.easeInOut');
    this.cameras.main.zoomTo(1.05, 480, 'Cubic.easeInOut');

    this.time.delayedCall(420, () => {
      EventBus.emit('OPEN_LEARNING_PATH', islandId);
      this.time.delayedCall(500, () => {
        if (this.cameras?.main) {
          this.fitCameraToViewport(400);
        }
        this.isTransitioning = false;
      });
    });
  }

  // --- 6. KAMERA ODAKLAMA YARDIMCISI ---
  private focusCameraOnIsland(islandId: IslandId, duration = 500): void {
    const entity = this.islands.get(islandId);
    if (!entity) return;

    this.isOverviewMode = false;
    this.cameras.main.useBounds = true;

    const { width, height } = this.scale;
    const isPortrait = height > width;

    const targetX = entity.worldX;
    const targetY = isPortrait ? entity.worldY + 20 : entity.worldY;
    const targetZoom = isPortrait ? Math.min(width / 520, 0.72) : Math.min(width / 1300, 1.05);

    this.cameras.main.pan(targetX, targetY, duration, 'Cubic.easeInOut');
    this.cameras.main.zoomTo(targetZoom, duration, 'Cubic.easeInOut');
  }

  // --- 7. BİRLEŞİK TAKIMADA SINIRLARI (COMBINED ISLAND BOUNDS HESAPLAMASI) ---
  public getCombinedIslandsBounds(): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  } {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    this.islands.forEach((entity) => {
      const r = this.ISLAND_TARGET_DISPLAY_SIZE / 2; // 230px
      minX = Math.min(minX, entity.worldX - r);
      maxX = Math.max(maxX, entity.worldX + r);
      minY = Math.min(minY, entity.worldY - r);
      maxY = Math.max(maxY, entity.worldY + r);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    return {
      minX,
      maxX,
      minY,
      maxY,
      width,
      height,
      centerX: minX + width / 2,
      centerY: minY + height / 2
    };
  }

  // --- 8. DUYARLI VE AUTO-FIT KAMERA BOYUTLANDIRMA ---
  // Masaüstünde (%100 Tarayıcı Zoom'unda) 6 Adanın Tamamını Kusursuz Şekilde Kadraja Sığdırır
  public fitCameraToViewport(duration = 0): void {
    const { width, height } = this.scale;
    const isPortrait = height > width;

    if (isPortrait) {
      // Mobilde aktif adaya konforlu zoom ile odaklan
      const targetEntity =
        this.islands.get(this.activeFocusedIslandId) || this.islands.get('word_garden');
      const targetCenterX = targetEntity ? targetEntity.worldX : 640;
      const targetCenterY = targetEntity ? targetEntity.worldY + 20 : 550;
      const targetZoom = Math.min(width / 520, 0.72);

      if (duration > 0) {
        this.cameras.main.pan(targetCenterX, targetCenterY, duration, 'Cubic.easeOut');
        this.cameras.main.zoomTo(targetZoom, duration, 'Cubic.easeOut');
      } else {
        this.cameras.main.centerOn(targetCenterX, targetCenterY);
        this.cameras.main.setZoom(targetZoom);
      }
      return;
    }

    // MASAÜSTÜ AUTO-FIT (1280x800, 1440x900, 1920x1080)
    // 6 Adanın birleşik sınırlarını gerçek sprite ölçüleri üzerinden al
    const bounds = this.getCombinedIslandsBounds();

    // Üst Header (~70px) ve Alt Gezinme/Detay Kartı (~130px) Güvenli Alanlarını Düş
    const availableWidth = Math.max(width - 160, 400); // 80px sağ/sol kenar boşluğu
    const availableHeight = Math.max(height - 230, 300); // 70px üst, 130px alt, 30px marj

    const zoomX = availableWidth / bounds.width;
    const zoomY = availableHeight / bounds.height;
    const fitZoom = Phaser.Math.Clamp(Math.min(zoomX, zoomY), 0.45, 1.15);

    // Dikeyde Header ile Alt Kart arasındaki görsel optik merkezi hizala
    const opticalCenterY = bounds.centerY - 30 / fitZoom;
    const targetCenterX = bounds.centerX;

    if (duration > 0) {
      this.cameras.main.pan(targetCenterX, opticalCenterY, duration, 'Cubic.easeOut');
      this.cameras.main.zoomTo(fitZoom, duration, 'Cubic.easeOut');
    } else {
      this.cameras.main.centerOn(targetCenterX, opticalCenterY);
      this.cameras.main.setZoom(fitZoom);
    }
  }

  // --- 9. TÜM TAKIMADA GENEL HARİTA GÖRÜNÜMÜ (OVERVIEW / PANORAMA) ---
  public showWorldOverview(duration = 600): void {
    this.isOverviewMode = true;
    this.cameras.main.useBounds = false;
    this.fitCameraToViewport(duration);
  }

  private handleResize(): void {
    if (this.isOverviewMode) {
      this.showWorldOverview(0);
    } else {
      this.fitCameraToViewport(0);
    }
  }

  // --- 10. KAMERA SÜRÜKLEME / PAN / WHEEL KONTROLLERİ ---
  private setupCameraControls(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isInputLocked) return;
      this.isPointerDown = true;
      this.hasDragged = false;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.cameraStartX = this.cameras.main.scrollX;
      this.cameraStartY = this.cameras.main.scrollY;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isInputLocked || !this.isPointerDown || !pointer.isDown) return;

      const deltaX = pointer.x - this.dragStartX;
      const deltaY = pointer.y - this.dragStartY;

      if (Math.abs(deltaX) > this.dragThreshold || Math.abs(deltaY) > this.dragThreshold) {
        this.hasDragged = true;
        this.isOverviewMode = false;
        this.cameras.main.useBounds = true;
        this.resetAllHoverStates(); // Sürükleme anında asılı hover'ları sıfırla
      }

      const zoom = this.cameras.main.zoom;
      this.cameras.main.scrollX = this.cameraStartX - deltaX / zoom;
      this.cameras.main.scrollY = this.cameraStartY - deltaY / zoom;
    });

    this.input.on('pointerup', () => {
      this.isPointerDown = false;
      this.time.delayedCall(50, () => {
        this.hasDragged = false;
      });
    });

    // Kontrollü Fare Tekerleği (Wheel Zoom)
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      if (this.isInputLocked) return;
      this.isOverviewMode = false;
      const currentZoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(currentZoom - deltaY * 0.0008, 0.42, 1.35);
      this.cameras.main.setZoom(newZoom);
    });
  }

  // --- 11. ÇİÇEK CANLANMA EFEKTİ ---
  private attachBloomingFlowers(container: Phaser.GameObjects.Container): void {
    const offsets = [
      { x: -90, y: -30 },
      { x: 85, y: -25 },
      { x: -50, y: 55 },
      { x: 65, y: 60 }
    ];

    offsets.forEach((pos, idx) => {
      const flower = this.add
        .image(pos.x, pos.y, 'flower_bloom')
        .setScale(0.48 + (idx % 2) * 0.08)
        .setDepth(30);

      this.tweens.add({
        targets: flower,
        angle: idx % 2 === 0 ? 12 : -12,
        scaleY: flower.scaleY * 1.1,
        duration: 1600 + idx * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      container.add(flower);
      this.bloomDecorations.push(flower);
    });
  }

  // --- 12. EVENT DİNLEYİCİLERİ ---
  private setupEventListeners(): void {
    this.regionStateListener = (data: any) => {
      const status = typeof data === 'string' ? data : data?.status;
      if (status) {
        this.wordGardenStatus = status;
        const wg = this.islands.get('word_garden');
        if (wg && status === 'blooming') {
          if (this.bloomDecorations.length === 0) {
            this.attachBloomingFlowers(wg.container);
          }
          this.updateIslandProgress('word_garden', 5, 5);
        }
      }
    };
    EventBus.on('UPDATE_REGION_STATE', this.regionStateListener);

    this.islandProgressListener = (data: { islandId: IslandId; completed: number; total: number }) => {
      if (data && data.islandId) {
        this.updateIslandProgress(data.islandId, data.completed, data.total);
      }
    };
    EventBus.on('UPDATE_ISLAND_PROGRESS', this.islandProgressListener);

    this.focusIslandListener = (islandId: IslandId) => {
      this.activeFocusedIslandId = islandId;
      this.focusCameraOnIsland(islandId, 550);
    };
    EventBus.on('FOCUS_ISLAND', this.focusIslandListener);

    this.worldOverviewListener = () => {
      this.showWorldOverview(600);
    };
    EventBus.on('ZOOM_WORLD_OVERVIEW', this.worldOverviewListener);

    // Etkileşim kilidi dinleyicisi (Öğrenme modalı/etkinliği açıkken)
    this.inputLockListener = (locked: boolean) => {
      this.setInputLocked(locked);
    };
    EventBus.on('SET_WORLD_INPUT_LOCKED', this.inputLockListener);

    // Modal açıldığında veya pencere dışına çıkıldığında hover'ları sıfırla
    if (typeof window !== 'undefined') {
      this.windowBlurListener = () => {
        this.resetAllHoverStates();
      };
      window.addEventListener('blur', this.windowBlurListener);

      const canvas = this.game.canvas;
      if (canvas) {
        this.canvasMouseLeaveListener = () => {
          this.resetAllHoverStates();
        };
        canvas.addEventListener('mouseleave', this.canvasMouseLeaveListener);
      }
    }
  }

  // --- 13. TEMİZLİK VE BELLEK SIZINTISI ÖNLEME ---
  private cleanup(): void {
    if (this.regionStateListener) {
      EventBus.off('UPDATE_REGION_STATE', this.regionStateListener);
      this.regionStateListener = undefined;
    }
    if (this.islandProgressListener) {
      EventBus.off('UPDATE_ISLAND_PROGRESS', this.islandProgressListener);
      this.islandProgressListener = undefined;
    }
    if (this.focusIslandListener) {
      EventBus.off('FOCUS_ISLAND', this.focusIslandListener);
      this.focusIslandListener = undefined;
    }
    if (this.worldOverviewListener) {
      EventBus.off('ZOOM_WORLD_OVERVIEW', this.worldOverviewListener);
      this.worldOverviewListener = undefined;
    }
    if (this.inputLockListener) {
      EventBus.off('SET_WORLD_INPUT_LOCKED', this.inputLockListener);
      this.inputLockListener = undefined;
    }

    if (typeof window !== 'undefined') {
      if (this.windowBlurListener) {
        window.removeEventListener('blur', this.windowBlurListener);
        this.windowBlurListener = undefined;
      }
      if (this.canvasMouseLeaveListener && this.game.canvas) {
        this.game.canvas.removeEventListener('mouseleave', this.canvasMouseLeaveListener);
        this.canvasMouseLeaveListener = undefined;
      }
    }

    this.scale.off('resize', this.handleResize, this);
    this.tweens.killAll();

    this.bloomDecorations.forEach((d) => d.destroy());
    this.bloomDecorations = [];
    this.backgroundClouds = [];
    this.foregroundClouds = [];
    this.progressionBubbles.forEach((b) => {
      b.halo.destroy();
      b.core.destroy();
    });
    this.progressionBubbles = [];
    this.islands.clear();
  }
}
