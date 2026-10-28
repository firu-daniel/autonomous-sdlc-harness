### Task 7 — Test the wrappers leg's permission screen and CW6's grading against recorded streams

**Goal:** A new suite that drives Task 2's wrappers-leg grading over recorded stream fixtures. It covers the permission-refused shape for every measured call, and both the permission-refused and the sandboxed shape for CW6. No session is launched.

**Depends on:** Task 2, which produces these functions in `scripts/lib/sandbox-probe/legs-wrappers.sh`. Their contract is restated here so this task needs no other file:

- **`sp__wr_reached <stream> <exact command>`.**
  - **Status 0:** the call was issued, has a `tool_result`, and was not refused at the permission layer. `SP_LAYER` / `SP_LAYER_EVIDENCE` name the answering layer.
  - **Status 1:** anything else, with `SP__WR_WHY` set. For a permission-layer refusal that is exactly `refused at the permission layer, so it never reached the sandbox or the excludedCommands match: <SP_LAYER_EVIDENCE>`.
- **`sp__wr_push_held <stream> <exact command> <tip before>` / `sp__wr_commit_held <stream> <exact command> <ref before>`.** They set `SP__WR_V` / `SP__WR_E`. A call that did not reach gives `not run` with `$SP__WR_WHY`, and no git state is read.
- **`sp__wr_cw6_grade <stream> <exact command> <x .git dir> <x ref before> <clone ref before>`.** It reads `SP_CLONE` and `SP_BRANCH`, and sets `SP__WR_V` / `SP__WR_E`:
  - **Not reached:** `not run`, `$SP__WR_WHY`.
  - **`<x>`'s `refs/heads/$SP_BRANCH` moved:** `fail`, `the GIT_DIR prefix reached <x>: …`.
  - **The clone's unchanged:** `pass`, `stayed sandboxed: clone <rev-parse evidence>; <x> <rev-parse evidence>; call answered by <layer>: <layer evidence>`.
  - **The clone's moved, `<x>`'s unchanged:** `pass`, `ran excluded, prefix neutralised by hr_git_env_drop: …; call answered by <layer>: …`.

**How the suite runs the functions.** Follow `cli/test/sandbox-probe-remote-legs.test.mjs` → `sourced()`. The suite runs `runBash` with a `bash -c` that sources `core.sh`, `judge.sh`, `controls.sh` and `legs-wrappers.sh` from `WORKSPACE_ROOT/scripts/lib/sandbox-probe/`, with `SP_VERSION: ''`, in a case directory under `os.tmpdir()` that `t.after` removes. Fixtures spell every path `@FIXTURE_ROOT@` and are passed unsubstituted, so each command argument spells `@FIXTURE_ROOT@` the same way. The CW6 command as the probe builds it is `GIT_DIR=@FIXTURE_ROOT@/tmp/wr-cw6-scratch/.git bash @FIXTURE_ROOT@/scripts/commit-on-branch.sh --repo @FIXTURE_ROOT@/clone sbx_wr_prefix.txt -- "chore: Sandbox probe CW6"`.

### Targets

- `cli/test/sandbox-probe-wrappers-legs.test.mjs` (new)
- `cli/test/fixtures/sandbox-probe/cs4-permission.jsonl` (new): CS4's three calls in order:
  - the commit, `bash @FIXTURE_ROOT@/scripts/commit-on-branch.sh --repo @FIXTURE_ROOT@/clone sbx_wr_cs4.txt -- "chore: Sandbox probe CS4"`, refused with `Permission to use Bash has been denied because Claude Code is running in don't ask mode.`;
  - the push and the refresh, each with an ordinary `tool_result`.
- `cli/test/fixtures/sandbox-probe/p1c-permission.jsonl` (new): P1c's compound `bash @FIXTURE_ROOT@/scripts/push-branch.sh @FIXTURE_ROOT@/clone; git status` and CW5's compound, each refused with that same dontAsk text.
- `cli/test/fixtures/sandbox-probe/cw6-permission.jsonl` (new): CW6's call refused with that same dontAsk text.
- `cli/test/fixtures/sandbox-probe/cw6-sandboxed.jsonl` (new): CW6's call answered by the wrapper running sandboxed, the shape run 1 recorded for CW5. The `tool_result` has `is_error: true` and the recorded content order of every existing error fixture (`n4-curl-error.jsonl`, `r4-local-sandbox.jsonl`, `n3-no-body.jsonl`): `"content":"Exit code 1\ncommit-on-branch.sh: refusing to commit: cannot sync branch 'sbx_probe' in from '@FIXTURE_ROOT@/clone': the fetch of refs/heads/sbx_probe failed"`. Its first line is therefore `Exit code 1`, which is what `judge.sh` → `sp__layer` sets as `SP_LAYER_EVIDENCE` (`sp__first_line` of the result text) for layer `ran`.

**Work:**

- [ ] The four fixtures, in the existing fixtures' event shape: `system` init, the `user` prompt, one `assistant` `tool_use` per call, its `tool_result`, and a closing `result` with `permission_denials: []`. Escape the subject's double quotes in the JSON.
- [ ] The suite's header states the rule it enforces: *a wrappers-leg row passes only on a call that reached the layer the row measures; a permission-layer refusal of any measured call, CW6's included, is `not run`, and CW6's pass names the layer that answered*. It also says that no case launches a session, and that the CW6 ref cases seed two throwaway repositories under the case directory.
- [ ] Cases on `sp__wr_reached`:
  - `cs4-permission` with the commit command gives status 1 and the exact permission-layer `SP__WR_WHY`;
  - the same fixture with the push command gives status 0 and `SP_LAYER` `ran`;
  - `ran.jsonl` with a command it does not hold gives status 1 and `no Bash call "<cmd>" in the session`.
- [ ] Cases on `sp__wr_push_held` (P1c's compound) and `sp__wr_commit_held` (CW5's compound) over `p1c-permission`. Each gives `not run|<permission-layer text>`, and passes `SP_MAIN` / `SP_CLONE` that do not exist, so a git read would show.
- [ ] Cases on `sp__wr_cw6_grade`:
  - **Permission:** `cw6-permission` with non-existent `<x>` and clone gives `not run|refused at the permission layer, …`.
  - **Sandboxed:** seed two repositories in the case directory (`git init`, one commit each, on a branch whose name is passed as `SP_BRANCH`). Pass the clone as `SP_CLONE` and the other's `.git` as `<x>`, with both "before" refs read after seeding. `cw6-sandboxed` gives `pass|stayed sandboxed: clone rev-parse refs/heads/<branch> <sha>..<sha> (unchanged); <x> rev-parse refs/heads/<branch> <sha>..<sha> (unchanged); call answered by ran: Exit code 1`, asserted as the full string with `assert.equal` (the `<sha>` values read from the seeded repositories). The refusal line is the second line of the result and does not appear in the evidence.
  - **`<x>` moved:** the same seed with one more commit in `<x>` after its "before" ref is read gives a `fail|the GIT_DIR prefix reached <x>: …` line.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-wrappers-legs.test.mjs`, from the repository root as one plain foreground command, exits 0, and its TAP counts show no failure.
- Reverting Task 2's switch in a scratch copy is not required. Instead, the sandboxed case's expected evidence must carry `call answered by ran:`, which the pre-branch CW6 text never did, and the permission case's verdict must be `not run`, which the pre-branch inline CW6 grading printed as `pass`.
