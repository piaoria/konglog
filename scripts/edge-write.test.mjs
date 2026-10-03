import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { randomInt, randomBytes } from 'node:crypto';
import ts from 'typescript';

// Synthetic credentials generated for each test run; never read real settings.
const homeCode = String(randomInt(1000,4000));
const awayCode = String(randomInt(5000,9000));
const env = { ALLOWED_ORIGIN:'https://piaoria.github.io', SUPABASE_SERVICE_ROLE_KEY:randomBytes(32).toString('hex') };
globalThis.Deno = { env:{ get:name=>env[name] } };
globalThis.__edgeTestWrapper = (_config, handler)=>handler;
const source = (await fs.readFile(new URL('../supabase/functions/konglog-write/index.ts',import.meta.url),'utf8')).replace("import { withSupabase } from 'npm:@supabase/server@1.9.0';",'const withSupabase = globalThis.__edgeTestWrapper;');
const js = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {default: edge} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
function context({allowed=true,limitError=null}={}) {
 const calls=[];
 return {calls,supabaseAdmin:{
  rpc:async(name,args)=>{calls.push({name,args});return name==='consume_write_budget'?{data:allowed,error:limitError}:name==='verify_author_code'?{data:args.submitted_code===homeCode?'kongdol':args.submitted_code===awayCode?'kongsun':null,error:null}:{data:null,error:null};},
  from:name=>({upsert:(row,options)=>({select:async()=>{calls.push({name,row,options});return {data:[row],error:null};}})}),
 }};
}
function request(input,origin=env.ALLOWED_ORIGIN) {return new Request('https://test.invalid/write',{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':'192.0.2.42'},body:JSON.stringify(input)});}
test('valid memo uses server author, bounded content, and idempotent insert',async()=>{
 const ctx=context(); const id=crypto.randomUUID();
 const res=await edge.fetch(request({kind:'memo',id,content:'  hello\nworld  ',code:homeCode,author:'kongsun'}),ctx);
 assert.equal(res.status,200);
 assert.equal(ctx.calls[0].name,'consume_write_budget');
 assert.match(ctx.calls[0].args.ip_digest,/^[a-f0-9]{64}$/);
 assert.deepEqual(ctx.calls[2].row,{id,content:'hello\nworld',author:'kongdol'});
 assert.equal(ctx.calls[2].options.ignoreDuplicates,true);
});
test('wrong code never writes and still consumes persistent budget',async()=>{
 const ctx=context(); const res=await edge.fetch(request({kind:'memo',id:crypto.randomUUID(),content:'x',code:'0000'}),ctx);
 assert.equal(res.status,403); assert.equal(ctx.calls.length,2);
});
test('rate limit failure denies before code verification; storage error fails closed',async()=>{
 for(const [options,status] of [[{allowed:false},429],[{limitError:{}},503]]) {
  const ctx=context(options); const res=await edge.fetch(request({kind:'weight',kg:80,code:homeCode}),ctx);
  assert.equal(res.status,status);assert.equal(ctx.calls.length,1);
 }
});
test('away author cannot write weight; home date is not accepted from browser',async()=>{
 const denied=context(); assert.equal((await edge.fetch(request({kind:'weight',kg:80,code:awayCode}),denied)).status,403);
 assert.equal(denied.calls.length,2);
 const allowed=context(); assert.equal((await edge.fetch(request({kind:'weight',kg:80,code:homeCode,date:'1900-01-01'}),allowed)).status,200);
 assert.deepEqual(allowed.calls[2],{name:'save_today_weight',args:{weight_kg:80}});
});
test('invalid weight and oversized content cannot write',async()=>{
 for(const input of [{kind:'weight',kg:-1,code:homeCode},{kind:'weight',kg:1000,code:homeCode},{kind:'memo',id:crypto.randomUUID(),content:'x'.repeat(2001),code:homeCode}]) {
  const ctx=context(); assert.equal((await edge.fetch(request(input),ctx)).status,400); assert.equal(ctx.calls.length,2);
 }
 const ctx=context(); assert.equal((await edge.fetch(request({content:'x'.repeat(13000)}),ctx)).status,413);
 assert.equal(ctx.calls.length,1);
});
test('unapproved origin rejects without DB access',async()=>{
 const ctx=context();assert.equal((await edge.fetch(request({},'https://else.invalid'),ctx)).status,403);assert.equal(ctx.calls.length,0);
});
