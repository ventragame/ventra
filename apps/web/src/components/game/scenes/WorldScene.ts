import Phaser from 'phaser';
import { EventBus, isWorldInputLocked } from '@/lib/game/EventBus';
import { soundService } from '@/lib/audio/SoundService';
import {archipelagoBadgeAnchor,archipelagoOpticalShiftPixels,archipelagoCameraFraming} from '@/lib/game/archipelagoPresentation';
import {ARCHIPELAGO_SKYBRIDGES,ARCHIPELAGO_SKYBRIDGE_MATERIAL,SKYBRIDGE_GEOMETRY,skybridgePoint,skybridgeNormal,
  skybridgePlanks,skybridgePosts,skybridgeRope} from '@/lib/game/archipelagoBridges';
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
  harborCompletedLevels?: number;
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

export class WorldScene extends Phaser.Scene {
  // Kompakt Sanal Dünya Boyutları (Merkezi Oval Takımada)
  private readonly WORLD_WIDTH = 2400;
  private readonly WORLD_HEIGHT = 1600;
  private readonly ISLAND_TARGET_DISPLAY_SIZE = 460; // Dengeli, net ada çapı

  // Görsel Katmanlar
  private backgroundClouds: Phaser.GameObjects.Image[] = [];
  private foregroundClouds: Phaser.GameObjects.Image[] = [];
  private islands: Map<IslandId, IslandEntity> = new Map();
  private routeDecorations: Array<Phaser.GameObjects.Graphics | Phaser.GameObjects.Arc> = [];

  // Durumlar
  private wordGardenStatus: 'dormant' | 'blooming' = 'dormant';
  private wordGardenCompletedLevels: number = 0;
  private wordGardenTotalLevels: number = 73;
  private plazaCompletedLevels:number=0;
  private forestCompletedLevels:number=0;
  private harborCompletedLevels:number=0;
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
    if(typeof data.harborCompletedLevels==='number')this.harborCompletedLevels=data.harborCompletedLevels;
    this.isTransitioning = false;
    // Honour a lock sent before this scene existed (an island may already be open).
    this.isInputLocked = isWorldInputLocked();
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
    // An island opened while this scene was loading keeps the world locked:
    // clicks inside that game must never reach the islands drawn underneath.
    if (isWorldInputLocked()) this.setInputLocked(true);
    this.events.once(Phaser.Scenes.Events.UPDATE, () => EventBus.emit('WORLD_SCENE_READY'));

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

