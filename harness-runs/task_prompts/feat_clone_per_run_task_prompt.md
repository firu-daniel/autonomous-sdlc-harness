`feat_clone_per_run` gives every autonomous run its own self-contained git repository, a `git clone --shared` of the main checkout, instead of a linked worktree that shares the main checkout's `.git`. The run's `HEAD`, index, refs and config then live inside the run's own copy. The main checkout's `.git` becomes something a sandboxed command never has to write, so the whole of it can be write-denied.

It starts from a `dev` that carries `fix_sandbox_worktree_record_writes` (`sandbox1e`). Read what that branch measured and shipped in `docs/sandbox-verification.md` before designing anything.

**Why.** Two sandbox problems come from the linked-worktree layout.
- **The record write** (`docs/sandbox-verification.md` → the ordinary-git and full-flow rows). Sandboxed git cannot write the worktree's record, `<main>/.git/worktrees/<name>/`, so every unattended run parked at its first commit. `sandbox1e` either found a profile change that opens it or routed the run's git writes through excluded wrappers. Either way the run's ordinary git depends on a write into a directory outside its own copy.
- **The shared object store** (`docs/cli.md` §6 → the residuals list). The sandbox can write `<main>/.git/objects`, and git does not re-hash loose objects it already has, so a run can substitute an object that the main checkout and every other run then trust.

A per-run clone removes both, provided objects reach the main checkout only through a fetch, which verifies what it receives.

**There is no documented reason for the worktree layout.** It began as a manual convenience script (`create-worktree.sh` was `git worktree add` plus `npm install`) and the autonomous flow was built on top of it. The closest stated rationale argues for *a separate checkout per run*, which a clone also gives:
- `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_main_repo`'s "WHY THE MAIN CHECKOUT IS A SEPARATE ANCHOR" comment.

What the layout *does* have is implicit dependencies, several of them load-bearing for security. Every one listed below must be redesigned, not dropped.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The anchors were true at `f2e583e5`. Re-verify each one in the merged code before planning on it, because `sandbox1d`–`sandbox1e` land in between.

## What depends on the shared `.git` today

1. **The main checkout is found as the first entry of `git worktree list`.**
   - In the scripts: `hr_main_repo`, the watcher, and `setup-worktree.sh`.
   - In the plugin's `<MAIN_REPO>` binding: `plugin/instructions/dispatch_discipline_instructions.md`, `task_plan_writing_instructions_autonomous.md`, `autonomous_pause_and_ledger.md`, `improvement_observations_instructions.md`, `clarification_digest_instructions.md` and `plugin/agents/committer.md`.
   - In the `AUTONOMOUS_STOP` checks of the `*_autonomous.md` flow documents and `branch-start-*-autonomous.md`.
   - In the registry and inbox commands `plugin/commands/branch-{prompt,status,answer,pause,resume,user-review}.md`.

   Inside a clone, every one of these silently resolves to the clone, including the global kill switch.
2. **The unsandboxed wrappers trust only a worktree the main checkout lists.** `hr_wrapper_target_check_var` accepts a target only if it is the main checkout, or a copy whose `.git` pointer leads into `<main>/.git/worktrees` with a matching `commondir` and `gitdir`. A clone is exactly the "scratch repository" that check refuses (`docs/sandbox-verification.md` row C1). This is used by:
   - `push-branch.sh`, which runs its git calls in the main checkout and pushes `refs/heads/<branch>` from the main checkout's refs;
   - `refresh-branch.sh`;
   - `setup-worktree.sh --target`;
   - `hr_run_copy_check_var`.
