### 1. The route for moving a run in flight starts with `git switch <branch>`, which fails while the run's mirror working copy holds that branch, and pushes a stale local branch when one exists

**File:** `docs/remote-execution.md` → `### Upgrading` → **Moving a run in flight to the new version, on purpose.** — the fenced blocks "git switch <branch>" and "git push origin <branch>"

**Problem.** The route Task 5 added tells the adopter, after `git fetch origin`, to run `git switch <branch>` and, at the end, `git push origin <branch>`. The route applies only to a run that is paused, parked or stopped, and for a remote run such a branch is, in the common case, already checked out in the watcher's **mirror working copy**:

- The watcher creates that working copy for every dropped task with `git worktree add -b` (`cli/templates/scripts/create-worktree.sh`, the `'worktree add -b'` sentence in its `re-creating` error text), and keeps it for the run's whole life: `/autonomous-sdlc-harness:branch-resume` writes `RESUME` into it and `/autonomous-sdlc-harness:branch-answer` writes the answer into it (`docs/remote-execution.md` → `## 1.`, the relay table rows for those two commands).
- git refuses to switch a second checkout onto a branch another worktree has checked out (`fatal: '<branch>' is already used by worktree at '<path>'`, or `is already checked out at` on older git). So in the adopter's main checkout — the only checkout the section's "from the repository root" framing points them at — the route stops at its second command, for exactly the paused and parked runs it is written for.
- Where the switch does succeed (the working copy was removed, or the adopter runs it elsewhere), `git switch <branch>` lands on the **local** branch, which does not move when the job pushes: the job, not this machine, advanced `origin/<branch>` (the same section's `/autonomous-sdlc-harness:branch-user-review` row: "the job, not this copy, is where the branch advanced"). The `git fetch origin` before it updates only `origin/<branch>`. The commit is then made on a stale tip and `git push origin <branch>` is rejected as a non-fast-forward, or, if the adopter forces it, discards the job's work.

A reader following the route as written therefore either cannot start it or pushes onto the wrong base.

**Fix.** Make the route work from any checkout, on the remote tip, without touching the local branch or the mirror's checkout. In `docs/remote-execution.md` → `### Upgrading` → **Moving a run in flight to the new version, on purpose.**:

- [ ] Replace the fenced block

  ```
  git switch <branch>
  ```

  with

  ```
  git switch --detach origin/<branch>
  ```

- [ ] Immediately after that block, add this sentence: "The switch is detached on purpose: `origin/<branch>` is where the run's jobs pushed, the local branch of that name lags it, and the run's mirror working copy may hold that branch checked out, which git refuses to switch a second checkout onto."
- [ ] Replace the fenced block

  ```
  git push origin <branch>
  ```

  with

  ```
  git push origin HEAD:<branch>
  ```

- [ ] After the sentence that follows it ("The push needs no `--no-verify`: … The next dispatch of that run runs the new version."), add one more fenced block and the sentence before it: "Then return this checkout to where it was:" followed by

  ```
  git switch -
  ```

Leave the `git fetch origin` block, the `git checkout origin/<default branch> -- …` block, the commit, the `gh auth refresh -s workflow` block and the surrounding prose unchanged. The `pre-push` hook still does not fire on this push: its target ref is `refs/heads/<branch>`, not a protected branch (`cli/templates/githooks/pre-push` → "refuses a push whose TARGET ref is a protected branch").

This is a prose-only change to one developer document; it asks for no test run.
