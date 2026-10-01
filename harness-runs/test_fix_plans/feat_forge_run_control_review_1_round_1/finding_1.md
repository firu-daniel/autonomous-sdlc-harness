### 1. Remove the leftover scratch probes that carry the checkout's absolute path

**Site anchor:**
- `harness-runs/scratch/collect_on_branch_probe.mjs` — the `import { createFixture, runBash, runCli, runGit } from '…/cli/test/helpers/fixture.mjs'` line (line 27, navigation hint only).
- `harness-runs/scratch/collect_control_probe.mjs` — the same `import { createFixture, runBash, runCli, runGit } from '…/cli/test/helpers/fixture.mjs'` line (line 27, navigation hint only).
- `harness-runs/scratch/gen_collect_probe.py` — the `root = "…"` assignment (line 1, navigation hint only).
- The gate itself: `scripts/run-gates.sh` → `machine_path_hits()`, invoked as `gate_silent "6a no machine paths" machine_path_hits`.

**Failing test:** none — gate 6a no machine paths

**Failure (from the log, machine paths rewritten — the checkout root is shown as its repo-relative form `.`):**

```
== gate 6 — self-containment
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/scratch/collect_on_branch_probe.mjs:27:import { createFixture, runBash, runCli, runGit } from './cli/test/helpers/fixture.mjs';
        ./harness-runs/scratch/gen_collect_probe.py:1:root = "."
        ./harness-runs/scratch/collect_control_probe.mjs:27:import { createFixture, runBash, runCli, runGit } from './cli/test/helpers/fixture.mjs';
run-gates: 1 failed, 19 passed
  - 6a no machine paths
```

In the log each of the three quoted paths is the checkout's absolute path, which sits under the running user's home directory — that is what the gate matched.

**Class:** new this round — no earlier-round log exists for this gate key.

**Diagnosis:**

Gate 6a runs `grep -rn "$HOME" .` over the whole working tree, excluding only `node_modules`, `dist`, `.git` and `test_run_logs`. It reads the working tree, not the index, so a gitignored file still counts. `harness-runs/scratch/` holds four untracked files that an earlier dispatch on this branch left behind — `collect_control_probe.mjs`, `collect_on_branch_probe.mjs`, `gen_collect_probe.py` and `round_collect.sh`. `git status --ignored` reports all four as ignored (`.gitignore`: `harness-runs/scratch/*` with `!harness-runs/scratch/README.md`), so none of them is on the branch. Three of them hard-code the checkout's absolute path, and that path is under the home directory, so 6a prints them. `round_collect.sh` has no hit, but it is the same kind of leftover.

`harness-runs/scratch/README.md` defines the directory's steady state as **empty**: a probe lasts for one dispatch, and "deleting it once the answer is in hand [is] the whole of the housekeeping". These files outlived the dispatch that wrote them, and that is the whole cause. No committed source carries a machine path. The branch's code changes have nothing to do with this failure.

**Concrete fix:**

- [ ] Delete `harness-runs/scratch/collect_control_probe.mjs`, `harness-runs/scratch/collect_on_branch_probe.mjs` and `harness-runs/scratch/gen_collect_probe.py`, the three files gate 6a names.
- [ ] Delete `harness-runs/scratch/round_collect.sh` too. It is a leftover probe of the same kind, and the README requires the directory to be empty in its steady state.
- [ ] Leave `harness-runs/scratch/README.md` alone. It is the directory's only committed file and contains no machine path.
- [ ] Do not change `scripts/run-gates.sh`. The gate correctly reported a working-tree file naming the home directory. The README's own rule (delete the probe) is the fix, and excluding `scratch` from 6a would be a policy change this finding does not call for.
- [ ] Confirm the tree is clean afterwards: `grep -rlF` of the home-directory path over `harness-runs/scratch/` prints nothing.

**Note for the committing role:** every file deleted here is gitignored, so this fix leaves **no tracked diff** and there is nothing to commit. The fix is complete once the files are gone from the working tree. When Phase G re-runs, gate 6a reads that working tree.
