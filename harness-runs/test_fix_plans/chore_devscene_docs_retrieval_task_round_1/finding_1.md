### 1. Rewrite the home-directory paths two run artifacts carry

`<home>` below stands for the running user's home directory, the value a bare `printenv HOME` prints. This file never writes it literally, because gate 6a scans this folder too. To grep for an anchor, substitute that value back in.

**Site anchors** (grep-verified in the current tree):

- `harness-runs/architecture_branch_reviews/chore_devscene_docs_retrieval_arch_review/finding_1.md` — the `**(c) Why no permission entry lifts it:**` bullet, substring `` `Edit(/<home>/Work/devscene-*/**)` ``. The rule's leading `//` is followed directly by the home directory (near line 22).
- `harness-runs/task_plans/chore_devscene_docs_retrieval/task_7_plan.md` — the `**Provision step run by the operator, not by this unit.**` bullet (near line 49), substrings `<home>/.cache/uv` and `<home>/.cache/uv/sdists-v9/.git`.
- Same file, the `` **`run --help` verification rests on reading, not execution.** `` bullet (near line 50), substrings `<home>/.cache/uv` and `<home>/.cache/devscene-docs-retrieval/venvs/361273692/pyvenv.cfg`.

**Failing test:** none — gate 6a no machine paths (`scripts/check-machine-paths.sh`, run by `scripts/run-gates.sh` as `gate_silent "6a no machine paths"`)

**Failure, quoted from the log** (home paths rewritten to `<home>`; the hit text is shortened with `…`):

```
  FAIL  6a no machine paths (printed output, which is the finding, 1 s)
        ./harness-runs/architecture_branch_reviews/chore_devscene_docs_retrieval_arch_review/finding_1.md:22:- **(c) Why no permission entry lifts it:** the run's profile (…) already holds `Edit(/<home>/Work/devscene-*/**)` in `allow`, …
        ./harness-runs/task_plans/chore_devscene_docs_retrieval/task_7_plan.md:49:- **Provision step run by the operator, not by this unit.** Inside the sandbox, `bash scripts/python-service.sh sync` exited 1 with `error: Failed to initialize cache at <home>/.cache/uv` / `cause: failed to open file <home>/.cache/uv/sdists-v9/.git: Operation not permitted (os error 1)`. …
        ./harness-runs/task_plans/chore_devscene_docs_retrieval/task_7_plan.md:50:- **`run --help` verification rests on reading, not execution.** … (`Failed to initialize cache at <home>/.cache/uv` … `Operation not permitted`). … What the claim rests on instead: `<home>/.cache/devscene-docs-retrieval/venvs/361273692/pyvenv.cfg` exists, …
```

**Diagnosis.** This failure is new this round. There are no earlier logs to compare against. `scripts/check-machine-paths.sh` runs `grep -rn "$HOME" .` over the working tree. It excludes `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch`, `__pycache__` and the per-branch subfolders of `harness-runs/clarifications/`, and the gate fails on any line it prints. Two committed run artifacts on this branch quote the absolute home directory:

- The architecture-review finding quotes the run profile's `Edit(…)` allow rule verbatim.
- The Task 7 plan's deviation notes quote the uv cache refusal and the venv cache location by absolute path.

Neither file sits under an excluded directory, so the gate prints all three lines. In the current tree, a grep for the home directory under the same exclusions finds exactly these two files and nothing else. Both files are prose records, and no code or script reads the paths, so `<home>` loses no meaning. The `~/.local/state/…` profile path on line 22 does not match `$HOME` and can stay as it is. So can the lower-case `users-…-work-devscene` profile-folder segment.

**Fix.** Make only the edits listed below. Do not reword anything else in either file.

- [ ] In `harness-runs/architecture_branch_reviews/chore_devscene_docs_retrieval_arch_review/finding_1.md`, `**(c)**` bullet: replace the home directory inside the rule with the literal text `<home>`, giving `` `Edit(//<home>/Work/devscene-*/**)` ``. Keep the `//` prefix, which marks the rule as absolute.
- [ ] In `harness-runs/task_plans/chore_devscene_docs_retrieval/task_7_plan.md`, line-49 bullet: change both cache paths to `<home>/.cache/uv` and `<home>/.cache/uv/sdists-v9/.git`. Keep the quoted error text otherwise byte-identical.
- [ ] Same file, line-50 bullet: change the cache path to `<home>/.cache/uv` the same way, and change the venv path to `<home>/.cache/devscene-docs-retrieval/venvs/361273692/pyvenv.cfg`.
- [ ] Confirm by reading, not by running the gate: a bare `grep -rlF` of the literal home directory over the two edited files prints nothing.

The full suite and gate 6a run again in the next Run gates round. This finding asks for no test, gate or test-file run.
