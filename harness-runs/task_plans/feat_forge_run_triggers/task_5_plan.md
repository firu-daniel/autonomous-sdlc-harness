### Task 5 — Let `create-worktree.sh` cut and push a branch without bootstrapping it

**Goal:** Give the branch cut a job-safe form. Today `create-worktree.sh`'s default mode cuts `-b <branch>` off `origin/<defaultBranch>`, runs the new copy's `setup-worktree.sh` (dependency install, build, pre-push backstop), and only then pushes. A trigger job only commits a task prompt into that copy and never runs the adopter's code in it. So it must not need the adopter's toolchain on the trigger runner, and a failed dependency install must not stop a run starting. The new `--no-bootstrap` option skips the bootstrap and still pushes, so the one branch-cut implementation serves the job too (task prompt, goal 2).

**Where this task stops.** It adds one option to one script. The caller that passes it is Task 6's `remote-run.sh start`. The watcher and an operator keep the default, bootstrapped mode, and `--existing` is unchanged.

### Targets

- `cli/templates/scripts/create-worktree.sh` — the option, its header paragraph, its usage line and its REPRO entry.
- `cli/test/create-worktree.test.mjs` (new) — the option's contract.

**Work:**

- [ ] **Parse `--no-bootstrap`** alongside `--existing`, accepted in either order, before `<branch-name>`. It is valid only in default (new-branch) mode, and `--existing --no-bootstrap` is a usage error, exit 1. An `--existing` copy is a mirror or a re-created working copy that a person or a run works in, so it always wants the bootstrap. Add it to the `Usage:` block and to the `usage()` line.
- [ ] **With `--no-bootstrap`**, skip the whole bootstrap-resolution block, including its exit-4 refusal, and go straight to the push that default mode already does (`git -C "$worktree_dir" push -u origin "$branch"`). Print `create-worktree.sh: worktree ready at <dir> (not bootstrapped)` and `create-worktree.sh: branch <branch> (pushed to origin)`.
- [ ] **Header**: add `--no-bootstrap` to *THE TWO MODES* as a variant of default mode, with its one caller and its reason:
  - the caller is `remote-run.sh start`, in a trigger job that only places and commits an artifact;
  - the reason is that such a copy runs nothing, so a dependency install would cost minutes and could fail a start for a reason unrelated to the task;
  - it installs no worktree-scoped pre-push backstop. The push it makes is of a branch the caller has already judged not protected, and every later commit goes through `commit-on-branch.sh` and `push-branch.sh`, which refuse a protected branch themselves.

  Amend the `set -e` paragraph if it implies every created copy is bootstrapped, and the exit map's `4` line to say that `--no-bootstrap` never exits 4.
- [ ] **REPRO**: add one entry beside `new branch`: `bash "$d/scripts/create-worktree.sh" --no-bootstrap feat/q` → `"$w/demo-feat-q"` on `feat/q`, no `deps.marker`, and `git -C "$b" branch` lists `feat/q`.
- [ ] **`cli/test/create-worktree.test.mjs`** opens with the rule it enforces: *a no-bootstrap cut pushes the branch and installs nothing; an `--existing` one refuses the option*. It builds the header REPRO's fixture shape (a bare `origin`, a committed `harness.config.json` whose `commands.depInstall` writes a marker, and the scripts copied in by `init` or by the test) under the system temp directory. It asserts:
  - `--no-bootstrap feat/q` exits 0, the copy exists without the marker, and `origin` carries `feat/q`;
  - `--existing --no-bootstrap feat/q` exits 1 and creates nothing;
  - the default mode still writes the marker. This one case is the regression for the unchanged path.

**Verification:**

- `npm test -- test/create-worktree.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/create-worktree.sh` exits 0.
- The header's REPRO `no-bootstrap` entry, run by hand against the header's own throwaway fixture, matches what it states.
