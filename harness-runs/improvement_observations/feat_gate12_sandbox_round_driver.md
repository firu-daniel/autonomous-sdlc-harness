## Plan loop parked at its cap because the architecture gate FAILed with no Must Fix while the writer applies Must Fix only
- **category:** agent-contract
- **evidence:** the walker's saved walk at this session's start printed `binding: <escalate>`, `node: architecture_review`, `reason: cap`, `rounds: architecture_review 2`, `rounds: plan_review 3`. The park's question file records both architecture rounds (`harness-runs/architecture_reviews/feat_gate12_sandbox_round_driver/review_0.md`, `review_1.md`, committed in 6df4c7e0) as `verdict: FAIL`, `must_fix_count: 0`, and the writer's revision 4 as making no edits because its contract applies only Must Fix items. The loop converged in this session only after the answer to that park ("apply all") was appended to the writer's dispatch: architecture PASS on the next round, task-plan review PASS three revisions later.
- **cost this run:** one clarification park and a human answer round-trip before planning could converge.
- **hypothesis:** (guess) a FAIL verdict with `must_fix_count: 0` cannot be cleared by a writer that applies Must Fix only.

## Revision-mode task-plan writer left contradictions it had found in files its findings did not name
- **category:** agent-contract
- **evidence:** this session's writer returns. After `harness-runs/task_plan_reviews/feat_gate12_sandbox_round_driver/review_4.md`: "One stale line in Task 16: line 20 still says evidence is kept only for non-pass rows … I left it because the review did not name that file." After `review_5.md`: the story index's usage line `grade --repo <slug> [--row <ID>]... [--full-run <branch>]` "still reads as if `--row` and `--full-run` can be combined … It should be fixed in a later round."
- **cost this run:** each known contradiction was left for a later review round to catch again rather than fixed when found. The task-plan review passed on its next round (iteration 6), so whether the story index's usage line was ever corrected was not checked.

## An architecture-review fix broke an existing test that the fix unit was not allowed to run
- **category:** silent-failure
- **evidence:** commit 6b8133c5 (Phase A2, Finding 1) made `g12_preflight` source `scripts/lib/harness-run-lib.sh` first. Its implementer ran no test file, since it edited none (`plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 1), and reported only the typecheck pass. The subtest "a copy run from inside the script's own repository" in `cli/test/gate12-sandbox-round-cli.test.mjs` then no longer reached check 2. The Phase B branch review raised this as Must Fix Finding 1 (`harness-runs/code_reviews/feat_gate12_sandbox_round_driver_code_review/finding_1.md`), fixed in 25477629.
- **cost this run:** a committed regression that lived until Phase B, and two extra dispatches (implementer + committer) to repair it.

## Implementers could not remove their scratch probes, and multi-command or `bash -n` checks were refused
- **category:** tooling-gap
- **evidence:** this session's implementer returns. Task 1: "The probe file `harness-runs/scratch/g12_core_probe.py` is still there because the permission layer refused `rm`." Task 2: `harness-runs/scratch/g12_task2_probe.py`, "the command to remove it was refused". Task 8: "I couldn't delete the probe file `harness-runs/scratch/fr_probe.mjs`: the `rm` was refused." Task 3: "I couldn't run that verification as a plain multi-command `bash` call because the session refused it", so it went through `scripts/scratch-run.sh`. Task 9: "A direct `/bin/bash -n` on it was refused." Finding 3 (Phase C): "a separate `bash -n` syntax check and a `--help` run of the script were refused".
- **cost this run:** gitignored probe files left under `harness-runs/scratch/` in the run copy, and verification routed through throwaway scripts instead of direct commands.

## The unit-level typecheck does not parse a new, still-untracked shell script
- **category:** tooling-gap
- **evidence:** the Task 9 implementer return: `bash scripts/typecheck.sh` printed `check-shell-parse: 121 files checked … 0 failed`, but "That parse step only covers files git tracks, and `teardown.sh` is still untracked", and the direct `/bin/bash -n` fallback was refused. The parse claim for `scripts/lib/gate12-sandbox-round/teardown.sh` rested on a probe run until Phase G's whole-tree run (round 1 `pass`).
- **cost this run:** a new library file committed without a unit-level parse check.

## The plan needed 8 review rounds before it converged
- **category:** optimization
- **evidence:** convergence-churn trip-wire on the plan unit. Round artifacts across the planning roots: `harness-runs/task_plan_reviews/feat_gate12_sandbox_round_driver/review_0.md` … `review_5.md` (6) plus `harness-runs/architecture_reviews/feat_gate12_sandbox_round_driver/review_0.md`, `review_1.md` (2), for 8 in total. The business-parity root is absent (`phases.parity` is `false`). Rounds that passed wrote no file and are not counted. The net-new vs re-raised split is unmeasurable here: these files list findings under `## Must Fix` / `## Should Fix` / `## Nice to Have` without per-finding headings, and the narrow Phase-D exception permits headings only.
- **cost this run:** 8 failing review rounds across two sessions, one clarification park among them.
