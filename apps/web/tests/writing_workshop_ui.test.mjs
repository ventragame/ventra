import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WORKSHOP_CHAPTERS,WRITING_WORKSHOP_GAME_ID} from '../src/lib/learning/writingWorkshopEngine.ts';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');

test('All five published chapters have original content and valid local art',()=>{
 assert.equal(WORKSHOP_CHAPTERS.length,5);
 const ids=new Set(WORKSHOP_CHAPTERS.map(c=>c.id));
 assert.equal(ids.size,5);
 const art=new URL('../public/assets/kids-islands/sentence_workshop.webp',import.meta.url);
 const mobile=new URL('../public/assets/kids-islands/sentence_workshop_mobile.webp',import.meta.url);
 assert.ok(fs.statSync(art).size>100000);
 assert.ok(fs.statSync(mobile).size>100000);
});
test('Writing adventure measures independent typing separately from supported tiles',()=>{
 const ui=read('../src/components/learning/writing/WritingWorkshopAdventure.tsx');
 const css=read('../src/components/learning/writing/writing-workshop.css');
 assert.match(ui,/const typed=task.mode==='write'&&firstTry/);
 assert.match(ui,/independentlyTyped:typed/);
 assert.match(ui,/writingAnswers:answerRows/);
 assert.match(ui,/recordGameCompleted\(payload,profileId\)/);
 assert.match(ui,/isWorkshopAnswerCorrect\(task,response\)/);
 assert.match(ui,/onClick=\{submit\}/);
 assert.match(ui,/clearWorkshopCheckpoint/);
 assert.match(ui,/session.current\?\?crypto.randomUUID\(\)/);
 assert.match(ui,/const valid=saved&&saved.step<max\?saved:null/);
 assert.match(ui,/getWorkshopTasks\(chapter,englishLevel,gradeLevel\)/);
 assert.match(ui,/role="progressbar"/);
 assert.match(ui,/aria-label="Oluşturduğun İngilizce cevap"/);
 assert.match(ui,/spellCheck=\{false\}/);
 assert.match(ui,/Bu not sadece şu ekranda görünür/);
 assert.doesNotMatch(ui,/fetch\(|MediaRecorder|formData|upload|\.setItem\(.*input/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/sentence_workshop_mobile.webp/);
 assert.equal(WRITING_WORKSHOP_GAME_ID,'island_sentence_workshop_writing');
});
