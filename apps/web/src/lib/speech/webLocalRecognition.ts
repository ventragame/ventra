/** Web Speech local-only adapter. No audio, phrases or transcripts are persisted.
 * Distinguishes microphone/OS/browser errors from real silence. */
export type WebSpeechStatus='starting'|'microphone-ready'|'speech-detected'|'processing';
export type WebSpeechReason='no-speech'|'speech-unrecognized'|'permission-denied'|'microphone-error'|'language-pack'|'service-unavailable'|'not-started'|'timeout'|'cancelled';
export type WebSpeechResult={
 kind:'recognized'|'no-speech'|'unrecognized'|'denied'|'unavailable'|'cancelled';
 alternatives:string[];mode:'web-local';reason?:WebSpeechReason;
};
export type RecognitionItem=ArrayLike<{transcript:string}> & {isFinal?:boolean};
export type WebSpeechRecognitionInstance={
 lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;processLocally?:boolean;
 onstart:(()=>void)|null;onaudiostart:(()=>void)|null;onspeechstart:(()=>void)|null;
 onsoundstart:(()=>void)|null;onspeechend:(()=>void)|null;onnomatch:(()=>void)|null;
 onresult:((event:{resultIndex?:number;results:ArrayLike<RecognitionItem>})=>void)|null;
 onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;
 start():void;abort():void;
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
export function beginWebLocalRecognition(
 Ctor:WebSpeechConstructor,timeoutMs:number,onStatus?:(status:WebSpeechStatus)=>void
):{result:Promise<WebSpeechResult>;cancel:()=>void}{
 let recognition:WebSpeechRecognitionInstance;
 let resolve!: (result:WebSpeechResult)=>void;
 const result=new Promise<WebSpeechResult>(r=>{resolve=r;});
 let settled=false,audioStarted=false,speechDetected=false;
 let startingTimer:ReturnType<typeof setTimeout>|null=null;
 let hearingTimer:ReturnType<typeof setTimeout>|null=null;
 let tailTimer:ReturnType<typeof setTimeout>|null=null;
 const notify=(status:WebSpeechStatus)=>{if(!settled)onStatus?.(status);};
 const clear=()=>{
  if(startingTimer)clearTimeout(startingTimer);
  if(hearingTimer)clearTimeout(hearingTimer);
  if(tailTimer)clearTimeout(tailTimer);
  if(recognition){
   recognition.onstart=null;recognition.onaudiostart=null;
   recognition.onspeechstart=null;recognition.onsoundstart=null;
   recognition.onspeechend=null;recognition.onnomatch=null;
   recognition.onresult=null;recognition.onerror=null;recognition.onend=null;
  }
 };
 const finish=(kind:WebSpeechResult['kind'],reason?:WebSpeechReason,alternatives:string[]=[])=>{
  if(settled)return;
  settled=true;clear();
  resolve({kind,reason,alternatives:alternatives.filter(Boolean).slice(0,4),mode:'web-local'});
 };
 const fail=(code:string)=>{const e=mapWebRecognitionError(code,speechDetected);
  finish(e.kind,e.reason);
 };
 const cancel=()=>{try{recognition?.abort();}catch{}
  finish('cancelled','cancelled');
 };
 try{
  recognition=new Ctor();
  if(!('processLocally' in recognition)){
   finish('unavailable','service-unavailable');
   return {result,cancel};
  }
  recognition.lang='en-US';
  recognition.continuous=false;
  // Some engines deliver only interim output while the child is speaking.
  // It is useful for diagnosing speech detection; it is NOT scored as final.
  recognition.interimResults=true;
  recognition.maxAlternatives=4;
  recognition.processLocally=true; // Never allow a remote recognition fallback.
  recognition.onstart=()=>notify('starting');
  recognition.onaudiostart=()=>{
   audioStarted=true;
   if(startingTimer){clearTimeout(startingTimer);startingTimer=null;}
   notify('microphone-ready');
   hearingTimer=setTimeout(()=>{
    try{recognition.abort();}catch{}
    finish(speechDetected?'unrecognized':'no-speech',speechDetected?'speech-unrecognized':'timeout');
   },Math.max(5000,timeoutMs));
  };
  recognition.onsoundstart=()=>{if(!audioStarted)audioStarted=true;notify('microphone-ready');};
  recognition.onspeechstart=()=>{speechDetected=true;notify('speech-detected');};
  recognition.onspeechend=()=>notify('processing');
  recognition.onnomatch=()=>finish('unrecognized','speech-unrecognized');
  recognition.onresult=event=>{
   const results=event.results;
   for(let i=event.resultIndex??0;i<results.length;i++){
    const item=results[i];
    if(!item)continue;
    const alternatives=Array.from(item).map(a=>(a.transcript||'').trim()).filter(Boolean).slice(0,4);
    if(!alternatives.length)continue;
    speechDetected=true;
    if(item.isFinal!==false){finish('recognized',undefined,alternatives);return;}
    notify('speech-detected');
   }
  };
  recognition.onerror=event=>fail(event.error);
  recognition.onend=()=>{
   // Some engines deliver result and end in adjacent turns of the event loop.
   // Don't pre-empt the result by immediately treating end as silence.
   tailTimer=setTimeout(()=>{
    finish(speechDetected?'unrecognized':audioStarted?'no-speech':'unavailable',
     speechDetected?'speech-unrecognized':audioStarted?'no-speech':'not-started');
   },220);
  };
  notify('starting');
  // Permission dialog and engine startup can be much slower than actual speech.
  startingTimer=setTimeout(()=>{
   try{recognition.abort();}catch{}
   finish('unavailable','not-started');
  },20000);
  recognition.start(); // Called synchronously from the microphone button gesture.
 }catch{
  finish('unavailable','service-unavailable');
 }
 return {result,cancel};
}
