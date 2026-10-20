### Task 1 — Move every clone ref clone-first, heal a strictly-behind clone at sync-in, and extract the one-live-copy rule, in the run library

**Goal:** Change `cli/templates/scripts/lib/harness-run-lib.sh` in one place. It gains:
- one helper that moves a branch on a clone by compare-and-swap, clone ref first, main checkout second, with a rollback;
- that helper in place of "move the main checkout, then sync out" in the library's commit and fast-forward;
- a sync-in that heals a clone that is strictly behind;
- the one-live-copy rule as a function of its own;
- the per-run profile's lane-directory path, named beside the lane directory's other artifacts;
- a clone whose refs are only those the main checkout keeps alive for the run's life.

This task is the only one that edits the library. Every other task calls what it defines.

**Where this task stops.** It changes the library and its section headers and nothing else. The three wrappers are Task 4's, even where they call the new helper, and so is their `refresh-branch.sh` / `push-branch.sh` use of it. `create-worktree.sh`'s use of the one-live-copy rule is Task 7's. The suites that lock this behaviour in are Tasks 2 and 3. Verify by hand here (below), not with a suite.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`

**Work:**

- [ ] **`hr_copy_ref_swap_var <main> <gitdir> <ref> <new> <old> <reflog>`**, new, in the section *THE CLONE ARM'S SYNC*. It leaves `HR_SYNC_REFUSAL` set to one sentence naming both tips on every non-zero exit.

  On a clone (`hr_copy_kind` is `clone`, judged against the canonical main exactly as `hr_copy_sync_out_var` judges it), in order:
  1. Compare-and-swap the **clone's** `<ref>` from `<old>` to `<new>` through `hr_clone_git … update-ref`. If that fails, return `4`: the clone's ref moved since sync-in, nothing moved.
  2. Compare-and-swap the **main checkout's** `<ref>` from `<old>` to `<new>` through `hr_copy_sync_main_git … update-ref -m <reflog>`.
  3. If step 2 fails, roll the clone back by compare-and-swap from `<new>` to `<old>`. The rollback succeeded: return `4`. It failed too: return `5`. That is the one state where the clone is ahead and the main checkout is not.

  On the main checkout or a worktree it is the main-checkout swap alone, returning `0` or `4`. Return `0` when both moved.

  It also takes a verify-only form for `push-branch.sh` (Task 4): `<new>` equal to `<old>` is a locked compare-and-swap of the clone's ref onto itself, which proves the ref still holds the tip sync-in read. Keep the section's globals contract: it reads or writes no `HR_RUN_*` global. bash 3.2 and git 2.23 only.
- [ ] **`hr_commit_paths_var` and `hr_run_fast_forward_var` move through the helper**, clone first, instead of `update-ref` on the main checkout followed by `hr_copy_sync_out_var`.
  - **`hr_commit_paths_var`:**
    - Helper `4`: the existing branch-moved return `4`, with the existing `sync=always` index handling.
    - Helper `5`: the commit stands on the clone's ref and the main checkout lags, which the next sync-in fast-forwards. Report it through the existing landed path: `HR_COMMIT_NEW` is set and `HR_COMMIT_SYNC_FAILED=1`, and `HR_COMMIT_REFUSAL` says the main checkout's ref could not follow.
    - The `commit-on-branch.sh: committed <short_sha> on <branch>, but ` wire the plugin's instructions key on (`plugin/instructions/autonomous_pause_and_ledger.md` §1.6) keeps its meaning: the commit landed.
  - **`hr_run_fast_forward_var`:** the dry-run `read-tree`, then the swap, then the real `read-tree`. On a real-`read-tree` refusal it puts both refs back through the helper with `<new>` and `<old>` exchanged. Its documented exits `0` / `1` / `5` keep their meanings, and `5` now also covers a failed put-back of either side.
  - Make sure `hr_commit_placed`'s statuses are unchanged for its callers (`autonomous-watcher.sh`, `remote-run.sh`).
