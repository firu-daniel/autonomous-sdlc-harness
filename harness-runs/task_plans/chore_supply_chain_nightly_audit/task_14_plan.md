### Task 14 — Record the model pins in `docs/retrieval.md` and the service README, and add the `ROADMAP.md` row

**Goal:** Make the retrieval documents say what both paths now load: a fixed commit for each model, in one table that is the pins' single home, plus the one-time re-fetch the new CLI cache layout costs an existing adopter. Add `ROADMAP.md`'s row for the nightly audit, so "what runs where" is visible from the roadmap as the task prompt asks.

**Depends on:** Task 2. `cli/src/retrieval/models.ts` exports `EMBEDDING_REVISION = 'ea104dacec62c0de699686887e3f920caeb4f3e3'` (for `Xenova/bge-small-en-v1.5`), `RERANK_REVISION = 'a09144355adeed5f58c8ed011d209bf8ee5a1fec'` (for `Xenova/ms-marco-MiniLM-L-6-v2`) and `MODEL_REVISIONS`. Every `MODEL_FILES` path is now relative to `<retrievalModelCacheDir()>/<model id>/<revision>/`, and `modelFilesPresent` reports `<model id>/<revision>/<file>`. Task 6: `models.py` → `EMBEDDING_REVISION = "5c38ec7c405ec4b44b94cc5a9bb96e735b38267a"` (for `BAAI/bge-small-en-v1.5`) and `RERANK_REVISION = "233902d25c440f23af6f7d6e94d2946bac0bee0a"` (for `cross-encoder/ms-marco-MiniLM-L-6-v2`). Both loads pass the pin and `trust_remote_code=False`. The manifest records the pin, a manifest at another revision reads as unfetched, and `fetch_models` reads the pinned snapshot, not `refs/main`. Task 12: `docs/development.md` → `## 8. The nightly supply-chain audit`, which the roadmap row links to.

**Where this task stops.** It does not edit `docs/development.md`; Tasks 11–13 own it. It does not touch `docs/remote-execution.md` → *"What `zizmor --offline --no-config` still reports"*. That adopter-facing list is unchanged, because the templates are unchanged and the online audit returns the same seven residual findings. It adds no roadmap row for Dependabot: that is a recommendation awaiting the maintainer's decision, not planned work (lessons ledger → *Evidence and measurement*, the decision-rule lesson).

### Targets

- `docs/retrieval.md` → the `**Models.**` paragraph (scope register row 9).
- `docs-retrieval-service/README.md` → the `**Provisioning**` paragraph (scope register row 10).
- `ROADMAP.md` → `## Security and containment` table (scope register row 11).

**Work:**

- [ ] `docs/retrieval.md` → `**Models.**`: after "Only `fetchModels` downloads", say that every load, remote or offline, names a pinned revision. Add the four-row table, with columns repository, pinned revision, path: the two `Xenova/*` rows for the TypeScript path and the two originals for the Python path. State that the two paths pin different repositories, so the revisions agree per path, not across them. Say that a pin bump is a deliberate edit together with `MODEL_VERSION`, and that the nightly's `model-revisions` job reports upstream drift as a notice (point to `docs/development.md` §8).
- [ ] `docs/retrieval.md` → `**Models.**`, the cache layout: a pinned load caches at `<model id>/<revision>/<file>` (`@huggingface/transformers` 4.3.0, `buildResourcePaths`). A cache fetched before this release therefore reads as missing once. `doctor`'s `retrieval-model-cache` check names the missing paths, and the next `npx autonomous-sdlc-harness init` re-fetches them, after which the old `<model id>/<file>` copies are no longer read and may be deleted. Put the re-fetch command in a fenced block on its own line:

  ```
  npx autonomous-sdlc-harness init
  ```

- [ ] `docs-retrieval-service/README.md` → `**Provisioning**`: replace "against the revision the manifest records" and "lists each model's snapshot revision and files, taken from what was actually downloaded" with the pinned behaviour. Every load, including `fetch-models`, loads the revision pinned in `models.py`. The manifest records that revision and the files under it. A manifest at another revision, written by an older `fetch-models`, reads as unfetched until `fetch-models` runs again. Note in one sentence that the loads keep `trust_remote_code` off and that the snapshots load `model.safetensors`. Point to `docs/retrieval.md` for the revisions rather than restating them.
- [ ] `ROADMAP.md` → `## Security and containment`: add a row `| Nightly supply-chain audit | … | Done |`. It says that a scheduled workflow, never a merge gate, audits the full npm tree, the Python service's lock, the rendered adopter workflows and this repository's own workflows with online zizmor, and the pinned model revisions, and fails on findings, with a link to [`docs/development.md`](docs/development.md) §8 for what runs where and how its ignore sets are kept. Mention in the same row that both retrieval paths now load pinned model revisions. The index at the top of the file lists outstanding work only, so it gains no entry.

**Verification:**

- `grep -n 'ea104dacec62c0de699686887e3f920caeb4f3e3\|a09144355adeed5f58c8ed011d209bf8ee5a1fec\|5c38ec7c405ec4b44b94cc5a9bb96e735b38267a\|233902d25c440f23af6f7d6e94d2946bac0bee0a' docs docs-retrieval-service/README.md ROADMAP.md` finds the four SHAs in `docs/retrieval.md` only, each once. Each SHA equals its constant in `cli/src/retrieval/models.ts` or `docs-retrieval-service/src/harness_docs_retrieval/models.py`; grep both.
- `grep -n 'revision the manifest records\|refs/main' docs-retrieval-service/README.md docs/retrieval.md` finds nothing.
- The `ROADMAP.md` row's link resolves: `docs/development.md` has a heading `## 8. The nightly supply-chain audit`.
- Re-run the story index's scope-register derivation entry 1. Every line it prints is a register row, either `change` and now edited, or `no-change` with its reason. The invariant is that the output's sites are ⊆ the register rows.

**Deviations from plan:**

- Verification bullet 1 expects the four SHAs in `docs/retrieval.md` only. The grep also finds each once in `docs/development.md` → `## 8.` → `### Measured on the branch's final tree`, inside Task 13's verbatim `node scripts/check-model-revisions.mjs` output. That is a measured command record Task 13 owns and this task may not edit (`**Where this task stops.**`), so it is left as is. Under `docs-retrieval-service/README.md` and `ROADMAP.md` the grep finds nothing, and in `docs/retrieval.md` it finds each SHA once, in the pin table.
- `docs-retrieval-service/README.md` → `**Provisioning**`: the plan says a manifest "written by an older `fetch-models`" reads as unfetched. The story `## Context` records that the two Python pins equal the revisions the planner's own provisioned manifest already records, so an older manifest is not always at another revision. The README says such a manifest reads as unfetched only when it records a revision other than the pin.
- `ROADMAP.md` row: the plan says the workflow "fails on findings". The row adds that model drift is reported as a notice, because `docs/development.md` §8 says the `model-revisions` job leaves the exit at `0` on drift.
