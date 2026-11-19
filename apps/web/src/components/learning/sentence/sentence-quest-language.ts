/** Shared child-facing feedback. Assessment and evidence are owned by each game. */
export function sentenceQuestHint(explanation:string,nextWord:string|undefined):string{
 const clean=explanation.trim();
 return '💡 İpucu: '+(clean?clean+' ':'')+'Sıradaki kelime: “'+(nextWord?.trim()||'—')+'”.';
}
export function sentenceQuestCorrect(sentence:string,scene:string):string{
 return '✓ Cümlen doğru! '+sentence+' — '+scene;
}
