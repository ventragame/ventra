import Phaser from 'phaser';
import {WORLD_HEIGHT,WORLD_WIDTH,PLAYER_START,type WorldObject} from './worldLayout';
/** Hand-authored, seed-stable 2D fantasy world geometry; drawn entirely offline. */
const districtColors:Record<string,number>={
 animals:0x72d5a5,colors:0xf89dcf,numbers:0x88d5f0,food:0xf7c18a,family:0xc4b3ef,sanctuary:0xf4d993
};
const seedRandom=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
export function paintGardenWorld(scene:Phaser.Scene):void{
 const g=scene.add.graphics().setDepth(-8);
 g.fillGradientStyle(0x9ae9cd,0x79c8d0,0x91c5a6,0xb4d5a0,1);g.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
 g.fillStyle(0x4d9f8f,.19);g.fillEllipse(510,130,730,350);
 g.fillStyle(0x499f91,.2);g.fillEllipse(1220,400,720,800);
 g.fillStyle(0xc7e4a5,.8);g.fillEllipse(320,620,680,680);
 g.fillStyle(0x83d7b1,.75);g.fillEllipse(755,820,890,400);
 // Coastline at the edge, gemstone streams and a small two-tier lake
 g.fillStyle(0x58bbce,.72);g.fillEllipse(1285,100,540,275);
 g.fillStyle(0xb4f0e2,.76);g.fillEllipse(1285,101,486,220);
 g.lineStyle(9,0xf6edc3,.82);g.strokeEllipse(1285,101,486,220);
 g.fillStyle(0x56aec2,.55);g.fillEllipse(1250,890,335,180);
 g.fillStyle(0xabeedd,.86);g.fillEllipse(1250,890,260,125);
 // Heavy shadows and nested golden stone paths (continuous graph in world units)
 const strokePath=(width:number,color:number,alpha:number)=>{
  g.lineStyle(width,color,alpha);g.beginPath();
  g.moveTo(260,190);g.lineTo(360,424);g.lineTo(700,490);g.lineTo(1080,470);
  g.moveTo(715,194);g.lineTo(698,484);g.lineTo(660,789);
  g.moveTo(698,484);g.lineTo(1100,744);
  g.moveTo(365,432);g.lineTo(660,791);
  g.strokePath();
 };
 strokePath(103,0x47766b,.15);strokePath(82,0xe9ce9f,1);strokePath(63,0xf9e8bc,.98);strokePath(2,0xffffff,.35);
 const random=seedRandom(507);
 // A curated scattering of trees, flowers, rocks. Exclude all six landmark entry circles and paths.
 const landmarks=[{x:340,y:436},{x:1080,y:470},{x:715,y:195},{x:1100,y:750},{x:660,y:790},{x:260,y:182},PLAYER_START.garden];
 for(let i=0;i<195;i++){
  const x=56+random()*(WORLD_WIDTH-112),y=50+random()*(WORLD_HEIGHT-100);
  if(landmarks.some(o=>Math.hypot(x-o.x,y-o.y)<100))continue;
  const size=12+random()*19;
  if(i%4===0){
   g.fillStyle(0x264f64,.14);g.fillEllipse(x+3,y+size*.8,size*2.9,size*.8);
   g.fillStyle(i%3?0x4eaf8d:0x6fc19f,1);g.fillCircle(x,y,size);
   g.fillStyle(0xa6e1aa,.95);g.fillCircle(x-size*.28,y-size*.3,size*.52);
   g.fillStyle(0x4c967e,.3);g.fillCircle(x+size*.32,y+size*.28,size*.35);
  }else if(i%4===1){
   g.fillStyle(0xf6ecd4,1);g.fillEllipse(x,y,11+size/2,7+size/3);
   g.fillStyle(0x83b2a8,.5);g.fillEllipse(x+4,y+2,size/1.7,size/4);
  }else{
   const petal=i%2?0xf79bb7:0xffefd2;
   g.lineStyle(2,0x4b9f75,.85);g.lineBetween(x,y+9,x,y);
   for(let n=0;n<5;n++){g.fillStyle(petal,.94);const t=n*Math.PI*2/5;g.fillCircle(x+Math.cos(t)*5,y+Math.sin(t)*5,4);}
   g.fillStyle(0xffd477,1);g.fillCircle(x,y,2.8);
  }
 }
 // Tiny decorative direction signposts along the paths
 for(const [x,y] of [[490,490],[910,487],[818,650]]){
  g.lineStyle(7,0x98765f,.96);g.lineBetween(x,y+30,x,y-27);
  g.fillStyle(0xf8e2a8,1);g.fillRoundedRect(x-29,y-42,60,23,6);
  g.lineStyle(2,0xd2a478,.9);g.strokeRoundedRect(x-29,y-42,60,23,6);
  g.lineStyle(3,0x7f7475,.8);g.lineBetween(x-12,y-31,x+15,y-31);
 }
 // Gradient atmospheric haze, without blocking interactions
 const clouds=scene.add.graphics().setDepth(-7);
 clouds.fillStyle(0xffffff,.2);
 clouds.fillEllipse(75,75,240,61);clouds.fillEllipse(950,62,270,54);
}
function gem(g:Phaser.GameObjects.Graphics,x:number,y:number,size:number,color:number){
 g.fillStyle(color,1);g.fillTriangle(x,y-size,x-size*.75,y,x+size*.75,y);
 g.fillStyle(color,.75);g.fillTriangle(x-size*.75,y,x+size*.75,y,x,y+size);
 g.lineStyle(2,0xfff5da,1);g.strokeTriangle(x,y-size,x-size*.75,y,x+size*.75,y);
}
export function createGardenLandmark(scene:Phaser.Scene,object:WorldObject):Phaser.GameObjects.Container{
 const node=scene.add.container(object.x,object.y-69);
 const g=scene.add.graphics();
 const color=districtColors[object.id]??0xbde8d8;
 // lush stone platform, shadow and halo
 g.fillStyle(0x244d56,.25);g.fillEllipse(0,57,190,48);
 g.fillStyle(0xe4d5b0,1);g.fillEllipse(0,40,196,94);
 g.fillStyle(0xfaf1ca,1);g.fillEllipse(0,29,182,78);
 g.fillStyle(color,1);g.fillEllipse(0,23,164,62);
 g.lineStyle(3,0xffffff,.8);g.strokeEllipse(0,23,164,62);
 if(object.id==='animals'){
  // animal gate: arched wooden fence, barn and forest shapes
  g.fillStyle(0x5b9374,1);g.fillCircle(-59,-53,28);g.fillCircle(60,-51,30);
  g.fillStyle(0x8bd29a,1);g.fillCircle(-64,-63,17);g.fillCircle(55,-66,19);
  g.lineStyle(7,0x936a5a,1);g.lineBetween(-38,1,-38,-62);g.lineBetween(38,1,38,-62);
  g.lineStyle(5,0xeccda1,1);g.strokeEllipse(0,-58,80,47);
  g.fillStyle(0xf7c3a4,1);g.fillRoundedRect(-24,-58,48,47,5);
  g.fillStyle(0xa75d62,1);g.fillTriangle(-32,-58,0,-86,32,-58);
  g.fillStyle(0x6c5360,1);g.fillRoundedRect(-10,-33,20,22,6);
  g.fillStyle(0xffe0a3,1);g.fillCircle(-43,-7,5);g.fillCircle(45,-11,5);
 }else if(object.id==='colors'){
  // paint grove with six gem-flower blooms
  for(let i=0;i<6;i++){const x=-67+i*27,y=-50-(i%2)*17;
   g.lineStyle(3,0x49886f,.85);g.lineBetween(x,14,x,y+7);gem(g,x,y,13,[0xfb8eae,0x97d7ee,0xf8c979,0xc0a2f6,0x9edd9a,0xfff1db][i]);}
  g.fillStyle(0xf9e8cc,1);g.fillRoundedRect(-35,-66,72,35,12);
  for(let i=0;i<4;i++){g.fillStyle([0xfa83a3,0x86c7ef,0xedd17e,0xb5a2ed][i]);g.fillCircle(-24+i*15,-51,5);}
 }else if(object.id==='numbers'){
  // tall crystalline numeric observatory
  g.fillStyle(0x557a9e,1);g.fillRoundedRect(-54,-60,108,67,10);
  g.fillStyle(0xece3cc,1);g.fillRoundedRect(-40,-85,80,22,6);
  g.fillStyle(0x9de3eb,1);g.fillTriangle(-31,-86,0,-122,31,-86);
  for(let n=0;n<3;n++){g.fillStyle(0xffffff,.84);g.fillCircle(-30+n*29,-28,8);}
  gem(g,0,-115,16,0xa1edfb);
 }else if(object.id==='food'){
  // striped canopy, wooden market shelves and baskets
  g.fillStyle(0x9d6a58,1);g.fillRoundedRect(-68,-40,136,52,5);
  g.fillStyle(0xffe4be,1);g.fillRoundedRect(-73,-84,146,44,6);
  for(let i=0;i<7;i++){g.fillStyle(i%2?0xffe7be:0xf18f8a,1);g.fillRect(-69+i*20,-82,20,39);}
  g.lineStyle(5,0xffffff,.82);g.lineBetween(-72,-41,73,-41);
  g.fillStyle(0xc1855e,1);g.fillRoundedRect(-55,-10,111,21,5);
  for(let n=0;n<6;n++){g.fillStyle(n%2?0xf5be60:0xd46569);g.fillCircle(-39+n*15,-17,11);}
 }else if(object.id==='family'){
  // cosy row of little houses
  for(const [x,y,size,wall,roof] of [[-51,-23,48,0xf6d5b1,0xc77985],[13,-41,65,0xb1d7da,0x806a96],[64,-14,35,0xf1d5ae,0xc97f8f]] as const){
   g.fillStyle(wall,1);g.fillRoundedRect(x-size/2,y-size/2,size,size*.76,5);
   g.fillStyle(roof,1);g.fillTriangle(x-size*.6,y-size*.48,x,y-size*.95,x+size*.6,y-size*.48);
   g.fillStyle(0xffffff,.85);g.fillRoundedRect(x-8,y-size*.25,16,18,4);
  }
 }else if(object.id==='sanctuary'){
  // luminous archway and golden stone columns
  g.fillStyle(0x8c83a8,1);g.fillRoundedRect(-73,-57,146,70,5);
  g.fillStyle(0xf0dcaa,1);g.fillTriangle(-82,-59,0,-111,82,-59);
  for(const x of [-55,55]){g.fillStyle(0xf7e5bf,1);g.fillRoundedRect(x-14,-65,28,72,3);}
  g.fillStyle(0x3c5976,1);g.fillRoundedRect(-35,-54,70,67,25);
  gem(g,0,-115,21,0xffe6a1);
  g.lineStyle(3,0xffe5a2,.7);g.strokeEllipse(0,-40,57,85);
 }
 node.add(g);
 return node;
}
export function addGardenAmbient(scene:Phaser.Scene,reduced:boolean):void{
 const sparkle=scene.add.container(0,0).setDepth(8);
 const rand=seedRandom(3382);
 for(let i=0;i<29;i++){
  const x=60+rand()*(WORLD_WIDTH-120),y=50+rand()*(WORLD_HEIGHT-100);
  const star=scene.add.star(x,y,4,1.6,4,[0xffffff,0xffe8b2,0xc3ffe2][i%3],.8);
  sparkle.add(star);
  if(!reduced)scene.tweens.add({targets:star,alpha:.15,scale:.65,
   yoyo:true,repeat:-1,duration:1500+(i%6)*360,delay:i*83,ease:'Sine.easeInOut'});
 }
}
