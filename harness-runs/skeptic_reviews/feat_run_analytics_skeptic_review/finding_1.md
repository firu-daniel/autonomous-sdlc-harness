### 1. This repository's own `scripts/run-analytics.sh` is committed without its executable bit, so the watcher records nothing here, locally or on GitHub

**File:** `scripts/run-analytics.sh` (the whole file's git mode). It is committed as `100644`.

**The problem.** `record_run_analytics` in `scripts/autonomous-watcher.sh`, which is a byte copy of the template, refuses to run a script that is not executable:

```bash
RUN_ANALYTICS="$SCRIPT_DIR/run-analytics.sh"
...
  if [ ! -x "$RUN_ANALYTICS" ]; then
    log "run analytics: '$RUN_ANALYTICS' is not executable — '$branch' not recorded (\`autonomous-sdlc-harness init --force\` rewrites it)"
    return 0
  fi
```

This repository's `harness.config.json` has `"scriptsDir": "scripts"`, so the watcher that runs this repository's own runs is `scripts/autonomous-watcher.sh`, and `$SCRIPT_DIR/run-analytics.sh` is `scripts/run-analytics.sh`. That file is committed non-executable. `git ls-files -s` shows:

```
100644 dd3facf6…  scripts/run-analytics.sh
100755 b8c4feed…  scripts/autonomous-watcher.sh
100755 …          scripts/autonomous-format-stream.sh
100755 …          scripts/autonomous-notify.sh
```

`ls -l scripts/run-analytics.sh` in this checkout shows `-rw-r--r--`. Every sibling outer-loop script the watcher runs as a program is `100755`. `OUTER_LOOP_SCRIPTS` declares `run-analytics.sh` with `mode: 0o755`.

What happens at runtime:
- **Every session in this repository**, from every launch, park or pause resume, and every job-mode auto-resume, takes the `! -x` arm. The result is one `run analytics: … is not executable` line in `watcher.log`, and no record.
- **A GitHub Actions job for this repository** checks the branch out with the committed mode `100644`, so the job's watcher takes the same arm. No record is committed and none is pushed.

So this repository, which this branch's own motivating case comes from, never gets a `harness-runs/run_analytics/<branch>/` record. The code review's mirror check compared bytes only (*"byte-identical to `cli/templates/scripts/`"*), and no test reads this repository's mirror modes: `cli/test/outer-loop-scripts.test.mjs` asserts `0o755` only on the files `init` writes into a fixture. An adopter is not affected, because `init` writes the file with `0o755`.

**Fix.** Set the executable bit on the mirror, both in the working tree and in the index:

```bash
chmod 755 scripts/run-analytics.sh
git update-index --chmod=+x scripts/run-analytics.sh
```

Then commit `scripts/run-analytics.sh`. The commit is a mode change only. Do not change the file's bytes, which must stay identical to `cli/templates/scripts/run-analytics.sh`. Leave `scripts/lib/run-analytics.jq` and `scripts/lib/run-analytics-report.jq` at `100644`, which matches their `mode: 0o644` rows. No test file is edited, so the fix runs no test. Confirm it with `git ls-files -s scripts/run-analytics.sh`, which must print `100755`.

- **Deviations from plan:** The `chmod 755` step was already applied by the user in this run copy (Park 1, `harness-runs/clarifications/feat_run_analytics/answer_1.md`, option (a)); `ls -l` shows `-rwxr-xr-x` and `git diff scripts/run-analytics.sh` shows `old mode 100644` / `new mode 100755` with no content hunk. `git update-index --chmod=+x` was not run: staging belongs to the committer, and since `git diff` already reports the mode change, the committer staging `scripts/run-analytics.sh` records `100755`. The confirmation `git ls-files -s scripts/run-analytics.sh` → `100755` therefore holds only after the committer stages; at implementation time the index still reads `100644 dd3facf6…`. Bytes verified unchanged: `cmp scripts/run-analytics.sh cli/templates/scripts/run-analytics.sh` exited 0. `scripts/lib/run-analytics.jq` and `scripts/lib/run-analytics-report.jq` confirmed `100644` via `git ls-files -s`.
