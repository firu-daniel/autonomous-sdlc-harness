### 5. `test-fix-plan-writer.md` states the log path with a raw `<branch>` directory; the wrapper writes a sanitized one

**Severity:** Should Fix

**Site anchor**

`plugin/agents/test-fix-plan-writer.md` → `## Invocation contract`, the sentence *"`<log_path>` is `<state_dir>/test_run_logs/<branch>/<gate_key>_round_<gate_round>.log`; take `<gate_key>` and `<gate_round>` from its filename."*

**Problem**

`run-test-suite.sh` does not place the log under `<branch>`. It builds the directory as `log_dir="$state_dir/$LOG_SUBDIR/$safe_branch"`, where `safe_branch` is `hr_sanitize_branch "$branch"`, which maps `/` to `-`. The wrapper's own suite pins this: `BRANCH = 'feat/run-gates'` produces `LOG_DIR = 'sdlc-harness/test_run_logs/feat-run-gates'`. The shipped `test_run_logs/README.md` says so too: *"`<branch>` is the branch name sanitized for use as a path"*.

For any branch name containing `/`, the writer's contract states a path that does not exist. The writer is always handed the real path, so nothing breaks today. But the sentence is the durable description of a wire, and a reader who rebuilds a log path from it would miss the file.

**Fix**

Replace the sentence with:

> `<log_path>` is the path the wrapper printed, `<state_dir>/test_run_logs/<sanitized branch>/<gate_key>_round_<gate_round>.log`, where the sanitized branch is the branch name with every `/` replaced by `-`. Use the path as given, never rebuild it, and take `<gate_key>` and `<gate_round>` from its filename.
