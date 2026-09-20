/* Foster + Navi · V3 Innovation Genome and deterministic meta-prompt studio.
   All imports are inert, validated data. No model execution, remote request or implied live collaboration.
   This is a separate optional module: the original Foundry and ecosystem operate if it fails. */
'use strict';
(() => {
const api=window.FoundryBridge;
if(!api||typeof api.getInnovationState!=='function'){
 console.warn('Innovation module unavailable: compatible validated state bridge missing.');return;
}
const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
const id=()=>('g'+Date.now().toString(36)+Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>x.toString(16).padStart(2,'0')).join(''));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp=()=>new Date().toISOString();
const state=()=>api.getInnovationState();
const message=(s,bad=false)=>api.message(s,bad);
const download=(name,body,mime='application/json')=>{
 const b=new Blob([body],{type:mime+';charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');
 a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);
};
const genomeFields=['title','problem','mechanism','hypothesis','population','consent','metric','falsifier','stop','alternatives','owner','status'];
let reviewJSON='',previewHash='',packToImport=null,lastChain=null,initialized=false,rendering=false;
function validateGenome(g){
 if(!g||typeof g!=='object'||Array.isArray(g))throw Error('A genome must be an object');
 const constraints={id:130,projectId:130,title:160,problem:2000,mechanism:2400,hypothesis:1800,population:1000,consent:1400,metric:1000,falsifier:1400,stop:1400,alternatives:1600,owner:400,status:40,created:55,updated:55};
 const out={};for(const [key,max] of Object.entries(constraints)){
  const value=g[key]??'';if(typeof value!=='string'||value.length>max)throw Error('Invalid genome field: '+key);out[key]=value;
 }
 if(!/^[\w.:-]{2,130}$/.test(out.id)||['constructor','prototype','__proto__'].includes(out.id))throw Error('Invalid genome ID');
 if(!['draft','review','pilot','stopped','completed'].includes(out.status))throw Error('Invalid genome lifecycle');
 for(const key of ['title','problem','mechanism','hypothesis','metric','falsifier','stop'])if(!out[key].trim())throw Error('Genome requires '+key);
 return out;
}
function validateExperiment(e){
 if(!e||typeof e!=='object'||Array.isArray(e))throw Error('Invalid experiment');
 const sizes={id:130,genomeId:130,projectId:130,hypothesis:1800,baseline:900,comparator:900,measure:900,stop:900,observation:1800,interpretation:1800,status:40,date:55},out={};
 for(const [key,max] of Object.entries(sizes)){
  const value=e[key]??'';if(typeof value!=='string'||value.length>max)throw Error('Invalid experiment field '+key);out[key]=value;
 }
 if(!/^[\w.:-]{2,130}$/.test(out.id)||['constructor','prototype','__proto__'].includes(out.id))throw Error('Invalid experiment ID');
 if(!['planned','running','observed','stopped'].includes(out.status)||!out.genomeId||!out.measure.trim()||!out.stop.trim()||!out.hypothesis.trim())throw Error('Invalid experiment contract');
 return out;
}
function change(next){
 const result=api.setInnovationState(next);reviewJSON='';previewHash='';$('genome-export').disabled=true;
 render();return result;
}
function selectOptions(){
 const oldProject=$('genome-project').value,oldExp=$('exp-genome').value,oldChain=$('chain-genome').value;
 $('genome-project').replaceChildren(new Option('Independent genome',''));
 for(const p of api.snapshot().projects)$('genome-project').add(new Option(p.title+' · '+p.place,p.id));
 $('genome-project').value=api.snapshot().projects.some(p=>p.id===oldProject)?oldProject:'';
 for(const [node,prior,label] of [[$('exp-genome'),oldExp,'Choose saved genome'],[$('chain-genome'),oldChain,'Use custom challenge']]){
  node.replaceChildren(new Option(label,''));for(const g of state().genomes)node.add(new Option(g.title+' · '+g.status,g.id));
  node.value=state().genomes.some(g=>g.id===prior)?prior:'';
 }
}
function render(){if(rendering)return;rendering=true;try{
 const s=state(),query=$('genome-search').value.trim().toLocaleLowerCase(),rows=s.genomes.filter(g=>!query||Object.values(g).join(' ').toLocaleLowerCase().includes(query));
 $('genome-summary').textContent=`${rows.length} of ${s.genomes.length} saved genomes; ${s.experiments.length} experiment records. Records stay in this browser unless explicitly exported.`;
 $('genome-list').replaceChildren();
 if(!rows.length){const p=document.createElement('p');p.textContent='No matching genomes. Complete the editor to create one.';$('genome-list').append(p)}
 for(const g of rows){
  const box=document.createElement('article');box.className='listcard v3-tag';
  box.innerHTML=`<span class="badge">${esc(g.status)}</span><h4>${esc(g.title)}</h4><p>${esc(g.problem)}</p><details><summary>Mechanism, evidence and stop criteria</summary><div class="detail"><p><strong>Mechanism:</strong> ${esc(g.mechanism)}</p><p><strong>Hypothesis:</strong> ${esc(g.hypothesis)}</p><p><strong>Metric:</strong> ${esc(g.metric)}</p><p><strong>Falsifier:</strong> ${esc(g.falsifier)}</p><p><strong>Stop:</strong> ${esc(g.stop)}</p><p><strong>Alternatives:</strong> ${esc(g.alternatives||'Not specified')}</p></div></details><div class="v3-action"><button class="btn tiny" type="button" data-genome-edit="${esc(g.id)}">Edit</button><button class="btn tiny" type="button" data-genome-fork="${esc(g.id)}">Fork draft</button><button class="btn tiny" type="button" data-genome-chain="${esc(g.id)}">Build prompt chain</button><button class="btn tiny critical" type="button" data-genome-delete="${esc(g.id)}">Delete</button></div>`;
  $('genome-list').append(box);
 }
 $('experiment-list').replaceChildren();
 for(const exp of s.experiments.slice().reverse().slice(0,75)){
  const box=document.createElement('article');box.className='listcard';const parent=s.genomes.find(g=>g.id===exp.genomeId);
  box.innerHTML=`<strong>${esc(parent?.title||'Unlinked genome')} · ${esc(exp.status)}</strong><p>${esc(exp.hypothesis)}</p><details><summary>Recorded design, result and limitations</summary><div class="detail"><p><strong>Baseline:</strong> ${esc(exp.baseline||'Not recorded')}</p><p><strong>Comparator:</strong> ${esc(exp.comparator||'Not recorded')}</p><p><strong>Measure:</strong> ${esc(exp.measure)}</p><p><strong>Stop:</strong> ${esc(exp.stop)}</p><p><strong>Observation:</strong> ${esc(exp.observation||'Not recorded')}</p><p><strong>Interpretation:</strong> ${esc(exp.interpretation||'Not recorded')}</p><small>Local record clock: ${esc(exp.date)} · not independent attestation</small></div></details>`;
  $('experiment-list').append(box);
 }
 selectOptions();
}finally{rendering=false}}
function resetEditor(){
 $('genome-form').reset();$('genome-id').value='';$('genome-status').value='draft';
}
function getEditor(){
 const s=state(),existing=s.genomes.find(g=>g.id===$('genome-id').value);
 const record={id:existing?.id||id(),projectId:$('genome-project').value,created:existing?.created||stamp(),updated:stamp()};
 for(const key of genomeFields)record[key]=$('genome-'+key).value.trim();
 return validateGenome(record);
}
function editGenome(gid){const g=state().genomes.find(x=>x.id===gid);if(!g)return message('Genome no longer exists.',true);
 $('genome-id').value=g.id;for(const key of genomeFields)$('genome-'+key).value=g[key];$('genome-project').value=g.projectId;
 api.open('innovation');$('genome-title').focus();
}
function forkGenome(gid){const s=state(),g=s.genomes.find(x=>x.id===gid);if(!g)return;
 if(s.genomes.length>=300)return message('Genome capacity reached. Export a backup before adding records.',true);
 const fork={...g,id:id(),title:(g.title+' · independent fork').slice(0,160),projectId:'',consent:'',owner:'',status:'draft',created:stamp(),updated:stamp()};
 s.genomes.push(fork);change(s);message('Independent fork created. Consent, ownership and deployment status have been reset.');editGenome(fork.id);
}
function deleteGenome(gid){const s=state(),g=s.genomes.find(x=>x.id===gid);if(!g)return;
 const linked=s.experiments.filter(e=>e.genomeId===gid);
 if(!confirm(`Delete "${g.title}" and ${linked.length} linked experiment record(s)? Export a full private backup first. This deletion cannot be undone here.`))return;
 s.genomes=s.genomes.filter(x=>x.id!==gid);s.experiments=s.experiments.filter(x=>x.genomeId!==gid);change(s);resetEditor();message('Genome and linked experiments deleted locally.');
}
function onSave(e){e.preventDefault();if(!$('genome-form').reportValidity())return;
 try{const s=state(),g=getEditor(),old=s.genomes.findIndex(x=>x.id===g.id);
  if(g.projectId&&!api.snapshot().projects.some(p=>p.id===g.projectId))throw Error('Linked project was not found');
  if(old<0){if(s.genomes.length>=300)throw Error('300-genome limit: back up and archive before continuing');s.genomes.push(g)}else s.genomes[old]=g;
  change(s);resetEditor();message('Genome saved locally. Hypotheses are not verified findings.');
 }catch(err){message('Genome not saved: '+err.message,true)}
}
function onExperiment(e){e.preventDefault();if(!$('experiment-form').reportValidity())return;
 const s=state(),g=s.genomes.find(x=>x.id===$('exp-genome').value);if(!g)return message('Choose an existing genome.',true);
 if(s.experiments.length>=600)return message('Experiment limit reached. Export a backup first.',true);
 const record=validateExperiment({id:id(),genomeId:g.id,projectId:g.projectId,hypothesis:g.hypothesis,
 baseline:$('exp-baseline').value.trim(),comparator:$('exp-comparator').value.trim(),measure:g.metric,stop:g.stop,
 observation:$('exp-observation').value.trim(),interpretation:$('exp-interpretation').value.trim(),status:$('exp-status').value,date:stamp()});
 if(record.status==='observed'&&!record.observation)return message('An observed experiment requires an actual observation.',true);
 s.experiments.push(record);change(s);$('experiment-form').reset();message('Experiment appended; prior records unchanged.');
}
function peerPack(){const s=state();return {format:'empowerment_genome_pack/1',schema:1,created_local:stamp(),scope:'Explicitly shared, locally generated data; free text must be reviewed by owner.',privacy:'Local project identifiers and personal owner fields removed. Other prose may still contain sensitive content.',genomes:s.genomes.map(g=>({...g,projectId:'',owner:''})),experiments:s.experiments.map(e=>({...e,projectId:''}))};}
function prepareExport(){
 const pack=peerPack();reviewJSON=JSON.stringify(pack,null,2);previewHash=JSON.stringify(state());
 $('genome-export-text').value=reviewJSON;$('genome-export').disabled=false;
 message('Export preview prepared. Inspect ALL free text and the payload before downloading.');
}
function exportPack(){if(!reviewJSON||previewHash!==JSON.stringify(state())){reviewJSON='';$('genome-export').disabled=true;return message('Records changed. Generate a fresh export preview.',true)}
 if($('genome-export-text').value!==reviewJSON){$('genome-export').disabled=true;return message('Export preview was altered. Regenerate before exporting.',true)}
 if(!confirm('Have you checked the complete JSON for sensitive information and obtained permission to exchange it?'))return;
 download('empowerment_genome_pack_REVIEWED.json',reviewJSON);message('Genome-pack download requested. Confirm it exists before sharing.');
}
function validatePack(raw){if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.format!=='empowerment_genome_pack/1'||raw.schema!==1)throw Error('Unknown genome-pack format/version');
 if(!Array.isArray(raw.genomes)||raw.genomes.length>300||!Array.isArray(raw.experiments)||raw.experiments.length>600)throw Error('Invalid pack size');
 const genomes=raw.genomes.map(validateGenome),experiments=raw.experiments.map(validateExperiment);
 for(const [name,items] of [['genomes',genomes],['experiments',experiments]])if(new Set(items.map(x=>x.id)).size!==items.length)throw Error('Duplicate '+name+' IDs');
 const ids=new Set(genomes.map(g=>g.id));if(experiments.some(e=>!ids.has(e.genomeId)))throw Error('Experiment references a genome omitted from its pack');
 // Peer files may not force attachments to a similarly named project on another computer.
 genomes.forEach(g=>{g.projectId='';g.owner=''});experiments.forEach(e=>e.projectId='');
 return {genomes,experiments};
}
async function previewImport(){packToImport=null;$('genome-import-merge').disabled=true;
 const file=$('genome-import-file').files?.[0];if(!file)return $('genome-import-report').textContent='Choose a genome-pack JSON file.';
 try{if(file.size>2*1024*1024)throw Error('2 MB size limit');const incoming=validatePack(JSON.parse(await file.text())),existing=new Set(state().genomes.map(g=>g.id));
  const clashes=incoming.genomes.filter(g=>existing.has(g.id));packToImport=incoming;
  $('genome-import-report').textContent=`VALID STRUCTURE, not verified truth/authorship. Genomes: ${incoming.genomes.length}; experiments: ${incoming.experiments.length}; existing genome-ID collisions: ${clashes.length}; first collisions: ${clashes.slice(0,10).map(g=>g.id).join(', ')||'none'}. Import skips colliding genomes and all linked experiments. No records changed yet.`;
  $('genome-import-merge').disabled=false;
 }catch(err){$('genome-import-report').textContent='REJECTED: '+err.message;message('Genome-pack import rejected; no changes applied.',true)}
}
function mergePack(){if(!packToImport)return;
 try{
  const s=state(),known=new Set(s.genomes.map(g=>g.id)),existingExp=new Set(s.experiments.map(e=>e.id));
  const incoming=packToImport.genomes.filter(g=>!known.has(g.id));const allowed=new Set(incoming.map(g=>g.id));
  const exps=packToImport.experiments.filter(e=>allowed.has(e.genomeId)&&!existingExp.has(e.id));
  const staged={genomes:s.genomes.concat(incoming),experiments:s.experiments.concat(exps)};
  if(staged.genomes.length>300||staged.experiments.length>600)throw Error('Workspace record limit exceeded');
  // Core revalidates both sets atomically; no mutation occurs on invalid data.
  api.setInnovationState(staged);render();
  $('genome-import-report').textContent=`Merged ${incoming.length} genomes and ${exps.length} experiments; ${packToImport.genomes.length-incoming.length} colliding genomes skipped with associated experiments. Download a complete private backup using the header.`;
  packToImport=null;$('genome-import-merge').disabled=true;
 }catch(err){$('genome-import-report').textContent='Merge rejected, no mutation: '+err.message;message('Import failed validation: '+err.message,true)}
}
const roles={
 individual:{lead:'Self-directed learner / implementer',partners:['Mentor or independent reviewer','Affected people with permission'],focus:'Make reversible experiments affordable; keep full access to data and ability to stop.'},
 family:{lead:'Household / carers',partners:['All affected household members','Relevant safety professional when needed'],focus:'Account for caregiving, children, accessibility, time and voluntary participation; avoid coercion.'},
 community:{lead:'Resident assembly / cooperative',partners:['Local rights-holders','Maintenance stewards','Neighboring communities'],focus:'Document legitimate representation, accessible participation, shared ownership, grievance and exit pathways.'},
 educator:{lead:'Educator / learning designer',partners:['Learners','Guardians when appropriate','Accessibility specialist'],focus:'Protect students, provide multiple formats, avoid unconsented data collection and distinguish learning from badges.'},
 researcher:{lead:'Investigator / research lead',partners:['Ethics or appropriate independent review','Participants','Methods and domain reviewer'],focus:'Predefine comparison, missing data, confounding, sample limitations, reproducibility and adverse outcomes.'},
 nonprofit:{lead:'Program operator',partners:['Beneficiaries and advocates','Operations/finance','Independent evaluator'],focus:'Separate fundraising measures from real outcomes and account for ongoing maintenance and displacement.'},
 business:{lead:'Worker-inclusive project team',partners:['Employees / contractors','Customers','Supply-chain stewards'],focus:'Price total cost, labor rights, maintenance, interoperability and avoid predatory lock-in.'},
 institution:{lead:'Accountable public/institutional operator',partners:['Affected rights-holders','Frontline workforce','Independent oversight and procurement'],focus:'Record legal/mandate boundaries, procedural fairness, transparency, procurement constraints and appeal channels; avoid political persuasion.'}
};
const steps=[
 {id:'01',title:'Problem discovery and missing facts',question:'Map actual needs, baseline, affected population and who defines success. Identify information that cannot currently be established.',output:'Problem statement, baseline gaps, consent questions.',gate:'Do not invent baseline values or identify affected people without permission.'},
 {id:'02',title:'Stakeholder and sub-entity map',question:'Decompose the lead entity into distinct decision makers, beneficiaries, front-line operators, finance, technical stewards and rights holders. Specify authority and opt-out for each.',output:'RACI-like responsibility and consent table with explicit unknowns.',gate:'Verify authority and avoid overriding rights or legitimate governance.'},
 {id:'03',title:'Evidence retrieval and source audit',question:'Identify primary sources, publication/event dates, populations, methods, funding, disagreements, current policy and local applicability. Distinguish observation from modeling.',output:'Claim–source–limitation matrix and search prompts for independently verifiable references.',gate:'No fabricated citations, current numbers or externally verified claims.'},
 {id:'04',title:'Mechanism and innovation genome',question:'Describe resources → activities → intermediate mechanisms → observable outcomes. Propose a simple alternative and non-technical approach.',output:'Transferable innovation genome, dependencies and counterfactual alternatives.',gate:'An appealing story is not proof of causal benefit.'},
 {id:'05',title:'Safety, equity and failure modes',question:'Use threat modeling, privacy analysis, accessibility, rights-holder approval, misuse scenarios, incentives and reversibility. Include responsible oversight.',output:'Risk register, safeguards, stop triggers and rollback plan.',gate:'Pause deployment if safety-critical assumptions are unresolved.'},
 {id:'06',title:'Measurement and preregistration',question:'Select units, denominators, baseline, comparator, observation windows, evidence provenance and missing-data methods. Record null and adverse outcomes.',output:'Falsifiable hypothesis, experiment plan, data dictionary and noncausal reporting caveats.',gate:'No claim of impact based solely on model estimates, XP or self-reports.'},
 {id:'07',title:'Build a provider-independent artifact',question:'Implement minimum useful functionality in accessible semantic HTML/CSS/vanilla JS. Use one route registry; local data, validation, JSON import/export and truthful offline indicators. If hosted, separate cache version and service worker.',output:'Runnable code, deployment instructions, license/integrity notes and user-controlled data.',gate:'No inert controls, invented APIs, hidden transfers or offline claims beyond actual cache.'},
 {id:'08',title:'Adversarial verification and testing',question:'Try broken imports, invalid schema, malicious markup, conflicting records, no storage, mobile/keyboard, offline reload, cross-browser and measurement counterexamples.',output:'Reproducible test suite; actual results and remaining gaps.',gate:'Do not claim unexecuted tests passed or self-report independent certification.'},
 {id:'09',title:'Pilot, adoption and benefit sharing',question:'Design opt-in trial with costs, support, procurement/permissions where applicable, maintainers and exit rights. Compare total life-cycle costs and displaced burdens.',output:'30/60/90-day pilot, maintenance ledger, governance plan and stakeholder-specific onboarding.',gate:'Participation and benefits must not depend on an opaque score or exclusive provider.'},
 {id:'10',title:'Transfer, remix and recursive innovation',question:'Package validated method, anonymized learnings where consented, JSON schemas, source references, attribution, failure lessons and unresolved prompts for others to independently fork.',output:'Portable bundle plus a new-generation prompt queue from remaining uncertainties.',gate:'Review rights and privacy before distribution; record actual rather than imagined impact.'}
];
function generateChain(form){const s=state();const genome=s.genomes.find(g=>g.id===form.genomeId)||null;
 const lead=roles[form.entity]||roles.individual,challenge=(form.challenge||genome?.problem||'').trim();if(!challenge)throw Error('Define a specific challenge first.');
 const context={challenge,entity:form.entity,lead:lead.lead,subentities:lead.partners,focus:lead.focus,resources:form.resources||'Unknown: first ask about budget, time, maintenance and skills.',evidence:form.evidence||'Not supplied. Ask for sources; do not treat absence as evidence.',privacy:form.privacy||'No external sharing consent established; keep information local and minimize personal data.',deliverable:form.deliverable,genome:genome?clone(genome):null};
 const selected=form.mode==='starter'?[steps[0],steps[1],steps[3],steps[6],steps[9]]:steps;
 const chain=selected.map((step,i)=>({sequence:i+1,id:step.id,title:step.title,depends_on:i?selected[i-1].id:null,expected_output:step.output,review_gate:step.gate,prompt:[
 `ROLE: You are an independent, evidence-aware systems architect supporting ${lead.lead}. Do not substitute your judgments for affected people or legitimate domain experts.`,
 `STAGE ${step.id} / ${selected.length}: ${step.title}.`,
 `CHALLENGE: ${challenge}`,
 `SUB-ENTITIES/REVIEWERS: ${lead.partners.join(' | ')}. Entity-specific priorities: ${lead.focus}`,
 `RESOURCES & CONSTRAINTS: ${context.resources}`,
 `EVIDENCE AND FRESHNESS: ${context.evidence}`,
 `PERMISSION AND DATA BOUNDARIES: ${context.privacy}`,
 genome?`SOURCE GENOME (user-entered hypothesis; not validated): ${genome.title}. Mechanism: ${genome.mechanism}. Metric: ${genome.metric}. Falsifier: ${genome.falsifier}. Stop: ${genome.stop}. Alternatives: ${genome.alternatives||'unknown'}.`:'NO SELECTED GENOME: produce a revisable mechanism and explicitly name assumptions.',
 `TASK: ${step.question}`,
 `EXPECTED OUTPUT: ${step.output}. Target handoff deliverable: ${context.deliverable}.`,
 `HARD REVIEW GATE: ${step.gate}`,
 `SELF-QUERY: Identify missing decisions, relevant sub-entities, evidence contradictions and the most useful next prompt. Answer only what can be supported; mark unverifiable items UNKNOWN.`,
 `HANDOFF: State inputs required by the next stage. Do not claim external access or execution unless actually performed.`
 ].join('\n\n')}));
 const markdown=['# Foster + Navi · Independent empowerment chain','',`Challenge: ${challenge}`,`Lead: ${lead.lead}`,`Deliverable: ${context.deliverable}`,`Depth: ${form.mode}`,`Generated local clock: ${stamp()} (not trusted timing proof)`,'','## Use and provenance','Execute prompts one at a time with a human or any compatible AI, supplying reviewed preceding outputs. This file contains no live research or model outputs. Keep private data out of external services without consent.'];
 for(const c of chain)markdown.push('',`## ${c.id}. ${c.title}`,'',c.prompt,'',`Review gate: ${c.review_gate}`,'');
 return {format:'empowerment_prompt_chain/1',schema:1,created_local:stamp(),context,stages:chain,markdown:markdown.join('\n')};
}
function onChain(e){e.preventDefault();if(!$('chain-form').reportValidity())return;
 try{lastChain=generateChain({genomeId:$('chain-genome').value,challenge:$('chain-challenge').value.trim(),entity:$('chain-entity').value,mode:$('chain-mode').value,resources:$('chain-resources').value.trim(),evidence:$('chain-evidence').value.trim(),privacy:$('chain-privacy').value.trim(),deliverable:$('chain-output').value});
  $('chain-result').value=lastChain.markdown;$('chain-status').textContent=`${lastChain.stages.length} independent stages generated locally. Prompt text is not executed.`;
  $('chain-steps').replaceChildren();for(const c of lastChain.stages){const d=document.createElement('details');d.className='listcard';const summary=document.createElement('summary');summary.textContent=c.id+' · '+c.title;const p=document.createElement('p');p.textContent='Output: '+c.expected_output;const gate=document.createElement('p');gate.textContent='Review: '+c.review_gate;const button=document.createElement('button');button.type='button';button.className='btn tiny';button.textContent='Copy this stage';button.addEventListener('click',()=>copyText(c.prompt));d.append(summary,p,gate,button);$('chain-steps').append(d)}
  for(const key of ['chain-copy','chain-download','chain-json'])$(key).disabled=false;
 }catch(err){lastChain=null;$('chain-status').textContent='Generation failed: '+err.message;message(err.message,true)}
}
async function copyText(text){if(!text)return;try{if(!navigator.clipboard?.writeText)throw Error('Clipboard not available on this origin');await navigator.clipboard.writeText(text);message('Copied to clipboard.')}catch(err){message('Clipboard unavailable; select and copy the visible output manually.',true);$('chain-result').focus();$('chain-result').select()}}
function openChain(gid){const g=state().genomes.find(x=>x.id===gid);if(!g)return;$('chain-genome').value=g.id;$('chain-challenge').value=g.problem;$('chain-privacy').value=g.consent;api.open('prompt-lab');$('chain-challenge').focus();}
function bind(){
 $('genome-form').addEventListener('submit',onSave);$('genome-form').addEventListener('reset',()=>setTimeout(resetEditor,0));
 $('genome-search').addEventListener('input',render);$('experiment-form').addEventListener('submit',onExperiment);
 $('genome-list').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.genomeEdit)editGenome(b.dataset.genomeEdit);else if(b.dataset.genomeFork)forkGenome(b.dataset.genomeFork);else if(b.dataset.genomeChain)openChain(b.dataset.genomeChain);else if(b.dataset.genomeDelete)deleteGenome(b.dataset.genomeDelete)});
 $('genome-preview').onclick=prepareExport;$('genome-export').onclick=exportPack;
 $('genome-import-preview').onclick=previewImport;$('genome-import-merge').onclick=mergePack;
 $('genome-import-file').onchange=()=>{packToImport=null;$('genome-import-merge').disabled=true;$('genome-import-report').textContent='New file selected. Validate and preview before merging.'};
 $('chain-genome').addEventListener('change',()=>{const g=state().genomes.find(x=>x.id===$('chain-genome').value);if(g&&!$('chain-challenge').value.trim())$('chain-challenge').value=g.problem});
 $('chain-form').addEventListener('submit',onChain);
 $('chain-copy').onclick=()=>lastChain&&copyText(lastChain.markdown);
 $('chain-download').onclick=()=>lastChain&&download('empowerment_prompt_chain.md',lastChain.markdown,'text/markdown');
 $('chain-json').onclick=()=>lastChain&&download('empowerment_prompt_chain.json',JSON.stringify({...lastChain,markdown:lastChain.markdown},null,2));
 window.addEventListener('foundry:state',render);
}
function initialize(){if(initialized)return;initialized=true;try{bind();render();}catch(err){console.error('Innovation module initialisation failed',err);api.message('Innovation module could not initialize; Foundry core remains available.',true)}}
function forProject(projectId){
 const genomes=state().genomes.filter(g=>g.projectId===projectId).sort((a,b)=>b.updated.localeCompare(a.updated));
 if(!genomes.length)return null;
 const chosen=genomes[0];const chain=generateChain({genomeId:chosen.id,challenge:chosen.problem,entity:'community',mode:'rigorous',resources:'Unknown: validate available resources and responsible stewards.',evidence:'Genome is user-generated hypothesis; independently check research and local baseline.',privacy:'Reviewed by the local exporter for this particular ZIP; no extra network access.',deliverable:'multi-file'});
 // Never implicitly put private project identifiers or owner information into the peer-facing addon.
 if(chain.context.genome){chain.context.genome.projectId='';chain.context.genome.owner='';}
 return {genomes:genomes.map(g=>({...g,projectId:'',owner:''})),chain};
}
window.FoundryInnovation=Object.freeze({validatePack,generateChain,forProject,stages:()=>clone(steps),roles:()=>clone(roles),getState:state});
window.addEventListener('foundry:ready',initialize,{once:true});if(window.FOUNDRY_INITIALIZED)initialize();
})();
