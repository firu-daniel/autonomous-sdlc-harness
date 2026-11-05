### 3. `Push the branch` buffers the wrapper's output to a file, so a cancelled or timed-out step shows none of it

**File:** `cli/templates/github/workflows/harness-run.yml` (the `run` job's `Push the branch` step) — "bash \"$SCRIPTS_DIR/push-branch.sh\" > \"$log\" 2>&1 || true"

**The problem.** Before this branch, the step ran `push-branch.sh` directly, and its lines streamed into the job log as they were printed. The new body redirects everything to `$RUNNER_TEMP/push-branch.log` and only `cat`s the file once the wrapper has returned:

```bash
bash "$SCRIPTS_DIR/push-branch.sh" > "$log" 2>&1 || true
cat "$log" || true
```

Suppose the step is killed mid-push, for example because the job reached its timeout during the wrapper's retry waits or a slow `git push`, or because the run was cancelled. Then the `cat` never runs, and the step's log is empty. That is a step whose purpose on this branch is to make push trouble visible (goal 3), and it now shows less than before in exactly that case.

**Fix.** Stream and record at once. Replace those two lines with:

```bash
bash "$SCRIPTS_DIR/push-branch.sh" 2>&1 | tee "$log" || true
```

The step runs under `bash -e -o pipefail`, so `|| true` still keeps a non-zero status from failing it. `tee` writes to the same `$log`, which the step has already proved writable with `: > "$log"`. Leave the fallback branch (`if ! { : > "$log"; } …`), the annotation loop and the summary block unchanged.

`cli/test/workflow-templates.test.mjs` → `Push the branch annotates a refusal or a given-up push, and never fails the job` already asserts that the wrapper's line reaches stdout, and it still does through `tee`. This fix creates and edits no test file, so it owes no test run of its own: the full suite runs once per Run gates round.
