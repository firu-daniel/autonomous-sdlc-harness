# Task plan review — iteration 1

## Must Fix

1. **Register row 35's `no-change` is wrong: `docs/cli.md` §7 quotes the doctor sentence Task 3 rewrites** — Index structure (`fix_linux_detached_gate_run_story_plan.md`, `## Scope register` row 35), with `task_16_plan.md`
   Row 35 sets `docs/cli.md` → §7 *"`profile-sandbox` is a warning without `--remote-job`"* to `no-change`, with the reason *"grading is unchanged"*. But that bullet does more than describe grading. It quotes `SANDBOXED_WRAPPER_CONSEQUENCE` word for word: *"a missing one is named with what its absence costs on every count, that wrapper running sandboxed where a clone cannot move the main checkout's branch because the profile write-denies the main checkout's whole `.git`, and a linked worktree's git record and an SSH remote are both out of reach on macOS"*. Task 3 rewrites that constant because *"its claim … is false for the launcher"* (`task_3_plan.md`, the **`doctor`'s consequence sentence** bullet). Once Task 3 lands, the §7 bullet states the old consequence for every `runsUnsandboxed` entry, the launcher's included, and nothing in the plan updates it. This is disposition (iii): the site is already a row, but its disposition and reason are wrong. No `## Rejected findings` entry covers it.
   **Fix:** In the story index, change row 35 to `change`, owned by Task 16, with a reason that names the quoted consequence. In `task_16_plan.md`:
   - add the §7 `profile-sandbox` bullet to `### Targets`;
   - add a `**Work:**` clause that restates the quoted consequence so it matches Task 3's reworded `SANDBOXED_WRAPPER_CONSEQUENCE`. Restate Task 3's new wording in Task 16's `**Depends on:**`, so the implementer does not need `task_3_plan.md`;
   - keep the `**Verification:**` hunk check in line with the new site.
   Task 16 is the only task that edits `docs/cli.md`, so it owns this site. Keep it within 20 points and 5 `**Work:**` bullets. Folding the clause into the existing §6 bullet is one way to do that.

2. **The register's statement-of-the-excluded-set class misses sites; E2 is too narrow** — Index structure (`fix_linux_detached_gate_run_story_plan.md`, `## Scope register`)
   One of the register's own candidate classes is *"states the excluded set"*, and E2 (`git grep -n -F 'three excluded wrappers' …`) is the only entry for it. The wider command below reaches these sites, none of which is a register row, and no other entry E1–E8 reaches any of them:
   - `docs/cli.md` → **"The excluded rule's `:*` accepts any argument, so all three wrappers check their target before any git call"**. This is the paragraph Task 16's new §6 passage points to (*"it checks its target exactly as the wrappers do (the next paragraph)"*). It names the excluded set as three, and its check is described as coming *"before any git call"*, but the launcher runs none.
   - `docs/cli.md` → **"Credentials are denied on both sides."**, which says *"That block reaches sandboxed Bash commands only, which is also why the excluded wrappers keep the environment an HTTPS push needs"*. The launcher is now an excluded command that keeps that environment too, and it re-masks the environment for its worker (Task 2, the argument vector's steps 3–4).
   - `cli/templates/claude/settings.autonomous.json` → the `_README` string opening `CREDENTIALS ARE DENIED ON BOTH SIDES` (*"so the excluded wrappers above keep the environment an HTTPS push needs"*). Its template copy has a live counterpart, the next item.
   - `examples/notes-app/.claude/settings.autonomous.json` → the same `CREDENTIALS ARE DENIED ON BOTH SIDES` string, in the `notes-app` copy.
   - `docs/watcher.md` → **"Not read."** (*"The excluded wrappers place the main checkout from their own location through `hr_wrapper_main_of`"*).
   - `docs/sandbox-verification.md` → §2 row CS3. The command reaches it through *"excluded wrappers"*.
   - `examples/notes-app/README.md` → the frozen-capture list's *"the three wrappers under `scripts/`"*.

   This is disposition (ii): one finding for every site the wider entry newly reaches. Some may correctly take `no-change`, but each needs a row and a reason.
   **Fix:** In the story index's `## Scope register`, replace E2 with this wider command, or add it beside E2. It is read-only, and it was executed for this review:
   `git grep -n -i -E 'three (excluded )?wrappers|excluded wrappers|THREE COMMANDS RUN OUTSIDE' -- docs README.md ARCHITECTURE.md plugin cli/README.md cli/templates examples/notes-app/README.md examples/notes-app/.claude/settings.autonomous.json ':!docs/work-report-research'`
   Add one row per site above, one per copy for the template and `notes-app` pair, each with its disposition. A site that gets `change` goes into the owning task's `### Targets` and `**Work:**`, within that task's ceiling:
   - `docs/cli.md` → Task 16;
   - the template `_README` → Task 3;
   - the `notes-app` profile and README → Task 18;
   - `docs/watcher.md` → Task 17;
   - `docs/sandbox-verification.md` → Task 15.
   Re-run every derivation entry afterwards and confirm the closure invariant.

3. **GS2 fails by construction in job mode: its "main checkout" outside path lies inside the target there** — `task_9_plan.md`
   Task 9 runs the `gate-sandbox` leg in job mode too, and says *"the target is `SP_CLONE`, which job mode sets to the checkout itself"*. That is confirmed: `scripts/lib/sandbox-probe/job.sh` sets `SP_CLONE="$SP_MAIN"`. GS2's script writes `<the main checkout>/sbx_gs2_main.txt` as one of its outside paths, and `sp__gs2_grade` fails the row when *"any outside path exists"*. In job mode the main checkout is the target. The launcher's vector (Task 2, step 1) binds the target writable with `--bind <target> <target>`, so that write lands and GS2 reads `fail` even when the sandbox holds exactly as designed. This is a false failure in the mode the story names as the real job's arm. The same assumption sits in the pre-check (step 1 of `sp_leg_gate_sandbox`) and in the cleanup (step 9).
   **Fix:** In `task_9_plan.md`, choose GS2's outside paths so that each lies outside the target in both layouts, for example a file in the target's parent directory. Or state that the main-checkout path is dropped when the target is the main checkout, and say which path replaces it. Update the pre-check, the cleanup and the `sp__gs2_grade` evidence to match, and give the per-layout path list in the **GS2** step. Then restate the changed contract in `task_13_plan.md`'s **Depends on:** and GS2 cases, including one case shaped for job mode. Restate it also in `task_10_plan.md`'s `gate-sandbox` expectation text and in `task_15_plan.md`'s GS2 row text wherever they name the outside paths.

4. **GS's worker script records only each step's first stderr line, which repeats a ledger lesson** — `task_9_plan.md`
   `harness-runs/lessons.md` → `## Evidence and measurement`: *"**A measurement script stores and reports every reading in full; truncation belongs to a display, never to the record a verdict is read from.**"* _(taught by: fix_linux_sandbox_sibling_glob_trio)_. Task 9's `sp__gs_test_script` bullet says *"Every step's exit status and first stderr line are recorded under `<records dir>`"*. The records directory is the record that GS1–GS4 and WF5 are graded from and quoted from. The `sp__gs3_grade` pass evidence quotes *"its stderr line"*. So the stored reading is cut to one line at the source.
   **Fix:** In `task_9_plan.md`, have the script store each step's whole stderr, and stdout where the step produces any, in its own file under `<records dir>` beside its exit status. Have the grading functions quote from those files, with any shortening done only in the evidence sentence and stated as display. Update `task_13_plan.md`'s restated `sp__gs_test_script` contract and its GS3 case to match.

## Should Fix

1. **"It reads no environment variable for a trust decision" overstates what the launcher does** — `fix_linux_detached_gate_run_story_plan.md` (`## Context`) and `task_2_plan.md`
   The launcher chooses the per-run profile through `hr_run_profile_file`, which uses `hr_lane_dir` and so reads `XDG_STATE_HOME` / `HOME`. It reads `~/` as `$HOME/` when it masks credentials, and it resolves `bwrap` and `setsid` through `PATH`. Each of these widens the worker's sandbox if an assignment prefix can set it. The reason that cannot happen is measured, not structural: an assignment-prefixed call does not match the `excludedCommands` entry and stays sandboxed (`docs/sandbox-verification.md` P1b, runs 2 and 3, macOS, Claude Code 2.1.311/2.1.312). Inside Claude Code's sandbox the launcher's own preflight would then refuse. **Fix:** State those environment reads and that measured ground, with its platform. Don't claim that no environment variable is read. Note that P1b is a macOS row, so Linux's matching is owed to Gate 15 like the rest.

2. **The semi-autonomous `<gate_launcher>` reason claims more than is known** — `task_6_plan.md`
   The row says the run form's detached worker *"outlives its call on every host"*. That holds only for sessions with no sandbox. A user whose own settings turn the sandbox on under Linux meets F10 in a semi-autonomous flow too. **Fix:** Limit the reason to what `init` writes for that flow, namely no sandbox block, and drop *"on every host"*.

## Nice to Have

1. The catch-all `general` tasks are not last: Tasks 7–11 come before the `cli` Tasks 12–14. The index argues this from dependency order, since the tests follow the probe code they test, and every `**Depends on:**` points to an earlier task, so it is not raised as a finding.
