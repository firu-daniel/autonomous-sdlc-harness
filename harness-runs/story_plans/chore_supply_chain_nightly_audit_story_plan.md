# Story: Supply-chain nightly audit, with today's findings fixed first

## Context

This branch gives the harness repository a scheduled supply-chain check, `.github/workflows/supply-chain.yml`, and first clears everything that check would report today, so its first run is green. The workflow runs nightly and on `workflow_dispatch`. It is never a required check, because a new upstream advisory must not block unrelated merges. It fails on findings with no `continue-on-error`, because the email a red scheduled run sends is the alert. Online zizmor runs there and not in any merge gate, because an API outage or a new advisory would otherwise fail unrelated pull requests. The workflow has four jobs: `npm audit` over the **full** tree, `uv audit` over `docs-retrieval-service/uv.lock`, online zizmor over the rendered adopter workflows and this repository's own `.github`, and a model-revision drift notice.

**Base re-measured on 2026-10-11 by the planner, on commit `9615afb5`.** Plain `npm audit` reported `9 vulnerabilities (2 moderate, 7 high)`: `@modelcontextprotocol/sdk` 1.30.0 (GHSA-6qxp-vccf-f47h, patched in 1.31.0 per `gh api /advisories/GHSA-6qxp-vccf-f47h`), `sharp` 0.35.4 (GHSA-wq5f-xc86-pv6w), `fast-uri` 3.1.5, `brace-expansion` 1.1.18, `fast-json-patch` 2.2.1 under `ajv-cli` 5.0.0, `js-yaml` 3.15.1, and `argparse` 1.0.10 → `sprintf-js` 1.0.3. GHSA-hp3w-g68c-fv3c covers **every** `sprintf-js` release (`<= 1.1.3`, no patched version), so the only fix is to drop the `argparse` 1 chain. `ajv-cli` 5 pins both `js-yaml ^3.14.0` and `fast-json-patch ^2.0.0`, so `ajv-cli` itself has to go. In `docs-retrieval-service/`, `uv audit --preview-features audit-command` printed `Found no known vulnerabilities and no adverse project statuses in 84 packages`. Offline and online zizmor 1.30.1 over this repository's own `.github` printed `10 findings (7 suppressed, 2 unsafe fixes): 0 informational, 0 low, 2 medium, 1 high`: `artipacked` on `publish-main.yml` and on `release-npm.yml`, and `cache-poisoning` on `release-npm.yml`'s `setup-node`. The task prompt said `release-npm.yml` already sets `persist-credentials: false`. It does not. A scratch copy of the lock with the planned manifest changes (`ajv` and `js-yaml ^4.3.2` at the root, the SDK floor `^1.31.0`), refreshed with `npm audit fix --package-lock-only`, printed `found 0 vulnerabilities`. In that copy `@huggingface/transformers` stayed at **4.3.0**, which already admits `sharp ^0.35.4` → 0.35.5. So no transformers bump is needed, and the `@huggingface/transformers` 4.3.0 file paths documented in `cli/src/retrieval/models.ts` still hold.

**The MCP SDK's OAuth client path is not exercised.** `cli/src` imports only `@modelcontextprotocol/sdk/server/index.js`, `server/stdio.js` and `types.js` (`cli/src/retrieval/server.ts` → `SERVER_SPECIFIER`, `STDIO_SPECIFIER`, `TYPES_SPECIFIER`). The test suite and the evals use only `client/index.js` and `client/stdio.js`, with no auth provider, and nothing in the tree imports `client/auth.js`. The floor still rises: the peer range is what an adopter's `init` resolves against, and `^1.30.0` admits vulnerable versions.

**Model pinning, and what "the two paths agree" means here.** The two backends load **different** Hugging Face repositories. The CLI loads the `Xenova/*` ONNX exports, and the Python service loads the originals `BAAI/bge-small-en-v1.5` and `cross-encoder/ms-marco-MiniLM-L-6-v2`. So no single commit can be shared. In this plan, agreement means three things. Each path loads a fixed commit for each of its two models. The Python manifest records exactly the Python pin, and a manifest at any other revision reads as unfetched. One table in `docs/retrieval.md` names all four pins. The pins are each repository's `main` as of 2026-10-11:

| Repository | Pinned revision | Path |
|---|---|---|
| `Xenova/bge-small-en-v1.5` | `ea104dacec62c0de699686887e3f920caeb4f3e3` | CLI |
| `Xenova/ms-marco-MiniLM-L-6-v2` | `a09144355adeed5f58c8ed011d209bf8ee5a1fec` | CLI |
| `BAAI/bge-small-en-v1.5` | `5c38ec7c405ec4b44b94cc5a9bb96e735b38267a` | Python |
| `cross-encoder/ms-marco-MiniLM-L-6-v2` | `233902d25c440f23af6f7d6e94d2946bac0bee0a` | Python |