- [ ] **`hr_copy_sync_in_var` heals a strictly-behind clone.** Today the branch where the clone is an ancestor of the main checkout's tip (*"the clone is behind the main checkout, so a sync-out did not complete"*) refuses. Instead:
  - fast-forward the clone's `refs/heads/<branch>` to the main checkout's by compare-and-swap through `hr_clone_git` (from the clone's tip that `ls-remote` read, to `main_old`), then proceed as a no-op sync with `HR_SYNC_TIP` set to `main_old`;
  - a heal whose compare-and-swap fails is a refusal naming the step;
  - a diverged clone still refuses with its existing sentence.

  Update the function's header comment: *"a clone that is behind (a sync-out did not complete)"* is no longer a refusal.
- [ ] **The one-live-copy rule, extracted.** Move `hr_clone_create_var`'s second-live-copy test into a new `hr_run_copy_live_var <main> <branch>`:
  - the derived path `hr_worktree_dir` gives, existing in any form;
  - the registry's `worktree` for `<branch>` naming a path that exists, read with `hr_registry_peek`, never creating the file;
  - the main checkout or a worktree of it having `<branch>` checked out, from `git worktree list --porcelain`.

  It returns `0` with `HR_LIVE_COPY` (the path) and `HR_LIVE_COPY_WHY` (one clause) set when a live copy exists, `1` when none does, and `2` when it cannot tell. `hr_clone_create_var` calls it and keeps its own refusal sentences.

  In the same function, the clone's `refs/remotes/origin/` is no longer every one of the main checkout's. It holds only `refs/remotes/origin/<defaultBranch>` (with the `origin/HEAD` symref when the main checkout has one) and `refs/remotes/origin/<branch>` when the main checkout has it. Those are the refs the main checkout keeps reachable for the run's life, so its `gc` cannot prune what the clone's refs name.

  **The per-run profile's path, owned here.** In the lane-directory section, beside `hr_lane_state_file` and `hr_lane_lock_dir`, add `hr_run_profile_file <repo slug> <branch>`. It prints `<hr_lane_dir>/run-profiles/<slug>/<hr_sanitize_branch branch>.json` and returns `1`, printing nothing, when `hr_lane_dir` cannot anchor. It creates nothing: the caller makes the directory. Its comment names its one caller, `autonomous-watcher.sh`'s `run_profile_render` (Task 13). Restate the comment *"The two artifact paths, so no caller re-joins either string"* to cover the three paths, and add `run-profiles/<slug>/<branch>.json` to the section header's artifact list (*"TWO ARTIFACTS, BOTH UNDER `hr_lane_dir`"* becomes three): the per-run settings copy the watcher writes at every launch, re-rendered at every spawn.
- [ ] **Restate the section headers.**
  - *THE CLONE ARM'S SYNC* now describes "sync in; operate; move the clone's ref first by compare-and-swap against the tip sync-in read, then the main checkout's; roll the clone back on a failed main swap". It also names the paths that still move the main checkout first: `push-branch.sh`'s `origin/<branch>` mirror and `refresh-branch.sh`'s fetched-base mirror, both remote-tracking refs no run commits to. And it states that sync-in heals a strictly-behind clone.
  - *THE WATCHER FAMILY'S GIT IN A RUN'S COPY*: replace *"and out after every ref this section moves (`hr_copy_sync_out_var`)"* with the helper.
  - *CREATING AND REMOVING A RUN'S CLONE*: *"No script calls either"* becomes the callers: `create-worktree.sh`, `remote-run.sh` and `cleanup-merged-worktrees.sh`, from Tasks 7, 11 and 9.
  - Add the alternates reasoning to `hr_clone_create_var`'s header: why only those refs, and that dissociating would copy the whole history.
  - **Restate the three caller rules this branch's scripts would otherwise break** (`.claude/context/cli.md` → `## What "done" means here`: a change satisfies its module's header or amends it in the same edit). Tasks 7 and 11 do not own the library, so the amendment lands here:
    - `hr_registry_drop`'s comment, *"only `hr_clone_create_var`'s rollback calls it"*, names its callers after this branch: `hr_clone_create_var`'s rollback, `create-worktree.sh`'s failure rollback (Task 7) and `remote-run.sh`'s `start_remove_copy` (Task 11).
    - `hr_registry_restore`'s comment, the same sentence, names its callers after this branch: `hr_clone_create_var`'s rollback and `create-worktree.sh`'s failure rollback (Task 7), which puts a previous record back.
    - `hr_clone_create_var`'s refusal clause *"a registry directory that does not exist, since only the watcher makes it"* names both creators of the registry directory: the watcher (`autonomous-watcher.sh`'s `mkdir -p` of its logs directory) and `create-worktree.sh` when a trigger job's fresh checkout has none (Task 7). The refusal itself is unchanged: the function still refuses a missing registry directory and still creates none.
  - **Restate the file header's write-exception list** (*"THE WRITE EXCEPTIONS TO "WRITES NOTHING", AND THEIR FENCES"*), whose own rule is *"a section that adds a writer adds its entry here"*. This task changes the library's writes four ways, and the list must say so after this edit:
    - **Exception 6:** add `hr_copy_ref_swap_var` to the *"Written only by `hr_copy_sync_in_var`, `hr_copy_sync_out_var`, `hr_clone_create_var` and `hr_clone_remove_var`"* list. Restate the fence so it covers the helper: a compare-and-swap `update-ref` of the clone's `refs/heads/<branch>` first, then of the main checkout's, and on a failed main swap a compare-and-swap rollback of the clone's ref from `<new>` to `<old>` (the verify-only form writes the clone's ref onto itself). State that sync-in, besides what it writes in the main repository, now moves the clone's `refs/heads/<branch>` when it heals a strictly-behind clone, only by compare-and-swap from the tip `ls-remote` read to the main checkout's tip.
    - **Exception 4:** replace *"On a clone, `hr_commit_paths_var` also syncs the moved ref out to the clone's `refs/heads/<branch>` through `hr_copy_sync_out_var` (exception 6)"* with: on a clone, `hr_commit_paths_var` moves the clone's `refs/heads/<branch>` first and the main checkout's second through `hr_copy_ref_swap_var` (exception 6).
    - **Exception 5:** replace *"and, on a clone, the clone's `refs/heads/<branch>` through `hr_copy_sync_out_var`"* with the same clause through `hr_copy_ref_swap_var` (clone first, rollback on a failed main swap). In the `hr_run_copy_check_var` clause, add that its sync-in on a clone may also heal the clone's `refs/heads/<branch>` by compare-and-swap.
    - **Exception 5's runner example:** drop the parenthetical *"(`create-worktree.sh`'s `worktree add`, `read-tree` and cleanup `worktree remove`)"*, because Task 7 deletes all three calls; the sentence keeps its rule that a caller driving a writing git command through `hr_run_main_git`, `hr_run_copy_git` or `hr_copy_git_at` owns that write.
    - **The closing "only reads" list** (*"A caller that calls no … function still gets a library that only reads"*): add `hr_copy_ref_swap_var`. `hr_run_copy_live_var` and `hr_run_profile_file` write nothing and are not added.
  - In `hr_remote_state_dir_var`'s header, the sentence ending *"whose loose-object substitution is `docs/cli.md` §6 residual 1, item 6"* cites a residual this branch closes. Task 5 write-denies the checkout's whole `.git` in every profile, the job's included, so a session can no longer write a loose object. Restate the sentence to say that, citing no residual number.

