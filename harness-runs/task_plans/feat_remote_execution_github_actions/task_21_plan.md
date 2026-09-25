### Task 21 — Withhold `remote-run.sh` from the script-allowlist guard and name it in the deny-list prose

**Goal:** Make `remote-run.sh` unreachable as a command an unattended run composes, exactly as `autonomous-watcher.sh` is: it dispatches, continues and cancels runs on GitHub, and an agent that could run it could start runs about itself or cancel the one it is part of.

**Depends on:** Task 5, which added `remote-run.sh` to `OUTER_LOOP_SCRIPTS` with `agentInvocable: false` and whose `outerLoopScripts.ts` comment names this task as the one that adds the deny entry — `agentInvocable: false` alone withholds nothing (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, the *outer-loop script* row). The script's verbs, for the per-entry reason: `dispatch`, `pause`, `warm`, `stop`, `sync`, `status`, `restore`, `save`, `continue`, `poll`, `pause-requested`.

### Targets

- `plugin/hooks/autonomous-script-allowlist-guard.sh` — `DENY_SCRIPT_BASENAMES`, the per-entry reasons block above it, the header's `THE DENY LIST IS THE DEPLOY WRAPPER AND THE OUTER LOOP` paragraph (register row 36), and a `REPRO` entry.
- `plugin/hooks/README.md` — `## The deny list` table and the paragraph after it (register row 23).
- `plugin/agents/task-plan-writer.md` — the **"A missing permission entry is not a human step"** bullet's list of deny-listed basenames (register row 34).

**Work:**

- [ ] Add `remote-run.sh` to `DENY_SCRIPT_BASENAMES` as a bare lower-case basename line, and its reason to the per-entry block: dispatching, continuing, pausing and cancelling remote runs — an agent that could run it could start runs about itself, or stop its own. Update the header paragraph so it names four outer-loop scripts, not three. Leave the `LEFT ALLOWED, DELIBERATELY` list as it is (register row 24).
- [ ] Add a `REPRO` entry to the guard showing `bash <repo>/<scripts_dir>/remote-run.sh dispatch feat_x --engine task` producing no `allow` (silence), and its `REMOTE-RUN.sh` spelling likewise — the case-folding rule applies to every entry.
- [ ] `plugin/hooks/README.md`: a table row `remote-run.sh` | *Sending a remote run's dispatch, continuation, pause or cancellation to GitHub — an agent that could run it could start runs about itself, or stop its own.* Update the following paragraph's count of outer-loop entries.
- [ ] `plugin/agents/task-plan-writer.md`: the parenthesised list of deny-listed basenames gains `remote-run.sh`. Change nothing else in that bullet.

**Verification:**

- Reproduce the new decision by hand per `plugin/hooks/README.md` → `## Reproducing a decision by hand`, against a throwaway `git init` fixture carrying a `harness.config.json`: the guard emits nothing for both spellings of `remote-run.sh`, and still emits `allow` for `bash <repo>/<scripts_dir>/commit-on-branch.sh …`.
- `grep -rn "three outer-loop scripts" plugin/hooks` prints nothing.
- `bash scripts/test.sh` exits 0, which runs gate 1's `--strict` manifest validation among the automatable gates. The re-measurement `docs/guard-verification.md` owes for a guard change is Task 32's.

**Deviations from plan:**

- `plugin/hooks/README.md`: besides the table row and the following paragraph's outer-loop count (three → four), the section's other counts of deny-list entries were updated four → five (the `## Fail closed` section's "four deny-list basenames", "Four entries", and "the four names / the four capabilities"), since each became false with the new row. The guard's fail-closed table row "one of the three outer-loop scripts" was likewise changed to four.
- Verification `bash scripts/test.sh exits 0` is **not met** on execution: it exits 1 with 18 gates passed and 2 failed, neither touched by this diff — gate 6a flags machine paths in an untracked, gitignored `harness-runs/scratch/t3-test.log` left by an earlier task, and gate 11 fails because the docs-retrieval runtime is not installed in this checkout. Gate 1 (manifests) passed. The guard decisions were verified by execution against a throwaway `git init` fixture: both `remote-run.sh` spellings silent, `commit-on-branch.sh` `allow`.
