/**
 * Original non-verbal child-friendly feedback motifs.
 * Short, harmonically related musical gestures rather than a generic WAV beep.
 * Does not capture input, call servers, or use external/licensed audio.
 */
export type RewardEvent='correct'|'gentle_retry'|'fanfare';
export const REWARD_NOTES:Readonly<Record<RewardEvent,readonly number[]>>={
 correct:[659.25,830.61,987.77],          // positive bright ascent
 gentle_retry:[392,349.23,440],         // gentle encouragement, never buzzer-like
 fanfare:[523.25,659.25,783.99,1046.5,1318.51,1567.98]
};
export function rewardDuration(kind:RewardEvent):number{
 return kind==='fanfare'?1.55:kind==='correct'?0.51:0.49;
}
export function playRewardSound(ctx:AudioContext,kind:RewardEvent,volume:number):boolean{
 if(ctx.state!=='running'||!Number.isFinite(volume)||volume<=0)return false;
 const gainLevel=Math.min(1,Math.max(0,volume))*0.58;
 if(!gainLevel)return false;
 try{
  const output=ctx.createGain();
  output.gain.value=gainLevel;
  const lowpass=ctx.createBiquadFilter();
  lowpass.type='lowpass';lowpass.frequency.value=3600;lowpass.Q.value=0.38;
  lowpass.connect(output);output.connect(ctx.destination);
  const start=ctx.currentTime+0.008;
  let running=0;
  const notes=REWARD_NOTES[kind];
  const gap=kind==='fanfare'?.145:kind==='correct'?.115:.16;
  const duration=kind==='fanfare'?.49:kind==='correct'?.24:.26;
  notes.forEach((hz,i)=>{
   const time=start+i*gap,end=time+duration;
   const oscillator=ctx.createOscillator(),amp=ctx.createGain();
   oscillator.type=kind==='gentle_retry'?'sine':i%2?'triangle':'sine';
   oscillator.frequency.setValueAtTime(hz,time);
   oscillator.frequency.exponentialRampToValueAtTime(hz*1.002,time+.08);
   amp.gain.setValueAtTime(.0001,time);
   amp.gain.exponentialRampToValueAtTime(kind==='fanfare'?.13:.16,time+.014);
   amp.gain.exponentialRampToValueAtTime(.0001,end);
   oscillator.connect(amp);amp.connect(lowpass);
   running++;
   oscillator.onended=()=>{
    try{oscillator.disconnect();amp.disconnect();}catch{}
    if(--running===0){try{lowpass.disconnect();output.disconnect();}catch{}}
   };
   oscillator.start(time);oscillator.stop(end+.025);
  });
  return true;
 }catch{return false;}
}
