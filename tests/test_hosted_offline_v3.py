#!/usr/bin/env python3
"""Real localhost network and service-worker test in Chromium; not a cross-browser certification."""
from pathlib import Path
import http.server,threading,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT/'dist/web'),**kwargs)
 def log_message(self,*args):pass
class Server(http.server.ThreadingHTTPServer):allow_reuse_address=True
httpd=Server(('127.0.0.1',0),Handler)
thread=threading.Thread(target=httpd.serve_forever,daemon=True);thread.start()
url=f'http://localhost:{httpd.server_port}/index.html'
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
  p=context.new_page();errors=[];thirdparty=[]
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('request',lambda req:thirdparty.append(req.url) if req.url.startswith('https://') or (req.url.startswith('http://') and not req.url.startswith(f'http://localhost:{httpd.server_port}/')) else None)
  p.goto(url,wait_until='load',timeout=30000)
  p.wait_for_function('window.FOUNDRY_INITIALIZED && window.FoundryEcosystem && window.FoundryInnovation',timeout=20000)
  assert p.locator('#side-nav .navbtn').count()==20
  # Mobile drawer, route navigation, accessibility toggles and Escape.
  p.locator('#mobile-open').click();assert p.locator('#sidebar').evaluate('(n)=>n.classList.contains("open")')
  p.keyboard.press('Escape');assert not p.locator('#sidebar').evaluate('(n)=>n.classList.contains("open")')
  p.wait_for_function("navigator.serviceWorker && caches && navigator.serviceWorker.controller && document.querySelector('#pwa-status').textContent.includes('registered')",timeout=25000)
  cache=p.evaluate('caches.keys()');print('hosted cache',cache,flush=True)
  assert any(x.startswith('foster_navi_foundry_v3_') for x in cache)
  # Test persistence on real secure (localhost) storage origin before disconnecting.
  p.locator('#mobile-open').click();p.locator('#side-nav [data-route="projects"]').click()
  for key,value in [('project-title','Offline seed example'),('project-place','Local demonstration'),('project-need','An unresolved local need'),('project-goal','Measure consenting participant outcomes')]:p.locator('#'+key).fill(value)
  p.locator('#project-save').click()
  p.wait_for_function("document.querySelector('#storage-status').textContent.includes('IndexedDB') || document.querySelector('#storage-status').textContent.includes('localStorage')",timeout=10000)
  print('storage mode',p.locator('#storage-status').inner_text(),flush=True)
  p.wait_for_timeout(300)
  context.set_offline(True)
  p.reload(wait_until='domcontentloaded',timeout=20000)
  p.wait_for_function('window.FOUNDRY_INITIALIZED && window.FoundryInnovation && window.FoundryEcosystem',timeout=20000)
  assert p.locator('#project-list').inner_text().find('Offline seed example')!=-1
  assert p.locator('#network-status').inner_text() or p.locator('#storage-status').inner_text()
  assert not errors,errors
  assert not thirdparty,thirdparty
  print('PASS real HTTP first load → SW precache → offline reload → retained local project; viewport 390px; mobile Escape; no page errors or third-party requests',flush=True)
  browser.close()
finally:httpd.shutdown();httpd.server_close()
