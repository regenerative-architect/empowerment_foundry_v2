#!/usr/bin/env python3
"""Build and test in a real browser when available; explicitly report environmental skips."""
from pathlib import Path
import subprocess,sys,shutil,os
R=Path(__file__).resolve().parents[1]
def run(args):subprocess.run(args,cwd=R,check=True)
print('=== Foundry v3 regression suite ===',flush=True)
run([sys.executable,'scripts/build.py'])
if (node:=shutil.which('node')):
 for name in ['src/app.js','src/ecosystem.js','src/innovation.js','dist/web/sw.js']:
  run([node,'--check',name])
 print('PASS Node syntax checks (4 scripts)',flush=True)
else:print('SKIP Node syntax checks: Node is unavailable',flush=True)
run([sys.executable,'tests/test_static_release.py'])
try:
 import playwright
except ImportError:
 print('SKIP Chromium integration and compatibility tests: playwright is not installed.',flush=True)
else:
 if not (os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')):
  print('SKIP Chromium integration: browser not installed.',flush=True)
 else:
  run([sys.executable,'tests/test_v3_browser.py'])
  run([sys.executable,'tests/test_forward_compatibility.py'])
print('All available mandatory tests succeeded. Live hosted PWA/offline test is optional and not included in this claim.',flush=True)
