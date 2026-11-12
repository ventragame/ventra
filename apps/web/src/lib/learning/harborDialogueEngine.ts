export type HarborLevel='Pre-A1'|'A1'|'A2';
export type HarborPrompt={line:string;reply:string;choices:readonly [string,string,string];accept:readonly string[];illustration:string};
export type HarborEpisode={id:number;title:string;subtitle:string;icon:string;prompts:Record<HarborLevel,readonly HarborPrompt[]>};
const phrase=(line:string,reply:string,choices:readonly [string,string,string],accept:readonly string[],illustration:string):HarborPrompt=>({line,reply,choices,accept,illustration});
export const HARBOR_GAME_ID='island_speaking_harbor_dialogue' as const;
export const HARBOR_EPISODES:readonly HarborEpisode[]=[
 {id:1,title:'Merhaba, Kaptan!',subtitle:'Tanışma ve selamlaşma',icon:'👋',prompts:{
  'Pre-A1':[
   phrase('Hello!', 'Hello!', ['Hello!','Good night!','Goodbye!'],['hello','hi'],'👋'),
   phrase('How are you?', 'I am happy!', ['I am happy!','See you!','Blue boat!'],['i am happy','im happy','i feel happy'],'😊'),
   phrase('Goodbye!', 'Bye!', ['Bye!','Hello!','Thank you!'],['bye','goodbye','bye bye'],'⛵')],
  'A1':[
   phrase('Good morning, sailor!', 'Good morning!', ['Good morning!','Good night!','I am seven!'],['good morning'],'🌅'),
   phrase('How are you today?', 'I am fine, thanks!', ['I am fine, thanks!','I like boats!','See you later!'],['i am fine thanks','im fine thanks','fine thank you'],'🌈'),
   phrase('Nice to meet you!', 'Nice to meet you too!', ['Nice to meet you too!','I am tired!','Turn left!'],['nice to meet you too'],'🤝')],
  'A2':[
   phrase('Welcome aboard! How was your journey?', 'It was wonderful, thank you!', ['It was wonderful, thank you!','The boat is blue!','I have two apples!'],['it was wonderful thank you','my journey was wonderful'],'🚢'),
   phrase('Have you visited this harbor before?', 'No, this is my first visit.', ['No, this is my first visit.','My shoes are red.','See you tomorrow!'],['no this is my first visit','this is my first visit'],'⚓'),
   phrase('Would you like to join our crew?', 'Yes, I would love to!', ['Yes, I would love to!','My cat is small.','It is rainy.'],['yes i would love to','i would love to'],'🧭')]}},
 {id:2,title:'Konuşan İskele',subtitle:'Günlük istekler',icon:'🛟',prompts:{
  'Pre-A1':[
   phrase('Do you want water?', 'Yes, please!', ['Yes, please!','Good night!','It is blue!'],['yes please'],'💧'),
   phrase('Here you are!', 'Thank you!', ['Thank you!','Goodbye!','I am six!'],['thank you','thanks'],'🧃'),
   phrase('Do you like fish?', 'Yes, I do!', ['Yes, I do!','I am a fish!','See you!'],['yes i do','yes'],'🐟')],
  'A1':[
   phrase('Would you like some juice?', 'Yes, please. I am thirsty.', ['Yes, please. I am thirsty.','I have a pencil.','I am at school.'],['yes please i am thirsty','yes please'],'🧃'),
   phrase('What would you like to eat?', 'I would like an apple.', ['I would like an apple.','The boat is big.','It is sunny.'],['i would like an apple','an apple please'],'🍎'),
   phrase('Do you need any help?', 'Yes, can you help me?', ['Yes, can you help me?','I like red.','It is a cat.'],['yes can you help me','please help me'],'🛟')],
  'A2':[
   phrase('Excuse me, could you pass me the map?', 'Of course, here you are.', ['Of course, here you are.','I played yesterday.','The sea is blue.'],['of course here you are','sure here you are'],'🗺️'),
   phrase('Is there anything else you need?', 'Could I have a glass of water?', ['Could I have a glass of water?','The ship is behind us.','My friend is ten.'],['could i have a glass of water','may i have water'],'💦'),
   phrase('Thank you for your help!', 'You are very welcome!', ['You are very welcome!','Turn left now.','That is a bird.'],['you are very welcome','you are welcome'],'🤝')]}},
 {id:3,title:'Kayıp Yolcu',subtitle:'Yön tarifleri ve yardım',icon:'🗺️',prompts:{
  'Pre-A1':[
   phrase('Where is the boat?', 'Over there!', ['Over there!','Thank you!','I am sleepy!'],['over there','there'],'⛵'),
   phrase('Look left!', 'Left!', ['Left!','Right!','Goodbye!'],['left'],'⬅️'),
   phrase('Where is the cat?', 'Here!', ['Here!','See you!','Blue!'],['here','right here'],'🐈')],
  'A1':[
   phrase('Where is the lighthouse?', 'It is over there.', ['It is over there.','I like oranges.','I have two hats.'],['it is over there','over there'],'🗼'),
   phrase('Which way should we go?', 'Turn left, please.', ['Turn left, please.','Good night.','I am happy.'],['turn left please','turn left'],'⬅️'),
   phrase('Can you see the sailor?', 'Yes, he is near the boat.', ['Yes, he is near the boat.','I want ice cream.','It is cold.'],['yes he is near the boat','he is near the boat'],'👨‍✈️')],
  'A2':[
   phrase('How can we get to the lighthouse?', 'Go straight and turn right.', ['Go straight and turn right.','It is my birthday.','I have a dog.'],['go straight and turn right'],'🗼'),
   phrase('Have you seen a sailor in a yellow hat?', 'Yes, I saw him near the bridge.', ['Yes, I saw him near the bridge.','The boat is green.','I went swimming.'],['yes i saw him near the bridge','he is near the bridge'],'🌉'),
   phrase('Could you show us the safest way?', 'Follow the path beside the sea.', ['Follow the path beside the sea.','I can swim fast.','Thank you.'],['follow the path beside the sea'],'🌊')]}},
 {id:4,title:'Fenerdeki Sır',subtitle:'Sorular ve seçimler',icon:'🔦',prompts:{
  'Pre-A1':[
   phrase('Is it dark?', 'Yes!', ['Yes!','Hello!','Cat!'],['yes'],'🌙'),
   phrase('What color is the light?', 'Yellow!', ['Yellow!','Fish!','Goodbye!'],['yellow'],'💛'),
   phrase('Can you see the star?', 'I can!', ['I can!','Thank you!','Left!'],['i can','yes i can'],'⭐')],
  'A1':[
   phrase('Why do we need a lighthouse?', 'To help the boats.', ['To help the boats.','To eat lunch.','To draw a cat.'],['to help the boats','it helps boats'],'🗼'),
   phrase('Is the light on?', 'Yes, it is on.', ['Yes, it is on.','I have a book.','She is my sister.'],['yes it is on','it is on'],'💡'),
   phrase('What should we do now?', 'Let us help the captain.', ['Let us help the captain.','It is my pencil.','I like pizza.'],['let us help the captain','lets help the captain'],'🚢')],
  'A2':[
   phrase('The lighthouse is dark. What could be wrong?', 'Perhaps the lamp is broken.', ['Perhaps the lamp is broken.','My shoes are wet.','I saw a fish.'],['perhaps the lamp is broken','maybe the lamp is broken'],'🛠️'),
   phrase('How can we warn the boats?', 'We can use a bright signal.', ['We can use a bright signal.','We can eat lunch.','We can read a poem.'],['we can use a bright signal'],'🔦'),
   phrase('The light is working again!', 'Now the boats can travel safely.', ['Now the boats can travel safely.','I am carrying apples.','The road is long.'],['now the boats can travel safely'],'✨')]}},
 {id:5,title:'Liman Festivali',subtitle:'Büyük final',icon:'🎉',prompts:{
  'Pre-A1':[
   phrase('Are you ready?', 'Yes, I am!', ['Yes, I am!','I am blue!','Good night!'],['yes i am','yes'],'🥳'),
   phrase('Do you like the music?', 'I love it!', ['I love it!','Turn left!','Fish!'],['i love it','yes i do'],'🎶'),
   phrase('See you again!', 'See you!', ['See you!','Help me!','Water!'],['see you','see you again'],'🎆')],
  'A1':[
   phrase('Welcome to the harbor festival!', 'Thank you for inviting me!', ['Thank you for inviting me!','I am in my room.','This is a pencil.'],['thank you for inviting me','thank you'],'🎪'),
   phrase('What is your favorite part?', 'I love the music and the boats.', ['I love the music and the boats.','The cat is under the table.','It is a pencil.'],['i love the music and the boats'],'🎵'),
   phrase('Will you visit us again?', 'Yes, I will come back!', ['Yes, I will come back!','I am eating now.','Look at my shoes.'],['yes i will come back','i will come back'],'🌟')],
  'A2':[
   phrase('We found the lost sailor! How do you feel?', 'I am glad that everyone is safe.', ['I am glad that everyone is safe.','I need a new pencil.','My room is clean.'],['i am glad that everyone is safe'],'🤗'),
   phrase('What did you enjoy most today?', 'I enjoyed helping the crew.', ['I enjoyed helping the crew.','I will go to school.','I have a blue hat.'],['i enjoyed helping the crew'],'🎊'),
   phrase('Would you like to sail with us tomorrow?', 'That sounds wonderful. See you tomorrow!', ['That sounds wonderful. See you tomorrow!','I am eating breakfast.','The table is small.'],['that sounds wonderful see you tomorrow','see you tomorrow'],'⛵')]}}
] as const;
export function normalizeSpeech(text:string):string{
 return text.toLocaleLowerCase('en-US').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .replace(/['’]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
}
export function matchesExpectedSpeech(alternatives:readonly string[],expected:readonly string[]):boolean{
 return alternatives.some(actual=>{
  const normalized=normalizeSpeech(actual);
  return expected.some(answer=>{
   const phrase=normalizeSpeech(answer);
   return normalized===phrase||normalized.startsWith(phrase+' ')||normalized.endsWith(' '+phrase);
  });
 });
}
