/** Additional authored language missions for longer, varied writing sessions.
 * Never generate text from a child's personal writing and never upload typed answers.
 * Appended AFTER prior content so existing task IDs and checkpoints remain stable.
 */
import type {WorkshopLevel,WorkshopMode,WorkshopTask} from './writingWorkshopEngine.ts';
type TaskSeed=Omit<WorkshopTask,'id'>;
const add=(mode:WorkshopMode,promptTr:string,target:string,icon:string):TaskSeed=>({mode,promptTr,target,icon,accepted:[]});
export const WORKSHOP_EXTENDED_CHAPTERS:readonly Readonly<Record<WorkshopLevel,readonly TaskSeed[]>>[]=[
 {
  'Pre-A1':[
   add('spell','Posta kelimesinin İngilizcesini harflerle kur.','mail','📬'),
   add('spell','Küçük kutunun İngilizce adını kur.','box','📦'),
   add('assemble','Bir kutu gördüğünü anlat.','I see a box.','📦'),
   add('assemble','Bu bir kalem demek için cümle kur.','This is a pen.','🖊️'),
   add('write','Küçük kediyi bir cümleyle anlat.','This is a cat.','🐱'),
   add('write','Kitabını sevdiğini İngilizce yaz.','I like my book.','📘'),
  ],
  'A1':[
   add('spell','Posta kutusunun İngilizcesini oluştur.','mailbox','📮'),
   add('spell','Kısa not kelimesini İngilizce kur.','note','📝'),
   add('assemble','Mektubun kutuda olduğunu anlat.','The letter is in the box.','📦'),
   add('assemble','Arkadaşına yazdığını söyle.','I write to my friend.','💌'),
   add('write','Yeni bir kartpostalın olduğunu İngilizce yaz.','I have a new postcard.','📮'),
   add('write','Arkadaşından notunu okumasını iste.','Please read my note.','📝'),
  ],
  'A2':[
   add('spell','Teslimat kelimesini İngilizce oluştur.','delivery','📦'),
   add('spell','Selamlama kelimesini İngilizce harflerle kur.','greeting','👋'),
   add('assemble','Mektubu göndermeden önce adresi kontrol ettiğini anlat.','I checked the address before sending the letter.','✉️'),
   add('assemble','Kartpostalı açtığında gülümsediğini anlat.','She smiled when she opened the postcard.','💌'),
   add('write','Arkadaşına neşeli bir not gönderdiğini yaz.','I sent a cheerful note to my friend.','🌟'),
   add('write','Arkadaşının ertesi gün cevap yazdığını anlat.','My friend wrote back the next day.','📩'),
  ],
 },
 {
  'Pre-A1':[
   add('spell','Sarılma kelimesini İngilizce harflerle kur.','hug','🤗'),
   add('spell','Takım kelimesini İngilizce oluştur.','team','🧸'),
   add('assemble','Bir takım olduğunuzu anlat.','We are a team.','🤝'),
   add('assemble','Arkadaşına yardım edebildiğini söyle.','I can help you.','💛'),
   add('write','Oynayabildiğini İngilizce yaz.','I can play.','🧩'),
   add('write','Arkadaşına onun dostun olduğunu yaz.','You are my friend.','🫶'),
  ],
  'A1':[
   add('spell','Dost anlamındaki buddy kelimesini oluştur.','buddy','🧸'),
   add('spell','Gülmek kelimesinin İngilizce harflerini kur.','laugh','😄'),
   add('assemble','Boya kalemlerini paylaştığını anlat.','I share my crayons.','🖍️'),
   add('assemble','Okulda sana yardım ettiğini anlat.','She helps me at school.','🎒'),
   add('write','Birlikte eğlendiğinizi İngilizce yaz.','We have fun together.','🎉'),
   add('write','Arkadaşınla oynadığını İngilizce yaz.','I play with my friend.','🎲'),
  ],
  'A2':[
   add('spell','Saygı kelimesini İngilizce harflerle oluştur.','respect','🤝'),
   add('spell','Sabırlı kelimesini İngilizce oluştur.','patient','💛'),
   add('assemble','Oyun seçmeden önce dikkatle dinlediğinizi anlat.','We listened carefully before choosing a game.','🎲'),
   add('assemble','Dürüst olduğu için arkadaşına teşekkür ettiğini anlat.','I thanked my friend for being honest.','💬'),
   add('write','Birlikte çalışınca gurur duyduğunu yaz.','I felt proud when we worked together.','⭐'),
   add('write','Birbirini dinleyince dostluğun güçlendiğini anlat.','Our friendship grows when we listen to each other.','🤗'),
  ],
 },
 {
  'Pre-A1':[
   add('spell','Mor renginin İngilizce harflerini kur.','purple','💜'),
   add('spell','Siyah renginin İngilizcesini oluştur.','black','🖤'),
   add('assemble','Çiçeğin pembe olduğunu söyle.','The flower is pink.','🌸'),
   add('assemble','Sarı bir güneş gördüğünü anlat.','I see a yellow sun.','☀️'),
   add('write','Gökyüzünün rengini cümleyle yaz.','The sky is blue.','🌤️'),
   add('write','Yeşil bir yaprağı İngilizce anlat.','It is a green leaf.','🍃'),
  ],
  'A1':[
   add('spell','Bahçenin İngilizce harflerini oluştur.','garden','🌷'),
   add('spell','Gölge kelimesinin İngilizcesini kur.','shadow','🌳'),
   add('assemble','Küçük teknenin kırmızı olduğunu anlat.','The small boat is red.','⛵'),
   add('assemble','Beyaz bulutun tepenin üzerinde olduğunu anlat.','A white cloud is above the hill.','☁️'),
   add('write','Çiçeklerin sarı olduğunu İngilizce yaz.','The flowers are yellow.','🌼'),
   add('write','Bugün bir gökkuşağı gördüğünü anlat.','I see a rainbow today.','🌈'),
  ],
  'A2':[
   add('spell','Yansıma sözcüğünü İngilizce harflerle oluştur.','reflection','🏞️'),
   add('spell','Çayır kelimesinin İngilizcesini oluştur.','meadow','🌿'),
   add('assemble','Akşam dağların mor göründüğünü anlat.','The mountains looked purple in the evening.','⛰️'),
   add('assemble','Gölün yakınındaki parlak çiçekleri fotoğrafladığını yaz.','I photographed the bright flowers near the lake.','🌻'),
   add('write','Hafif esintinin bahçedeki yaprakları oynattığını anlat.','A gentle breeze moved the leaves in the garden.','🍃'),
   add('write','Güneşin tepelerin arkasına kaybolmasını izlediğinizi yaz.','We watched the sun disappear behind the hills.','🌅'),
  ],
 },
 {
  'Pre-A1':[
   add('spell','Kum kelimesini İngilizce harflerle kur.','sand','🏖️'),
   add('spell','Limanın kısa İngilizce adını oluştur.','port','⚓'),
   add('assemble','Geminin büyük olduğunu söyle.','The ship is big.','🚢'),
   add('assemble','Denizi gördüğünü İngilizce anlat.','I see the sea.','🌊'),
   add('write','Teknenin mavi olduğunu İngilizce yaz.','The boat is blue.','⛵'),
   add('write','Bir gemi gördüğünü İngilizce yaz.','I see a ship.','🚢'),
  ],
  'A1':[
   add('spell','Plaj kelimesinin İngilizcesini oluştur.','beach','🏖️'),
   add('spell','Bilet kelimesini İngilizce harflerle kur.','ticket','🎟️'),
   add('assemble','Plaj boyunca yürüdüğünüzü anlat.','We walk along the beach.','🐚'),
   add('assemble','Teknenin sabah kalktığını anlat.','The boat leaves in the morning.','⛵'),
   add('write','Beyaz bir yelken gördüğünü İngilizce yaz.','I see a white sail.','⛵'),
   add('write','Plaja gideceğinizi İngilizce anlat.','We are going to the beach.','🏖️'),
  ],
  'A2':[
   add('spell','Pusula kelimesini İngilizce harflerle oluştur.','compass','🧭'),
   add('spell','Kalkış kelimesini İngilizce oluştur.','departure','⛵'),
   add('assemble','Yağmur durana kadar limanda beklediğinizi anlat.','We waited at the harbor until the rain stopped.','🌧️'),
   add('assemble','Mürettebatın tekneyi gün doğmadan hazırladığını anlat.','The crew prepared the boat before sunrise.','🌅'),
   add('write','Denizi geçerken bir kartpostal yazdığını anlat.','I wrote a postcard while we crossed the sea.','💌'),
   add('write','Adanın güverteden güzel göründüğünü İngilizce yaz.','The island looked beautiful from the deck.','🏝️'),
  ],
 },
 {
  'Pre-A1':[
   add('spell','Yıldız kelimesini İngilizce harflerle kur.','star','⭐'),
   add('spell','Kapı kelimesinin İngilizcesini oluştur.','door','🚪'),
   add('assemble','Tilkinin anahtarı olduğunu söyle.','The fox has a key.','🦊'),
   add('assemble','Büyük bir yıldız gördüğünü anlat.','I see a big star.','🌟'),
   add('write','Tilkinin koşabildiğini İngilizce yaz.','The fox can run.','🦊'),
   add('write','Bir ay gördüğünü İngilizce yaz.','I see a moon.','🌙'),
  ],
  'A1':[
   add('spell','Sihir kelimesini İngilizce harflerle oluştur.','magic','✨'),
   add('spell','Köprü kelimesinin İngilizcesini kur.','bridge','🌉'),
   add('assemble','Ejderhanın küçük bir kuş gördüğünü anlat.','The dragon saw a little bird.','🐉'),
   add('assemble','Arkadaşların köprüyü birlikte geçtiğini anlat.','The friends crossed the bridge together.','🌉'),
   add('write','Tilkinin sihirli taş bulduğunu İngilizce yaz.','The fox found a magic stone.','🦊'),
   add('write','Anahtarla kapıyı açtıklarını İngilizce yaz.','They opened the door with a key.','🗝️'),
  ],
  'A2':[
   add('spell','Keşif kelimesini İngilizce harflerle oluştur.','discovery','🔍'),
   add('spell','Zorluk kelimesinin İngilizcesini oluştur.','challenge','🏆'),
   add('assemble','Kaleye ulaşana kadar ipuçlarını izlediklerini anlat.','The friends followed the clues until they reached a castle.','🏰'),
   add('assemble','Kapı açılınca gizli bahçe bulduklarını anlat.','When the door opened, they discovered a hidden garden.','🌿'),
   add('write','Herkes yardım edebilsin diye tavşanın haritayı paylaştığını yaz.','The rabbit shared the map so everyone could help.','🐇'),
   add('write','Eve anlatacak bir hikâyeyle döndüklerini İngilizce yaz.','They returned home with a story to tell.','📖'),
  ],
 },
];
