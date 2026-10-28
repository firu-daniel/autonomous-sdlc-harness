### Task 3 — Grade a `dd`, a CS3 call or CL5's `git config` refused at the permission layer as not run

**Goal:** Close the audit's two shortfalls in `scripts/lib/sandbox-probe/legs-protection.sh`. Today a permission-layer refusal grades `fail` in three places, PD3's shape: a call that never reached the layer its row measures, printed as a finding.

- **`write-protection`:** `sp__wp_judge_row` grades a `dd` that the permission layer refused `fail` (CS1, CS2, CS7).
- **`git`:** `sp_leg_git` grades `fail` for CS3's six positive calls (`git add`, `git commit`, `git remote get-url`, `git stash push`, `git stash pop`, `git switch -c`) and for CL5's `git config sbx.probe true`.

Each decision moves into a named grading function so Task 9 can drive it from a recorded stream.

**Depends on:** Task 1, whose `write-protection` and `git` descriptions state *"a dd refused at the permission layer is not run"* and *"a call refused at the permission layer is not run"*.

**The contract this task produces, which Task 9 tests.** Each function reads only its arguments and the stream, except `sp__git_cs3_state`, which reads its arguments and the clone's git state. It calls only `core.sh`, `judge.sh`, `controls.sh` and this file's functions, and prints nothing.

- **`sp__wp_dd_grade <stream> <exact dd command>`** → `SP__WP_DD_V` and `SP__WP_DD_E`:
  - **Sandbox layer:** `pass`, `$SP_EVIDENCE`.
  - **Not in the stream, or no `tool_result`:** `not run`, `$SP_EVIDENCE`.
  - **Permission layer:** `not run`, `refused at the permission layer, so it never reached the sandbox: $SP_EVIDENCE`.
  - **Any other layer:** `fail`, `$SP_LAYER: $SP_EVIDENCE`. This is today's `why` text, minus the `dd <target>: ` prefix, which the caller keeps.
- **`sp__git_cs3_call <stream> <exact command>`** → `SP__GIT_CALL_V` and `SP__GIT_CALL_E`:
  - **Layer `ran`:** `pass`, `$SP_EVIDENCE`.
  - **Not in the stream, or no `tool_result`:** `not run`, `$SP_EVIDENCE`.
  - **Permission layer:** `not run`, `refused at the permission layer, so it never ran: $SP_EVIDENCE`.
  - **Any other layer:** `fail`, `$SP_LAYER: $SP_EVIDENCE`.
  - It leaves `SP__TEXT` as `sp_judge_call` set it, because the CS3 loop reads it next for the stash push and pop lines.
- **`sp__git_cs3_state <ref before> <a> <b> <marker> <x> <stash count before> <unrun>`** → `SP__GIT_STATE_F` (the failures, `; `-joined, empty when none) and `SP__GIT_STATE_P` (the evidence parts). It reads `SP_CLONE` and `SP_BRANCH`. `<unrun>` is a space-separated subset of the words `add commit push pop switch`, naming the CS3 calls `sp__git_cs3_call` graded `not run`. It holds the three state checks `sp_leg_git` runs after the CS3 loop today (from `sp_judge_ref "$SP_CLONE" "refs/heads/$SP_BRANCH" "$ref" moved` through the `switch: HEAD is` failure), each now skipped when a call it depends on did not run:
  - **Commit check** (`sp_judge_ref … moved`, then "the commit carries `<a>`"): skipped when `add` or `commit` is in `<unrun>`, adding `commit: not checked, git add or git commit did not run` to the parts. Otherwise today's rule: a ref that did not move appends `commit: $SP_EVIDENCE` to the failures; a commit not carrying `<a>` appends `the commit does not carry <a>`.
  - **Stash check** (the stash-count comparison, then the `<marker>` line in `<b>`): skipped when `push` or `pop` is in `<unrun>`, adding `stash: not checked, git stash push or git stash pop did not run`. Otherwise today's two failure texts and today's pass part.
  - **HEAD check:** skipped when `switch` is in `<unrun>`, adding `switch: not checked, git switch -c did not run`. Otherwise today's `switch: HEAD is '…', not <x>` failure or `switch: HEAD is <x>` part.
  - A check whose calls all ran keeps today's `fail` text unchanged.
- **`sp__git_cl5_grade <stream> <exact command>`** → `SP_VERDICT` and `SP_EVIDENCE`:
  - **Sandbox layer, with a `could not lock config file` line:** `pass`, `$SP_EVIDENCE`.
  - **Sandbox layer, without that line:** `fail`, `refused, but with no 'could not lock config file' line: $SP_EVIDENCE`. Both sandbox arms are today's rule.
  - **Permission layer:** `not run`, `refused at the permission layer, so it never reached the sandbox: $SP_EVIDENCE`.
  - **Not in the stream, or no `tool_result`:** `not run`, `$SP_EVIDENCE`.
  - **Any other layer:** `fail`, `$SP_EVIDENCE`.

