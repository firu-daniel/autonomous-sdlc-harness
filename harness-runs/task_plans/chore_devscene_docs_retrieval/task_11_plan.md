### Task 11 — Rename the retrieval names in the research records, keep the quoted lines, and run the Done-when closure

**Goal:** Rename the retrieval names in `docs/work-report-research/` and `docs/rag-extraction-research/` (task prompt goal 4). A line that quotes another repository's file or a recorded command output keeps its text. Then close the branch against the task prompt's Done-when grep, with the kept lines as the only surviving hits.

**Depends on:** Tasks 1–10. This is the last task, and its closure grep covers the whole tree. The new spellings are:

- `devscene-docs` and `mcp__devscene-docs__search_docs`;
- `devscene-docs-retrieval` and `devscene_docs_retrieval`;
- `DEVSCENE_DOCS_RETRIEVAL_{DATABASE_URL,TEST_DATABASE_URL,MODEL_CACHE,PG_PORT,REPO}`;
- `DEVSCENE_RETRIEVAL_CACHE`, `DEVSCENE_RETRIEVAL_LOG`, `DEVSCENE_RETRIEVAL_STUB`;
- login `devscene:devscene`.

**Which lines keep their text.** The story index's `## Scope register` decides this. Every research-record line it lists as `no-change` keeps its text byte for byte. Every other hit in a file with a `change` row is renamed. These are the kept lines:

- `docs/rag-extraction-research/07-extraction-plan.md`:
  - cut-table row `6, 7` ("These are the post-rename forms of `HARNESS_DOCS_RETRIEVAL_{…}`");
  - the four catch-2 bullets "**Keep `HARNESS_RETRIEVAL_CACHE` (4).**", "**Replace `HARNESS_RETRIEVAL_LOG` (0).**", "**Add `HARNESS_DOCS_RETRIEVAL_MODEL_CACHE` (7)" and "**Fix #154 too.**".
- `docs/rag-extraction-research/reviews/01-current-mechanism.md`: the two recorded greps, "`grep -l mcp__harness-docs__search_docs plugin/agents/*.md` returning exactly 11 files" and "`grep search_docs\|harness-docs plugin/hooks/*` finds nothing".
- `docs/rag-extraction-research/reviews/04-engine-architecture.md`: the `wc -l docs-retrieval-service/src/harness_docs_retrieval/*.py` totals line.
- `docs/rag-extraction-research/reviews/07-extraction-plan.md`:
  - "devscene5 renames `harness-docs` → `devscene-docs`";
  - "§2's paths (`src/harness_docs_retrieval/`) and finding 3's grep must name the **post-rename** spellings";
  - "Its body cites `harness_docs_retrieval/corpus.py`";
  - every hit in finding R1, from "R1. **§5's catch 2 is partly wrong" through its "**Change:**" bullet.

A hit in these folders that is neither in this list nor a citation of this repository's own files is reported in the return, never renamed or kept on a guess.

**Where this task stops.** Only names change. Line coordinates such as `server.ts:35-42`, counts, dates and verdicts stay as they are.

### Targets

- `docs/work-report-research/` — `architecture-reviewer.md`, `branch-reviewer.md`, `business-parity-reviewer.md`, `review-plan-reviewer.md`, `reviews/skeptic-reviewer.md`, `skeptic-reviewer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`, `test-fix-plan-writer.md`, `ui-tests-plan-reviewer.md`, `user-review-fix-plan-writer.md`
- `docs/rag-extraction-research/` — `01-current-mechanism.md`, `03-sources-database-security.md`, `06-models-and-modes.md`, `_brief.md`, `reviews/01-current-mechanism.md`, `reviews/05-managed-postgres-lexical.md`, `reviews/07-extraction-plan.md`

**Work:**

- [ ] **`docs/work-report-research/`.** Rename `mcp__harness-docs__search_docs` → `mcp__devscene-docs__search_docs` in every hit of the eleven files. Each one cites this repository's own agent definition, not another repository.
- [ ] **`docs/rag-extraction-research/`, apart from the kept lines.** Rename every hit in `01-current-mechanism.md`, `03-sources-database-security.md`, `06-models-and-modes.md`, `_brief.md` and `reviews/05-managed-postgres-lexical.md`. Do the same in `reviews/01-current-mechanism.md` and `reviews/07-extraction-plan.md`, except for the kept lines listed above. `07-extraction-plan.md` is not edited: every hit in it is a kept line, so it stays byte-identical. `reviews/01-current-mechanism.md`'s finding 7 quotes `01-current-mechanism.md` §5 and follows its rename. The "Grep there only for the product-code names" line in `reviews/07-extraction-plan.md` names the post-rename spellings, as that same review's finding asks.
- [ ] **The Done-when closure.** From the checkout root, run `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness|POSTGRES_(USER|PASSWORD): harness' -- . ':!harness-runs' ':!scripts/docs-search-server.sh' ':!scripts/autonomous-watcher.sh'`. Every line it prints must be one of the kept lines above, and `⊆ the register's no-change research rows` is the invariant. List the printed lines in the return as the report the task prompt asks for. A line outside the kept set is a hit an earlier task missed: report it naming its file and owning task, and do not edit outside this task's targets.

**Verification:**

- The closure grep above prints only lines that the story index's `## Scope register` lists as `no-change`. It prints nothing outside `docs/rag-extraction-research/`.
- `git diff --numstat -- docs/work-report-research docs/rag-extraction-research` shows equal insertions and deletions for every file, so only lines were rewritten.
- `git diff -- docs/rag-extraction-research` touches none of the kept lines: none of their quoted anchors appears on a `-` line.
- `git diff --quiet -- docs/rag-extraction-research/07-extraction-plan.md` exits 0, so that file is untouched.
