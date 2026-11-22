import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Minimal DOM surface for the pure helpers (no browser in node:test).
class FakeElement{
 constructor({attrs={},disabled=false,isConnected=true,inert=false,parent=null}={}){
  Object.assign(this,{attrs,disabled,isConnected,inert,parent});
 }
 getAttribute(name){return this.attrs[name]??null;}
 closest(selector){
  for(let el=this;el;el=el.parent){
   if(selector==='[data-return-focus]'&&el.attrs['data-return-focus']!=null)return el;
   if(selector==='[inert]'&&el.inert)return el;
  }
  return null;
 }
}
globalThis.HTMLButtonElement=class extends FakeElement{};
globalThis.HTMLInputElement=class extends FakeElement{};
globalThis.document={body:new FakeElement(),documentElement:new FakeElement()};
const {returnFocusKey,findReturnTarget}=await import('../src/lib/a11y/useReturnFocus.ts');
const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');

test('The opener is remembered by a stable key, also from inside the control',()=>{
 const card=new FakeElement({attrs:{'data-return-focus':'view:animals'}});
 assert.equal(returnFocusKey(card),'view:animals');
 assert.equal(returnFocusKey(new FakeElement({parent:card})),'view:animals','focus on a child of the card');
 assert.equal(returnFocusKey(new FakeElement()),null);
 assert.equal(returnFocusKey(null),null);
 assert.equal(returnFocusKey(document.body),null);
});

test('Focus returns to the first usable control, in key order',()=>{
 const el=(key,extra={})=>new FakeElement({attrs:{'data-return-focus':key},...extra});
 const featured=el('featured'),animals=el('view:animals'),themes=el('view:themes',{disabled:true});
 const hidden=el('view:food',{parent:new FakeElement({inert:true})});
 const root={querySelectorAll:()=>[featured,animals,themes,hidden]};
 assert.equal(findReturnTarget(root,['featured','view:animals']),featured,'the control the child used wins');
 assert.equal(findReturnTarget(root,['missing','view:animals']),animals,'falls back to the game entry');
 assert.equal(findReturnTarget(root,['view:themes']),null,'never a disabled control (still loading)');
 assert.equal(findReturnTarget(root,['view:food']),null,'never a control behind an inert layer');
});

test('Word Garden games give focus back to the control that opened them',()=>{
 const hook=src('lib/a11y/useReturnFocus.ts');
 assert.match(hook,/if\(previous\.current===home&&view!==home&&typeof document!=='undefined'\)opener\.current=returnFocusKey\(document\.activeElement\);/,
  'read while rendering the switch, before the overview unmounts');
 assert.match(hook,/if\(!focusIsLost\(document\.activeElement\)\)return;/,'never steals focus');
 assert.match(hook,/target\.focus\(\{preventScroll:true\}\);/);
 assert.match(hook,/keyboard=target\.matches\(':focus-visible'\)/,'only keyboard users are scrolled');
 assert.match(hook,/if\(keyboard&&document\.activeElement===target&&!comfortablyVisible\(target\)\)target\.scrollIntoView\(\{block:'center'\}\);/);
 assert.match(hook,/return\(\)=>cancelAnimationFrame\(frame\);/);

 const modal=src('components/learning/LearningPathModal.tsx');
 assert.match(modal,/useReturnFocus\(district,'overview'\);/);
 assert.ok(modal.indexOf("useReturnFocus(district,'overview');")<modal.indexOf('if(districtLoading[district])'),'hook runs before any early return');

 const map=src('components/learning/WordGardenDistrictMap.tsx');
 assert.match(map,/className="wg-hero-primary" onClick=\{playFeatured\} data-return-focus="featured"/);
 assert.match(map,/className="wg-alpha-start" type="button" onClick=\{onEnterAlphabet\} data-return-focus="view:alphabet"/);
 assert.match(map,/className="wg-theme-enter" onClick=\{onEnterThemes\} data-return-focus="view:themes"/);
 assert.match(map,/disabled=\{!playable\} data-return-focus=\{'view:'\+id\}/);
 // Every world card key names a district the modal can return from.
 const districts=modal.match(/type District = ([^;]+);/)[1];
 for(const id of ['animals','colors','numbers','food','family','sanctuary','alphabet','themes'])
  assert.match(districts,new RegExp(`'${id}'`),id);
 // The shared focus rule moved to lib; the garden question hook still uses it.
 assert.match(src('components/learning/activities/useQuestionFocus.ts'),/export const questionFocusLost=focusIsLost;/);
});
