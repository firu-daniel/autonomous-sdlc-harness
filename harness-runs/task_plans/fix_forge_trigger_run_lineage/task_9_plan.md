### Task 9 — Move `branch-answer` and `branch-user-review` to a fixed scratch directory removed by `discard`

**Goal:** Give `/autonomous-sdlc-harness:branch-answer` and `/autonomous-sdlc-harness:branch-user-review` a fixed, gitignored, in-tree directory, created and removed with literal commands, in place of their `mktemp -d` directory and `mktemp` file. This is the same defect class as Task 8. The prompt names `branch-answer`, and `branch-user-review` carries the identical pattern, so it is fixed here too.

**Depends on:** Task 7, which provides `bash <scripts_dir>/remote-run.sh discard <dir>`:
- `<dir>` is relative to the caller's directory.
- Exit 0: removed, or absent.
- Exit 2: not strictly inside `<state_dir>/scratch/`; nothing is removed.
- Exit 1: usage, configuration or removal failure.

Task 7 also documents `<state_dir>/scratch/<command>-<branch_fold>/`. It defines `<branch_fold>` as the branch with every character outside `A-Za-z0-9_-` replaced by `_` (for example, `feat/recent_searches_panel` gives `feat_recent_searches_panel`). The fold keeps the name to one path segment that `discard` always accepts. Two branches that fold alike are safe, because the leftover check stops the second command. `remote-run.sh fetch <branch> <out_dir>` (an existing, empty `<out_dir>`), `dispatch … --answers-from <dir>` and `review <branch> --review-file <file>` are unchanged.

**Where this task stops.** Only these two command files. Task 8 makes the identical change in `branch-pause` and `branch-resume`.

### Targets

- `plugin/commands/branch-answer.md`: the `## Resolved values` lead sentence, the `<scripts_dir>` row, step 2's no-record prefix bullet, step 8's lead sentence and its sub-steps 1, 3 and 4, and the closing paragraph.
- `plugin/commands/branch-user-review.md`: the `## Resolved values` lead sentence, the `<scripts_dir>` row, step 2's no-record prefix bullet, step 7, and the closing paragraph.

**Work:**

- [ ] **`branch-answer.md`**: replace `<tmp>` with `<scratch>`, which is `<state_dir>/scratch/branch-answer-<branch_fold>/`. State the fold rule, and its `feat/recent_searches_panel` → `feat_recent_searches_panel` example, where `<scratch>` is defined, because the agent applies it when writing the literal path. Replace both `mktemp -d` sentences with the literal sequence below.
  1. If `<scratch>` already exists, report it as the leftover of an interrupted invocation, or of another branch that folds to the same name. Name `bash <scripts_dir>/remote-run.sh discard <scratch>`, and stop.
  2. Otherwise `mkdir -p <scratch>`.
  3. `fetch <branch> <scratch>` once (step 2 or step 8.1, as today), with the **unfolded** branch.
  4. Write each answer to `<scratch>/answers/answer_<n>.md`.
  5. Dispatch with `--answers-from <scratch>/answers`.
  6. On every path after the `mkdir`, end with `bash <scripts_dir>/remote-run.sh discard <scratch>`.

  Step 8's lead sentence says "nothing is written into a mirror or the state directory". Correct it to "nothing is written into a mirror, and nothing in the state directory outside `<scratch>`". Do the same in step 8.3's "never to the state directory" and in the closing paragraph's "writes only under its temporary directory".
- [ ] **`branch-user-review.md`**: the same directory scheme, `<scratch>` = `<state_dir>/scratch/branch-user-review-<branch_fold>`, with the fold rule stated where it is defined, for step 2's fetch. `fetch` and `review` take the unfolded `<branch>`. Step 7 writes the review text verbatim with the Write tool to `<scratch>/review.md`, creating `<scratch>` first with the same leftover check if step 2 did not already, and then runs `bash <scripts_dir>/remote-run.sh review <branch> --review-file <scratch>/review.md`. It ends with `discard <scratch>` on every path. The closing paragraph's "writes one temporary file" names the scratch file instead. Rename `<tmp>` / `<tmpfile>` and update the lead sentence that lists them.
- [ ] **Both files**: the `<scripts_dir>` row names `discard` among the verbs invoked. Every command is written with real values substituted, and with no `$(…)`, pipe or shell variable.

**Verification:**

- `git grep -nE 'mktemp|<tmp>|<tmpfile>|temporary (directory|file)' -- plugin/commands/branch-answer.md plugin/commands/branch-user-review.md` prints nothing.
- `git grep -n 'scratch/branch-' -- plugin/commands/branch-answer.md plugin/commands/branch-user-review.md` shows each file's own `branch-answer-<branch_fold>` or `branch-user-review-<branch_fold>` directory, never a raw `<branch>`. `git grep -n 'A-Za-z0-9_-' --` on the same two files shows the fold rule stated in each. Every path through each GitHub-route step ends in a `discard` sentence; read step 8 of `branch-answer.md` from each early "stop" forward to confirm it.
- `--answers-from <scratch>/answers` and `--review-file <scratch>/review.md` match the argument shapes `remote-run.sh`'s header states for `dispatch` and `review`.
