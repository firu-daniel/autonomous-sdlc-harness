### 6. `llms.txt` describes `docs/retrieval-eval-results.md` without the arm A run and the decision the README's matching entry now names

**File:** `llms.txt` → `## Where to read more`, the entry starting "- [docs/retrieval-eval-results.md](" ("with the threshold calibration, the cold build and the query-log pass.").

**Problem.** This branch updated the root `README.md`'s index entry for the same file to "…the cold build, the query-log pass, the real-catalog arm A hand run and the decision taken on it." It also updated `llms.txt`'s `cli/` and `docs/retrieval.md` entries to name the withdrawn outcome. The `llms.txt` entry for the results document itself still lists only the calibration, the cold build and the query-log pass. A model reading `llms.txt` to find where the verdict lives is not pointed at the document that holds it.

**Fix.**

- [ ] Replace the entry's description text `the figures that eval measured, per corpus and per arm, with the threshold calibration, the cold build and the query-log pass.` with `the figures that eval measured, per corpus and per arm, with the threshold calibration, the cold build, the query-log pass, the real-catalog arm A hand run and the decision taken on it.` Leave the link target unchanged, so gate 6c (`bash scripts/check-llms-txt.sh`) is unaffected.
