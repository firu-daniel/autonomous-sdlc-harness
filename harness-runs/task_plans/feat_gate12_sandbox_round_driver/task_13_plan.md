### Task 13 — Test the adversarial grades: pass, fail, `not run`, `expired` and the hand rows

**Goal:** Hold `grade` (Tasks 6 and 7) to `docs/sandbox-verification.md` → `## 10.` → **Reading a result.**:
- a row is graded on its named log line, artifact or ref;
- a step that did not run is `not run`, never a pass;
- an expired artifact or log is `expired`, never an absence or a pass;
- every hand row is printed `not run` with its reason.

**Depends on:**
- Task 10: `makeGate12Fixture`, `ghStub` and `runRound`.
- Task 6:
  - `grade --repo <slug> [--row <ID>]...` reads the state file's `runs[]`.
  - The result line is `row="<ID>" result="<pass|fail|not run|expired|source>" evidence="…" departure="…"`.
  - Steps are read from `gh run view <id> --json status,conclusion,jobs` and logs from `gh run view <id> --log` (tab-separated `<job>\t<step>\t<line>`).
  - Artifacts come from `gh api repos/<repo>/actions/runs/<id>/artifacts` (`expired`), downloaded with `gh run download <id> -n harness-state -D <dir>`.
  - The JS1 checks: run `failure`, the refusal step `failure` with `::error::` naming the arm's path, every later step skipped, no `harness-state`, and `remote-run.sh status` printing `failed`, recorded as a departure. **The status line format:** the grader parses the first line of `bash <scriptsDir>/remote-run.sh status <branch>`'s output matching `^[[:space:]]*state:[[:space:]]*` (leading whitespace allowed) — the `  state: <x>` line `status_from_github` prints, reached from `verb_status` with no local record (`cli/templates/scripts/remote-run.sh`). `state: failed` passes; any other state is `fail`; no `state:` line at all is `fail` with the evidence `remote-run.sh status printed no state`.
  - The `grade` dispatch: without `--full-run`, Task 8's `g12_grade_full_run` is never called and each FR row (every FR1–FR7 when no `--row` is given) prints `not run` with the evidence `needs --full-run <branch>` — never `fail`, so it never sets exit 4. `--full-run` together with `--row` is a usage error, exit 1, no result line. A later `harness run <branch>` run is evidence only, never a verdict check, because JS1's Read from names no run listing. The two arms are folded into one line.
  - The JS4 checks: no `gate12-js4-marker: loaded` in the four named steps, and a marker in `Bootstrap the checkout` recorded as the residual, not a fail.
  - The evidence-file rule: a passing row writes no `evidence/<row>.log`, **except** a pass whose evidence is a reading kept in full — JS4's `Bootstrap the checkout` marker lines, written whole through `g12_evidence JS4` even on a pass, with the result line's evidence naming that file (and FR2 / FR4, Task 8, outside this suite).
  - The RJ2 checks: `not launching '<branch>': ` plus `status.json` `failed` is a pass; a refusal-step `failure` is `not run`.
