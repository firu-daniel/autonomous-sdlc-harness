### Task 15 — Record F10 and PD25–PD28 as fixed by this branch in `docs/sandbox-verification.md`, restate T3, WF5 and their runner rows, and add the GS rows as owed

**Goal:** `docs/sandbox-verification.md` says what this branch changed for F10 and PD25–PD28. For F10 that is four things: what changed, why the earlier route was rejected, what the launcher's sandbox holds, and that the next Gate 15 container run confirms it. It restates the Check and Expected cells of T3 and WF5, and the Expected cells of `CL5 (Linux)`, `BG9 (runner)` and `WF5 (runner)`, where the mechanism changed. It adds the `gate-sandbox` leg's rows as owed. **No measured result is invented:** every Observed cell, every Verdict cell and every §0 run record stays byte-identical, and no sentence claims the fix works on Linux.

**Depends on:**

- **The design**, the user's ruling, recorded in `harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md` (Q2).
  - **Rejected:** excluding the run copy's `run-test-suite.sh`, because session-written code never runs unsandboxed through an excluded command.
  - **Taken:** route 1, re-sandbox the worker.
  - **Closed:** detaching inside a sandboxed call (BG9, LB5, T3); a call kept alive past the Bash tool's cap or background limit (F6); the nested-sandbox settings.
- **Tasks 1–3: the mechanism.**
  - A new outer-loop script, `launch-sandboxed-gates.sh`, is a `runsUnsandboxed`, agent-invocable row (`cli/src/generators/outerLoopScripts.ts`). So the base profile, every per-run copy and every job carries `bash <main>/<scripts_dir>/launch-sandboxed-gates.sh:*` in `excludedCommands`, and the main checkout's copy is write-protected on both sides.
  - It carries the git wrappers' checks. It answers `in-session` off a bubblewrap host or under the opt-out.
  - On a bubblewrap host it detaches a supervisor (`setsid` when present, `nohup`, `disown`), which runs `bash <target>/<scripts_dir>/run-test-suite.sh --no-detach <label>` under `bwrap`. The sandbox has no network and the target is its only writable root. The session profile's exact protected paths under the target are read-only, an absent one through a `/dev/null` placeholder the supervisor sweeps afterwards. `/tmp` is private, the base profile's credential files are masked, and its token variables are unset.
  - `bwrap` is found on the inherited `PATH`. A missing `bwrap`, or a host refusing unprivileged user namespaces, is a refusal.
- **Tasks 5–6: the spelling.** Phase G's binding `<gate_launcher>` is bound in the autonomous forks to `bash <MAIN_REPO>/<scripts_dir>/launch-sandboxed-gates.sh <repo_root> <label>`, and is `none` in the semi-autonomous ones. G.1 issues it first and branches on its line. A launcher refusal is `<escalate>`, which in an autonomous run parks with the launcher's reason. No gate is reported as passed.
- **Task 8: T3.** It issues the launcher, is `not run` unless it answered `pending`, and its post-session wait stops on a stale heartbeat.
- **Tasks 9–10: the `gate-sandbox` leg**, which is Linux-only and runs in job mode too. Its rows are GS1 (outlives the call and the session, with a verdict), GS2 (writes outside the roots and to `<target>/.git/config` refused on disk; the outside paths are the home directory and the target's parent directory in both layouts, plus the main checkout in the clone layout only, because in job mode the main checkout is the target and the worker's only writable root), GS3 (an outside host returns no body), GS4 (`~/.ssh/config` and the token variables unreadable), and WF5, moved there from `detached`, which now takes BG9 alone.
- **Task 11: the probe defects.**
  - PD25 plants over an empty, regular, non-link `config.worktree` on Linux, with `extensions.worktreeConfig` absent or `false`, exactly `hr_run_copy_check_var`'s inert shape.
  - PD26 takes `hr_placeholder_host_probe_var` in `sp__cs8b_check` before `run_profile_check`.
  - PD27 skips `package.json`, `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock` and `pnpm-lock.yaml` when picking R3's conflict file.
  - PD28: the evidence cannot decide it, the judge's Linux table is unchanged, and on Linux the git leg reads `<clone>/.git/config.lock` before, inside and after the session, appending the readings to CL5's evidence on `File exists`.
