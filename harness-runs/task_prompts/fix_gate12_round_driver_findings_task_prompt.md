`fix_gate12_round_driver_findings` fixes three defects that the first real use of `scripts/gate12-sandbox-round.sh` (#251, merged as #255) found. That was Gate 12 round 13, on `firu-daniel/harness-gate12`, on 2026-11-05. One defect stops the driver from starting at all for an operator with an SSH host alias. The other two make it misgrade a row: FR3 passes a run whose pushes were refused, and FR6 fails a park that had nothing to restore. The script is hand-run and not shipped, so this branch does not have to be in a release. But the Gate 12 redo needs it, so it lands before that redo.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `scripts/gate12-sandbox-round.sh`: its header and exit map.
- `scripts/lib/gate12-sandbox-round/preflight.sh`: check 5, the raw `remote.origin.url` match.
- `scripts/lib/gate12-sandbox-round/grade-full-run.sh` → `g12_fr3_arm`, `g12_fr3`, and the FR6 grading. Then `cli/templates/scripts/remote-run.sh` → `restore`, where the `placed <n> planning file(s)` line is printed only when `PLACED + KEPT` is non-zero, and `push-branch.sh`'s header, **EVERY FAILURE PATH IS NON-FATAL (exit 0)**.
- `cli/test/gate12-sandbox-round-*.test.mjs` and `cli/test/helpers/gate12-round.mjs`.
- `docs/development.md` → Gate 12 → observation **(xvi)**, its FR3 and FR6 items. Then `docs/sandbox-verification.md` §10, FR3 and FR6.

## What was measured (2026-11-05, verbatim)

1. **Preflight refuses an SSH host-alias origin.** `grade --repo firu-daniel/harness-gate12 --full-run feat_money_split`, run from the Gate 12 checkout, exited 2:

   ```
   gate12-sandbox-round: refusing to start: remote.origin.url 'git@github-firu:firu-daniel/harness-gate12.git' is not a github.com https or git@ URL
   ```

   `github-firu` is a `~/.ssh/config` host alias for `github.com`, which this repository's operator uses for the account that owns the Gate 12 repository. It was worked around in that checkout with `git config url.git@github-firu:.insteadOf git@github.com:` plus `remote.origin.url git@github.com:firu-daniel/harness-gate12.git`.
2. **FR3 graded `pass` on refused pushes.**

   ```
   row="FR3" result="pass" evidence="run 41980764647: job: parked stop; run 41981613528: job: completed stop"
   ```

   Both jobs' `Push the branch` logged `push-branch.sh: refusing to push: …/.git/config.worktree sets core.sparsecheckout, …`. The session's ledger commit was refused by `commit-on-branch.sh` (#260, sandbox3b5). `g12_fr3_arm` fails a job only on a `job: failed …` line or on a `Push the branch` conclusion of `failure`. But `push-branch.sh` exits 0 on every refusal, so the step concludes `success`.
3. **FR6 graded `fail` on a zero-plan park.**

   ```
   row="FR6" result="fail" evidence="restore: Restore the previous job's state in run 41981613528 carries no placed <n> planning file(s) line"
   ```

   The park was the task-plan writer's question, raised before any plan file existed, which is (xvi)'s own scenario. Both halves held: `saved the bundle of feat_money_split into …` with no `skipped` line, and then `restored the bundle of run 41980764647 into …` and `wrote answer_1.md for feat_money_split`.

The 84-case suite passed throughout. Its fixtures carry neither a refusal line nor a zero-plan restore.

## The findings this branch fixes

1. **Accept an SSH host alias for github.com.** Accept `git@<alias>:<o>/<n>[.git]` when `ssh -G <alias>` resolves `hostname github.com`. Or compare only the `<o>/<n>` the URL names with `--repo` and let git resolve the transport. The plan picks one and keeps the check's purpose: never act on a repository other than `--repo`. Add cases for an alias that resolves to github.com (accepted) and one that does not (refused).
2. **FR3 fails on a wrapper refusal.** Fail the arm on a `push-branch.sh: refusing to push:` line in `Push the branch`, and on a `commit-on-branch.sh: refusing to commit:` line in `Run the harness`, quoting the line as evidence. Add a case replaying round 13's two jobs, which must grade `fail`.
3. **FR6 grades the `placed` clause only where a planning file was saved.** When the parked job's bundle holds no planning file, print that clause as context: `placed: none to place, the park preceded any plan file`. Grade FR6 on the save and restore lines. Align the FR6 text in `docs/development.md` (xvi) and `docs/sandbox-verification.md` §10. Add a case replaying round 13's restore, which must grade `pass`.

## The goal

1. The driver starts from a checkout whose origin is an SSH host alias for github.com, and still refuses any other repository.
2. FR3 and FR6 grade round 13's logs as `fail` and `pass` respectively, each pinned by a fixture.
3. The `--list` table in `docs/development.md` is unchanged unless a row's note changes, and it is re-derived from `--list` if one does.

## Constraints

- The driver stays hand-run, never runs in this repository, and records no result.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
