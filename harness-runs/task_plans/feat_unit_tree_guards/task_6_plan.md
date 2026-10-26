### Task 6 — Declare `treeGuards` in the schema with a negative fixture

**Goal:** `schemas/harness.config.schema.json` declares the optional `treeGuards` key, so `npm run validate:config` accepts a configuration carrying it and rejects a malformed entry — the first of the four places `.claude/context/conventions.md` → `### The order files are created…` item 1 says a configuration key lives.

**Depends on:** Task 1, whose model and shape check this schema must agree with key for key: `treeGuards` is an optional top-level array, `default: []`, of objects with `additionalProperties: false` and exactly two required string keys `test` and `covers`, each `minLength: 1`. It is declared **after `sandbox`**, the position Task 1 gave it in `HarnessConfig` and in `check.ts` → `TOP_LEVEL_KEYS`. `test` is the argument the single-file test command takes, verbatim, and **not necessarily repo-relative**; `covers` is a repo-relative glob.

**Where this layer stops.** Schema and its negative proof only. `docs/config.md` is **Task 7's**; this repository's own `harness.config.json` is seeded by **Task 8**, after this schema accepts the key.

### Targets

- `schemas/harness.config.schema.json` — the `treeGuards` property.
- `schemas/negative/tree-guard-without-covers.json` (new) — the negative fixture.
- `package.json` — `validate:config:negative`.
- `schemas/negative/README.md` — the fixture's sentence.

**Work:**

- [ ] Schema: add `treeGuards` after `sandbox` in `properties`, shaped as above. Its `description` says what an entry is (a test that enforces a rule over every file under a path), who reads it (the unit loop, which after a unit's own test run runs every guard whose `covers` matches a path the unit's change touched, through the single-file test command; and `doctor`'s `tree-guards` check), and that it is optional and no generator writes it. The `test` description states it is the argument the single-file test command takes, spelled exactly as that command takes it, and is therefore **not necessarily repo-relative** — in a workspace whose command runs from a package directory it is relative to that directory. The `covers` description states it is a repo-relative glob over the files the guard reads, with `**` matching zero or more whole path segments, `*` any run of characters inside one segment and `?` one character inside one segment, matched against the whole path.
- [ ] `schemas/negative/tree-guard-without-covers.json`: a copy of `examples/harness.config.json` with `$schema` re-based to `../harness.config.schema.json` (the README's caveat) and one change — a `treeGuards` array holding one entry with a `test` and no `covers`.
- [ ] `package.json` → `validate:config:negative`: append `&& node schemas/validate.mjs test -s schemas/harness.config.schema.json -d schemas/negative/tree-guard-without-covers.json --invalid`, in the shape every other assertion there takes. A fixture no assertion wires in is never run (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`).
- [ ] `schemas/negative/README.md`: add one sentence in the first paragraph's established form — `tree-guard-without-covers.json` proves that every `treeGuards[]` entry requires its `covers`, which exists because an entry with no glob is a guard the unit loop can never select, so the rule it enforces goes unchecked until Run gates.

**Verification:**

- The schema validation itself is a Run gates gate (`scripts/run-gates.sh` → gates `3a` and `3b`), so this task does not run it. Instead confirm by reading: the schema file still parses as JSON (`node -e "JSON.parse(require('fs').readFileSync('schemas/harness.config.schema.json','utf8'))"` exits zero), the fixture differs from `examples/harness.config.json` only in `$schema` and the `treeGuards` entry (`git diff --no-index examples/harness.config.json schemas/negative/tree-guard-without-covers.json`), and the new `package.json` assertion names the fixture's exact filename.
- Read the new property against `cli/src/config/check.ts` → `TOP_LEVEL_KEYS` and the `treeGuards` entry check Task 1 added: the same keys, the same required set, the same position.