The two Python pins equal the revisions the planner's own provisioned manifest already records. For the CLI, every `MODEL_FILES` entry of both models in the gate-10 cache, fetched 2026-09-22, is byte-identical to that file at the pinned revision. The ONNX files matched on LFS sha256, and the three JSON files on git blob id. So neither embedder id nor `MODEL_VERSION` moves, no index is rebuilt, and gate 10 is not re-run in full: the weights it measured are the pinned weights. The cost of pinning is the cache key. `@huggingface/transformers` 4.3.0 caches a non-`main` revision at `<model id>/<revision>/<file>`, not `<model id>/<file>` (`node_modules/@huggingface/transformers/src/utils/hub.js` → `buildResourcePaths` → `proposedCacheKey`). Every existing CLI cache therefore reads as missing until one re-fetch. On the Python path, `huggingface_hub` writes no `refs/main` for a commit-hash revision, so `fetch_models` stops reading `refs/main`. That manifest shows sentence-transformers loading `model.safetensors`, never `pytorch_model.bin`.

**The publish route.** The repository's GitHub default branch is `main`, and `schedule` fires only from the default branch's copy of a workflow. `scripts/publish-main.sh` → `removed_paths` strips `scripts/`, `.claude`, `harness-runs`, `harness.config.json`, `githooks`, `.gitattributes` and `.github/workflows/publish-main.yml`, and nothing else. So a new `.github/workflows/supply-chain.yml` travels to `main` without any edit to that script. The scripts the workflow runs, though, do **not** reach `main`. So the workflow checks out `dev`, the trunk, which carries both the product and the hand-written scripts. Nothing is added to `scripts/publish-main.sh`.

**Layering.** The work is cut bottom-up: two `cli` tasks, then twelve `general` tasks. `docs-retrieval-service/`, `scripts/`, `.github/`, `schemas/`, the root manifest and lockfile, and `docs/` all belong to the catch-all layer. The SDK floor in `cli/package.json` is a `cli` task. The lockfile at the root is the first `general` task, so `npm ci` refuses the tree from Task 1 until Task 3 lands. No unit between them runs `npm ci`, and Phase G runs after all of them. `ajv-cli` is replaced by a small hand-written validator, `schemas/validate.mjs`, on top of the `ajv` library. It sits under `schemas/` rather than `scripts/` because the root `package.json` that calls it travels to `main` and `scripts/` does not. It keeps `ajv-cli`'s messages and exit codes, which `docs/development.md` gate 3 relies on. No `dependabot.yml` ships. Turning on Dependabot alerts and security updates is a repository setting the maintainer flips; the branch records the recommendation and does not flip it.

**Top risks:** The likeliest failure is a nightly that is red, or never fires, on its first run. Task 10 checks out `dev`, because `main` has no `scripts/`, and proves the file is outside `removed_paths`. Tasks 7 and 8 make this repository's own `.github` clean under online zizmor. Task 13 runs and records every leg a unit may run on the final tree. The rendered-set online zizmor leg goes through a gate script no unit runs, so it is a hand-run before merge (`Manual setup required:` below), and Task 13 records it as not run by the flow. The second is the cache-layout migration: pinning moves every CLI model file to `<model id>/<revision>/`, so an existing cache reads as missing. Task 2 re-fetches into the pinned layout as part of its verification, so gate 11 grades real models at Phase G instead of reporting `BLOCKED`, and Task 14 tells adopters about the one re-fetch. The third is a validator replacement that quietly changes gate 3's contract. `schemas/validate.mjs` becomes gate 3's driver, so no unit runs it. Task 4 checks each message string and exit code `docs/development.md` names by reading the source against its contract table. Gate 3 at Phase G grades the `valid` and `passed test` routes. The `failed test` and `Cannot find data file` routes, which no gate fixture reaches, rest on that source read.

**Manual setup required:**
- Turn on Dependabot alerts and Dependabot security updates under the repository's *Settings* → *Code security*. This is a recommendation only: `GET /repos/firu-daniel/autonomous-sdlc-harness/vulnerability-alerts` returns 404 today. No task depends on it, and Task 12 documents it as the maintainer's choice.
- Before the branch merges, hand-run the online zizmor leg over the rendered adopter workflows and this repository's own `.github` on the branch's final tree, and confirm that it exits 0 with nothing on stderr. Exit 4 means a missing token or a missing zizmor, and is not a pass. The flow cannot run this, because `scripts/check-rendered-workflows.mjs` is a gate script (gates 14a–14d) and no unit runs one. It depends on Tasks 7, 8 and 13, and Task 13 records it as not run by the flow. Run from the repository root, with `gh` logged in or `GH_TOKEN` set, and with `uvx` or zizmor 1.30.1 on `PATH`:

  ```
  npm run build
  ```

  ```
  node scripts/check-rendered-workflows.mjs --zizmor-online
  ```

