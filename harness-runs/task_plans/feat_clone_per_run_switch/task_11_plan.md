### Task 11 — Make `remote-run.sh start` and `review` cut and remove clones through the library, and drop the registry record each created

**Goal:** `start` (in a trigger job) and `review` (locally, from `branch-user-review`) get their run copy from `create-worktree.sh`, which now makes a clone. Each removes what it created through the library, on every exit, success and failure alike:
- the clone, through `hr_clone_remove_var`, in place of `git worktree remove --force`;
- the local branch, only when it cut it;
- the registry record the clone's creation wrote, only when none existed before;
- the registry directory, only when it did not exist before the cut and is empty after the drop.

It never removes a copy, branch or record it did not create.

**Depends on:** Tasks 1 and 7, and the existing `hr_registry_peek <file> <branch> <key>`: `0` when `.runs[<branch>]` is a record (printing the key's value, or nothing for an absent key), `1` when the file is missing or unreadable or holds no such record; it never creates the file. From Task 7: `create-worktree.sh --no-bootstrap <branch>` makes a clone at `hr_worktree_dir`, records `worktree` and `copy_kind` `clone`, creating the registry directory when absent, and pushes the new branch. `--existing --no-bootstrap <branch>` makes a clone of an existing branch and never pushes. Either one removes everything it made on its own failure. The existing `hr_clone_remove_var <main> <dir>` removes a registered clone.
From Task 1: it restates `hr_registry_drop`'s comment so that `remote-run.sh`'s `start_remove_copy` is a declared caller (step 4 below), beside `hr_clone_create_var`'s rollback and `create-worktree.sh`'s failure rollback.

### Targets

- `cli/templates/scripts/remote-run.sh`

**Work:**

- [ ] Before the `create-worktree.sh` call in `verb_start` and in `verb_review`'s cut path, record beside the existing `had_copy` / `had_branch`:
  - whether the registry held a record for `<branch>` (`had_record`), tested with `hr_registry_peek "$registry" "$branch" worktree`, whose return value tells a present record from an absent one, never a hand-written `jq` read;
  - whether the registry directory `<stateDir>/autonomous_logs/` existed (`had_registry_dir`), because `create-worktree.sh` creates it when absent (Task 7) and leaves it on success.
- [ ] Rewrite `start_remove_copy` for the clone:
  1. when this verb created the copy and it still exists, `hr_clone_remove_var "$run_main" "$worktree"`, printing one line when it refuses;
  2. drop the `git worktree remove --force` and the `git worktree prune`;
  3. when the verb cut the branch, delete it by compare-and-swap from the tip this verb saw. Keep `branch -D` only if the tip is unknown;
  4. when the record did not exist before, drop it (`hr_registry_drop`);
  5. when the registry directory did not exist before the cut, `rmdir` it if it is now empty, so the verb leaves no directory its own `create-worktree.sh` call made. A non-empty directory stays: something else wrote into it.

  Keep it idempotent, with each failed step one stderr line that never changes the exit status already decided.
- [ ] `verb_review`'s mirror path (`use_mirror=1`) is unchanged: the record's `worktree` may be a legacy worktree or a clone, and `hr_run_copy_check_var` judges either. Confirm that its fast-forward and commit go through Task 1's clone-first helpers, and that it removes nothing on that path.
- [ ] Rewrite the header for clones: the `start` / `review` paragraphs naming `create-worktree.sh --no-bootstrap` and `--existing --no-bootstrap`, and the place that says what each removes. Make sure no sentence still says a copy is a linked worktree. Rewrite any `REPRO` arm that does `git worktree remove` or reads `git worktree list` to the clone equivalent. The header states what each verb writes, and this task changes that (`.claude/context/cli.md` → `## What "done" means here`: a change either satisfies its module header's rule or amends the header in the same edit), so also amend the header's two write statements:
  - **The `start` paragraph** (*"`start` IS THE ADAPTERS' ONE ENTRY"*). Replace its closing *"It writes no registry record: a trigger job has no registry, and such a run needs no local record: the local commands act on it through GitHub."* with the new fact. The verb's `create-worktree.sh` call writes a registry record for the clone (`worktree`, `copy_kind`). It also creates the registry directory `<state_dir>/autonomous_logs/` when that directory is absent, which a trigger job's fresh checkout always is. The verb drops a record that did not exist before the cut, and removes the directory when it made it and it is empty after the drop. No record is left behind, so the local commands still act on such a run through GitHub. In the same paragraph's *"then remove the working copy and the local branch it created"* clause, name the record and directory beside them.
  - **`WHAT IT NEVER DOES.`** In `start`'s write inventory (*"the prompt committed on `origin/<branch>`, through a working copy and a local branch it removes before it returns, …"*), add the registry record and the registry directory, each as written and then removed (the record only when none existed before, the directory only when it was absent and is empty after the drop). Add the same two writes to `review`'s cut path (*"a copy and a local branch it removes"*). Leave `review`'s mirror path (*"through the record's mirror"*) as it is: it writes no record there.

**Verification:**

- The header's `REPRO` arms for `start` and `review`, run by hand against a throwaway fixture under the system temp directory with `gh` stubbed exactly as each arm says, leave behind no clone directory, no local branch the verb cut, no registry record the verb created, and no registry directory that did not exist before the verb, on success and on a forced failure alike.
- `grep -n 'writes no registry record' cli/templates/scripts/remote-run.sh` prints nothing. A read of the `start` paragraph and of `WHAT IT NEVER DOES.` shows that each names the registry record and the registry directory for `start`, and for `review`'s cut path, as written and then removed. It also shows `review`'s mirror-path inventory names no record write.
- `bash -n` under macOS `/bin/bash` (3.2) exits 0.
