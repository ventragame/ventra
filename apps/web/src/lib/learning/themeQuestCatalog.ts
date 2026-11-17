/**
 * P3 · Tema Kasabası — curated English language content.
 * CEFR labels are product difficulty bands, not independent certifications.
 * Phrases are authored for children; do not infer mastery or pronunciation
 * competence from button taps. Sound is supplied by shared English TTS.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
export const THEME_QUEST_GAME_ID='island_word_garden_theme_town' as const;
export type ThemeId='school'|'body'|'clothes'|'weather'|'calendar'|'hobbies'|'transport'|'feelings';
export type ThemeTier=0|1|2;
export const THEME_TIERS=['Pre-A1','A1','A2'] as const satisfies readonly EnglishPlacement[];
export interface ThemeLexeme{
 en:string;tr:string;icon:string;clockMinutes?:number;
}
export interface ThemePhrase {en:string;tr:string;icon:string;}
export interface ThemeContent {
 words:readonly ThemeLexeme[];phrases:readonly ThemePhrase[];
}
export interface ThemeDefinition {
 id:ThemeId;title:string;icon:string;subtitle:string;
 tiers:readonly [ThemeContent,ThemeContent,ThemeContent];
}
const parseWords=(data:string):ThemeLexeme[]=>
 data.trim().split('\n').map(row=>{
  const [en,tr,icon,mins]=row.trim().split('|');
  return mins===undefined?{en,tr,icon}:{en,tr,icon,clockMinutes:Number(mins)};
 });
const parsePhrases=(data:string):ThemePhrase[] =>
 data.trim().split('\n').map(row=>{
  const [en,tr,icon]=row.trim().split('|');return {en,tr,icon};
 });
const content=(words:string,phrases:string):ThemeContent=>({
 words:parseWords(words),phrases:parsePhrases(phrases)
});
const define=(id:ThemeId,title:string,icon:string,subtitle:string,
 preWords:string,prePhrases:string,a1Words:string,a1Phrases:string,a2Words:string,a2Phrases:string):ThemeDefinition=>({
 id,title,icon,subtitle,tiers:[
  content(preWords,prePhrases),content(a1Words,a1Phrases),content(a2Words,a2Phrases)
 ]
});
export const THEME_DEFINITIONS:readonly ThemeDefinition[]=[
 define("school",
  "Okul Dünyası",
  "🎒",
  "Sınıf, okul yaşamı ve nazik ifadeler",
  "pencil|kurşun kalem|✏️\nbook|kitap|📘\nbag|çanta|🎒\ndesk|sıra|🪑\nchair|sandalye|🪑\nteacher|öğretmen|👩‍🏫\nruler|cetvel|📏\neraser|silgi|🧽\nnotebook|defter|📓\nboard|tahta|🟩",
  "This is my pencil.|Bu benim kalemim.|✏️\nOpen your book.|Kitabını aç.|📘\nWhere is my bag?|Çantam nerede?|🎒\nSit on your chair.|Sandalyene otur.|🪑\nThank you, teacher.|Teşekkür ederim öğretmenim.|👩‍🏫",
  "library|kütüphane|📚\nclassroom|sınıf|🏫\nplayground|oyun alanı|🛝\nhomework|ödev|📝\ntimetable|ders programı|📅\nschool bus|okul otobüsü|🚌\nuniform|okul üniforması|👕\nlesson|ders|📗\nbreak time|teneffüs|🏃\ngym|spor salonu|🏀",
  "Where is the library?|Kütüphane nerede?|📚\nI have homework today.|Bugün ödevim var.|📝\nOur lesson starts at nine.|Dersimiz dokuzda başlıyor.|🕘\nCan I borrow a ruler?|Bir cetvel ödünç alabilir miyim?|📏\nLet's meet in the playground.|Oyun alanında buluşalım.|🛝",
  "science project|fen projesi|🔬\npresentation|sunum|🗣️\nexperiment|deney|🧪\ngroup work|grup çalışması|👥\nassignment|ödev görevi|📋\nresearch|araştırma|🔎\nschool club|okul kulübü|🎭\nclass discussion|sınıf tartışması|💬\ndeadline|son teslim tarihi|⏳\nschool trip|okul gezisi|🚌",
  "Could you explain the homework again?|Ödevi tekrar açıklayabilir misiniz?|📝\nWe are preparing a science project.|Bir fen projesi hazırlıyoruz.|🔬\nI would like to join the school club.|Okul kulübüne katılmak isterim.|🎭\nOur group will present the results.|Grubumuz sonuçları sunacak.|🗣️\nCan we discuss the assignment tomorrow?|Ödevi yarın tartışabilir miyiz?|📋"),
 define("body",
  "Vücudumu Tanıyorum",
  "🧍",
  "Vücut bölümleri, hareketler ve sağlık dili",
  "head|baş|🙂\nhand|el|✋\nfoot|ayak|🦶\neye|göz|👁️\near|kulak|👂\nnose|burun|👃\nmouth|ağız|👄\narm|kol|💪\nleg|bacak|🦵\nknee|diz|🦵",
  "Touch your nose.|Burnuna dokun.|👃\nRaise your hand.|Elini kaldır.|✋\nI have two eyes.|İki gözüm var.|👀\nClap your hands.|Ellerini çırp.|👏\nMove your arms.|Kollarını hareket ettir.|💪",
  "shoulder|omuz|🧍\nelbow|dirsek|💪\nwrist|bilek|🤲\nankle|ayak bileği|🦶\nfingers|parmaklar|🖐️\ntoes|ayak parmakları|🦶\nstomach|mide|🧍\nback|sırt|🚶\nneck|boyun|🧣\nteeth|dişler|🦷",
  "Bend your elbows.|Dirseklerini bük.|💪\nMy ankle hurts.|Ayak bileğim ağrıyor.|🦶\nRemember to brush your teeth.|Dişlerini fırçalamayı unutma.|🪥\nStretch your arms and shoulders.|Kollarını ve omuzlarını esnet.|🧘\nMy fingers are cold.|Parmaklarım üşüyor.|🖐️",
  "heartbeat|kalp atışı|❤️\nmuscle|kas|💪\nlungs|akciğerler|🫁\nbrain|beyin|🧠\nskeleton|iskelet|🦴\nbalance|denge|⚖️\nbreathing|nefes alma|🌬️\nskin|cilt|🖐️\nposture|duruş|🧍\nstretching|esneme|🧘",
  "My heart beats faster when I run.|Koşunca kalbim daha hızlı atar.|❤️\nWe use our lungs to breathe.|Nefes almak için akciğerlerimizi kullanırız.|🫁\nGood posture helps me sit comfortably.|İyi duruş rahat oturmama yardımcı olur.|🧍\nI am improving my balance.|Dengemi geliştiriyorum.|⚖️\nStretching helps my muscles relax.|Esneme kaslarımın gevşemesine yardımcı olur.|🧘"),
 define("clothes",
  "Renkli Gardırop",
  "🧥",
  "Kıyafetler, renkler ve seçimler",
  "shirt|gömlek|👔\ncoat|palto|🧥\nhat|şapka|🎩\nshoes|ayakkabı|👟\nsocks|çorap|🧦\ndress|elbise|👗\nskirt|etek|👗\njacket|ceket|🧥\ntrousers|pantolon|👖\nboots|botlar|🥾",
  "Put on your coat.|Paltonu giy.|🧥\nMy shoes are blue.|Ayakkabılarım mavi.|👟\nI like this hat.|Bu şapkayı seviyorum.|🎩\nWhere are my socks?|Çoraplarım nerede?|🧦\nThe dress is red.|Elbise kırmızı.|👗",
  "scarf|atkı|🧣\ngloves|eldiven|🧤\nsweater|kazak|🧶\nraincoat|yağmurluk|🧥\nshorts|şort|🩳\njeans|kot pantolon|👖\nuniform|üniforma|👕\ncap|kep|🧢\nsandals|sandalet|🩴\ntrainers|spor ayakkabıları|👟",
  "You need a raincoat today.|Bugün yağmurluğa ihtiyacın var.|🧥\nThese gloves are too big.|Bu eldivenler çok büyük.|🧤\nI am wearing a blue sweater.|Mavi bir kazak giyiyorum.|🧶\nWhich cap do you prefer?|Hangi kepi tercih edersin?|🧢\nMy trainers are comfortable.|Spor ayakkabılarım rahat.|👟",
  "waterproof jacket|su geçirmez ceket|🧥\nstriped shirt|çizgili gömlek|👔\ncomfortable shoes|rahat ayakkabılar|👟\npatterned scarf|desenli atkı|🧣\nformal clothes|resmî kıyafetler|👔\ncasual outfit|günlük kıyafet|👕\nwinter boots|kış botları|🥾\nsportswear|spor kıyafetleri|🏃\ncotton T-shirt|pamuklu tişört|👕\nwoollen jumper|yün kazak|🧶",
  "I prefer comfortable shoes for walking.|Yürürken rahat ayakkabıları tercih ederim.|👟\nThis jacket is waterproof.|Bu ceket su geçirmez.|🧥\nWe wear formal clothes for the ceremony.|Törende resmî kıyafetler giyeriz.|👔\nShe chose a striped shirt.|Çizgili bir gömlek seçti.|👔\nMy woollen jumper keeps me warm.|Yün kazağım beni sıcak tutar.|🧶"),
 define("weather",
  "Hava Durumu Stüdyosu",
  "🌦️",
  "Günlük hava durumunu tanı ve anlat",
  "sunny|güneşli|☀️\nrainy|yağmurlu|🌧️\ncloudy|bulutlu|☁️\nwindy|rüzgârlı|💨\nsnowy|karlı|❄️\nhot|sıcak|🔥\ncold|soğuk|🥶\nwarm|ılık|🌤️\nstormy|fırtınalı|⛈️\nfoggy|sisli|🌫️",
  "It is sunny today.|Bugün hava güneşli.|☀️\nTake your umbrella.|Şemsiyeni al.|☂️\nIt is cold outside.|Dışarısı soğuk.|🥶\nI like snowy days.|Karlı günleri severim.|❄️\nThe sky is cloudy.|Gökyüzü bulutlu.|☁️",
  "forecast|hava tahmini|📺\ntemperature|sıcaklık|🌡️\nrainbow|gökkuşağı|🌈\nlightning|şimşek|⚡\nthunder|gök gürültüsü|⛈️\nbreeze|hafif esinti|🍃\ndrizzle|çiseleyen yağmur|🌦️\nhumid|nemli|💧\nfreezing|dondurucu soğuk|🧊\nheat|ısı|🔥",
  "The forecast says it will rain.|Hava tahmini yağmur yağacağını söylüyor.|🌧️\nThere is a rainbow after the rain.|Yağmurdan sonra gökkuşağı var.|🌈\nIt is warm but humid today.|Bugün hava ılık ama nemli.|💧\nA light breeze is blowing.|Hafif bir esinti var.|🍃\nThe temperature is below zero.|Sıcaklık sıfırın altında.|🌡️",
  "heatwave|sıcak hava dalgası|☀️\ndrought|kuraklık|🏜️\nsnowfall|kar yağışı|🌨️\nheavy rain|şiddetli yağmur|🌧️\nstrong wind|kuvvetli rüzgâr|💨\nmild weather|ılıman hava|🌤️\novercast sky|kapalı gökyüzü|☁️\nclimate|iklim|🌍\nstorm warning|fırtına uyarısı|⚠️\nhumidity|nem oranı|💧",
  "The weather is mild this week.|Bu hafta hava ılıman.|🌤️\nWe stayed inside because of heavy rain.|Şiddetli yağmur nedeniyle içeride kaldık.|🌧️\nThe forecast includes a storm warning.|Hava tahmininde fırtına uyarısı var.|⚠️\nHumidity is high near the coast.|Sahil yakınında nem oranı yüksek.|💧\nA heatwave may last several days.|Sıcak hava dalgası birkaç gün sürebilir.|☀️"),
 define("calendar",
  "Günler ve Saatler",
  "🕰️",
  "Günleri, ayları ve saati İngilizce söyle",
  "Monday|pazartesi|🗓️\nTuesday|salı|🗓️\nWednesday|çarşamba|🗓️\nThursday|perşembe|🗓️\nFriday|cuma|🗓️\nSaturday|cumartesi|🎉\nSunday|pazar|🌞\nmorning|sabah|🌅\nafternoon|öğleden sonra|🌇\nevening|akşam|🌆\none o'clock|saat bir|🕐|60\nthree o'clock|saat üç|🕒|180\nsix o'clock|saat altı|🕕|360\nnine o'clock|saat dokuz|🕘|540",
  "Today is Monday.|Bugün pazartesi.|📅\nSee you on Friday.|Cuma görüşürüz.|🗓️\nI play on Saturday.|Cumartesi oyun oynarım.|🎮\nIt is three o'clock.|Saat üç.|🕒\nGood morning, everyone.|Herkese günaydın.|🌅",
  "January|ocak|🗓️\nFebruary|şubat|🗓️\nMarch|mart|🌼\nApril|nisan|🌸\nMay|mayıs|🌷\nJune|haziran|☀️\nJuly|temmuz|🏖️\nAugust|ağustos|🌞\nSeptember|eylül|🎒\nOctober|ekim|🍁\nNovember|kasım|🍂\nDecember|aralık|❄️\nhalf past four|dört buçuk|🕟|270\nquarter past six|altıyı çeyrek geçiyor|🕕|375\nquarter to eight|sekize çeyrek var|🕗|465\nten o'clock|saat on|🕙|600\nquarter past two|ikiyi çeyrek geçiyor|🕑|135\nhalf past seven|yedi buçuk|🕢|450",
  "My birthday is in May.|Doğum günüm mayıs ayında.|🎂\nThe bus leaves at half past four.|Otobüs dört buçukta kalkıyor.|🕟\nIt is quarter to eight.|Sekize çeyrek var.|🕗\nOur holiday starts in July.|Tatilimiz temmuzda başlıyor.|🏖️\nI will visit my friend on Tuesday.|Salı günü arkadaşımı ziyaret edeceğim.|🗓️",
  "quarter to nine|dokuza çeyrek var|🕘|525\ntwenty past six|altıyı yirmi geçiyor|🕕|380\nfive to seven|yediye beş var|🕖|415\nten past eleven|on biri on geçiyor|🕚|670\ntwenty-five to four|dörde yirmi beş var|🕓|215\nquarter past twelve|on ikiyi çeyrek geçiyor|🕛|15\nfirst of September|eylülün biri|🗓️\nnext Friday|gelecek cuma|📆\nlast weekend|geçen hafta sonu|🗓️\ntomorrow morning|yarın sabah|🌅\nnext month|gelecek ay|📅\nthe day before yesterday|dünden önceki gün|⏮️",
  "The meeting starts at quarter to nine.|Toplantı dokuza çeyrek kala başlıyor.|🕘\nWe are leaving next Friday morning.|Gelecek cuma sabahı ayrılıyoruz.|🌅\nThe event was held last weekend.|Etkinlik geçen hafta sonu yapıldı.|📆\nOur trip begins on the first of September.|Gezimiz eylülün birinde başlıyor.|🗓️\nIt is twenty past six now.|Şu an altıyı yirmi geçiyor.|🕕"),
 define("hobbies",
  "Hobi Parkı",
  "🎨",
  "Sevdiğin etkinlikleri İngilizce anlat",
  "drawing|resim çizme|✏️\nreading|kitap okuma|📖\ndancing|dans etme|💃\nsinging|şarkı söyleme|🎤\nswimming|yüzme|🏊\ncycling|bisiklete binme|🚴\npainting|boyama|🎨\nrunning|koşma|🏃\nplaying football|futbol oynama|⚽\nlistening to music|müzik dinleme|🎧",
  "I like reading.|Kitap okumayı seviyorum.|📖\nCan you swim?|Yüzebilir misin?|🏊\nLet's play football.|Hadi futbol oynayalım.|⚽\nShe likes drawing.|O resim çizmeyi sever.|✏️\nWe dance together.|Birlikte dans ederiz.|💃",
  "playing chess|satranç oynama|♟️\nskateboarding|kaykay yapma|🛹\nhiking|doğa yürüyüşü|🥾\nbaking|fırında pişirme|🧁\ngardening|bahçecilik|🌱\nphotography|fotoğrafçılık|📷\nplaying the guitar|gitar çalma|🎸\ndoing puzzles|yapboz yapma|🧩\nmaking crafts|el işi yapma|✂️\nplaying basketball|basketbol oynama|🏀",
  "I enjoy playing chess after school.|Okuldan sonra satranç oynamaktan hoşlanırım.|♟️\nWe go hiking at weekends.|Hafta sonları doğa yürüyüşüne gideriz.|🥾\nShe is learning to play the guitar.|Gitar çalmayı öğreniyor.|🎸\nDo you prefer baking or gardening?|Fırında pişirmeyi mi bahçeciliği mi tercih edersin?|🧁\nPhotography is my favourite hobby.|Fotoğrafçılık en sevdiğim hobidir.|📷",
  "coding|kodlama|💻\nvolunteering|gönüllülük yapma|🤝\ncollecting stamps|pul biriktirme|✉️\nediting videos|video düzenleme|🎬\ndesigning games|oyun tasarlama|🎮\nexploring nature|doğayı keşfetme|🌿\nbuilding models|maket yapma|🏗️\nlearning languages|dil öğrenme|🌍\npractising an instrument|müzik aleti çalışma|🎻\ncreative writing|yaratıcı yazarlık|📝",
  "I started coding because I love puzzles.|Bulmacaları sevdiğim için kodlamaya başladım.|💻\nVolunteering helps people in our community.|Gönüllülük toplumumuzdaki insanlara yardım eder.|🤝\nMy hobby is designing simple games.|Hobim basit oyunlar tasarlamak.|🎮\nShe enjoys exploring nature with her friends.|Arkadaşlarıyla doğayı keşfetmekten hoşlanır.|🌿\nCreative writing lets me invent stories.|Yaratıcı yazarlık hikâyeler uydurmamı sağlar.|📝"),
 define("transport",
  "Ulaşım İstasyonu",
  "🚂",
  "Araçlar, yolculuk ve yönler",
  "bus|otobüs|🚌\ntrain|tren|🚆\ncar|araba|🚗\nbike|bisiklet|🚲\nboat|tekne|⛵\nplane|uçak|✈️\ntaxi|taksi|🚕\ntruck|kamyon|🚚\nscooter|skuter|🛴\nsubway|metro|🚇",
  "I go by bus.|Otobüsle giderim.|🚌\nThis is my bike.|Bu benim bisikletim.|🚲\nThe train is fast.|Tren hızlıdır.|🚆\nWhere is the taxi?|Taksi nerede?|🚕\nWe travel by plane.|Uçakla yolculuk ederiz.|✈️",
  "airport|havaalanı|🛫\nstation|istasyon|🚉\nbus stop|otobüs durağı|🚏\nticket|bilet|🎫\nplatform|peron|🚉\npassenger|yolcu|🧳\ndriver|sürücü|🧑‍✈️\ntraffic lights|trafik ışıkları|🚦\nseat belt|emniyet kemeri|💺\njourney|yolculuk|🗺️",
  "Where can I buy a ticket?|Nereden bilet alabilirim?|🎫\nThe train leaves from platform two.|Tren ikinci perondan kalkıyor.|🚉\nPlease fasten your seat belt.|Lütfen emniyet kemerinizi bağlayın.|💺\nThe bus stop is near the school.|Otobüs durağı okulun yakınında.|🚏\nOur journey takes thirty minutes.|Yolculuğumuz otuz dakika sürüyor.|🚌",
  "departure|kalkış|🛫\narrival|varış|🛬\nroute|güzergâh|🗺️\nconnection|aktarma bağlantısı|🔄\ntimetable|sefer tarifesi|📅\ndelay|gecikme|⏳\ndestination|varış noktası|📍\nroundabout|döner kavşak|🔁\npedestrian crossing|yaya geçidi|🚸\npublic transport|toplu taşıma|🚇",
  "The departure time has changed.|Kalkış saati değişti.|🛫\nWe missed our connection because of a delay.|Gecikme yüzünden aktarmamızı kaçırdık.|⏳\nWhich route goes to the museum?|Müzeye hangi güzergâh gider?|🗺️\nPublic transport is useful in busy cities.|Toplu taşıma kalabalık şehirlerde faydalıdır.|🚇\nPlease use the pedestrian crossing.|Lütfen yaya geçidini kullan.|🚸"),
 define("feelings",
  "Duygu Bahçesi",
  "💛",
  "Duyguları tanı ve saygılıca ifade et",
  "happy|mutlu|😊\nsad|üzgün|😢\nangry|kızgın|😠\ntired|yorgun|😴\nscared|korkmuş|😨\nexcited|heyecanlı|🤩\ncalm|sakin|😌\nhungry|aç|😋\nthirsty|susamış|🥤\nsurprised|şaşırmış|😮",
  "I feel happy.|Kendimi mutlu hissediyorum.|😊\nAre you tired?|Yorgun musun?|😴\nI am a little scared.|Biraz korkuyorum.|😨\nShe looks surprised.|O şaşırmış görünüyor.|😮\nI need some water.|Biraz suya ihtiyacım var.|🥤",
  "nervous|gergin|😬\nproud|gururlu|🏆\nworried|endişeli|😟\nbored|sıkılmış|🥱\nrelaxed|rahatlamış|😌\nconfused|kafası karışmış|🤔\nhopeful|umutlu|🌟\nshy|utangaç|🙈\nupset|keyfi kaçmış|😞\ncheerful|neşeli|😃",
  "I feel nervous before a test.|Sınavdan önce gergin hissediyorum.|😬\nShe is proud of her work.|Çalışmasıyla gurur duyuyor.|🏆\nCan you explain it again? I am confused.|Tekrar açıklar mısın? Kafam karıştı.|🤔\nI am worried about the weather.|Hava durumu için endişeleniyorum.|😟\nA short break helps me relax.|Kısa bir mola rahatlamama yardımcı olur.|😌",
  "frustrated|hayal kırıklığına uğramış / bunalmış|😤\nconfident|kendine güvenen|😎\ndisappointed|hayal kırıklığına uğramış|😞\ngrateful|minnettar|🙏\nanxious|kaygılı|😰\nembarrassed|mahcup|😳\ncurious|meraklı|🔍\ndetermined|kararlı|💪\nrelieved|rahatlamış|😮‍💨\noverwhelmed|çok bunalmış|🌪️",
  "I felt relieved when the task was finished.|Görev bitince rahatladım.|😮‍💨\nShe is confident about her presentation.|Sunumuna güveniyor.|😎\nIt is normal to feel disappointed sometimes.|Bazen hayal kırıklığına uğramak normaldir.|😞\nI am grateful for your help.|Yardımın için minnettarım.|🙏\nHe was curious about how the machine worked.|Makinenin nasıl çalıştığını merak ediyordu.|🔍")
];
export const THEME_ORDER:readonly ThemeId[]=THEME_DEFINITIONS.map(d=>d.id);
export const THEME_TOTAL=THEME_DEFINITIONS.length;
export function themeById(id:ThemeId):ThemeDefinition{
 const result=THEME_DEFINITIONS.find(t=>t.id===id);
 if(!result)throw new RangeError('Unknown English theme '+id);
 return result;
}
export function themeLevelId(
 theme:ThemeId,placement:EnglishPlacement,tier:ThemeTier
):number{
 const i=THEME_ORDER.indexOf(theme),j=THEME_TIERS.indexOf(placement);
 if(i<0||j<0||![0,1,2].includes(tier))throw new RangeError('Invalid theme lesson mapping');
 // 3 placement bands × 8 themes × 3 effective curriculum tiers = 72 stable IDs
 return 1+j*THEME_TOTAL*3+i*3+tier;
}
export function validateThemeContent():string[]{
 const errors:string[]=[];
 if(THEME_TOTAL!==8||new Set(THEME_ORDER).size!==8)errors.push('Theme count or IDs');
 for(const theme of THEME_DEFINITIONS){
  for(let tier=0;tier<3;tier++){
   const data=theme.tiers[tier];
   if(data.words.length<10||data.phrases.length<5)
    errors.push('Content pool too small: '+theme.id+':'+tier);
   const words=new Set(data.words.map(w=>w.en.toLowerCase()));
   const phrases=new Set(data.phrases.map(p=>p.en.toLowerCase()));
   if(words.size!==data.words.length||phrases.size!==data.phrases.length)
    errors.push('Duplicate content: '+theme.id+':'+tier);
   if(data.words.some(w=>!w.en||!w.tr||!w.icon||(/\|/.test(w.en))))
    errors.push('Empty word metadata '+theme.id+':'+tier);
   if(data.phrases.some(p=>!p.en||!p.tr||!p.icon))
    errors.push('Empty phrase metadata '+theme.id+':'+tier);
   for(const word of data.words)if(word.clockMinutes!==undefined&&
     (!Number.isInteger(word.clockMinutes)||word.clockMinutes<0||word.clockMinutes>=720))
    errors.push('Clock beyond 12-hour range: '+word.en);
  }
 }
 for(const tier of THEME_TIERS){
  const chapter=themeById('calendar').tiers[THEME_TIERS.indexOf(tier)];
  if(chapter.words.filter(x=>x.clockMinutes!==undefined).length<4)
   errors.push('No teachable analog clock practice in '+tier);
 }
 return errors;
}
