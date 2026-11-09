`fix_inbox_drop_branch_refusal` makes the watcher refuse an inbox drop whose branch is protected, or not a valid branch name, at intake. Today it finds out only when the first commit fails.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Line numbers given were true at `802fe43d` (v0.6.7) and are hints only.

---

## What is there today

- `hr_inbox_route_var` (`cli/templates/scripts/lib/harness-run-lib.sh`) takes the branch from the filename's prefix and checks nothing else. `process_inbox_file` (`autonomous-watcher.sh`) goes on to create the worktree, place and commit the prompt, and launch.
- A drop named `main_task_prompt.md` therefore gets as far as `create-worktree.sh`, and then a refusal from `commit-on-branch.sh` (`hr_branch_is_protected`). Depending on what the main checkout has checked out, it may also leave a worktree on a protected branch behind.
- **The other entry points already refuse:**
  - `/autonomous-sdlc-harness:branch-prompt` goes through `hr_branch_taken_judge`, which answers "a protected branch".
  - The remote job's `job` arm refuses with "refused: '<branch>' is a protected branch, or its protection is unresolvable".
  - `remote-run.sh` refuses at each of its `control_check_branch` sites.
- The inbox is the one path a file can be dropped into by hand, or by any process that can write to the main checkout. **That now includes every sandboxed command of every unattended run:** the inbox sits under `<main>/<stateDir>/`, which is the unattended profile's one `sandbox.filesystem.allowWrite` grant since `feat_unattended_bash_sandbox`, so an intake refusal is the only check a run-written drop meets before the watcher acts on it.

## The goal

1. **The watcher refuses at intake.** It refuses when the derived branch is protected or unresolvable, or fails `git check-ref-format --branch`. Use the same `rejected_<ts>_<name>` archive and notification as an unroutable filename. The log line says why. Nothing is created, committed or launched.
2. **Same rule for every engine.** That means `_task_prompt.md`, `_review[_<n>].md` and `_docs.md`. A user-review drop for a protected branch is refused the same way.
3. **Remote drops too.** If `execution.target` routes the drop to GitHub, refuse before `launch_remote_run` rather than relying on the job's own refusal. This saves a dispatch, and the user sees the reason locally.
4. **Tests** in the existing watcher intake suite: a protected name, an invalid name (for example `..` or a trailing `.lock`), an unresolvable protected set, and a valid name that still launches.
5. **Docs.** Add the new refusal to the watcher header's intake table (the block listing `notes.md -> archived as rejected_<ts>_notes.md`) and to `cli/templates/state-dir/autonomous_inbox` README if it lists refusals.

## Constraints

- Reuse `hr_branch_is_protected`. Do not add a second matcher.
- `scripts/run-gates.sh` must pass.

