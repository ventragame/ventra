import { soundService } from './SoundService';
import {EventBus} from '@/lib/game/EventBus';

/**
 * Original lightweight scene chimes. User gesture only; no autoplay,
 * recording, network traffic, or bundled copyrighted music.
 * Stops on hidden tab, global mute and unmount.
 */
export class WorldAmbience {
  private ctx:AudioContext|null=null;
  private timer:ReturnType<typeof setInterval>|null=null;
  private active=false;
  private step=0;
  private readonly onMute=(muted:boolean)=>{if(muted)this.stop();};
  private readonly onVisibility=()=>{if(document.hidden)this.stop();};
  get isPlaying(){return this.active;}
  start():boolean {
    if(this.active)return true;
    if(typeof window==='undefined'||soundService.getMuted())return false;
    const AudioCtor=window.AudioContext;
    if(!AudioCtor)return false;
    try {
      this.ctx=new AudioCtor({latencyHint:'playback'});
      void this.ctx.resume().catch(()=>this.stop());
      this.active=true;
      EventBus.on('MUTE_STATE_CHANGED',this.onMute);
      document.addEventListener('visibilitychange',this.onVisibility);
      this.chime();
      this.timer=setInterval(()=>{
        if(document.hidden||soundService.getMuted()){this.stop();return;}
        this.chime();
      },5800);
      return true;
    }catch{this.stop();return false;}
  }
  private chime():void {
    const ctx=this.ctx;
    if(!ctx||!this.active||ctx.state==='closed')return;
    try{
      const time=ctx.currentTime+.02;
      // Two soft rising notes and a distant bird call; an original motif.
      const pitches=[523.25,659.25,783.99,587.33,698.46];
      const note=pitches[this.step++%pitches.length];
      // The optional chimes sit well behind the main soundtrack when both play.
      const gainFactor=soundService.getSettings().musicEnabled?0.26:1;
      for(let n=0;n<2;n++){
        const osc=ctx.createOscillator(),gain=ctx.createGain();
        osc.type=n?'sine':'triangle';
        osc.frequency.setValueAtTime(note*(n?1.5:1),time+n*.17);
        gain.gain.setValueAtTime(0.0001,time+n*.17);
        gain.gain.exponentialRampToValueAtTime((n?.012:.021)*gainFactor,time+n*.17+.07);
        gain.gain.exponentialRampToValueAtTime(.0001,time+n*.17+1.1);
        osc.connect(gain);gain.connect(ctx.destination);
        osc.start(time+n*.17);osc.stop(time+n*.17+1.15);
        osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch{}};
      }
    }catch{this.stop();}
  }
  stop():void {
    this.active=false;
    if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this.onVisibility);
    EventBus.off('MUTE_STATE_CHANGED',this.onMute);
    if(this.timer!==null){clearInterval(this.timer);this.timer=null;}
    const ctx=this.ctx;this.ctx=null;
    if(ctx && ctx.state!=='closed')void ctx.close().catch(()=>{});
  }
}
