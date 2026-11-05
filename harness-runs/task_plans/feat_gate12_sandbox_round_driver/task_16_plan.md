### Task 16 — Give round steps 6, 7 and 8 and observation (xvi) the script's commands, and say why each hand step stays

**Goal:** The gate names the script. In `docs/development.md` → **Gate 12**:
- **The sandbox series round (#170 step 4) — not yet run.** steps 6, 7 and 8, and observation **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.**, give `scripts/gate12-sandbox-round.sh`'s commands beside the hand steps they replace;
- a hand step stays wherever the script cannot take its row, with the reason;
- the round's row table is restated from `--list`.

No row of `docs/sandbox-verification.md` changes. Every row stays *not yet measured*.

**Depends on:** Tasks 1–9, which ship the script. This task restates and changes none of it. The facts it writes from:

- **Commands**, each run from the Gate 12 repository's root and naming it:
  - `bash <this repository>/scripts/gate12-sandbox-round.sh plant --repo <owner>/<scratch-repo>` (step 7);
  - `… grade --repo … [--row <ID>]...` (after the jobs end);
  - `… grade --repo … --full-run <branch>` (step 6, after the hand-driven run reaches "branch ready for review");
  - `… default-branch --repo … [--other-branch <name>]` (step 8);
  - `… teardown --repo …` (step 10's branch deletion and the default-branch confirmation; the reset to the seed stays by hand).
- **The result line**: `row="<ID>" result="pass|fail|not run|expired|source" evidence="…" departure="…"`.
- **Exit codes**: 0, 1 usage, 2 refusal, 3 `gh`/`git`, 4 a `fail`, 5 a restore or removal left something.
- **Evidence** is kept for non-pass rows under `<stateDir>/scratch/gate12-sandbox-round/evidence/` in the Gate 12 repository. The state file is beside it.
- **`--list`** prints `<row> <round step> <route> <arms> <note>` for FR1–FR7, JS1, JS4, SB2, SB4, RJ2, JS3, JS3N, SB3 and RJ3. The routes (Task 1) are FR1–FR7 `full-run`; JS1, JS4, SB2 and RJ2 `plant`; **SB4 `reads-SB2`** (no plant of its own; `grade` reads SB2's planted job's artifact); JS3 `default-branch`; JS3N, SB3 and RJ3 `hand`.
- **Rows with no route, and why** — the story index's route table, citing by symbol:
  - SB2's `PAUSE_PROGRESS.md` arm: the row's link points at a token file, a regular file, and `run_job`'s `[ -f "$state_abs/$HR_REMOTE_PAUSE_FILE" ]` follows a link, so on a `resume none` launch the committed link is moved aside through `hr_remote_move_aside` into `autonomous_logs/remote_superseded/`, which the bundle does not carry (`autonomous-watcher.sh` header → *"THE PAUSE NOTE belongs to the run that wrote it"*); and the session has no `ln` in its profile's `permissions.allow`. Say that the claim is for the row's own link target: a dangling link, or a link to a directory, fails `-f` and is not moved aside, which the row does not plant and Task 18's prompt leaves to the follow-up.
  - SB2's `remote_status.json` variant: the watcher's last write, `hr_remote_status_write`'s `mv`, replaces the path.
  - SB3: `harness.config.json` is a write-protected path (`writeProtection.ts` → `protectedPaths`, `CONFIG_FILENAME`), and a committed rewrite is a job surface.
  - JS3N: every job surface is write-protected in the session (`jobSurfacePaths` from `placeholderProtectedPaths`).
  - SB4's optional half stays a hand step as the row states.
  - RJ3 and the three `sandbox1h` checks stay hand steps.
- **RJ2's refusal before launch, settled from the source**: `.claude/settings.autonomous.json` is itself a job surface (`protectedPaths` carries `join(repoRoot, PROFILE_PATH)`, and `jobSurfacePaths` keeps every checkout-relative entry), so `Refuse a branch that changed the job's own files` refuses the planted branch before the launch check. The grade prints `not run` with that evidence, and RJ2's launch-check clause has no route through the shipped workflow; it is one of the rows Task 18's prompt carries.
- **The routes taken**: the JS3 stall values travel as the repository variables `STALL_WARN_SECS` / `STALL_KILL_SECS`, which the `run` job's `env:` reads, and the default branch is fixed at dispatch through `HARNESS_GITHUB_DEFAULT_BRANCH`.

### Targets

- `docs/development.md` — the round's steps 6, 7 and 8, and observation (xvi). No other section.

**Work:**

- [ ] **Step 6:** add the `grade --full-run` command, in its own fenced block, after the hand-driven run reaches "branch ready for review", stating that the run itself stays driven by hand.
- [ ] **Step 7:** replace the bare row list with:
  - the `plant` command and the `grade` command, each in its own fenced block, one command per line (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*);
  - one sentence per arm planted;
  - a hand-step paragraph naming SB2's two unplanted halves, SB3 and SB4's optional half, each with the reason above, and a sentence that SB4's bundle half is graded from SB2's planted job;
  - RJ2's refusal before launch, as settled above.
  
  Name `teardown` as the command step 10 uses to delete the branches.
- [ ] **Step 8:**
  - Give the `default-branch` command in a fenced block. Keep the step's existing hand commands, labelled as what the command runs, so a reader can still take the step by hand.
  - State that it restores the default branch and both stall variables on every exit path, an interrupt included, keeps `<other branch>` for `teardown`, and refuses while a planted run is in flight.
  - Name JS3N as a hand step, with the reason.
  - Under the steps, restate `--list` as a Markdown table `| Row | Round step | Taken by | Note |`, one row per table line, where *Taken by* maps the route: `full-run` → `grade --full-run`, `plant` → `plant`, `reads-SB2` → `grade (SB2's run)`, `default-branch` → `default-branch`, `hand` → `hand`. Say that it is restated from `bash scripts/gate12-sandbox-round.sh --list` and is re-derived from there when that table changes, as Gate 15 does for the probe.
- [ ] **Observation (xvi)**: after the existing `gh run …` / `git show …` block, add the `grade --full-run <branch>` command in its own fenced block. State that it grades FR1–FR7 on the reads listed under **What it shows.**, and prints FR1's `--settings` clause as `source` rather than grading it.
- [ ] Add nothing as a measured result. Leave **Departures.**, **The owed checks.**, **Where its results go.** and `docs/sandbox-verification.md` untouched. The hand-step reasons describe the shipped sources; they propose no change, because the follow-up is Task 18's prompt and is cited by its path, not described as pending work (`harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer"*).

**Verification:**

- Every command added sits in a fenced block on its own line, and each names `--repo`.
- `git diff --stat` touches `docs/development.md` only, and a grep of the diff for `not yet measured` shows no removed occurrence.
- The restated table has one body row per `--list` line, in `--list`'s order. Task 17's test holds it there.
  - **Deviations from plan:** The `--list` table sits after step 10, as its own unindented paragraph headed **The rows the driver takes, and how.**, before **The owed checks.** — not inside step 8's list item, where it would split the numbered list; it is still inside **The sandbox series round (#170 step 4) — not yet run.**, where Task 17 locates it by its header line. The `teardown` command's fenced block sits in step 7, which names it as step 10's command, because step 10 is outside this task's targets. Table order and cells were checked against `bash scripts/gate12-sandbox-round.sh --list` by a scratch probe (`harness-runs/scratch/task16_table_check.mjs`, run through `scripts/scratch-run.sh`): `OK 16 rows`. The `not yet measured` check ran over `git diff -U0` written to `harness-runs/scratch/task16.diff`: 0 removed occurrences.
