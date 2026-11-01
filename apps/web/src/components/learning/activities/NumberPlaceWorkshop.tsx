'use client';
import React from 'react';

export interface PlaceValue {hundreds:number;tens:number;ones:number}
export function NumberPlaceWorkshop({value,onChange,disabled}:{
  value:PlaceValue;onChange:(value:PlaceValue)=>void;disabled:boolean;
}){
  const total=value.hundreds*100+value.tens*10+value.ones;
  return <div role="group" aria-label="Yüzlük, onluk ve birlik ile sayı inşa et"
    className="nv-place-workshop mx-auto mt-3 grid max-w-2xl grid-cols-3 gap-2 sm:gap-4">
    {(['hundreds','tens','ones'] as const).map(place=>{
      const unit=place==='hundreds'?100:place==='tens'?10:1;
      const limit=place==='hundreds'?10:9;
      const amount=value[place];
      const name=place==='hundreds'?'Yüzlük':place==='tens'?'Onluk':'Birlik';
      return <div key={place} className="nv-place-tower rounded-2xl p-2 sm:p-4">
        <div className="text-[10px] font-black uppercase tracking-wide text-sky-100 sm:text-xs">{name}</div>
        <span className="nv-place-icon mt-2 block text-3xl sm:text-4xl" aria-hidden="true">{place==='hundreds'?'▦':place==='tens'?'▥':'◆'}</span>
        <div className="mt-2 text-xl font-black tabular-nums text-amber-100 sm:text-3xl">{amount}</div>
        <div className="mt-2 grid grid-cols-2 gap-1 sm:gap-2">
          <button type="button" aria-label={`${name} çıkar`}
            disabled={disabled||amount===0} className="nv-place-button rounded-xl py-3 text-xl font-black disabled:opacity-30"
            onClick={()=>onChange({...value,[place]:amount-1})}>−</button>
          <button type="button" aria-label={`${name} ekle`}
            disabled={disabled||amount===limit||total+unit>1000} className="nv-place-button rounded-xl py-3 text-xl font-black disabled:opacity-30"
            onClick={()=>onChange({...value,[place]:amount+1})}>+</button>
        </div>
        <div className="mt-2 text-xs font-bold text-sky-100">{amount} × {unit}</div>
      </div>;
    })}
    <div role="status" className="col-span-3 mt-2 rounded-xl bg-slate-900/70 px-3 py-3 text-center font-extrabold">
      {value.hundreds} × 100 + {value.tens} × 10 + {value.ones} × 1 = <span className="text-amber-200">{total}</span>
    </div>
  </div>;
}
