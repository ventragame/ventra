import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');

test('Modal dialogs take focus on open, keep Tab inside and give focus back on close',()=>{
 const hook=src('lib/a11y/useDialogFocus.ts');
 assert.match(hook,/if\(!dialog\.contains\(document\.activeElement\)\)\{\n\s*if\(!dialog\.hasAttribute\('tabindex'\)\)dialog\.tabIndex=-1;\n\s*dialog\.focus\(\{preventScroll:true\}\);/);
 assert.match(hook,/if\(event\.shiftKey&&\(current===first\|\|current===dialog\)\)\{event\.preventDefault\(\);last\.focus\(\);\}/);
 assert.match(hook,/else if\(!event\.shiftKey&&current===last\)\{event\.preventDefault\(\);first\.focus\(\);\}/);
 assert.match(hook,/if\(opener\?\.isConnected\)opener\.focus\(\{preventScroll:true\}\);/);
 const cases={
  'components/profile/ProfileSelectorModal.tsx':[/useDialogFocus\(dialogRef,isOpen\);/,/<div ref=\{dialogRef\} role="dialog" aria-modal="true" aria-label="Oyuncular ve avatar koleksiyonu"/],
  'components/learning/alphabet/AlphabetGroveAdventure.tsx':[/useDialogFocus\(dialogRef\);/,/<div ref=\{dialogRef\} className="ag-root" role="dialog" aria-modal="true"/],
  'components/learning/themes/ThemeTownAdventure.tsx':[/useDialogFocus\(dialogRef\);/,/<div ref=\{dialogRef\} className="tt-root" role="dialog" aria-modal="true"/]
 };
 for(const [file,patterns] of Object.entries(cases)){const code=src(file);for(const p of patterns)assert.match(code,p,file);}
 // The hook is called before the early "closed" return (rules of hooks).
 const modal=src('components/profile/ProfileSelectorModal.tsx');
 assert.ok(modal.indexOf('useDialogFocus(dialogRef,isOpen);')<modal.indexOf(' if(!isOpen)return null;'));
});
