`chore_supply_chain_nightly_audit` gives the harness repository a scheduled supply-chain check, and first fixes
what that check would report today, so its first run is green. Today the repository has no CI on pushes, on PRs
or on a schedule: `.github/workflows/` holds only `publish-main.yml` and `release-npm.yml`, and every gate runs by
hand through `scripts/run-gates.sh`. Nothing re-audits the dependencies, the rendered adopter workflows' action
pins, or the retrieval model weights once a change has merged.

The model for the check is scenewise's `extended.yml` → `supply-chain` job, and the reasoning behind it is
`scenewise/docs/research/q8b-tooling-gates.md` ("Vulnerabilities" and "Workflow security" rows):
- it runs nightly plus `workflow_dispatch`, and is **never** a required check, because a new upstream advisory
  must not block unrelated merges;
- it **fails** on findings, with no `continue-on-error`, because a red scheduled run emails the maintainer and
  that email is the alert;
- online zizmor runs there and not in a merge gate, because an API outage or advisory would fail unrelated PRs.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Findings" and "Leads" was measured or read on 2026-10-11 and is research, not a
> decision.** Re-run every audit on the branch's base before planning, because advisories and locks move. The
> planner and the reviewers decide the design.

---

## The goal

1. **The findings below are fixed or explicitly disposed of**, each with a stated reason. "Disposed of" means a
   documented, narrow ignore, never a lowered threshold.
2. **A scheduled workflow runs the audits** listed under "The check", fails on findings, and runs green on the
   branch's final tree.
3. **The retrieval model weights are pinned** to an immutable revision on both retrieval paths, or the plan
   argues why not (see Finding D).
4. **`docs/development.md` and `ROADMAP.md` say what runs where**: the new workflow, what it audits, that it is
   not a merge gate, and how its residual and ignore sets are kept.

## Findings (2026-10-11)

### A. Runtime peer dependencies an adopter installs (high)

`cli/package.json` declares **no** `dependencies`. Its runtime packages are `peerDependencies`, which the adopter
installs. So `npm audit --omit=dev` reports **0** and gives a false sense of safety. Plain `npm audit` reports
9 (7 high, 2 moderate), and two of them reach adopters:

- **`@modelcontextprotocol/sdk` 1.30.0** is in the affected range 1.12.0–1.30.1 of
  [GHSA-6qxp-vccf-f47h](https://github.com/advisories/GHSA-6qxp-vccf-f47h): the OAuth client could send
  credentials to an authorization server the MCP server chooses. The peer range `^1.30.0` still **admits**
  vulnerable versions, so the floor has to rise above 1.30.1, not only the lock. Check whether the harness's use
  of the SDK (the `search_docs` MCP server) exercises the OAuth client path at all, and say so in the plan. The
  floor rises either way.
- **`sharp` 0.35.4**, pulled in by `@huggingface/transformers` 4.3.0, is in the affected range `<0.35.5` of
  [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) (librsvg). It is transitive, so the
  fix is likely a lock refresh, or a transformers bump if 4.3.x does not admit sharp 0.35.5.
  `cli/src/retrieval/models.ts` documents file paths "read off `@huggingface/transformers` 4.3.0", so a
  transformers bump must re-verify those paths (`MODEL_FILES`, `buildResourcePaths`, `get_model_files`).

### B. Dev-only tooling (high, but not shipped)

All of these come in through the root `devDependencies`, `{ "ajv-cli": "^5.0.0", "js-yaml": "^3.14.0" }`:

- **`ajv-cli` 5 → `fast-json-patch`** (prototype pollution). npm's only "fix" is `ajv-cli@0.6.0`, a downgrade,
  so **there is no clean fix inside ajv-cli 5**. `ajv-cli` drives the `validate:config*` and
  `validate:flow-graph*` npm scripts (`ajv validate` / `ajv test … --invalid`). `docs/development.md` relies on
  `ajv test`'s exact exit codes and messages (`<file> failed test` exit 1; `Cannot find data file …` exit 2), so
  any replacement must keep that contract or update that text.
- **`ajv` → `fast-uri` 3.1.5** (6 advisories, affected range 3.0.0–3.1.7). Probably fixed by a lock refresh.
- **`js-yaml` 3.x → `argparse` → `sprintf-js`** (moderate), plus a js-yaml merge-key CPU advisory.
  `scripts/check-rendered-workflows.mjs` loads `js-yaml` for gate 14a/14b. js-yaml 4 removed `safeLoad`, so
  check which call it uses.
- **`brace-expansion`** (3 DoS advisories). Probably a lock refresh.

### C. Python docs-retrieval service

`uv audit --preview-features audit-command` over `docs-retrieval-service/uv.lock`: no known vulnerabilities in
84 packages. It still belongs in the nightly.

### D. Retrieval model weights are not pinned

Neither retrieval path pins the models to an immutable Hugging Face commit:

- **CLI** (`cli/src/retrieval/models.ts`): `EMBEDDING_MODEL = 'Xenova/bge-small-en-v1.5'` and
  `RERANK_MODEL = 'Xenova/ms-marco-MiniLM-L-6-v2'` are fetched on the **`main` revision** (the `MODEL_FILES`
  doc comment). Whatever `main` holds at fetch time is what an adopter gets.
- **Python service** (`docs-retrieval-service/src/harness_docs_retrieval/models.py`): `fetch-models` loads with
  `revision=None` when remote is allowed, then **records** whatever `refs/main` pointed at in the manifest.
  `_fetched_entry` and offline loads use that recorded revision. This makes a machine reproducible after its
  first fetch, but the first fetch is still unpinned, and two machines can record different revisions.

What this means: a change to either upstream repository's `main` (a re-export, new tokenizer files, a changed
`config.json`, or a compromised account) reaches adopters silently. Retrieval quality changes, and the stored
embeddings no longer match the index built before the change, without `MODEL_VERSION` or the embedder `id`
moving. The ONNX path executes no pickled code. On the Python path, verify which weight file
sentence-transformers loads (safetensors versus `pytorch_model.bin`) and that `trust_remote_code` stays off.

