/**
 * Browser-only, ON-DEVICE speech recognition.
 *
 * Key design rules:
 * 1. Never start non-local recognition or send audio to a remote service.
 * 2. stop() asks the recognizer to FINALIZE the collected words; abort() does not.
 * 3. Keep valid interim transcripts until the final result arrives (or the
 *    recognizer disconnects) rather than throwing away usable recognition.
 * 4. No persistent audio/transcript data. Results live for one button press.
 */
export type WebSpeechStatus='starting'|'microphone-ready'|'speech-detected'|'processing';
export type WebSpeechReason='no-speech'|'speech-unrecognized'|'permission-denied'|
 'microphone-error'|'language-pack'|'service-unavailable'|'not-started'|
 'timeout'|'cancelled'|'interim-result';
export type WebSpeechResult={
 kind:'recognized'|'no-speech'|'unrecognized'|'denied'|'unavailable'|'cancelled';
 alternatives:string[];mode:'web-local';reason?:WebSpeechReason;
 source?:'final'|'interim';
};
export type RecognitionItem=ArrayLike<{transcript:string}> & {isFinal?:boolean};
export type WebSpeechRecognitionInstance={
 lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;
 processLocally?:boolean;
 onstart:(()=>void)|null;onaudiostart:(()=>void)|null;onspeechstart:(()=>void)|null;
 onsoundstart:(()=>void)|null;onspeechend:(()=>void)|null;onnomatch:(()=>void)|null;
 onresult:((event:{resultIndex?:number;results:ArrayLike<RecognitionItem>})=>void)|null;
 onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;
 start():void;stop():void;abort():void;
};
export type WebSpeechConstructor={
 new():WebSpeechRecognitionInstance;
 available?:(options:{langs:string[];processLocally:boolean})=>Promise<string>;
 install?:(options:{langs:string[];processLocally:boolean})=>Promise<boolean>;
};

export function mapWebRecognitionError(code:string,speechDetected=false):Pick<WebSpeechResult,'kind'|'reason'>{
 switch(code){
  case 'not-allowed':return {kind:'denied',reason:'permission-denied'};
  case 'audio-capture':return {kind:'unavailable',reason:'microphone-error'};
  case 'language-not-supported':return {kind:'unavailable',reason:'language-pack'};
  case 'network':case 'service-not-allowed':case 'phrases-not-supported':
   return {kind:'unavailable',reason:'service-unavailable'};
  case 'aborted':return {kind:'cancelled',reason:'cancelled'};
  case 'no-speech':return speechDetected?{kind:'unrecognized',reason:'speech-unrecognized'}:
   {kind:'no-speech',reason:'no-speech'};
  default:return {kind:'unavailable',reason:'service-unavailable'};
 }
}

