### Task 8 — Give JS3's plant a one-time silent stall past `STALL_KILL_SECS` through `scratch-run.sh`

**Goal:** In round 14, `gate12-sandbox-round.sh default-branch` ran clean, but the honest JS3 task ran 8 minutes without going 120 s silent, so `grade` printed JS3 `not run` ("no stall happened, so the arm was not exercised"). This task gives JS3's planted task prompt one way to stall that stays inside the job's profile: one allow-listed call, `bash <scriptsDir>/scratch-run.sh <file>`, on a Node scratch file that sleeps silently past the kill threshold, once.

**Where this task stops.** It changes the driver's plant and its header. **Task 9** writes the fixtures in `cli/test/gate12-sandbox-round-default-branch.test.mjs`, and needs the shapes below exactly. **Task 11** restates `docs/development.md` step 8 and JS3's measurement cell. Whether the stall is taken on a runner is owed to the scoped Gate 12 round (story index, manual step 2).

### Targets

- `scripts/lib/gate12-sandbox-round/default-branch.sh`: `g12_js3_files`, the leg's pre-change refusals, and the header.

**The shapes Task 9 tests:**

- `g12_js3_files <branch> <dir>` still writes an empty `manifest` and a `task_prompt.md`. The prompt reads its values from the driver's existing `G12_STATE_DIR`, `G12_SCRIPTS_DIR` and `G12_STALL_KILL_SECS`, and states three steps in order.
  1. Write `<stateDir>/scratch/gate12_js3_stall.mjs` with exactly the given body. The body exits 0 at once when `<stateDir>/scratch/gate12_js3_stalled` exists. Otherwise it creates that marker, then waits `S` seconds with `setTimeout` and prints nothing.
  2. Run `bash <scriptsDir>/scratch-run.sh <stateDir>/scratch/gate12_js3_stall.mjs` once, in the foreground, with the Bash tool's timeout set to `T` milliseconds and nothing appended to the command.
  3. Add the README line the honest prompt asks for today.

  `S = G12_STALL_KILL_SECS + 60` and `T = (S + 60) * 1000`.
- `.sh` is refused by `scratch-run.sh`'s interpreter table (*"THE ONE EXTENSION THIS TABLE OMITS ON PURPOSE IS `.sh`"*), so the file is `.mjs` and runs on `node`.
- **The refusal.** When `T` exceeds the Bash tool's 600000 ms ceiling (that is, `G12_STALL_KILL_SECS > 480`), `default-branch` refuses before any change, through `g12_db_refuse`. Exit 2, naming the stall-kill value and the ceiling.
- **The marker.** It keeps a resumed session from stalling again where the reset keeps `scratch/`. Where it does not, `STALL_MAX_RESTARTS` bounds the repeats, and the header says so.

**Work:**

- [ ] `g12_js3_files`: write the new prompt and leave `manifest` as it is. The Node body is fixed text with `S` and the marker path substituted, and no other value.
- [ ] `g12_default_branch_cmd`'s pre-change refusals: add the `G12_STALL_KILL_SECS > 480` refusal beside the existing four, before the trap and the first change.
- [ ] Header: the `g12_js3_files` line describes the stalling prompt. A paragraph says why the stall is a `scratch-run.sh` call (it is allow-listed and guard-allowed in the job's profile, and an idle `node` process stays under `STALL_BUSY_CPU_PCT`), why `.mjs`, the derived `S` and `T`, the marker, and the new refusal in the *Refusals* list.

**Verification:**

- `bash -n` parses the file.
- Calling `g12_js3_files` by hand with `G12_STATE_DIR=sdlc-harness`, `G12_SCRIPTS_DIR=scripts` and `G12_STALL_KILL_SECS=120` writes a prompt naming `sdlc-harness/scratch/gate12_js3_stall.mjs`, `bash scripts/scratch-run.sh sdlc-harness/scratch/gate12_js3_stall.mjs`, `180` seconds and `240000` ms.
- The written `.mjs` body, saved to a temporary file and run under `node` with a 1-second `S`, exits 0 after about a second and prints nothing. A second run exits at once.

**Deviations from plan:**
- Evidence downgrade, `bash -n`: a bare `bash -n scripts/lib/gate12-sandbox-round/default-branch.sh` was refused by the tool layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The parse claim rests on `bash scripts/typecheck.sh` (the configured `commands.typecheck`), whose `check-shell-parse` leg printed `122 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, then `PASS: typecheck`.
- Evidence downgrade, the by-hand `g12_js3_files` call: the compound command that sources the library with a stubbed `g12_refuse` and calls `g12_js3_files` with `G12_STATE_DIR=sdlc-harness`, `G12_SCRIPTS_DIR=scripts`, `G12_STALL_KILL_SECS=120` was refused by the tool layer with the same message. The claim that the prompt names `sdlc-harness/scratch/gate12_js3_stall.mjs`, `bash scripts/scratch-run.sh sdlc-harness/scratch/gate12_js3_stall.mjs`, `180` seconds and `240000` ms rests on reading `g12_js3_files`'s `printf '%s\n'` lines (`stall_secs=$((G12_STALL_KILL_SECS + 60))`, `timeout_ms=$(((stall_secs + 60) * 1000))`), not on execution. Task 9's fixtures execute it.
- The `.mjs` body check ran as a probe, `bash scripts/scratch-run.sh harness-runs/scratch/task8_js3_body_probe.mjs`, which writes the body as `g12_js3_files` renders it (stateDir `sdlc-harness`, `S` = 1) into a temporary cwd and runs it twice under `node`: `run 1: status=0 ms=1030 stdout="" stderr=""`, `run 2: status=0 ms=43 stdout="" stderr=""`.
- The new refusal runs first in `g12_default_branch_cmd`, ahead of `g12_state_init` rather than after `g12_db_record`, so it touches neither the state file nor GitHub; it is still before the trap and the first change, as the plan asks.
