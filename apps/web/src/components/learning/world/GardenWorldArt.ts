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
/** Minimal depth-aware foreground ornaments over the premium world painting.
 * Illustration of each biome lives in map-ground.webp. Keeping these live
 * avoids baked-in progress labels and keeps hover/locked/complete states real. */
export function createGardenLandmark(scene:Phaser.Scene,object:WorldObject):Phaser.GameObjects.Container{
 const node=scene.add.container(0,-82);
 const g=scene.add.graphics();
 const color=districtColors[object.id]??0xbde8d8;
 const done=(object.total??0)>0&&(object.completed??0)>=(object.total??0);
 g.fillStyle(0x19494a,.3);g.fillEllipse(0,37,110,32);
 g.fillStyle(0xffefc4,.9);g.fillEllipse(0,19,106,45);
 g.fillStyle(color,.9);g.fillEllipse(0,13,93,29);
 g.lineStyle(3,done?0xffe68f:0xffffff,.93);g.strokeEllipse(0,13,93,29);
 g.fillStyle(0xf9e7b9,.95);g.fillRoundedRect(-21,-24,42,44,13);
 g.lineStyle(3,0x417b72,.92);g.strokeRoundedRect(-21,-24,42,44,13);
 const icon=object.id==='sanctuary'?'✧':
  object.id==='animals'?'✿':object.id==='family'?'⌂':
  object.id==='colors'?'✦':object.id==='numbers'?'❖':'❀';
 const glyph=scene.add.text(0,-3,icon,{
  fontFamily:'Arial, sans-serif',fontSize:'30px',fontStyle:'bold',color:'#264958',
  stroke:'#fff7da',strokeThickness:1
 }).setOrigin(.5);
 node.add([g,glyph]);
 if(done){
  node.add(scene.add.text(35,-28,'★',{fontSize:'20px',color:'#ffdc7a'}).setOrigin(.5));
 }
 return node;
}
export function addGardenAmbient(scene:Phaser.Scene,reduced:boolean):void{
 const sparkle=scene.add.container(0,0).setDepth(8);
 const rand=seedRandom(3382);
 for(let i=0;i<24;i++){
  const x=60+rand()*(WORLD_WIDTH-120),y=50+rand()*(WORLD_HEIGHT-100);
  const star=scene.add.star(x,y,4,1.6,4,[0xffffff,0xffe8b2,0xc3ffe2][i%3],.8);
  sparkle.add(star);
  if(!reduced)scene.tweens.add({targets:star,alpha:.15,scale:.65,
   yoyo:true,repeat:-1,duration:1500+(i%6)*360,delay:i*83,ease:'Sine.easeInOut'});
 }
}
