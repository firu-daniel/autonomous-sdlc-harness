### Task 6 — Add `runs.sh` and `grade-plant.sh`: the run readers, the expiry rule, and the JS1, JS4 and RJ2 grades

**Goal:** Read a recorded run the way `docs/sandbox-verification.md` → `## 10.` → **Reading a result.** requires, and grade the three rows planted by pushed commits:
- a row is graded on what the named log line, artifact or ref shows;
- a step that did not run makes its row `not run`;
- an expired artifact is `expired`, never a pass or an absence.

**Depends on:**
- Task 1: `g12_result_line <row> <result> <evidence> [<departure>]` (results `pass` | `fail` | `not run` | `expired` | `source`), `g12_row_names`, `g12_row_field`, `g12_row_arms`, `g12_exit_raise` and `G12_ROWS_SELECTED`.
- Task 2: `G12_ROOT`, `G12_REPO`, `G12_STATE_DIR`, `G12_SCRIPTS_DIR`, `g12_state_get`, and `g12_scratch_dir`, which prints the scratch root `$G12_ROOT/$G12_STATE_DIR/scratch/gate12-sandbox-round` — the one derivation of it; every path below builds on it. The state's `runs[]` items carry `row`, `arm`, `branch` and `run_id`, and `tokens.SB2` holds SB2's token.
- Task 4: the marker string `G12_JS4_MARKER`.
- **This task defines `g12_grade_cmd`**, the `grade` subcommand. One dispatch rule, restated by Tasks 8 and 13:
  - **Without `--full-run`** it calls, each only if defined, `g12_grade_plant` (here) and `g12_grade_state` (Task 7). **`g12_grade_full_run` is never called.** Each FR row (FR1–FR7) that is selected with `--row`, or every FR row when no `--row` is given, prints `not run` with the evidence `needs --full-run <branch>`. These lines never print `fail`, so they never set exit 4 on their own.
  - **With `--full-run <branch>`** (a non-empty branch, else a usage error, exit 1) it calls only `g12_grade_full_run <branch>` (Task 8), when defined, and prints FR1–FR7 only. If `g12_grade_full_run` is not defined, each FR row prints `not run` with `grader not implemented`.
  - **`--full-run` together with `--row`** is a usage error: exit 1, a message on stderr, and no result line.
  - A non-FR row selected with `--row` that has no grader yet prints `not run` with `grader not implemented`.

### Targets

- `scripts/lib/gate12-sandbox-round/runs.sh` (new).
- `scripts/lib/gate12-sandbox-round/grade-plant.sh` (new).

**Work:**

- [ ] Both files open with `#!/usr/bin/env bash` on the first line (`.claude/context/conventions.md` → `## Shell assets`), then a header naming what each owns and the sourced-library rule (no shell option set). `runs.sh` → `g12_run_steps <run_id>`, from `gh run view <id> --repo … --json status,conclusion,jobs`:
  - It prints the `run` job's steps as `<step name>\t<conclusion>`.
  - `g12_step_ran <run_id> <step name>` is true only when the step's conclusion is `success` or `failure`. `skipped`, `cancelled`, absent or a run still in progress is **not run**.
  - `g12_run_done <run_id>` is true when the status is `completed`. A row whose run is not completed prints `not run` with `run <id> is <status>`.
- [ ] `runs.sh` → `g12_step_log <run_id> <step name>`:
  - It splits `gh run view <id> --repo … --log` on its tab-separated `<job>\t<step>\t<line>` form and caches the whole log under `"$(g12_scratch_dir)/runs/<id>/log.txt"`. No path in this file repeats the scratch root's literal.
  - A log `gh` answers as gone (HTTP 410, or a message naming log retention) makes the row `expired`.
- [ ] `runs.sh` → `g12_artifact <run_id>`, from `gh api repos/<repo>/actions/runs/<id>/artifacts`:
  - No `harness-state` artifact prints `none`. `expired: true` prints `expired`.
  - Otherwise it downloads once, with `gh run download <id> --repo … -n harness-state -D "$(g12_scratch_dir)/runs/<id>/harness-state"`, and prints that directory.
  - `g12_evidence <row> <text>` appends the full record to `"$(g12_scratch_dir)/evidence/<row>.log"`, and its path goes into the result line. Rows that pass keep no evidence file — it is written only after the verdict is known — **except** a pass whose evidence is itself a reading, which is kept in full (`harness-runs/lessons.md`: a measurement script stores every reading in full; the result line cuts its evidence at the first newline, Task 1, so it is never the record). The exceptions are exactly: JS4's `Bootstrap the checkout` marker lines (here), and FR2's install-step lines and FR4's denied calls (Task 8). Every other passing row writes no `evidence/<row>.log`.