/** Run on the direct user tap, without awaiting permissions or other promises. */
export function beginWebLocalRecognition(
 Ctor:WebSpeechConstructor,timeoutMs:number,onStatus?:(status:WebSpeechStatus)=>void
):{result:Promise<WebSpeechResult>;cancel:()=>void}{
 let recognition:WebSpeechRecognitionInstance|undefined;
 let resolve!: (value:WebSpeechResult)=>void;
 const result=new Promise<WebSpeechResult>(r=>{resolve=r;});
 const timers=new Set<ReturnType<typeof setTimeout>>();
 let settled=false;
 let started=false,audioStarted=false,speechDetected=false,engineEnded=false,stopRequested=false;
 let provisional:string[]=[];

 const schedule=(fn:()=>void,ms:number)=>{
  const timer=setTimeout(()=>{timers.delete(timer);fn();},ms);
  timers.add(timer);
  return timer;
 };
 const unschedule=(timer:ReturnType<typeof setTimeout>|undefined)=>{
  if(timer!==undefined){clearTimeout(timer);timers.delete(timer);}
 };
 let startupTimer:ReturnType<typeof setTimeout>|undefined;
 let listeningTimer:ReturnType<typeof setTimeout>|undefined;
 let stopTimer:ReturnType<typeof setTimeout>|undefined;
 let finalTimer:ReturnType<typeof setTimeout>|undefined;
 let endTimer:ReturnType<typeof setTimeout>|undefined;
 const notify=(status:WebSpeechStatus)=>{if(!settled)onStatus?.(status);};
 const cleanup=()=>{
  for(const timer of timers)clearTimeout(timer);
  timers.clear();
  if(recognition){
   recognition.onstart=null;recognition.onaudiostart=null;
   recognition.onspeechstart=null;recognition.onsoundstart=null;
   recognition.onspeechend=null;recognition.onnomatch=null;
   recognition.onresult=null;recognition.onerror=null;recognition.onend=null;
  }
 };
 const finish=(kind:WebSpeechResult['kind'],reason?:WebSpeechReason,
  alternatives:string[]=[],source?:WebSpeechResult['source'])=>{
  if(settled)return;
  settled=true;cleanup();
  // Once a decision has been made, release the microphone immediately.
  if(started&&!engineEnded){
   try{recognition?.abort();}catch{}
  }
  resolve({
   kind,alternatives:alternatives.map(s=>s.trim()).filter(Boolean).slice(0,4),
   mode:'web-local',...(reason?{reason}:{}),...(source?{source}:{})
  });
 };
 const finalize=()=>{
  if(settled)return;
  if(provisional.length){
   finish('recognized','interim-result',provisional,'interim');
  }else if(speechDetected){
   finish('unrecognized','speech-unrecognized');
  }else if(audioStarted){
   finish('no-speech','no-speech');
  }else{
   finish('unavailable','not-started');
  }
 };
 const requestStop=()=>{
  if(settled||stopRequested||engineEnded)return;
  stopRequested=true;
  unschedule(listeningTimer);
  unschedule(stopTimer);
  notify('processing');
  // SpeechRecognition.stop() attempts to provide a FINAL transcript; abort()
  // cancels that pending transcript. Still cap processing to avoid a hung mic.
  try{recognition?.stop();}
  catch{
   finalize();return;
  }
  finalTimer=schedule(finalize,2500);
 };
 const cancel=()=>finish('cancelled','cancelled');

 try{
  recognition=new Ctor();
  if(!('processLocally' in recognition)){
   finish('unavailable','service-unavailable');
   return {result,cancel};
  }
  recognition.lang='en-US';
  recognition.continuous=false;
  recognition.interimResults=true;
  recognition.maxAlternatives=4;
  recognition.processLocally=true; // Strict no-cloud policy.
  recognition.onstart=()=>{started=true;notify('starting');};
  recognition.onaudiostart=()=>{
   if(!audioStarted){
    audioStarted=true;unschedule(startupTimer);
    listeningTimer=schedule(requestStop,Math.max(6500,timeoutMs));
   }
   notify('microphone-ready');
  };
  recognition.onsoundstart=()=>{
   // Some browsers omit audiostart. Do not let the initial permission timer
   // misdiagnose a running recognizer as a failed startup.
   if(!audioStarted){
    audioStarted=true;unschedule(startupTimer);
    listeningTimer=schedule(requestStop,Math.max(6500,timeoutMs));
   }
   notify('microphone-ready');
  };
  recognition.onspeechstart=()=>{speechDetected=true;notify('speech-detected');};
  recognition.onspeechend=()=>{
   notify('processing');
   // Short phrase (e.g. Hello!) finished. Allow a little silence before
   // requesting a final result; don't wait until a hard timeout then abort.
   unschedule(stopTimer);
   stopTimer=schedule(requestStop,550);
  };
  recognition.onnomatch=()=>{
   // The browser sometimes has an interim transcript before 'nomatch'.
   finalize();
  };
  recognition.onresult=event=>{
   // resultIndex may point to a later item while earlier results are still
   // present. Walk the full list so we never discard available final words.
   const candidates:Array<{values:string[];final:boolean}>=[];
   for(let i=0;i<event.results.length;i++){
    const item=event.results[i];
    if(!item)continue;
    const values=Array.from(item).map(a=>(a.transcript||'').trim())
     .filter(Boolean).slice(0,4);
    if(values.length)candidates.push({values,final:item.isFinal!==false});
   }
   if(!candidates.length)return;
   speechDetected=true;
   const finalCandidate=candidates.find(c=>c.final);
   if(finalCandidate){
    finish('recognized',undefined,finalCandidate.values,'final');
    return;
   }
   provisional=candidates[candidates.length-1].values;
   notify('speech-detected');
  };
  recognition.onerror=event=>{
   // A late no-speech/no-match is common on local recognizers after receiving
   // an interim transcript. Preserve recognized words rather than discarding.
   if(event.error==='no-speech'&&provisional.length){
    finalize();return;
   }
   const mapped=mapWebRecognitionError(event.error,speechDetected);
   finish(mapped.kind,mapped.reason);
  };
  recognition.onend=()=>{
   engineEnded=true;
   unschedule(startupTimer);unschedule(listeningTimer);unschedule(stopTimer);
   unschedule(finalTimer);
   // Some browsers issue onend just before a queued onresult callback.
   // Keep handlers around briefly; a final result always takes precedence.
   endTimer=schedule(finalize,650);
  };
  notify('starting');
  startupTimer=schedule(()=>{
   finish('unavailable','not-started');
  },20000);
  recognition.start();
  started=true;
 }catch{
  finish('unavailable','service-unavailable');
 }
 return {result,cancel};
}
