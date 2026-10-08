#!/usr/bin/env node
/** Slonig-compatible: scan t('English source string') and update locale/translation.json.
 * OPENAI_API_KEY is only used from this local Node script; never in the browser.
 * Set OPENAI_MODEL (default gpt-5.2), OPENAI_BATCH (default 50), OPENAI_FILL_EMPTY=1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const envFile=path.join(root,'.env');
if(fs.existsSync(envFile)) for(const line of fs.readFileSync(envFile,'utf8').split(/\r?\n/)) {
  const hit=line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
  if(hit&&!process.env[hit[1]])process.env[hit[1]]=hit[2].replace(/^['"]|['"]$/g,'');
}
const localesRoot=path.join(root,'public','locales');
const langs=JSON.parse(fs.readFileSync(path.join(localesRoot,'index.json'),'utf8'));
const keys=new Set();
for(const name of ['src/main.ts','src/i18n.ts']) {
 const source=fs.readFileSync(path.join(root,name),'utf8');
 for(const match of source.matchAll(/(?<![A-Za-z0-9_\/])t\(\s*['"]([^'"]+)['"]/g))keys.add(match[1]);
}
const fallback=JSON.parse(fs.readFileSync(path.join(localesRoot,'en','translation.json'),'utf8'));
for(const key of Object.keys(fallback))keys.add(key);
const sourceKeys=[...keys].sort();
const read=(lang)=>JSON.parse(fs.readFileSync(path.join(localesRoot,lang,'translation.json'),'utf8'));
const write=(lang,obj)=>fs.writeFileSync(path.join(localesRoot,lang,'translation.json'),JSON.stringify(Object.fromEntries(Object.entries(obj).sort(([a],[b])=>a.localeCompare(b))),null,2)+'\n');
write('en',Object.fromEntries(sourceKeys.map(k=>[k,k])));
const apiKey=process.env.OPENAI_API_KEY;
const model=process.env.OPENAI_MODEL||'gpt-5.2';
const batch=Math.max(1,Number(process.env.OPENAI_BATCH||50));
const fillEmpty=process.env.OPENAI_FILL_EMPTY!=='0';
for(const lang of langs.filter(l=>l!=='en')) {
 const prev=read(lang);
 const merged=Object.fromEntries(sourceKeys.map(k=>[k,typeof prev[k]==='string'?prev[k]:'']));
 const missing=sourceKeys.filter(k=>!(k in prev)||(fillEmpty&&!prev[k]));
 if(!missing.length){write(lang,merged);continue;}
 if(!apiKey){console.log(`${lang}: ${missing.length} missing strings (add OPENAI_API_KEY to translate)`);write(lang,merged);continue;}
 for(let i=0;i<missing.length;i+=batch){
  const part=missing.slice(i,i+batch);
  const response=await fetch('https://api.openai.com/v1/chat/completions',{
   method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},
   body:JSON.stringify({model,temperature:0.2,response_format:{type:'json_object'},messages:[
    {role:'system',content:`Translate beginner-friendly QR scanner UI text into ${lang}. Slonig is an app for face-to-face peer learning in classrooms. Slonig is a product name: do not translate it. Use easy, short phrases that kindergarten-level children can understand when read aloud. Keep the same meaning, preserve punctuation when natural. Reply with one JSON object mapping each EXACT English key to its translation; include every key. No markdown.`},
    {role:'user',content:JSON.stringify(part)}]})
  });
  if(!response.ok)throw Error(`Translation API ${response.status}: ${(await response.text()).slice(0,300)}`);
  const json=await response.json();
  const translated=JSON.parse(json.choices[0].message.content);
  for(const k of part)if(typeof translated[k]==='string'&&translated[k].trim())merged[k]=translated[k];
 }
 write(lang,merged);console.log(`${lang}: translated ${missing.length} strings`);
}
