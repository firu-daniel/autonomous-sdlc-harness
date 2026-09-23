### Task 13 — Author the `docs/vite/` positives of `gate10-catalog.jsonl` by reading the catalog

**Goal:** Append **at least 14 positive queries answered in `docs/vite/`** to `evals/docs-retrieval/queries/gate10-catalog.jsonl`, so the set carries at least 32 positives across both halves (the task prompt requires at least 30, recorded per half), built and labelled exactly as Task 12's were.

**Depends on:** Task 12, which creates `evals/docs-retrieval/queries/gate10-catalog.jsonl` with its `docs/expause-web/` positives, ids `q-g10-ew-<slug>`, and the record contract of Task 4: `{ id, query, labels: [{ ref, grade }], situation, intent, origin }`, `intent` one of `surroundings` / `convention` / `contract`, `origin` one of `written` / `harvested`, `ref` spelled as `SearchHit.ref` renders it, `grade` 1–3 with 3 answering. This task appends lines and edits none of Task 12's.

### Targets

- `evals/docs-retrieval/queries/gate10-catalog.jsonl` — appended records only.

**How the catalog is reached.** `printenv HARNESS_EVAL_CORPUS_ROOT` gives the root; read the documents under `docs/vite/` with `Read`, `Grep` and `Glob`. `docs/vite/`'s `index.md` files are VitePress landing pages, not navigation maps — find sections by reading the guide and config documents themselves. The value is never written anywhere.

**Work:**

- [ ] **Situation, then query, then labels, per record** — the situation a line of a plausible task prompt, plan step or review finding in a project built with Vite (a dev-server, build, plugin, config or environment-variable task), the query written from the situation alone as a short identifier-dense phrase (a config key or API name the situation would carry is fair; a term only the target section uses is not), the labels found by reading, at least one grade-3 label per query, every label under `docs/vite/`. Ids `q-g10-vite-<slug>`. If Task 12 used a harvested log, its Vite-shaped queries come first here under the same rules, and the log's score fields are never read.
- [ ] **Intents** — cover `surroundings`, `convention` and `contract` in a branch's rough proportion, and count them.
- [ ] **Pass the label pre-flight over the whole file** with the launcher Task 12 describes (the `gate10-catalog` composition: `--docs-root docs` plus the catalog's own conventions documents, in memory, `assertLabelsResolve` only — **no arm and no search**), expecting gate 10's snapshot `{ files: 156, chunks: 1960 }` — or the same stamp Task 12's run printed, if that one differed.

**Verification:**

- The pre-flight prints `labels resolve` and a snapshot equal to Task 12's; `loadQueries` accepts the file.
- At least 14 positives carry labels under `docs/vite/` only, and the file's total positives are at least 32; `git diff` shows only appended lines.
- `bash scripts/check-eval-artifacts.sh` prints nothing.
- Report in the return the `docs/vite/` positive count and the per-intent counts. Task 14 re-derives every count from the file itself, so nothing depends on this return.
