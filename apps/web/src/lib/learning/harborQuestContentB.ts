import type {HarborQuest} from './harborQuestContentA';
export const QUESTS_B:readonly HarborQuest[]=[
{
 id:'treasure-chart',episode:3,title:'Gizemli Harita',mission:'Haritadaki kayıp işareti bul.',
 action:'chart',place:'sea',actor:'leo',item:'map',
 pre:[
 'Look at the map!|Map!|Apple!|Fish!',
 'Where is the star?|Here!|Bye!|No!',
 'Find the island!|Island!|Market!|House!'
 ],
 a1:[
 'What does this map show?|It shows the harbor and the islands.|It shows the inside of a house.|It shows a classroom.',
 'Where should we look first?|Look at the star on the map.|Look at the bottom of the sea.|Look at the bakery.',
 'What is beside the red mark?|A small island is beside it.|A train is beside it.|A school is beside it.'
 ],
 a2:[
 'The captain gives you a map. What should you find?|We need to locate the marked island.|We should count the people on board.|We could buy fresh fruit.',
 'The compass points north. Which way should we sail?|We should follow the northern route.|We should head towards the market.|We should return to the harbor.',
 'How can you explain your choice?|The marked island lies north of us.|The boat is made of wood.|My friends love the festival.'
 ]
},
{
 id:'bridge-crossing',episode:3,title:'Köprüden Geçiş',mission:'Doğru yönü göster, yol aç.',
 action:'navigate',place:'sea',actor:'parrot',item:'map',
 pre:[
 'Turn left!|Left!|Right!|Stop!',
 'Go straight!|Straight!|Back!|Right!',
 'Turn right!|Right!|Left!|Stop!'
 ],
 a1:[
 'The bridge is on our left. Which way?|Turn left, please.|Turn right, please.|Go back, please.',
 'What should we do after the bridge?|Go straight ahead.|Turn around now.|Stop at the market.',
 'Where is the boat now?|It is near the bridge.|It is inside the house.|It is behind the tree.'
 ],
 a2:[
 'The main path is blocked. What do you suggest?|Let’s take the path to the left.|Let’s wait on the boat forever.|We should visit the market instead.',
 'How do we reach the lighthouse from here?|Cross the bridge, then turn right.|Walk into the forest and stop.|Follow the road back to the square.',
 'A sailor asks whether this route is safe. What do you say?|Yes, the bridge is open now.|No, there is no water nearby.|The ferry is very colorful.'
 ]
},
{
 id:'lost-passenger',episode:3,title:'Kayıp Yolcuyu Bul',mission:'İpuçlarını takip ederek arkadaşını kurtar.',
 action:'rescue',place:'sea',actor:'turtle',item:'turtle',
 pre:[
 'Where is the turtle?|Over there!|Goodbye!|No!',
 'Can you see the boat?|Yes!|No!|Bye!',
 'Help our friend!|I can help!|Good night!|No, thanks!'
 ],
 a1:[
 'Who is missing from the boat?|The little turtle is missing.|The captain is sleeping.|The parrot is singing.',
 'Where did you see the turtle?|He was near the bridge.|He was inside the school.|He was above the clouds.',
 'What should we say to him?|We are here to help you!|Please buy some apples!|Turn off the lights!'
 ],
 a2:[
 'Our friend disappeared near the bridge. What should we ask?|Has anyone seen the little turtle?|Where can we find fresh bread?|How many boats are in the harbor?',
 'A witness saw him beside the rocks. What is the best next step?|We should search near the rocks carefully.|We should leave without looking.|We should climb the lighthouse first.',
 'The turtle is safe. What should you say?|I’m relieved that we found you!|You should not like the sea.|Let’s keep the lantern off.'
 ]
},
{
 id:'lighthouse-night',episode:4,title:'Karanlık Fener',mission:'Feneri aydınlat ve teknelere yardım et.',
 action:'light',place:'lighthouse',actor:'leo',item:'lantern',
 pre:[
 'Is it dark?|Yes!|No!|Hello!',
 'Look at the light!|Light!|Fish!|Map!',
 'Turn on the lamp!|On!|Off!|Down!'
 ],
 a1:[
 'What is wrong with the lighthouse?|The light is not working.|The bridge is too short.|The harbor is very busy.',
 'What should we check first?|Check the lamp, please.|Check the fruit basket.|Check the fishing boat.',
 'Is the lamp working now?|Yes, it is shining!|No, it is sleeping.|The boat is green.'
 ],
 a2:[
 'The light suddenly goes out. What is our first task?|We should check the power and the lamp.|We should invite the captain to dance.|We should look for the lost apples.',
 'A ship is approaching in the dark. Why is the lamp important?|It helps sailors avoid dangerous rocks.|It tells us which fruit is fresh.|It makes the market more colorful.',
 'The light is repaired. How will the crew react?|They will be able to navigate safely.|They will forget where the harbor is.|They will close the market early.'
 ]
},
{
 id:'missing-tools',episode:4,title:'Fener Ustası',mission:'Doğru parçayı bulup mekanizmayı onar.',
 action:'repair',place:'lighthouse',actor:'fox',item:'key',
 pre:[
 'Find the key!|Key!|Apple!|Fish!',
 'Open the box!|Open!|Close!|Sleep!',
 'Is it fixed?|Yes!|No!|Bye!'
 ],
 a1:[
 'What do we need to open the box?|We need a small key.|We need a red apple.|We need a sailing boat.',
 'Where can we find the tools?|They are beside the lamp.|They are in the ocean.|They are at the school.',
 'Can you repair the light?|Yes, I can fix it.|No, I want ice cream.|I am going to bed.'
 ],
 a2:[
 'We cannot open the supply box. What might help?|The brass key should open it.|A fishing net might help.|We should raise the ship’s sail.',
 'We found a loose wire. What should we do?|Ask the lighthouse keeper to repair it safely.|Pull every cable without checking.|Ignore the broken connection.',
 'The light is bright again. What does that tell us?|The lighthouse is working properly now.|The captain is taking a nap.|The market will close tomorrow.'
 ]
},
{
 id:'safe-signal',episode:4,title:'Işıklı Mesaj',mission:'Doğru sinyali seçerek kaptana yol göster.',
 action:'signal',place:'lighthouse',actor:'parrot',item:'crystal',
 pre:[
 'Show a light!|Light!|Apple!|Boat!',
 'Is it bright?|Yes!|No!|Bye!',
 'The ship is safe!|Hooray!|Good night!|Stop!'
 ],
 a1:[
 'What can we use to guide the ship?|Use the bright lighthouse beam.|Use a quiet book.|Use an empty basket.',
 'Which direction should the light point?|Point it toward the sea.|Point it under the table.|Point it into the market.',
 'Can the captain see our signal?|Yes, he can see it!|No, he is a fish.|The bridge is blue.'
 ],
 a2:[
 'A ship cannot see the harbor entrance. How can we help?|Let’s send a bright signal from the lighthouse.|Let’s hide the lantern behind a rock.|Let’s turn off every light.',
 'The captain notices the signal. What should he do next?|He should follow the safe channel into the harbor.|He should sail toward the rocks.|He should stop listening to the crew.',
 'How do we know our mission worked?|The boat reached the harbor safely.|The market sold three apples.|The crew painted a new map.'
 ]
}
];
