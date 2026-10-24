`fix_committer_plain_push_call` makes the `committer` run its push the same way it already runs its commit: `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` as one command, alone, with nothing chained before or after it. Today the contract says this for the commit but not for the push. In an unattended run, a push the committer chains to other commands runs inside the sandbox and fails.

## What was observed

These come from `fix_run_gates_answered_park_resume` (2026-10-23/24, watcher-launched, unattended profile). The source is `harness-runs/autonomous_logs/fix_run_gates_answered_park_resume.stream.jsonl` in the main checkout.

The unattended profile `.claude/settings.autonomous.json` exempts exactly one form of each wrapper from the sandbox: `sandbox.excludedCommands` holds `bash <main checkout>/scripts/commit-on-branch.sh:*` and `bash <main checkout>/scripts/push-branch.sh:*`. In three committer dispatches the push did not match that form, so it ran sandboxed:

| Commit | The committer's command | Result |
|---|---|---|
| `88bf8e8f` (task flow, Task 5) | `bash <run copy>/scripts/push-branch.sh <run copy>`: the **run copy's** script, not `<MAIN_REPO>`'s | The sandbox proxy blocked SSH: `sandbox proxy: github-firu:22: 403 host is not on the allow list`, on all three tries. |
| `f5ff1a08` (skeptic Finding 1) | `cd <run copy>; git status --short; git log -1 --oneline; bash <main>/scripts/push-branch.sh <run copy>; echo "exit $?"` | `push-branch.sh: refusing to push: cannot sync branch '…' in from '<run copy>': the fetch of refs/heads/… failed`, because the sandbox denies the fetch into the main checkout's `.git`. |
| `15f7dcc4` (user-review Finding 5) | `git status --short && git log -1 --oneline && bash <main>/scripts/push-branch.sh <run copy>` | The same `cannot sync branch` refusal. |

Every committer push issued as one plain call succeeded. So did every one the orchestrator issued itself. In a fourth dispatch (Finding 4, `4e383e63`), the `;`-chained form was denied outright (`dontAsk` mode). The committer then ran `git status --short`, `git log -1 --oneline` and the push as three separate calls, and the push succeeded.

Each failure was reported correctly as `pushed: failed` with the commit in place. The commit sat local-only until the orchestrator's next push carried it, so no work was lost.

The same session's first run had a related failure. A committer **commit** (`mode: review_plan_file`, Phase A2.2) returned `error: commit-on-branch.sh exited 1 and refused to commit: "cannot sync branch … the fetch of refs/heads/… failed"`. An identical re-dispatch then committed `754228cb`. The signature matches the push failures, but the command that failed was not checked.

## The cause

`plugin/agents/committer.md` → `## Standard procedure`:
- Step 4 already says, for the commit: *"call the wrapper once, alone, with exactly step 3's paths and every placeholder as literal text"*.
- Step 5 (**Verify:** `git status --short` is clean, and `git log -1 --oneline` matches `<short_sha>`) and step 6 (**Push:** … run `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` with both spelled literally) say nothing about how the commands are issued. The committer merged steps 5 and 6 into one compound Bash call twice. Once, it also took `<scripts_dir>/push-branch.sh` from the run copy instead of `<MAIN_REPO>`.

## The goal

1. **The push is one plain call.** Step 6 states that `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` is issued once, alone, as its own Bash call:
   - no `cd`, `;`, `&&`, `||`, pipe, `echo "exit $?"`, `$(…)` or shell variable around it;
   - `<MAIN_REPO>` is the main checkout's root as `## Resolved values` resolves it, never `<repo_root>`.

   Word it like step 4's sentence for the commit, so the two read the same.
2. **Step 5's checks are their own calls.** `git status --short` and `git log -1 --oneline` each run as a separate plain call, never chained to each other or to the push.
3. **Same rule wherever the committer runs the wrappers.** Check the other procedures in `plugin/agents/committer.md`, `ui_test_pass` and `review_plan_file` included, and any other agent or instruction document that tells an agent to run `commit-on-branch.sh` or `push-branch.sh`. Give each the same rule, worded identically, per `.claude/context/plugin.md` → `## Writing agent prose` ("Each rule is stated once"; a block several agents carry is one wording, copied byte-for-byte). If there is one shared place the committer already reads for wrapper calls, state the rule there once and point to it.
4. **Add only the words the rule needs.** `.claude/context/plugin.md` → `## Writing agent prose` → **An agent's growth is paid for by behaviour.** This change adds behaviour, so the definition may grow by the new sentence. Add no rationale, and reuse step 4's "once, alone" wording rather than writing a second version of it. Don't trim unrelated text to offset the sentence.
5. **Pin it.** Extend whichever `cli/test` suite already quotes `committer.md`'s procedure text, or add a small source guard, so the "once, alone" wording on both the commit and the push steps can't drift silently.

## Constraints

- No change to `push-branch.sh`, `commit-on-branch.sh`, `harness-run-lib.sh` or the generated permission profile. The profile's single exempted form is the boundary working as designed. The fix is that the agent matches it.
- The return contract is unchanged: `pushed: yes | no | failed`, and a failed push is still best-effort and never reverts the commit.
- Don't widen `sandbox.excludedCommands` or `permissions.allow` to cover compound commands or the run copy's script path.

