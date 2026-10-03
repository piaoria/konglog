import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const dist=path.resolve('dist');
async function files(directory,prefix='') {
 const entries=await readdir(directory,{withFileTypes:true});
 const result=[];
 for(const entry of entries) {
  const relative=prefix+entry.name;
  if(entry.isDirectory())result.push(...await files(path.join(directory,entry.name),relative+'/'));
  else if(relative==='index.html'||relative==='manifest.webmanifest'||relative.startsWith('assets/')||relative.startsWith('fonts/')||relative.startsWith('icons/')||relative==='favicon.svg'||relative==='favicon-32.png'||relative==='apple-touch-icon.png')result.push(relative);
 }
 return result.sort();
}
const list=await files(dist),hash=createHash('sha256');
for(const file of list){hash.update(file);hash.update(await readFile(path.join(dist,file)));}
const template=await readFile('scripts/service-worker.template.js','utf8');
hash.update(template);
const version=hash.digest('hex').slice(0,16);
const source=template.replace('__VERSION__',version).replace('const SHELL = [];',`const SHELL = ${JSON.stringify(list.map(file=>file==='index.html'?'./':file))};`);
await writeFile(path.join(dist,'sw.js'),source);
console.log(`PWA shell ${version}: ${list.length} static files; runtime APIs excluded`);
