/** Shared child-facing feedback. Assessment and evidence are owned by each game. */
export function sentenceQuestHint(explanation:string,nextWord:string|undefined):string{
 const clean=explanation.trim();
 const word=nextWord?.trim();
 return '💡 İpucu: '+(clean?clean+' ':'')+(word?'Sıradaki kelime: “'+word+'”.':'Seçtiğin kelimelerin sırasını yeniden incele.');
}
export function sentenceQuestCorrect(sentence:string,scene:string):string{
 return '✓ Cümlen doğru! '+sentence+' — '+scene;
}
