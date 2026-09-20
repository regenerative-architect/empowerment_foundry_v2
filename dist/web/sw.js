/* V3 first-party precache. Requires HTTPS or localhost. No telemetry, background sync or third-party interception. */
'use strict';
const PREFIX='foster_navi_foundry_v3_',CACHE=PREFIX+'6d9bf8aa1e14babc';
const ASSETS=["./", "./index.html", "./css/main.css", "./js/core.js", "./js/ecosystem.js", "./js/innovation.js", "./data/embedded.js", "./data/registry.js", "./assets/icon.svg", "./assets/icon-192.png", "./assets/icon-512.png", "./manifest.webmanifest"];const SCOPE=new URL(self.registration.scope);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(s=>new URL(s,SCOPE).href)))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||req.mode==='no-cors')return;const url=new URL(req.url);if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
if(req.mode==='navigate'){event.respondWith(fetch(req).catch(()=>caches.match(new URL('./index.html',SCOPE).href).then(hit=>hit||Response.error())));return;}
if(!ASSETS.some(path=>new URL(path,SCOPE).href===url.href))return;event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));});
