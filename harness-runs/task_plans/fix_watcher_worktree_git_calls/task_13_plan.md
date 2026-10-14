### Task 13 — Planted-payload fixtures for `remote-run.sh review`

**Goal:** Plant each payload the inventory names for `remote-run.sh review`'s calls in a working copy, and drive the real verb, which the supervised `/branch-user-review` runs. The calls are: the mirror detection, the fetch, the fast-forward onto commits a GitHub job's agent made, the round listing and the commit. Assert that no marker appears, and that the outcome is either:

- **refused**: exit 4 (`review_fail`), nothing pushed and nothing dispatched; or
- **placed and dispatched**: exit 0, the round committed and pushed, and one `workflow run`.

**Depends on:** Task 7. After it, `cli/templates/scripts/remote-run.sh` → `verb_review` runs:

1. Main-checkout placement through `hr_wrapper_main_of`, equal to `root`.
2. Mirror detection through `hr_run_copy_check_var`, where an untrusted or off-branch mirror is not used and the verb cuts its own copy.
3. `hr_remote_url_configured`, then a fetch run as `git -C <main> -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false fetch --no-recurse-submodules …`.
4. `hr_run_fast_forward_var refs/remotes/origin/<b>`.
5. `hr_run_surface_check_var refs/heads/<b> copy`, which refuses a tip or working tree changing `<githooksDir>`, `.mcp.json` or `.claude/settings*.json`, or an untracked file under them. It runs whether or not step 4 moved anything, so it is the only check on a mirror already at the payload tip (step 4 returns 0 at its own step 3) and the only one that sees untracked files (`hr_run_copy_clean` does not).
   Steps 4 and 5 take their base as `merge-base(<tip>, HR_RUN_TRUSTED_BASE)`: the commit `ls-remote origin refs/heads/<defaultBranch>` reported, fetched without a destination and checked with `cat-file -e` (Task 1's `hr_run_trusted_base_var`). No local ref of the default branch is read, and an unreachable origin is a refusal.
6. The round listing from `refs/heads/<b>` in the main checkout.
7. `hr_commit_placed <main> <copy> <rel> <subject>`, which runs no hook and commits only `<rel>`.

The verb also depends on **Task 5**: a cut copy comes from `create-worktree.sh --existing --no-bootstrap`, which refuses a payload tip with exit 2. The verb reports that as `review_fail "the working copy (create-worktree.sh exited 2)"`.

### Targets

- `cli/test/remote-review-payloads.test.mjs` (new)

**Work:**

- [ ] **The header and the fixture.**
  - The header states the rule: *placing a review round never runs code the run's job committed or a session planted, and never installs a run-authored protected path*.
  - Reuse the fixture shape `cli/test/remote-run.test.mjs` builds for `review`: a bare origin, a `completed` remote run listed by a stubbed `gh`, and the registry record with its mirror.
  - Commit every payload on `origin/<branch>` through `hash-object` / `update-index` / `commit`, as a job's agent could.
- [ ] **Mirror cases — one case per payload.** The step that refuses each is named, so the `RED ONCE` block can target it:
  - **(M1)** `githooks/post-merge` and `githooks/reference-transaction` on `origin/<branch>` → refused by `hr_run_fast_forward_var`'s own tree check (Task 1, step 6). The mirror's `refs/heads/<branch>` is unchanged, and no marker.
  - **(M2)** `.mcp.json` on `origin/<branch>` → refused by the same step. The mirror's working-tree `.mcp.json` is unchanged.
  - **(M3) Only the verb-level `copy` check catches it: the fast-forward is a no-op.** Before the verb runs, set the mirror's `refs/heads/<branch>`, its index and its working tree to an `origin/<branch>` tip that changes `.mcp.json`, as a sync made before this branch would have left it. `hr_run_fast_forward_var` returns 0 at its step 3 (already at the tip) and checks nothing. The verb's `hr_run_surface_check_var refs/heads/<b> copy` refuses → exit 4, nothing pushed, no `workflow run`.
  - **(M4) Only the verb-level `copy` check catches it: an untracked file.** `origin/<branch>` is honest and one commit ahead, and the mirror holds an untracked, marker-writing `githooks/post-checkout`. `hr_run_copy_clean` does not look at untracked files and the tree check passes, so the fast-forward moves. The verb's `copy` check then finds the untracked path → exit 4, nothing pushed, no `workflow run`, and no marker.
  - **(M5)** The mirror's `config.worktree` (with `extensions.worktreeConfig` set in the main `.git/config`) carries a marker-writing `core.sshCommand` and a marker-writing `remote.origin.uploadpack`. The fixture's `origin` is a local bare path, so only `uploadpack` would run on a fetch. Expect no marker. `push-branch.sh`'s own config check refuses the push, so the verb exits 4 on the push step.
  - **(M6)** A nested repository, added behind a gitlink committed on the branch, whose own config sets a marker-writing `core.fsmonitor` → placed and dispatched, no marker.
  - **(M7)** A mirror whose record `gitdir` points elsewhere → not used as the mirror. A copy is cut, and the round is placed there.
  - **(M8) A forged base.** `.mcp.json` and a marker-writing `githooks/post-merge` committed on `origin/<branch>`; the fixture fetches that tip into the main repository and points its `refs/remotes/origin/<defaultBranch>` **and** `refs/heads/<defaultBranch>` at it with `update-ref`. → refused with exit 4, the mirror's `refs/heads/<branch>` and working-tree `.mcp.json` unchanged, no marker, nothing pushed, no `workflow run`; the bare origin's `<defaultBranch>` is unchanged.
- [ ] **Cut-copy cases.**
  - **(C1)** A payload tip with `.claude/settings.json` → refused with exit 4, the refusal naming `create-worktree.sh exited 2`, and no copy and no local branch left behind.
  - **(C2)** An honest branch → placed and dispatched. The commit carries only the round file, and no `githooks/pre-commit` marker appears even though the base carries a marker-writing `pre-commit` and the main checkout's `core.hooksPath` is the repo-relative `githooks`.
- [ ] **A `RED ONCE` block in the header, one line per case above.** Run each mutation once, record the assertion that failed, and revert. **A mutation that leaves its case green** means one of two things. First, check by hand that the fixture reaches the payload, and fix the fixture if it does not. If the payload genuinely never reached the pre-hardening call either, the case is a regression guard. Record that in the header as *"regression guard: the pre-hardening call did not reach this payload"*, and give it a second mutation that does turn it red. Never drop a line.
  - **(M1)** restore `git -C "$worktree" merge --ff-only "origin/$branch"` in place of `hr_run_fast_forward_var` → the `post-merge` marker appears.
  - **(M2)** drop `.mcp.json` from `hr_run_protected_rel_paths`' output → the case places and dispatches, and the mirror's `.mcp.json` changes.
  - **(M3)** drop the verb's `hr_run_surface_check_var "refs/heads/$branch" copy` call after the fast-forward → the case exits 0 with one `workflow run`.
  - **(M4)** the same mutation as (M3) → the case exits 0 with one `workflow run`. With the call restored, also drop the `ls-files --others` test from `hr_run_surface_check_var`'s `copy` mode → the same assertion fails.
  - **(M5)** restore `git -C "$worktree" fetch origin "$branch"` in place of the pinned main-checkout fetch → the `uploadpack` marker appears.
  - **(M6)** replace `hr_run_copy_clean`'s first `diff` with the unpinned `git -C "$worktree" status --short` → the `core.fsmonitor` marker appears, as the plan-time probe observed.
  - **(M7)** restore mirror detection by `git -C "$record_wt" symbolic-ref --short HEAD` → the redirected mirror is used, and no copy is cut.
  - **(C1)** skip `create-worktree.sh --existing`'s tip surface check (Task 5) → the refusal no longer names `create-worktree.sh exited 2`.
  - **(C2)** restore `hr_commit_placed "$script_dir/commit-on-branch.sh" …` → the `pre-commit` marker appears.
  - **(M8)** use the local `refs/remotes/origin/<defaultBranch>` as the base in `hr_run_surface_check_var` in place of `HR_RUN_TRUSTED_BASE` → the case exits 0 with one `workflow run`, and the mirror's `.mcp.json` is the planted one.

**Verification:**

- `npm test --workspace cli -- test/remote-review-payloads.test.mjs` passes, and every `RED ONCE` mutation was run once and observed failing as recorded in the header.
