/**
 * node:test reporter for GitHub Actions: every failing test becomes an
 * "::error" annotation with its file, line, name and the first lines of the
 * assertion. Annotations can be read through the public checks API, so a red
 * CI run can be understood without access to the raw job log.
 *
 * Used by scripts/run-tests.mjs only when GITHUB_ACTIONS is set; the normal
 * "spec" output is kept next to it.
 */
import {relative} from 'node:path';

const escape=(value,property=false)=>{
 let out=String(value).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
 if(property)out=out.replace(/:/g,'%3A').replace(/,/g,'%2C');
 return out;
};

export default async function* githubAnnotations(source){
 const root=process.env.GITHUB_WORKSPACE||process.cwd();
 let shown=0;
 for await(const event of source){
  if(event.type!=='test:fail'||shown>=40)continue;
  const {name,file,line,details}=event.data;
  const error=details?.error;
  // Skip the per-file wrapper when its own subtests already failed.
  if(error?.failureType==='subtestsFailed')continue;
  const cause=error?.cause??error;
  const message=String(cause?.message??cause??'Test failed').split('\n').filter(Boolean).slice(0,8).join('\n');
  const path=file?relative(root,file.startsWith('file:')?new URL(file).pathname:file).replace(/\\/g,'/'):'';
  shown++;
  yield `::error file=${escape(path,true)},line=${line??1},title=${escape(name,true)}::${escape(message)}\n`;
 }
}