- **The tests, by file:**
  - `cli/test/run-test-suite.test.mjs`;
  - `cli/test/launch-sandboxed-gates.test.mjs`;
  - `cli/test/placeholder-sweep-lib.test.mjs`;
  - `cli/test/sandbox-probe-gates-legs.test.mjs`;
  - `cli/test/sandbox-probe-gate-sandbox-legs.test.mjs`;
  - `cli/test/sandbox-probe-planted-legs.test.mjs`;
  - `cli/test/sandbox-probe-invalid-profile.test.mjs`;
  - `cli/test/sandbox-probe-remote-legs.test.mjs`;
  - `cli/test/sandbox-probe-protection-legs.test.mjs`;
  - `cli/test/sandbox-probe-judge.test.mjs`.

  This task cites them and runs none.

**This is a catch-all task** (`path` `"."`). Its implementer reads every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` binds every sentence: a measured fact states what was measured, the command and the exact message.

### Targets

`docs/sandbox-verification.md`, these sites only: the story index's `## Scope register` rows 1–4, 7, 9, 10, 12 and 14.

- the opening **Who reads this:** paragraph;
- §5 F10's Follow-up cell;
- §5 PD25–PD28's Follow-up cells;
- §5 T3's and WF5's Check and Expected cells;
- §8 `CL5 (Linux)`'s Expected cell;
- §8 new rows GS1–GS4;
- §9 `BG9 (runner)`'s and `WF5 (runner)`'s Expected cells;
- §9 new rows `GS1 (runner)`–`GS4 (runner)`.

**Work:**

- [ ] **F10's Follow-up cell.** Replace its last sentence, *"Owed: #232 `sandbox3b1g fix_linux_detached_gate_run`, before the Gate 12 round's full run on a GitHub-hosted runner."*, and keep every earlier sentence. The replacement says, in this order:
  - **Fixed by** `fix_linux_detached_gate_run` (#232), by the user's ruling, route 1: the gate worker is re-sandboxed by a launcher.
  - **What changed.** Cite the mechanism above by name: `launch-sandboxed-gates.sh` and its row; `run-test-suite.sh --no-detach`; `plan_orchestration_instructions_core.md` → `### G.1 Run the gates` and `<gate_launcher>`.
  - **`excludedCommands` was widened,** as the task prompt's constraint requires this row to say: by one entry, the main checkout's write-protected launcher, which runs no byte of the run copy outside its own sandbox. The rejected alternative, excluding the run copy's own `run-test-suite.sh`, and why it was rejected.
  - **What shipped for a host the route cannot use.** `bwrap` missing, or user namespaces refused, is a launcher refusal: Phase G escalates, and an unattended run parks with that reason, never a pass. macOS is unchanged: the launcher answers `in-session` there.
  - **What is owed.** Whether a process detached from an excluded call outlives it on Linux is not measured. GS1 and T3 take it at the next Gate 15 container run, and `GS1 (runner)` takes it on a hosted runner, not yet measured. If they show the supervisor does not outlive the call, the follow-up proposed is that the launcher refuses on every bubblewrap host. That is a proposal, not pending work.
- [ ] **PD25–PD28's Follow-up cells.** In each, replace the *"Owed: #232 … folded in: …"* sentence with *"Fixed by `fix_linux_detached_gate_run` (#232), folded in:"*, then three things: what changed (from **Depends on:** above, PD25's as *"with `extensions.worktreeConfig` absent or `false`"*), the test file and case that covers it, and *"Not yet confirmed by a run; the next Gate 15 container run confirms it."*. **PD28 records the decision instead of a fix:**
  - the evidence cannot decide whether `File exists` is a sandbox refusal, because the record holds the one refusal line and no reading of what was at `.git/config.lock` inside or outside the sandbox, and a lock left by an earlier process in the shared probe clone fits it as well as a mount does;
  - so the shape stays out of the judge's Linux table (`SP__LINUX_SANDBOX_STRINGS` unchanged, pinned by `cli/test/sandbox-probe-judge.test.mjs`);
  - and the git leg now records the three readings, which decide it at the next Gate 15 container run.

  Keep each row's Defect and Rows cells byte-identical.
