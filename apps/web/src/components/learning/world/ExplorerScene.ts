import Phaser from 'phaser';
import {
  WORLD_WIDTH,WORLD_HEIGHT,PLAYER_START,INTERACTION_DISTANCE,
  walkTowards,distanceBetween,clampToWorld,
  type WorldArea,type WorldObject,type Point
} from './worldLayout';

const ANIMALS=['cat','dog','bird','rabbit','cow','fish','horse','duck','sheep','frog','bee','butterfly','lion','elephant','monkey','penguin','turtle','fox','bear','owl'];
type ActivityCallback=(object:WorldObject)=>void;
const tintById:Record<string,number>={
  animals:0x89e789,colors:0xf6a5da,numbers:0x94d7ff,food:0xffb87e,
  family:0xc4b0fa,sanctuary:0xa3f0d5
};

export class ExplorerScene extends Phaser.Scene {
  private area:WorldArea;
  private targets:WorldObject[];
  private onInteract:ActivityCallback;
  private onInspect:ActivityCallback;
  private reducedMotion:boolean;
  private player!:Phaser.GameObjects.Container;
  private targetGraphics:Phaser.GameObjects.Container[]=[];
  private targetAnimations:Phaser.Tweens.Tween[]=[];
  private path:Point|null=null;
  private pendingTarget:string|null=null;
  private keys:Phaser.Input.Keyboard.Key[]=[];
  private ready=false;
  private bloomLayer?:Phaser.GameObjects.Graphics;
  private bloomProgress=0;

