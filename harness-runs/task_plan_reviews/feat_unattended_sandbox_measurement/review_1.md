# Task plan review — iteration 1

## Must Fix

1. **Completeness — "a positive control in the same session for every refusal" is not mapped to most refusal rows.** Files: `task_6_plan.md`, `task_7_plan.md`, `task_8_plan.md`, `task_9_plan.md`, `task_11_plan.md`, `task_12_plan.md` (and the story index `## Context`, if the rule is stated once there).
   The prompt's goal item 1 says the probe *"follows §0's method: one exact call per probe, no `; echo $?`, a positive control in the same session for every refusal, and a reading of which layer refused"*. No task, the story index included, states this as a probe-wide rule. Only some legs carry a same-session control: Task 5's TD2 (the explicit `mktemp` form), Task 10's write protection (a new file in `<clone>/.git`, a `dd` on a tracked file), Task 10's CL5 (CS3's git calls), Task 11's N3/N4 (`localhost`), and Task 12's CS8 (a) (the unmodified profile). These refusal rows name no control in their own session:
   - P3, CW2, P1c, CW5 (`task_6_plan.md`);
   - R4 (`task_7_plan.md`);
   - C1, CW3, C2, K2, CW4, CS15 (`task_8_plan.md`);
   - CS12, CS13, CS14 (`task_9_plan.md`);
   - N1, N2, N5, RT1 (`task_11_plan.md`);
   - S1, S2 (`task_12_plan.md`).

   Without a control, a refusal caused by the session itself (a broken launch, a wrapper that refuses everything, a dead proxy) reads as `pass`. For the planted rows the record already shows the control's shape: CW4's Expected cell carries *"Perturbation: remove the key, same call → exit 0 as CW1"* (`docs/sandbox-verification.md` §3).
   **Fix:** State the rule once in the story index `## Context`, and in Task 4 (`sp_session`'s contract): every refusal row's session also issues a positive control, and the row prints `not run`, with the evidence `control did not succeed`, when its control did not succeed. Then name each row's control call in its leg file. Examples:
   - the unplanted call on the same clone, for Tasks 8 and 9;
   - CS4's main-checkout wrapper call, for Task 6's P3/CW2/P1c/CW5;
   - `<main>/scripts/refresh-branch.sh` on the same fixture clone, for Task 7's R4;
   - the `localhost` call, for N1/N2/N5/RT1;
   - a read of a tracked clone file, for S1/S2.

2. **Completeness / internal contradiction — Task 10's protected set does not cover "each base path"** — per-task file `task_10_plan.md`.
   The prompt says *"each protected path the per-run profile names for the probe clone, and each base path, is refused …"*. Task 10 says the set is *"read, never re-derived"* from `run_profile_entries <clone> clone` plus `hr_run_protected_rel_paths <main>`, and its Verification requires it *"never spelled as a literal list"*. `run_profile_entries` (`scripts/autonomous-watcher.sh`, its header) prints only the entries the per-run profile **appends**:
   - the `hr_run_protected_rel_paths` lines, re-rooted at the copy;
   - the clone's `.git` rows;
   - other worktrees' `.git` pointers.

   The base paths sit only in the base profile's `sandbox.filesystem.denyWrite`. The main checkout's live profile carries them:
   - the wrappers and the other `scripts/*.sh`;
   - `scripts/lib`, `githooks` and `.mcp.json`;
   - the `.claude/settings*.json` files;
   - `<main>/.git` and `harness.config.json`;
   - the run registry and `scripts/.git`.

   The same Work bullet also lists `<main>/.git` as a whole, the per-run profile file, the plugin root and the run registry, and neither named reader produces any of these. As written, the implementer can either drop every base path or break the plan's own "never a literal list" check.
   **Fix:** Read the set from the profile the session runs on: `jq -r '.sandbox.filesystem.denyWrite[]' "$SP_RUN_PROFILE"`, which is the base entries plus the per-run appends. Expand each glob entry (`<work_root>/<project>-*/…`) to the probe clone's path, and add the per-run profile file (`SP_RUN_PROFILE`) itself. Use the `permissions.deny` `Edit(…)` entries of the same file for the `Edit`/`Write` half (W6). Restate the Verification grep so it confirms the set is read from `SP_RUN_PROFILE` and is not a literal list.

3. **Undefined rows — CS4's refresh half and R0 have no call and no verdict rule** — per-task file `task_7_plan.md` (and `task_6_plan.md` for CS4's ref check).
   Task 1's leg table gives the `wrappers-refresh` leg the rows `CS4, R0, R1, R2, R3, R4`, and Task 7's Verification says *"CS4's line here measures the refresh half only"*. No Work bullet in Task 7 names CS4, though: it does not say which clone, which call or which judgement produces that line.
   - **CS4.** The record's CS4 (`docs/sandbox-verification.md` → `### The clone layout (owed)`) is commit, push and refresh, in order, in one session on the same `<clone>`, with the Expected *"The clone's and the main checkout's `refs/heads/<branch>` are equal afterwards"*. Task 6 checks neither that equality nor the refresh.
   - **R0.** R0 is *"record whether a refresh … lands or is refused, in fixture (a)'s clone"*, with no expected result and no `pass`/`fail` rule. It is the same command, on the same clone, as R1's call. Run after R1, it is a no-op. Run in R1's session, Task 3's judge would report `(issued 2 times)` and judge only the first.

   **Fix:**
   - **CS4.** In Task 7, state CS4's refresh call exactly. For example, the refresh call is `bash <main>/scripts/refresh-branch.sh <SP_CLONE>`, issued in Task 6's CS4 session after its push. Otherwise, move CS4's refresh call into Task 6, drop CS4 from the `wrappers-refresh` row in Task 1, and add the main-versus-clone `refs/heads/<branch>` equality to CS4's verdict.
   - **R0.** Either state that R0 is reported from R1's single call, with its own verdict rule, or give R0 a distinct clone and an expected result.
   - **Telling the CS4 lines apart.** Say how a reader distinguishes the halves, since `sp_result_line` prints `row="CS4"` on several lines.

