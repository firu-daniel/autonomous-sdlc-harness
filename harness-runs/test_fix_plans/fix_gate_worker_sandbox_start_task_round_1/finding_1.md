### 1. Gate 6a flags the flow walker's machine-local state file

**Site:** `scripts/check-machine-paths.sh`, the `grep -rn "$HOME" . --exclude-dir=node_modules …` pipeline and its two anchored `grep -v` filters (the second is `grep -v '^\./harness-runs/clarifications/[^/:][^/:]*/'`). Also the header paragraphs `THE EXCLUDED DIRECTORIES.` and `THE CLARIFICATIONS FILTER.` in the same file; the test `cli/test/check-machine-paths.test.mjs` → `(b) the excluded places print nothing, while the clarifications README still prints`; and the gate-6a paragraph of `docs/development.md` that begins "Those two must print nothing".

**Failing test:** none — 6a no machine paths

**Failure (from the log):**

```
  FAIL  6a no machine paths (printed output, which is the finding, 1 s)
        ./harness-runs/.flow_walker_state:10:revision_findings=harness-runs/architecture_reviews/fix_gate_worker_sandbox_start/review_1.md	harness-runs/task_plan_reviews/fix_gate_worker_sandbox_start/review_1.md
```

In the log, both paths on that line are absolute paths under the checkout root. They are shown repo-relative here.

**Diagnosis:** New this round. The hit is `harness-runs/.flow_walker_state`, the flow walker's own state file. `scripts/flow-walker.sh` writes it (`STATE_FILE="$ROOT/$STATE_DIR/.flow_walker_state"`), and its header calls it "machine-local, flat `key=value`". `revision_findings` stores the closed round's findings files exactly as the orchestrator passed them, and in this run they were absolute paths. The file is untracked and ignored (`.gitignore:47: harness-runs/.flow_walker_state`), so no commit can carry it. The task-plan contract also forbids editing it (`plugin/instructions/task_plan_writing_instructions_core.md` → "Do NOT edit `<state_dir>/.flow_walker_state`. It is the walker's."). Deleting or rewriting the file is therefore not a fix: it is the live walk's state.

Gate 6a exists to stop a machine path reaching a commit. The script already skips other gitignored, machine-local run state for that reason: `test_run_logs`, `scratch`, the per-branch clarifications and `__pycache__`. The walker's state file is the same class and was never added. It shows up now because this run is the first to record absolute findings paths in it before a gate run. The branch's own code changes did not cause this.

**Fix:**

- [ ] In `scripts/check-machine-paths.sh`, add one more anchored filter to the pipeline: `| grep -v '^\./harness-runs/\.flow_walker_state:'`. Anchor it on the root state directory's exact file, as the clarifications filter is anchored, rather than using `--exclude=.flow_walker_state`. grep matches `--exclude` against a base name, so it would also hide a same-named file anywhere else (for example under `examples/notes-app/devscene/`), and the script's stated direction is to fail closed.
- [ ] In the same file, add a header paragraph next to `THE CLARIFICATIONS FILTER.`. It names the file, cites `scripts/flow-walker.sh`'s `STATE —` header ("machine-local") and `.gitignore`'s entry, and says why the filter is anchored on the exact path. Mention the new filter in the paragraph that explains the pipe ("The pipe is safe because the gate grades OUTPUT…"), so the header still describes every stage.
- [ ] In `cli/test/check-machine-paths.test.mjs` → case `(b)`, add `'harness-runs/.flow_walker_state'` to the `silent` list. Also add one hit-bearing `.flow_walker_state` somewhere that is not the root state directory (for example `nested/.flow_walker_state`), and assert it is still printed, the way the clarifications `README.md` is. Update the expected `run.stdout` to match.
- [ ] In `docs/development.md`, in the gate-6a paragraph that lists each exclusion with its reason, add the walker-state filter and its reason in the same style.
- [ ] Do not change `scripts/flow-walker.sh`, the state file itself or `.gitignore`.

- **Deviations from plan:** The finding names no test file (`none — 6a no machine paths`), so the row-`G.4` check took the fix-site fallback. I read the `grep -rn "$HOME"` pipeline in `scripts/check-machine-paths.sh`. It had no `.flow_walker_state` filter, so the fix was not yet there, and I implemented it. Gate 6a itself (`scripts/check-machine-paths.sh`) was not run, because a unit never runs a gate script. Its after-result rests on two things: (1) `npm test --workspace cli -- test/check-machine-paths.test.mjs`, where case `(b)` now asserts that `harness-runs/.flow_walker_state` is silent and `nested/.flow_walker_state` is printed (`# tests 5`, `# pass 5`, `# fail 0`); (2) reading the new anchored filter `grep -v '^\./harness-runs/\.flow_walker_state:'` against the log line `./harness-runs/.flow_walker_state:10:…`. The Run gates phase's gate-6a run verifies it. Case `(b)` now compares its stdout as a sorted line list rather than one string, because two files are printed now and `grep -r` does not fix their order.
