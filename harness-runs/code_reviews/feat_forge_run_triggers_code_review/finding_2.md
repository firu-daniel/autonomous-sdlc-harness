### 2. `adopt` runs each adopted branch's own bootstrap on the maintainer's machine, and no document says so

> **Self-contained per-finding file** for the `feat_forge_run_triggers` code-review index (`harness-runs/code_reviews/feat_forge_run_triggers_code_review.md`). The implementer reads only this file. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `docs/github-issue-trigger.md` → `## 4. What the labeller vouches for` and `## 5. Working the run`. Also `docs/remote-execution.md` → `## 1. The lifecycle of a remote run`, the paragraph "**What each local command does for a remote run.**"

**Evidence in code:**

- `cli/templates/scripts/remote-run.sh` (`adopt_one`): "bash \"$script_dir/create-worktree.sh\" --existing \"$b\"".
- `cli/templates/scripts/create-worktree.sh`: in `--existing` mode it runs `bootstrap="$worktree_dir/$scripts_rel/setup-worktree.sh"`, which is the copy of `setup-worktree.sh` **on the adopted branch**, with `scripts_rel` read from that branch's `harness.config.json`.
- `cli/templates/scripts/setup-worktree.sh`, step 5: "`commands.depInstall`, then `commands.build`". These are read from the new working copy's own configuration.

**Problem.** `adopt` is run implicitly, once, by `/autonomous-sdlc-harness:branch-answer`, `-resume`, `-pause` and `-user-review`, before they act. That holds even when the maintainer named a different branch. For **every** candidate it creates a working copy with `create-worktree.sh --existing`. That call executes the adopted branch's own `setup-worktree.sh`, its configured dependency install and its build on the maintainer's machine. The branch's contents were written by a remote run whose task came from issue text, possibly written by someone without write access and vouched for by the labeller (`## 4.`). Running `/autonomous-sdlc-harness:branch-pause feat_a` can therefore install and build `issue_42`'s branch locally. Today the docs describe adopt only as "creates the mirror working copy and writes a record" (`## 5.`, and `docs/remote-execution.md` `## 1.`). A maintainer reading them concludes the syncing commands only fetch state, and runs one without knowing it executes code from every GitHub-started branch the registry does not yet hold. That is the wrong decision on an undisclosed code-execution path, so this is Must Fix. Whether adopt *should* bootstrap is a separate design question, raised in the review's return rather than here. This finding is the disclosure, which holds whatever that answer is.

**Fix.** These are prose edits only. Change no code.

- [ ] In `docs/github-issue-trigger.md` → `## 4. What the labeller vouches for`, add a bullet after "**The committed prompt is the snapshot at label time.**":

  > **Adopting a run executes its branch on your machine.** `remote-run.sh adopt` creates each mirror with `create-worktree.sh --existing`, which bootstraps it: it runs the adopted branch's own `setup-worktree.sh`, and that branch's `commands.depInstall` and `commands.build`, locally. The branch was written by a run whose task the labeller vouched for, so adopting it trusts that branch as far as running its install and build. Every one of `/autonomous-sdlc-harness:branch-answer`, `-resume`, `-pause` and `-user-review` adopts **every** candidate once before it acts, not only the branch it names. To see the candidates without adopting them, run:
  >
  > ```
  > /autonomous-sdlc-harness:branch-status
  > ```
  >
  > It lists each candidate as `not adopted` and adopts nothing.

  In the document, indent the fenced block and the sentence after it under the bullet so both stay part of it. The fenced block holds that one command and nothing else (`harness-runs/lessons.md` → `## Adopter-facing documentation`: every command an adopter is meant to run sits in a fenced block, one per line).

- [ ] In `docs/github-issue-trigger.md` → `## 5. Working the run`, change "it creates the mirror working copy and writes a record with `execution: github-actions`" to "it creates the mirror working copy — bootstrapping it, which runs that branch's install and build locally (§4) — and writes a record with `execution: github-actions`".
- [ ] In `docs/remote-execution.md` → `## 1.`, the paragraph "**What each local command does for a remote run.**", change "it creates the mirror working copy and writes a record with `execution: github-actions`" to "it creates the mirror working copy, bootstrapped by the branch's own `setup-worktree.sh`, `commands.depInstall` and `commands.build` run on this machine ([`github-issue-trigger.md`](github-issue-trigger.md) → `## 4.`), and writes a record with `execution: github-actions`".

No test covers prose. No test run is owed for this fix.