## Should Fix

1. **`task_2_plan.md` — the temp area still leaks on a preflight refusal** (iteration 0 Should Fix 1, not addressed and not recorded as rejected). `sp_snapshot_take` creates `SP_TMP` right after check 1, and checks 2–6 can still refuse. `sp_teardown`'s trap is installed only in `sp_setup`. So a refusal at checks 2–6, and every `preflight` run, leaves a `sandbox-probe.*` directory behind. That contradicts Task 1's exit `2` (*"a preflight refusal, nothing created"*). Remove `SP_TMP` on every preflight exit, or take the snapshot after the last refusal. Then extend Task 14's no-leftover assertion to the refusals after the snapshot.
2. **`task_4_plan.md` — two gaps from iteration 0, not addressed.**
   - **The slug source.** Teardown step 3 calls `hr_run_profile_file <slug> <branch>` without saying where `<slug>` comes from. The watcher reads it from `HARNESS_REPO_SLUG`. Either name that source, or delete the path `sp_setup` / `sp_extra_clone` already recorded (`SP_RUN_PROFILE`, `SP_EXTRA_PROFILE`).
   - **The `rm -rf` exception.** `sp_rm_tree`'s `rm -rf` departs from `.claude/context/conventions.md` → `## Shell assets` → *"Never shell out to a recursive removal"*. The argument is sound, and `hr_clone_remove_var` is precedent. But the rule as written is broader than the tree's own practice, so add a `stale-rule` entry for it to `## Corpus staleness`.
