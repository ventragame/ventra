import Phaser from 'phaser';
import { EventBus } from '@/lib/game/EventBus';
import { soundService } from '@/lib/audio/SoundService';
import {archipelagoBadgeAnchor,archipelagoOpticalShiftPixels,archipelagoCameraFraming} from '@/lib/game/archipelagoPresentation';
import {
  ARCHIPELAGO_ISLANDS_CATALOG,
  ARCHIPELAGO_ISLANDS_ORDERED,
  type IslandId,
  type IslandDefinition
} from '@ventra/shared';

export interface WorldSceneConfig {
  wordGardenStatus: 'dormant' | 'blooming';
  wordGardenCompletedLevels?: number;
  wordGardenTotalLevels?: number;
  plazaCompletedLevels?: number;
  forestCompletedLevels?: number;
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
  badgeHit?: Phaser.GameObjects.Zone;
  focusHalo?: Phaser.GameObjects.Ellipse;
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
  core: Phaser.GameObjects.Rectangle;
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
  private routeDecorations: Array<Phaser.GameObjects.Graphics | Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle> = [];

  // Durumlar
  private wordGardenStatus: 'dormant' | 'blooming' = 'dormant';
  private wordGardenCompletedLevels: number = 0;
  private wordGardenTotalLevels: number = 73;
  private plazaCompletedLevels:number=0;
  private forestCompletedLevels:number=0;
  private isTransitioning: boolean = false;
  private isOverviewMode: boolean = false;
  private isDesktopFocused: boolean = false;
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
    if(typeof data.wordGardenTotalLevels==='number'&&data.wordGardenTotalLevels>0) this.wordGardenTotalLevels=data.wordGardenTotalLevels;
    if(typeof data.plazaCompletedLevels==='number')this.plazaCompletedLevels=data.plazaCompletedLevels;
    if(typeof data.forestCompletedLevels==='number')this.forestCompletedLevels=data.forestCompletedLevels;
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

    // Multi-depth atmosphere is decorative and never intercepts island input.
    this.createSkyDetails();

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

