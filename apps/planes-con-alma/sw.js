const CACHE='planes-con-alma-v1';
const ASSETS=['/','/index.html','/styles.css','/app.js','/manifest.webmanifest','/icon.svg','/images/hero_xmadrid.jpg','/images/hero_dinner.jpg','/images/hero_rooftop.jpg','/images/hero_escape.jpg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match('/index.html'))));});
