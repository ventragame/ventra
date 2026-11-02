/**
 * VENTRA original interactive score — no external tracks or copyrighted motifs.
 * WebAudio oscillator score: seven location-specific tonal palettes, low CPU.
 * Explicit opt-in only. The SoundService owns/resumes the shared AudioContext.
 */
export type MusicScene='archipelago'|'garden'|'animals'|'colors'|'numbers'|'food'|'family'|'sanctuary';
interface Score { root:number; tempo:number; progression:readonly number[][]; melody:readonly number[]; timbre:OscillatorType; }
const SCORES:Record<MusicScene,Score>={
  archipelago:{root:220,tempo:101,progression:[[0,4,7,11],[-3,0,4,7],[-5,-1,2,7],[-3,0,4,9]],melody:[7,11,12,7,4,7,11,9],timbre:'sine'},
  garden:{root:246.94,tempo:106,progression:[[0,4,7,12],[-5,-1,2,7],[-3,0,4,9],[-5,-1,4,7]],melody:[7,9,12,9,7,4,7,2],timbre:'triangle'},
  animals:{root:196,tempo:108,progression:[[0,4,7,12],[-5,-1,2,7],[-2,2,5,9],[-5,0,4,7]],melody:[7,9,12,9,7,4,2,4],timbre:'triangle'},
  colors:{root:261.63,tempo:112,progression:[[0,4,7,11],[-3,0,4,7],[-5,-1,2,7],[0,5,9,12]],melody:[12,9,7,11,14,12,9,7],timbre:'sine'},
  numbers:{root:220,tempo:118,progression:[[0,3,7,10],[-5,-2,2,7],[-3,0,3,7],[0,3,7,12]],melody:[0,7,12,7,10,12,15,12],timbre:'triangle'},
  food:{root:233.08,tempo:116,progression:[[0,4,7,12],[-5,-1,2,7],[-3,0,4,7],[-5,0,4,9]],melody:[7,12,9,7,4,7,9,12],timbre:'sine'},
  family:{root:196,tempo:96,progression:[[0,4,7,11],[-5,-1,2,7],[-3,0,4,7],[-5,-1,4,7]],melody:[7,4,2,4,7,9,7,4],timbre:'sine'},
  sanctuary:{root:174.61,tempo:95,progression:[[0,3,7,10],[-3,0,3,7],[-5,-2,2,7],[0,3,7,12]],melody:[12,10,7,3,7,10,12,15],timbre:'triangle'}
};
export const MUSIC_SCENES=Object.freeze(Object.keys(SCORES) as MusicScene[]);
export const musicSceneForDistrict=(district:string|null|undefined):MusicScene=>{
  const map:Record<string,MusicScene>={animals:'animals',colors:'colors',numbers:'numbers',
    food:'food',family:'family',sanctuary:'sanctuary',word_garden:'garden'};
  return district ? map[district]??'garden' : 'archipelago';
};
const safe=(v:number)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const frequency=(root:number,semitones:number)=>root*Math.pow(2,semitones/12);
export class MusicDirector{
 private context:AudioContext|null=null;
 private output:GainNode|null=null;
 private toneBus:BiquadFilterNode|null=null;
 private delay:DelayNode|null=null;
 private delayGain:GainNode|null=null;
 private timer:ReturnType<typeof setInterval>|null=null;
 private scene:MusicScene='archipelago';
 private currentStep=0;
 private nextNote=0;
 private enabled=false;
 private paused=true;
 private ducked=false;
 private volume=0.36;
 private noise:AudioBuffer|null=null;

