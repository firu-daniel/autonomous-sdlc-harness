### 4. The hand-run protocol does not tell the operator that the Python blocks depend on the database's history

**File:** `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one` → step **3. The four `--out` runs**, the paragraph beginning "into that copy, all with the same `--repeat`"

**Problem.** The write-up found, and recorded as a defect, that the Python route indexes every corpus into the one persistent compose database, and that its BM25 scores then depend on what that database held before. On a database created empty, the arm B divergence on `fixture-catalog` almost disappears (`docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### Divergence sources, in the order checked`, source (3), and the **Finding — a defect** paragraph after it).

The protocol a future operator follows still says nothing about this. Step 3 runs the two Python `--out` runs against whatever the compose database holds, and step 6 runs `docker compose down -v` only *after* those runs, for the cold index. Who reaches the wrong answer: an operator re-running the comparison, for example after the follow-up branch. Reading step 3 as written, they take a new Python arm B, D or E figure as a figure of the corpus alone. Comparing it with the recorded block, they read any change as a backend change. In fact it may be the database's history moving. The fix itself is deferred to its own branch: whether the eval should index into an empty database. That is why the protocol has to say the state it measures in.

**Fix.** In `docs/retrieval-eval.md`, directly after step 3's fenced block of four `--out` commands, add this paragraph. Change only this paragraph.

> The Python runs index into the one persistent compose database, and the Python backend's lexical scores depend on what that database held before (`docs/retrieval-eval-results.md` → `## The Python backend against the TypeScript one` → `### Divergence sources, in the order checked`, source (3)). So a `@python` block's arm B figures, and arms D and E through the fusion, describe the corpus *and* the database's history. A Python run over a database that has held other corpora is not a re-measurement of an earlier block's state. Record in `host.txt` whether the database was emptied (`docker compose down -v`, then `docker compose up -d --wait postgres`, from `docs-retrieval-service/`) before these runs.

Documentation only, so no test runs.