**The CS3 row rule this task ships.** Failures are the loop's (a measured call that ran and was answered by a layer other than `ran`, or a stash push / pop without its expected line), the fetch's, and `SP__GIT_STATE_F`. Then, as today, `fail` when any failure is recorded; otherwise `not run` when any measured call is `not run`; otherwise `pass`. So **any measured call `not run`, and no `fail` from a call that ran or from a state check whose calls all ran, gives CS3 `not run`**. A call refused at the permission layer never turns CS3 `fail` through the state it did not change. Task 9 tests the three per-call functions; this rule is checked by hand below.

### Targets

- `scripts/lib/sandbox-probe/legs-protection.sh`

**Work:**

- [ ] Add `sp__wp_dd_grade`. In `sp__wp_judge_row`, replace the `dd` block (`cmd="$(sp__wp_dd "$t")"` and the `sp_judge_call … sandbox "$cmd"` / `case "$SP_VERDICT"` that follows) with a call to it. Then:
  - `fail` sets `why="dd $t: $SP__WP_DD_E"`.
  - `not run` appends `dd $t: $SP__WP_DD_E` to `notrun`.
  - The rename and target-state checks after it are unchanged.
- [ ] Add `sp__git_cs3_call`. In `sp_leg_git`'s CS3 loop over `"$c_add" "$c_commit" "$c_url" "$c_push" "$c_pop" "$c_switch"`, replace `sp_judge_call "$SP_STREAM" ran "$cmd"` and its `case "$SP_VERDICT"` with a `case "$SP__GIT_CALL_V"` on the new function. The `pass` arm's URL, `Saved working directory` and `Dropped` checks are unchanged, and they read `SP__TEXT` as before. `fail` appends `$cmd: $SP__GIT_CALL_E` to `fails`. `not run` appends `$cmd: $SP__GIT_CALL_E` to `notrun` and adds the call's word (`add`, `commit`, `push`, `pop` or `switch`; none for `$c_url`) to a new local `unrun` list.
- [ ] Add `sp__git_cs3_state`. In `sp_leg_git`, after the `sp__git_cs3_fetch` block, replace the inline commit, stash and HEAD checks with `sp__git_cs3_state "$ref" "$a" "$b" "$marker" "$x" "$before_stash" "$unrun"`. Append a non-empty `SP__GIT_STATE_F` to `fails`, and start `parts` from `SP__GIT_STATE_P`. The `origin:` and `fetch:` parts and the `fail` / `not run` / `pass` selection after them are unchanged, which gives the CS3 row rule above. Drop the locals the extraction leaves unused.
- [ ] Add `sp__git_cl5_grade`. In `sp_leg_git`'s CL5 `else` branch (the `sbx.probe` key did not land), replace the inline `sp_judge_call … sandbox "$c_cl5"` and its `could not lock config file` test with `sp__git_cl5_grade "$SP_STREAM" "$c_cl5"`. Keep the `sp_row_result --direct git CL5 "$SP_VERDICT" "$SP_EVIDENCE" "$departure"` line. The landed-key `fail` arm is unchanged.
- [ ] The header's `THE GRADING FUNCTIONS` list gains the four signatures above, in its existing form, and the CS3 row rule in one sentence.

**Verification:**

- `grep -n 'sp_judge_call' scripts/lib/sandbox-probe/legs-protection.sh` shows no direct call left in `sp__wp_judge_row`'s `dd` block, in the CS3 loop or in CL5's branch. Each is reached through the new functions.
- By hand, from a temp directory: in a `bash -c` that sources `core.sh`, `judge.sh`, `controls.sh` and this file, call `sp__wp_dd_grade` on the existing `cli/test/fixtures/sandbox-probe/sandbox-dd.jsonl` with the command `dd if=/dev/zero of=@FIXTURE_ROOT@/outside/probe bs=1 count=1`. It sets `pass` and the `Operation not permitted` line. (Task 9 adds the permission-layer fixtures.)
- By hand, the CS3 row rule, from a temp directory: seed a throwaway repository there (`git init`, one commit on a branch whose name is set as `SP_BRANCH`; set `SP_CLONE` to it; read `ref` from `git rev-parse refs/heads/<branch>`; leave `<b>` without the marker line; stash count `0`; `<x>` a branch name that does not exist). In a `bash -c` sourcing the same four files:
  - with `<unrun>` `add commit push pop switch`, `sp__git_cs3_state` leaves `SP__GIT_STATE_F` empty and `SP__GIT_STATE_P` carries the three `not checked` parts. With the CS3 loop's `notrun` non-empty, that is the `not run` row;
  - with `<unrun>` empty, `SP__GIT_STATE_F` carries the commit, stash and switch failures — a check whose calls ran keeps its `fail`;
  - with `<unrun>` `switch` only, `SP__GIT_STATE_F` carries the commit and stash failures and no `switch:` failure.
- Reading the CS3 block: no `fails=` assignment is left between the `sp__git_cs3_fetch` block and the `sp_result_line git CS3` lines, other than the append of `SP__GIT_STATE_F`.
- The type check (`bash scripts/typecheck.sh`) parses the file under the bash floor.