## The check (leads)

- **One workflow file**, for example `.github/workflows/supply-chain.yml`, on `schedule` + `workflow_dispatch`,
  with `permissions: contents: read`, every action SHA-pinned with a version comment, and
  `persist-credentials: false`, as the shipped templates and `release-npm.yml` already do.
- **It must reach `main`.** The repository's GitHub default branch is **`main`**, and GitHub fires `schedule`
  only from the default branch's copy of the file. `publish-main.yml` stays on `dev`. `release-npm.yml`
  "travels to main". Find the publish script's include/exclude rule and make the new file travel too, or the
  schedule never fires.
- **Jobs / steps:**
  - `npm ci` then `npm audit --audit-level=high` over the **full** tree. Never `--omit=dev`, for Finding A's
    reason. Decide whether moderate fails too.
  - `uv audit` over `docs-retrieval-service/uv.lock` (the preview command; pip-audit is the fallback if its CLI
    changes).
  - **Online zizmor** (`--gh-token`, `GH_TOKEN: ${{ github.token }}`) over the repository's own `.github` **and**
    over the four rendered adopter templates (`harness-run/resume/trigger/control.yml`), which run in adopters'
    repositories with their secrets. Today `scripts/check-rendered-workflows.mjs --zizmor` is offline only, and
    the online audit is a hand-run step (`docs/development.md`, "The online audit", last run 2026-10-09:
    7 findings, 5 `artipacked` + 2 `adhoc-packages`, none high). Add an online mode, or a flag, that renders and
    grades against the **same** `RESIDUAL` set. `impostor-commit`, `ref-confusion`, `known-vulnerable-actions`
    and `stale-action-refs` are the audits only online mode runs.
  - Optionally, a **model-revision check**: compare each pinned revision (Finding D) with the upstream `main`
    and report drift as a notice, not a failure, so a deliberate bump is a visible choice.
- **Dependabot** (repository settings, not code): alerts and security updates are both **disabled** today
  (`GET /repos/firu-daniel/autonomous-sdlc-harness/vulnerability-alerts` → 404). Recommend turning both on, and
  decide whether a `dependabot.yml` with a cooldown is wanted (zizmor's `dependabot-cooldown` audit fires
  without one). The settings toggle is the maintainer's to flip. The branch states the recommendation and
  does not flip it.

## Out of scope

- Running `scripts/run-gates.sh` on PRs. Several gates need local tooling, models or Docker. That is a separate
  branch if wanted.
- Changing which models retrieval uses. Pinning is in scope; swapping models is not.

## Acceptance

- `npm audit --audit-level=high` (full tree), `uv audit` and the online zizmor leg all pass on the branch's final
  tree, run locally, with the commands and outputs recorded in the plan or branch notes.
- `peerDependencies` no longer admits a version inside a known-advisory range for `@modelcontextprotocol/sdk`.
- Both retrieval paths load a fixed commit for each model. The Python manifest and the CLI agree on the
  revisions. Gate 10 (docs retrieval with the real models) is re-run, or the plan says why it need not be.
- Gate 14 (all legs) and the `validate:*` scripts still pass with whatever replaces or keeps `ajv-cli` and
  `js-yaml`, and `docs/development.md`'s descriptions of them match the new behaviour.
- The new workflow parses (actionlint), passes offline zizmor with no new residual, and is shown to reach `main`
  through the publish route.
