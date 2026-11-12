### Task 7 — Rename in the commit, push, refresh, worktree, cleanup and scratch wrapper templates

**Goal:** Make the wrapper templates an adopter receives read and name `devscene.config.json` and the `devscene/` state directory, in their code, their refusal messages and their REPRO blocks.

**Depends on:** Task 5, whose `cli/templates/scripts/lib/harness-run-lib.sh` resolves `devscene.config.json` and defaults `stateDir` to `devscene`. These wrappers source that library from their own directory, so their own literals must name what it reads.

**Where this task stops.** The suites driving these wrappers (`commit-on-branch-*`, `push-branch-*`, `refresh-branch-*`, `create-worktree`, `setup-worktree-*`, `cleanup-run-copies`, `wrapper-*`) are Task 21's. The adopted copies under `scripts/` are the maintainer's cutover (Task 35).

### Targets

- `cli/templates/scripts/commit-on-branch.sh`
- `cli/templates/scripts/push-branch.sh`
- `cli/templates/scripts/refresh-branch.sh`
- `cli/templates/scripts/create-worktree.sh`
- `cli/templates/scripts/setup-worktree.sh`
- `cli/templates/scripts/cleanup-merged-worktrees.sh`
- `cli/templates/scripts/scratch-run.sh`

**Work:**

- [ ] `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh`: apply rows 1 and 2 of `## Context`'s spelling table everywhere. That covers the header paragraphs (`THE TARGET'S \`devscene.config.json\` IS NOT TRUSTED EITHER`), every refusal (`cannot resolve '$main_top/devscene.config.json' — refusing to commit`), the `protected set (from devscene.config.json)` line and every REPRO fixture line (`"stateDir":"devscene/"`, `> "$d/devscene.config.json"`, `git -C "$d" checkout -q -- devscene.config.json`).
- [ ] `create-worktree.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh`, `scratch-run.sh`: apply rows 1 and 2 the same way.
- [ ] Change nothing else. These are copied byte for byte by `init`, so the only differences from `HEAD` are the respelled substrings.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts' -- cli/templates/scripts/commit-on-branch.sh cli/templates/scripts/push-branch.sh cli/templates/scripts/refresh-branch.sh cli/templates/scripts/create-worktree.sh cli/templates/scripts/setup-worktree.sh cli/templates/scripts/cleanup-merged-worktrees.sh cli/templates/scripts/scratch-run.sh` prints nothing.
- `bash -n` on each of the seven files exits 0.
- `git diff -U0 -- cli/templates/scripts` limited to these seven files shows only the respelled substrings changed.
