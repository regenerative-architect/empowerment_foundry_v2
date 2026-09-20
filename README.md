# Foster + Navi · Empowerment Foundry v3 Unified Ecosystem

**Version:** v3 integrated build · 2026-09-20. **Distribution:** complete single-file HTML plus an optional modular, hosted PWA. No analytics, required accounts, remote scripts or automatic AI service requests.

This distribution combines the complete working functionality of the two user-supplied archives, rather than simply embedding two unrelated websites. It retains Unified's research and fieldwork layer and Foundry v2's declarative module registry and bounded application compiler. Version 3 introduces a distinct workspace envelope, validated innovation genome / experiment records, role-specific deterministic meta-prompt generation, and optional explicit-consent integration of genome and prompt-chain documents into child ZIP exports.

## Start here

- **Simplest:** open `index.html` (same standalone app as `dist/standalone/index.html`). It contains all essential CSS, JavaScript, methods, protocol research records, modules and new tools, with no HTTP or external dependency. `file://` origins can restrict IndexedDB, clipboard, SHA-256 and other browser features; the app reports storage mode. Make a full private JSON backup before moving it or clearing browser data.
- **Hosted PWA:** host **the contents** of `dist/web/` together over HTTPS or localhost, then visit `index.html` online for initial cache installation. The service worker caches only declared first-party shell assets. A first-time offline visit cannot work. An actual offline reload must be verified in your target browser/deployment. Never assume `file://` supports workers.
- **Development:** edit `src/shell.html`, `src/app.js`, `src/ecosystem.js`, `src/innovation.js`, JSON registries and source data; run `python3 scripts/build.py`. Only standard-library Python is required for production builds. Browser tests require Playwright and Chromium separately.

## Functional inventory

| Area | Implemented in this build | Reality boundary |
|---|---|---|
| Knowledge system | 60 methods, 15 domains, 63 technology descriptions, readable static guides | Reference descriptions, not installed specialist software or independent impact evidence |
| Protocol | 10 detailed research engines, 22 dated source records, six-prompt research bundles, four numeric scenario models | Source snapshot dates are not live verification; no automatic web research |
| Fieldwork | Seven-stage local checklists, observations, descriptive baseline and target comparison, legacy Protocol importer | Self-reported data, not proof of causal effect or professional approval |
| Ecosystem | 20 built-in inert modules, custom JSON packs, dependency checks, review gate, working child HTML and ZIP compiler | Child compiles a bounded local task application, **not** arbitrary source-code/function synthesis |
| Innovation | User-authored genomes, falsifiers, alternative approaches, consent and stop rules, append-only experiment records, safe fork/edit/delete and validated genome packs | Human-authored hypotheses; no patent, effectiveness, certification or timestamp proof |
| Prompt lab | Eight lead entity profiles and sub-entity workflows, starter five-stage or rigorous ten-stage chains, Markdown and portable JSON exports, independent stage copy | The prompts are generated deterministically, not executed by this website or sent to AI |
| Child compiler extras | Opt-in ZIP contents: reviewed linked genome records, one ten-stage chain (most recently edited linked genome), source-independent Markdown and JSON | Add-ons require an explicit separate checkbox; experiment observations are excluded. Standalone child HTML does not receive those ZIP extras |
| Portability | `/1` → `/2` validation, staged no-overwrite merges, full private backups, reviewed peer packs, local-first storage | Conflicting IDs are skipped rather than overwritten; user must inspect omissions and retain original backups |
| Integrity & PWA | ZIP CRC-32, conditional Web Crypto SHA-256; Python distribution SHA-256 manifests; hosted shell worker | Hash proves byte equality only. Live hosted/offline lifecycle could not be verified in this restricted environment |

## Crucial migration and prevention of silent data loss

**BEFORE opening v3 on an existing v1/v2 web origin:** export full PRIVATE JSON separately from the Unified and v2 applications, and retain unmodified originals outside browser storage. Both historical versions used the same IndexedDB name and local storage key, and one could silently discard the other's specialized data. This build accepts their `format: empowerment_foundry/1` / `schema: 1` archives and issues new exports as `format: empowerment_foundry/2` / `schema: 2`.

