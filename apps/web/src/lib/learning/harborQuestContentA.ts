export type HarborLevel='Pre-A1'|'A1'|'A2';
export type HarborAction='meet'|'crew'|'board'|'deliver'|'trade'|'help'|'chart'|'navigate'|'rescue'|'light'|'repair'|'signal'|'invite'|'decorate'|'celebrate';
export type HarborPlace='dock'|'market'|'sea'|'lighthouse'|'festival';
export type HarborActor='leo'|'parrot'|'turtle'|'fox'|'rabbit';
export type HarborQuest={
 id:string;episode:number;title:string;mission:string;
 action:HarborAction;place:HarborPlace;actor:HarborActor;
 item:'boat'|'water'|'apple'|'fish'|'map'|'key'|'lantern'|'crystal'|'parrot'|'cat'|'rabbit'|'turtle';
 pre:readonly string[];a1:readonly string[];a2:readonly string[];
};
/** Each task is question|correct reply|plausible distractor 1|plausible distractor 2.
 * The first beginner choice is always the answer; UI shuffles positions.
 * All authored lines are spoken by the island NPC, never AI-generated. */
export const QUESTS_A:readonly HarborQuest[]=[
{
 id:'captain-arrival',episode:1,title:'Kaptan Leo ile Tanış',mission:'Leo’yu selamla ve arkadaş ol.',
 action:'meet',place:'dock',actor:'leo',item:'boat',
 pre:[
 'Hello, sailor!|Hello!|Goodbye!|Good night!',
 'How are you?|I am happy!|I am sad.|I am tired.',
 'See you soon!|Bye!|Hello!|Good morning!'
 ],
 a1:[
 'Good morning!|Good morning, Captain!|Good night, Captain!|Goodbye, Captain!',
 'What is your name?|My name is Alex.|I am nine years old.|I live here.',
 'Nice to meet you!|Nice to meet you too!|Thank you for the boat.|Where are you?'
 ],
 a2:[
 'Welcome to our harbor. How was your trip?|It was wonderful, thank you.|I have never seen a boat.|I like visiting shops.',
 'Have you visited us before?|No, this is my first visit.|The lighthouse is very tall.|I am from this island.',
 'Would you like to join our crew?|Yes, I would love to!|The weather is sunny.|We visited yesterday.'
 ]
},
{
 id:'meet-parrot',episode:1,title:'Papağan Mimi',mission:'Mimi’nin kim olduğunu keşfet.',
 action:'crew',place:'dock',actor:'parrot',item:'parrot',
 pre:[
 'Say hello to Mimi!|Hi, Mimi!|Bye, Mimi!|Good night, Mimi!',
 'What animal is Mimi?|A parrot!|A cat!|A turtle!',
 'Can Mimi fly?|Yes!|No!|Not now!'
 ],
 a1:[
 'Who is this colorful bird?|This is Mimi the parrot.|This is a small turtle.|This is a blue boat.',
 'What can Mimi do?|She can fly!|She can swim underwater.|She can drive a car.',
 'Can you greet Mimi?|Hello, Mimi! How are you?|Goodbye, Mimi!|I have a red map.'
 ],
 a2:[
 'Could you introduce our new crew member?|This is Mimi, our friendly parrot.|That is the harbor behind us.|My friend loves the sea.',
 'Why is Mimi useful on the boat?|She can spot things from the sky.|She likes sleeping inside.|She can repair the engine.',
 'What would you ask Mimi?|Could you help us find the island?|Would you like some soup?|Is the lantern broken?'
 ]
},
{
 id:'boat-boarding',episode:1,title:'Tekneye Atla!',mission:'Yelkenliyi hazırlayıp ilk yolculuğa çık.',
 action:'board',place:'sea',actor:'leo',item:'boat',
 pre:[
 'Look! A boat!|Boat!|Car!|Train!',
 'Are you ready?|Yes!|No!|Goodbye!',
 'Let’s go!|Let’s go!|Good night!|Stop!'
 ],
 a1:[
 'Where is our boat?|It is beside the dock.|It is in the forest.|It is in the market.',
 'What do we need to sail?|We need a sail.|We need a bicycle.|We need a pillow.',
 'Are you ready to leave?|Yes, let’s go!|No, good night.|I need a pencil.'
 ],
 a2:[
 'The tide is rising. What shall we do?|We should board the boat now.|We should take a long nap.|We should visit the bakery.',
 'How can we get the boat moving?|We can raise the sail.|We can turn off the lantern.|We can fold the map.',
 'Shall we explore the next island?|Yes, let’s set sail together!|Maybe we should go to sleep.|I already ate breakfast.'
 ]
},
{
 id:'fresh-water',episode:2,title:'Su Standı',mission:'Susamış yolcuya su götür.',
 action:'deliver',place:'market',actor:'rabbit',item:'water',
 pre:[
 'Water, please!|Water!|Juice!|Milk!',
 'Here you are!|Thank you!|No, thanks!|Goodbye!',
 'Are you thirsty?|Yes, I am!|No, I am not.|I am sleepy.'
 ],
 a1:[
 'What would you like to drink?|I would like some water, please.|I would like a new map.|I would like to find a boat.',
 'Can you bring me a drink?|Yes, here you are!|No, I am swimming.|I have two hats.',
 'How do you thank someone?|Thank you very much!|Where is the bridge?|I like red apples.'
 ],
 a2:[
 'I have been walking all day. What could help?|A glass of water would help.|A compass will make me taller.|We should switch off the lights.',
 'Would you mind bringing water to the traveler?|Not at all, I’ll bring some now.|I cannot find my map.|I prefer riding boats.',
 'How should the traveler respond politely?|Thank you, that is very kind.|Move aside, I’m busy.|I went there yesterday.'
 ]
},
{
 id:'fruit-basket',episode:2,title:'Meyve Sepeti',mission:'Pazardaki doğru yiyecekleri bul.',
 action:'trade',place:'market',actor:'fox',item:'apple',
 pre:[
 'I want an apple!|Apple!|Fish!|Bread!',
 'Is the apple red?|Yes, it is!|No, it is blue!|No, it is green!',
 'Here is your apple!|Thank you!|Goodbye!|No!'
 ],
 a1:[
 'What would you like to buy?|I would like an apple, please.|I would like to turn left.|I would like to meet the captain.',
 'How many apples do you need?|I need two apples.|I need a new boat.|I need a lighthouse.',
 'Is that everything?|Yes, thank you!|No, turn right.|The boat is big.'
 ],
 a2:[
 'The fruit seller asks what you need. What do you say?|Could I have two fresh apples, please?|Does the lighthouse close early?|Where did you leave your coat?',
 'One apple is bruised. What should you ask?|May I have a different one, please?|Please turn the boat around.|Can you see the stars?',
 'The seller gives you a better apple. How do you respond?|Thank you for helping me!|You should sail tomorrow.|The bridge is on your right.'
 ]
},
{
 id:'fisher-help',episode:2,title:'Balıkçıya Yardım',mission:'Balıkçının kaybolan malzemelerini bul.',
 action:'help',place:'market',actor:'turtle',item:'fish',
 pre:[
 'Can you help me?|Yes!|No!|Bye!',
 'Where is my fish?|Here!|There!|Goodbye!',
 'Thank you, friend!|You’re welcome!|Good night!|Stop!'
 ],
 a1:[
 'What is the fisherman looking for?|He is looking for his fish.|He is looking for a book.|He is looking for a hat.',
 'Can you help carry the basket?|Yes, I can help you.|I am going to school.|I have a purple boat.',
 'Where should we put the fish?|Put it in the basket.|Put it on the roof.|Put it under the bed.'
 ],
 a2:[
 'The fisherman has lost his basket. What do you suggest?|Let’s look near the market stalls.|We should wait for the next train.|Try turning off the lighthouse.',
 'You spot the basket by the pier. What do you say?|I found it beside the wooden pier.|I think the captain is tired.|We might go swimming later.',
 'The fisherman thanks you. How do you respond?|I’m glad I could help you.|The ferry leaves at noon.|My favorite fruit is a pear.'
 ]
}
];
