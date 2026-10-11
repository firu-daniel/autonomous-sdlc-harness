### Task 9 — Add `scripts/check-model-revisions.mjs`, a drift notice for the four pinned model revisions

**Goal:** Make a deliberate model bump a visible choice. Each night, compare each pinned revision, two per retrieval path, with its upstream `main`, and report drift as a GitHub Actions **notice**, not a failure. A pin that upstream no longer resolves **is** a failure, because a fresh `fetch-models` would then break for every adopter.

**Depends on:**
- Task 2. `cli/dist/retrieval/models.js` exports `EMBEDDING_MODEL`, `RERANK_MODEL`, `EMBEDDING_REVISION`, `RERANK_REVISION` and `MODEL_REVISIONS: Readonly<Record<string, string>>`, mapping each CLI model id to its 40-hex pin. This script imports `MODEL_REVISIONS` from there, so it needs a build.
- Task 6. `docs-retrieval-service/src/harness_docs_retrieval/models.py` carries exactly one line each of the forms `EMBEDDING_MODEL = "<id>"`, `RERANK_MODEL = "<id>"`, `EMBEDDING_REVISION = "<40 hex>"` and `RERANK_REVISION = "<40 hex>"`. This script reads the Python pins by matching those four lines, `^(EMBEDDING|RERANK)_(MODEL|REVISION) = "([^"]+)"$` with the `m` flag. Importing Python from Node, or running `uv`, is not needed for four constants.

**The interface the nightly calls**, which **Task 10** restates:

```
node scripts/check-model-revisions.mjs
```

For each of the four `(id, pin)` pairs, it calls the Hugging Face Hub API, with Node's global `fetch` following redirects:

- `GET https://huggingface.co/api/models/<id>/revision/<pin>`. A `404` means the pin no longer resolves. That is a finding: `::error::` and exit `1`.
- `GET https://huggingface.co/api/models/<id>/revision/main`. When `sha` ≠ pin, print `::notice title=model revision drift::<id> is pinned to <pin>; upstream main is <sha>`. When the response's `id` differs from `<id>` (today `cross-encoder/ms-marco-MiniLM-L-6-v2` answers as `cross-encoder/ms-marco-MiniLM-L6-v2`), print a `::notice title=model repository renamed::` line as well.
- A network failure, or any other non-2xx answer, prints `::warning::` naming the id and the status, with no retry, and does not change the exit. The check is advisory, and an outage must not cost a red night on its account.
- A pin that cannot be read from either source is a defect in the tree: `::error::` and exit `1`.

**Exit:** `0` when every pin resolves, whether or not it has drifted. `1` when a pin is unreadable or no longer resolves. `2` on any argument, because the script takes none.

**Where this task stops.** It changes no pin; bumping one is a deliberate edit to Task 2's and Task 6's constants together with `MODEL_VERSION`. The workflow job that runs it is **Task 10**'s, and the prose is **Task 12**'s.

### Targets

- `scripts/check-model-revisions.mjs` (new).

**Work:**

- [ ] Header: open with `#!/usr/bin/env node` and a header modelled on `scripts/check-rendered-workflows.mjs`. It says the script is hand-written for this repository and not an `init` output. It states **the rule**: drift is a notice, an unresolvable pin is a failure, and an outage is a warning. It gives the usage and exit codes, and says the script depends on gate 2a's build because it imports `cli/dist/retrieval/models.js`.
- [ ] Pin collection: resolve the repository root with `git rev-parse --show-toplevel` through `execFileSync`, as the sibling script does. Import `MODEL_REVISIONS` from `cli/dist/retrieval/models.js`, by a file URL built from that root, and parse the Python pins as specified above. Refuse with exit `1` unless exactly two CLI pins and two Python pins were read, each matching `^[0-9a-f]{40}$`.
- [ ] Network checks and reporting: implement them as specified above. Print one summary line per pair, `<path> <id> <pin> — <resolves|drifted to <sha>|unreachable (<status>)>`, so the job log reads as a table even where no annotation fires.

**Verification:** run each command from the repository root, without a pipe.

- `node --check scripts/check-model-revisions.mjs` exits 0, and `node scripts/check-model-revisions.mjs extra` exits `2`.
- Do **not** run `npm run build`: it is gate 2a (`scripts/run-gates.sh` → `gate "2a build" npm run build`), which no unit runs. Run against the `cli/dist` that Task 2's single-file test run compiled through `cli/package.json` → `scripts.pretest`. First confirm with `grep -n MODEL_REVISIONS cli/dist/retrieval/models.js` that the compiled module exports `MODEL_REVISIONS`. Where it prints no `export` line for it (or the file is absent), record the live run as not run, with that reason, and leave the build-dependent route to Phase G. Otherwise run `node scripts/check-model-revisions.mjs`. It prints four summary lines, CLI `Xenova/bge-small-en-v1.5`, CLI `Xenova/ms-marco-MiniLM-L-6-v2`, Python `BAAI/bge-small-en-v1.5` and Python `cross-encoder/ms-marco-MiniLM-L-6-v2`, each `resolves`, plus the rename notice for the last. It exits `0`. Where the network is unreachable it prints four warnings and still exits `0`; record that as not exercised.
- Check the unreadable-pin route by reading the source: the Python pattern is anchored with `^…$` under `m`, and the count check refuses any total other than two plus two.