3. **The trusted config and hooks live in `<main>/.git`, which the sandbox cannot write** (`cli/src/generators/writeProtection.ts`). A worktree has no config of its own beyond `config.worktree`, which `hr_worktree_config_check_var` holds to one key and `hr_pinned_hooks_path` pins. A clone's `.git/config`, `.git/hooks` and `objects/info/alternates` sit inside the session's cwd, and are writable unless protected.
4. **The watcher's git calls read the run through the main repository** (`docs/watcher.md` → `### Where the family runs git in a run's copy, and under what pins`).
   - `hr_run_copy_git` runs with `GIT_DIR=<main>/.git` and the record's index.
   - `hr_run_copy_check_var` reads the tip from `worktrees/<name>/HEAD`.
   - `hr_run_main_set_var` refuses any `.git` holding a `commondir`.
   - The fast-forward, the watchdog's reset and the surface check all depend on this.
5. **The run's commits are visible in the main checkout immediately.** That covers `push-branch.sh`, `hr_push_landed`, `cleanup-merged-worktrees.sh` (`git worktree list` plus `[gone]` on the main checkout's local branches), and a user reviewing the branch from the main checkout.
6. **Git's one-branch-one-checkout rule** is a free collision guard. It backs `create-worktree.sh`'s and `--existing`'s "already checked out" refusals and `branch-prompt.md`'s collision guard.
7. **Bootstrap writes into the main checkout's shared config.** `setup-worktree.sh` sets `extensions.worktreeConfig` and a per-worktree `core.hooksPath`. Its env-file and QA-credential symlinks are resolved from `hr_main_repo`.

Not affected:
- **The state directory.** It is already an explicit `--add-dir <MAIN_REPO>/<state_dir>`, though `<MAIN_REPO>` still comes from point 1.
- **The per-copy dependency install.** It is the same either way.
- **How the run loads the plugin.** Re-verify this in the merged code. It must not change.

## Verified git facts (these come from git's own documentation; re-check against the installed git's man pages)

- **`git clone --shared` (`-s`)** sets up `.git/objects/info/alternates` to borrow the source's objects instead of copying them. git warns that objects the source later prunes, after the clone stops being able to reach them through the source's refs, can corrupt the clone. `--dissociate` (with `--reference`) or a later `git repack -a -d` plus removing the alternates file makes the clone stand alone.
- **`git clone --local`** (the default for a path source) hardlinks the object files. A hardlinked file is the same inode as the main checkout's copy, so an in-place overwrite inside the clone changes the main checkout's object. **Do not use it**; `--no-hardlinks` or `--shared` avoid it.
- **A fetch into the main checkout from the clone** receives a pack that `index-pack` hashes as it indexes it, so an object whose content does not match its name is rejected. That is the property that closes the object-substitution residual.
- **Unresolved, to measure:**
  - which of the clone's own config keys a local-transport fetch *from* the clone honours. `git-upload-pack` runs in the clone, and git restricts some `uploadpack.*` keys to protected (system/global) configuration;
  - whether any filter, hook or fsmonitor in the clone runs during that fetch.

## The goal

1. **Measure first, and stop if it fails.** Create a `--shared` clone of the main checkout and launch a sandboxed session with its cwd in the clone, under the profile as `sandbox1e` left it. Record a row in `docs/sandbox-verification.md` for each of:
   - `git add`, `commit`, `fetch`, `stash` and `switch`;
   - a full-flow throwaway task through to branch-ready-for-review.

   If sandboxed ordinary git does not work in the clone, write up what was measured and stop. The rest of this branch depends on it.
2. **One explicit main-checkout anchor.** Replace every "first entry of `git worktree list`" resolution that runs inside a run copy with a value the sandbox cannot forge. Candidates to settle in the plan:
   - an environment variable the watcher sets at launch, which a sandboxed command cannot change in its parent;
   - a file under the main checkout's state directory that the registry already owns.

   A file inside the run copy is sandbox-writable and **must not** be the anchor for unsandboxed code. The plugin's readers need a literal, allow-listable command to read it, following the checkout-root rule in `cli/templates/claude/CLAUDE.md`. A supervised session in the main checkout keeps resolving it as today.
3. **Objects reach the main checkout only by fetch.** `push-branch.sh` and `refresh-branch.sh` keep running every git call in the main checkout under the main checkout's config. The main checkout first fetches `refs/heads/<branch>` from the run's clone into its own refs, then pushes from there.
   - The wrappers' target check is rebuilt around "a run copy the watcher created, at the path the registry recorded". It no longer relies on "a worktree the main checkout lists".
   - The local fetch runs with the same pins the watcher family already applies to a run's copy (hooks off, no fsmonitor, no filters), settled by measuring the unresolved points above.
   - Once fetches are the only route, write-deny the main checkout's whole `.git`.
4. **Protect the clone's own trust surface.** The sandbox must not be able to write the clone's `.git/config`, `.git/hooks` or `objects/info/alternates`, or anything unsandboxed code reads from the clone must not trust them.
   - Prefer exact per-run paths over globs (`docs/cli.md` §6, residual 2: Linux skips `*` entries). One candidate is the watcher rendering a per-run settings overlay with the clone's exact paths. Find out whether Claude Code accepts more than one `--settings`, or whether the watcher renders a per-run copy of the profile.
   - Keep `doctor`'s profile checks grading whatever this produces.
5. **Rebuild the watcher's git family for a self-contained copy.** `hr_run_copy_git`, `hr_run_copy_check_var`, `hr_run_main_set_var`, the fast-forward, the watchdog reset and the surface check all move to the clone's own git dir. They keep pins equivalent to today's and are re-checked against `docs/watcher.md` §2's list.
6. **Replace what git gave for free.**
   - **One-branch-one-checkout:** the registry refuses a second live run copy for the same branch.
   - **Branch visibility:** the main checkout's ref is updated at every point the flows push or checkpoint, so a user reviewing from the main checkout sees what they see today. The docs say where it can lag.
   - **Cleanup:** `cleanup-merged-worktrees.sh` finds run copies from the registry, not from `git worktree list`.
   - **Alternates lifetime:** settle in the plan whether a long-parked run's clone is dissociated, or whether the main checkout's `gc` is otherwise kept from pruning what it borrows.
7. **Migration.** A run that is parked or paused in a linked worktree when this lands must still resume and finish. Either support both layouts until no worktree run is left, or migrate one on resume. State which in the plan and test it. `--existing` keeps working.
8. **The remote job.** Find whether `harness-run.yml`'s job cuts a worktree (it runs `setup-worktree.sh`) and give it the same layout or state why not. As in earlier branches, the real GitHub job is a post-release follow-up, verified here by test over the rendered template.
9. **Docs.**
   - `docs/watcher.md` §2.
   - `docs/cli.md` §6: remove the object-substitution residual and the record-race residuals this branch closes; add any it opens.
   - `docs/sandbox-verification.md`'s rows.
   - Every "worktree" wording that now means "run copy", in the docs and the plugin corpus. Rename deliberately: the `plugin/` corpus quotes its own literals, so a renamed term is an edit to every file that carries it. Keep script names unless the plan argues a rename is worth that cost.

## Constraints

- Every protection that exists today stays:
  - the wrappers' target and configuration refusals;
  - the pinned hooks;
  - the `pre-push` hook;
  - the write protection;
  - the guards.

  A dependency from the list above may be replaced, never just removed.
- Do not use `--local` hardlinks.
- Do not widen `allowWrite`. The point is to need less of it.
- Disk and time per run stay comparable to today. The object store is borrowed, not copied.
- Scripts stay bash 3.2 compatible, and the existing git version floors hold. Check that every git flag this branch relies on is available at them.
- `scripts/run-gates.sh` passes.

## Not in this branch

- The process-level sandbox (`sandbox5b feat_unattended_process_sandbox`). It may change how the record question is answered, but this layout is worth having under either boundary.
- WSL2 support.
