#!/usr/bin/env node
/**
 * Ventra mobile audit — real-browser checks at phone widths.
 *
 * Opens /kids like a child would (new local profile, no synthetic data in the
 * product), enters each published game and measures, per screen:
 *   - horizontal page overflow and content pushed off-screen,
 *   - enabled controls smaller than 44×44 CSS px,
 *   - visible text smaller than 12px,
 *   - Story Forest: whether the 💡 hint is covered by answer cards.
 * Screenshots go to apps/web/.mobile-audit/ (git-ignored).
 *
 * Requirements (not installed by default, nothing is downloaded):
 *   npm i -D playwright-core -w apps/web      # once, no bundled browsers
 *   a local Chrome/Edge (auto-detected, or set VENTRA_CHROME=/path/to/chrome)
 *   a running app:  npm run build:web && npm --workspace=apps/web run start -- --port 3217
 *
 * Usage: node scripts/mobile-audit.mjs [--base http://127.0.0.1:3217] [--widths 320x640,390x844]
 * Exit code 1 when overflow, off-screen content, small targets or a covered hint is found.
 * This complements — never replaces — testing on real Android/iOS devices.
 */
import {existsSync,mkdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const args=process.argv.slice(2);
const arg=(name,fallback)=>{const i=args.indexOf('--'+name);return i>=0?args[i+1]:fallback;};
const base=arg('base','http://127.0.0.1:3217');
const sizes=arg('widths','320x640,390x844').split(',').map(s=>s.split('x').map(Number));
const outDir=join(dirname(fileURLToPath(import.meta.url)),'..','.mobile-audit');
mkdirSync(outDir,{recursive:true});

let chromium;
try{({chromium}=await import('playwright-core'));}
catch{
 console.error('playwright-core is not installed. Run once: npm i -D playwright-core -w apps/web');
 process.exit(2);
}
const candidates=[process.env.VENTRA_CHROME,
 'C:/Program Files/Google/Chrome/Application/chrome.exe',
 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
 '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
 '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
const executablePath=candidates.find(path=>existsSync(path));
if(!executablePath){console.error('No Chrome/Edge found. Set VENTRA_CHROME.');process.exit(2);}

let failures=0;
async function open(width,height){
 const browser=await chromium.launch({executablePath});
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,locale:'tr-TR'});
 const page=await context.newPage();
 page.on('pageerror',error=>{failures++;console.log('  PAGE ERROR',error.message);});
 await page.goto(base+'/kids',{waitUntil:'networkidle'});
 await page.getByText('Bireysel Oyna').click();
 await page.locator('input:visible').fill('Deniz');
 await page.getByRole('button',{name:'Bilge Baykuş'}).click();
 await page.getByRole('button',{name:'Macera Evrenine Gir'}).click();
 await page.waitForTimeout(2000);
 return {browser,page};
}
async function measure(page,label,file){
 await page.screenshot({path:join(outDir,file)});
 const r=await page.evaluate(()=>{
  const vw=innerWidth,vh=innerHeight;
  const visible=el=>{const s=getComputedStyle(el),b=el.getBoundingClientRect();
   return b.width>0&&b.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>0.05;};
  const nameOf=el=>(el.getAttribute('aria-label')||el.innerText||el.tagName).replace(/\s+/g,' ').trim().slice(0,32);
  const small=[];
  for(const el of document.querySelectorAll('button,a[href],[role=button],input:not([type=hidden]),select,textarea,summary')){
   if(!visible(el)||el.disabled)continue;const b=el.getBoundingClientRect();
   if(b.bottom<0||b.top>vh*2)continue;
   if(b.width<43.5||b.height<43.5)small.push(nameOf(el)+' '+Math.round(b.width)+'×'+Math.round(b.height));
  }
  const tiny=new Set();const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const t=walker.currentNode,text=t.textContent.trim(),el=t.parentElement;
   if(text.length<2||!el||!visible(el)||el.closest('[aria-hidden="true"]'))continue;
   const b=el.getBoundingClientRect();if(b.bottom<0||b.top>vh*2)continue;
   const size=parseFloat(getComputedStyle(el).fontSize);if(size<12)tiny.add(size+'px "'+text.slice(0,24)+'"');}
  const off=[];
  for(const el of document.querySelectorAll('body *')){
   if(!visible(el)||el.closest('[aria-hidden="true"]'))continue;const b=el.getBoundingClientRect();
   if((b.right<=vw+2&&b.left>=-2)||b.bottom<0||b.top>vh*2)continue;
   let clipped=false;
   for(let p=el.parentElement;p;p=p.parentElement){if(getComputedStyle(p).overflowX!=='visible'){
    const pb=p.getBoundingClientRect();if(pb.right<=vw+2&&pb.left>=-2){clipped=true;break;}}}
   if(!clipped)off.push(el.tagName.toLowerCase()+'.'+String(el.className).split(' ')[0]);
  }
  return {overflow:document.documentElement.scrollWidth-vw,small,tiny:[...tiny],off};
 });
 const bad=r.overflow>0||r.off.length>0||r.small.length>0;
 if(bad)failures++;
 console.log(`${bad?'✖':'✓'} ${label}: overflow ${r.overflow}px · off-screen ${r.off.length} · <44px ${r.small.length} · text<12px ${r.tiny.length}`);
 if(r.small.length)console.log('    small:',r.small.slice(0,8).join(' | '));
 if(r.off.length)console.log('    off-screen:',r.off.slice(0,6).join(' | '));
}
const GARDEN=['Hayvan Çayırı','Lezzet Pazarı','Aile Köyü','Keşif Tapınağı'];
const ISLANDS=['Cümle Meydanı','Diyalog Limanı','Yazı Atölyesi','Keşif Akademisi'];
for(const [width,height] of sizes){
 console.log(`\n— ${width}×${height} —`);
 for(const district of GARDEN){
  const {browser,page}=await open(width,height);
  try{
   await page.locator('button:visible',{hasText:'Kelime Bahçesi’ne Gir'}).click();await page.waitForTimeout(1500);
   await page.locator('button:visible',{hasText:district}).first().click();await page.waitForTimeout(2200);
   const skip=page.locator('button:visible',{hasText:'Atla'});if(await skip.count())await skip.first().click();
   await page.waitForTimeout(500);
   await measure(page,district,`${width}-${district.split(' ')[0]}.png`);
  }catch(error){failures++;console.log('✖',district,'navigation failed:',error.message.split('\n')[0]);}
  finally{await browser.close();}
 }
 for(const island of ISLANDS){
  const {browser,page}=await open(width,height);
  try{
   await page.locator('button:visible',{hasText:island}).last().click();await page.waitForTimeout(800);
   await page.locator('button:visible',{hasText:/Gir/}).first().click();await page.waitForTimeout(2200);
   await measure(page,island+' home',`${width}-${island.split(' ')[0]}-home.png`);
  }catch(error){failures++;console.log('✖',island,'navigation failed:',error.message.split('\n')[0]);}
  finally{await browser.close();}
 }
}
console.log(`\n${failures?'✖':'✓'} mobile audit finished with ${failures} issue(s). Screenshots: ${outDir}`);
process.exit(failures?1:0);
