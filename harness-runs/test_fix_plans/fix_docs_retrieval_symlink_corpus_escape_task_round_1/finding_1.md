### 1. Task plans 2 and 3 quote an absolute home-directory path (gate 6a)

**Site:**
- `harness-runs/task_plans/fix_docs_retrieval_symlink_corpus_escape/task_2_plan.md`: the bullet starting "- **`tests/test_corpus.py` was not run (evidence downgrade).**" (around line 41), substring `no synced environment at `.
- `harness-runs/task_plans/fix_docs_retrieval_symlink_corpus_escape/task_3_plan.md`: the bullet starting "- **Deviations from plan:**" (around line 30), substring `no synced environment at `.

Both files are tracked by git. A grep of the current tree finds no other file with the home path outside the directories gate 6a excludes.

**Failing test:** none — gate 6a no machine paths

**Failure (from the log):**

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/task_plans/fix_docs_retrieval_symlink_corpus_escape/task_2_plan.md:41:- **`tests/test_corpus.py` was not run (evidence downgrade).** … exited 3 with `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/227539081; run bash scripts/python-service.sh sync`. …
        ./harness-runs/task_plans/fix_docs_retrieval_symlink_corpus_escape/task_3_plan.md:30:- **Deviations from plan:** … exited 3 with `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/227539081; run bash scripts/python-service.sh sync`. …
```

(In the files themselves, `<home>` is the running user's literal absolute home directory.)

**Diagnosis:** This is the first round, so there is no earlier log to compare against. Gate 6a (`scripts/run-gates.sh` → `machine_path_hits`) greps the tree for the literal `$HOME`. It excludes only `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch` and `__pycache__`, so committed artifacts under `harness-runs/task_plans/` are in scope. When Tasks 2 and 3 recorded their evidence downgrades, they pasted the `python-service.sh` refusal verbatim, absolute venv path included. Each file contains that path exactly once, inside the quoted refusal line.

**Fix:**
- [ ] In `task_2_plan.md`, inside the quoted `python-service: not provisioned: …` message, replace the absolute home-directory prefix of `…/.cache/harness-docs-retrieval/venvs/227539081` with `<home>`, giving `<home>/.cache/harness-docs-retrieval/venvs/227539081`.
- [ ] Make the same replacement in `task_3_plan.md`.
- [ ] Change nothing else on those lines, and do not touch `scripts/run-gates.sh`'s exclusion list. The artifacts are committed, so 6a covering them is correct.
- [ ] Confirm with a plain `grep -rlF` of the home directory over `harness-runs/task_plans/fix_docs_retrieval_symlink_corpus_escape/` that nothing is printed.