  constructor(args:{area:WorldArea;targets:WorldObject[];onInteract:ActivityCallback;
    onInspect:ActivityCallback;reducedMotion:boolean}){
    super({key:'VentraExplorer'});
    this.area=args.area;
    this.targets=args.targets;
    this.onInteract=args.onInteract;
    this.onInspect=args.onInspect;
    this.reducedMotion=args.reducedMotion;
  }
  preload():void {
    this.load.svg('p4_explorer','/assets/kids/explorer-avatar.svg',{width:112,height:131});
    for(const id of ANIMALS){
      this.load.svg('p4_'+id,`/assets/animals/premium/${id}.svg`,{width:116,height:116});
    }
  }
  create():void {
    this.cameras.main.setBackgroundColor('#83cfca');
    this.cameras.main.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);
    this.drawLandscape();
    this.bloomLayer=this.add.graphics().setDepth(2);
    this.renderRestoration();
    this.createExplorer();
    this.drawTargets();
    this.cameras.main.startFollow(this.player,true,0.12,0.12);
    this.reframe();
    this.scale.on('resize',this.reframe,this);
    this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      if(!pointer) return;
      this.pendingTarget=null;
      this.path=clampToWorld({x:pointer.worldX,y:pointer.worldY});
    });
    if(this.input.keyboard){
      for(const key of ['W','A','S','D','UP','DOWN','LEFT','RIGHT']){
        this.keys.push(this.input.keyboard.addKey(key));
      }
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.scale.off('resize',this.reframe,this);
      this.ready=false;
    });
    this.ready=true;
  }
  private reframe():void {
    const w=this.scale.width;
    const zoom=Math.max(0.53,Math.min(1.35,w/(w<640?680:1050)));
    this.cameras.main.setZoom(zoom);
    this.cameras.main.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  }
  private drawLandscape():void {
    const g=this.add.graphics();
    g.fillGradientStyle(0x9ce3c5,0x87d5cd,0x6abe91,0x74ce9e,1);
    g.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
    g.fillStyle(0xbde9a1,.85);g.fillEllipse(270,515,670,660);
    g.fillStyle(0x75be85,.55);g.fillEllipse(1160,410,570,790);
    g.fillStyle(0x72c79a,.55);g.fillEllipse(770,880,750,250);
    // Connected walkable footpaths (no collision against decorative foliage).
    g.lineStyle(85,0xf5dfae,.86);
    g.beginPath();g.moveTo(120,500);g.lineTo(680,480);g.lineTo(1250,470);
    g.moveTo(690,130);g.lineTo(680,790);g.moveTo(265,185);g.lineTo(710,480);
    g.moveTo(710,480);g.lineTo(1080,785);
    g.strokePath();
    g.lineStyle(4,0xfff1c7,.55);
    g.beginPath();g.moveTo(120,500);g.lineTo(680,480);g.lineTo(1250,470);g.strokePath();
    // Two quiet ponds provide readable landmarks; target objects remain reachable.
    g.fillStyle(0x4ea8c5,.8);g.fillEllipse(1220,135,330,160);
    g.fillStyle(0xa0ebdb,.88);g.fillEllipse(1220,132,285,126);
    g.fillStyle(0x4cabc6,.7);g.fillEllipse(1135,863,340,120);
    g.lineStyle(7,0xd8f4bd,1);g.strokeEllipse(1135,863,340,120);
    // Repeated ambient assets are batched into one Graphics object.
    let seed=this.area==='garden'?71:144;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<105;i++){
      const x=35+random()*(WORLD_WIDTH-70),y=35+random()*(WORLD_HEIGHT-70);
      if(distanceBetween({x,y},PLAYER_START[this.area])<100)continue;
      const radius=10+random()*21;
      g.fillStyle(0x285f5b,.12);g.fillEllipse(x,y+radius/2,radius*2.1,radius*.7);
      g.fillStyle([0x33976e,0x4aad78,0x54b87c,0x69c67b][i%4],.85);
      g.fillCircle(x,y-radius/3,radius);
      g.fillStyle(0xb1e4a6,.62);g.fillCircle(x-radius/3,y-radius/2,radius*.47);
    }
    for(let i=0;i<140;i++){
      const x=random()*WORLD_WIDTH,y=random()*WORLD_HEIGHT;
      g.lineStyle(2,0x43835d,.8);g.lineBetween(x,y+7,x,y);
      g.fillStyle([0xfff4bd,0xffb4c4,0xd5b5fa,0xf8e8ed][i%4],.92);
      for(let petal=0;petal<4;petal++){
        const angle=petal*Math.PI/2;g.fillCircle(x+Math.cos(angle)*4,y+Math.sin(angle)*4,4);
      }
      g.fillStyle(0xffdf85,1);g.fillCircle(x,y,3);
    }
    const clouds=this.add.graphics();
    clouds.fillStyle(0xffffff,.19);
    clouds.fillEllipse(180,95,240,50);clouds.fillEllipse(930,92,270,45);
    this.add.text(32,18,this.area==='garden'?'KELİME BAHÇESİ':'HAYVAN ÇAYIRI',{
      fontFamily:'Arial, sans-serif',fontSize:'26px',fontStyle:'bold',color:'#185e65'
    }).setAlpha(.8);
  }
  private createExplorer():void {
    const start=PLAYER_START[this.area];
    this.player=this.add.container(start.x,start.y);
    const shadow=this.add.ellipse(0,42,70,18,0x1d4540,.28);
    const character=this.add.image(0,-8,'p4_explorer').setDisplaySize(102,119);
    this.player.add([shadow,character]);
    this.player.setDepth(20);
    if(!this.reducedMotion){
      this.tweens.add({targets:character,y:'-=3',duration:920,
        yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    }
  }
  private renderRestoration():void {
    if(!this.bloomLayer)return;
    const g=this.bloomLayer;g.clear();
    const count=Math.min(12,Math.max(0,this.bloomProgress));
    for(let i=0;i<count;i++){
      const x=135+(i%6)*216,y=475+Math.floor(i/6)*170;
      g.fillStyle(0xfff5bd,.2);g.fillCircle(x,y,31);
      g.fillStyle(i%2?0xffbce1:0xffe3a4,.94);
      for(let j=0;j<5;j++){
        const angle=Math.PI*2*j/5;
        g.fillCircle(x+Math.cos(angle)*12,y+Math.sin(angle)*12,9);
      }
      g.fillStyle(0xffeb8f,1);g.fillCircle(x,y,7);
    }
  }
  setProgress(value:number):void {
    if(!Number.isFinite(value))return;
    this.bloomProgress=Math.max(0,Math.min(12,Math.floor(value)));
    this.renderRestoration();
  }
  private createTarget(object:WorldObject):Phaser.GameObjects.Container {
    const node=this.add.container(object.x,object.y);
    const locked=object.unlocked===false;
    const marker=this.add.graphics();
    marker.fillStyle(0x204e48,.23);marker.fillEllipse(0,30,155,40);
    marker.fillStyle(object.tint??tintById[object.id]??0xc8e9b1,.95);
    marker.fillEllipse(0,10,150,83);
    marker.lineStyle(5,locked?0x8da9a5:0xfff4cf,.95);marker.strokeEllipse(0,10,150,83);
    node.add(marker);
    if(object.kind==='animal' && this.textures.exists('p4_'+object.id)){
      const portrait=this.add.image(0,-56,'p4_'+object.id).setDisplaySize(105,105);
      node.add(portrait);
      if(!this.reducedMotion){
        const index=ANIMALS.indexOf(object.id);
        this.targetAnimations.push(this.tweens.add({
          targets:portrait,y:-62,duration:1050+Math.max(0,index)*65,
          ease:'Sine.easeInOut',yoyo:true,repeat:-1
        }));
      }
    }else if(object.kind==='habitat'){
      node.add(this.add.text(0,-51,object.label==='Gölet'?'💧':object.label==='Çiftlik'?'🚜':
        object.label==='Ağaç'?'🌳':object.label==='Çiçeklik'?'🌸':'🏡',
        {fontSize:'48px'}).setOrigin(.5));
    }else{
      node.add(this.add.text(0,-52,object.id==='colors'?'🎨':object.id==='animals'?'🐾':
        object.id==='numbers'?'🔢':object.id==='food'?'🍎':object.id==='family'?'🏡':'✨',
        {fontSize:'45px'}).setOrigin(.5));
    }
    const title=this.add.text(0,65,object.label,{
      fontFamily:'Arial, sans-serif',fontStyle:'bold',fontSize:'20px',
      color:locked?'#536b63':'#174c47',backgroundColor:'#ffffffdd',
      padding:{left:11,right:11,top:6,bottom:6},align:'center'
    }).setOrigin(.5);
    node.add(title);
    if(locked){
      node.add(this.add.text(53,-78,'🔒',{fontSize:'23px'}).setOrigin(.5));
    }
    const hit=this.add.rectangle(0,-7,170,168,0xffffff,0.001).setInteractive({useHandCursor:true});
    node.add(hit);
    hit.on('pointerdown',(_pointer:Phaser.Input.Pointer,_x:number,_y:number,event:any)=>{
      event?.stopPropagation?.();
      this.goToObject(object.id);
    });
    node.setDepth(Math.round(object.y));
    return node;
  }
  private drawTargets():void {
    this.targetAnimations.forEach(tween=>tween.remove());
    this.targetAnimations=[];
    this.targetGraphics.forEach(node=>node.destroy(true));
    this.targetGraphics=[];
    for(const object of this.targets){
      this.targetGraphics.push(this.createTarget(object));
    }
  }
  setTargets(targets:WorldObject[]):void {
    this.targets=targets;
    this.pendingTarget=null;
    this.path=null;
    if(this.ready)this.drawTargets();
  }
  setCallbacks(onInteract:ActivityCallback,onInspect:ActivityCallback):void{
    this.onInteract=onInteract;this.onInspect=onInspect;
  }
  setReducedMotion(reduced:boolean):void{
    if(this.reducedMotion===reduced)return;
    this.reducedMotion=reduced;
    if(reduced)this.tweens.pauseAll();
    else this.tweens.resumeAll();
  }
  goToObject(id:string):void {
    const object=this.targets.find(x=>x.id===id);
    if(!object)return;
    if(object.unlocked===false){this.onInspect(object);return;}
    this.pendingTarget=id;
    this.path=clampToWorld({x:object.x,y:object.y+76});
  }
  goDirection(x:number,y:number):void {
    if(!this.ready)return;
    this.pendingTarget=null;
    this.path=clampToWorld({x:this.player.x+x*160,y:this.player.y+y*160});
  }
  update(_time:number,delta:number):void {
    if(!this.ready||!this.player)return;
    let dx=0,dy=0;
    if(this.keys[0]?.isDown||this.keys[4]?.isDown)dy-=1;
    if(this.keys[1]?.isDown||this.keys[6]?.isDown)dx-=1;
    if(this.keys[2]?.isDown||this.keys[5]?.isDown)dy+=1;
    if(this.keys[3]?.isDown||this.keys[7]?.isDown)dx+=1;
    const movement=Math.hypot(dx,dy);
    if(movement>0){
      this.pendingTarget=null;this.path=null;
      const from={x:this.player.x,y:this.player.y};
      const to={x:from.x+dx/movement*220,y:from.y+dy/movement*220};
      const next=walkTowards(from,to,delta);
      this.player.setPosition(next.x,next.y);
    }else if(this.path){
      const current={x:this.player.x,y:this.player.y};
      const next=walkTowards(current,this.path,delta);
      this.player.setPosition(next.x,next.y);
      const arrived=distanceBetween(next,this.path)<3;
      if(arrived){
        this.path=null;
        const id=this.pendingTarget;
        this.pendingTarget=null;
        if(id){
          const object=this.targets.find(t=>t.id===id);
          if(object && distanceBetween(next,{x:object.x,y:object.y})<INTERACTION_DISTANCE+25){
            if(!this.reducedMotion){
              const pop=this.add.text(object.x,object.y-120,'✦',{fontSize:'38px',color:'#fff1a7'}).setDepth(950);
              this.tweens.add({targets:pop,alpha:0,y:pop.y-55,duration:650,
                onComplete:()=>pop.destroy()});
            }
            this.onInteract(object);
          }
        }
      }
    }
    this.player.setDepth(Math.round(this.player.y));
  }
}
