import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {randomInt,randomBytes} from 'node:crypto';
import ts from 'typescript';
const homeCode=String(randomInt(1000,4000)),awayCode=String(randomInt(5000,9000));
globalThis.Deno={env:{get:name=>name==='SUPABASE_SERVICE_ROLE_KEY'?randomBytes(32).toString('hex'):undefined}};
globalThis.__edgeTestWrapper=(_config,handler)=>handler;
async function load(file) {
 const source=(await fs.readFile(new URL(file,import.meta.url),'utf8')).replace("import { withSupabase } from 'npm:@supabase/server@1.9.0';",'const withSupabase=globalThis.__edgeTestWrapper;');
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
 return (await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)).default;
}
const edge=await load('../supabase/functions/konglog-write/index.ts');
const current=await load('../supabase/functions/konglog-current/index.ts');
function context({allowed=true,limitError=null,saveError=null}={}) {
 const calls=[];return {calls,supabaseAdmin:{rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='consume_write_budget') return {data:allowed,error:limitError};
  if(name==='verify_author_code') return {data:args.submitted_code===homeCode?'kongdol':args.submitted_code===awayCode?'kongsun':null,error:null};
  return {data:null,error:saveError};
 }}};
}
function request(input,origin='https://piaoria.github.io') {return new Request('https://test.invalid/write',{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':'192.0.2.42'},body:JSON.stringify(input)});}
const memo=()=>({kind:'memo',id:crypto.randomUUID(),author:'kongdol',date:'2031-01-01',content:'hello',code:homeCode});
test('daily memo uses server-verified author and SQL upsert with expected Korean date',async()=>{
 const ctx=context(),input=memo();input.content='  hello\nworld  ';
 assert.equal((await edge.fetch(request(input),ctx)).status,200);
 assert.equal(ctx.calls[0].name,'consume_write_budget');assert.match(ctx.calls[0].args.ip_digest,/^[a-f0-9]{64}$/);
 assert.deepEqual(ctx.calls[2],{name:'save_today_memo',args:{memo_author:'kongdol',memo_content:'hello\nworld',request_id:input.id,expected_date:'2031-01-01'}});
});
test('wrong code and wrong paper author cannot write',async()=>{
 for(const input of [{...memo(),code:'0000'},{...memo(),author:'kongsun'}]) {const ctx=context();assert.equal((await edge.fetch(request(input),ctx)).status,403);assert.equal(ctx.calls.length,2);}
});
test('date rollover rejects without reporting a save success',async()=>{
 const ctx=context({saveError:{code:'22023'}}),res=await edge.fetch(request(memo()),ctx);
 assert.equal(res.status,409);assert.match((await res.json()).message,/한국 날짜/);
});
test('persistent quota and storage failures deny before code verification',async()=>{
 for(const [options,status] of [[{allowed:false},429],[{limitError:{}},503]]) {const ctx=context(options);assert.equal((await edge.fetch(request(memo()),ctx)).status,status);assert.equal(ctx.calls.length,1);}
});
test('only home author can change doing, and allowed values are enforced',async()=>{
 for(const [code,status,value] of [[awayCode,403,'sleep'],[homeCode,400,'unlisted'],[homeCode,200,'resume'],[homeCode,200,'running'],[homeCode,200,'exercising'],[awayCode,403,'running'],[awayCode,403,'exercising']]) {
  const ctx=context();assert.equal((await edge.fetch(request({kind:'home_status',status:value,code}),ctx)).status,status);
  if(status===200)assert.deepEqual(ctx.calls[2],{name:'save_home_status',args:{status_value:value}});else assert.equal(ctx.calls.length,2);
 }
});
test('only home can write weight and no browser date reaches weight SQL',async()=>{
 const denied=context();assert.equal((await edge.fetch(request({kind:'weight',kg:80,code:awayCode}),denied)).status,403);assert.equal(denied.calls.length,2);
 const allowed=context();assert.equal((await edge.fetch(request({kind:'weight',kg:80,code:homeCode,date:'1900-01-01'}),allowed)).status,200);assert.deepEqual(allowed.calls[2],{name:'save_today_weight',args:{weight_kg:80}});
});
test('invalid content and oversized body cannot write',async()=>{
 for(const input of [{...memo(),content:'x'.repeat(2001)},{...memo(),date:'invalid'},{kind:'weight',kg:-1,code:homeCode}]) {const ctx=context();assert.equal((await edge.fetch(request(input),ctx)).status,400);assert.equal(ctx.calls.length,2);}
 const ctx=context();assert.equal((await edge.fetch(request({content:'x'.repeat(13000)}),ctx)).status,413);assert.equal(ctx.calls.length,1);
});
test('unexpected write origin is rejected without DB calls',async()=>{const ctx=context();assert.equal((await edge.fetch(request({},'https://else.invalid'),ctx)).status,403);assert.equal(ctx.calls.length,0);});
test('current API rejects query-time injection and writes without any DB access',async()=>{
 for(const req of [new Request('https://test.invalid/current?at=2031-01-01'),new Request('https://test.invalid/current?date=2031-01-01'),new Request('https://test.invalid/current',{method:'POST',body:'{}'})]) {
  assert.equal((await current.fetch(req,{supabaseAdmin:new Proxy({},{get(){throw new Error('DB must not be accessed');}})})).status,400);
 }
});
test('current API returns only a whitelisted current snapshot, never schedule internals',async()=>{
 const calls=[];
 const ctx={supabaseAdmin:{from:()=>({select:()=>({eq:()=>({single:async()=>({data:{status:'baseball'},error:null})})})}),rpc:async(name,args)=>{calls.push({name,args});return {data:{place:'Test city',zone:'UTC',clockLabel:'Test time',status:'Test activity',weather:{latitude:0,longitude:0},flight:null,starts_at:'2031-01-01',futureSchedule:['private future']},error:null};}}};
 const res=await current.fetch(new Request('https://test.invalid/current'),ctx),body=await res.json();
 assert.equal(res.status,200);assert.deepEqual(Object.keys(body.travel).sort(),['clockLabel','place','status','zone']);assert.deepEqual(calls,[{name:'get_current_travel',args:undefined}]);
 assert.equal(JSON.stringify(body).includes('private future'),false);assert.equal(res.headers.get('cache-control'),'no-store');
});
