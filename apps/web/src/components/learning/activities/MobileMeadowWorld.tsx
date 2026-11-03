'use client';
import React from 'react';
import {findAnimal,type AnimalId} from '@/lib/learning/animalMissionEngine';
import type {WorldObject} from '../world/worldLayout';

/**
 * Mobile-first, fully accessible lightweight meadow.
 * Reuses the authoritative world object IDs and interaction callback used by
 * Phaser, so animal discovery, rescue and answers go through the same engine.
 * Avoids loading an expensive canvas / miniature directional keypad on phones.
 */
const HOME_ICONS:Record<string,string>={
 Ev:'🧺',Bahçe:'🌻',Ağaç:'🌳',Çayır:'🌿',Çiftlik:'🏡',Gölet:'💧',
 Çiçeklik:'🌼',Savan:'🌾',Orman:'🌲',Kutup:'❄️',Sahil:'🏝️',
 Nehir:'🏞️',Deniz:'🌊',Dağ:'⛰️',Otlak:'🌱'
};
export interface MobileMeadowWorldProps {
 objects:WorldObject[];
 caption:string;
 onInteract:(object:WorldObject)=>void;
 discovery?:boolean;
 discoveredIds?:readonly AnimalId[];
 wrongChoice?:AnimalId|null;
 awaiting?:boolean;
 targetId?:AnimalId|null;
 habitatMode?:boolean;
 progress?:number;
}
export function MobileMeadowWorld({
 objects,caption,onInteract,discovery=false,discoveredIds=[],wrongChoice=null,
 awaiting=false,targetId=null,habitatMode=false,progress=0
}:MobileMeadowWorldProps){
 return <section className="am-mobile-world" aria-label={caption}>
   <div className="am-mobile-world-sun" aria-hidden="true"/>
   <div className="am-mobile-cloud am-mobile-cloud-a" aria-hidden="true"/>
   <div className="am-mobile-cloud am-mobile-cloud-b" aria-hidden="true"/>
   <div className="am-mobile-hills" aria-hidden="true"/>
   <div className="am-mobile-pond" aria-hidden="true"/>
   <div className="am-mobile-garden" aria-hidden="true">✿ ✾ ✿</div>
   <div className="am-mobile-board" aria-hidden="true">🌿 {discovery?'Dostlarını Keşfet':habitatMode?'Doğru Yuvayı Bul':'Hayvanı Bul'}</div>
   <div className="am-mobile-world-items" role="group"
    aria-label={habitatMode?'Yaşam alanları':discovery?'Keşfedilecek hayvanlar':'Hayvan seçenekleri'}>
    {objects.map((object,i)=>{
     const word=findAnimal(object.id);
     if(!word)return null;
     const done=discoveredIds.includes(word.id);
     const correct=awaiting&&word.id===targetId;
     const wrong=wrongChoice===word.id;
     return <button type="button" key={object.id}
      className="am-mobile-animal" style={{'--am-delay':i*45+'ms'} as React.CSSProperties}
      data-discovered={done} data-correct={correct} data-wrong={wrong}
      data-habitat={habitatMode} disabled={awaiting}
      aria-pressed={done||correct}
      aria-label={habitatMode?'Yuva: '+word.habitat:discovery?
       word.tr+' hayvanını keşfet; İngilizce adı '+word.id:word.tr+' hayvanını seç'}
      onClick={()=>onInteract(object)}>
      <span className="am-mobile-animal-art" aria-hidden="true">
       {habitatMode?<span className="am-mobile-habitat-icon">{HOME_ICONS[word.place]??'🏡'}</span>:
        <img src={word.image} alt="" draggable={false} loading="eager"/>}
      </span>
      <span className="am-mobile-animal-label">
       {habitatMode?word.habitat:discovery&&done?word.id:word.tr}
      </span>
      {discovery&&done&&<span className="am-mobile-discovered" aria-hidden="true">✓</span>}
     </button>;
    })}
   </div>
   <div className="am-mobile-world-progress" aria-label={'Çayırda '+progress+' keşif veya doğru cevap'}>
    <span aria-hidden="true">✦</span> {progress} <span aria-hidden="true">✦</span>
   </div>
  </section>;
}
