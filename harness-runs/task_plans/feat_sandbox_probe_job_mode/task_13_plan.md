### Task 13 — Take L1 in job mode on the checkout's own `HEAD`

**Goal:** `docs/sandbox-verification.md` → §3 row L1 is *`push-branch.sh` on a worktree whose branch is `-sbxdash`*, expected *refused*. On the clone layout it is unreachable. `sp__pf_l1` in `scripts/lib/sandbox-probe/legs-planted-files.sh` prints it `not run`: the clone arm (`hr_clone_target_check_var`) looks up the run registry by the branch `HEAD` names, before the dash check. The prompt asks whether L1 becomes reachable where the target is the checkout itself, and to take it only if so.

**The reading.** In `cli/templates/scripts/push-branch.sh`, a main-checkout target passes, in order:

1. `hr_wrapper_target_check_var`;
2. `hr_worktree_config_check_var` (the clone arm is skipped, because `HR_TARGET_KIND` is not `clone`);
3. `hr_pinned_hooks_path`;
4. `hr_wrapper_branch_var`, which reads `HEAD`.

Then comes the dash check (*"branch '$branch' starts with '-', which git would read as an option — refusing to push"*). None of these looks the branch up in the run registry. So in job mode L1 is reachable by pointing the checkout's own `HEAD` at `refs/heads/-sbxdash`, and this task takes it. Task 21 checks this reading on a fixture, outside any session. If something other than the dash check answers there or on the runner, `sp__pf_l1_grade`'s last arm prints L1 `not run`, naming what answered.

**Depends on:**

- **Task 1:** `planted-files`' job row `L1`, `SP_JOB_MODE`, and `sp_job_skip_clone_rows <leg>`, which prints CS12, CS13, CS14 and L2 `not run`, *clone layout only*, in job mode.
- **Task 2:** `sp_job_git_note`, appended to L1's evidence. In job mode `SP_CLONE` and `SP_MAIN` are the checkout, its `HEAD` is the probe branch `SP_BRANCH`, and `SP_SCRIPTS` is its scripts directory.

It reuses, unchanged:

- `session.sh` → `sp_restore_register <function> <arg>` and `sp_restore_clear`, the one pending-restore slot `sp_teardown` runs on every exit path. No other job leg uses it: `registry`'s RG3 is not a job leg.
- `sp_session`, `sp_prompt_*`, `sp_departures`, `sp_ctl_*`, `sp_row_result`, `sp_judge_call`, `sp__message_line`, `sp_remote_tip`.

**Where this task stops.** It edits `legs-planted-files.sh` only. Outside job mode L1's line is byte-for-byte today's. Tests, including the reachability fixture, are Task 21's.

### Targets

- `scripts/lib/sandbox-probe/legs-planted-files.sh`

**Work:**

- [ ] **`sp__pf_l1_restore <head ref>`.** One argument, because `sp_restore_register`'s slot carries exactly one; the rest it reads from two leg-scoped globals the leg sets before registering it: `SP_PF_L1_COMMIT`, the commit the probe gave the local ref, and `SP_PF_L1_REMOTE_ABSENT`, `1` when step 1 found no `-sbxdash` on origin. In order:
  1. it puts the checkout's `HEAD` back with `git -C "$SP_MAIN" symbolic-ref HEAD <head ref>`;
  2. it deletes the local `refs/heads/-sbxdash` with `git -C "$SP_MAIN" update-ref -d refs/heads/-sbxdash`, only when that ref points at `SP_PF_L1_COMMIT`;
  3. **the remote ref.** L1's call is `push-branch.sh`, which `excludedCommands` runs outside the sandbox, so on the `fail` arm the push lands on origin. When `SP_PF_L1_REMOTE_ABSENT` is `1` and `sp_remote_tip -sbxdash` now equals `SP_PF_L1_COMMIT`, it deletes it with `git -C "$SP_MAIN" push origin :refs/heads/-sbxdash` — the refspec form, because a dash-leading name cannot go through `--delete`. A remote ref present before step 1, or whose tip is any other commit, is never touched.

  It is idempotent. It returns 1, naming what is left and the hand command (for the remote ref, `git -C <checkout> push origin :refs/heads/-sbxdash`), when any step fails. This honours the ledger rule *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create."*
- [ ] **`sp__pf_l1_grade <stream> <command> <remote dash ref before> <remote dash ref after>`** sets `SP_VERDICT` and `SP_EVIDENCE`:
  - the call refused at the permission layer, or absent → `not run`;
  - the result carries `starts with '-', which git would read as an option — refusing to push` and the remote `-sbxdash` ref is absent both before and after → `pass`, quoting the line;
  - the remote ref appeared → `fail`, *the push landed*;
  - any other message → `not run`, *unreachable in job mode: <message line>*, the line taken through `sp__message_line`.
- [ ] **`sp_leg_planted_files` in job mode.** First `sp_job_skip_clone_rows planted-files`. Then, from outside the sandbox:
  1. Refuse to act, printing L1 `not run`, when `refs/heads/-sbxdash` already exists locally or on origin. Having passed this, set `SP_PF_L1_REMOTE_ABSENT=1`.
  2. Record `HEAD`'s symbolic ref, and set `SP_PF_L1_COMMIT` to `HEAD`'s commit.
  3. `sp_restore_register sp__pf_l1_restore <recorded ref>` — **before** any ref or `HEAD` change and before the session, so an interrupted run removes the local and the remote `-sbxdash` too.
  4. `git -C "$SP_MAIN" update-ref refs/heads/-sbxdash "$SP_PF_L1_COMMIT"`, then `git -C "$SP_MAIN" symbolic-ref HEAD refs/heads/-sbxdash`.
- [ ] **The session** `planted-files-l1`, on `SP_RUN_PROFILE`, cwd `SP_CLONE`. It issues one exact call, `bash <checkout>/<scriptsDir>/push-branch.sh <checkout>`, through its own `--allowed "Bash(<that exact call>)"` rule (PD17), then the `written` `dd` control with `SP_DD_RULE`. Read `sp_remote_tip` for `-sbxdash` before and after. Restore at once through `sp__pf_l1_restore`, then `sp_restore_clear`. Grade, append `sp_job_git_note`, and print L1 through `sp_row_result` (a failed control makes a refusal `not run`); a `fail` goes through `--direct`.
- [ ] **The header** gains a *JOB MODE* paragraph: the reading above, the four clone-only rows, and the restore rule.

**Verification:**

- The type check passes.
- `git diff scripts/lib/sandbox-probe/legs-planted-files.sh` shows `sp__pf_l1`'s clone-layout line unchanged, and every new path behind an `SP_JOB_MODE` test.
- `grep -n 'update-ref -d\|symbolic-ref HEAD' scripts/lib/sandbox-probe/legs-planted-files.sh` shows each `HEAD` change paired with `sp__pf_l1_restore` and its registration.
- `grep -n 'sp_restore_register sp__pf_l1_restore\|update-ref refs/heads/-sbxdash' scripts/lib/sandbox-probe/legs-planted-files.sh` shows the registration on an earlier line than the ref's creation.
- `grep -n 'push origin :refs/heads/-sbxdash' scripts/lib/sandbox-probe/legs-planted-files.sh` finds the remote removal inside `sp__pf_l1_restore`, behind the `SP_PF_L1_REMOTE_ABSENT` and tip checks.
</content>
</invoke>
