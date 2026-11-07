'use client';
import React from 'react';
import type {WishFood,WishGuest,WishChapter} from '@/lib/learning/wishFestivalEngine';
import {WISH_FOODS,WISH_GUESTS} from '@/lib/learning/wishFestivalEngine';

export function WishFruitArtwork({food,size=58}: {food:WishFood;size?:number}){
 const gradientId='wf-fruit-'+React.useId().replace(/:/g,'');
 const base=WISH_FOODS.find(f=>f.id===food)!;
 const grape=food==='grapes',banana=food==='bananas',carrot=food==='carrots',
  orange=food==='oranges',pear=food==='pears',strawberry=food==='strawberries',
  peach=food==='peaches',apple=food==='apples';
 return <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={base.label}
  xmlns="http://www.w3.org/2000/svg" className="wf-fruit-art">
  <defs>
   <radialGradient id={gradientId} cx=".27" cy=".19" r=".9">
    <stop stopColor="#fff7d9" stopOpacity=".83"/>
    <stop offset=".22" stopColor={base.color}/>
    <stop offset="1" stopColor={base.color} stopOpacity=".85"/>
   </radialGradient>
  </defs>
  <ellipse cx="50" cy="89" rx="34" ry="6" fill="#25475b" opacity=".18"/>
  {banana?<g>
   <path d="M18 27Q7 87 76 78Q94 69 92 50Q69 80 45 64Q29 55 27 27Z"
    fill="#f9d77e" stroke="#c88f58" strokeWidth="3"/>
   <path d="M26 31Q23 81 77 75" fill="none" stroke="#fff3b5" strokeWidth="7" strokeLinecap="round"/>
   <path d="M20 26l7-3m61 29 4-4" stroke="#8d7952" strokeWidth="6" strokeLinecap="round"/>
  </g>:carrot?<g>
   <path d="M39 24Q15 15 22 7Q42 7 48 26Q42 5 55 7Q65 15 53 29Q69 6 78 18Q70 34 55 38"
    fill="#65ba82" stroke="#4f996b" strokeWidth="3"/>
   <path d="M27 33Q45 24 70 36Q62 62 48 92Q26 72 27 33Z"
    fill={'url(#'+gradientId+')'} stroke="#c7794d" strokeWidth="3"/>
   <path d="M34 44l17 5m-17 13 11 4" stroke="#ffdea6" strokeWidth="4" strokeLinecap="round"/>
  </g>:grape?<g>
   <path d="M50 22l4-15m-4 16q-10-12-20-8" stroke="#5a8a66" strokeWidth="6" fill="none" strokeLinecap="round"/>
   {[[34,40],[55,38],[24,56],[46,57],[67,55],[36,74],[58,72],[48,88]].map(([x,y],i)=>
    <circle key={i} cx={x} cy={y} r="15" fill={'url(#'+gradientId+')'} stroke="#7662a3" strokeWidth="2"/>)}
   <ellipse cx="36" cy="37" rx="7" ry="4" fill="#fff" opacity=".4"/>
  </g>:strawberry?<g>
   <path d="M28 29Q14 45 33 75Q46 94 53 90Q85 63 75 33Q57 21 28 29Z"
    fill={'url(#'+gradientId+')'} stroke="#ba556d" strokeWidth="3"/>
   <path d="M20 29l19-12 12 12 14-13 18 12-17 6-12-2-12 4-13-3Z"
    fill="#70bc80" stroke="#549969" strokeWidth="3"/>
   {[[36,46],[56,44],[69,55],[44,63],[53,76],[29,58]].map(([x,y],i)=>
    <path key={i} d={'M'+x+' '+y+'l3 5'} stroke="#ffe5b5" strokeWidth="3" strokeLinecap="round"/>)}
  </g>:pear?<g>
   <path d="M44 22Q50 11 61 23Q62 39 77 52Q86 70 71 84Q51 97 30 84Q15 69 25 53Q38 41 44 22Z"
    fill={'url(#'+gradientId+')'} stroke="#759e58" strokeWidth="3"/>
   <path d="M50 23L54 9m-3 7q15-10 23-2" stroke="#5f8555" strokeWidth="5" fill="none" strokeLinecap="round"/>
   <path d="M34 57q-8 20 10 27" stroke="#f5f0b1" strokeWidth="6" fill="none" opacity=".55" strokeLinecap="round"/>
  </g>:<g>
   <path d={orange?'M25 39Q29 19 52 20Q80 19 83 48Q91 78 61 87Q34 95 20 70Q13 54 25 39Z':
    peach?'M25 40Q31 23 48 27Q62 19 75 34Q94 58 76 80Q58 97 47 86Q22 95 17 69Q11 54 25 40Z':
    'M25 40Q15 24 35 27Q51 24 52 30Q67 18 79 37Q91 59 76 82Q62 94 51 86Q36 97 22 77Q12 62 25 40Z'}
    fill={'url(#'+gradientId+')'} stroke={orange?'#cb8355':peach?'#dc8873':'#b65469'} strokeWidth="3"/>
   <path d="M50 27L54 12q18-9 28-1q-11 17-29 12" stroke="#669c6f" strokeWidth="5"
    fill="#7bb883" strokeLinecap="round"/>
   <path d="M27 49Q27 36 43 34" fill="none" stroke="#fff6d7" strokeWidth="7"
    strokeLinecap="round" opacity=".56"/>
   {peach&&<path d="M57 31Q40 50 51 86" stroke="#ca8268" strokeWidth="3" fill="none" opacity=".5"/>}
   {orange&&<g stroke="#ffe0a6" opacity=".4"><path d="M43 33l9 9m16-2-8 11m-18 22-8-11" strokeWidth="2"/></g>}
  </g>}
 </svg>;
}
function GuestPortrait({guest,large=false}: {guest:WishGuest;large?:boolean}){
 const profile=WISH_GUESTS.find(c=>c.id===guest)!;
 const fox=guest==='leo',rabbit=guest==='mila',bear=guest==='niko',cat=guest==='luna';
 return <svg viewBox="0 0 220 260" width={large?204:125} height={large?239:145}
  role="img" aria-label={profile.name+' festival konuğu'} className="wf-guest-portrait">
  <defs><linearGradient id={'wf-guestshade-'+guest} x1="0" y1="0" x2="1" y2="1">
   <stop stopColor="#fff8d7"/><stop offset=".43" stopColor={profile.accent}/>
   <stop offset="1" stopColor={profile.accent}/></linearGradient></defs>
  <ellipse cx="110" cy="252" rx="82" ry="7" fill="#1d354c" opacity=".23"/>
  <path d="M24 250q7-91 83-90q84 0 90 90Z" fill={fox?'#568e99':rabbit?'#aa7eaa':bear?'#7d9d93':'#bd819e'}
   stroke="#fff0d4" strokeWidth="7"/>
  <path d="M85 181l24 20 24-20" fill="none" stroke="#fff8e7" strokeWidth="8"/>
  {rabbit?<g><ellipse cx="68" cy="41" rx="19" ry="54" fill="#efdad8" stroke="#a47f95" strokeWidth="6" transform="rotate(-12 68 41)"/>
   <ellipse cx="154" cy="41" rx="19" ry="54" fill="#efdad8" stroke="#a47f95" strokeWidth="6" transform="rotate(12 154 41)"/>
   <ellipse cx="68" cy="37" rx="8" ry="39" fill="#eda9bd" transform="rotate(-12 68 37)"/>
   <ellipse cx="154" cy="37" rx="8" ry="39" fill="#eda9bd" transform="rotate(12 154 37)"/></g>:
   fox?<g><path d="M34 83L51 6l62 51M113 56l62-50 14 78" fill="#ecbb8d" stroke="#ad7874" strokeWidth="7"/>
    <path d="M52 41l5-22 24 27m57 1 32-28 4 25" fill="#eea1b1"/></g>:
   cat?<g><path d="M40 96L50 21 97 57 123 57 169 21 181 101Z"
    fill="#b4a1ca" stroke="#947eaa" strokeWidth="7"/>
    <path d="M55 43l9 28 21-7m71-21-9 27-19-5" fill="#dca6c0"/></g>:
   <g><circle cx="52" cy="73" r="27" fill="#aad0bb" stroke="#6c9f8e" strokeWidth="6"/>
    <circle cx="168" cy="73" r="27" fill="#aad0bb" stroke="#6c9f8e" strokeWidth="6"/></g>}
  <ellipse cx="111" cy="110" rx="83" ry="83" fill={'url(#wf-guestshade-'+guest+')'}
   stroke={bear?'#669b90':'#ac8292'} strokeWidth="7"/>
  {fox&&<path d="M44 135l-30 12 38 3m126-14 30 12-39 5" fill="#ffefd5" stroke="#b78e86" strokeWidth="4"/>}
  <ellipse cx="72" cy="113" rx="10" ry="13" fill="#354c61"/>
  <ellipse cx="149" cy="113" rx="10" ry="13" fill="#354c61"/>
  <circle cx="76" cy="108" r="3.5" fill="#fff"/>
  <circle cx="153" cy="108" r="3.5" fill="#fff"/>
  <ellipse cx="111" cy="145" rx="34" ry="24" fill="#fff1df"/>
  <path d="M101 138q10-8 21 0q-11 15-21 0" fill="#aa7089"/>
  <path d="M110 150q-7 9-15 2m15-2q8 9 15 2" stroke="#885f74" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
  <circle cx="50" cy="145" r="9" fill="#ee9aa5" opacity=".6"/>
  <circle cx="173" cy="145" r="9" fill="#ee9aa5" opacity=".6"/>
  <path d="M110 175l-11 23 13 20 13-20Z" fill="#f7d6ae"/>
  <path d="M65 218l-29 20m119-20 29 20" stroke="#f5e1c6" strokeWidth="13" strokeLinecap="round"/>
 </svg>;
}
export function WishFestivalStage({chapter,guest,chosen,secondary,served,avoided=false,dialogue,
  onFood,disabled,activeChoice,avoidPrimary=false,ariaLabel}:{
  chapter:WishChapter;guest:WishGuest;chosen:WishFood|null;secondary:WishFood|null;
  served:boolean;avoided?:boolean;avoidPrimary?:boolean;dialogue:string;activeChoice:boolean;disabled:boolean;
  onFood?:(id:WishFood)=>void;ariaLabel?:string;
}){
 const profile=WISH_GUESTS.find(g=>g.id===guest)!;
 return <div className={'wf-world wf-world-'+chapter+(served?' wf-served':'')}
  role="group" aria-label={ariaLabel??'Festival pazarında sekiz yiyecek tezgahı ve misafirler'}>
  <div className="wf-stage">
   <svg viewBox="0 0 1200 660" xmlns="http://www.w3.org/2000/svg" className="wf-stage-art"
    aria-label="Işıltılı şato meydanı, üç festival tezgâhı, renkli fenerler ve bulutlar" role="img">
    <defs>
     <linearGradient id="wf-skylight" x1="0" y1="0" x2=".8" y2="1">
      <stop stopColor="#304a8b"/><stop offset=".45" stopColor="#8295c8"/><stop offset="1" stopColor="#f8bbad"/>
     </linearGradient>
     <radialGradient id="wf-sunglow"><stop stopColor="#fff4d8" stopOpacity=".9"/>
      <stop offset="1" stopColor="#fff4d8" stopOpacity="0"/></radialGradient>
     <linearGradient id="wf-tent" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff2d4"/>
      <stop offset=".45" stopColor="#f1baac"/><stop offset="1" stopColor="#ba81a4"/></linearGradient>
     <linearGradient id="wf-counter" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d9a783"/>
      <stop offset="1" stopColor="#735c82"/></linearGradient>
     <pattern id="wf-stones" width="80" height="42" patternUnits="userSpaceOnUse">
      <path d="M0 0H80M40 0V21M0 21H80M0 21V42M80 21V42" fill="none" stroke="#f4d6ad" strokeOpacity=".23" strokeWidth="3"/>
     </pattern>
     <filter id="wf-shadow"><feDropShadow dx="0" dy="9" stdDeviation="11" floodColor="#233356" floodOpacity=".45"/></filter>
    </defs>
    {/* V6 market painting replaces the prior generic vector square.
       Basket, character, choices and spoken dialogue remain live HTML/SVG. */}
    <image href="/assets/sentence-plaza/scenes-v6/scene-5-market.webp"
      x="0" y="0" width="1200" height="660" preserveAspectRatio="xMidYMid slice"/>
    {served&&<g className="wf-v6-reward" aria-hidden="true">
      {Array.from({length:12},(_,i)=>{
       const x=130+(i*233)%1000,y=115+(i*107)%320;
       return <path key={i} d={`M${x-9} ${y}h18M${x} ${y-9}v18`}
        stroke={i%2===0?'#ffde91':'#b2fae4'} strokeWidth="5"
        strokeLinecap="round"/>;
      })}
    </g>}
   </svg>
   <div className="wf-guest-wrap">
    <GuestPortrait guest={guest} large/>
    <div className="wf-guest-label">{profile.name}<small>Festival konuğu</small></div>
   </div>
   <div className="wf-speech-bubble" aria-live="polite">{served?'✨ Thank you!':dialogue}</div>
   <div className="wf-basket" data-served={served} data-no={avoidPrimary}>
    <div className="wf-basket-title">{served?'Sipariş tamamlandı':'Festival sepeti'}</div>
    {chosen?<><WishFruitArtwork food={chosen} size={76}/>{avoidPrimary&&
      <span className="wf-primary-cross" role="img" aria-label="Bu yiyecek sevilmiyor">×</span>}</>:
      <span className="wf-basket-empty">✦</span>}
    {secondary&&<div className="wf-secondary-fruit" data-avoid={avoided}>
      <WishFruitArtwork food={secondary} size={49}/>{avoided&&<span aria-label="İstenmeyen ürün">×</span>}
     </div>}
   </div>
  </div>
  <div className="wf-market">
   <div className="wf-market-heading"><span>✦ FESTİVAL TEZGÂHI</span><small>{activeChoice?'İngilizce ipucuna göre doğru ürüne dokun':'Ürünler · kendi seçiminle keşfet'}</small></div>
   <div className="wf-food-grid" role="group" aria-label="Sekiz yiyecek, festivalde seçim">
    {WISH_FOODS.map(item=><button key={item.id} type="button" className="wf-food-button"
     onClick={()=>onFood?.(item.id)} disabled={disabled||!activeChoice}
     aria-label={item.label+' seç'} aria-pressed={chosen===item.id||secondary===item.id}
     data-selected={chosen===item.id||secondary===item.id}>
      <WishFruitArtwork food={item.id} size={56}/><span>{item.label}</span>
     </button>)}
   </div>
  </div>
 </div>;
}
