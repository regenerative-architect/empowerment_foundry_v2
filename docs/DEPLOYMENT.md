# Deployment and offline behavior

Standalone: copy `index.html` to any location and open it with a browser; all embedded app scripts and static research records are included. On `file://`, browser storage, clipboard, secure-context digests and install prompts may be restricted. The app displays the selected persistence fallback, and records in memory disappear on reload; full private JSON backups are therefore important.

Hosted: upload all contents of `dist/web/` into one same-origin directory over HTTPS, or run `python3 -m http.server 8765 --directory dist/web` for local development. Visit online once and check the hosted service-worker status, then explicitly test offline navigation and version activation on the target browser. The v3 worker precaches its exact first-party shell list and never caches user-uploaded files or third-party source references. It uses network-first navigation with a cached app-shell fallback; other listed assets use cache-first. It does not promise uncached pages offline. Installation requires user/browser permission as applicable. Same-site origin and directory scope matter.

For updates, rebuild and deploy *all* files atomically where possible. The worker derives a release revision from SHA-256 hashes of first-party build assets, waits until user activation (`SKIP_WAITING` message) if replacing an active worker, and deletes only caches under its own v3 prefix. Export a backup first; new versions cannot automatically migrate storage across different origins.

Run static integrity checks in the release package; SHA-256 is bytes-only evidence, not authorship or independently trusted timing. Do not serve scripts or peer packs from untrusted third-party URLs. Do not configure the hosted worker to intercept outside its directory scope.
