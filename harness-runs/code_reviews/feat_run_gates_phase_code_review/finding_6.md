### 6. The self-adopted `scripts/run-test-suite.sh` is tracked at mode 0644; `init` writes it 0755

**Severity:** Should Fix

**Site anchor**

`scripts/run-test-suite.sh`: the whole file's git mode (`git ls-files -s scripts/run-test-suite.sh` prints `100644`).

**Problem**

Task 20 mirrors the new template into this repository's self-adopted `scripts/`, which is meant to be exactly what `init` writes here. `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS` declares the row `{ file: 'run-test-suite.sh', mode: 0o755, agentInvocable: true }`, and `cli/test/outer-loop-scripts.test.mjs` asserts that mode (`TEST_SUITE_RUNNER_MODE = 0o755`). The sibling agent-invocable mirrors are tracked executable: `scripts/flow-walker.sh` and `scripts/scratch-run.sh` are both `100755`. The new mirror is `100644`.

Every caller invokes it as `bash scripts/run-test-suite.sh`, so nothing fails today. But the mirror is not `init`'s output, and a forced re-adoption would flip the mode as an unexplained diff.

**Fix**

Set the executable bit on the tracked file so the commit records mode `100755`. Run `chmod 755 scripts/run-test-suite.sh` from the checkout root, or `git update-index --chmod=+x scripts/run-test-suite.sh`, and commit the path. The file's bytes do not change.
