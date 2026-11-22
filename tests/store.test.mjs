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
 const source=await readFile(new URL('../dist/productos.js',import.meta.url),'utf8');
 const payload=source.slice(source.indexOf('{'),source.lastIndexOf('}')+1);JSON.parse(payload);
 const elements={};const $=s=>elements[s]??={value:s==='#sort'?'default':'',textContent:s==='#catalog-data'?payload:'',innerHTML:'',classList:{add(){},remove(){}},addEventListener(){},showModal(){this.open=true}};
 const ctx={document:{body:{dataset:{}},querySelector:$,addEventListener(){}},localStorage:{getItem(){return null},setItem(){}},location:{protocol:'file:',origin:'null',hostname:'',pathname:'/C:/private/index.html',hash:'',search:''},window:{CREATIVE_CATALOG:JSON.parse(payload),addEventListener(){}},navigator:{},URL,URLSearchParams,setTimeout(){},setInterval(){},console};
 vm.createContext(ctx);vm.runInContext(await readFile(new URL('../dist/app.js',import.meta.url),'utf8'),ctx);
 vm.runInContext("buy([{p:data.products[0],q:2}])",ctx);
 const message=new URL($('#order-chat').href).searchParams.get('text');assert(!message.includes('file:'));assert(!message.includes('C:/'));assert(message.includes('C$ 300.00'));
 vm.runInContext("data.products[0].example=false;data.products[1].name='Figura';popularity={'producto-1':2,'producto-2':5};rankingReady=true;renderSales()",ctx);
 assert.equal($('#sales-total').textContent,'7');assert($('#bestsellers').innerHTML.indexOf('Figura')<$('#bestsellers').innerHTML.indexOf('Llavero'));
 ctx.location.protocol='https:';ctx.location.origin='https://tienda.example';ctx.location.hostname='tienda.example';ctx.location.pathname='/';ctx.location.href='https://tienda.example/';
 vm.runInContext("buy([{p:data.products[0],q:1}])",ctx);assert(new URL($('#order-chat').href).searchParams.get('text').includes('https://tienda.example/catalogo.html#producto-1'));
});
test('Cada página funciona sin las secciones de las otras y sin editor público',async()=>{
 const files=['index.html','catalogo.html','mas-vendidos.html','personalizados.html','llaveros.html','figuras.html','impresiones-3d.html','papeleria.html','broches.html'];
 const source=await readFile(new URL('../dist/productos.js',import.meta.url),'utf8');const payload=JSON.parse(source.slice(source.indexOf('{'),source.lastIndexOf('}')+1));
 const script=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
 for(const file of files){const html=await readFile(new URL('../dist/'+file,import.meta.url),'utf8');assert(!html.includes('Preparar mi catálogo'));assert(!html.includes('id="editor"'));assert(html.includes('src="logo.svg"'));
 const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>['#'+m[1],{value:m[1]==='sort'?'default':'',innerHTML:'',textContent:'',addEventListener(){},classList:{add(){},remove(){}},showModal(){}}]));
 const ctx={document:{body:{dataset:{category:html.match(/data-category="([^"]+)"/)[1]}},querySelector:s=>elements[s]||null,addEventListener(){}},localStorage:{getItem(){return null},setItem(){}},location:{protocol:'file:',search:'',hash:''},window:{CREATIVE_CATALOG:structuredClone(payload),addEventListener(){}},navigator:{},URL,URLSearchParams,setInterval(){},setTimeout(){}};
 vm.createContext(ctx);vm.runInContext(script,ctx);
 if(file==='index.html')assert(!elements['#products']&&!elements['#bestsellers']);if(file==='mas-vendidos.html')assert(elements['#bestsellers']&&!elements['#products']);
 }
});