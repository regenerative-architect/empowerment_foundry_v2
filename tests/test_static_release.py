#!/usr/bin/env python3
"""No network required: release structure, inventories and first-party worker boundaries."""
from pathlib import Path
import json,hashlib,re,zipfile
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'src/data.json').read_text());protocol=json.loads((ROOT/'src/protocol.json').read_text());registry=json.loads((ROOT/'src/registry.json').read_text())
assert (len(data['domains']),len(data['methods']),len(data['technology']),len(protocol['sources']),len(registry['modules']))==(15,60,63,22,20)
assert len({m['id'] for m in registry['modules']})==20
assert len({m['id'] for m in data['methods']})==60
assert len({p['id'] for p in protocol['sources']})==22
root=ROOT/'dist'
for edition in ['web','standalone']:
 r=root/edition;manifest=json.loads((r/'SHA256SUMS.json').read_text());assert manifest['algorithm']=='SHA-256'
 for name,expected in manifest['hashes'].items():
  f=r/name;assert f.is_file(),f
  assert hashlib.sha256(f.read_bytes()).hexdigest()==expected,f
 print('PASS',edition,'SHA-256 inventory entries',len(manifest['hashes']))
for name in ['index.html','manifest.webmanifest','sw.js','css/main.css','data/embedded.js','data/registry.js','js/core.js','js/ecosystem.js','js/innovation.js']:
 assert (root/'web'/name).is_file(),name
sw=(root/'web/sw.js').read_text()
assets=json.loads(re.search(r'const ASSETS=(\[.*?\]);',sw).group(1))
for asset in assets:
 if asset=='./':continue
 assert (root/'web'/asset[2:]).is_file(),asset
assert 'url.origin!==SCOPE.origin' in sw and 'url.pathname.startsWith(SCOPE.pathname)' in sw
assert 'SKIP_WAITING' in sw and 'skipWaiting()' in sw
assert 'fetch(req)' in sw
web=(root/'web/index.html').read_text();standalone=(root/'standalone/index.html').read_text()
assert all(flag not in web and flag not in standalone for flag in ('__DATA__','__JS__','__PROTOCOL_DATA__'))
assert 'User-controlled hosted upgrade' in web and 'User-controlled hosted upgrade' not in standalone
assert '<script src="./js/core.js"></script>' in web
assert standalone.count('id="ecosystem"')==1 and standalone.count('id="innovation"')==1 and standalone.count('id="prompt-lab"')==1
assert len(re.findall(r"\['(?:[\w-]+)','[^']+','[^']+'\]",(ROOT/'src/app.js').read_text().split('const ROUTES=')[1].split(';',1)[0]))==20
for name in ['empowerment_foundry_v2_ecosystem_original.zip','empowerment_unified_pwa_bundle_original.zip']:
 with zipfile.ZipFile(ROOT/'reference'/name) as z:assert z.testzip() is None
print('PASS corpus counts, original ZIPs, first-party cache asset inventory, separate standalone/hosted builds, 20 routes and safe worker scope')
