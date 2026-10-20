### Task 28 — Make the flows' Phase D push-state read hold in a clone, and restate why the wrappers run from the main checkout

**Goal:** Fix five plugin instruction sites that the clone layout makes false (story index → `## Scope register`, rows 18 and 25–28):
- The **Branch delivery** bullet in both Phase D cores, with two problems:
  - It cites `create-worktree.sh`'s *"`worktree add -b … "origin/$default_branch"` line"*, which Task 7 deletes.
  - It reads push state from the first line of a bare `git status -sb`, where *"no `...<upstream>` at all means the branch has no upstream and nothing was pushed"*. A clone's `.git/config` holds only the keys `hr_clone_config_spec` lists (`cli/templates/scripts/lib/harness-run-lib.sh` → *THE CLONE CONFIGURATION ALLOW-LIST*). That list has no `branch.<branch>.remote` or `branch.<branch>.merge`, and Task 7 writes the upstream into the main checkout's `.git/config` only. So in a clone, `git status -sb` shows no upstream, and every clone run would report an unpushed branch.
- The rationale for calling `<MAIN_REPO>`'s wrappers in `autonomous_pause_and_ledger.md` §1.6 and `docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`. Both say *"the run copy's own scripts stay sandboxed, where the commit cannot write a linked worktree's record"*. That is now true only of a legacy worktree run.
- The canonical copy of that rationale, which its sibling flows defer to (`plugin/instructions/clarification_digest_instructions.md`: *"the reasoning … are canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## Commit mechanics`"*): that section's bullet **A raw `git commit` cannot land this commit in a headless run.** says *"A raw `git commit` — or a bare `git add` — in a worktree runs sandboxed, where it cannot write the worktree's record."* In a clone a sandboxed `git commit` succeeds (task prompt: *"Sandboxed ordinary git works in a clone at the sibling path (add, commit, fetch, stash, switch)"*; Task 23's CS3 measures it), and Task 1's sync-in carries a clone that is ahead forward, so a raw clone commit does reach the main checkout's branch at the next wrapper call. The bullet's claim that a raw commit *cannot land* is false in a clone.

**The push-state read this task adopts.** One plain, single-statement, bare `git rev-list --count origin/<branch>..HEAD`, with `<branch>` resolved before the command is issued:
- `0` means every commit reached the remote;
- `N` above `0` means N commits are **not** on the remote;
- an **error** because `origin/<branch>` does not exist means no push or fetch from this checkout has recorded the branch, so nothing was pushed.

This read gives the same answer in a clone and in a legacy worktree, because the remote-tracking ref it reads is kept current in both:
- **In a worktree**, `refs/remotes/origin/<branch>` is the main checkout's own ref, which every push updates.
- **In a clone**, the ref is the clone's mirror. `push-branch.sh` already syncs the clone's `refs/remotes/origin/<branch>` out after every push (`hr_copy_sync_out_var … "refs/remotes/$remote/$branch"`). Task 7 syncs it out after the creation push, so the mirror exists from the run's first moment.

It needs no new key in the clone's configuration, so the clone trust check's allow-list does not widen.

**Depends on:**
- **Task 7.** A new branch is cut from the `origin/<default_branch>` commit as origin reports it (`hr_run_trusted_base_var`), into a clone made by `hr_clone_create_var`. It is pushed from the main checkout, and the clone's `refs/remotes/origin/<branch>` is then synced out to the pushed tip.
- **Task 1.** A clone holds `refs/remotes/origin/<defaultBranch>`, so the existing count `git rev-list --count origin/<default_branch>..HEAD` still resolves in a clone.
- **Task 5.** The main checkout's whole `.git` is write-denied in the profile.

**Where this task stops.** It edits these five files and nothing else. It does not touch `create-worktree.sh` or the library (Tasks 7 and 1). `branch-prompt.md` is Task 20's.

### Targets

- `plugin/instructions/plan_orchestration_instructions_core.md` (the **Branch delivery** bullet under `## Phase D — Done` only)
- `plugin/instructions/user_review_fixes_instructions_core.md` (the same bullet only)
- `plugin/instructions/autonomous_pause_and_ledger.md` (`### 1.6 How to flip / create`, the one rationale sentence only)
- `plugin/instructions/docs_orchestration_instructions_autonomous.md` (`## Commit mechanics (single source of truth)`, the one rationale sentence only)
- `plugin/instructions/improvement_observations_instructions.md` (`## Commit mechanics`, the bullet **A raw `git commit` cannot land this commit in a headless run.** only)

