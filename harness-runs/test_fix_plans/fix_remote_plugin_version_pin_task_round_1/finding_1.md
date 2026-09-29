### 1. Leftover scratch probe carries the checkout's absolute path and trips gate 6a

**File:** `harness-runs/scratch/t1_probe.mjs` — "const root = '" (line 4 as a navigation hint). The file is untracked and gitignored (`.gitignore` → `harness-runs/scratch/*`, with only `harness-runs/scratch/README.md` negated back in).

**Failing test:** none — gate 6a no machine paths (`scripts/run-gates.sh` → `machine_path_hits`)

**Failure, as the log reports it** (the checkout's absolute prefix rewritten to its repo-relative form):

```
== gate 6 — self-containment
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/scratch/t1_probe.mjs:4:const root = 'cli/dist';
```

In the file itself, line 4 assigns `root` the absolute path of this checkout's `cli/dist` directory, which begins with the running user's home directory.

**Diagnosis.** Class: first round — no earlier log exists, so this is neither a regression nor a persisting failure. Gate 6a (`machine_path_hits` in `scripts/run-gates.sh`) runs `grep -rn "$HOME" .` over the **working tree**, excluding only `node_modules`, `dist`, `.git` and `test_run_logs`; it does not restrict itself to tracked files, so a gitignored file under `harness-runs/scratch/` is still searched. `t1_probe.mjs` is a language probe an earlier dispatch on this branch wrote to exercise `renderedCliVersions`, `writeGithubWorkflows` and `upgradeWorkflowsCommand` from the built CLI, and it imports them from a hardcoded absolute path. `harness-runs/scratch/README.md` states a probe "lives for the length of one dispatch", that the directory's steady state is empty, and that deleting the file once the answer is in hand is the whole of the housekeeping — this one was left behind. No tracked file and no source under `cli/` or `plugin/` is implicated; the gate's grep reported this single hit and nothing else.

**Fix.**

- [ ] Delete `harness-runs/scratch/t1_probe.mjs`.
- [ ] Leave `harness-runs/scratch/README.md` in place (it is the one committed file in that directory).
- [ ] Leave the other files in `harness-runs/scratch/` (`pin_step.sh`, `pin_step_syntax.mjs`) alone: gate 6a did not report them, and they may belong to a dispatch still in flight.

Do not edit `scripts/run-gates.sh` to exclude `scratch/`: the README makes deletion the contract, and a probe that hardcodes a machine path is exactly what the gate exists to surface.

**Deviations from plan:** Gate 6a (`scripts/run-gates.sh` → `machine_path_hits`) was not re-run: the finding names no test file and a gate script is never run by an implementer, so re-running it is deferred to the Run gates phase. The fix-site fallback applied — the site still carried the defect, so `harness-runs/scratch/t1_probe.mjs` was deleted. The close rests on `ls` of `harness-runs/scratch/` (the probe is gone; `README.md`, `pin_step.sh`, `pin_step_syntax.mjs` untouched) and on `grep -rn` of the checkout's home prefix over that directory, which returned no hit.

**Note for the committer.** The deleted file is untracked and gitignored, so this fix produces no change to the committed tree; there is nothing to stage for it.
