#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
from pathlib import Path
import tempfile,zipfile,json,hashlib
R=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=b.new_context(accept_downloads=True,viewport={'width':1400,'height':900})
 p=ctx.new_page();errors=[];remote=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('request',lambda req:remote.append(req.url) if req.url.startswith(('http://','https://')) else None)
 p.set_content((R/'dist/standalone/index.html').read_text(),wait_until='domcontentloaded')
 p.wait_for_function('window.FOUNDRY_INITIALIZED && window.FoundryEcosystem && window.FoundryInnovation',timeout=25000)
 assert p.locator('#side-nav .navbtn').count()==20, p.locator('#side-nav .navbtn').count()
 print('PASS initial runtime and 20 routes; modules:',p.locator('#eco-status').inner_text(),flush=True)
 p.locator('[data-route="projects"]').first.click()
 p.locator('#project-title').fill('Cooperative <script>alert(1)</script> garden')
 p.locator('#project-domain').select_option('food')
 p.locator('#project-place').fill('Community demo area')
 p.locator('#project-need').fill('Access gap reported by participants, not verified')
 p.locator('#project-goal').fill('Track safe accessible edible yields')
 p.locator('#project-save').click()
 p.locator('[data-route="ecosystem"]').first.click()
 assert p.locator('#eco-project').input_value()
 p.locator('#eco-domain').select_option('food');p.locator('#eco-select-domain').click()
 p.locator('#eco-consent').check();p.locator('#eco-audit-run').click()
 report=p.evaluate('window.FoundryEcosystem.audit()')
 print('ECOSYSTEM',str(report)[:500],flush=True)
 assert report['ok'] and report['method_count']>=5
 with p.expect_download(timeout=25000) as d:p.locator('#eco-export-html').click()
 child=Path(tempfile.gettempdir())/'v3_child_test.html';d.value.save_as(child)
 assert '<script>alert(1)</script>' not in child.read_text()
 p.locator('#eco-hosting').check()
 with p.expect_download(timeout=35000) as d:p.locator('#eco-export-zip').click()
 childzip=R/'tests/child_test.zip';d.value.save_as(childzip)
 with zipfile.ZipFile(childzip) as z:
  assert z.testzip() is None
  assert {'index.html','assets/app.js','assets/app.css','manifest.webmanifest','sw.js','SHA256SUMS.json'}<=set(z.namelist())
  hashes=json.loads(z.read('SHA256SUMS.json'))
  if hashes['algorithm']=='SHA-256':
   for k,v in hashes['files'].items():assert hashlib.sha256(z.read(k)).hexdigest()==v,k
 print('PASS v2 module compiler, escaped child, ZIP, PWA assets and digest checks',flush=True)
 p.locator('[data-route="protocol-models"]').first.click()
 p.locator('#pm-type').select_option('energy')
 print('model inputs',p.locator('#pm-fields input').count(),flush=True)
 p.locator('#pm-form button[type="submit"]').click()
 assert p.locator('#pm-result').inner_text().strip()
 print('PASS unified quantitative model',flush=True)
 p.locator('[data-route="fieldwork"]').first.click()
 p.locator('#field-project').select_option(index=1)
 p.locator('#field-start').click()
 assert 'seven' in p.locator('#field-status').inner_text().lower() or p.locator('#field-detail input[type="checkbox"]').count()==7
 print('PASS unified seven-stage fieldwork attachment',flush=True)
 p.locator('[data-route="innovation"]').first.click()
 p.locator('#genome-project').select_option(index=1)
 p.locator('#genome-title').fill('Portable seed library')
 p.locator('#genome-problem').fill('Seed availability during the growing season')
 p.locator('#genome-mechanism').fill('Cooperative lending and locally stewarded seed saving')
 p.locator('#genome-hypothesis').fill('Participating households will have more varieties compared with baseline')
 p.locator('#genome-metric').fill('Count available seed varieties per consenting household')
 p.locator('#genome-falsifier').fill('No measurable increase against comparable nonparticipants')
 p.locator('#genome-stop').fill('Stop if consent or seed safety fails')
 p.locator('#genome-save').click()
 assert 'Portable seed library' in p.locator('#genome-list').inner_text()
 p.locator('#exp-genome').select_option(index=1)
 p.locator('#exp-baseline').fill('0 varieties at baseline, provisional')
 p.locator('#exp-comparator').fill('Voluntary nonparticipant baseline')
 p.locator('#experiment-form button[type="submit"]').click()
 assert p.locator('#experiment-list article').count()==1
 print('PASS v3 genome and experiment records',flush=True)
 p.locator('details:has(#genome-preview) summary').click()
 p.locator('#genome-preview').click()
 assert not p.locator('#genome-export').is_disabled()
 assert 'empowerment_genome_pack/1' in p.locator('#genome-export-text').input_value()
 p.locator('[data-genome-chain]').first.click()
 p.locator('#chain-form button[type="submit"]').click()
 assert p.locator('#chain-steps details').count()==10
 assert 'HARD REVIEW GATE' in p.locator('#chain-result').input_value()
 with p.expect_download() as d:p.locator('#chain-json').click()
 chain=Path(tempfile.gettempdir())/'v3_chain.json';d.value.save_as(chain)
 assert len(json.loads(chain.read_text())['stages'])==10
 print('PASS v3 chained deterministic meta-prompts and portable JSON',flush=True)
 # Explicitly opt in to adding the linked genome and reusable chain to child ZIP.
 p.locator('[data-route="ecosystem"]').first.click()
 p.locator('#eco-innovation').check();p.locator('#eco-audit-run').click()
 with p.expect_download(timeout=35000) as d:p.locator('#eco-export-zip').click()
 addonzip=R/'tests/child_with_genome_test.zip';d.value.save_as(addonzip)
 with zipfile.ZipFile(addonzip) as z:
  assert z.testzip() is None
  for name in ['data/innovation_genomes.json','data/prompt_chain.json','docs/empowerment_prompt_chain.md']:assert name in z.namelist(),name
  addon=json.loads(z.read('data/innovation_genomes.json'))
  assert addon['genomes'][0]['projectId']=='' and addon['genomes'][0]['owner']==''
  assert len(json.loads(z.read('data/prompt_chain.json'))['stages'])==10
 print('PASS consent-gated child ZIP contains a reviewed, de-identified genome reference and 10-stage chain',flush=True)
 with p.expect_download() as d:p.locator('#backup-top').click()
 backup=Path(tempfile.gettempdir())/'v3_work_test.json';d.value.save_as(backup)
 obj=json.loads(backup.read_text());assert (obj['format'],obj['schema'])==('empowerment_foundry/2',2)
 assert len(obj['ecosystem']['projectModules'])>=1 and len(obj['innovation']['genomes'])==1 and len(obj['innovation']['experiments'])==1 and len(obj['fieldwork'])==1
 print('PASS v3 backup preserves ecosystem and innovation; fieldwork count',len(obj['fieldwork']),flush=True)
 # A v1 Unified backup imports into v3 retaining fieldwork; a v1 Ecosystem backup retains module selections.
 seed=json.loads(backup.read_text());seed.update(format='empowerment_foundry/1',schema=1);seed.pop('innovation',None);seed.pop('ecosystem',None)
 fixture=R/'tests/v1_unified_fixture.json';fixture.write_text(json.dumps(seed))
 p.locator('[data-route="exchange"]').first.click()
 p.locator('#import-file').set_input_files(str(fixture));p.locator('#import-preview-btn').click()
 p.wait_for_function("document.querySelector('#import-report').textContent.includes('Full workspace') || document.querySelector('#import-report').textContent.includes('Import rejected')",timeout=8000)
 print('legacy preview:',p.locator('#import-report').inner_text(),flush=True)
 assert not p.locator('#import-merge').is_disabled()
 print('PASS v1 legacy backup validation',flush=True)
 # Use independent project IDs so both genuine legacy structures can merge alongside original v3 data.
 unified=json.loads(backup.read_text());unified.update(format='empowerment_foundry/1',schema=1);unified.pop('innovation');unified.pop('ecosystem')
 unified['projects'][0]['id']='pr_unified_001';unified['fieldwork'][0]['id']='pr_unified_001'
 united=R/'tests/v1_unified_compatible.json';united.write_text(json.dumps(unified))
 p.locator('#import-file').set_input_files(str(united));p.locator('#import-preview-btn').click()
 p.wait_for_function("document.querySelector('#import-report').textContent.includes('Full workspace')",timeout=8000)
 assert not p.locator('#import-merge').is_disabled(),p.locator('#import-report').inner_text()
 p.locator('#import-merge').click();p.wait_for_function("window.FoundryBridge.snapshot().projects.length===2",timeout=8000);assert 'pr_unified_001' in p.evaluate('window.FoundryBridge.snapshot().projects.map(p=>p.id)')
 ecosystem=json.loads(backup.read_text());ecosystem.update(format='empowerment_foundry/1',schema=1);ecosystem.pop('innovation');ecosystem.pop('fieldwork')
 orig=ecosystem['projects'][0]['id'];ecosystem['projects'][0]['id']='pr_ecosystem_002'
 ecosystem['ecosystem']['projectModules']['pr_ecosystem_002']=ecosystem['ecosystem']['projectModules'].pop(orig)
 ecos=R/'tests/v1_ecosystem_compatible.json';ecos.write_text(json.dumps(ecosystem))
 p.locator('#import-file').set_input_files(str(ecos));p.locator('#import-preview-btn').click()
 p.wait_for_function("document.querySelector('#import-report').textContent.includes('Full workspace')",timeout=8000)
 assert not p.locator('#import-merge').is_disabled(),p.locator('#import-report').inner_text()
 p.locator('#import-merge').click()
 p.wait_for_function("window.FoundryBridge.snapshot().projects.length===3",timeout=8000)
 combined=p.evaluate('window.FoundryBridge.snapshot()')
 assert len(combined['projects'])==3 and len(combined['fieldwork'])==2 and len(combined['ecosystem']['projectModules'])==2
 assert len(combined['innovation']['genomes'])==1 and len(combined['innovation']['experiments'])==1
 assert combined['format']=='empowerment_foundry/2'
 print('PASS actual /1 Unified and /1 Ecosystem merges into one /2 workspace preserve all specialized records',flush=True)
 # Malformed imports are rejected without changing live records.
 before=json.dumps(combined,sort_keys=True)
 bad=R/'tests/invalid_v3_fixture.json';bad.write_text(json.dumps({'format':'empowerment_foundry/2','schema':2,'projects':[],'evidence':[],'pathways':[],'scenarios':[],'customMethods':[], 'innovation':{'genomes':[], 'experiments':[{'id':'bad_orphan','genomeId':'unknown'}]}}))
 p.locator('#import-file').set_input_files(str(bad));p.locator('#import-preview-btn').click()
 p.wait_for_function("document.querySelector('#import-report').textContent.toLowerCase().includes('rejected')",timeout=8000)
 assert 'rejected' in p.locator('#import-report').inner_text().lower()
 assert json.dumps(p.evaluate('window.FoundryBridge.snapshot()'),sort_keys=True)==before
 print('PASS orphan experiment import rejected without state mutation',flush=True)
 assert not errors,errors
 assert not remote,remote
 print('PASS: all v3 standalone smoke + integration assertions; browser exceptions',errors,flush=True)
 ctx.close();b.close()