  private isReducedMotion():boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** Low-overdraw light shafts and distant motes; no external textures or GPU-heavy filters. */
  private createSkyDetails():void {
    const lowPower=this.isMobileDevice();
    const reduced=this.isReducedMotion();
    const rays=this.add.graphics().setDepth(-21).setScrollFactor(0.76);
    const sun={x:350,y:45};
    for(let i=0;i<5;i++){
      const offset=-280+i*144;
      rays.fillStyle(0xfff9d8,0.014+(i%2)*0.009);
      rays.fillTriangle(sun.x,sun.y,sun.x+offset-85,1620,sun.x+offset+105,1620);
    }
    const haze=this.add.graphics().setDepth(-19).setScrollFactor(0.8);
    for(let i=0;i<5;i++){
      const x=340+(i%3)*720,y=275+(i%2)*540;
      haze.fillStyle(0xf3faff,0.025);
      haze.fillEllipse(x,y,780,255);
    }
    const count=lowPower?12:28;
    for(let i=0;i<count;i++){
      const x=95+((i*179+47)%2150), y=90+((i*263+101)%1390);
      const radius=(i%5===0?4:2)+(i%3)*0.4;
      const sparkle=this.add.circle(x,y,radius,i%4===0?0xffebae:0xf1ffff,i%4===0?0.46:0.31)
        .setDepth(-8).setScrollFactor(0.92);
      if(!reduced&&i%4===0){
        this.tweens.add({targets:sparkle,alpha:0.08,scale:1.65,duration:2400+i*115,
          yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
      }
    }
  }

  // --- 1. ORTAM BULUTLARI (ATMOSPHERIC CLOUDS) ---
  private createAtmosphericClouds(isBackground: boolean): void {
    const cloudCount = this.isMobileDevice() ? (isBackground?4:2) : (isBackground?8:4);
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

      const duration = 62000 + i * 13000;
      if(this.isReducedMotion())continue;
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

  // --- 2. ALTI ADAYI BİRLEŞTİREN MASAL KÖPRÜLERİ ---
  private createProgressionPaths(): void {
    // Draw actual, legible skybridges rather than making only the first route
    // bright. All six islands form a continuous, storybook ring; locked worlds
    // retain their bridges, without suggesting their activities are playable.
    // Bridge ends sit behind island silhouettes (islands depth=20), so no rails
    // run across the art or intercept a child's click.
    const curveDefinitions = [
      {from: 'word_garden',to:'story_castle',p0:{x:770,y:495},  p1:{x:1110,y:440},ctrl:{x:940,y:359},isActive:true},
      {from: 'story_castle',to:'listening_forest',p0:{x:1370,y:465},p1:{x:1670,y:550},ctrl:{x:1535,y:419},isActive:true},
      {from: 'listening_forest',to:'speaking_harbor',p0:{x:1810,y:710},p1:{x:1780,y:880},ctrl:{x:1942,y:795},isActive:false},
      {from: 'speaking_harbor',to:'sentence_workshop',p0:{x:1620,y:1030},p1:{x:1290,y:1080},ctrl:{x:1450,y:1160},isActive:false},
      {from: 'sentence_workshop',to:'discovery_academy',p0:{x:1030,y:1060},p1:{x:740,y:960},ctrl:{x:882,y:1115},isActive:false},
      {from: 'discovery_academy',to:'word_garden',p0:{x:608,y:895},p1:{x:610,y:690},ctrl:{x:468,y:792},isActive:false}
    ] as const;
    const reduced=this.isReducedMotion();
    curveDefinitions.forEach((curve,routeIndex)=>{
      const at=(t:number)=>({
        x:(1-t)*(1-t)*curve.p0.x+2*(1-t)*t*curve.ctrl.x+t*t*curve.p1.x,
        y:(1-t)*(1-t)*curve.p0.y+2*(1-t)*t*curve.ctrl.y+t*t*curve.p1.y
      });
      const normal=(t:number)=>{
        const dx=2*(1-t)*(curve.ctrl.x-curve.p0.x)+2*t*(curve.p1.x-curve.ctrl.x);
        const dy=2*(1-t)*(curve.ctrl.y-curve.p0.y)+2*t*(curve.p1.y-curve.ctrl.y);
        const length=Math.max(1,Math.hypot(dx,dy));
        return {x:-dy/length,y:dx/length};
      };
      const gold=curve.isActive;
      const boards=gold?0xedd195:0xadd8d9;
      const rails=gold?0xffe7a2:0xc2eff2;
      const ribbon=this.add.graphics().setDepth(10);
      this.routeDecorations.push(ribbon);
      // Each sampled deck is edged by independent rails, fine wooden planks,
      // and a soft sky-lit underside. The same geometry works for vertical bridges.
      const steps=62;
      for(let k=0;k<steps;k++){
        const t=k/steps,u=(k+1)/steps;
        const a=at(t),b=at(u),na=normal(t),nb=normal(u);
        ribbon.lineStyle(43,0x336b86,0.14);
        ribbon.lineBetween(a.x,a.y+8,b.x,b.y+8);
        ribbon.lineStyle(32,gold?0xdba954:0x689ca8,0.58);
        ribbon.lineBetween(a.x,a.y,b.x,b.y);
        ribbon.lineStyle(25,boards,gold?0.96:0.88);
        ribbon.lineBetween(a.x,a.y,b.x,b.y);
        ribbon.lineStyle(4,rails,0.96);
        for(const side of [-1,1]){
          ribbon.lineBetween(a.x+na.x*15*side,a.y+na.y*15*side,
            b.x+nb.x*15*side,b.y+nb.y*15*side);
        }
      }
      // Rhythmic cross-planks create unmistakable bridge perspective at .5 zoom.
      for(let i=1;i<28;i++){
        const t=i/28,p=at(t),n=normal(t);
        ribbon.lineStyle(2.4,gold?0x946f52:0x638c92,0.72);
        ribbon.lineBetween(p.x-n.x*11,p.y-n.y*11,p.x+n.x*11,p.y+n.y*11);
      }
      // Lamplight and ornamental golden posts are purely decorative.
      for(const t of [0.13,0.36,0.64,0.87]){
        const p=at(t),n=normal(t);
        for(const side of [-1,1]){
          const x=p.x+n.x*15*side,y=p.y+n.y*15*side;
          const post=this.add.rectangle(x,y,5,15,gold?0xc48b51:0x81b9b3,0.96).setDepth(11);
          const light=this.add.circle(x,y-9,5.6,gold?0xffe9a7:0xe1fcf3,0.94).setDepth(12);
          const halo=this.add.circle(x,y-9,12,gold?0xffd57e:0x91e7fa,0.16).setDepth(11);
          this.routeDecorations.push(post,light,halo);
          if(!reduced&&!this.isMobileDevice()&&side===1)this.tweens.add({
            targets:halo,alpha:0.06,scale:1.4,duration:1800+routeIndex*115,
            yoyo:true,repeat:-1,ease:'Sine.easeInOut'
          });
        }
      }
      // Tiny traveling fireflies connect the whole ring. Reduced-motion is static.
      for(let i=0;i<7;i++){
        const t=(i+0.5)/7,p=at(t),bright=i%3===0;
        const halo=this.add.circle(p.x,p.y,bright?7:4,0xffefd5,0.21).setDepth(13);
        const core=this.add.rectangle(p.x,p.y,bright?5:3.5,bright?5:3.5,
          gold?0xffecb4:0xecffff,0.9).setAngle(45).setDepth(14);
        this.progressionBubbles.push({halo,core,x:p.x,y:p.y});
        this.routeDecorations.push(halo,core);
        if(!reduced&&!this.isMobileDevice())this.tweens.add({
          targets:halo,alpha:0.06,scale:1.5,duration:2200+i*130,
          yoyo:true,repeat:-1,ease:'Sine.easeInOut'
        });
      }
      if(!reduced&&!this.isMobileDevice()){
        const glint=this.add.circle(curve.p0.x,curve.p0.y,4.5,0xffffff,0.88).setDepth(14);
        this.routeDecorations.push(glint);
        this.tweens.addCounter({from:0,to:1,duration:6000+routeIndex*250,
          delay:routeIndex*180,repeat:-1,
          onUpdate:(tween)=>{const p=at(tween.getValue()??0);glint.setPosition(p.x,p.y);}
        });
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
      const focusHalo=this.add.ellipse(0,38,460,320,def.id==='word_garden'?0xfff0b4:0xd8eafb,
        def.id==='word_garden'?0.14:0.055);
      const haloStroke=this.add.ellipse(0,38,470,330,0xffffff,0)
        .setStrokeStyle(def.id==='word_garden'?3:2,def.id==='word_garden'?0xffefb7:0xaeddec,
          def.id==='word_garden'?0.38:0.14);
      container.add([focusHalo,haloStroke]);

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

      if(!reducedMotion)this.tweens.add({
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
      const badgeAnchor=archipelagoBadgeAnchor(def.id,this.scale.height>this.scale.width);
      const badgeContainer = this.add.container(badgeAnchor.x,badgeAnchor.y);

      // Large illustrated nameplate: legible even after auto-fit camera zoom.
      const plateBg = this.add.graphics();
      const borderColor=def.contentPublished?0xf3d898:0xb7cee3;
      plateBg.fillStyle(def.contentPublished?0x103950:0x152f46,0.96);
      plateBg.fillRoundedRect(-127,-43,254,94,17);
      plateBg.lineStyle(def.contentPublished?3:2,borderColor,def.contentPublished?0.95:0.67);
      plateBg.strokeRoundedRect(-127,-43,254,94,17);
      plateBg.lineStyle(1,0xffffff,0.14);
      plateBg.strokeRoundedRect(-122,-38,244,84,14);
      badgeContainer.add(plateBg);

      // Ada Başlığı (Emoji + Ad)
      const titleText = this.add.text(0, -19, `${def.emoji}  ${def.nameTr}`, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5, 0.5);
      badgeContainer.add(titleText);

      // İlerleme / Durum Metni (örn: "0/5 Seviye (%0)" veya "✓ Tamamlandı (%100)" veya "🔒 Kilitli")
      const progressText = this.add.text(0, 10, '', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#94a3b8',
        align: 'center'
      }).setOrigin(0.5, 0.5);
      badgeContainer.add(progressText);

      // İlerleme Barı Rayı (Track)
      const barTrack = this.add.graphics();
      barTrack.fillStyle(0x1e293b, 0.95);
      barTrack.fillRoundedRect(-99, 32, 198, 7, 3.5);
      badgeContainer.add(barTrack);

      // İlerleme Barı Dolgusu (Fill)
      const progressFill = this.add.graphics();
      badgeContainer.add(progressFill);
      // Make the illustrated label a touch/click target too; not only the island sprite.
      const badgeHit=this.add.zone(0,4,254,94).setInteractive({useHandCursor:true});
      badgeContainer.add(badgeHit);
      badgeHit.on('pointerup',()=>{
        if(this.isInputLocked||this.hasDragged||this.isTransitioning)return;
        this.handleSelectIsland(def.id);
      });
      badgeHit.on('pointerover',()=>this.setIslandHoverState(entity,true));
      badgeHit.on('pointerout',()=>this.setIslandHoverState(entity,false));

      container.add(badgeContainer);

      const initialCompleted = def.id==='word_garden'?this.wordGardenCompletedLevels:def.id==='story_castle'?this.plazaCompletedLevels:def.id==='listening_forest'?this.forestCompletedLevels:0;

      const entity: IslandEntity = {
        id: def.id,
        definition: def,
        container,
        sprite,
        mistBack,
        mistFront,
        hitZone,
        badgeContainer,
        badgeHit,
        focusHalo,
        plateBg,
        progressFill,
        progressText,
        completedLevels: initialCompleted,
        totalLevels: def.id==='word_garden'?this.wordGardenTotalLevels:def.id==='story_castle'?6:def.id==='listening_forest'?18:5,
        floatTween,
        worldX,
        worldY,
        baseScale,
        isHovered: false,
        isUnlocked: def.isUnlockedDefault,
        contentPublished: def.contentPublished
      };

      this.renderIslandBadgeProgress(entity);
      if((def.id==='word_garden'||def.id==='story_castle')&&!reducedMotion){
        this.tweens.add({targets:focusHalo,alpha:0.21,scaleX:1.045,scaleY:1.06,
          duration:3500,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
      }

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
    // Large nameplates are contextual tooltips, not permanently stacked on artwork.
    const showBadge = hovered && !this.isCompactViewport() && !this.isDesktopFocused;
    entity.badgeContainer?.setVisible(showBadge);
    if (entity.badgeHit?.input) entity.badgeHit.input.enabled = showBadge && !this.isInputLocked;

    // Hedef üzerindeki mevcut scale tween'lerini anında ve temiz şekilde sonlandır
    if (entity.scaleTween) {
      entity.scaleTween.stop();
      this.tweens.remove(entity.scaleTween);
      entity.scaleTween = undefined;
    }
    this.tweens.killTweensOf(entity.sprite);

    // HEDEF ÖLÇEK HER ZAMAN baseScale * factor İLE MUTLAK OLARAK HESAPLANIR
    // Asla mevcut scale ile çarpılmaz; bu sayede birikme matematiksel olarak imkânsızdır!
    const targetScale = hovered ? entity.baseScale * 1.055 : entity.baseScale;

    if (hovered && entity.definition.isUnlockedDefault) {
      soundService.playSfx('tap', 0.2);
    }

    // Ada plakasında yumuşak sınır aydınlatması (Soft Glow)
    if(entity.plateBg){
      entity.plateBg.clear();
      entity.plateBg.fillStyle(hovered?0x174c61:entity.contentPublished?0x103950:0x152f46,0.97);
      entity.plateBg.fillRoundedRect(-127,-43,254,94,17);
      entity.plateBg.lineStyle(hovered?3.5:entity.contentPublished?3:2,
        hovered?0xfff0b5:entity.contentPublished?0xf3d898:0xb7cee3,hovered?1:0.8);
      entity.plateBg.strokeRoundedRect(-127,-43,254,94,17);
    }
    if(entity.focusHalo&&entity.id!=='word_garden')entity.focusHalo.setAlpha(hovered?0.19:0.055);

    if(this.isReducedMotion()){entity.sprite.setScale(targetScale);return;}
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
        entity.progressText.setText('🔒  YAKINDA');
        entity.progressText.setColor('#94a3b8');
      } else {
        entity.progressText.setText('✨  YAKINDA');
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
      entity.progressText.setText(`✓  ${completed}/${total} GÖREV  ·  TAMAMLANDI`);
      entity.progressText.setColor('#34d399');
    } else {
      entity.progressText.setText(`✦  ${completed}/${total} GÖREV  ·  %${percent}`);
      entity.progressText.setColor('#38bdf8');
    }

    // Dolgu grafiğini yeniden çiz
    entity.progressFill.clear();
    if (completed > 0) {
      const fillWidth = Math.max(6, Math.round(198 * (completed / total)));
      const fillColor = isCompleted ? 0x34d399 : 0x10b981;
      entity.progressFill.fillStyle(fillColor, 1);
      entity.progressFill.fillRoundedRect(-99, 32, fillWidth, 7, 3.5);
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
      entity.badgeContainer?.setVisible(false);
      if (entity.badgeHit?.input) entity.badgeHit.input.enabled = false;
      if (entity.scaleTween) {
        entity.scaleTween.stop();
        this.tweens.remove(entity.scaleTween);
        entity.scaleTween = undefined;
      }
      this.tweens.killTweensOf(entity.sprite);
      entity.sprite.setScale(entity.baseScale);
    });
  }

  // At <=900px every destination is a distinct focus scene. On desktop the
  // six-island overview is clean until a child explicitly selects a destination.
  private isCompactViewport(): boolean {
    return this.scale.width <= 900;
  }

  private updateIslandPresentation(): void {
    const spotlight = !this.isOverviewMode && (this.isCompactViewport() || this.isDesktopFocused);
    this.islands.forEach((entity) => {
      const shown = !spotlight || entity.id === this.activeFocusedIslandId;
      entity.container.setVisible(shown);
      if (entity.hitZone.input) entity.hitZone.input.enabled = shown && !this.isInputLocked;
      // Hidden labels must not leave invisible pointer targets in the world.
      const showBadge = shown && !this.isCompactViewport() &&
        !this.isDesktopFocused && entity.isHovered;
      entity.badgeContainer?.setVisible(showBadge);
      if (entity.badgeHit?.input) entity.badgeHit.input.enabled = showBadge && !this.isInputLocked;
    });
    this.routeDecorations.forEach((decoration) => decoration.setVisible(!spotlight));
  }

  /** The default desktop state is a panorama even before "Genel Harita" is clicked. */
  private isPanoramaMode(): boolean {
    return this.isOverviewMode || (!this.isCompactViewport() && !this.isDesktopFocused);
  }

  // --- 5. ADA SEÇİMİ VE KAMERA ODAKLANMASI ---
  public handleSelectIsland(islandId: IslandId): void {
    if (this.isInputLocked) return;
    const entity = this.islands.get(islandId);
    if (!entity) return;

    // On small screens an overview tap selects the destination first; it must
    // not unexpectedly launch a game from the miniature panoramic map.
    if (this.isOverviewMode && this.isCompactViewport()) {
      this.activeFocusedIslandId = islandId;
      EventBus.emit('SELECT_ISLAND', islandId);
      this.resetAllHoverStates();
      this.focusCameraOnIsland(islandId, this.isReducedMotion() ? 0 : 480);
      return;
    }

    this.activeFocusedIslandId = islandId;
    this.isOverviewMode = false;
    EventBus.emit('WORLD_OVERVIEW_CHANGED', false);

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
    soundService.playSfx('island_portal', 0.85);

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
    this.activeFocusedIslandId = islandId;
    this.isOverviewMode = false;
    this.isDesktopFocused = true;
    this.updateIslandPresentation();
    EventBus.emit('WORLD_OVERVIEW_CHANGED', false);
    this.cameras.main.useBounds = true;
    const { width, height } = this.scale;
    const frame = archipelagoCameraFraming({
      width, height, bounds: this.getCombinedIslandsBounds(), mode: 'focus',
      target: { x: entity.worldX, y: entity.worldY }
    });
    if (duration <= 0) {
      this.cameras.main.setZoom(frame.zoom);
      this.cameras.main.centerOn(frame.x, frame.y);
    } else {
      this.cameras.main.pan(frame.x, frame.y, duration, 'Cubic.easeInOut');
      this.cameras.main.zoomTo(frame.zoom, duration, 'Cubic.easeInOut');
    }
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

  // --- 8. CAMERA FIT: PORTRAIT FOCUS OR TRUE SIX-ISLAND OVERVIEW ---
  public fitCameraToViewport(duration = 0): void {
    const { width, height } = this.scale;
    const mode = this.isPanoramaMode() ? 'overview' : 'focus';
    // Phaser clamps oversized viewports to the world boundary. At desktop
    // overview zoom this pinned the whole archipelago to the LEFT edge.
    this.cameras.main.useBounds = mode !== 'overview';
    this.updateIslandPresentation();
    const bounds = this.getCombinedIslandsBounds();
    const entity = this.islands.get(this.activeFocusedIslandId) || this.islands.get('word_garden');
    const frame = archipelagoCameraFraming({
      width, height, bounds, mode,
      target: entity ? { x: entity.worldX, y: entity.worldY } : undefined
    });
    const fitZoom = frame.zoom;
    const targetX = mode === 'overview' && width > 900
      ? frame.x - archipelagoOpticalShiftPixels(width)/fitZoom
      : frame.x;
    if (duration > 0) {
      this.cameras.main.pan(targetX, frame.y, duration, 'Cubic.easeOut');
      this.cameras.main.zoomTo(fitZoom, duration, 'Cubic.easeOut');
    } else {
      this.cameras.main.setZoom(fitZoom);
      this.cameras.main.centerOn(targetX, frame.y);
    }
  }

  // --- 9. PANORAMA: ON MOBILE, FIT ALL ISLANDS INSTEAD OF REFOCUSING ---
  public showWorldOverview(duration = 600): void {
    this.isOverviewMode = true;
    this.isDesktopFocused = false;
    this.updateIslandPresentation();
    this.cameras.main.useBounds = false;
    EventBus.emit('WORLD_OVERVIEW_CHANGED', true);
    this.fitCameraToViewport(this.isReducedMotion() ? 0 : duration);
  }

  private handleResize(): void {
    const portrait = this.scale.height > this.scale.width;
    this.islands.forEach((entity,id) => {
      if (entity.badgeContainer) {
        const pos = archipelagoBadgeAnchor(id, portrait);
        entity.badgeContainer.setPosition(pos.x, pos.y);
      }
    });
    this.fitCameraToViewport(0);
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
        if (this.isCompactViewport() && !this.isOverviewMode) {
          // In spotlight mode swiping switches islands; never pan to empty sky.
          return;
        }
        this.cameras.main.useBounds = !this.isPanoramaMode();
        this.resetAllHoverStates(); // Sürükleme anında asılı hover'ları sıfırla
      }

      const zoom = this.cameras.main.zoom;
      const nextX = this.cameraStartX - deltaX / zoom;
      const nextY = this.cameraStartY - deltaY / zoom;
      if (this.isPanoramaMode()) {
        // Allow inspection of the panorama without losing the islands off-screen.
        const bounds = this.getCombinedIslandsBounds();
        const centerX = bounds.centerX - this.scale.width / (2 * zoom);
        const centerY = bounds.centerY - this.scale.height / (2 * zoom);
        const travelX = Math.max(60, this.scale.width * 0.12 / zoom);
        const travelY = Math.max(60, this.scale.height * 0.12 / zoom);
        this.cameras.main.scrollX = Phaser.Math.Clamp(nextX, centerX - travelX, centerX + travelX);
        this.cameras.main.scrollY = Phaser.Math.Clamp(nextY, centerY - travelY, centerY + travelY);
      } else {
        this.cameras.main.scrollX = nextX;
        this.cameras.main.scrollY = nextY;
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isPointerDown && !this.isInputLocked &&
          this.isCompactViewport() && !this.isOverviewMode) {
        const dx = pointer.x - this.dragStartX;
        const dy = pointer.y - this.dragStartY;
        if (Math.abs(dx) >= 72 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          const order = ARCHIPELAGO_ISLANDS_ORDERED;
          const current = order.findIndex((island) => island.id === this.activeFocusedIslandId);
          const targetIndex = Phaser.Math.Clamp(current + (dx < 0 ? 1 : -1), 0, order.length - 1);
          if (targetIndex !== current && order[targetIndex]) {
            const next = order[targetIndex].id;
            this.activeFocusedIslandId = next;
            EventBus.emit('SELECT_ISLAND', next);
            this.resetAllHoverStates();
            this.focusCameraOnIsland(next, this.isReducedMotion() ? 0 : 480);
          }
        }
      }
      this.isPointerDown = false;
      this.time.delayedCall(50, () => {
        this.hasDragged = false;
      });
    });

    // Kontrollü Fare Tekerleği (Wheel Zoom)
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      if (this.isInputLocked) return;
      if (this.isCompactViewport() && !this.isOverviewMode) return;
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
          // Completion is computed from all six worlds, never overwritten as 5/5.
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
      this.islands.forEach((item,id)=>{
        if(item.focusHalo&&id!=='word_garden')item.focusHalo.setAlpha(id===islandId?0.19:0.055);
      });
      this.focusCameraOnIsland(islandId,this.isReducedMotion()?0:550);
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
    this.routeDecorations = [];
    this.islands.clear();
  }
}