**Work:**

- [ ] **Branch delivery, the base citation, in both cores.** Replace *"(`create-worktree.sh`, its `worktree add -b … "origin/$default_branch"` line)"* with a citation that resolves after Task 7: `create-worktree.sh` cuts the branch from the `origin/<default_branch>` commit as origin reports it (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_trusted_base_var`). Cite by symbol, never by line. Keep the rest of the base explanation: no shipped script fast-forwards the local `<default_branch>`.
- [ ] **Branch delivery, the push-state read, in both cores.** Replace the `git status -sb` sentence and its three readings with the read above and its three readings. Keep the bullet's existing constraints word for word: the command is plain, single-statement and bare (no `-C`, no pipe), its placeholder is resolved before it is issued, it is re-issued on a resumed session, a failed or refused command is named, never a remembered number, and the line is a hand-off, never a gate. Add one clause saying the read holds in a clone and a worktree alike, because it reads a remote-tracking ref every push keeps current, not the checkout's configured upstream.
- [ ] **The two cores stay identical.** The **Branch delivery** bullet is one wording carried in both cores (`.claude/context/plugin.md` → `## Writing agent prose`: *"A block several agents carry is one wording, copied byte-for-byte into every copy"*). Write the new text once and copy it byte-for-byte into the other core.
- [ ] **The wrapper rationale, in `autonomous_pause_and_ledger.md` §1.6, `docs_orchestration_instructions_autonomous.md` and `improvement_observations_instructions.md` → `## Commit mechanics`.**
  - In the first two, replace *"where the commit cannot write a linked worktree's record"* with: where a commit cannot move the main checkout's branch, whose whole `.git` the profile write-denies, and, in a legacy worktree run, cannot write the worktree's record. In the docs fork, keep *"and an SSH push can fail while the wrapper still exits 0"* after it. Use the same wording in both files.
  - In the canonical bullet, restate the bold lead and its second sentence so neither claims a raw commit cannot land. Its rationale is the one the first two adopt: the wrapper is the one committer the unattended profile runs outside the sandbox; a sandboxed `git commit` cannot move the main checkout's branch, whose whole `.git` the profile write-denies, and in a legacy worktree run cannot write the worktree's record. A lead such as **Commit through the wrapper, never a raw `git commit`, in a headless run.** fits. At planning time `git grep -n 'cannot land' -- plugin cli docs` reaches only this bullet, so no other file quotes the old lead; re-run that command first, and if it then reaches another file, keep the lead and restate only the second sentence. Keep the bullet's third sentence (the literal-match rule: no `$`, backtick, `|`, `>` or `<` in the command) byte-for-byte.
  - Change nothing else in any of the three sections: the literal-spelling rule and the allow-entry sentence are wires.
- [ ] **Re-derive the readers.** Run `git grep -nE 'status -sb|linked worktree.s record|cannot land this commit|cannot write the worktree.s record' -- plugin`. Every remaining hit is either a sentence this task wrote, or one the story index's `## Scope register` lists with its disposition.

**Verification:**

- `claude plugin validate --strict plugin` still passes, if `claude` is on `PATH`; otherwise record it as not run.
- `git grep -n 'worktree add -b' -- plugin/instructions` prints nothing.
- `git grep -n 'cannot land this commit' -- plugin` prints nothing, or prints only the kept lead when the re-run grep above found another file quoting it.
- `git grep -n 'status -sb' -- plugin/instructions/plan_orchestration_instructions_core.md plugin/instructions/user_review_fixes_instructions_core.md` prints nothing.
- Extract the **Branch delivery** bullet from each core (from the line beginning `- **Branch delivery:` to the end of that line) into two scratch files, and `diff` them. They are identical.
- **The clone answer matches the worktree answer**, by hand, in a throwaway `git init` fixture under the system temp directory with a bare `origin`, never this checkout. Use the built CLI's `init`, then cut one branch with `create-worktree.sh --no-bootstrap` (a clone, after Task 7), and one by hand at its derived path with `git worktree add -b` plus `git push -u` (the legacy layout). In each, make one commit and push it through `push-branch.sh`, then make one more commit without pushing. Run the bare `git rev-list --count origin/<branch>..HEAD` in each copy: both print `1`. Push again, and both print `0`. In a third by-hand worktree whose branch was never pushed, the command errors on the missing `origin/<branch>`. Report the outputs in the implementer's return.
