### Task 2 — Allow and screen CW6's prefixed call, name its answering layer, and screen every measured wrapper call for a permission-layer refusal

**Goal:** Stop the wrappers leg from passing a row whose call never ran.

- CW6's `GIT_DIR=<x> …` call gets its own exact `--allowedTools` rule, is screened like P1b's, and its pass names the layer that answered.
- Every other measured wrapper call (CS4's three, P3, CW2, P1c, CW5) goes through the same screen, so a permission-layer refusal grades `not run`. Today such a refusal grades `pass` (P3, CW2, P1c, CW5, CW6: the refs are unchanged) or `fail` (CS4).

**Depends on:** Task 1, whose `wrappers` description in `core.sh` states this leg's new expectation. That description must hold once this task lands.

**The contract this task produces, which Task 7 tests.** Every function reads only its arguments, the stream and the globals named. It calls only `core.sh`, `judge.sh`, `controls.sh` and this file's functions; refs go through `judge.sh`'s `sp_judge_ref`. Signatures:

- **`sp__wr_reached <stream> <exact command>`.**
  - **Status 0** when the call is in the stream, has a `tool_result`, and was not refused at the permission layer. `SP_LAYER` and `SP_LAYER_EVIDENCE` then name the layer that answered.
  - **Status 1** otherwise, with `SP__WR_WHY` set to one of two texts:
    - `sp__wr_called`'s no-match or no-result evidence, unchanged;
    - for a permission-layer refusal, exactly the text `sp__wr_permission_screen` already writes: `refused at the permission layer, so it never reached the sandbox or the excludedCommands match: <SP_LAYER_EVIDENCE>`.
  - Build it from the existing `sp__wr_called` and `sp__wr_permission_screen`; neither is renamed, and both keep their current contracts. After this task `sp__wr_called` has exactly one caller, `sp__wr_reached`.
- **`sp__wr_push_held <stream> <exact command> <tip before>` and `sp__wr_commit_held <stream> <exact command> <ref before>`.** The signatures and the pass/fail texts are unchanged. They now call `sp__wr_reached` instead of `sp__wr_called`, so a call that did not reach it sets `SP__WR_V=not run` and `SP__WR_E="$SP__WR_WHY"`, and reads no git state.
- **`sp__wr_cw6_grade <stream> <exact command> <x .git dir> <x ref before> <clone ref before>`.** It reads `SP_CLONE` and `SP_BRANCH`, and sets `SP__WR_V` and `SP__WR_E`, where `<layer>` below is `$SP_LAYER: $SP_LAYER_EVIDENCE` as `sp__wr_reached` left it:
  - not reached: `not run`, `$SP__WR_WHY`; no git state read;
  - `<x>`'s `refs/heads/$SP_BRANCH` moved: `fail`, `the GIT_DIR prefix reached <x>: <x> <sp_judge_ref evidence>; call answered by <layer>`;
  - the clone's `refs/heads/$SP_BRANCH` unchanged: `pass`, `stayed sandboxed: clone <evidence>; <x> <evidence>; call answered by <layer>`;
  - the clone's moved and `<x>`'s unchanged: `pass`, `ran excluded, prefix neutralised by hr_git_env_drop: clone <evidence>; <x> <evidence>; call answered by <layer>`.

### Targets

- `scripts/lib/sandbox-probe/legs-wrappers.sh`

**Work:**

- [ ] Add `sp__wr_reached` as specified, beside `sp__wr_called`. Switch `sp__wr_push_held` and `sp__wr_commit_held` to it. This covers P3, P1c and CW5, and P1b's non-permission path, where `sp__wr_permission_screen` still runs first and keeps its current route.
- [ ] `sp__wr_own` (CW2): replace `sp__wr_called "$SP_STREAM" "$cw2"` with `sp__wr_reached`, so a permission-layer refusal prints `not run` with `$SP__WR_WHY`. `sp__wr_cs4`: replace the `sp__wr_called` loop over `"$c1" "$c2" "$c3"` with `sp__wr_reached`, keeping the early `not run` return and its `$SP__WR_WHY` evidence.
- [ ] `sp__wr_prefix` (CW6):
  - Launch the session with a second rule after P1b's: `sp__wr_session wrappers-prefix "$pfile" --allowed "Bash($p1b)" --allowed "Bash($cw6)"`, so `sp_departures` names both.
  - Replace CW6's inline block (from `if ! sp__wr_called "$SP_STREAM" "$cw6"` to the end of the function) with one call: `sp__wr_cw6_grade "$SP_STREAM" "$cw6" "$x" "$x_before" "$before"`, then `sp_row_result --direct wrappers CW6 "$SP__WR_V" "$SP__WR_E" "$departure"`.
  - `$cw6` is not changed: `GIT_DIR=$x bash $SP_SCRIPTS/commit-on-branch.sh --repo $SP_CLONE $file -- "chore: Sandbox probe CW6"`.
- [ ] The file header:
  - Rewrite the P1b paragraph so it states that P1b and CW6 are each allowed through `--allowedTools` for exactly their call.
  - State that every measured call goes through `sp__wr_reached`, so a permission-layer refusal of any of them is `not run` (that layer is not the one any row of this leg measures).
  - Add a `THE GRADING FUNCTIONS` list naming the three signatures above, in the form `legs-protection.sh`'s header uses.

**Verification:**

- `grep -n 'sp__wr_called' scripts/lib/sandbox-probe/legs-wrappers.sh` shows its definition and exactly one call, inside `sp__wr_reached`.
- `grep -n -- '--allowed' scripts/lib/sandbox-probe/legs-wrappers.sh` shows the one `sp__wr_session wrappers-prefix` line carrying both `Bash($p1b)` and `Bash($cw6)`.
- By hand, from a temp directory: in a `bash -c` that sources `core.sh`, `judge.sh`, `controls.sh` and this file, call `sp__wr_cw6_grade` on the existing fixture `cli/test/fixtures/sandbox-probe/p1b-permission.jsonl` with P1b's fixture command. It must print `not run` with the permission-layer text and touch no repository. (Task 7 adds CW6's own fixtures.)
- The type check (`bash scripts/typecheck.sh`) parses the file under the bash floor.
