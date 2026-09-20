# Migration and conflict policy · v1/v2 → v3

**Risk corrected:** Original Unified and Foundry v2 used `empowerment_foundry/1` with incompatible optional fields and an overlapping IndexedDB/localStorage storage identity. Unified accepted fieldwork and discarded ecosystem assignments; v2 accepted ecosystem and discarded fieldwork. Importing one into the other could silently lose specialized records.

**Before you start:** Export *both* private backups from their original working contexts, copy the two original ZIPs somewhere safe, and avoid opening v3 on the same origin until those backups are confirmed. An HTML's filesystem creation or modification date is not independently verifiable historical provenance.

1. Start v3, preferably on a separate HTTPS origin or browser profile to isolate storage. Select **Knowledge exchange → JSON import → Preview and validate** and inspect both existing/new project counts and specialist counts.
2. Merge Unified's `/1` backup. The entire incoming workspace is validated and staged before commit. Project IDs already present are skipped, including their associated fieldwork/gate records. Distinct new project IDs get their matched fieldwork. Nonproject evidence, pathways and scenarios merge by record ID with conflicts skipped.
3. Merge v2's `/1` backup. Custom method/module IDs are preserved if already present. Only module assignments linked to *new* project IDs are imported; unresolved module IDs are excluded with a warning. Do not assume two similarly named or similarly ID'd projects are the same intervention.
4. For the separate legacy Protocol JSON, use **Legacy import & checks**. It requires an explicit preview and maps old engine records and observations to compatible Foundry records.
5. Export a `/2` full private backup and count projects, fieldwork, module assignments, genomes and experiments. Compare source records; fix conflicts manually with a copied backup and deliberate new IDs, not automatic overwrites. The original files are never altered by the import routine.

`/2` is deliberately forward-incompatible with both old apps: their original validators reject it rather than discarding unknown extension data. If downgrading is necessary, return to retained original `/1` backups; manually converting `/2` to `/1` would drop new capabilities unless every specialized record is exported separately. Do not overwrite the only backup.

The v3 `/2` payload is a single object with prior base fields plus `fieldwork`, `ecosystem:{customModules,projectModules}`, and `innovation:{genomes,experiments}`. `validateFull()` allowlists expected fields and normalizes old `/1` to `/2`; invalid validation never commits changes. Merge prevents orphan experiment records and does not attach experiment data to colliding genome IDs.

**No encryption, cross-origin data transfer or cloud sync** occurs automatically. Loading another origin starts with a new local database; manually import your private backup there.
