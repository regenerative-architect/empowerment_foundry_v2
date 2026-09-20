/* Foster + Navi / Ecosystem V2. Modular ZIP compilation; inert, versioned module exchange.
   No external dependencies; imported JSON never becomes JavaScript, markup or a URL. */
'use strict';
(() => {
const api = window.FoundryBridge;
const builtin = window.FOUNDRY_REGISTRY;
if (!api || !builtin || builtin.format !== 'empowerment_registry/1') {
  console.error('Ecosystem registry/bridge unavailable. Original Foundry remains accessible.');
  return;
}
const $ = id => document.getElementById(id);
const encoder = new TextEncoder();
const enc = s => encoder.encode(s);
const copy = x => JSON.parse(JSON.stringify(x));
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeId = id => typeof id === 'string' && /^[a-z][a-z0-9_]{2,70}$/.test(id) && !['__proto__','constructor','prototype'].includes(id);
const slug = x => String(x || 'project').normalize('NFKD').toLowerCase().replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,52) || 'project';
let ready=false, importPreview=null, latestAudit=null, lastInventory=[], reviewedSignature=null;
const state = () => api.getModuleState();
const all = () => builtin.modules.concat(state().customModules);
const selectedProject = () => api.snapshot().projects.find(p => p.id === api.selectedProject());
const selectedIds = () => state().projectModules[api.selectedProject()] || [];
const maps = () => new Map(all().map(m=>[m.id,m]));
const methods = () => new Map(api.dataset().methods.concat(api.snapshot().customMethods).map(m=>[m.id,m]));
const text = (id,value) => { if($(id))$(id).textContent=String(value) };
const message=(s,bad=false)=>api.message(s,bad);
function download(name,data,type){const blob=data instanceof Blob?data:new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function normalize(m){
 if(!m||typeof m!=='object'||Array.isArray(m))throw Error('Expected a module object');
 if(Object.keys(m).some(k=>['__proto__','constructor','prototype','script','code','entrypoint','executable','javascript','html'].includes(k)))throw Error('Module contains disallowed executable or prototype field');
 const required=['id','title','version','domain','description','review','provenance'];
 let out={};for(const k of required){if(typeof m[k]!=='string'||!m[k].trim()||m[k].length>(k==='description'?1200:k==='review'||k==='provenance'?900:160))throw Error('Invalid '+k);out[k]=m[k]}
 if(!safeId(out.id)||!/^\d+\.\d+\.\d+$/.test(out.version))throw Error('Invalid ID or semantic version');
 if(!api.dataset().domains.some(d=>d.id===out.domain))throw Error('Unknown module domain: '+out.domain);
 for(const k of ['method_ids','dependencies']){
  if(!Array.isArray(m[k])||m[k].length>(k==='method_ids'?100:40)||m[k].some(x=>!safeId(x))||new Set(m[k]).size!==m[k].length)throw Error('Invalid '+k);
  out[k]=m[k].slice();
 }
 if(out.dependencies.includes(out.id))throw Error('Module depends on itself');
 for(const k of ['requirements','roles','outputs']){
  if(!Array.isArray(m[k])||m[k].length>25||m[k].some(x=>typeof x!=='string'||!x.trim()||x.length>250))throw Error('Invalid '+k);
  out[k]=m[k].slice();
 }
 out.built_in=false;
 return out;
}
function validateGraph(items, known){
 const by=new Map(items.map(x=>[x.id,x]));
 for(const m of items){
  for(const id of m.method_ids)if(!known.methods.has(id))throw Error(m.id+' references missing method '+id);
  for(const id of m.dependencies)if(!known.modules.has(id)&&!by.has(id))throw Error(m.id+' references missing dependency '+id);
 }
 const visiting=new Set(),done=new Set();
 function visit(id){if(done.has(id))return;if(visiting.has(id))throw Error('Module dependency cycle involving '+id);visiting.add(id);for(const dep of (by.get(id)||known.modules.get(id))?.dependencies||[])visit(dep);visiting.delete(id);done.add(id)}
 for(const m of items)visit(m.id);
}
function resolve(ids){const allMap=maps(),out=[],active=new Set(),done=new Set();function visit(id){if(done.has(id))return;if(active.has(id))throw Error('Dependency cycle: '+id);const mod=allMap.get(id);if(!mod)throw Error('Missing module: '+id);active.add(id);for(const dep of mod.dependencies)visit(dep);active.delete(id);done.add(id);out.push(mod)}ids.forEach(visit);return out}
function assignment(next){let e=state(),pid=api.selectedProject();if(!pid)throw Error('Select a saved project first');e.projectModules[pid]=[...new Set(next)];api.setModuleState(e);latestAudit=null;render();}
function chooseProject(id){if(!id)return;api.setActiveProject(id);latestAudit=null;render();}
function render(){if(!ready)return;const s=api.snapshot(),pid=api.selectedProject(),chosen=selectedIds(),allmods=all();const sel=$('eco-project');const current=s.projects.find(p=>p.id===pid);const signature=JSON.stringify([pid,current?.title,current?.place,current?.goal,current?.need,current?.constraints,current?.methods,current?.technologies,chosen]);if(signature!==reviewedSignature){$('eco-consent').checked=false;reviewedSignature=signature;latestAudit=null;}sel.replaceChildren();sel.add(new Option('Choose a project…',''));for(const p of s.projects)sel.add(new Option(p.title,p.id));sel.value=pid||'';
 text('eco-status',builtin.modules.length+' built-in + '+s.ecosystem.customModules.length+' imported modules');
 text('eco-selection',pid?`${s.projects.find(p=>p.id===pid)?.title||'Project'} · ${chosen.length} modules selected. Dependencies are automatically included when selecting a module; missing references prevent export.`:'Create or select a project in Project commons. No package is generated from another project without selecting it.');
 const q=$('eco-query').value.trim().toLowerCase(),domain=$('eco-domain').value;
 const rows=allmods.filter(m=>(domain==='all'||domain===m.domain)&&(!q||[m.title,m.description,m.domain,m.id,...m.outputs].join(' ').toLowerCase().includes(q)));
 $('eco-modules').innerHTML=rows.map(m=>`<article class="listcard"><div class="row"><label class="checkrow" style="flex:1"><input type="checkbox" data-eco-select="${esc(m.id)}" ${chosen.includes(m.id)?'checked':''} ${pid?'':'disabled'}><span><strong>${esc(m.title)}</strong><br><span class="eco-meta">${esc(m.domain)} · v${esc(m.version)} · ${m.built_in?'built-in':'imported / user-reviewed'} · ${m.method_ids.length} methods</span></span></label><button type="button" class="btn tiny" data-eco-inspect="${esc(m.id)}">Inspect</button></div><p class="small">${esc(m.description)}</p></article>`).join('')||'<p>No matching modules. Try clearing filters.</p>';
 text('eco-build-status',pid?'Select modules, review export text and run the structural audit.':'Choose a project before compiling.');
}
function inspect(id){const m=maps().get(id);if(!m)return;const el=$('eco-detail');el.replaceChildren();const h=document.createElement('h3');h.textContent=m.title;el.append(h);for(const [title,value] of [['Purpose',m.description],['Domain/version',m.domain+' · '+m.version],['Method IDs',m.method_ids.join(', ')||'None'],['Dependencies',m.dependencies.join(', ')||'None'],['Requirements',m.requirements.join('; ')||'None'],['Roles',m.roles.join('; ')||'Not specified'],['Outputs',m.outputs.join('; ')||'Not specified'],['Review',m.review],['Provenance',m.provenance]]){const p=document.createElement('p');const b=document.createElement('strong');b.textContent=title+': ';p.append(b,document.createTextNode(value));el.append(p)}}
function audit(){const p=selectedProject(),blockers=[],warnings=[];if(!p)blockers.push('Select a saved project.');let mods=[],bp=null;
 if(p){try{mods=resolve(selectedIds())}catch(e){blockers.push(e.message)}if(!mods.length)blockers.push('Select at least one declarative module.');const methodMap=methods();for(const m of mods){for(const id of m.method_ids)if(!methodMap.has(id))blockers.push(`${m.id}: missing method ${id}`);if(!api.dataset().domains.some(d=>d.id===m.domain))blockers.push(`${m.id}: unknown domain ${m.domain}`)}try{bp=api.blueprint([...new Set(mods.flatMap(m=>m.method_ids))])}catch(e){blockers.push('Blueprint failed: '+e.message)}if(bp){const blocked=bp.safeguards.filter(g=>g.record.status==='blocked');if(blocked.length)blockers.push('Project has blocked safeguards: '+blocked.map(g=>g.title).join(', '));const unchecked=bp.safeguards.filter(g=>g.record.status!=='documented');if(unchecked.length)warnings.push(`${unchecked.length} of 8 real-world safeguards are not documented; release is only a draft.`);if(!bp.evidence_refs.length)warnings.push('No source/evidence record linked to the project.');}}
 if(!$('eco-consent').checked)blockers.push('Review project text and affirm local export authorization.');
 if($('eco-hosting').checked)warnings.push('Hosted offline installation needs HTTPS/localhost, valid icons and browser support. Extracted files are not a PWA.');
 if($('eco-innovation').checked){if(!p||!window.FoundryInnovation?.forProject(p.id))blockers.push('Select a project with a saved linked innovation genome or uncheck ZIP add-ons.');else warnings.push('Optional genome and prompt-chain ZIP add-ons include user text. Review content and permissions; standalone child HTML does not include these add-ons.');}
 if(!globalThis.crypto?.subtle)warnings.push('SHA-256 not available in this context; archive can still be built with CRC-32 ZIP checks only.');
 warnings.push('No claim of authority, user consent, professional safety, independent review or beneficial outcomes is verified by software.');
 const report={ok:!blockers.length,project:p?.title||null,selected_modules:mods.map(m=>m.id),method_count:new Set(mods.flatMap(m=>m.method_ids)).size,blockers,warnings,generated_local:new Date().toISOString(),status:!blockers.length?'Structural draft checks passed; NOT an operational approval.':'Blocked by structural or consent checks.'};
 latestAudit=report;const node=$('eco-audit');node.replaceChildren();const heading=document.createElement('strong');heading.textContent=report.status;node.append(heading);for(const line of blockers.map(x=>'BLOCK: '+x).concat(warnings.map(x=>'NOTICE: '+x))){const p=document.createElement('p');p.textContent=line;node.append(p)}
 text('eco-build-status',report.ok?`Ready for local compilation: ${mods.length} modules, ${report.method_count} method definitions. Verify private content and downloaded files.`:`Resolve ${blockers.length} blocking item(s) before export.`);
 return {report,mods,bp};
}
function packFor(mods,blueprint=null){const m=methods(),selection=[...new Set(mods.flatMap(x=>x.method_ids))];return {format:'empowerment_module_pack/1',schema:1,registry_version:builtin.registry_version,generated_local:new Date().toISOString(),warning:'Inert, unverified definitions. No executable scripts, verified outcomes, authorization or hidden network sync.',modules:mods.map(x=>{const t=copy(x);delete t.built_in;return t}),methods:selection.map(id=>copy(m.get(id))).filter(Boolean),source:{product:'Foster + Navi Empowerment Foundry',privacy:'Project text omitted from exchange pack. Review any imported method free text before distributing.'}}}
async function exportPack(){const {report,mods}=audit();if(!report.ok)return message('Resolve audit blockers before exporting a pack.',true);const result=packFor(mods);download('empowerment_module_pack.json',JSON.stringify(result,null,2),'application/json');message('Module pack download requested. Review its contents before sharing.')}
function validatePack(obj){if(!obj||typeof obj!=='object'||Array.isArray(obj)||obj.format!=='empowerment_module_pack/1'||obj.schema!==1||!Array.isArray(obj.modules)||!obj.modules.length||obj.modules.length>50||!Array.isArray(obj.methods)||obj.methods.length>100)throw Error('Unsupported module-pack format, schema or size');
 const moduleData=obj.modules.map(normalize);if(new Set(moduleData.map(m=>m.id)).size!==moduleData.length)throw Error('Duplicate module IDs in pack');
 const methodMap=new Map(methods()),validMethods=[];
 for(const m of obj.methods){if(!m||typeof m!=='object'||!safeId(m.id)||typeof m.domain!=='string'||!api.dataset().domains.some(d=>d.id===m.domain))throw Error('Invalid method');for(const field of ['title','overview','action','metric','risk'])if(typeof m[field]!=='string'||!m[field].trim()||m[field].length>1800)throw Error('Invalid method field: '+field);if(!Array.isArray(m.readiness)||m.readiness.length>15||m.readiness.some(x=>typeof x!=='string'||x.length>240))throw Error('Invalid method readiness');if(validMethods.some(x=>x.id===m.id))throw Error('Duplicate method '+m.id);const definition={id:m.id,domain:m.domain,title:m.title,overview:m.overview,action:m.action,metric:m.metric,risk:m.risk,readiness:m.readiness};validMethods.push(definition);methodMap.set(m.id,definition)}
 validateGraph(moduleData,{modules:maps(),methods:methodMap});
 // Built-in and existing IDs are never overwritten; collisions are shown in the preview.
 return {modules:moduleData,methods:validMethods};
}
async function previewImport(){importPreview=null;$('eco-import').disabled=true;const file=$('eco-import-file').files?.[0];if(!file)return text('eco-import-report','Select a JSON module pack first.');try{if(file.size>512*1024)throw Error('Module pack exceeds 512 KB');const obj=JSON.parse(await file.text());const valid=validatePack(obj),known=maps(),methodMap=methods();const conflicts=valid.modules.filter(m=>known.has(m.id)).map(m=>m.id);const methodConflicts=valid.methods.filter(m=>methodMap.has(m.id)).map(m=>m.id);importPreview=valid;text('eco-import-report',`STRUCTURE VALIDATED (authenticity NOT verified)\nFile: ${file.name}\nModules: ${valid.modules.length}; new: ${valid.modules.length-conflicts.length}; conflicts skipped: ${conflicts.join(', ')||'none'}\nMethods: ${valid.methods.length}; new: ${valid.methods.length-methodConflicts.length}; conflicts skipped: ${methodConflicts.join(', ')||'none'}\nNo scripts will be installed. Review purpose, consent, safety and provenance. Imports do not silently overwrite existing IDs.`);$('eco-import').disabled=false}catch(e){text('eco-import-report','REJECTED: '+e.message);message('Module pack rejected: '+e.message,true)}}
function importPack(){if(!importPreview)return;const valid=importPreview,unknown=valid.modules.filter(m=>!maps().has(m.id));if(unknown.length&& !confirm(`Import ${unknown.length} new module(s) as inert definitions? Review their contents and sources before use. Existing IDs remain unchanged.`))return;try{const result=api.importModulePack(valid);importPreview=null;$('eco-import').disabled=true;text('eco-import-report',`Import completed: ${result.modules_added} new modules, ${result.methods_added} new methods. Existing IDs skipped. Use the registry to inspect imported data.`);message('Checked declarative records added locally. No scripts executed.');render()}catch(e){text('eco-import-report','Import rejected; no data changed: '+e.message);message(e.message,true)}}
/* Minimal, standards-conformant ZIP writer, STORE compression method. Browser has no native ZIP writer.
   All names are explicit controlled paths; local headers + central directory + EOCD are emitted. */
const crcTable=(()=>{const arr=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;arr[n]=c>>>0}return arr})();
const crc32=data=>{let c=0xffffffff;for(const byte of data)c=crcTable[(c^byte)&255]^(c>>>8);return(c^0xffffffff)>>>0};
function put16(view,at,v){view.setUint16(at,v,true)}
function put32(view,at,v){view.setUint32(at,v>>>0,true)}
function zipBlob(files){let local=[],central=[],offset=0,seen=new Set();const time=0,date=(46<<9)|(1<<5)|1;let count=0,total=0;
 for(const [path,source] of files){if(!/^[a-zA-Z0-9._/-]{1,180}$/.test(path)||path.startsWith('/')||path.split('/').includes('..')||seen.has(path))throw Error('Unsafe or duplicate ZIP path');seen.add(path);const name=enc(path),data=typeof source==='string'?enc(source):source;if(!(data instanceof Uint8Array))throw Error('Only strings and byte arrays allowed in archive');total+=data.length;if(data.length>12_000_000||total>30_000_000)throw Error('Archive exceeds safe 30 MB size limit');const checksum=crc32(data),header=new Uint8Array(30+name.length),h=new DataView(header.buffer);put32(h,0,0x04034b50);put16(h,4,20);put16(h,6,0x0800);put16(h,8,0);put16(h,10,time);put16(h,12,date);put32(h,14,checksum);put32(h,18,data.length);put32(h,22,data.length);put16(h,26,name.length);header.set(name,30);local.push(header,data);
 const index=new Uint8Array(46+name.length),c=new DataView(index.buffer);put32(c,0,0x02014b50);put16(c,4,20);put16(c,6,20);put16(c,8,0x0800);put16(c,10,0);put16(c,12,time);put16(c,14,date);put32(c,16,checksum);put32(c,20,data.length);put32(c,24,data.length);put16(c,28,name.length);put32(c,42,offset);index.set(name,46);central.push(index);offset+=header.length+data.length;count++;}
 if(count>200)throw Error('Archive file count exceeds limit');const centralLen=central.reduce((sum,x)=>sum+x.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);put32(v,0,0x06054b50);put16(v,8,count);put16(v,10,count);put32(v,12,centralLen);put32(v,16,offset);return new Blob([...local,...central,end],{type:'application/zip'});
}
async function digests(files){if(!globalThis.crypto?.subtle)return {algorithm:null,status:'SHA-256 unavailable in this browser/context; CRC-32 included in archive headers.',files:{}};const entries={};for(const [name,data] of files){const bytes=typeof data==='string'?enc(data):data;let raw=await crypto.subtle.digest('SHA-256',bytes);entries[name]=Array.from(new Uint8Array(raw),v=>v.toString(16).padStart(2,'0')).join('')}return {algorithm:'SHA-256',status:'Checksums show byte identity, not creation time, authorship, approval or provenance.',files:entries}}
function svgIcon(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="42" fill="#08241e"/><circle cx="96" cy="90" r="64" fill="#17483e" stroke="#8decc2" stroke-width="4"/><path d="M96 145V70m0 39c-42-3-46-36-46-47 34 0 48 21 46 47Zm0-20c1-39 29-46 50-49-1 31-20 47-50 49Z" fill="#9ff3ba" stroke="#c5ffe0" stroke-width="3" stroke-linejoin="round"/><path d="M56 150h80" stroke="#c5ffe0" stroke-width="4"/></svg>`}
const swSource=(key,version,files)=>`/* Same-origin, versioned, offline-first. No analytics, imports, cross-origin caching or silent sync. */\n'use strict';\nconst PREFIX='ef_child_${key}_';\nconst CACHE=PREFIX+'${version}';\nconst FILES=${JSON.stringify(files)};\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith(PREFIX)&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;e.respondWith(caches.match(r).then(hit=>hit||fetch(r)));});\n`;
async function createBundle(asZip){const {report,mods,bp}=audit();if(!report.ok)return message('Compilation blocked: resolve review and dependency issues.',true);const ids=[...new Set(mods.flatMap(m=>m.method_ids))],child=api.child(ids);if(!child)throw Error('Child application compiler returned no HTML');if(!asZip){download('index.html',child,'text/html');text('eco-build-status','Standalone child HTML download requested. Test exported backup/import and persistence in your browser.');return}
 const css=child.match(/<style>([\s\S]*?)<\/style>/),js=child.match(/<script>([\s\S]*?)<\/script><\/body>/);
 if(!css||!js)throw Error('Child split failed: source layout changed; standalone compiler remains available.');
 const includePWA=$('eco-hosting').checked,key=slug(bp.project.title).slice(0,30),version=new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14),registryPack=packFor(mods);
 let index=child.replace(css[0],'<link rel="stylesheet" href="./assets/app.css">').replace(js[0],'<script src="./assets/app.js"></scr'+'ipt></body>');
 // Replacement retains the original </html> and the JSON seed; no inline executable JS remains.
 let appJS=js[1];const fileList=[['index.html',index],['assets/app.css',css[1]],['assets/app.js',appJS],['assets/icon.svg',svgIcon()],['data/blueprint.json',JSON.stringify(bp,null,2)],['data/module_pack.json',JSON.stringify(registryPack,null,2)],['data/assembly_audit.json',JSON.stringify(report,null,2)],['LICENSE',LICENSE]];
 if($('eco-innovation').checked){
  const addon=window.FoundryInnovation?.forProject(bp.project.id);
  if(!addon)throw Error('No linked innovation genome for selected project. Save one in the Innovation laboratory or uncheck this option.');
  fileList.push(['data/innovation_genomes.json',JSON.stringify({format:'empowerment_genome_pack/1',schema:1,scope:'Explicitly reviewed ZIP add-on; source project identifiers and owner fields omitted.',genomes:addon.genomes,experiments:[]},null,2)]);
  fileList.push(['data/prompt_chain.json',JSON.stringify(addon.chain,null,2)]);
  fileList.push(['docs/empowerment_prompt_chain.md',addon.chain.markdown]);
 }
 if(includePWA){
  index=index.replace('</head>',`<link rel="manifest" href="./manifest.webmanifest"><meta name="theme-color" content="#08241e"></head>`);
  const register=`\n(()=>{const secure=location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname);if(secure&&'serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('Offline install unavailable:',err.message)));})();`;
  appJS+=register;
  fileList[0][1]=index;fileList[2][1]=appJS;
  fileList.push(['manifest.webmanifest',JSON.stringify({name:bp.project.title+' · Independent project',short_name:bp.project.title.slice(0,28),id:'./',start_url:'./index.html',scope:'./',display:'standalone',background_color:'#08241e',theme_color:'#08241e',icons:[{src:'./assets/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},null,2)]);
  const cached=['./','./index.html','./assets/app.css','./assets/app.js','./assets/icon.svg','./manifest.webmanifest'];fileList.push(['sw.js',swSource(key,version,cached)]);
 }
 const readme=`# ${bp.project.title}\n\nFoster + Navi · generated on local device ${report.generated_local}. Timestamp is unverified.\n\n## Run\n- Extract this ZIP before use. Open index.html directly for the local task application.\n- If the optional PWA files are present, serve the extracted directory over HTTPS or localhost to register its offline worker; file:// service workers do not work.\n- Do not open unknown projects without reviewing their source code. These files were created using the local Foundry compiler.\n- The task board stores private data in browser localStorage when available. Export private JSON backups regularly.\n- Modules are inert, declarative source records. No external libraries, accounts, backend, live multiuser sync or AI inference.\n\n## Included\n- index.html + assets/app.css + assets/app.js: actual interactive application.\n- data/blueprint.json: includes full project metadata and may be PRIVATE.\n- data/module_pack.json: versioned selected method/module definitions without project details.\n- data/assembly_audit.json: structural checks, NOT an approval.\n- SHA256SUMS.json: file hashes where browser cryptography is available.\n\n## Stewardship\nCheck safeguarding, permissions, source accuracy, licensing, accessibility, threat models and domain-specific safety independently before any field deployment. A SHA-256 digest alone cannot prove priority or authorship.\n`;
 fileList.push(['README.md',readme]);const hashes=await digests(fileList);fileList.push(['SHA256SUMS.json',JSON.stringify(hashes,null,2)]);const archive=zipBlob(fileList),name=slug(bp.project.title)+'_empowerment_app.zip';download(name,archive,'application/zip');lastInventory=fileList.map(([path,data])=>({path,bytes:typeof data==='string'?enc(data).length:data.length}));
 const dest=$('eco-release');dest.replaceChildren();const head=document.createElement('p');head.textContent=`Archive prepared: ${name} · ${fileList.length} files · ${archive.size} ZIP bytes · SHA-256 ${hashes.algorithm||'unavailable'}. Download requested; confirm the file appears on your device.`;dest.append(head);for(const file of lastInventory){const line=document.createElement('div');line.className='info-pair';const a=document.createElement('code');a.textContent=file.path;const b=document.createElement('span');b.textContent=file.bytes+' bytes';line.append(a,b);dest.append(line)}text('eco-build-status','Child ZIP generated; inspect downloaded files, test HTTP hosting, storage, security and mobile/screen-reader accessibility before publishing.');message('ZIP compilation completed in the browser. Verify the downloaded artifact.')
}
const LICENSE=`MIT License\n\nCopyright (c) 2026 Foster + Navi\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to inclusion of the copyright notice and this permission notice.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY.\n`;
function initialize(){if(ready)return;ready=true;const d=$('eco-domain');for(const item of api.dataset().domains)d.add(new Option(item.title,item.id));
 $('eco-project').addEventListener('change',e=>chooseProject(e.target.value));$('eco-query').addEventListener('input',render);$('eco-domain').addEventListener('change',render);
 $('eco-open-projects').onclick=()=>api.open('projects');$('eco-select-domain').onclick=()=>{try{const p=selectedProject();if(!p)throw Error('Select a project first');assignment([...selectedIds(),...all().filter(m=>m.domain===p.domain).map(m=>m.id)])}catch(e){message(e.message,true)}};
 $('eco-clear').onclick=()=>{try{assignment([])}catch(e){message(e.message,true)}};
 $('eco-modules').addEventListener('change',e=>{const id=e.target.dataset.ecoSelect;if(!id)return;try{if(e.target.checked){const dependent=resolve([id]).map(m=>m.id);assignment([...selectedIds(),...dependent])}else{const rest=selectedIds().filter(x=>x!==id);const resolved=resolve(rest).map(m=>m.id);if(resolved.includes(id))throw Error('Another selected module requires '+id+'. Deselect the dependent first.');assignment(rest)}}catch(err){message(err.message,true);render()}});
 $('eco-modules').addEventListener('click',e=>{const b=e.target.closest('[data-eco-inspect]');if(b)inspect(b.dataset.ecoInspect)});
 $('eco-consent').addEventListener('change',()=>{latestAudit=null;text('eco-build-status','Review changed. Run audit or compile to re-check.')});$('eco-hosting').addEventListener('change',()=>{latestAudit=null});$('eco-innovation').addEventListener('change',()=>{latestAudit=null;text('eco-build-status','Genome export option changed. Review sensitive content and audit again.');});
 $('eco-audit-run').onclick=audit;$('eco-pack').onclick=exportPack;$('eco-preview').onclick=previewImport;$('eco-import').onclick=importPack;
 $('eco-import-file').addEventListener('change',()=>{importPreview=null;$('eco-import').disabled=true;text('eco-import-report','New file selected. Preview and validate before import.')});
 for(const [id,asZip] of [['eco-export-html',false],['eco-export-zip',true]])$(id).onclick=async()=>{const b=$(id);b.disabled=true;try{await createBundle(asZip)}catch(e){console.error('Compilation failed',e);text('eco-build-status','Compilation failed: '+e.message);message('Compilation failed: '+e.message,true)}finally{b.disabled=false}};
 window.addEventListener('foundry:state',()=>{latestAudit=null;render()});render();

}
window.FoundryEcosystem=Object.freeze({audit:()=>audit().report,registry:()=>copy(all()),zipBlob,validatePack});
window.addEventListener('foundry:ready',initialize,{once:true});
if(window.FOUNDRY_INITIALIZED)initialize();
})();
