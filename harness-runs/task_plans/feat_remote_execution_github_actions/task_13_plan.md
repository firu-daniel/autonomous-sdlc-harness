### Task 13 — Leave remote records out of `restart-watcher.sh`'s in-flight refusal

**Goal:** Stop `restart-watcher.sh` from refusing a daemon bounce because of a run that is executing on GitHub: bouncing the local daemon cannot touch a remote job, so a remote record is not "in flight" for this script's purpose.

**Depends on:** Task 11, which writes remote records with `execution: github-actions` and no `pid` into `<state_dir>/autonomous_logs/registry.json`; this script reads that same file.

**The rule.** The script's `jq` filter selects records whose `status` is `running`, `parked` or `park_loop` as in flight and refuses without `--force`. After this task it additionally excludes records whose `execution` is `github-actions`, and prints them on a separate informational line (`remote (not affected by a restart): <branch> <status>`) so the operator sees them. The registry-unreadable refusal and every other behaviour are unchanged. `cleanup-merged-worktrees.sh` is deliberately **not** changed: a remote record's working copy is its local mirror, and keeping it while the run is active is still correct.

### Targets

- `cli/templates/scripts/restart-watcher.sh` — the filter, the informational line, the header's registry paragraph and a `REPRO` entry.
- `cli/test/restart-watcher-remote.test.mjs` (new) — the accompanying suite. No suite drives this script's decisions today (`cli/test/init.test.mjs` only lists it among the written files), so this one drives the new rule and the one it must not disturb, through the script's own recorder arrangement: `HARNESS_CLI` pointed at a recorder on a temp `PATH`, exactly as its `REPRO` block does, so no daemon and no service manager is touched.

**Work:**

- [ ] Change the in-flight `jq` filter to `select((.value.status == "running" or .value.status == "parked" or .value.status == "park_loop") and (.value.execution != "github-actions"))`, and add the second, informational selection for the excluded remote records.
- [ ] Update the header's paragraph stating the registry is the source of truth for in-flight runs: remote records are listed and never block, and why.
- [ ] Add a `REPRO` entry: `{"runs":{"feat_r":{"status":"running","execution":"github-actions"}}}` → no refusal, the remote line printed.
- [ ] Cases, opening the suite with the rule it enforces: that registry → exit 0, the remote line printed, and the recorder holds `daemon stop` then `daemon install`; the same record without `execution` → exit 2 and an empty recorder file (the existing refusal, unchanged); a registry holding one local `parked` record and one remote `running` record → exit 2 naming only the local one.

**Verification:**

- `bash scripts/test.sh` exits 0.
- No test loads, starts or stops a real service (`.claude/context/cli.md` → `## What "done" means here`).