- After the branch merges into `dev` and its publication pull request is rebase-merged onto `main`, dispatch the workflow once on `main` and confirm it is green. GitHub lists a `workflow_dispatch` workflow only once the file is on the default branch. This depends on Task 10. Run from any checkout with `gh` logged in:

  ```
  gh workflow run supply-chain.yml --repo firu-daniel/autonomous-sdlc-harness
  ```

- Confirm that GitHub Actions failure notifications reach the maintainer. GitHub sends a failed scheduled run's email to the user who last changed the workflow's `cron` line, and the workflow's whole alerting premise rests on that email. This depends on Task 10.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker or edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else, such as the sub-step bullets inside per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_supply_chain_nightly_audit/task_<K>_plan.md`. Entries are ordered bottom-up by ship sequence, in the configured layer order `cli`, `plugin`, `general`, with the catch-all `general` last. No task touches `plugin/`.

1. [x] **Task 1** — Raise the `@modelcontextprotocol/sdk` floor above GHSA-6qxp-vccf-f47h in `cli/package.json` _(layer: cli)_ _(points: 5)_
2. [x] **Task 2** — Pin the CLI's two retrieval models to immutable revisions in `cli/src/retrieval/models.ts` _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Refresh `package-lock.json` for the SDK floor and the transitive `sharp` / `fast-uri` advisories _(layer: general)_ _(points: 8)_
4. [x] **Task 4** — Replace `ajv-cli` with a hand-written `schemas/validate.mjs` that keeps its output contract _(layer: general)_ _(points: 15)_
5. [x] **Task 5** — Move the root `js-yaml` to 4.x and switch `scripts/check-rendered-workflows.mjs` to `yaml.load` _(layer: general)_ _(points: 8)_
6. [ ] **Task 6** — Pin the Python service's two models to immutable revisions in `models.py` _(layer: general)_ _(points: 15)_
7. [ ] **Task 7** — Clear zizmor's findings on this repository's own `release-npm.yml` and `publish-main.yml` _(layer: general)_ _(points: 8)_
8. [ ] **Task 8** — Add an online zizmor mode, `--zizmor-online`, to `scripts/check-rendered-workflows.mjs` _(layer: general)_ _(points: 15)_
9. [ ] **Task 9** — Add `scripts/check-model-revisions.mjs`, a drift notice for the four pinned model revisions _(layer: general)_ _(points: 12)_
10. [ ] **Task 10** — Add `.github/workflows/supply-chain.yml`, the nightly supply-chain workflow _(layer: general)_ _(points: 15)_
11. [ ] **Task 11** — Bring `docs/development.md` gates 3 and 14 in line with the new validator, `js-yaml` 4 and the online mode _(layer: general)_ _(points: 10)_
12. [ ] **Task 12** — Add `docs/development.md` → `## 8. The nightly supply-chain audit`: what runs where and how its sets are kept _(layer: general)_ _(points: 15)_
13. [ ] **Task 13** — Record the final-tree audit runs and each finding's disposition in `docs/development.md` §8 _(layer: general)_ _(points: 15)_
14. [ ] **Task 14** — Record the model pins in `docs/retrieval.md` and the service README, and add the `ROADMAP.md` row _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/development.md` and `ROADMAP.md` say what runs where: the new workflow, what it audits, that it is not a merge gate, and how its residual and ignore sets are kept."* — together with the acceptance line *"`docs/development.md`'s descriptions of them match the new behaviour."*

**Derivation entry 1 — corpus sites that describe a surface this branch changes (command).** Re-run verbatim from the checkout root:

```
git grep -n -o -E 'ajv-cli|js-yaml|ajv (validate|test)|failed test|Cannot find data file|online audit|--gh-token|hand-run and never this leg|refs/main|revision the manifest records|snapshot revision|Only .fetchModels. downloads|travels to main|npm audit|uv audit|[Dd]ependabot|supply.chain' -- docs ROADMAP.md README.md CONTRIBUTING.md 'schemas/*.md' 'schemas/**/*.md' docs-retrieval-service/README.md cli/README.md 'evals/*.md' 'evals/**/*.md' .claude/context plugin ':!docs/retrieval-eval-results.md'
```

`docs/retrieval-eval-results.md` is excluded. It is a generated eval results file of more than 28,000 lines, which this branch does not touch and whose figures are cited and never restated.

**Derivation entry 2 — the plan's own durable-corpus targets (procedure).** **Artifact:** the fourteen per-task files under `harness-runs/task_plans/chore_supply_chain_nightly_audit/`. **Traversal:** Task 1 to Task 14 in order, then each file's `### Targets` list from top to bottom. **Per-candidate decision rule:** a target is reached when it is durable corpus text. Source files, their comments, and workflow YAML (whose comments are source comments) are excluded.

