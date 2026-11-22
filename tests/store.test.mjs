import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import vm from 'node:vm';
import {createLocalStore,validProducts,cleanIds} from '../server.mjs';

test('Cuenta una solicitud por producto, visitante y día, con persistencia y concurrencia',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'creative-test-'));
 try{const filename=join(dir,'counts.json');const store=createLocalStore(filename);
 await Promise.all(Array.from({length:10},()=>store.record(['a'],'visitor1','2026-11-22')));
 await store.record(['a','b'],'visitor2','2026-11-22');
 await store.record(['a'],'visitor1','2026-11-23');
 assert.deepEqual(await createLocalStore(filename).counts(),{a:3,b:1});
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('Ignora productos vacíos, ejemplos, referencias falsas y duplicados',()=>{
 const html='<script id="catalog-data" type="application/json">'+JSON.stringify({products:[{id:'real',name:'Figura'},{id:'demo',name:'Demo',example:true},{id:'empty',name:''}]})+'</script>';
 const allowed=validProducts(html);assert.deepEqual(cleanIds(['real','real','demo','empty','bad'],allowed),['real']);assert.deepEqual(cleanIds(null,allowed),[]);
});
test('Ranking y mensajes: formato C$, sin rutas locales y orden por popularidad',async()=>{
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const payload=html.match(/id="catalog-data" type="application\/json">([\s\S]*?)<\/script>/)[1];JSON.parse(payload);
 const elements={};const $=s=>elements[s]??={value:s==='#sort'?'default':'',textContent:s==='#catalog-data'?payload:'',innerHTML:'',classList:{add(){},remove(){}},addEventListener(){},showModal(){this.open=true}};
 const ctx={document:{querySelector:$,addEventListener(){}},localStorage:{getItem(){return null},setItem(){}},location:{protocol:'file:',origin:'null',hostname:'',pathname:'/C:/private/index.html',hash:''},window:{addEventListener(){}},navigator:{},setTimeout(){},setInterval(){},console};
 vm.createContext(ctx);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
 vm.runInContext("buy([{p:data.products[0],q:2}])",ctx);
 const message=new URL($('#order-chat').href).searchParams.get('text');assert(!message.includes('file:'));assert(!message.includes('C:/'));assert(message.includes('C$ 300.00'));
 vm.runInContext("data.products[0].example=false;data.products[1].name='Figura';popularity={'producto-1':2,'producto-2':5};rankingReady=true;renderSales()",ctx);
 assert.equal($('#sales-total').textContent,'7');assert($('#bestsellers').innerHTML.indexOf('Figura')<$('#bestsellers').innerHTML.indexOf('Llavero'));
 ctx.location.protocol='https:';ctx.location.origin='https://tienda.example';ctx.location.hostname='tienda.example';ctx.location.pathname='/';
 vm.runInContext("buy([{p:data.products[0],q:1}])",ctx);assert(new URL($('#order-chat').href).searchParams.get('text').includes('https://tienda.example/#producto-1'));
});