### Task 6 — Add `remote-run.sh start`: place a task prompt on a new branch and dispatch it

**Goal:** Build the platform-neutral half of the adapter shape *event → (branch, task text) → placement → dispatch*. `remote-run.sh start <branch> --prompt-file <file> [--repo <root>]` does four things:

1. cuts `<branch>` from `origin/<defaultBranch>` through `create-worktree.sh --no-bootstrap`;
2. places the file as `<state_dir>/task_prompts/<branch>_task_prompt.md`, commits it as `chore: add task prompt for <branch>` and confirms it landed on `origin/<branch>`, all through the library functions the watcher uses;
3. dispatches `harness-run.yml` with `action=run`, `engine=task`, `resume=none` and `chain=0` through the existing `verb_dispatch`, the one shell-side producer of those inputs;
4. leaves the run exactly where a locally dropped remote run is after the watcher's dispatch.

Task 7's `trigger` and Task 8's dispatch adapter both end in this verb. A later adapter (Jira through `repository_dispatch`, or anything else) plugs in here without a rework.

**Depends on:**

- Task 4's library functions:
  - `hr_task_prompt_rel <state_rel> <branch>` → prints the prompt's repo-relative path;
  - `hr_task_prompt_subject <branch>` → prints `chore: add task prompt for <branch>`;
  - `hr_place_artifact <worktree> <src_file> <rel>` → 0 or 1;
  - `hr_commit_placed <commit_wrapper> <worktree> <rel> <subject>` → 0 committed, 3 identical and nothing committed, 1 failed;
  - `hr_push_landed <push_wrapper> <worktree> <branch>` → 0 when `origin/<branch>` equals `HEAD`, else 1.
- Task 5's `create-worktree.sh --no-bootstrap <branch>`, which cuts and pushes the branch without running `setup-worktree.sh`; 0 on success.

**Where this task stops.** `start` writes **no registry record**. A job has no registry, and a local maintainer's record for such a run comes from Task 10's `adopt`, not from here. It derives no branch name (the caller passes one; Task 3 derives it), authorises nobody, comments nowhere and looks up no run URL. Those are the event adapter's (Task 7). It does not replace the watcher's own inbox path, which already calls the same library functions (Task 4).

### Targets

- `cli/templates/scripts/remote-run.sh` — the verb, its argument parsing, its header entries, usage line and REPRO.
- `cli/test/remote-start.test.mjs` (new) — the verb's contract.

**Work:**

- [ ] **Arguments and gate.**
  - Add `start` to the verb list and `usage()`. `--prompt-file <file>` is a `start` option; any other verb given it is a usage error, and `start` without it is a usage error.
  - Resolve a relative `--prompt-file` against the caller's directory before the script's `cd "$root"`, exactly as `bundle_dir` is resolved.
  - `start` falls under the existing sending-verb gate (the `*)` arm): `execution.target` other than `github-actions` → exit 2, nothing sent or written.
  - `root` is `hr_main_repo` of the working directory, like the other sending verbs. In a trigger job that is the job's checkout of the default branch.
- [ ] **`verb_start`**, in this order, stopping at the first failure:
  1. `hr_branch_is_protected "$root" "$branch"`: 0 → exit 2 *"refused, nothing written: <branch> is protected"*; 2 → exit 2 *"cannot judge whether <branch> is protected"*.
  2. The prompt file is a readable regular file, else exit 2.
  3. `bash "$script_dir/create-worktree.sh" --no-bootstrap "$branch"`, with its output to stderr; non-zero → exit 4 naming its status.
  4. The worktree is `hr_worktree_dir "$root" "$branch"`, and `<state_rel>` is `hr_state_dir` of that worktree (the resolution the watcher's `run_state_dir` makes: in the prepared copy, never the main checkout); unresolvable → exit 4.
  5. `hr_place_artifact`, then `hr_commit_placed "$script_dir/commit-on-branch.sh" …` with `hr_task_prompt_subject "$branch"` (1 → exit 4; 3 is impossible on a fresh branch, so treat it like 0), then `hr_push_landed "$script_dir/push-branch.sh" …` (1 → exit 4).
  6. Set `engine=task`, `resume=none`, `chain=0` and call `verb_dispatch`, which exits 3 on a `gh` failure. At that point the branch and its prompt are pushed, and the message says so.
  7. Print `remote-run.sh: started <branch> (worktree <dir>)`.

  Every exit-4 message names the step that failed and says nothing was dispatched.
- [ ] **Header.**
  - Add `start` to *THE VERBS AND THE EXIT MAP* and extend the map: `4` means placement failed (branch cut, copy, commit or push) and nothing was dispatched; `3` for `start` means the dispatch failed after the branch was pushed.
  - Add a paragraph *`start` IS THE ADAPTERS' ONE ENTRY*: what it does, why it writes no registry, and that it runs the same library placement as the watcher's inbox pass, so nothing downstream knows where a task came from.
  - Amend *WHAT IT NEVER DOES*, which says *"never pushes"*: `start` pushes, and only through `create-worktree.sh` and `push-branch.sh`.
  - Add REPRO lines for success, a protected branch (`main`) → 2, and a missing prompt file → 2.
- [ ] **`cli/test/remote-start.test.mjs`** opens with its rule: *a start sends the run's inputs only once the prompt is committed on `origin/<branch>`, and a refusal sends nothing*. Build a fixture `init` wired with `execution.target` `github-actions`, a bare `origin` carrying the default branch and the scripts, and the recorder `gh` stub `remote-run.test.mjs` uses (`HARNESS_GH_CLI`, argument vectors appended as JSON lines). Cases:
  - success: `origin/feat_x` carries exactly one new commit with subject `chore: add task prompt for feat_x`, touching only `<state_dir>/task_prompts/feat_x_task_prompt.md` with the file's exact bytes. The stub log holds exactly one `workflow run harness-run.yml --ref feat_x -f action=run -f branch=feat_x -f engine=task -f resume=none -f chain=0`, and the registry file is absent or unchanged;
  - `start main` → exit 2, no `gh` call, and `origin` unchanged;
  - `execution.target` `local` → exit 2 and no `gh` call;
  - a missing `--prompt-file` path → exit 2;
  - a `feat_x` that already exists on `origin` → exit 4 and no `workflow run`;
  - a stub that fails `workflow run` → exit 3 while `origin/feat_x` carries the prompt commit.

**Verification:**

- `npm test -- test/remote-start.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `grep -n "action=run" cli/templates/scripts/remote-run.sh` shows the inputs composed only inside `verb_dispatch` (and its payload measure): `verb_start` builds no `workflow run` of its own.