Use **Knowledge exchange → choose JSON → Preview and validate → Merge**. v3 builds a staged clone, validates it, then commits. Existing project IDs are never overwritten, nor are unrelated fieldwork or governance records grafted onto them. Module definitions merge by unique ID, new project assignments are imported only for newly imported project IDs, and innovation experiments import only with their newly imported parent genomes. Conflict/omission notes are shown. The imported file is not modified. Export a new private backup and verify counts. Use separate application origins/profiles if you want older versions to remain usable; **older applications reject `/2`** rather than importing it lossily. See `docs/MIGRATION.md`.

Old stand-alone Protocol backups have a separate migration flow: **Legacy import & checks** (the original dedicated converter is retained).

## Prompt-chain methodology

Create or select an innovation genome, open **Prompt chain studio**, choose an entity profile (individual, family, cooperative/community, educator, researcher, nonprofit, enterprise or public/institutional operator), give actual constraints, source freshness and rights boundaries, and select a deliverable. Generate either a five-stage starter or ten-stage rigorous chain. Each stage contains a sub-entity assignment, an evidence-aware question, expected output, review gate, self-query and handoff. Copy individual prompts or download Markdown/JSON. No hidden autonomous internet research, project execution or AI billing is triggered. You can use the chain with a human team or whichever model you choose; do not share private information with external models without authorization.

To include an associated, reviewed genome and prompt chain in a modular child ZIP, link a genome to the active project and select the additional **ZIP-only innovation export consent** in **Module ecosystem**. The compiler includes `data/innovation_genomes.json`, `data/prompt_chain.json` and `docs/empowerment_prompt_chain.md`. It removes local project identifiers and owner fields from these *add-ons*, but other free text can still reveal personal information. Verify the ZIP before sharing.

## Source tree

```
index.html                   complete standalone, use directly
src/shell.html              shared responsive HTML/CSS shell + static guides
src/app.js                  unified research, models, fieldwork, storage, migration, core
src/ecosystem.js            validated module registry + single/multi-file child compiler
src/innovation.js           optional innovation, experiment, peer exchange and prompt studio
src/data.json               60 methods, 15 domains, 63 references
src/protocol.json           dated research snapshot including 22 source records
src/registry.json           20 versioned declarative modules
src/assets/                 SVG and PNG icons, same-origin assets only
scripts/build.py            produces root index.html + two distributable editions
scripts/run_tests.py        reproducible local syntax, static and Chromium integration suite
dist/standalone/            one HTML plus license and SHA256SUMS
dist/web/                   modular hosted shell, CSS, JS, data, icons, manifest and SW
tests/                      integration, migration, forward-rejection and static tests
reference/                  complete ORIGINAL user-supplied archives and exact source HTML copies
docs/                       schemas, release status, security, migration and limitations
release_manifest.json       post-build file inventory and SHA-256 byte hashes
```

## Privacy, ownership and anti-inversion

All user data remains local until you explicitly download and share it. Browser data is not encrypted by the app; protect your device/profile and exports. The public Foundry share candidate intentionally omits specialized private records; peer packs remove a few identifiers but **do not guarantee anonymization**. No unauthorized surveillance, covert messaging, proprietary reverse engineering, forced participation or provider lock-in. All interventions require rights-holder consent, appropriate technical/domain safety review and honest adverse-effect reporting. Model estimates, XP, self-reported checklists and checksums are not credentials, timestamps or claims of real-world efficacy.

## Rights and attribution

This build adapts two archives supplied by the user and preserves both exact originals in `reference/`. The supplied v2 source names an MIT license; the Unified source's text warns that not all preceding source reuse rights were formally settled. `LICENSE` reflects the v2 distribution's supplied statement, not a legal opinion that overrides rights in the other source or in external cited work. Confirm permission with the applicable rightsholder before republishing a merged edition. Foster + Navi / Planetary Restoration Archive design attribution is retained; externally linked reference articles have their own copyright and are not redistributed as full articles. No external dependencies or GitHub code were copied into this build.

## Quality and limitations

Run `python3 scripts/run_tests.py` to rebuild and run tests. The constrained Chromium `set_content` integration suite exercised both source applications' features and v3 import/export, module compilation, prompt generation, ZIP generation and validation. Separate real `file://` and localhost browser navigation were blocked by administrator policy in the test runtime; the end-to-end hosted PWA/offline reload remains **unverified**, as does broad WCAG 2.2 AA / real screen reader, performance and security certification. See `docs/TEST_REPORT.md`. No autonomous external AI/research engine, WebLLM weights, signatures, trusted timestamps, real-time multiplayer, server sync or automatic deployment are included. They require separate, permissioned integrations and dedicated verification.
