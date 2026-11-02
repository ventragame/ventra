/**
 * VENTRA original interactive score — no external tracks or copyrighted motifs.
 * WebAudio oscillator score: seven location-specific tonal palettes, low CPU.
 * Explicit opt-in only. The SoundService owns/resumes the shared AudioContext.
 */
export type MusicScene='archipelago'|'garden'|'animals'|'colors'|'numbers'|'food'|'family'|'sanctuary';
interface Score { root:number; tempo:number; progression:readonly number[][]; melody:readonly number[]; timbre:OscillatorType; }
const SCORES:Record<MusicScene,Score>={
  archipelago:{root:220,tempo:82,progression:[[0,4,7,11],[-3,0,4,7],[-5,-1,2,7],[-3,0,4,9]],melody:[7,11,12,7,4,7,11,9],timbre:'sine'},
  garden:{root:246.94,tempo:86,progression:[[0,4,7,12],[-5,-1,2,7],[-3,0,4,9],[-5,-1,4,7]],melody:[7,9,12,9,7,4,7,2],timbre:'triangle'},
  animals:{root:196,tempo:88,progression:[[0,4,7,12],[-5,-1,2,7],[-2,2,5,9],[-5,0,4,7]],melody:[7,9,12,9,7,4,2,4],timbre:'triangle'},
  colors:{root:261.63,tempo:91,progression:[[0,4,7,11],[-3,0,4,7],[-5,-1,2,7],[0,5,9,12]],melody:[12,9,7,11,14,12,9,7],timbre:'sine'},
  numbers:{root:220,tempo:96,progression:[[0,3,7,10],[-5,-2,2,7],[-3,0,3,7],[0,3,7,12]],melody:[0,7,12,7,10,12,15,12],timbre:'triangle'},
  food:{root:233.08,tempo:94,progression:[[0,4,7,12],[-5,-1,2,7],[-3,0,4,7],[-5,0,4,9]],melody:[7,12,9,7,4,7,9,12],timbre:'sine'},
  family:{root:196,tempo:78,progression:[[0,4,7,11],[-5,-1,2,7],[-3,0,4,7],[-5,-1,4,7]],melody:[7,4,2,4,7,9,7,4],timbre:'sine'},
  sanctuary:{root:174.61,tempo:77,progression:[[0,3,7,10],[-3,0,3,7],[-5,-2,2,7],[0,3,7,12]],melody:[12,10,7,3,7,10,12,15],timbre:'triangle'}
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
  const level=this.enabled&&!this.paused?this.volume*0.5*(this.ducked?0.18:1):0;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setTargetAtTime(level,ctx.currentTime,this.ducked?0.09:0.3);
 }
 private pluck(hz:number,time:number,duration:number,voice:'pad'|'lead'){
  const ctx=this.context,bus=this.toneBus;if(!ctx||!bus)return;
  const osc=ctx.createOscillator(),amp=ctx.createGain();
  const pad=voice==='pad';
  osc.type=pad?'sine':SCORES[this.scene].timbre;
  osc.frequency.setValueAtTime(hz,time);
  amp.gain.setValueAtTime(0.0001,time);
  amp.gain.exponentialRampToValueAtTime(pad?0.032:0.049,time+(pad?0.31:0.022));
  amp.gain.exponentialRampToValueAtTime(0.0001,time+duration);
  osc.connect(amp);amp.connect(bus);
  osc.start(time);osc.stop(time+duration+0.035);
  osc.onended=()=>{try{osc.disconnect();amp.disconnect();}catch{}};
 }
 private tick(){
  const ctx=this.context;if(!ctx||ctx.state!=='running'||!this.enabled||this.paused)return;
  const score=SCORES[this.scene],beat=60/score.tempo;
  if(this.nextNote<ctx.currentTime-0.35)this.nextNote=ctx.currentTime+0.025;
  let scheduled=0;
  while(this.nextNote<ctx.currentTime+0.3&&scheduled++<5){
   const step=this.currentStep++, beatIndex=step%16, chord=score.progression[Math.floor(beatIndex/4)];
   const now=this.nextNote;
   if(beatIndex%4===0){
    // Four closely voiced soft pads; no continuous oscillators between notes.
    for(let i=0;i<3;i++)this.pluck(frequency(score.root,chord[i]),now,beat*3.5,'pad');
   }
   if(step%2===0){
    const note=score.melody[Math.floor(step/2)%score.melody.length];
    this.pluck(frequency(score.root,note+12),now,beat*0.72,'lead');
   }
   this.nextNote+=beat;
  }
 }
 stop(){
  if(this.timer!==null){clearInterval(this.timer);this.timer=null;}
  try{this.output?.disconnect();this.toneBus?.disconnect();this.delay?.disconnect();this.delayGain?.disconnect();}catch{}
  this.context=null;this.output=null;this.toneBus=null;this.delay=null;this.delayGain=null;
 }
}