  // --- 2. ALTI ADAYI BİRLEŞTİREN EL YAPIMI AHŞAP GÖK KÖPRÜLERİ ---
  private createProgressionPaths(): void {
    // All six islands are joined by the SAME hand-built timber skybridge:
    // honey planks over dark stringers, a visible deck thickness, oak posts
    // with sagging hemp rope rails, warm lanterns and one pennant span.
    // Unlock/progress affects play, never the construction (no faded links).
    // Everything stays below the island art (depth 20): bridge ends tuck under it.
    const palette=ARCHIPELAGO_SKYBRIDGE_MATERIAL;
    const geo=SKYBRIDGE_GEOMETRY;
    const animate=!this.isReducedMotion()&&!this.isMobileDevice();
    // Light comes from the upper left, like the painted islands.
    const light={x:-0.6,y:-0.8};
    const vec=(p:{x:number;y:number})=>new Phaser.Math.Vector2(p.x,p.y);
    ARCHIPELAGO_SKYBRIDGES.forEach((curve,routeIndex)=>{
      const edge=(t:number,side:number,offset=0,drop=0)=>{
        const p=skybridgePoint(curve,t),n=skybridgeNormal(curve,t),d=(geo.deckHalf+offset)*side;
        return {x:p.x+n.x*d,y:p.y+n.y*d+drop};
      };
      // Closed outline of the deck band, optionally widened and dropped.
      const band=(offset:number,drop:number)=>{
        const outline:Phaser.Math.Vector2[]=[];
        for(let k=0;k<=56;k++)outline.push(vec(edge(k/56,-1,offset,drop)));
        for(let k=56;k>=0;k--)outline.push(vec(edge(k/56,1,offset,drop)));
        return outline;
      };
      const trace=(g:Phaser.GameObjects.Graphics,points:{x:number;y:number}[],width:number,color:number,alpha:number)=>{
        g.lineStyle(width,color,alpha);
        g.strokePoints(points.map(vec),false,false);
      };
      const along=(side:number,offset:number,drop=0)=>
        Array.from({length:57},(_,k)=>edge(k/56,side,offset,drop));

      // 1. A soft shadow on the sky below: the bridge floats like the islands.
      const shadow=this.add.graphics().setDepth(9);
      const centre=Array.from({length:57},(_,k)=>{const p=skybridgePoint(curve,k/56);return {x:p.x,y:p.y+geo.shadowDrop};});
      for(const [width,alpha] of [[74,0.03],[56,0.045],[38,0.06]] as const)trace(shadow,centre,width,palette.shadow,alpha);
      this.routeDecorations.push(shadow);

      // 2. Deck: front face, dark stringers showing through the gaps, planks.
      const deck=this.add.graphics().setDepth(10);
      deck.fillStyle(palette.fasciaShade,1);
      deck.fillPoints(band(1.2,geo.thickness),true);
      deck.fillStyle(palette.fascia,1);
      deck.fillPoints(band(0.6,geo.thickness*0.55),true);
      deck.fillStyle(palette.stringer,1);
      deck.fillPoints(band(0,0),true);
      for(const plank of skybridgePlanks(curve)){
        const cos=Math.cos(plank.twist),sin=Math.sin(plank.twist);
        const u={x:plank.tangent.x*cos-plank.tangent.y*sin,y:plank.tangent.x*sin+plank.tangent.y*cos};
        const n={x:-u.y,y:u.x};
        const c=plank.point,half=geo.plankDepth/2,len=geo.deckHalf-0.5+plank.lengthJitter;
        const corner=(a:number,b:number)=>vec({x:c.x+u.x*a+n.x*b,y:c.y+u.y*a+n.y*b});
        const board=[corner(-half,-len),corner(half,-len),corner(half,len),corner(-half,len)];
        deck.fillStyle(palette.plankTones[plank.tone],1);
        deck.fillPoints(board,true);
        // The edge facing the light catches a bright bevel.
        const lit=(u.x*light.x+u.y*light.y)>=0?1:-1;
        deck.fillStyle(palette.plankHighlight,0.85);
        deck.fillPoints([corner(lit*half,-len+1),corner(lit*(half-2.4),-len+1),corner(lit*(half-2.4),len-1),corner(lit*half,len-1)],true);
        deck.lineStyle(1.3,palette.plankEdge,0.9);
        deck.strokePoints(board,true,true);
        // Two tiny pegs per board.
        deck.fillStyle(palette.plankEdge,0.55);
        for(const b of [-len+4,len-4]){const p=corner(0,b);deck.fillCircle(p.x,p.y,1.2);}
      }
      // Side beams frame the deck along both edges.
      for(const side of [-1,1]){
        trace(deck,along(side,0.4),5,palette.stringer,1);
        trace(deck,along(side,0.4,-1.2),1.6,palette.postCap,0.75);
      }
      this.routeDecorations.push(deck);

      // 3. Posts and rope rails. Posts stand upright on screen (3/4 view);
      // the far side is drawn first so the near rail overlaps it.
      const posts=skybridgePosts(curve);
      const last=posts.length-1;
      const rigFar=this.add.graphics().setDepth(11);
      const rigNear=this.add.graphics().setDepth(12);
      this.routeDecorations.push(rigFar,rigNear);
      const tops:Record<string,{x:number;y:number}[]>={'-1':[],'1':[]};
      const mids:Record<string,{x:number;y:number}[]>={'-1':[],'1':[]};
      const sideIsFar=(side:number)=>{
        const n=skybridgeNormal(curve,0.5);
        return n.y*side<0||(Math.abs(n.y)<0.2&&n.x*side>0);
      };
      for(const side of [-1,1]){
        const g=sideIsFar(side)?rigFar:rigNear;
        posts.forEach((post,i)=>{
          const end=i===0||i===last;
          const h=end?geo.endPostHeight:geo.postHeight;
          const n=post.normal,d=(geo.deckHalf+1)*side;
          const base={x:post.point.x+n.x*d,y:post.point.y+n.y*d};
          const w=end?7.5:6;
          g.fillStyle(palette.post,1);
          g.fillRect(base.x-w/2,base.y-h,w,h+3);
          g.fillStyle(palette.postShade,1);
          g.fillRect(base.x+w*0.1,base.y-h,w*0.4,h+3);
          g.fillStyle(palette.postCap,1);
          g.fillCircle(base.x,base.y-h,w*0.62);
          g.lineStyle(1.1,palette.plankEdge,0.8);
          g.strokeRect(base.x-w/2,base.y-h,w,h+3);
          tops[side].push({x:base.x,y:base.y-h+2});
          mids[side].push({x:base.x,y:base.y-h*0.48});
        });
      }
      for(const side of [-1,1]){
        const g=sideIsFar(side)?rigFar:rigNear;
        for(const [line,sag,alpha] of [[tops[side],geo.ropeSag,1],[mids[side],geo.ropeSag*0.7,0.85]] as const){
          for(let i=0;i<line.length-1;i++){
            const rope=skybridgeRope(line[i],line[i+1],sag);
            trace(g,rope,3.6,palette.ropeShade,alpha);
            trace(g,rope,2.1,palette.rope,alpha);
            trace(g,rope.map(p=>({x:p.x,y:p.y-0.8})),0.8,palette.ropeLight,alpha*0.8);
          }
        }
      }

      // 4. One festival span: pennants hang from the near rope at mid-bridge.
      const near=sideIsFar(1)?-1:1;
      const flags=this.add.graphics().setDepth(12);
      this.routeDecorations.push(flags);
      const middle=Math.floor(last/2);
      for(let i=Math.max(0,middle-1);i<=Math.min(last-1,middle);i++){
        const rope=skybridgeRope(tops[near][i],tops[near][i+1],geo.ropeSag,8);
        rope.slice(1,-1).forEach((p,k)=>{
          flags.fillStyle(palette.pennants[(k+i+routeIndex)%palette.pennants.length],1);
          flags.fillTriangle(p.x-5,p.y,p.x+5,p.y,p.x,p.y+13);
          flags.fillStyle(0xffffff,0.35);
          flags.fillTriangle(p.x-5,p.y,p.x-1,p.y,p.x-1.6,p.y+8);
          flags.lineStyle(1,palette.plankEdge,0.6);
          flags.strokeTriangle(p.x-5,p.y,p.x+5,p.y,p.x,p.y+13);
        });
      }

      // 5. Warm lanterns on both end posts and the middle post.
      for(const side of [-1,1])for(const i of new Set([0,middle,last])){
        if(i===middle&&side!==near)continue;
        const top=tops[side][i];
        const lx=top.x,ly=top.y-11;
        // Warm glow first (normal blending stays amber on the blue sky).
        const halo=this.add.circle(lx,ly,26,palette.lampHalo,0.2).setDepth(13);
        const glow=this.add.circle(lx,ly,13,palette.lamp,0.42).setDepth(13);
        const lantern=this.add.graphics().setDepth(13);
        lantern.fillStyle(palette.lampFrame,1);
        lantern.fillRect(lx-1,ly+7,2,5);                       // stem on the post
        lantern.fillRect(lx-6,ly+5,12,3);                      // base
        lantern.fillTriangle(lx-8,ly-6,lx+8,ly-6,lx,ly-13);    // roof
        lantern.fillRect(lx-6,ly-6,12,12);                     // frame
        lantern.fillStyle(palette.lampGlass,1);
        lantern.fillRect(lx-4.4,ly-4.4,8.8,9);                 // amber glass
        lantern.fillStyle(palette.lamp,1);
        lantern.fillRect(lx-2.4,ly-3,4.8,6.4);                 // bright flame core
        lantern.fillStyle(palette.lampFrame,1);
        lantern.fillRect(lx-0.6,ly-6,1.2,12);                  // mullion
        lantern.fillCircle(lx,ly-14,1.8);                      // finial
        this.routeDecorations.push(halo,glow,lantern);
        if(animate)this.tweens.add({
          targets:halo,alpha:0.1,scale:1.22,duration:1700+((routeIndex*3+i)%5)*230,
          yoyo:true,repeat:-1,ease:'Sine.easeInOut'
        });
      }

      // 6. A warm firefly drifts along the deck (desktop, motion allowed).
      if(animate){
        const first=skybridgePoint(curve,0);
        const aura=this.add.circle(first.x,first.y,8,palette.lampHalo,0.28).setDepth(13);
        const glint=this.add.circle(first.x,first.y,2.6,palette.lamp,0.95).setDepth(13);
        this.routeDecorations.push(aura,glint);
        this.tweens.addCounter({from:0,to:1,duration:7200+routeIndex*310,
          delay:routeIndex*260,repeat:-1,
          onUpdate:tween=>{
            const t=tween.getValue()??0,p=skybridgePoint(curve,t);
            // Hovers a little above the planks with a gentle bob.
            const y=p.y-14-Math.sin(t*Math.PI*6)*3;
            aura.setPosition(p.x,y);glint.setPosition(p.x,y);
          }
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
      // A soft two-step aura (no hard outline ring crossing the bridges).
      const haloAura=this.add.ellipse(0,38,540,380,def.id==='word_garden'?0xfff0b4:0xd8eafb,
        def.id==='word_garden'?0.07:0.025);
      container.add([haloAura,focusHalo]);

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
      badgeHit.on('pointerup',(pointer:Phaser.Input.Pointer)=>{
        if(this.isInputLocked||this.hasDragged||this.isTransitioning||!this.isCanvasPress(pointer))return;
        this.handleSelectIsland(def.id);
      });
      badgeHit.on('pointerover',()=>this.setIslandHoverState(entity,true));
      badgeHit.on('pointerout',()=>this.setIslandHoverState(entity,false));

      container.add(badgeContainer);

      const initialCompleted = def.id==='word_garden'?this.wordGardenCompletedLevels:def.id==='story_castle'?this.plazaCompletedLevels:def.id==='listening_forest'?this.forestCompletedLevels:def.id==='speaking_harbor'?this.harborCompletedLevels:0;

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
      hitZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.isInputLocked || this.hasDragged || this.isTransitioning || !this.isCanvasPress(pointer)) return;
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

  /**
   * Phaser also reads presses made on the page outside the canvas (window
   * events) and hit-tests them by position. A tap on a DOM control drawn over
   * the world (the phone tools menu, the island card) used to select the
   * island underneath — it opened as soon as the menu's window closed — and a
   * swipe on a DOM panel panned the camera. Only a press that starts and ends
   * on the game canvas is a world gesture.
   */
  private isCanvasPress(pointer: Phaser.Input.Pointer): boolean {
    const canvas = this.game.canvas;
    return pointer.downElement === canvas && (pointer.isDown || pointer.upElement === canvas);
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
    // Island and label targets follow the lock both ways: a presentation
    // update made while locked used to leave them disabled after release.
    this.updateIslandPresentation();
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
      if (this.isInputLocked || !this.isCanvasPress(pointer)) return;
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
    this.routeDecorations = [];
    this.islands.clear();
  }
}
