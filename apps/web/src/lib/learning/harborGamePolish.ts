import type {HarborAction,HarborLevel} from './harborMissionEngine.ts';
/** Compact, authored stage guidance. These are story beats, not new questions:
 * the existing 135 level-specific English answers remain authoritative.
 */
export const HARBOR_BEAT_LABELS:Readonly<Record<HarborAction,readonly [string,string,string]>>={
 meet:['Merhaba de','Arkadaşını dinle','Gülümseyerek vedalaş'],
 crew:['Yeni arkadaşını bul','Mimi ile tanış','Birlikte yola çık'],
 board:['Tekneyi bul','Yelkeni hazırla','Yolculuğa başla'],
 deliver:['İçeceği bul','Nazikçe uzat','Teşekkür et'],
 trade:['Doğru meyveyi seç','Siparişini söyle','Alışverişi tamamla'],
 help:['Balıkçıya yardım et','Kaybolanı ara','Birlikte sevin'],
 chart:['Haritayı aç','İşareti keşfet','Rotayı tamamla'],
 navigate:['Yönü bul','Yolu takip et','Köprüyü geç'],
 rescue:['Arkadaşını ara','İpuçlarını izle','Onu güvene al'],
 light:['Feneri bul','Işığı kontrol et','Limanı aydınlat'],
 repair:['Anahtarı bul','Kutuyu aç','Feneri onar'],
 signal:['Sinyali keşfet','Işığı yönlendir','Tekneleri koru'],
 invite:['Arkadaşlarını çağır','Davet et','Birlikte buluş'],
 decorate:['Fenerleri bul','Limanı süsle','Müziği başlat'],
 celebrate:['Kaptanı selamla','Macera için teşekkür et','Festivali kutla']
};
export function harborBeat(action:HarborAction,index:number):string{
 if(!Number.isInteger(index)||index<0||index>2)throw new RangeError('Invalid harbor story step');
 return HARBOR_BEAT_LABELS[action][index];
}
export type HarborCoachAction='replay-question'|'model-answer'|'show-text';
export type HarborCoachHint={message:string;action:HarborCoachAction};
/** Three-stage scaffolding rather than instantly revealing every solution.
 * Each stage uses the same learner-authored text at every language level.
 */
export function harborCoachHint(reply:string,level:HarborLevel,stage:number):HarborCoachHint{
 if(stage<=1)return{
  message:'Önce arkadaşımızı tekrar dinle. Hangi cevap uygun?',
  action:'replay-question'
 };
 if(stage===2)return{
  message:level==='Pre-A1'?'Şimdi örnek cevabı dinle ve sen de söyle!':
   'Örnek cümlenin sesini dinle. Sonra kendi sesinle dene.',
  action:'model-answer'
 };
 return{
  message:'Örnek cevap: '+reply,
  action:'show-text'
 };
}
/** Children should be offered another attempt without falsely presenting
 * the incorrect choice as a valid spoken answer.
 */
export function harborRetryMessage(wrongCount:number):string{
 return wrongCount>=2
  ?'Bir daha deneyelim! İstersen yardım düğmesine dokun.'
  :'Bir daha deneyelim! Arkadaşımızı dinle, sonra başka cevabı seç.';
}