**Derivation entry 3 — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** the lessons ledger. **Traversal:** its topic headings in file order, then the one-line rules under each. **Per-candidate decision rule:** a rule is reached when it names a surface on this branch's target list: the dependency manifests, the schema validator, `check-rendered-workflows.mjs`, the workflows, or the model-loading modules. On 2026-10-11 it reaches no rule, so it adds no row.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

| # | Site (path + symbol or quoted anchor) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, row *A negative schema fixture* ("its chained `ajv test … --invalid` assertion") | — | entry 1, `ajv test` | `no-change` | A conventions document is never a task's target. Task 4 makes the chained assertion `node schemas/validate.mjs test … --invalid`, which falsifies this row's literal, so it is raised as a `stale-rule` in `## Corpus staleness`. |
| 2 | `docs/development.md` → gate 3, the paragraph opening "The first validates the worked example" (`ajv test … --invalid`, `<file> failed test`, `Cannot find data file …`) | — | entry 1, `ajv test`, `failed test`, `Cannot find data file` | `change` | Task 11 |
| 3 | `docs/development.md` → gate 3, the paragraph opening "The last four lines cover the flow graph" ("the same `ajv test … --invalid` form") | — | entry 1, `ajv test` | `change` | Task 11 |
| 4 | `docs/development.md` → gate 12 round record, "**The online audit**, run on 2026-10-09" | — | entry 1, `online audit` | `no-change` | A dated record of one gate-12 round's measurement. It stays true of the day it records, and the nightly's own record goes in Task 13's §8. |
| 5 | `docs/development.md` → gate 14, the opening paragraph ("parses each with `js-yaml`"; "already in the lockfile through `ajv-cli`") | — | entry 1, `js-yaml`, `ajv-cli` | `change` | Task 11 |
| 6 | `docs/development.md` → gate 14, the paragraph opening "**It takes `zizmor` from `PATH`**" ("The online audit, which needs a GitHub token, is hand-run and never this leg") | — | entry 1, `hand-run and never this leg`, `online audit` | `change` | Task 11 |
| 7 | `docs/development.md` → new `## 8. The nightly supply-chain audit` (what runs where, policy, sets) | — | entry 2, Task 12 `### Targets` | `change` | Task 12 |
| 7a | `docs/development.md` → the opening `**Who reads this:**` paragraph ("It answers how to run the plugin from your working copy …") | — | entry 2, Task 12 `### Targets` | `change` | Task 12 |
| 8 | `docs/development.md` → `## 8.` → its measured-record and finding-disposition subsections | — | entry 2, Task 13 `### Targets` | `change` | Task 13 |
| 9 | `docs/retrieval.md` → `**Models.**` paragraph ("Only `fetchModels` downloads") | — | entry 1, `Only .fetchModels. downloads`; entry 2, Task 14 | `change` | Task 14 |
| 10 | `docs-retrieval-service/README.md` → `**Provisioning**` paragraph ("against the revision the manifest records"; "each model's snapshot revision") | — | entry 1, `revision the manifest records`, `snapshot revision`; entry 2, Task 14 | `change` | Task 14 |
| 11 | `ROADMAP.md` → `## Security and containment` table (new row) | — | entry 2, Task 14 `### Targets` | `change` | Task 14 |
| 12 | `docs/github-integration-research.md` (index row A1; S-section source at line 297; A1 answer and sources; the `pull_request_target` source naming "supply-chain") | — | entry 1, `[Dd]ependabot`, `supply.chain` | `no-change` | A dated research record of sources retrieved on 2026-09-30, about reusable workflows and `pull_request_target`. It describes nothing this branch changes. |
| 13 | `docs/team-accounts-research.md` (the Codespaces/Dependabot secret-store bullet and its sources; the OIDC `actor` source) | — | entry 1, `[Dd]ependabot` | `no-change` | A dated research record of sources retrieved on 2026-10-02, about secret stores. It describes nothing this branch changes. |