**Verification:**

- By hand, against a throwaway `git init` fixture under the system temp directory carrying a `harness.config.json` and a bare `origin`, never this checkout. Make a clone with `hr_clone_create_var`, sync it in with `hr_copy_sync_in_var`, then commit once more **in the clone** from a terminal. Then call `hr_copy_ref_swap_var` with the old tip. It returns `4`, and `git rev-parse` of the clone's and the main checkout's `refs/heads/<branch>` are both unchanged.
- In the same fixture, move the clone's ref back by hand so it is strictly behind the main checkout. `hr_copy_sync_in_var` now returns `0` and leaves the two refs equal. Make the clone diverge instead, and it returns `1` with the "have diverged" sentence.
- `git -C <clone> for-each-ref refs/remotes/origin/` after `hr_clone_create_var` lists only `origin/<defaultBranch>` (and `origin/HEAD`) and, when the main checkout has it, `origin/<branch>`.
- Sourcing the library with `XDG_STATE_HOME` pointed at the fixture, `hr_run_profile_file my-slug feat/x` prints `<XDG_STATE_HOME>/autonomous-sdlc-harness/run-profiles/my-slug/<what hr_sanitize_branch prints for feat/x>.json` and creates nothing. With `XDG_STATE_HOME` and `HOME` both empty it prints nothing and returns `1`.
- `grep -n "only \`hr_clone_create_var\`'s" cli/templates/scripts/lib/harness-run-lib.sh` and `grep -n "only the" cli/templates/scripts/lib/harness-run-lib.sh` return no line that still restricts `hr_registry_drop`'s or `hr_registry_restore`'s callers to `hr_clone_create_var`'s rollback, or the registry directory's creator to the watcher.
- `grep -n 'hr_copy_ref_swap_var' cli/templates/scripts/lib/harness-run-lib.sh` reaches the file header's exception 6 (its *"Written only by"* list) and the closing *"still gets a library that only reads"* list, as well as the function itself and its callers.
- Reading exceptions 4–6 of the file header: no line still says a clone's `refs/heads/<branch>` is moved through `hr_copy_sync_out_var`, exception 6's fence names sync-in's heal of the clone's ref, and exception 5 no longer names `create-worktree.sh`'s `worktree add`, `read-tree` or `worktree remove`.
- `bash -n` on the library under macOS `/bin/bash` (3.2) exits 0.

