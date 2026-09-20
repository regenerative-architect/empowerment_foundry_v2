#!/usr/bin/env python3
"""Offline, standard-library-only build from auditable v3 sources. Does not fetch remote resources."""
from pathlib import Path
import json,hashlib,shutil,re
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'src';DIST=ROOT/'dist'
read=lambda path:path.read_text(encoding='utf-8')
shell=read(SRC/'shell.html');app=read(SRC/'app.js');eco=read(SRC/'ecosystem.js');innovation=read(SRC/'innovation.js')
data=json.loads(read(SRC/'data.json'));protocol=json.loads(read(SRC/'protocol.json'));registry=json.loads(read(SRC/'registry.json'))
assert len(data['methods'])==60 and len(data['domains'])==15 and len(data['technology'])==63
assert len(protocol['sources'])==22 and len(registry['modules'])==20
assert all(shell.count(t)==1 for t in ('__DATA__','__JS__','__PROTOCOL_DATA__'))
for js in (app,eco,innovation):assert '</script' not in js.lower(),'Unsafe inline script close sequence'
compact=lambda value:json.dumps(value,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
embedded=shell.replace('__DATA__',compact(data)).replace('__PROTOCOL_DATA__',compact(protocol))
registry_script='window.FOUNDRY_REGISTRY='+compact(registry)+';'
js_parts=[app,registry_script,eco,innovation]
standalone=embedded.replace('__JS__','\n</script><script>\n'.join(js_parts))
assert all(t not in standalone for t in ['__DATA__','__JS__','__PROTOCOL_DATA__'])
standdir=DIST/'standalone';standdir.mkdir(parents=True,exist_ok=True)
(standdir/'index.html').write_text(standalone,encoding='utf-8')
shutil.copy2(ROOT/'LICENSE',standdir/'LICENSE')
shutil.copy2(standdir/'index.html',ROOT/'index.html')
# Hosted modular edition loads same code/data through self-hosted assets and uses the same shell.
css=re.search(r'<style>([\s\S]*?)</style>',embedded);assert css
web=embedded.replace(css.group(0),'<link rel="stylesheet" href="./css/main.css">',1)
web=web.replace('<script type="application/json" id="embedded-data">'+compact(data)+'</script>','<script>window.FOUNDRY_WEB_EDITION=true;</script>\n<script src="./data/embedded.js"></script>',1)
# Keep Protocol dataset in inert inline JSON; app.js reads that script directly, so it works with local cache.
web=web.replace('<script>__JS__</script>', '<script src="./js/core.js"></script><script src="./data/registry.js"></script><script src="./js/ecosystem.js"></script><script src="./js/innovation.js"></script>',1)
web=web.replace('</head>','<link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./assets/icon.svg" type="image/svg+xml"></head>',1)
assert all(t not in web for t in ['__DATA__','__JS__','__PROTOCOL_DATA__'])
wd=DIST/'web'
for folder in ('css','js','data','assets'):(wd/folder).mkdir(parents=True,exist_ok=True)
(wd/'index.html').write_text(web,encoding='utf-8')
(wd/'css/main.css').write_text(css.group(1),encoding='utf-8')
for name,body in [('core.js',app),('ecosystem.js',eco),('innovation.js',innovation)]:
 (wd/'js'/name).write_text(body,encoding='utf-8')
(wd/'data/embedded.js').write_text('window.FOUNDRY_DATA='+compact(data)+';\n',encoding='utf-8')
(wd/'data/registry.js').write_text(registry_script+'\n',encoding='utf-8')
shutil.copy2(SRC/'registry.json',wd/'data/registry.json')
for icon in ['icon.svg','icon-192.png','icon-512.png']:shutil.copy2(SRC/'assets'/icon,wd/'assets'/icon)
manifest={'name':'Foster + Navi Empowerment Foundry v3 Unified Ecosystem','short_name':'Foundry v3','id':'./','start_url':'./index.html','scope':'./','display':'standalone','background_color':'#08131d','theme_color':'#08241e','description':'Local-first empowerment research, fieldwork, modular app compiler, innovation genomes and provider-independent prompt chains.','icons':[{'src':'./assets/icon-192.png','sizes':'192x192','type':'image/png','purpose':'any maskable'},{'src':'./assets/icon-512.png','sizes':'512x512','type':'image/png','purpose':'any maskable'}]}
(wd/'manifest.webmanifest').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
# Strictly cache only first-party application shell. Respect current service-worker registration scope.
precache=['./','./index.html','./css/main.css','./js/core.js','./js/ecosystem.js','./js/innovation.js','./data/embedded.js','./data/registry.js','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./manifest.webmanifest']
revision=hashlib.sha256(''.join(hashlib.sha256((wd/p[2:]).read_bytes()).hexdigest() for p in precache if p!='./').encode()).hexdigest()[:16]
worker=f'''/* V3 first-party precache. Requires HTTPS or localhost. No telemetry, background sync or third-party interception. */
'use strict';
const PREFIX='foster_navi_foundry_v3_',CACHE=PREFIX+'{revision}';
const ASSETS={json.dumps(precache)};const SCOPE=new URL(self.registration.scope);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(s=>new URL(s,SCOPE).href)))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting()}});
self.addEventListener('fetch',event=>{{const req=event.request;if(req.method!=='GET'||req.mode==='no-cors')return;const url=new URL(req.url);if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
if(req.mode==='navigate'){{event.respondWith(fetch(req).catch(()=>caches.match(new URL('./index.html',SCOPE).href).then(hit=>hit||Response.error())));return;}}
if(!ASSETS.some(path=>new URL(path,SCOPE).href===url.href))return;event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));}});
'''
(wd/'sw.js').write_text(worker,encoding='utf-8')
# Registration intentionally only in hosted index, never in file:// standalone.
registration='''\n<script>
/* User-controlled hosted upgrade. No worker is registered by the standalone HTML. */
(()=>{'use strict';const status=document.getElementById('pwa-status'),button=document.getElementById('pwa-update');
if(!('serviceWorker'in navigator)||!isSecureContext||location.protocol==='file:'){status.textContent='Offline install requires HTTPS or localhost; portable app still works.';return;}
let waiting=null;function offer(reg){waiting=reg.waiting||null;button.hidden=!waiting;if(waiting)status.textContent='New offline edition downloaded. Export a backup before activating.';}
navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(reg=>{status.textContent='Service worker registration succeeded. Verify actual cached offline reload separately.';offer(reg);reg.addEventListener('updatefound',()=>{const candidate=reg.installing;if(candidate)candidate.addEventListener('statechange',()=>offer(reg));});button.addEventListener('click',()=>{if(waiting&&confirm('Export a backup before activating this cached application update. Activate now?'))waiting.postMessage({type:'SKIP_WAITING'});});navigator.serviceWorker.addEventListener('controllerchange',()=>{status.textContent='New offline app active. Reload when ready.'});}).catch(err=>{status.textContent='PWA unavailable: '+err.message;});
})();
</script>'''
web=web.replace('</body>',registration+'</body>',1)
(wd/'index.html').write_text(web,encoding='utf-8')
shutil.copy2(ROOT/'LICENSE',wd/'LICENSE')
(wd/'README.md').write_text('See ../../README.md. Host all files in this directory together over HTTPS or localhost. Standalone works without service worker.\n')
for edition in (standdir,wd):
 files={str(p.relative_to(edition)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(edition.rglob('*')) if p.is_file() and p.name!='SHA256SUMS.json'}
 (edition/'SHA256SUMS.json').write_text(json.dumps({'algorithm':'SHA-256','hashes':files,'limitation':'Byte equality only; not authorship, signing, precedence, impact or verification of source claims.'},indent=2)+'\n')
release={'format':'empowerment_foundry_release/3','workspace_export_format':'empowerment_foundry/2','revision':revision,'contents':{'methods':60,'domains':15,'technology_references':63,'research_engines':10,'curated_source_records':22,'quantitative_models':4,'built_in_modules':20,'meta_prompt_stages':10},'verification':'Requires independent PWA offline, accessibility, domain safety and real-world impact testing.','files':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(ROOT.rglob('*')) if p.is_file() and p.name not in ('release_manifest.json',) and '__pycache__' not in str(p)}}
(ROOT/'release_manifest.json').write_text(json.dumps(release,indent=2)+'\n')
print('Built v3 standalone',len(standalone),'chars; hosted',len(web),'chars; revision',revision)