3. **`task_13_plan.md` — the precedent citation is still wrong.** *"the form `cli/test/run-analytics.test.mjs` uses for a root-level script"* does not hold. That suite runs `join(dir, SCRIPT)` inside an `init`-adopted fixture (`SCRIPT = join(INIT_SCRIPTS_DIR, 'run-analytics.sh')`), and never runs a script at `WORKSPACE_ROOT`. Cite a suite that does, or state the form without a precedent. `task_15_plan.md`'s *"as Task 13 does"* inherits the error.
4. **`task_15_plan.md` — state the new-row id list inline.** The leg-table case checks *"every row id the story index's new-row table lists"*. A test must never read a `harness-runs/` artifact, so write the ids (P1b, P1c, SR1, SR2, MC1, CS12–CS15, N3–N5, RT1, S4, S5, RS1, HP1) into the case.
5. **`task_9_plan.md` — CS12–CS14 exercise only `commit-on-branch.sh`.** The prompt says *"each wrapper refuses before any git call"*. Add the `push-branch.sh` and `refresh-branch.sh` calls on the planted clone, or state why one wrapper suffices. All three reach `hr_clone_target_check_var` through `hr_wrapper_target_check_var`, which may be the argument.
6. **`task_12_plan.md` — RS1's plant outlives its leg, and its network call may not test the loosening.**
   - The planted `<clone>/.claude/settings.local.json` is only `sp_track`ed, so it stays in `SP_CLONE` while the `credentials` and `invalid-profile` legs run after it. Remove it right after RS1's session.
   - RS1's network call targets *"an unlisted host"*. To test the planted `allowedDomains` entry, the call must target the host that entry adds. State that host.
7. **`task_5_plan.md` / `task_10_plan.md` — W8 is judged on half its sessions.** The record's W8 is *"The `--debug` log of W6's and W7's sessions"*, and the W6–W8 note says *"every session launched with `--debug`"*. Task 5's W7 session takes no `--debug-file`, so Task 10 grades W8 on the write-protection session alone. Pass `--debug-file` to the W7 session and read both logs, or record W8 as covering W6's session only.
8. **`task_16_plan.md` — two gaps in the record edits.**
   - **The intro range.** The clone-layout intro opens *"CS1–CS11 are owed measurements, not results"*. Adding CS12–CS15 under it leaves that range stale, so update the sentence.
   - **The `! bash` command.** The §0 probe paragraph inlines `! bash scripts/sandbox-probe.sh run` in prose. Put it in a fenced block.
9. **`task_17_plan.md` — two gaps in Gate 15.**
   - **The invocations.** The first Work bullet still inlines both invocations in prose, and the fenced block lacks the `! bash` form. That contradicts the task's own Verification (*"Every command … sits in a fenced block, one per line, never inlined"*).
   - **The disagreement rule.** It is still missing (iteration 0 Should Fix 7). The prompt says *"A re-measurement that disagrees with a recorded row is a finding, never a silent overwrite."* Add it to Gate 15's recording sentence and to Task 16's §0 paragraph.
10. **`task_8_plan.md` — CW4's recorded perturbation is not taken.** The record's CW4 Expected cell includes *"Perturbation: remove the key, same call → exit 0 as CW1"*. Either carry that perturbation, which also gives the row its positive control (Must Fix 1), or have the re-targeted row drop it on purpose (Task 16).

## Nice to Have

1. **`task_1_plan.md` — the header's scope sentence is narrower than the plan.** The header says the probe *"changes nothing outside its own temp area, the probe clone and the probe branch"*. Tasks 7–9 create more than that:
   - five more clones, with their registry records and per-run profiles;
   - two more pushed branches (`_cfg`, `_files`);
   - three fixture refs in `<main>`.

   Reword it to "the probe's clones and branches", and name the fixture refs as the one write to `<main>`, as the story index's `Top risks:` already does.
2. **Story index — `## Corpus staleness` sits inside the index** (carried from iteration 0). It is harmless, but it is a second copy of what the writer's return carries.
