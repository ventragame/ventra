'use client';
import React,{useEffect,useRef} from 'react';
import type {SpeechCapability} from '@/lib/speech/childSpeech';

type Props={capability:SpeechCapability;activeCapability:SpeechCapability;diagnostic:string;diagnosticCode:string;
 busy:boolean;listening:boolean;independentEnabled:boolean;independentConfigured:boolean;
 onClose:()=>void;onRecheck:()=>void;onSelectBrowser:()=>void;onSelectLocal:()=>void;
 onChooseOffline:()=>void;onInstall:()=>void;onToggleIndependent:()=>void};
const MODE:Record<SpeechCapability['mode'],string>={
 'native-local':'Telefonun cihaz içi tanıması','sherpa-local':'Ventra cihaz içi tanıma',
 'web-local':'Tarayıcı cihaz içi tanıması','web-browser':'Tarayıcı konuşma hizmeti',
 'server-stt':'Yetişkin hesabıyla bağımsız hizmet','practice':'Ses algılama (kelimeleri tanımaz)',none:'Kullanılamıyor'
};
/** Adult-only diagnostics; hidden and unmounted during child play. */
export function HarborSpeechAdultPanel(props:Props){
 const {capability,activeCapability,diagnostic,diagnosticCode,busy,listening,independentEnabled,
  independentConfigured,onClose,onRecheck,onSelectBrowser,onSelectLocal,onChooseOffline,onInstall,onToggleIndependent}=props;
 const closeRef=useRef<HTMLButtonElement>(null);
 const callbackRef=useRef(onClose);callbackRef.current=onClose;
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  closeRef.current?.focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();callbackRef.current();return;}
   if(event.key!=='Tab')return;
   const dialog=closeRef.current?.closest('[role="dialog"]');
   const nodes=dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),summary,[href],input:not(:disabled)');
   if(!nodes?.length)return;
   const first=nodes[0],last=nodes[nodes.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',onKey);
  return()=>{document.removeEventListener('keydown',onKey);previous?.focus();};
 },[]);
 const disabled=busy||listening;
 return <div className="harbor-adult-overlay">
  <section className="harbor-adult-dialog" role="dialog" aria-modal="true" aria-labelledby="harbor-adult-title" aria-describedby="harbor-adult-description">
   <header className="harbor-adult-header">
    <div><small>VENTRA · YETİŞKİN ALANI</small><h2 id="harbor-adult-title">Konuşma ve ses ayarları</h2>
     <p id="harbor-adult-description">Bu alan ebeveynler ve teknik destek içindir. Çocuk dilediği zaman cevaplara dokunarak oynayabilir.</p></div>
    <button type="button" ref={closeRef} className="harbor-adult-close" onClick={onClose} aria-label="Ses ayarlarını kapat">×</button>
   </header>
   <section className="harbor-adult-card"><h3>Tanıma durumu</h3>
    <p><strong>Seçili motor:</strong> {MODE[activeCapability.mode]}</p><p>{activeCapability.message}</p>
    {diagnostic&&<p className="harbor-adult-status" role="status">{diagnostic}</p>}
   </section>
   <section className="harbor-adult-card"><h3>Tanıma seçenekleri</h3>
    <p>Cihaz içi tanıma önceliklidir. Tarayıcı sağlayıcısı sesi cihaz dışında işleyebilir. Başarısızlıkta başka bir motora otomatik geçiş yapılmaz.</p>
    <div className="harbor-adult-actions">
     <button type="button" disabled={disabled} onClick={onRecheck}>↻ Yeniden kontrol et</button>
     {capability.mode!=='sherpa-local'&&<button type="button" disabled={disabled} onClick={onSelectLocal}>Ventra cihaz içi motoru</button>}
     {capability.mode==='sherpa-local'&&<button type="button" disabled={disabled} onClick={onSelectBrowser}>Tarayıcı motorunu seç</button>}
     {capability.localAvailable&&capability.mode==='web-browser'&&<button type="button" disabled={disabled} onClick={onChooseOffline}>Tarayıcıda yerel İngilizce</button>}
     {capability.installable&&<button type="button" disabled={disabled} onClick={onInstall}>⬇ İngilizce ses paketini kur</button>}
    </div>
   </section>
   {independentConfigured&&<section className="harbor-adult-card harbor-adult-server">
    <h3>Bağımsız konuşma hizmeti</h3>
    <p>Bu isteğe bağlı hizmette kısa ses kaydı Groq sağlayıcısına iletilebilir. Üçüncü taraf kendi koşullarına göre işlem yapabilir. Yalnızca yetişkin oturumuyla ve açık seçiminizle etkinleşir. Ventra ses kayıtlarını veya konuşma metnini kalıcı olarak saklamaz.</p>
    <button type="button" disabled={disabled} onClick={onToggleIndependent}>{independentEnabled?'Bağımsız hizmeti kapat':'Bağımsız konuşma tanımayı etkinleştir'}</button>
   </section>}
   <details className="harbor-adult-technical"><summary>Teknik ayrıntılar ve hata kodları</summary>
    <p>Bu bilgiler hata tanısı içindir; ses veya konuşma metni içermez.</p>
    <code>{'mode='+activeCapability.mode+', localAvailable='+Boolean(capability.localAvailable)}</code>
    {diagnosticCode&&<code>{diagnosticCode}</code>}
   </details>
   <p className="harbor-adult-note">Bu arayüzdeki yetişkin kontrolü kimlik doğrulaması değildir. Bağımsız hizmet ayrıca yetişkin oturumu gerektirir.</p>
  </section>
 </div>;
}
