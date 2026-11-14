/**
 * Small-footprint activity detection for short English speaking turns.
 *
 * The previous worklet sent 4096-frame blocks (~256ms at 16kHz), which
 * smeared very short "yes" / "no" phonemes across long silences. This
 * helper is deliberately NOT a speech recognizer: acoustic energy can
 * only decide when to ask sherpa-onnx for a transcript, never whether
 * a learner answered a task correctly.
 */
export const SHERPA_AUDIO_WORKLET_FRAMES=1024;
export const SHERPA_MIN_VOICED_MS=96;
export const SHERPA_VOICE_RMS_THRESHOLD=0.010;

export type ShortVoiceState={voicedMs:number;detected:boolean};
export function advanceShortVoice(
 current:ShortVoiceState,
 samples:Float32Array,
 sampleRate:number
):ShortVoiceState{
 if(samples.length===0||!Number.isFinite(sampleRate)||sampleRate<=0)return current;
 let sum=0;
 for(let i=0;i<samples.length;i++)sum+=samples[i]*samples[i];
 const rms=Math.sqrt(sum/samples.length);
 const durationMs=Math.min(320,1000*samples.length/sampleRate);
 const voicedMs=rms>SHERPA_VOICE_RMS_THRESHOLD
  ?Math.min(1000,current.voicedMs+durationMs)
  :Math.max(0,current.voicedMs-durationMs);
 return {
  voicedMs,
  detected:current.detected||voicedMs>=SHERPA_MIN_VOICED_MS
 };
}
