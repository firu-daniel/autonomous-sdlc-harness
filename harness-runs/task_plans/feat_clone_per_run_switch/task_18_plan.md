### Task 18 — Prove a parked legacy worktree run resumes, commits and is swept, in a new `cli/test/run-copy-migration.test.mjs`

**Goal:** Prove the migration decision this branch takes: **both layouts are supported until no worktree run is left, and no run is migrated on resume.** A run that is parked or paused in a linked worktree when this lands:
- resumes in that worktree, under a per-run profile that protects its pointer;
- commits through the main checkout's `commit-on-branch.sh`;
- pushes through `push-branch.sh`;
- once its branch is gone from `origin`, is swept by `cleanup-merged-worktrees.sh` from its registry record.

A new run dropped beside it gets a clone.

**Depends on:**
- **Task 13:**
  - `spawn_engine` reads the record's `copy_kind`, where absent means a legacy worktree;
  - it renders a per-run profile carrying `<wt>/.git` and no `COPY_GIT_PATHS` entry;
  - a resume re-renders it.
- **Task 9:** `cleanup-merged-worktrees.sh` removes a record's `worktree` by kind. A record with no `copy_kind` goes through the legacy arm: the target check, equality with `hr_worktree_dir`, then `git worktree remove --force`.
- **Unchanged:** the wrappers' worktree arm, under Task 4's changes.

### Targets

- `cli/test/run-copy-migration.test.mjs` (new)

**Work:**

- [ ] Build the fixture through `cli/test/helpers/watcher.mjs`: a real `init` and a bare `origin`. Create the legacy state as it exists when this branch lands:
  - a linked worktree at `hr_worktree_dir` made with `git worktree add -b`, pushed;
  - a registry record `{ status: 'parked', worktree: <wt>, engine: 'task' }` with **no** `copy_kind`;
  - a question/answer pair under its clarification channel.

  Open the file with the decision and its rule.
- [ ] **Resume:** one `tick`. The stub agent is launched in `<wt>`. Its `--settings` file carries `<wt>/.git` and no clone `.git` path. The stub's body runs the main checkout's `commit-on-branch.sh --repo <wt> <file> -- "<subject>"` and then `push-branch.sh <wt>`. After the session:
  - `refs/heads/<branch>` in the main checkout carries the commit;
  - `git ls-remote origin <branch>` equals it;
  - the record is classified as the stub's exit says.
- [ ] **A paused legacy run:** the same, through the pause-resume path.
- [ ] **New beside old:** a new task drop for a second branch in the same pass gets a clone (`copy_kind` `clone`). Its per-run profile lists the legacy worktree's pointer among the other-worktree entries.
- [ ] **Sweep:** delete the legacy branch on `origin`, mark the record `completed`, and run `cleanup-merged-worktrees.sh`. The worktree directory and the local branch are gone, and the clone of the second branch is untouched. Run `--dry-run` first in the same case and assert it named the same decision.

**Verification:**

- `npm test --workspace cli -- test/run-copy-migration.test.mjs` passes.
- Every fixture and every per-run profile lives under the system temp directory and the fixture's `XDG_STATE_HOME`.
