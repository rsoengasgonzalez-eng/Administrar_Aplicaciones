import assert from 'node:assert/strict';
import worker from '../src/worker.js';

globalThis.caches={default:{async match(){return null},async put(){}}};
const assets={async fetch(request){return new Response(`asset:${new URL(request.url).pathname}`,{status:200})}};
let mysteryPath='';
const mystery={async fetch(request){mysteryPath=new URL(request.url).pathname;return Response.json({ok:true,path:mysteryPath})}};
let musicPath='';
const music={async fetch(request){musicPath=new URL(request.url).pathname;return Response.json({ok:true,path:musicPath})}};
const escapeService={async fetch(request){
  const path=new URL(request.url).pathname;
  if(path==='/api/rooms')return Response.json({rooms:[{
    id:'real-1',name:'Escape real',company:'Operador real',area:'Madrid',
    address:'Calle Real 1',officialUrl:'https://example.com',themes:['Misterio'],
    minPlayers:2,maxPlayers:6,duration:60
  }]});
  return new Response('not found',{status:404});
}};
const staticEscapeService={async fetch(request){
  const path=new URL(request.url).pathname;
  if(path==='/data.js')return new Response(`window.ESCAPE_ROOMS = [{
    id: "static-1", name: "Escape estático real", company: "Scape Rooms",
    area: "Madrid", address: "Calle Uno", themes: ["Aventura"],
    minPlayers: 2, maxPlayers: 8, duration: 75,
    pricing: { type: "table", values: {2: 70, 3: 81}, published: "70–81 €" },
    officialUrl: "https://example.com/static", note: "Nueva York, "1888": misión"
  }];`,{headers:{'content-type':'text/javascript'}});
  return new Response('not found',{status:404});
}};
let plansPath='';
const plansStub={async fetch(request){plansPath=new URL(request.url).pathname;return Response.json({ok:true,path:plansPath})}};
const namespace={idFromName(name){assert.equal(name,'global');return 'global-id'},get(id){assert.equal(id,'global-id');return plansStub}};
const env={ASSETS:assets,MADRID_MYSTERY:mystery,MUSIC_HUB:music,ESCAPE_ROOMS:escapeService,PLANES_STORE:namespace};

let response=await worker.fetch(new Request('https://portal.test/api/health'),env);
assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,portal:'ready',assets:true,planesStore:true,madridMysteryService:true,musicHubService:true,escapeRoomsService:true,liveData:['mesa-madrid','escape-madrid']});
response=await worker.fetch(new Request('https://portal.test/api/madrid-mystery/api/game'),env);
assert.equal(response.status,200);assert.equal(mysteryPath,'/api/game');
response=await worker.fetch(new Request('https://portal.test/api/madrid-mystery/health'),env);
assert.equal(response.status,200);assert.equal(mysteryPath,'/api/health');
response=await worker.fetch(new Request('https://portal.test/api/music-hub/api/bootstrap?period=week'),env);
assert.equal(response.status,200);assert.equal(musicPath,'/api/bootstrap');
response=await worker.fetch(new Request('https://portal.test/api/music-hub/health'),env);
assert.equal(response.status,200);assert.equal(musicPath,'/api/health');
response=await worker.fetch(new Request('https://portal.test/api/planes/bootstrap',{headers:{'x-client-id':'test'}}),env);
assert.equal(response.status,200);assert.equal(plansPath,'/api/planes/bootstrap');
response=await worker.fetch(new Request('https://portal.test/apps/mesa-madrid/'),env);
assert.equal(await response.text(),'asset:/apps/mesa-madrid/');
response=await worker.fetch(new Request('https://portal.test/api/no-existe'),env);
assert.equal(response.status,404);

const realFetch=globalThis.fetch;
globalThis.fetch=async(url)=>{assert.match(String(url),/overpass/);return Response.json({elements:[{type:'node',id:1,lat:40.42,lon:-3.70,tags:{amenity:'restaurant',name:'Restaurante verificado','addr:street':'Calle Real','addr:housenumber':'1',cuisine:'spanish',website:'https://example.com'}}]})};
response=await worker.fetch(new Request('https://portal.test/api/mesa/restaurants'),env);
assert.equal(response.status,200);let payload=await response.json();assert.equal(payload.source,'OpenStreetMap / Overpass');assert.equal(payload.items.length,1);assert.equal(payload.items[0].name,'Restaurante verificado');
globalThis.fetch=async()=>Response.json({elements:[{type:'node',id:2,lat:40.41,lon:-3.69,tags:{leisure:'escape_game',name:'Escape verificado',website:'https://example.com/escape'}}]});
response=await worker.fetch(new Request('https://portal.test/api/escape/rooms'),env);
assert.equal(response.status,200);payload=await response.json();assert.equal(payload.items.length,1);assert.equal(payload.items[0].name,'Escape real');assert.match(payload.source,/scaperooms/);
const envWithoutEscape={...env,ESCAPE_ROOMS:undefined};
response=await worker.fetch(new Request('https://portal.test/api/escape/rooms'),envWithoutEscape);
assert.equal(response.status,200);payload=await response.json();assert.equal(payload.items.length,1);assert.equal(payload.items[0].name,'Escape verificado');
const envWithStaticEscape={...env,ESCAPE_ROOMS:staticEscapeService};
response=await worker.fetch(new Request('https://portal.test/api/escape/rooms'),envWithStaticEscape);
assert.equal(response.status,200);payload=await response.json();assert.equal(payload.items.length,1);assert.equal(payload.items[0].name,'Escape estático real');assert.equal(payload.items[0].pricing.published,'70–81 €');
globalThis.fetch=realFetch;
console.log('Integrated route and live-data mapping tests passed');
