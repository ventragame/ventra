import type {HarborQuest} from './harborQuestContentA';
export const QUESTS_C:readonly HarborQuest[]=[
{
 id:'crew-invitations',episode:5,title:'Herkesi Davet Et',mission:'Liman festivaline yeni arkadaşlar çağır.',
 action:'invite',place:'festival',actor:'parrot',item:'parrot',
 pre:[
 'Come to the party!|Yes!|No!|Bye!',
 'Are you happy?|Yes!|No!|Stop!',
 'Welcome, friend!|Hello!|Good night!|Goodbye!'
 ],
 a1:[
 'Would you like to join our party?|Yes, I would love to!|No, I want a fish.|The map is on the table.',
 'Who should we invite next?|Let’s invite our friend Mimi.|Let’s visit the empty classroom.|The boat is very big.',
 'What time does the party start?|It starts this evening.|It was yesterday morning.|The bridge is behind us.'
 ],
 a2:[
 'We need more guests for the festival. What could we say?|Would you like to celebrate with us?|Why did you forget your compass?|Can I repair your lantern?',
 'Some visitors do not know where to go. What should we explain?|The festival is beside the main harbor.|We should leave before they arrive.|My favorite color is turquoise.',
 'A guest agrees to come. How do you respond?|We are delighted you can join us!|Please do not visit our island.|The lighthouse is made of stone.'
 ]
},
{
 id:'festival-preparations',episode:5,title:'Limanı Süsle',mission:'Fenerleri yak, bayrakları as, müziği başlat.',
 action:'decorate',place:'festival',actor:'rabbit',item:'lantern',
 pre:[
 'Find the lantern!|Lantern!|Apple!|Fish!',
 'What color is the flag?|Blue!|Red!|Green!',
 'Let’s dance!|Dance!|Sleep!|Stop!'
 ],
 a1:[
 'Where should we hang the lanterns?|Hang them above the dock.|Put them under the water.|Leave them in the forest.',
 'What else does the festival need?|It needs music and colorful flags.|It needs a rainy day.|It needs an empty lighthouse.',
 'Are we ready for our visitors?|Yes, everything is ready!|No, the boat is red.|I am looking for a map.'
 ],
 a2:[
 'The festival begins at sunset. What should we prepare first?|Let’s hang the lanterns along the pier.|We should close the harbor entrance.|We could leave the decorations at home.',
 'The music is too quiet. What can we ask the band?|Could you play a little louder, please?|Could you stop the lighthouse now?|Do you need another map?',
 'Our guests have arrived. What should happen next?|We can welcome everyone to the celebration.|We must hide all the lights.|We should lock the wooden bridge.'
 ]
},
{
 id:'harbor-grand-finale',episode:5,title:'Büyük Liman Şenliği',mission:'Kaptanla buluş, tekneyi uğurla, zaferi kutla.',
 action:'celebrate',place:'festival',actor:'leo',item:'boat',
 pre:[
 'Are you ready?|Yes!|No!|Bye!',
 'Say thank you!|Thank you!|Goodbye!|Hello!',
 'See you again!|See you!|Good night!|Stop!'
 ],
 a1:[
 'How was your adventure?|It was wonderful!|The boat is orange.|I have a pen.',
 'What did we learn together?|We learned to help our friends.|We learned to hide the boats.|We learned to stay silent.',
 'Will you come back tomorrow?|Yes, see you tomorrow!|No, I am a turtle.|My favorite drink is milk.'
 ],
 a2:[
 'What was the most important part of our journey?|Helping our friends was the best part.|I liked counting all the windows.|The island has many tall trees.',
 'How can we thank everyone who helped?|We should thank the whole crew for their kindness.|We should turn off the festival lights.|We should throw the map into the sea.',
 'What would you say before sailing home?|Thank you for an unforgettable adventure!|The fish market opens tomorrow.|The bridge is on our left.'
 ]
}
];