- [ ] `grade-plant.sh` → JS1. For each arm's run, every check must hold:
  - the run's conclusion is `failure`;
  - `Refuse a branch that changed the job's own files` ran and concluded `failure`;
  - its log carries `::error::` and names the arm's path (`.claude/settings.json`, or `<scriptsDir>/remote-run.sh`);
  - every later step is skipped, `Read the configuration` onwards, since none runs once `SCRIPTS_DIR` is unset (`harness-run.yml` header → THE JOB'S OWN FILES);
  - `g12_artifact` is `none`.

  A later `harness run <branch>` run is **not** a verdict check: JS1's Read from (the refusal step log, the job's conclusion and steps, the run's artifacts and the `remote-run.sh sync` record) names no run listing. The row's *"nothing chained"* clause is graded on what it does name — no `harness-state` artifact, and the no-bundle record below. When a `gh run list` happens to show a later `harness run <branch>` run, it is quoted into the evidence as context only and never moves the verdict.
  
  The no-bundle record is read through `bash <scriptsDir>/remote-run.sh status <branch>`, whose printed state must be `failed` when no older bundle exists.
  - **The line parsed** is the `state: <x>` line `status_from_github` prints (`printf '  state: %s\n' "$RS_STATE"`, after `remote-run.sh: no local record; state from GitHub (newest run):`), which `verb_status` reaches when the branch has no local record — JS1's case, since the refused branch was never synced (`cli/templates/scripts/remote-run.sh`; cite both symbols in a comment). The grader takes the **first** line matching `^[[:space:]]*state:[[:space:]]*` (leading whitespace allowed) and the trimmed rest of it is the state. `verb_status`'s local-record arm prints `  status: <x>`, not `state:`, and is not matched.
  - `state: failed` passes this check. Any other state (e.g. `paused`, `none`) is a `fail`, quoting the line through `g12_evidence JS1`. **No `state:` line at all** is a `fail` with the evidence `remote-run.sh status printed no state`. A non-zero exit of `remote-run.sh status` is a `fail` quoting its output.

  That is a departure, `read through status, not sync: sync refuses a branch with no local record`, citing `remote-run.sh`'s header exit map (exit 2). The two arms are folded into one JS1 line: `fail` if any arm fails; otherwise `expired` or `not run` if any arm is; otherwise `pass`. The evidence names the deciding arm.
- [ ] `grade-plant.sh` → JS4 and RJ2.
  - **JS4**, for each arm: `G12_JS4_MARKER` must be absent from the logs of `Refuse a branch that changed the job's own files`, `Install the claude CLI when absent`, `Generate the job's permission profile` and `Preflight with doctor`. Each of those must have run, or the row is `not run`. A marker line in `Bootstrap the checkout` is the known residual (`docs/cli.md` §6, residual 1), **not** a fail: every such line is written whole through `g12_evidence JS4`, **even when JS4 passes**, and the result line's evidence names that file (`residual: <n> marker line(s) in Bootstrap the checkout, kept in <path>`). With no marker line there, a passing JS4 writes no evidence file.
  - **RJ2**: `Run the harness` must carry `not launching '<branch>': `, and the downloaded `status.json` must have `status` `failed`, for a pass. `job: launching run for '<branch>'` is a `fail`. When `Refuse a branch that changed the job's own files` concluded `failure`, the result is `not run`, with evidence `refused before launch: .claude/settings.autonomous.json is a job surface (writeProtection.ts protectedPaths, PROFILE_PATH)`.
  - Take every log string from the shipped source it is printed by — `spawn_refuse` and `run_job` in `cli/templates/scripts/autonomous-watcher.sh`, the steps in `cli/templates/github/workflows/harness-run.yml` — and cite each one in a comment by symbol.

**Verification:**

- With a stubbed `gh` serving canned `--json` and `--log` answers, a JS1 run shaped as the row expects grades `pass`. The same run with `Read the configuration` concluded `success` grades `fail`. With the refusal step `skipped` it grades `not run`. For RJ2, an artifact answer with `expired: true` grades `expired`, never `fail` or `not run`. With a `remote-run.sh` stub that prints no `state:` line, JS1 grades `fail` with `remote-run.sh status printed no state`.
- A plain `grade` prints FR1–FR7 as `not run` with `needs --full-run <branch>` and calls no `gh run list --branch`; `grade --full-run x --row FR1` exits 1 with no result line.
- `commands.typecheck` passes.
