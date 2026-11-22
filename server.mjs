import http from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {randomBytes,createHmac,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('./dist/',import.meta.url));
const production=process.env.NODE_ENV==='production';
const secret=process.env.COOKIE_SECRET||(production?randomBytes(32).toString('hex'):'creative-design-local-development-only');
let storePromise;
export function validProducts(html){return new Set(JSON.parse(html.match(/id="catalog-data" type="application\/json">([\s\S]*?)<\/script>/)[1]).products.filter(p=>p.name&&!p.example).map(p=>p.id))}
export function cleanIds(ids,allowed){return Array.isArray(ids)?[...new Set(ids.filter(id=>typeof id==='string'&&allowed.has(id)))].slice(0,30):[]}
const sign=id=>createHmac('sha256',secret).update(id).digest('hex');
function visitor(req,res){const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('cd_visitor='))?.slice(11)||'';const [id,sig]=raw.split('.');if(/^[a-f0-9]{32}$/.test(id||'')&&/^[a-f0-9]{64}$/.test(sig||'')&&timingSafeEqual(Buffer.from(sig),Buffer.from(sign(id))))return sign('visitor:'+id);const fresh=randomBytes(16).toString('hex');res.setHeader('Set-Cookie',`cd_visitor=${fresh}.${sign(fresh)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${production?'; Secure':''}`);return sign('visitor:'+fresh)}
export function createLocalStore(filename){let chain=Promise.resolve();async function read(){try{return JSON.parse(await readFile(filename,'utf8'))}catch(e){if(e.code==='ENOENT')return {counts:{},events:{}};throw e}}return {counts:async()=>{await chain;return (await read()).counts},record:async(ids,visitorId,day)=>{const task=chain.then(async()=>{const data=await read();for(const id of ids){const key=day+':'+visitorId+':'+id;if(!data.events[key]){data.events[key]=true;data.counts[id]=(data.counts[id]||0)+1}}await mkdir(resolve(filename,'..'),{recursive:true});await writeFile(filename+'.tmp',JSON.stringify(data));await rename(filename+'.tmp',filename)});chain=task.catch(()=>{});return task}}}
async function getStore(){if(!storePromise)storePromise=(async()=>{if(process.env.DATABASE_URL){const {default:pg}=await import('pg');const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000,max:5});pool.on('error',()=>console.error('Database connection error'));await pool.query('CREATE TABLE IF NOT EXISTS cd_interest_events (visitor TEXT NOT NULL, product_id TEXT NOT NULL, day DATE NOT NULL, PRIMARY KEY(visitor,product_id,day)); CREATE TABLE IF NOT EXISTS cd_interest_counts (product_id TEXT PRIMARY KEY, requests BIGINT NOT NULL DEFAULT 0)');return {counts:async()=>Object.fromEntries((await pool.query('SELECT product_id, requests FROM cd_interest_counts')).rows.map(r=>[r.product_id,Number(r.requests)])),record:async(ids,v,day)=>{await pool.query(`WITH accepted AS (INSERT INTO cd_interest_events (visitor,product_id,day) SELECT $1, unnest($2::text[]), $3::date ON CONFLICT DO NOTHING RETURNING product_id) INSERT INTO cd_interest_counts(product_id,requests) SELECT product_id,COUNT(*) FROM accepted GROUP BY product_id ON CONFLICT(product_id) DO UPDATE SET requests=cd_interest_counts.requests+EXCLUDED.requests`,[v,ids,day])}}}if(production)throw Error('DATABASE_URL is required');return createLocalStore(resolve('data/interests.json'))})().catch(e=>{storePromise=null;throw e});return storePromise}
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value))};
export const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/popularity'){
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  visitor(req,res);const store=await getStore();const allowed=validProducts(await readFile(resolve(root,'index.html'),'utf8'));const counts=await store.counts();return json(res,200,{counts:Object.fromEntries(Object.entries(counts).filter(([id])=>allowed.has(id)))})
 }
 if(url.pathname==='/api/interest'){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
  if(req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Origin not allowed'});
  const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)return json(res,403,{error:'Origin not allowed'});
  if(!String(req.headers['content-type']).startsWith('application/json'))return json(res,415,{error:'JSON required'});
  let body='';for await(const part of req){body+=part;if(body.length>4096)return json(res,413,{error:'Request too large'})}
  let input;try{input=JSON.parse(body)}catch{return json(res,400,{error:'Invalid JSON'})}
  const allowed=validProducts(await readFile(resolve(root,'index.html'),'utf8'));const ids=cleanIds(input?.productIds,allowed);if(!ids.length)return json(res,200,{recorded:false});
  const visitorId=visitor(req,res);const store=await getStore();await store.record(ids,visitorId,new Date().toLocaleDateString('en-CA',{timeZone:'America/Managua'}));return json(res,200,{recorded:true});
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
 const requested=decodeURIComponent(url.pathname);const path=resolve(root,requested==='/'?'index.html':'.'+requested);if(!path.startsWith(root.endsWith(sep)?root:root+sep))return json(res,403,{error:'Forbidden'});
 const file=await readFile(path);const mime={'.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.css':'text/css','.js':'text/javascript'}[extname(path)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Cache-Control':extname(path)==='.html'?'no-cache':'public, max-age=300'});res.end(req.method==='HEAD'?undefined:file);
}catch(e){if(e.code==='ENOENT')return json(res,404,{error:'Not found'});console.error('Request failed:',e.code||e.name);json(res,503,{error:'Estadísticas temporalmente no disponibles'})}});
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(Number(process.env.PORT)||3000,()=>console.log('Creative Design: http://localhost:'+(process.env.PORT||3000)));