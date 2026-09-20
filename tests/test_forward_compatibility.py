#!/usr/bin/env python3
"""Older releases must reject /2 backups, never falsely report a lossless import."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,shutil,tempfile,json
ROOT=Path(__file__).resolve().parents[1]
export=Path(tempfile.gettempdir())/'v3_work_test.json'
assert export.is_file(),'Run tests/test_v3_browser.py first to create the test fixture.'
assert json.loads(export.read_text())['format']=='empowerment_foundry/2'
chromium=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=chromium,args=['--no-sandbox'])
 for name,source in [('Unified v1',ROOT/'reference/extracted_unified_v1.html'),('Ecosystem v2',ROOT/'reference/extracted_v2.html')]:
  if not source.is_file():
   print('SKIP',name,'original app not materialized as plain HTML in reference (archives retained).');continue
  page=browser.new_page(accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(source.read_text(),wait_until='domcontentloaded')
  page.wait_for_function('document.querySelector("#import-preview-btn") && document.querySelector("#import-file")',timeout=20000)
  page.locator('[data-route="exchange"]').first.click()
  page.locator('#import-file').set_input_files(str(export))
  page.locator('#import-preview-btn').click()
  page.wait_for_function("document.querySelector('#import-report').textContent.toLowerCase().includes('rejected')",timeout=6000)
  result=page.locator('#import-report').inner_text()
  assert 'rejected' in result.lower() and page.locator('#import-merge').is_disabled(),(name,result)
  print('PASS',name,'rejects v3 /2 format instead of silently deleting unknown records',flush=True)
  page.close()
 browser.close()
