### Task 11 — Bring `docs/development.md` gates 3 and 14 in line with the new validator, `js-yaml` 4 and the online mode

**Goal:** Make `docs/development.md` §5's descriptions of gate 3 and gate 14 match what the tree now does. Gate 3's `validate:*` scripts run `node schemas/validate.mjs`, with the same messages and exit codes as before. 14a and 14b parse with `js-yaml` 4's `load`, `js-yaml` is a direct root `devDependency`, and `ajv-cli` is gone. The online zizmor audit is no longer a hand-run step: it is `--zizmor-online`, run nightly by `.github/workflows/supply-chain.yml`, and it is still never a gate leg.

**Depends on:** Task 4. `schemas/validate.mjs` has subcommands `validate` and `test`, with `test … --invalid` printing `<file> passed test` plus the `ajv` errors array (each error's `instancePath`, `schemaPath`, `keyword`) and exiting 0 when a fixture is rejected, `<file> failed test` and exit 1 when one is accepted, and `Cannot find data file …` and exit 2 when one cannot be read. Task 5: `js-yaml ^4.3.2`, and `parseError` calls `yaml.load`. Task 8: `node scripts/check-rendered-workflows.mjs --zizmor-online` grades the rendered set against the same `RESIDUAL` and this repository's own `.github` against no residual, takes its token from `GH_TOKEN` or else `gh auth token`, and exits 4 when zizmor or a token is unavailable. Task 10: `.github/workflows/supply-chain.yml`, job `zizmor-online`, runs it nightly.

**Where this task stops.** It edits the four paragraphs named below and nothing else in the file. The new `## 8. The nightly supply-chain audit` section is **Task 12**'s, and its measured record is **Task 13**'s; this task may point at `§8` by title only. The gate-12 round record "**The online audit**, run on 2026-10-09" stays as written: it is a dated record of one round (scope register row 4). The code blocks under gate 3 (`npm run validate:*`) and gate 14 (the four `node scripts/check-rendered-workflows.mjs` modes) are unchanged, because the commands are unchanged. No new code block is added for `--zizmor-online` here; §8 owns it.

### Targets

- `docs/development.md` → `## 5. Verifying a change` → gate 3 and gate 14 prose (scope register rows 2, 3, 5 and 6).

**Work:**

- [ ] Gate 3, the paragraph opening "The first validates the worked example". Name the validator: the scripts run `node schemas/validate.mjs`, a hand-written driver on the `ajv` library that replaced `ajv-cli` because `ajv-cli` 5 carries advisories with no fix inside 5.x (a pointer to §8 for the detail). Write the assertion form as `node schemas/validate.mjs test … --invalid`. Keep every stated outcome exactly as it reads now, because the contract was kept: `passed test` with the keyword path, `<file> failed test` and exit 1, `Cannot find data file …` and exit 2, and no keyword path printed on either red case.
- [ ] Gate 3, the paragraph opening "The last four lines cover the flow graph". Change "with the same `ajv test … --invalid` form as above" to the same form spelled with `node schemas/validate.mjs test`.
- [ ] Gate 14, the opening paragraph. "parses each with `js-yaml`" becomes `js-yaml` 4's `load`, safe by default, which replaced 3.x's `safeLoad`. Replace "already in the lockfile through `ajv-cli`" with the fact that `js-yaml` is a direct dev-only root `devDependency` at 4.x. Keep "is not a dependency of the published package".
- [ ] Gate 14, the paragraph opening "**It takes `zizmor` from `PATH`**". Replace "The online audit, which needs a GitHub token, is hand-run and never this leg" with this: the online audit is `--zizmor-online`, which `.github/workflows/supply-chain.yml` runs nightly and which `run-gates.sh` never runs, so 14d stays offline and an API outage never turns a gate red. Point to §8 for what it grades and where its token comes from.

**Verification:**

- `grep -n 'ajv-cli\|ajv test\|ajv validate\|hand-run and never this leg' docs/development.md` finds no line that still describes current behaviour. Any hit must be inside a dated record or a sentence that names `ajv-cli` as what was replaced. The invariant is that every hit is ⊆ the register's `no-change` rows, plus the replacement sentences this task wrote.
- `grep -n 'safeLoad' docs/development.md` finds only the sentence that says `load` replaced it.
- Re-read each edited paragraph against `schemas/validate.mjs`'s header table and `scripts/check-rendered-workflows.mjs`'s header. Every message, exit code and mode name in the prose appears there verbatim.
