### Task 7 — `remote-run.sh review` and `start` on the hardened primitives

**Goal:** Every git call `cli/templates/scripts/remote-run.sh` makes in a run's working copy is hardened. This is `remote-run.sh`'s share of the inventory.

| Site (anchor) | Class today | Payloads that reach it | After this task |
|---|---|---|---|
| `verb_review`: `git -C "$record_wt" symbolic-ref --short HEAD` (mirror detection) | (b) reads only | the `.git` pointer or record (Linux) redirects the answer | `hr_run_copy_check_var "$run_main" "$record_wt"` and `HR_RUN_COPY_BRANCH` = `$branch` |
| `verb_review`: `git -C "$worktree" fetch origin "$branch"` | (c) | `config.worktree` (`core.sshCommand`, `remote.*`); hooks; on-demand submodule fetch under `modules/*/config` | `hr_remote_url_configured`, then `hr_run_main_git fetch --no-recurse-submodules origin "+refs/heads/$branch:refs/remotes/origin/$branch"` |
| `verb_review`: `git -C "$worktree" merge --ff-only "origin/$branch"` — onto commits a GitHub job's agent made | (c) | a committed protected path the checkout writes; `post-merge` and `reference-transaction` hooks; fsmonitor; `.gitattributes` drivers | `hr_run_fast_forward_var "refs/remotes/origin/$branch"` |
| `verb_review`: `git -C "$worktree" ls-tree --name-only HEAD -- …/user_reviews/` and `git -C "$worktree" rev-parse HEAD` | (b) reads only | the `.git` pointer or record (Linux) redirects the answer | `hr_run_main_git ls-tree --name-only "refs/heads/$branch" -- …` and `hr_run_main_git rev-parse "refs/heads/$branch"` |
| `verb_review` and `verb_start`: `hr_commit_placed "$script_dir/commit-on-branch.sh" …` | (c) for review, (a) for start (a fresh cut from the default branch) | hooks; `config.worktree`; anything else staged in the run's index | `hr_commit_placed "$run_main" "$worktree" "$rel" "$subject"` |
| `verb_review` and `verb_start`: `hr_state_dir "$worktree"` for the placement | decides by the copy's configuration | a branch-written `stateDir` | the main checkout's `stateDir`; refuse (`review_fail` / `placement_fail`) when the copy's resolvable one differs |
| `lineage_commits_var`: `rev-parse` / `rev-list …..HEAD` in the job's checkout | (b) reads only | none: on GitHub that checkout's `.git/config` and `config.worktree` are the runner's and write-protected | unchanged |
| every `git -C "$root" show / ls-tree / cat-file / log -S` on `refs/remotes/origin/*` | (a) main checkout's refs only | — | unchanged |
| `start_remove_copy`: `worktree remove --force`, `prune`, `branch -D` on the copy this verb cut | (a) main only | — | unchanged |

**Depends on:**

- **Task 1** (`cli/templates/scripts/lib/harness-run-lib.sh`), with these interfaces:
  - `hr_run_copy_check_var <main> <copy>` → 0 trusted or 1 untrusted (`HR_RUN_REFUSAL`). It sets `HR_RUN_MAIN`, `HR_RUN_COPY_TOP`, `HR_RUN_COPY_GITDIR`, `HR_RUN_COPY_BRANCH` (empty when detached) and `HR_RUN_COPY_TIP`.
  - `hr_run_main_git <args…>`: `git -C "$HR_RUN_MAIN" -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false`.
  - `hr_run_fast_forward_var <ref>` → 0, 1 (`HR_RUN_FF_REFUSAL`) or 5.
  - `hr_run_surface_check_var <tip> copy` → 0, or 1 with `HR_RUN_SURFACE_REFUSAL`.
  - `hr_commit_placed <main> <worktree> <rel> <subject>` → 0, 3 identical, 2 protected, or 1.
  - `hr_push_landed <push_wrapper> <worktree> <branch>` (signature unchanged) → 0, 1, or 2 with `HR_PUSH_REMOTE_TIP`.
  - `hr_remote_url_configured <main> <remote>`.
- **Task 5:** `create-worktree.sh --existing --no-bootstrap` now refuses a branch whose tip changes a protected path, with exit 2 and nothing left behind. The verb's existing `review_fail "the working copy (create-worktree.sh exited $status)"` covers it.

### Targets

- `cli/templates/scripts/remote-run.sh`

**Work:**

- [ ] **Place the main checkout once.** At the point `script_dir` and `root` are both known, set `run_main` from `hr_wrapper_main_of "$script_dir"`. Have `verb_review` and `verb_start` refuse (`review_fail` / `placement_fail` "placing the main checkout") unless it equals `root` canonically. Every other verb is untouched.
- [ ] **`verb_review`.**
  - **Mirror detection:** the first table row's replacement. A mirror that fails the check is not used, so the verb falls through to cutting its own copy, as for a mirror on another branch today.
  - **The `fetch` and `merge --ff-only` lines:** the table's two replacements, then `hr_run_surface_check_var "refs/heads/$branch" copy`. Each failure is `review_fail` naming the step, the refusal sentence included.
  - **The round listing and `pushed`:** read from `refs/heads/$branch` through `hr_run_main_git`.
  - **`state_rel`:** from `hr_state_dir "$root"`. Refuse when `hr_state_dir "$worktree"` answers something else.
  - **The commit:** `hr_commit_placed "$run_main" "$worktree" "$rel" "$(hr_user_review_subject "$branch")"`, where any status but 0 is `review_fail "committing '$rel'"` as today.
- [ ] **`verb_start`:** the same `state_rel` rule, and `hr_commit_placed "$run_main" "$worktree" "$rel" "$subject"`, with 1 or 2 → `placement_fail "committing '$rel'"`. The `[ "$status" -ne 1 ]` test becomes `[ "$status" -eq 0 ] || [ "$status" -eq 3 ]`, so a protected refusal (2) is not read as success.
- [ ] **Header.** Update the `review` paragraph and the paragraph on the copy `start` cuts so they state the pins, the surface refusal and the plumbing commit, and say `lineage_commits_var` and the `refs/remotes/origin/*` reads are reads only. Add a REPRO line for a `review` refused on a mirror whose branch tip committed `.claude/settings.json` through plumbing.

**Verification:**

- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -nE 'git -C "\$(worktree|record_wt)"' -- cli/templates/scripts/remote-run.sh` finds no hit.
- `git grep -n 'commit-on-branch.sh' -- cli/templates/scripts/remote-run.sh` finds only comment text, if any.
- The new REPRO line, run by hand against a throwaway fixture with `gh` stubbed, refuses with exit 4. It leaves the mirror's `refs/heads/<branch>` unchanged and the planted settings file absent from its working tree.