- [ ] **T3 and WF5 (§5), and the Who-reads-this paragraph.**
  - **T3.** Its Check cell is *"as T2, on Linux, started through Phase G's launcher, `bash <main>/<scripts_dir>/launch-sandboxed-gates.sh <clone> <label>`, and collected with the clone's own `--wait`"*. Its Expected cell is *"as T2, the launcher answering `pending`, and the worker running under the launcher's own sandbox; any other launcher answer is `not run`"*.
  - **WF5.** Its Check and Expected cells move to the `gate-sandbox` leg's worker: `hr_lane_mtime` read through the GNU arm inside the launcher's sandboxed gate worker.
  - Leave every Observed and Verdict cell, and the Stamp lines above the WF and BG tables, byte-identical. BG9's row is not edited: it stays F10's measurement of a sandboxed detach (register row 5).
  - **Who reads this.** The opening paragraph's reader list adds *"the gate launcher `launch-sandboxed-gates.sh` and the sandbox it builds"* beside the three excluded wrappers, and `run-test-suite.sh`'s `--no-detach` form beside its run form.
- [ ] **§8 and §9.**
  - **`CL5 (Linux)`.** Its Expected cell adds: on a `File exists` refusal the row records `.git/config.lock` read before, inside and after the session (§5 PD28).
  - **New §8 rows GS1–GS4.** Append them after LB5, in §8's own columns. Each Check and Expected cell says what Task 9's leg does and grades. GS2's Check cell names its outside paths per layout, as **Depends on:** gives them, and never names the main checkout as an outside path in job mode. Its baseline cell is *"none: the launcher answers `in-session` off a bubblewrap host"*. Its Observed and Verdict cells carry the words §8's other untaken rows carry for *owed*.
  - **`BG9 (runner)`.** Its Expected cell replaces *"A job's gate run detaches this way (§5 F6), so the result bears on every job"* with *"Since `fix_linux_detached_gate_run` a job's gate run on a bubblewrap host runs under the gate launcher's own sandbox instead (`GS1 (runner)`), so this row bears on a job's other detached processes only"*.
  - **`WF5 (runner)`.** Its Expected cell names the launcher's worker in place of BG9's detached process.
  - **New §9 rows `GS1 (runner)`–`GS4 (runner)`.** Append them after `LB5 (runner)`, as `LB5 (runner)` is laid out, with *"not yet measured"* where that row carries it.
  - Keep every baseline and Observed column byte-identical.

**Verification:**

- `git diff -U0 -- docs/sandbox-verification.md` shows hunks only at the sites named under `### Targets`. Re-run the story index's register entry E1 and confirm two things: every changed row is a register row marked `change`, and every row marked `no-change` (BG9, LB5, `LB5 (runner)`, `R3 (Linux)`, `CS14 (Linux)`, `CS8 (Linux)`) is untouched. Re-run entry E2 too: its `docs/sandbox-verification.md` hits are register rows 12, 13 and 80, and only row 12's paragraph differs from `HEAD` (CS3 and CS4 are measured rows this task does not edit).
- For each changed existing row, the Observed and Verdict cells are byte-identical to `HEAD`'s. Compare the row before and after, cell by cell.
- The changed and added text names no new date, run, result line or exit status. No sentence says the fix was observed working.

**Deviations from plan:**

- **The GS rows' owed wording.** No §8 row at `HEAD` is untaken, so no current row carries an owed form to copy. GS1–GS4 take the form §8's rows carried before the first Linux run, read from `git show 87f0beb8:docs/sandbox-verification.md` (W7 (Linux), LB5): Observed `**not yet measured.**`, Verdict `` `not yet measured` ``.
- **A stale sentence outside `### Targets`, left unedited.** §8's *"What this section is."* paragraph still says WF5 and BG9 are taken *"by the `detached` leg"*; WF5 now belongs to the `gate-sandbox` leg. That paragraph is not a register row, so this task leaves it; it needs a register row and an owning task.
- **Verification, how it was run.** The cell-by-cell comparison ran as the probe `harness-runs/scratch/t15_cells.py` through `bash scripts/scratch-run.sh`, comparing against `git show HEAD:docs/sandbox-verification.md`. For every changed existing row the Observed and Verdict cells came back identical, and so did the Defect and Rows cells of F10 and PD25–PD28. BG9, LB5, `LB5 (runner)`, `R3 (Linux)`, `CS14 (Linux)`, `CS8 (Linux)`, CS3 and CS4 came back identical row for row. E2's hits in this file are lines 3, 252 (CS3) and 253 (CS4), and only line 3 differs. The `YYYY-MM-DD` dates on removed and added lines matched one for one in `git diff -U0`.
