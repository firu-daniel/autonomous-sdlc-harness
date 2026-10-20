### Task 21 — Restate `docs/watcher.md` §1–§2 for the clone layout: creation, sync order, the per-run profile, cleanup, migration and where the main checkout's ref can lag

**Goal:** `docs/watcher.md` is the watcher's document of record. After this branch it says (in §1–§2, and in §5's list of what the machine state directory holds):
- every new run copy is a clone;
- how each script creates, syncs, protects and removes one;
- that a legacy worktree run is supported until none is left;
- that the run job cuts no copy, and why;
- where the main checkout's branch can lag behind the clone.

Every sentence the derivation entries reached (story index → `## Scope register`, row 4) is restated or removed.

**Depends on:** Tasks 1, 4, 5, 7, 9, 11, 13, 19 and 26. Their behaviour, restated so this task needs no other file:
- **Creation (Task 7).** `create-worktree.sh` creates a clone in every mode through `hr_clone_create_var`.
  - It refuses a second live copy through `hr_run_copy_live_var`, and refuses a `[worktree-dir]` override.
  - It bootstraps through the **main** checkout's `setup-worktree.sh --target`.
  - It pushes a new branch from the main checkout with `--set-upstream`.
  - On every failure after the branch exists it removes the clone, the branch it cut (with the upstream section its push wrote), its registry record and a registry directory it made. When the failure follows a successful push (the clone's `origin/<branch>` mirror sync-out failed, exit `2`), it also deletes the remote branch its push created, under a lease on the pushed tip. Exit `4` no longer leaves a copy.
- **Sync order (Tasks 1 and 4).** On a clone, every branch move goes clone ref first, by compare-and-swap against the tip sync-in read, then the main checkout's. A failed main swap rolls the clone back by compare-and-swap (`hr_copy_ref_swap_var`: `0` / `4` nothing moved / `5` clone ahead). Sync-in heals a strictly-behind clone and refuses a diverged one. `push-branch.sh` verifies the clone's ref before it pushes. The `origin/<branch>` and fetched-base mirrors are the two refs still moved main-first, and they are remote-tracking refs no run commits to.
- **The clone's refs.** A new clone holds only `origin/<defaultBranch>` (with `origin/HEAD`) and `origin/<branch>`, refs the main checkout keeps reachable.
- **The per-run profile (Task 13).** At every spawn the watcher renders `<lane dir>/run-profiles/<slug>/<branch>.json`, the path `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_profile_file <repo slug> <branch>` prints and owns (Task 1), under the same machine state directory as the usage lane's two artifacts: the base profile plus, by exact path, the run copy's surface, the clone's six `.git` paths or a legacy worktree's `.git` pointer, and every other live worktree's pointer. It checks the copy, and refuses the launch unless the sandbox is on and strict, or the opt-out marker is present, and the copy differs from the base only by appended strings. It syncs a clone in at every run exit.
- **Job mode (Tasks 13 and 26).** Job mode renders no per-run copy and writes nothing under the machine lane. It runs the same launch check on the base profile and passes the base profile unchanged as `--settings`. The reasons: the *JOB MODE* header keeps the machine lane off, and in a job the copy is the main checkout with no other linked worktree, so a per-run copy would equal the base. A base profile that fails the check launches nothing, and the job records `failed`. `cli/test/watcher-remote-job.test.mjs` holds both.
- **Creation mirror (Task 7).** After the creation push, `create-worktree.sh` syncs `refs/remotes/origin/<branch>` out to the clone, so the clone's mirror exists from the start.
- **Cleanup (Task 9).** `cleanup-merged-worktrees.sh` finds the copy from the registry record and removes a clone through `hr_clone_remove_var`, or a legacy worktree through its existing arm. `--dry-run` decides by the same rule.
- **Remote verbs (Task 11).** `remote-run.sh start` and `review` cut clones and remove the clone, the branch and the record they created.
- **The job (Task 19).** The `run` job cuts no copy: its session runs in the job's own checkout.

### Targets

- `docs/watcher.md`

**Work:**

- [ ] **§1:** restate step 4 (*"a fresh sibling copy cut from `defaultBranch`'s commit…"*) for a clone and the main checkout's `--target` bootstrap in every mode. Restate step 6 (*"run with the generated permission profile through `--settings`"*) to say the per-run copy, the launch check, and a refused launch ending `failed`. Add the exit sync to step 7.
- [ ] **§2's script table:** rewrite the `create-worktree.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh` and `remote-run.sh` rows for the clone layout. Keep each row's "Who runs it" and "Profile allow entry" cells unless they changed. Rewrite `commit-on-branch.sh`'s row if it still says only a worktree.
- [ ] **§2 → `### Where the family runs git in a run's copy, and under what pins`:**
  - Replace *"A run's copy is a linked worktree today; the library also handles a clone … which nothing creates yet"* with: the clone is the layout, and the legacy worktree arm holds until no worktree run is left.
  - Rewrite the `create-worktree.sh` rows, the `cleanup-merged-worktrees.sh` row, the `harness-run.yml` row (no copy, and why) and the two clone-arm rows (sync-in with the heal, and the clone-first swap replacing *"sync-out after a moved ref"*).
  - In **The pins.**, restate the order.
  - In the closing paragraph, drop the claim that every run executing in a linked worktree still shares the store. Point at `docs/cli.md` §6's residual list by its quoted heading text, *"Residuals, stated rather than hidden"*, never by a residual number: Task 22 renumbers that list.
- [ ] **New subsections under §2, and §5's list of the machine state directory:**
  - `### The per-run profile`: its path, what it adds and why each by exact path, the launch check and what a refusal does, job mode's exception (base profile checked and passed, nothing written under the lane) with its two reasons, and the base-validity residual pointed at `docs/cli.md` §6.
  - `### Migration: both layouts until no worktree run is left`: which records are legacy (no `copy_kind`), that they resume, commit and are swept unchanged, the maintainer's `jq` listing in its own fenced block, one command per line, and that the worktree arm's removal waits for that list to be empty.
  - **Branch visibility**, as a paragraph: the main checkout's branch moves at every wrapper commit, push and refresh and at every run exit. It can lag only by a sandboxed commit made directly in the clone, which no flow issues, until the next of those, or by a wrapper's `5` exit, until the next sync-in heals it.
  - **§5 → `### The two paths`.** The section enumerates what lives in `${XDG_STATE_HOME:-$HOME/.local/state}/autonomous-sdlc-harness/`, and `.claude/context/cli.md` → `## How a module in this layer is written` → **Machine-scoped state is not an adopter's file.** requires that enumeration be whole, with one owner per piece. Add `run-profiles/<slug>/<branch>.json` to the directory tree, as a directory line carrying a one-phrase gloss (the per-run settings copy the watcher re-renders at every spawn), and one sentence after the tree pointing at `### The per-run profile` in §2 and naming `hr_run_profile_file` as its owner. Keep the heading text: it is cited elsewhere by name. Do not restate the profile's format here; §2 owns it.
- [ ] **§2 → `### The main-checkout anchor`, then a closing sweep.** In the anchor section, remove *"No launcher creates a clone yet"*. In **A session no launcher started**, keep the hand-launch instruction, and say that a run copy is now a clone, so a hand-started session there needs the variable. Then re-run the story index's derivation entries A, B and D against this file. Every remaining hit either is a sentence this task wrote and means, or is listed in the register as `no-change`. Cite anchors by heading or quoted text, never by line number. Rewrite every existing citation of a `docs/cli.md` §6 residual **by number** in this file (*"residual 1"*, *"residual 6"*) to cite that residual by its bold lead text, because Task 22 renumbers the list.

**Verification:**

- `git grep -nE 'nothing creates yet|No launcher creates|linked worktree today' -- docs/watcher.md` prints nothing.
- `git grep -nE 'residual [0-9]' -- docs/watcher.md` prints nothing.
- `git grep -n 'run-profiles' -- docs/watcher.md` reaches §5's directory tree as well as §2's `### The per-run profile`.
- Every new or edited cross-reference resolves to a heading that exists, by name: `docs/cli.md` §6 and the script headers' section names.
- Each command an adopter is meant to run sits in a fenced block, one command per line (`harness-runs/lessons.md` → `## Adopter-facing documentation`).

- **Deviations from plan:**
  - Plan's branch-visibility bullet says the main checkout lags "by a wrapper's `5` exit". The clone-ahead state is `hr_copy_ref_swap_var`'s exit `5`, which `commit-on-branch.sh` reports as its landed exit `1` and `refresh-branch.sh` as its exit `5` (each script's exit map). Implemented naming all three, and "carries the main checkout forward" in place of "heals": sync-in's heal is the clone-behind case; a clone ahead is a forward move of the main checkout's ref (`hr_copy_sync_in_var`).
  - `docs/cli.md` §6's residual 1 has no bold lead text, so it is cited by its heading *"Residuals, stated rather than hidden"* plus its quoted opening words. Residual 1.6 (the object store) is no longer cited: Task 22 removes it, so the closing paragraph drops "the object store" from the open list and states the clone's alternates-and-hashing-fetch fact instead. The per-run profile's base-validity residual, which Task 22 adds, is cited by the heading and a description, since its bold lead text does not exist yet.
  - Cross-reference resolution (Verification bullet 4) was checked by `grep` against `docs/cli.md`, `cli/templates/github/workflows/harness-run.yml` and `cli/templates/scripts/autonomous-watcher.sh`, not by a link checker; none is configured for this file.
