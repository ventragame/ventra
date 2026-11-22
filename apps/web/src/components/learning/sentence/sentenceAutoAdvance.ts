/**
 * Cümle Meydanı: after a solved sentence the game says it in English and then
 * moves on by itself. A fixed timer followed by cancelSpeech() cut long A2
 * sentences off mid-word (a 12–13 word sentence needs ~5 s at rate 0.86).
 * This waits for the voice to finish, keeps the scene visible for at least
 * `minDwellMs`, and never strands the child: if the voice is unavailable the
 * game advances after `silentDelayMs`, and if speech events never arrive
 * (some WebViews) a word-scaled fallback still advances.
 *
 * The game keeps its own single timer, guards and checkpoint logic:
 * `setTimer` must replace that timer (clear the previous one first) and
 * `stillWaiting` must turn false once the child leaves or the round resets.
 */
export interface SpokenAdvanceInput{
 /** Starts the English playback; returns false when no voice can play. */
 speak:(events:{onEnd:()=>void;onError:()=>void})=>boolean;
 wordCount:number;
 /** Shortest time the solved scene stays on screen after the correct answer. */
 minDwellMs:number;
 /** Delay when the sentence cannot be spoken at all (time to read it). */
 silentDelayMs:number;
 setTimer:(run:()=>void,delayMs:number)=>void;
 stillWaiting:()=>boolean;
 advance:()=>void;
 now?:()=>number;
}
/** Upper bound for a voice that never reports its end; scales with sentence length. */
export function spokenAdvanceFallbackMs(wordCount:number):number{
 return Math.max(3600,Math.min(10500,1300+wordCount*490));
}
export function advanceAfterSpokenSentence(input:SpokenAdvanceInput):void{
 const now=input.now??Date.now;
 const startedAt=now();
 let scheduled=false;
 const advanceAfter=(delayMs:number)=>{
  if(scheduled||!input.stillWaiting())return;
  scheduled=true;
  input.setTimer(()=>{if(input.stillWaiting())input.advance();},delayMs);
 };
 // A voice that fails while speak() is still running (no usable engine) is
 // treated like no voice at all: the child gets the reading delay.
 let starting=true,failedAtStart=false;
 const afterVoice=()=>{
  if(starting){failedAtStart=true;return;}
  advanceAfter(Math.max(650,input.minDwellMs-(now()-startedAt)));
 };
 const played=input.speak({onEnd:afterVoice,onError:afterVoice});
 starting=false;
 if(!played||failedAtStart){advanceAfter(input.silentDelayMs);return;}
 input.setTimer(()=>advanceAfter(750),spokenAdvanceFallbackMs(input.wordCount));
}
