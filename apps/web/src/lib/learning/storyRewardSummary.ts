/**
 * Copy for the Story Forest reward summary, shared by Hikâyeyi Keşfet,
 * Sonra Ne Oldu? and Hikâye Dedektifi so the three games praise and count
 * the same way.
 */

/** Praise for the stars a finished story earned. */
export function storyRewardPraise(stars:number):string{
 return stars>=3?'Muhteşem! Her şeyi ilk denemede buldun.':
  stars===2?'Çok iyi! Hikâyeyi neredeyse hatasız çözdün.':
  'Başardın! Tekrar oynarsan daha çok yıldız toplarsın.';
}

/** "✓ Hepsi ilk denemede" or "↻ 2 yeniden deneme · 💡 1 ipucu": what the round took. */
export function storyRewardStats(mistakes:number,hints:number):string{
 const parts=[mistakes===0?'✓ Hepsi ilk denemede':`↻ ${mistakes} yeniden deneme`];
 if(hints>0)parts.push(`💡 ${hints} ipucu`);
 return parts.join(' · ');
}
