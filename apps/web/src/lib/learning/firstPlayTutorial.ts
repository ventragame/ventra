/** First-play guidance is a safe, unscored sandbox; never persist tutorial taps as lesson evidence. */
export type TutorialWorld='animals'|'colors'|'numbers'|'food'|'family'|'sanctuary';
export interface TutorialChoice {
  id:string;
  label:string;
  english:string;
  icon?:string;
  image?:string;
  color?:string;
}
export interface TutorialLesson {
  name:string;
  hero:string;
  intro:string;
  steps:readonly {choiceId:string;prompt:string;done:string}[];
  choices:readonly TutorialChoice[];
  completion:string;
}
export const FIRST_PLAY_LESSONS:Record<TutorialWorld,TutorialLesson>={
  animals:{
    name:'Hayvan Çayırı',hero:'🐾',intro:'Rehber Pufi sana hayvanları nasıl keşfedeceğini gösterecek.',
    steps:[{choiceId:'cat',prompt:'Parlayan kediye dokun. Karakterin gerçek oyunda yanına yürüyecek!',done:'Harika! CAT, İngilizce kedi demek.'}],
    choices:[
      {id:'dog',label:'Köpek',english:'Dog',image:'/assets/animals/premium/dog.svg'},
      {id:'cat',label:'Kedi',english:'Cat',image:'/assets/animals/premium/cat.svg'},
      {id:'rabbit',label:'Tavşan',english:'Rabbit',image:'/assets/animals/premium/rabbit.svg'}
    ],completion:'Hazırsın! Oyunda hayvanlara dokunup İngilizce adlarını dinle.'
  },
  colors:{
    name:'Renk Korusu',hero:'🎨',intro:'Lumi, büyülü renkleri seçmeyi gösterecek.',
    steps:[{choiceId:'red',prompt:'KIRMIZI renk taşına dokun.',done:'Red! Kırmızıyı buldun.'}],
    choices:[
      {id:'blue',label:'Mavi',english:'Blue',color:'#3b82f6'},
      {id:'yellow',label:'Sarı',english:'Yellow',color:'#facc15'},
      {id:'red',label:'Kırmızı',english:'Red',color:'#ef4444'}
    ],completion:'Harika! Renk taşlarına dokun; yeni renkler sonraki keşiflerde açılır.'
  },
  numbers:{
    name:'Sayı Vadisi',hero:'💎',intro:'Kristal vadisinde İngilizce sayıları keşfedeceksin.',
    steps:[{choiceId:'3',prompt:'ÜÇ yazan kristale dokun.',done:'Three! Üç sayısının İngilizcesi.'}],
    choices:[
      {id:'5',label:'5',english:'Five',icon:'💎'},
      {id:'3',label:'3',english:'Three',icon:'💎'},
      {id:'7',label:'7',english:'Seven',icon:'💎'}
    ],completion:'Artık kristalleri nasıl seçeceğini biliyorsun. İngilizce sayılara kulak ver!'
  },
  food:{
    name:'Lezzet Pazarı',hero:'🧺',intro:'Pazarda ürün bulup sepete koymayı deneyelim.',
    steps:[
      {choiceId:'apple',prompt:'Önce ELMA ürününe dokun.',done:'Apple! Şimdi elmayı sepete götürelim.'},
      {choiceId:'basket',prompt:'Şimdi SEPETE dokun. Oyunda ürünleri sürükleyebilir veya dokunarak seçebilirsin.',done:'Süper! Elma sepette.'}
    ],
    choices:[
      {id:'bread',label:'Ekmek',english:'Bread',icon:'🍞'},
      {id:'apple',label:'Elma',english:'Apple',icon:'🍎'},
      {id:'milk',label:'Süt',english:'Milk',icon:'🥛'},
      {id:'basket',label:'Sepet',english:'Basket',icon:'🧺'}
    ],completion:'Hazırsın! Ürünü seç, İngilizcesini öğren ve sepeti doldur.'
  },
  family:{
    name:'Aile Köyü',hero:'🏡',intro:'Evdeki kişi ve eşyalara dokunarak İngilizce öğrenelim.',
    steps:[{choiceId:'mother',prompt:'ANNE olan kişiye dokun.',done:'Mother! İngilizcede anne demek.'}],
    choices:[
      {id:'father',label:'Baba',english:'Father',icon:'👨'},
      {id:'sister',label:'Kız kardeş',english:'Sister',icon:'👧'},
      {id:'mother',label:'Anne',english:'Mother',icon:'👩'}
    ],completion:'Harika! Köyde kişileri ve eşyaları seçerek İngilizce cümleler öğreneceksin.'
  },
  sanctuary:{
    name:'Keşif Tapınağı',hero:'✨',intro:'Tapınakta kelimeleri doğru sırayla birleştirerek bir köprü kur.',
    steps:[
      {choiceId:'i',prompt:'Önce “I” kelimesine dokun.',done:'I'},
      {choiceId:'see',prompt:'Şimdi “see” kelimesini ekle.',done:'I see'},
      {choiceId:'a',prompt:'Şimdi “a” kelimesini ekle.',done:'I see a'},
      {choiceId:'cat',prompt:'Son kelime: “cat.”',done:'I see a cat.'}
    ],
    choices:[
      {id:'cat',label:'cat.',english:'Kedi',icon:'🐈'},
      {id:'a',label:'a',english:'Bir',icon:'✦'},
      {id:'i',label:'I',english:'Ben',icon:'✦'},
      {id:'see',label:'see',english:'Görüyorum',icon:'👀'}
    ],completion:'İngilizce köprüyü kurdun! Gerçek tapınakta cümleleri kendin tamamlayacaksın.'
  }
};
export function tutorialSeenKey(profileId:string,world:TutorialWorld):string {
  if(!profileId.trim())throw Error('Çocuk profili gerekli.');
  return 'ventra:kids:first-play:v1:'+encodeURIComponent(profileId)+':'+world;
}
