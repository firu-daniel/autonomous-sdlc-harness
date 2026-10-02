### 1. Leftover scratch probe and `__pycache__` bytecode carry the home directory (gate 6a)

**Site:**
- `harness-runs/scratch/t14_pglite_ext.py`, line 3 (navigation hint): `BASE = "` followed by an absolute path to this checkout's `node_modules/@electric-sql/`.
- `docs-retrieval-service/src/harness_docs_retrieval/__pycache__/`: 15 `*.cpython-314.pyc` files.
- `docs-retrieval-service/tests/__pycache__/`: `fakes.cpython-314.pyc`, `test_mcp_parity.cpython-314.pyc`, `ts_bridge.cpython-314.pyc`.

**Failing test:** none — 6a no machine paths

**Failure (from the log, paths rewritten):**

```
FAIL  6a no machine paths (printed output, which is the finding)
      ./harness-runs/scratch/t14_pglite_ext.py:3:BASE = "node_modules/@electric-sql/"
      Binary file ./docs-retrieval-service/tests/__pycache__/ts_bridge.cpython-314.pyc matches
      Binary file ./docs-retrieval-service/tests/__pycache__/test_mcp_parity.cpython-314.pyc matches
      Binary file ./docs-retrieval-service/tests/__pycache__/fakes.cpython-314.pyc matches
      Binary file ./docs-retrieval-service/src/harness_docs_retrieval/__pycache__/chunk.cpython-314.pyc matches
      ... (the same line for corpus, refresh, mcp_server, search, service, errors, stubs, wire,
           jscompat, cli, models, __init__ and store under src/harness_docs_retrieval/__pycache__/)
```

In the log, the quoted `BASE` value is an absolute path that starts at the checkout root. It is shown here in repo-relative form.

**Diagnosis (new this round):** Gate 6a (`machine_path_hits` in `scripts/run-gates.sh`) runs `grep -rn "$HOME" .` over the whole working tree. It excludes only `node_modules`, `dist`, `.git` and `test_run_logs`, so gitignored files are scanned as well. None of the hits is a tracked file:

- `harness-runs/scratch/t14_pglite_ext.py` is a throwaway probe left over from Task 14. It is ignored by the `harness-runs/scratch/*` rule. `harness-runs/scratch/README.md` says a probe lives only for the dispatch that wrote it, so the directory should normally be empty. About 27 leftover probe files from Tasks 2 to 14 are still there.
- The `.pyc` files are ignored by the `__pycache__/` rule. Python embeds each module's absolute source path in its bytecode, so every file matches. They are not output from the gate wrapper: `scripts/python-service.sh` exports `PYTHONDONTWRITEBYTECODE=1`. Their timestamps match the scratch probes that import `harness_docs_retrieval` directly (14:04 for the Task 2 probes, 14:40 for the Task 11 probes). Those probes ran under a bare `python3`, which writes bytecode.

Nothing tracked on the branch names a machine path. The failure is caused entirely by leftover local state.

**Fix:**

- [ ] Delete every file in `harness-runs/scratch/` except `README.md`. That includes `t14_pglite_ext.py`, the only one gate 6a reports. The others are deleted too because the README requires the directory to be empty, and re-running them is what writes the bytecode again.
- [ ] Delete the directory `docs-retrieval-service/src/harness_docs_retrieval/__pycache__/` and everything in it.
- [ ] Delete the directory `docs-retrieval-service/tests/__pycache__/` and everything in it.
- [ ] Do not edit `scripts/run-gates.sh` to exclude these paths. The gate is correct: it is a self-check over the working tree.

These deletions change no tracked file, so this fix has no diff to commit. The committing role should record the finding as done without a code commit.

## Already passing

- **(a) Named test / fix site:** finding names no test file (`none — 6a no machine paths`), so the close rests on reading the fix site — `harness-runs/scratch/` and the two `__pycache__/` directories. The deletions were made by the user, per `harness-runs/clarifications/feat_docs_retrieval_python_backend/question_2.md` (Q1, option 1) answered `deleted` in `answer_2.md`.
- **(b) Evidence:** `ls -A harness-runs/scratch/` lists `README.md` only. `ls -d` on `docs-retrieval-service/src/harness_docs_retrieval/__pycache__` and `docs-retrieval-service/tests/__pycache__` returns `No such file or directory` for both. `find <repo_root> -name __pycache__ -not -path '*/node_modules/*'` returns nothing. A `grep -rl` for the home directory with gate 6a's four `--exclude-dir` values matches only the worktree's `.git` pointer file, which `machine_path_hits` in `scripts/run-gates.sh` filters out with `grep -v '^\./\.git:[0-9][0-9]*:'`. Gate 6a itself was not run (a gate script is never run in this loop); the next gate round confirms it.
- **(c) Code files edited:** none. `scripts/run-gates.sh` is unchanged.