- Task 7:
  - SB2 is `not run` at best, or `fail`/`expired`, from the `remote state bundle: skipped <path>: <path> is a symbolic link` line (`hr_remote_copy_tree`, run by `hr_remote_bundle_write` in `cli/templates/scripts/lib/harness-run-lib.sh`) with `<path>` ending in `clarifications/<branch>/gate12-link.md`, no link, no token, and an optional next run.
  - SB4 is `pass`/`fail`/`expired`/`not run` from SB2's artifact.
  - JS3 is graded on the `Run the harness` step log's `stall-watchdog:` lines only, which `check_stalled_runs` (`cli/templates/scripts/autonomous-watcher.sh`) prints through `log`: `pass` on `stall-watchdog: '<b>' -> reset to the last commit and resume (restart #<n>)` with `status.json` `status` not `failed`; `fail` on `stall-watchdog: '<b>' -> failed (… the branch's own commits change a job surface, or that could not be checked …)`, or any other `-> failed (` reason; `not run` with no `stall-watchdog: '<b>'` line. The `stall_job_surfaces_ok` doctor report goes to the per-branch run log (`>>"$log_path" 2>&1`), never the step log, and is evidence only. One `row="JS3" result="source"` line follows, naming `stall_job_surfaces_ok`'s `mktemp -d` / `cd "$scratch"` for the *"from a temporary directory"* clause.
  - The hand rows JS3N, SB3 and RJ3 are `not run` with the evidence `hand step: <note>`. SB4's route is `reads-SB2` (Task 1), so it is printed once, as a graded row, never as a hand row.
  - Evidence goes to `<stateDir>/scratch/gate12-sandbox-round/evidence/<row>.log`, for non-pass rows and for the passing-row exceptions Task 6 names (JS4's residual here).

### Targets

- `cli/test/gate12-sandbox-round-grade.test.mjs` (new).

**Work:**

- [ ] Header, stating the rules above and the canned-answer shape. Take every log string the canned answers carry from the shipped source it is printed by — `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_remote_copy_tree`, for SB2's `remote state bundle: skipped ` prefix and ` is a symbolic link` suffix), `cli/templates/scripts/remote-run.sh` (`verb_restore`, and `status_from_github` for the JS1 stub's `  state: ` line), `cli/templates/scripts/autonomous-watcher.sh` (`spawn_refuse`, `run_job`, and `check_stalled_runs` for JS3's two outcome lines: the fixed substrings `-> reset to the last commit and resume (restart #` and `the branch's own commits change a job surface, or that could not be checked`) and `cli/templates/github/workflows/harness-run.yml`'s step names — reading them out of those files at test time rather than retyping them where a fixed substring can be extracted. State that it reads those fixed files, not a tree.
- [ ] JS1:
  - **Status stub.** Task 10's stub `<scriptsDir>/remote-run.sh` prints nothing. Before grading, the suite overwrites that stub **in the fixture checkout's working tree** (uncommitted, executable, still appending its argv to the log) so that `status <branch>` prints the two lines `status_from_github` prints first — `remote-run.sh: no local record; state from GitHub (newest run):` then `  state: failed` — and exits 0. The `state: ` text is the format above, not retyped from memory: the header cites `status_from_github`'s `printf '  state: %s\n'`.
  - The expected shape on both arms is `pass`.
  - The stub printing `  state: paused` instead makes JS1 `fail`, the evidence naming the state.
  - The stub printing no `state:` line makes JS1 `fail` with the evidence `remote-run.sh status printed no state`.
  - Flipping `Read the configuration` to `success` on one arm makes it `fail`, with the evidence naming that arm.
  - The refusal step `skipped` makes it `not run`.
  - A run whose status is still `in_progress` makes it `not run`.
  - The departure names `remote-run.sh status`.
  - A stubbed later `harness run <branch>` run in the `gh run list` answer leaves the expected shape `pass`: the listing is not in JS1's Read from.
- [ ] JS4 and RJ2:
  - The marker only in `Bootstrap the checkout` is a `pass`; `evidence/JS4.log` exists and holds every planted residual line in full (two marker lines planted in that step, both present verbatim, so a first-newline cut would fail it), and the result line's evidence names that file. The marker in `Preflight with doctor` is a `fail`.
  - RJ2 with a `not launching` line and a `failed` bundle is a `pass`. With the refusal step `failure` it is `not run`, with the job-surface evidence. With `expired: true` on the artifact it is `expired`.
- [ ] SB2, SB4 and JS3:
  - The SB2 expected shape — a save log carrying the `remote state bundle: skipped <path>: <path> is a symbolic link` line for the planted link — is `SB2 not run`, with the arm's outcome in the evidence, plus `SB4 pass`.
  - The same log carrying only a `remote-run.sh: save: skipped <path>: <linked> is a symbolic link` line for the planted path, and no `remote state bundle: skipped` line, makes SB2 `fail`: that form is not what the bundle writer prints for this arm.
  - The token placed in the stub's downloaded artifact makes both `fail`.
  - A link left in the artifact makes SB4 `fail`.
  - A log answered with HTTP 410 makes SB2 `expired`.
  - JS3's canned `Run the harness` step log carries only `[watcher]`-shaped `stall-watchdog:` lines built from those extracted substrings; **the doctor report is never put in the canned step log** (it belongs in the artifact's `run.log`, where the stub may place it as evidence). Cases:
    - no `stall-watchdog:` line is `not run`;
    - the `-> reset to the last commit and resume (restart #1)` line with a `paused` bundle is `pass`, followed by one `JS3 source` line naming `stall_job_surfaces_ok`;
    - the same line with a `failed` bundle is `fail`;
    - the `-> failed (` line carrying the job-surface reason is `fail`;
    - a doctor report placed in the step log with no `stall-watchdog:` line is `not run`, so a grader keyed on the report cannot pass.
- [ ] Hand rows and evidence:
  - `grade --row JS3N --row SB3 --row RJ3` prints three `not run` lines whose evidence starts `hand step: `.
  - A passing row with no evidence-file exception — JS1 at its expected shape — leaves no `evidence/JS1.log` on disk, and a failing one leaves the full record. (JS4's passing residual file is asserted above, not here.)
  - The exit status is 4 whenever any line printed `fail`, and 0 otherwise. Every plain `grade` run in this suite (no `--full-run`) also prints FR1–FR7 as `not run` with `needs --full-run <branch>`; the exit-status assertion counts those lines, which never print `fail`, so an all-pass plain `grade` exits 0. `grade --row FR1` prints one `FR1 not run` line with that evidence, and `grade --full-run x --row FR1` exits 1 with no result line.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-grade.test.mjs` passes. It is this task's own new test file.
