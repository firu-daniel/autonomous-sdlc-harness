### Task 4 — Share the task-prompt placement between the watcher and a job

**Goal:** Move the placement the watcher's inbox pass performs into `cli/templates/scripts/lib/harness-run-lib.sh`, so that a GitHub-side job reuses it rather than copying it (task prompt, goal 2). The placement is: copy the artifact into the working copy, stage exactly that path, skip an identical re-drop, commit through `commit-on-branch.sh` under the fixed subject, push through `push-branch.sh`, and read "landed" as `origin/<branch>` equal to `HEAD`. The watcher's task, docs and review arms call the library afterwards, and Task 6's `remote-run.sh start` calls the same functions.

**Depends on:** Task 2, which last edited `autonomous-watcher.sh`'s `process_inbox_file`, `watcher-remote-dispatch.test.mjs` and `outer-loop-scripts.test.mjs`, and Task 3, which last edited `harness-run-lib.sh`. This task edits all four after them.

**Where this task stops.** The functions place, commit and push, and report by exit status. Every *decision* stays with the caller: the watcher's log lines, `fail_before_launch`, the local arm's "log a WARNING and launch anyway" rule and the remote arm's "block the dispatch" rule. So the watcher's behaviour is byte-for-byte what it is today (acceptance 6). The branch cut is not here: it stays in `create-worktree.sh` (Task 5 adds its no-bootstrap mode). The new verb that calls these functions from a job is Task 6's.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — five functions, and write exception 4 in the header.
- `cli/templates/scripts/autonomous-watcher.sh` — `remote_commit_and_push` and the task and docs arms of `process_inbox_file` call the library.
- `cli/test/outer-loop-scripts.test.mjs` — library cases.
- `cli/test/watcher-remote-dispatch.test.mjs` — one case for the moved remote path.

**Work:**

- [ ] **The library functions**, in a new section *THE ARTIFACT PLACEMENT* with its contract comment:
  - `hr_task_prompt_rel <state_rel> <branch>` prints `<state_rel>/task_prompts/<branch>_task_prompt.md`, with `<state_rel>`'s trailing `/` dropped;
  - `hr_task_prompt_subject <branch>` prints `chore: add task prompt for <branch>`. This is the one producer of that fixed subject, which `.claude/context/conventions.md` → `## Commit-message policy` lists byte for byte;
  - `hr_place_artifact <worktree> <src_file> <rel>` runs `mkdir -p` on the parent, then `cp`: 0, or 1 on a failure;
  - `hr_commit_placed <commit_wrapper> <worktree> <rel> <subject>` stages `<rel>` with `git -C <worktree> add -- <rel>`. When `git -C <worktree> diff --cached --quiet -- <rel>` shows nothing staged it returns **3** (an identical re-drop, nothing committed). Otherwise it runs `<commit_wrapper> --repo <worktree> <rel> -- <subject>` and returns 0 when the wrapper did, 1 otherwise;
  - `hr_push_landed <push_wrapper> <worktree> <branch>` runs `<push_wrapper> <worktree>`, then returns 0 only when `HEAD` and `refs/remotes/origin/<branch>` both resolve and are equal, and 1 otherwise. `push-branch.sh` exits 0 on every path, so its status is never the answer.

  The two wrapper paths are arguments because the library resolves no sibling script itself. Wrapper output goes to the function's own stdout and stderr, and the caller redirects it. Add **write exception 4** to the header's list: its fence is the caller-named `<worktree>/<rel>`, its parent directories and that path's index entry, plus whatever the two caller-named wrappers do; written only by `hr_place_artifact`, `hr_commit_placed` and `hr_push_landed`. Extend the paragraph after the list that names every writing function.
- [ ] **`remote_commit_and_push`** keeps its signature, its three log lines and both `fail_before_launch` calls, but its body calls the library:
  - `hr_commit_placed "$COMMIT_ON_BRANCH" "$worktree" "$rel" "$subject" >>"$log_path" 2>&1`, where 3 is the *identical re-drop … pushing anyway* line and 1 is the commit failure;
  - then `hr_push_landed "$PUSH_BRANCH" "$worktree" "$branch" >>"$log_path" 2>&1`, where 1 is the push failure.

  It still receives `<dest>` for the caller's log line and passes `<rel>` to the library.
- [ ] **The task arm**: the prompt's copy uses `hr_task_prompt_rel "$state_rel" "$branch"` and `hr_place_artifact`, and its subject uses `hr_task_prompt_subject "$branch"` in both the remote call and the local block. The local block calls `hr_commit_placed` with the same three outcomes it logs today: identical → the skip line; 0 → the committed line followed by the separate `"$PUSH_BRANCH"` statement and its WARNING; 1 → the *launching anyway* WARNING. **The docs arm** does the same with its own `docs_rel` and subject. Its comment says it mirrors the task path. **The review arm** keeps its `cmp -s` different-content refusal before the copy; only its remote commit already goes through `remote_commit_and_push`. Keep the long *THE COMMIT DECISION* comment where it is and add one sentence naming the library as where the placement now lives.
- [ ] **`outer-loop-scripts.test.mjs`**: one `test(...)` over a fixture with a bare `origin`:
  - `hr_place_artifact` then `hr_commit_placed` returns 0 and leaves one commit whose subject is exactly `chore: add task prompt for feat_x`, touching only the placed path;
  - a second call with identical bytes returns 3 and adds no commit;
  - `hr_push_landed` returns 0 once `origin/feat_x` equals `HEAD`, and 1 against a push wrapper stub that pushes nothing.
- [ ] **`watcher-remote-dispatch.test.mjs`**: add a remote-arm case for an identical task-prompt re-drop whose earlier push failed. The file's existing *"a failed push sends no `workflow run`"* setup is followed by a second drop of the same bytes with pushing restored. It must log the *already committed (identical re-drop) — skipping the commit, pushing anyway* line, land the push, and send exactly one `workflow run`. This is the one remote path the moved code changes the shape of.

**Verification:**

- `npm test -- test/outer-loop-scripts.test.mjs` and `npm test -- test/watcher-remote-dispatch.test.mjs` from `cli/` pass, with every case `watcher-remote-dispatch.test.mjs` carried before this task unchanged.
- `grep -n "chore: add task prompt for" cli/templates/scripts/autonomous-watcher.sh` finds only comments. `grep -n "chore: add task prompt for" cli/templates/scripts/lib/harness-run-lib.sh` finds the one producer.
- `grep -n "diff --cached --quiet" cli/templates/scripts/autonomous-watcher.sh` prints nothing: the identical-re-drop test lives only in the library.
