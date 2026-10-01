### Task 8 — Move `branch-pause` and `branch-resume` to a fixed scratch directory removed by `discard`

**Goal:** Give the no-record prefix bullet of `/autonomous-sdlc-harness:branch-pause` and `/autonomous-sdlc-harness:branch-resume` a fixed, gitignored, in-tree directory in place of `mktemp -d`. The directory is created and removed with literal commands, so an auto-mode session needs no substitution and no out-of-tree delete, and nothing is left behind.

**Depends on:** Task 7, which provides `bash <scripts_dir>/remote-run.sh discard <dir>`:
- `<dir>` is relative to the caller's directory.
- Exit 0: removed, or absent with the line `… does not exist; nothing removed`.
- Exit 2: `<dir>` is not strictly inside `<state_dir>/scratch/`; nothing is removed.
- Exit 1: usage, configuration or removal failure.

Task 7 also documents `<state_dir>/scratch/<command>-<branch_fold>/` as these commands' fetch directory. It defines `<branch_fold>` as the branch with every character outside `A-Za-z0-9_-` replaced by `_` (for example, `feat/recent_searches_panel` gives `feat_recent_searches_panel`). The fold keeps the name to one path segment that `discard` always accepts. Two branches that fold alike are safe, because the leftover check stops the second command. `remote-run.sh fetch <branch> <out_dir>` is unchanged: `<out_dir>` must be an existing, empty directory.

**Where this task stops.** Only the two command files. `branch-answer` and `branch-user-review` are Task 9's. The prose in `docs/remote-execution.md` is Task 10's.

### Targets

- `plugin/commands/branch-pause.md`: the `## Resolved values` lead sentence's `<tmp>` mention, the `<scripts_dir>` row's list of verbs, step 2's no-record prefix bullet, and the closing scope paragraph.
- `plugin/commands/branch-resume.md`: the same four places.

**Work:**

- [ ] **`branch-pause.md` step 2's prefix bullet.** Replace "Make a temporary directory with `mktemp -d` … remove that directory before this command ends, on every path" with the sequence below, each command a literal:
  0. Fold the branch: `<branch_fold>` is `<branch>` with every character outside `A-Za-z0-9_-` replaced by `_`. State this rule, and its `feat/recent_searches_panel` → `feat_recent_searches_panel` example, in the bullet itself, because the agent applies it when writing the literal path. `<scratch>` is `<state_dir>/scratch/branch-pause-<branch_fold>`.
  1. If `<scratch>` already exists, it is a leftover of an interrupted invocation, or of another branch that folds to the same name. Report it, name `bash <scripts_dir>/remote-run.sh discard <scratch>` as the way to clear it, and stop. Never remove a directory this invocation did not create.
  2. Otherwise run `mkdir -p <scratch>`.
  3. Run `bash <scripts_dir>/remote-run.sh fetch <branch> <scratch>` once. `fetch` takes the **unfolded** branch, because that is the branch GitHub knows.
  4. On every path after step 2, success or failure, end with `bash <scripts_dir>/remote-run.sh discard <scratch>`. A `discard` that exits non-zero is reported with its message.

  Each command is written with the real `<state_dir>`, `<scripts_dir>`, `<branch>` and `<branch_fold>` substituted, and with no `$(…)`, no pipe and no shell variable. Rename the placeholder `<tmp>` to `<scratch>` and resolve it in that bullet. Update the `## Resolved values` lead sentence that lists `<tmp>` among the path placeholders, and the `<scripts_dir>` row's list of verbs so it names `discard`.
- [ ] **`branch-resume.md`**: the same change with `branch-resume-<branch_fold>`, including the fold rule, in the same four places. Leave its step 6 `<engine>` handling untouched.
- [ ] **Both files' scope paragraphs.** Wherever a file says it writes nothing locally, or lists the `remote-run.sh` verbs it invokes, name the scratch directory as its only local write and `discard` as an invoked verb. Grep each file for `temporary` and `<tmp>` and leave neither behind.

**Verification:**

- `git grep -nE 'mktemp|<tmp>|temporary directory' -- plugin/commands/branch-pause.md plugin/commands/branch-resume.md` prints nothing.
- `git grep -n 'scratch/branch-' -- plugin/commands/branch-pause.md plugin/commands/branch-resume.md` shows each file's directory, named with its own command and `<branch_fold>`, never a raw `<branch>`. The path appears only where `<scratch>` is defined; the create, fetch, leftover and `discard` sentences use `<scratch>`.
- `git grep -n 'A-Za-z0-9_-' -- plugin/commands/branch-pause.md plugin/commands/branch-resume.md` shows the fold rule stated in each file.
- Neither file carries `$(`, a backtick-wrapped substitution or a pipe in any command it tells the agent to run. The plugin manifest gate (`claude plugin validate --strict plugin`, `docs/development.md` → `## 5. Verifying a change`, **Gate 1**) is unaffected, because no frontmatter changes.

**Deviations from plan:**
- The `claude plugin validate --strict plugin` bullet was not executed: the call was refused pending approval in this session. It rests on reading the diff (no frontmatter changed) and is deferred to the Run gates phase.
- The `$(` grep matches only the prohibition sentence each bullet carries (`no $(…)`), not a command the agent is told to run.
- `branch-pause.md` Usage paragraph: "no file is written" on the GitHub route narrowed to "no `PAUSE` file", since the scratch directory is now a local write.
