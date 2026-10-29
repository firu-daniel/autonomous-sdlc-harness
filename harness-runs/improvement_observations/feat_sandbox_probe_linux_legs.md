## Implementers' `bash -c` / `bash -n` hand checks were refused under the unattended profile
- **category:** tooling-gap
- **evidence:** layer-implementer returns for Tasks 1, 3, 6, 7, 9 and 22 each report the plan's by-hand `bash -c '…'` check (and, for Tasks 3, 6 and 7, a standalone `bash -n` on the edited library) refused with "Permission to use Bash has been denied because Claude Code is running in don't ask mode". Task 5 reports a `SANDBOX_PROBE_UNAME=Linux …` prefixed command and a redirect to `$TMPDIR` refused; Task 11 reports the plan's `sed` + `diff` leg-table check refused. Implementers fell back to `bash scripts/scratch-run.sh` probes under `harness-runs/scratch/` or to reading the code, and recorded evidence downgrades in `harness-runs/task_plans/feat_sandbox_probe_linux_legs/task_<N>_plan.md`. Task 10 reports `scripts/scratch-run.sh` refuses `.sh` files, so its three grading functions went unexecuted until Task 20's suite.
- **cost this run:** 9 of 12 `general`-layer tasks shipped with plan verification steps not run as written; Task 1, 3 and 10 behaviour rested on code reading alone until the `cli` test tasks ran.
- **hypothesis:** the task plans name verification forms the unattended profile does not grant.

## Implementers could not remove their own scratch probe files
- **category:** tooling-gap
- **evidence:** layer-implementer returns for Tasks 4, 7, 8, 9 and 22 each report an `rm` of their throwaway probe under `harness-runs/scratch/` refused (e.g. `harness-runs/scratch/td4_probe.mjs`, `harness-runs/scratch/task8_detached.py`, `harness-runs/scratch/task22_n3_n4.py`); Task 8's return asks the user to delete it.
- **cost this run:** at least 7 probe files left in the gitignored `harness-runs/scratch/` of the run copy.

## task-plan-writer could not read the file defining `doctor` rows A–E
- **category:** tooling-gap
- **evidence:** the first `task-plan-writer` return (dispatch #1) states "I couldn't read the checks file that defines them (permission refused)" and that it reconstructed the rows as DP1–DP7, one per host state the task prompt lists; Tasks 11 and 21 carry those reconstructed rows into `docs/development.md` and `docs/sandbox-verification.md`.
- **cost this run:** DP1–DP7 in Gate 15 and §8 of the record are a reconstruction, not a copy of the `doctor` rows; the writer flagged Tasks 11 and 21 as needing adjustment if A–E differ.

## branch-reviewer's mechanical grep sweep had no regex table to run
- **category:** agent-contract
- **evidence:** the Phase B `branch-reviewer` return (dispatch #57) states "The grep half of the mechanical sweep had nothing to run: its regex table in my definition is still the unedited stub, which is a configuration gap rather than a clean result."
- **cost this run:** the end-of-branch review ran without its mechanical grep sweep.

## The plan reported corpus staleness against `general`'s conventions document
- **category:** tooling-gap
- **evidence:** the first `task-plan-writer` return carried a `## Corpus staleness` section with two entries. `stale-rule`: `.claude/context/conventions.md` → `## Documents of record` says `scripts/` at this root is `init`'s output, but this branch adds hand-written probe libraries under `scripts/lib/sandbox-probe/` (`platform.sh`, `legs-glob.sh`, `legs-registry.sh`, `legs-detached.sh`, `legs-loopback.sh`, `legs-refusal.sh`) that `init` neither writes nor regenerates. `undescribed-layer`: `scripts/lib/sandbox-probe/` (hand-written shell, Bash 3.2 floor, sourced by `scripts/sandbox-probe.sh`) is covered only by the catch-all `general` row.
- **cost this run:** the `stale-rule` owes a follow-up restatement of that rule naming the hand-written measurement tooling under `scripts/` as outside `init`'s set; the `undescribed-layer` owes a `/autonomous-sdlc-harness:harness-analyze` run in a session in this repository, answered `skip` for every already-filled document (not the `--yes` spelling), with any profile change applied through `npx autonomous-sdlc-harness config set layers`.
