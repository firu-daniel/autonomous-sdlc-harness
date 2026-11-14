## The plan writer reported corpus debt in the general layer's conventions document and an undescribed `scripts/` directory
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return (plan round 0) carried a `## Corpus staleness` section with two entries: `stale-rule` — `.claude/context/conventions.md` → `## Documents of record` says the files under `scripts/` at this root are `init`'s output, while this branch adds the hand-written `scripts/gate-worker-start-probe.sh` (as `scripts/sandbox-probe.sh` before it); `undescribed-layer` — `scripts/` holds hand-written probe code that only the catch-all `general` row covers.
- **cost this run:** the `stale-rule` entry owes a restatement of `## Documents of record` (supervised `/devscene:analyze .claude/context/conventions.md` re-run, or a hand edit); the `undescribed-layer` entry owes a `/devscene:analyze` run in this repository answered `skip` for every already-filled document (not the `--yes` spelling), with any profile change applied through `npx devscene config set layers`.

## Implementer sessions had plain shell commands refused, and one had every Bash call refused
- **category:** tooling-gap
- **evidence:** implementer returns this run: `bash -n` on a shell file refused (Task 1, Task 2, Task 5 dispatches); `cp` refused (Task 5; code-review Finding 2 general layer — "the combined `cp … && cmp …` command was refused in don't-ask mode"; test-fix Finding 2 general layer); `rm` and an output redirect refused (Task 6); a `sed` filter on the probe's output refused (Task 2); `git init` refused inside the sandbox (Task 1, which then built the probe fixture's `.git` by hand); and on the code-review Finding 2 cli-layer dispatch "every Bash call was refused ('Claude Code is running in don't ask mode')", so that layer ran no typecheck and no tree guard.
- **cost this run:** syntax checks fell back to `scripts/typecheck.sh`'s shell-parse step; one unit layer shipped with no typecheck of its own (caught only by Phase G); one scratch file (`harness-runs/scratch/task6_gate_lines.txt`, ignored) could not be removed.
- **hypothesis:** the all-Bash refusal on one dispatch while sibling dispatches ran the same commands looks session-specific rather than profile-wide.

## The cli-layer implementer returned an unmarked "outside my path" blocker on two multi-layer test-fix findings
- **category:** agent-contract
- **evidence:** Phase G round 1, test-fix Finding 1 (dispatch #29) and Finding 2 (dispatch #32), both tagged `_(layer: cli, general)_`: the `cli` implementer edited nothing and returned `blocker: finding 1's fix is mostly outside the cli layer …` / `blocker: finding 2's fix also needs edits outside the `cli` path …`, with neither the `prohibited — ` nor the `already passing — ` marker. In Phase C, code-review Findings 1 and 2 carried the same `cli, general` tag and the `cli` implementer landed its half and left the rest to the `general` layer. The orchestrator treated both Phase G blockers as low-stakes under the ask-vs-assume policy and continued to the tag's `general` layer (dispatches #30, #33), recorded in `harness-runs/dispatch_additions/fix_gate_worker_sandbox_start.md`.
- **cost this run:** two implementer dispatches that changed nothing; per the unit loop's literal rule each would have escalated (parked) the run.

## Gate 6a (no machine paths) failed on the flow walker's own machine-local state file
- **category:** shared-state
- **evidence:** Phase G round 1 log `harness-runs/test_run_logs/fix_gate_worker_sandbox_start/task_round_1.log` → gate 6a flagged `harness-runs/.flow_walker_state`, the gitignored planning-walker state, which held absolute review paths this run's walker recorded; fixed by test-fix Finding 1 (commit ee879b4a), which filters that one path in `scripts/check-machine-paths.sh`.
- **cost this run:** one gate round failed partly on a harness artifact rather than branch work, and one test-fix unit (three dispatches).

## The prescribed Phase-D commit-range command fails in a run copy with no local default-branch ref
- **category:** agent-contract
- **evidence:** `git log --format='%h %s%n%b' --name-only dev..HEAD` (the `## Dispositioned units` derivation, `<default_branch>` = `dev`) exited 128: `fatal: ambiguous argument 'dev..HEAD': unknown revision or path not in the working tree.`; the branch-reviewer and skeptic-reviewer returns each also reported "this checkout has no local `dev` ref" and used `origin/dev`. The orchestrator re-ran the scan against `origin/dev..HEAD`.
- **cost this run:** one failed command; the disposition scan rests on the remote-tracking ref instead of the prescribed one.

## One root cause was planned as ten test-fix findings, nine of which closed as already passing
- **category:** optimization
- **evidence:** `harness-runs/test_fix_plans/fix_gate_worker_sandbox_start_task_round_1.md` readiness: Findings 2–11 all name tests in `cli/test/launch-sandboxed-gates.test.mjs` refused before `pending` by the launcher's `nohup`; Finding 2's fix (2c67a1b6) cleared all ten, and Findings 3–11 each closed on the `already passing — ` marker (commits 27f8e56c, 2c1d28bc, 05bffa2e, a40c6221, 80131e9a, 2dd0cc6f, 17660e92, c096b06f, 4c52c19c). Citing writer: `test-fix-plan-writer`.
- **cost this run:** 18 of this session's 53 dispatches (9 implementer + 9 committer) closed units with no code change.