- **Deviations from plan:**
  - `hr_copy_ref_swap_var` has a fourth exit the plan did not list: `1`, for refused arguments (a non-object-id `<new>`/`<old>`, a ref outside `refs/heads/`, an invalid ref name, a `<main>` that is not a main checkout, a clone gitdir not ending in `/.git`), with nothing moved and `HR_SYNC_REFUSAL` set. `hr_commit_paths_var` maps it to its `1` (refused, `HR_COMMIT_NEW` empty); `hr_run_fast_forward_var` maps it to its `1`.
  - The verify-only form (`<new>` equal to `<old>`) on a clone swaps the clone's ref onto itself and never touches the main checkout's; on the main checkout or a worktree it is the main swap onto itself. `push-branch.sh` (Task 4) only has `HR_SYNC_TIP` on a clone, so Task 4 should call it on the clone arm only.
  - On helper `5`, `hr_commit_paths_var` also applies the committed records to the clone's index, since the clone's ref now holds the commit; a failure there is appended to `HR_COMMIT_REFUSAL`. Exit and `HR_COMMIT_SYNC_FAILED=1` are as planned.
  - The by-hand verification ran as a Python probe through `bash scripts/scratch-run.sh` (fixture under the system temp directory via `tempfile.mkdtemp`, removed afterwards), not from an interactive terminal; the "commit in the clone from a terminal" step is a `git commit` subprocess in the clone. Every bullet passed, plus positive controls for the swap, `hr_commit_paths_var` and `hr_run_fast_forward_var`, a fast-forward race (returns `1`, main ref unchanged), a failed main swap via a planted `.lock` (returns `4`, clone rolled back), and the three `hr_run_copy_live_var` `0` conditions and its `1` / `2`. Helper exit `5` was not exercised (needs a shim; Task 2's suite covers it).
  - `cli/test/clone-sync.test.mjs` (the `/the clone is behind the main checkout/` assertion) and `cli/test/run-copy-clone-arm.test.mjs` (the same assertion in case (b)) now fail against this library: the state they assert is a heal now. Tasks 3 and 2 own those rewrites; `bash scripts/test.sh` is deferred to the Run gates phase.