 setScene(scene:MusicScene){if(this.scene===scene)return;this.scene=scene;this.currentStep=0;
  if(this.context)this.nextNote=this.context.currentTime+0.18;}
 getScene(){return this.scene;}
 getEnabled(){return this.enabled;}
 setEnabled(value:boolean){this.enabled=value;this.sync();}
 setVolume(v:number){this.volume=safe(v);this.sync();}
 setDucked(value:boolean){this.ducked=value;this.sync();}
 setPaused(value:boolean){this.paused=value;this.sync();}
 start(ctx:AudioContext):boolean{
  if(this.context===ctx&&this.output){this.sync();return true;}
  if(this.context)this.stop();
  try{
   this.context=ctx;
   // Precompute a tiny original noise texture for light rhythmic shakers.
   const texture=ctx.createBuffer(1,4096,ctx.sampleRate);
   const channel=texture.getChannelData(0);
   let seed=0x716e7a;
   for(let i=0;i<channel.length;i++){
     seed=(Math.imul(seed,1664525)+1013904223)>>>0;
     channel[i]=(seed/2147483648-1)*0.85;
   }
   this.noise=texture;
   const output=ctx.createGain();output.gain.value=0;
   const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=3200;filter.Q.value=0.34;
   const delay=ctx.createDelay(0.75);delay.delayTime.value=0.32;
   const wet=ctx.createGain();wet.gain.value=0.10;
   filter.connect(output);filter.connect(delay);delay.connect(wet);wet.connect(output);
   output.connect(ctx.destination);
   this.output=output;this.toneBus=filter;this.delay=delay;this.delayGain=wet;
   this.nextNote=ctx.currentTime+0.07;this.currentStep=0;
   this.timer=setInterval(()=>this.tick(),120);
   this.sync();return true;
  }catch{this.stop();return false;}
 }
 private sync(){
  const ctx=this.context, gain=this.output;
  if(!ctx||!gain)return;
  const level=this.enabled&&!this.paused?this.volume*0.48*(this.ducked?0.12:1):0;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setTargetAtTime(level,ctx.currentTime,this.ducked?0.09:0.3);
 }
 private pluck(hz:number,time:number,duration:number,voice:'pad'|'lead'|'bass'){
  const ctx=this.context,bus=this.toneBus;if(!ctx||!bus)return;
  const osc=ctx.createOscillator(),amp=ctx.createGain();
  const pad=voice==='pad',bass=voice==='bass';
  osc.type=pad?'sine':bass?'triangle':SCORES[this.scene].timbre;
  osc.frequency.setValueAtTime(hz,time);
  if(!pad&&!bass)osc.frequency.exponentialRampToValueAtTime(hz*0.997,time+Math.min(.14,duration*.45));
  amp.gain.setValueAtTime(0.0001,time);
  amp.gain.exponentialRampToValueAtTime(pad?0.029:bass?0.042:0.062,
    time+(pad?.16:bass?.015:.009));
  amp.gain.exponentialRampToValueAtTime(0.0001,time+duration);
  osc.connect(amp);amp.connect(bus);
  osc.start(time);osc.stop(time+duration+0.04);
  osc.onended=()=>{try{osc.disconnect();amp.disconnect();}catch{}};
 }
 private shimmer(time:number,root:number){
  const ctx=this.context,bus=this.toneBus;if(!ctx||!bus)return;
  // Two quiet plucked partials add a music-box character without harsh highs.
  this.pluck(root*2.01,time,.28,'lead');
  this.pluck(root*3.01,time+.015,.23,'pad');
 }
 private shaker(time:number,strong:boolean){
  const ctx=this.context,noise=this.noise,bus=this.toneBus;
  if(!ctx||!noise||!bus)return;
  const source=ctx.createBufferSource(),hi=ctx.createBiquadFilter(),amp=ctx.createGain();
  source.buffer=noise;
  hi.type='highpass';hi.frequency.value=strong?3500:5100;
  amp.gain.setValueAtTime(0.0001,time);
  amp.gain.exponentialRampToValueAtTime(strong?0.026:0.014,time+.006);
  amp.gain.exponentialRampToValueAtTime(0.0001,time+(strong?.09:.045));
  source.connect(hi);hi.connect(amp);amp.connect(bus);
  source.start(time);source.stop(time+.11);
  source.onended=()=>{try{source.disconnect();hi.disconnect();amp.disconnect();}catch{}};
 }
 private tick(){
  const ctx=this.context;if(!ctx||ctx.state!=='running'||!this.enabled||this.paused)return;
  const score=SCORES[this.scene],beat=60/score.tempo;
  if(this.nextNote<ctx.currentTime-0.4)this.nextNote=ctx.currentTime+.03;
  let scheduled=0;
  while(this.nextNote<ctx.currentTime+.25&&scheduled++<5){
   // Eighth-note steps; chord moves every four beats to create an actual
   // four-bar melody rather than a slow pair of repeating beeps.
   const step=this.currentStep++,sub=step%32;
   const chord=score.progression[Math.floor(sub/8)];
   const now=this.nextNote;
   if(sub%8===0){
    for(let i=0;i<3;i++)this.pluck(frequency(score.root,chord[i]),now,beat*3.6,'pad');
   }
   // A gentle bouncy bass ostinato, rooted in each world's harmony.
   if(sub%4===0)this.pluck(frequency(score.root,chord[0]-12),now,beat*.73,'bass');
   if(sub%4===3)this.pluck(frequency(score.root,chord[0]-5),now,beat*.37,'bass');
   if(step%2===0){
    const melodyIndex=Math.floor(step/2)%score.melody.length;
    const note=score.melody[melodyIndex];
    if(melodyIndex%8!==6)this.pluck(frequency(score.root,note+12),now,beat*(melodyIndex%4===0?.9:.55),'lead');
    if(melodyIndex%8===4)this.shimmer(now+.025,frequency(score.root,note));
   }
   // Soft offbeat shaker: provides playful groove but stays below speech.
   if(sub%2===1)this.shaker(now,sub%8===3);
   this.nextNote+=beat/2;
  }
 }

 stop(){
  if(this.timer!==null){clearInterval(this.timer);this.timer=null;}
  try{this.output?.disconnect();this.toneBus?.disconnect();this.delay?.disconnect();this.delayGain?.disconnect();}catch{}
  this.context=null;this.output=null;this.toneBus=null;this.delay=null;this.delayGain=null;this.noise=null;
 }
}
