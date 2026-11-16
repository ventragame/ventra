/** Curated writing-bank expansion for spaced, varied replay.
 * Each level/chapter adds exactly 3 spelling, 3 ordering and 4 typed responses.
 * No remote generation and no children's text collected.
 */
import type {WorkshopMode,WorkshopTask} from './writingWorkshopEngine.ts';
type SeedTask=Omit<WorkshopTask,'id'>;
type BonusChapter=Readonly<Record<'Pre-A1'|'A1'|'A2',readonly SeedTask[]>>;
const x=(mode:WorkshopMode,promptTr:string,target:string,icon:string):SeedTask=>
 ({mode,promptTr,target,icon,accepted:[]});
export const WORKSHOP_BONUS_CHAPTERS:readonly BonusChapter[]=[
 {
  'Pre-A1':[
   x('spell','Güneşi İngilizce yazmak için harfleri seç.','sun','☀️'),
   x('spell','Resimdeki kalemin İngilizce adını kur.','pen','🖊️'),
   x('spell','Kitabın İngilizce adını harflerle oluştur.','book','📘'),
   x('assemble','Bir kalemin olduğunu İngilizce anlat.','I have a pen.','✏️'),
   x('assemble','Bu kitabın sana ait olduğunu söyle.','This is my book.','📗'),
   x('assemble','Kitaplardan hoşlandığını söyle.','I like books.','📚'),
   x('write','Bir kalemin İngilizce adını kendin yaz.','pen','🖊️'),
   x('write','Bir kalemin olduğunu tam cümleyle yaz.','I have a pen.','✍️'),
   x('write','Bir kitabın İngilizce adını yaz.','book','📖'),
   x('write','Bir arkadaşına İngilizce merhaba yaz.','hello','👋')
  ],
  A1:[
   x('spell','Posta pulunun İngilizcesini harflerle oluştur.','stamp','📮'),
   x('spell','Kurşun kalemin İngilizce adını oluştur.','pencil','✏️'),
   x('spell','Posta sözcüğünü İngilizce kur.','post','📬'),
   x('assemble','Bir mektup gönderdiğini anlat.','I send a letter.','💌'),
   x('assemble','Mavi zarfı İngilizce tarif et.','The envelope is blue.','✉️'),
   x('assemble','Arkadaşının mektubu okuduğunu anlat.','My friend reads the letter.','📝'),
   x('write','Kırmızı bir kalemin olduğunu İngilizce yaz.','I have a red pen.','🖊️'),
   x('write','Bugün mektup gönderdiğini İngilizce yaz.','I send a letter today.','📮'),
   x('write','Arkadaşında kartpostal olduğunu İngilizce yaz.','My friend has a postcard.','💌'),
   x('spell','Zarfın İngilizce karşılığını harflerle oluştur.','envelope','✉️')
  ],
  A2:[
   x('spell','Zarfın İngilizce karşılığını harflerle oluştur.','envelope','✉️'),
   x('spell','Kartpostal kelimesini İngilizce oluştur.','postcard','💌'),
   x('spell','Adres sözcüğünü İngilizce yazmak için harfleri kur.','address','🏠'),
   x('assemble','Dün kuzenine kartpostal gönderdiğini anlat.','I sent a postcard to my cousin yesterday.','📮'),
   x('assemble','Mektubu zarfın içine koyduğunu anlat.','I put the letter inside an envelope.','✉️'),
   x('assemble','Arkadaşının mesajını aldıktan sonra yanıt verdiğini anlat.','My friend replied after receiving my message.','📝'),
   x('write','Arkadaşından nazik bir mektup aldığını anlat.','I received a kind letter from my friend.','💛'),
   x('write','Tatilde karşılıklı kartpostal gönderdiğinizi yaz.','We exchanged postcards during our holiday.','🏖️'),
   x('write','Müsait olunca cevap göndermesini nazikçe iste.','Please send me a reply when you can.','📩'),
   x('spell','Cevap kelimesinin İngilizcesini harflerle oluştur.','reply','📩')
  ]
 },
 {
  'Pre-A1':[
   x('spell','Nazik kelimesinin İngilizcesini harflerle kur.','kind','💛'),
   x('spell','Oynamak kelimesinin İngilizcesini harflerle kur.','play','🧸'),
   x('spell','Yardım etmek kelimesinin İngilizcesini kur.','help','🤝'),
   x('assemble','Arkadaşınla birlikte oynadığını söyle.','We play together.','🎈'),
   x('assemble','Arkadaşının nazik olduğunu söyle.','You are kind.','💗'),
   x('assemble','Arkadaşına yardım ettiğini söyle.','I help my friend.','🤲'),
   x('write','Arkadaş kelimesinin İngilizcesini yaz.','friend','🧑‍🤝‍🧑'),
   x('write','Arkadaşına nazik olduğunu söyleyen İngilizce cümleyi yaz.','You are kind.','💛'),
   x('write','Arkadaşını sevdiğini İngilizce cümleyle yaz.','I like my friend.','🧸'),
   x('write','Birlikte oynadığınızı İngilizce yaz.','We play.','🎲')
  ],
  A1:[
   x('spell','Birlikte sözcüğünü İngilizce harflerle oluştur.','together','🎈'),
   x('spell','Gülümseme kelimesinin İngilizce karşılığını oluştur.','smile','😊'),
   x('spell','Paylaşmak sözcüğünün İngilizcesini harflerle kur.','share','🫶'),
   x('assemble','Okulda arkadaşına yardım ettiğini anlat.','I help my friend at school.','🎒'),
   x('assemble','Oyuncakları paylaştığınızı anlat.','We share our toys.','🧩'),
   x('assemble','Arkadaşının güzel resim çizdiğini söyle.','My friend can draw well.','🎨'),
   x('write','Arkadaşının komik olduğunu İngilizce yaz.','My friend is funny.','😄'),
   x('write','Birlikte kitap okuduğunuzu İngilizce yaz.','We read books together.','📚'),
   x('write','Dersten sonra arkadaşına yardım ettiğini yaz.','I help my friend after class.','✏️'),
   x('spell','Yardımsever kelimesini İngilizce harflerle kur.','helpful','🤝')
  ],
  A2:[
   x('spell','Dostluk kelimesini İngilizce oluştur.','friendship','🤝'),
   x('spell','Cesaret vermek sözcüğünü İngilizce harflerle oluştur.','encourage','💪'),
   x('spell','Söz vermek kelimesini İngilizce oluştur.','promise','🤞'),
   x('assemble','Öğrenmek zorlaştığında birbirinize destek olursunuz.','We support each other when learning feels hard.','🧠'),
   x('assemble','Arkadaşının seni oyuna davet ettiğini anlat.','My friend invited me to join the game.','🎲'),
   x('assemble','Arkadaşını üzdüğün için özür dilediğini anlat.','I apologized because I hurt my friend\'s feelings.','💌'),
   x('write','İyi bir arkadaşın ihtiyacın olduğunda dinlediğini anlat.','A good friend listens when I need help.','💗'),
   x('write','Dün bir sorunu birlikte çözdüğünüzü anlat.','Yesterday we solved a problem together.','🧩'),
   x('write','Arkadaşların cesaret verdiğinde daha mutlu olduğunu yaz.','I feel happier when my friends encourage me.','🌟'),
   x('spell','Güven kelimesinin İngilizce karşılığını kur.','trust','🤞')
  ]
 },
 {
  'Pre-A1':[
   x('spell','Yeşil rengini İngilizce harflerle oluştur.','green','💚'),
   x('spell','Pembe rengini İngilizce oluştur.','pink','🩷'),
   x('spell','Turuncu rengini İngilizce harflerle kur.','orange','🍊'),
   x('assemble','Gökyüzünün mavi olduğunu anlat.','The sky is blue.','🌤️'),
   x('assemble','Yeşil bir ağaç gördüğünü anlat.','I see a green tree.','🌳'),
   x('assemble','Güneşin sarı olduğunu anlat.','The sun is yellow.','☀️'),
   x('write','Mavi kelimesini İngilizce yaz.','blue','💙'),
   x('write','Kırmızı elmayı iki İngilizce kelimeyle yaz.','red apple','🍎'),
   x('write','Yeşil rengini İngilizce yaz.','green','💚'),
   x('write','Kırmızı bir şey gördüğünü İngilizce yaz.','I see red.','❤️')
  ],
  A1:[
   x('spell','Gökkuşağı kelimesini İngilizce harflerle kur.','rainbow','🌈'),
   x('spell','Bulutlu kelimesini İngilizce oluştur.','cloudy','☁️'),
   x('spell','Nehir sözcüğünün İngilizcesini harflerle kur.','river','🏞️'),
   x('assemble','Çiçeklerin pembe olduğunu anlat.','The flowers are pink.','🌸'),
   x('assemble','Ağaçta iki kuş bulunduğunu İngilizce anlat.','There are two birds in the tree.','🐦'),
   x('assemble','Evin arkasında dağları gördüğünü anlat.','I can see mountains behind the house.','⛰️'),
   x('write','Bugün gökyüzünün açık olduğunu İngilizce yaz.','The sky is clear today.','🌤️'),
   x('write','Gölün mavi göründüğünü İngilizce yaz.','The lake looks blue.','🏞️'),
   x('write','Bahçenizde çok çiçek olduğunu İngilizce yaz.','Our garden has many flowers.','🌺'),
   x('spell','Dağ kelimesinin İngilizcesini harflerle oluştur.','mountain','⛰️')
  ],
  A2:[
   x('spell','Rengârenk sözcüğünü İngilizce oluştur.','colorful','🌈'),
   x('spell','Ufuk sözcüğünü İngilizce harflerle kur.','horizon','🌅'),
   x('spell','Güneş ışığı kelimesini İngilizce oluştur.','sunshine','☀️'),
   x('assemble','Gölün turuncu akşam göğünü yansıttığını anlat.','The lake reflected the orange evening sky.','🌄'),
   x('assemble','Bulutlu olsa da manzaranın tadını çıkardığınızı anlat.','Although it was cloudy, we enjoyed the view.','☁️'),
   x('assemble','Yolun sessiz ve çiçeklerle dolu olduğunu anlat.','The path was quiet and full of flowers.','🌸'),
   x('write','Gün batımının bulutları pembe gösterdiğini anlat.','The sunset made the clouds look pink.','🌇'),
   x('write','Yağmur durduktan sonra gökkuşağı fark ettiğini anlat.','I noticed a rainbow after the rain stopped.','🌈'),
   x('write','Akşam yemeğinden önce nehir boyunca yürüdüğünüzü anlat.','We walked along the river before dinner.','🏞️'),
   x('spell','Manzara sözcüğünün İngilizce karşılığını kur.','scenery','🌄')
  ]
 },
 {
  'Pre-A1':[
   x('spell','Geminin İngilizce adını harflerle oluştur.','ship','🚢'),
   x('spell','Balığın İngilizce adını harflerle oluştur.','fish','🐟'),
   x('spell','Dalga kelimesinin İngilizcesini harflerle kur.','wave','🌊'),
   x('assemble','Teknenin büyük olduğunu anlat.','The boat is big.','⛵'),
   x('assemble','Bir balık gördüğünü İngilizce anlat.','I see a fish.','🐟'),
   x('assemble','Denizin mavi olduğunu anlat.','The sea is blue.','🌊'),
   x('write','Deniz sözcüğünü İngilizce yaz.','sea','🌊'),
   x('write','Tekne sözcüğünü İngilizce yaz.','boat','⛵'),
   x('write','Balık kelimesini İngilizce yaz.','fish','🐟'),
   x('write','Kaptana İngilizce selam yaz.','Hello captain!','⚓')
  ],
  A1:[
   x('spell','Denizci sözcüğünün İngilizcesini oluştur.','sailor','🧑‍✈️'),
   x('spell','Ada sözcüğünün İngilizce harflerini sırala.','island','🏝️'),
   x('spell','Çapa kelimesinin İngilizcesini harflerle kur.','anchor','⚓'),
   x('assemble','Kaptanın teknede olduğunu anlat.','The captain is on the boat.','🧑‍✈️'),
   x('assemble','Adaya gittiğinizi İngilizce anlat.','We go to the island.','🏝️'),
   x('assemble','Denizin bugün sakin olduğunu anlat.','The sea is calm today.','🌊'),
   x('write','Teknenin limana yakın olduğunu İngilizce yaz.','The boat is near the harbor.','⛵'),
   x('write','Küçük bir ada görebildiğini İngilizce yaz.','I can see a small island.','🏝️'),
   x('write','Kaptanınızın arkadaş canlısı olduğunu anlat.','Our captain is friendly.','⚓'),
   x('spell','Kaptan sözcüğünün İngilizcesini harflerle kur.','captain','⚓')
  ],
  A2:[
   x('spell','Deniz fenerinin İngilizcesini harflerle kur.','lighthouse','🗼'),
   x('spell','Deniz yolculuğu kelimesini İngilizce oluştur.','voyage','⛵'),
   x('spell','Varış yeri kelimesini İngilizce harflerle oluştur.','destination','🧭'),
   x('assemble','Kaptanın ayrılmadan önce haritayı incelediğini anlat.','The captain checked the map before leaving.','🗺️'),
   x('assemble','Fırtınanın adaya varmadan önce bittiğini anlat.','The storm ended before we reached the island.','🌦️'),
   x('assemble','Rüzgâr güçlü olduğu için rotanızı değiştirdiğinizi anlat.','We changed our route because the wind was strong.','🌬️'),
   x('write','Deniz fenerinin limanı bulmanıza yardım ettiğini yaz.','The lighthouse helped us find the harbor.','🗼'),
   x('write','Uzun bir yolculuktan sonra güvenle vardığınızı yaz.','We arrived safely after a long voyage.','🚢'),
   x('write','Yolculuk sırasında günlük tuttuğunu İngilizce yaz.','I kept a diary during our journey.','📓'),
   x('spell','Yön bulma anlamındaki navigation kelimesini harflerle kur.','navigation','🧭')
  ]
 },
 {
  'Pre-A1':[
   x('spell','Tilkini İngilizce adlandırmak için harfleri seç.','fox','🦊'),
   x('spell','Anahtarın İngilizce adını harflerle kur.','key','🗝️'),
   x('spell','Ayın İngilizce adını harflerle oluştur.','moon','🌙'),
   x('assemble','Tilkinin mutlu olduğunu anlat.','The fox is happy.','🦊'),
   x('assemble','Anahtar bulduğunu İngilizce anlat.','I find a key.','🗝️'),
   x('assemble','Ayın büyük olduğunu anlat.','The moon is big.','🌙'),
   x('write','Tilkini İngilizce adlandır.','fox','🦊'),
   x('write','Anahtar sözcüğünü İngilizce yaz.','key','🗝️'),
   x('write','Kedinin mutlu olduğunu İngilizce cümleyle yaz.','The cat is happy.','😺'),
   x('write','Kırmızı bir tilkiyi İngilizce yaz.','a red fox','🦊')
  ],
  A1:[
   x('spell','Orman kelimesini İngilizce harflerle kur.','forest','🌲'),
   x('spell','Ejderha sözcüğünü İngilizce oluştur.','dragon','🐉'),
   x('spell','Kale sözcüğünü İngilizce harflerle kur.','castle','🏰'),
   x('assemble','Tavşanın parlak bir anahtar bulduğunu anlat.','The rabbit found a shiny key.','🐇'),
   x('assemble','Arkadaşların ormana yürüdüğünü anlat.','The friends walked into the forest.','🌲'),
   x('assemble','Sonunda tilkinin eve gittiğini anlat.','At last the fox went home.','🦊'),
   x('write','Ejderhanın mağarada yaşadığını İngilizce yaz.','The dragon lives in a cave.','🐉'),
   x('write','Tavşanın eski kapıyı açtığını İngilizce yaz.','The rabbit opens the old door.','🚪'),
   x('write','Bir kuşun küçük tilkiye yardım ettiğini İngilizce yaz.','A bird helped the little fox.','🐦'),
   x('spell','Kitabın bölümü anlamındaki sözcüğü harflerle kur.','chapter','📖')
  ],
  A2:[
   x('spell','Meraklı kelimesini İngilizce harflerle kur.','curious','🧐'),
   x('spell','Gizem kelimesini İngilizce harflerle oluştur.','mystery','🔎'),
   x('spell','Keşfetmek kelimesini İngilizce oluştur.','discover','🗺️'),
   x('assemble','Kâşiflerin gizemi çözünce eve döndüğünü anlat.','The explorers returned home after solving the mystery.','🔎'),
   x('assemble','Güneş batarken ormanın sessizleştiğini anlat.','As the sun set, the forest became quiet.','🌲'),
   x('assemble','Arkadaşların hazineyi paylaşmaya karar verdiğini anlat.','The friends decided to share the treasure.','🏆'),
   x('write','Başta tavşanın tilkiye güvenmediğini İngilizce yaz.','At first the rabbit did not trust the fox.','🐇'),
   x('write','Daha sonra gizli bir yol keşfettiklerini İngilizce yaz.','Later they discovered a hidden path.','🗺️'),
   x('write','Küçük tilkinin yardım edecek kadar cesur olduğunu anlat.','The little fox was brave enough to help.','🦊'),
   x('spell','Çözüm sözcüğünün İngilizce karşılığını kur.','solution','🧩')
  ]
 }
];
