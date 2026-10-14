### Task 11 — Planted-payload fixtures for the watcher's review drop, local and remote

**Goal:** For every exposed call on the watcher's review path, plant each payload the inventory names for it and drive the **real** watcher path with one `tick` of the `init`-written `autonomous-watcher.sh`. Assert that no marker appears and that the outcome is the one the plan specifies. Use the marker technique the wrapper suites use (`cli/test/push-branch-worktree-config.test.mjs`): every planted hook, fsmonitor, filter driver and `sshCommand` writes a marker file named for itself.

**Depends on:** Task 6. The review path in `cli/templates/scripts/autonomous-watcher.sh` behaves as follows after it.

- **Reused copy.** `hr_run_copy_check_var` runs first. An untrusted copy fails through `fail_before_launch` with *"is not one this repository lists"*. The branch compare is then made against `HR_RUN_COPY_BRANCH`. `hr_run_copy_clean` follows, failing with today's *"has uncommitted tracked changes"*.
- **Remote arm:**
  1. `hr_remote_url_configured`;
  2. `git -C <main> -c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false fetch --no-recurse-submodules origin "+refs/heads/<b>:refs/remotes/origin/<b>"`;
  3. `hr_run_fast_forward_var refs/remotes/origin/<b>`, a plumbing fast-forward that refuses a tip changing a protected path, through `fail_before_launch`.
- **Both arms.** `hr_run_surface_check_var refs/heads/<b> copy` then refuses, through `fail_before_launch`, a copy whose tip or working tree changes `<githooksDir>`, `.mcp.json`, `.claude/settings.json` or `.claude/settings.local.json`, or that has anything untracked under them. The tree comparison's base is `merge-base(<tip>, HR_RUN_TRUSTED_BASE)`, where `HR_RUN_TRUSTED_BASE` is the commit `ls-remote origin refs/heads/<defaultBranch>` reported, fetched without a destination and checked with `cat-file -e` (`hr_run_trusted_base_var`). No local ref of the default branch is read, and an unreachable origin is a refusal. `hr_run_fast_forward_var`'s own tree check uses the same base.
- **The remote review commit** is `hr_commit_placed <main> <copy> <rel> <subject>`. It runs no hook and commits only `<rel>`. Its 3 is an identical re-drop: skipped and pushed anyway. Its 0 is committed, and anything else blocks.
- **Placement** goes through `hr_place_artifact`, which refuses a symlinked component.

The registry `status` after a refusal is `failed`, and the inbox file is archived as `failed_<ts>_<name>`.

### Targets

- `cli/test/watcher-review-drop-payloads.test.mjs` (new)

**Work:**

- [ ] **The header and the fixture.**
  - The header states the rule: *a review drop never runs code a sandboxed session planted in the copy, and never installs a run-authored protected path; an honest copy's outcome is unchanged*.
  - Build on `createWatcherFixture` (`cli/test/helpers/watcher.mjs`), with a run's branch, its working copy cut by `create-worktree.sh`, and a bare origin.
  - **Every committed payload is committed through `hash-object` / `update-index` / `commit` without writing the working-tree file**, as the task prompt's commit route describes.
  - The main `.git/config` sets `extensions.worktreeConfig=true`, so a copy's `config.worktree` is live for an unpinned call, and `core.hooksPath` is the repo-relative `githooks` that `init` writes, so an unpinned hook-running call in the copy resolves it inside the copy. Without both, the `RED ONCE` mutations below could not reach their payloads.
  - Each case below carries a label, (L1)–(L9) and (R1)–(R5), that the `RED ONCE` block cites.
- [ ] **Local reuse — one case per payload, each refused or harmless as stated:**
  - **(L1)** `config.worktree` `core.fsmonitor` → **launched**: the hardened calls never read it. No marker.
  - **(L2)** A nested repository behind a gitlink, its own config carrying `core.fsmonitor` → **launched**, no marker.
  - **(L3)** The copy's submodule config (the `modules/<name>/config` under the gitdir git gives that submodule from this copy) carrying `core.fsmonitor`, with `submodule.recurse=true` in the main config → **launched**, no marker.
  - **(L4)** `.gitattributes` selecting a filter whose `clean` is defined in `config.worktree`, with the attributed file's mtime touched so a status-style call re-hashes it → **launched**, no marker.
  - **(L5)** A committed `.claude/settings.json` change, the working-tree file untouched → **refused** (`failed`), and nothing launched.
  - **(L6)** An untracked `githooks/post-checkout` → **refused**.
  - **(L7)** A record `HEAD` pointing at another branch → **refused** with today's *"is on branch"* message.
  - **(L8)** `<stateDir>/user_reviews` a symlink to a directory outside the fixture → **refused**, and nothing is written outside.
  - **(L9) A forged base.** The branch commits a marker-writing `hooks` entry in `.claude/settings.json` through plumbing, **and the copy's working-tree file is written to match**, so the clean test and the working-tree comparison both pass and only the base can refuse. Then point the main repository's `refs/remotes/origin/<defaultBranch>` **and** `refs/heads/<defaultBranch>` at that tip with `update-ref`. → **refused** (`failed`), nothing launched, no marker; the bare origin's `<defaultBranch>` is unchanged.
- [ ] **Remote arm, with `execution.target` `github-actions` and `gh` stubbed as `cli/test/watcher-remote-dispatch.test.mjs` stubs it.** One case each:
  - **(R1)** `config.worktree` carrying a marker-writing `core.sshCommand` and a marker-writing `remote.origin.uploadpack` → no marker. The fixture's `origin` is a local bare path, so of the two only `uploadpack` would run on an unpinned fetch. The watcher's fetch and commit never read that file, and `push-branch.sh`'s own `config.worktree` check then refuses the push, so the drop fails before launch with today's *"push-branch.sh did not push"* reason and no `workflow run`;
  - **(R2)** a `githooks/reference-transaction` and a `githooks/post-merge` committed on `origin/<branch>`, the job's commit → the fast-forward is **refused**, `refs/heads/<branch>` is unchanged, no marker, and no `workflow run` is sent;
  - **(R3)** a `githooks/pre-commit` and a `githooks/commit-msg` already on the branch tip in **both** the copy and the base, so they pass the surface check → the review commit lands and no marker fires;
  - **(R4)** an extra file staged in the copy's index → the review commit carries only the review;
  - **(R5) A forged base, remote arm.** `origin/<branch>` carries a `.mcp.json` and a `githooks/post-merge` committed by the job; the main repository's `refs/remotes/origin/<defaultBranch>` and `refs/heads/<defaultBranch>` are pointed at that `origin/<branch>` tip after the watcher's fetch would have brought it (the fixture fetches it into the main repository first). → the fast-forward is **refused**, `refs/heads/<branch>` is unchanged, no marker, and no `workflow run` is sent.
- [ ] **Honest cases, so a refusal cannot pass for safety:**
  - a clean reused copy launches, with the review placed and uncommitted locally;
  - a remote-arm drop fast-forwards an honest `origin/<branch>`, commits `chore: add user review for <branch>`, pushes, and sends exactly one `workflow run`;
  - an identical re-drop on the remote arm logs *already committed (identical re-drop)* and makes no commit.
- [ ] **A `RED ONCE` block in the header, one line per payload case.** Run each mutation once against the case it names, record the assertion that failed, and revert. **A mutation that leaves its case green** means one of two things. First, check by hand that the fixture reaches the payload, and fix the fixture if it does not. If the payload genuinely never reached the pre-hardening call either, the case is a regression guard. Record that in the header as *"regression guard: the pre-hardening call did not reach this payload"*, and give it a second mutation that does turn it red. Never drop a line.
  - **(L1)** restore `git -C "$worktree" status --short` as the reuse path's clean test, in place of `hr_run_copy_clean` → the `config.worktree` `core.fsmonitor` marker appears.
  - **(L2)** the same restored `status --short` → the nested repository's `core.fsmonitor` marker appears, as the plan-time probe observed.
  - **(L3)** the same restored `status --short` → the submodule config's `core.fsmonitor` marker appears.
  - **(L4)** the same restored `status --short` → the `clean` filter's marker appears.
  - **(L5)** drop the reuse path's `hr_run_surface_check_var "refs/heads/$branch" copy` call → the case launches, and the registry `status` is not `failed`.
  - **(L6)** drop the `ls-files --others` test from `hr_run_surface_check_var`'s `copy` mode → the case launches.
  - **(L7)** drop the reuse path's compare of the inbox branch against `HR_RUN_COPY_BRANCH` → the case launches. Restoring `hr_current_branch` alone would not turn it red, because it reads the same record `HEAD`; the compare is what refuses.
  - **(L8)** skip `hr_run_path_safe` in `hr_place_artifact` → the outside directory is written.
  - **(R1)** restore `git -C "$worktree" fetch origin "$branch"` in place of the pinned main-checkout fetch → the `uploadpack` marker appears.
  - **(R2)** restore `git -C "$worktree" merge --ff-only "origin/$branch"` in place of `hr_run_fast_forward_var` → the `post-merge` and `reference-transaction` markers appear. Separately, skip the surface check inside `hr_run_fast_forward_var` → `refs/heads/<branch>` moves, so the "unchanged" assertion fails, even though the later `copy` check still refuses the launch.
  - **(R3)** restore the review commit through `commit-on-branch.sh` (`hr_commit_placed "$script_dir/commit-on-branch.sh" …`) → the `pre-commit` and `commit-msg` markers appear.
  - **(R4)** build the commit from the copy's own index rather than the temporary one → the extra file is committed.
  - **(L9)** use the local `refs/remotes/origin/<defaultBranch>` as the base in `hr_run_surface_check_var` in place of `HR_RUN_TRUSTED_BASE` → the case launches, and the registry `status` is not `failed`.
  - **(R5)** the same mutation → `refs/heads/<branch>` moves to the payload tip and one `workflow run` is sent.

**Verification:**

- `npm test --workspace cli -- test/watcher-review-drop-payloads.test.mjs` passes, and every `RED ONCE` mutation was run once and observed failing as recorded in the header.

**Deviations from plan:**

- **(L5)** The committed `.claude/settings.json` change, with the working-tree file untouched, leaves the copy unclean. On its own it would be refused by `hr_run_copy_clean`, so the case's mutation (drop the surface check) could not turn it red. The fixture therefore also sets `update-index --assume-unchanged` on the record's index, which a sandboxed session can write. With that, the clean test passes and only the surface check's tree comparison refuses. The case's mutation was then observed red.
- **(R4)** A staged ordinary file fails `hr_run_copy_clean`'s `diff-index --cached` before the commit is reached. The extra entry is therefore a staged gitlink, the one kind the clean test's `--ignore-submodules` lets through. Under the R4 mutation, `extra` is committed.
- **(L2), (L3), (L4)** The gitlink's nested repository, the submodule's checkout, `.gitattributes` and the attributed file are unprotected paths the sandbox can write, so they are written to the working tree. Only the commit goes through the record index, `commit-tree` and `update-ref`. (L3) stages through a pinned `submodule add`.
- **(L8)** `user_reviews/README.md` is tracked. The fixture therefore commits the removal of the README and a `120000` symlink entry, and writes the matching symlink, so the copy reads clean and the placement is what refuses.
- **(R1)** The push refusal comes after the placement. The drop has already been archived as placed (`<ts>_<name>`), so no `failed_` archive is written. That is today's behaviour of `fail_before_launch` after placement, and the case asserts it that way.
- **RED ONCE** Each mutation was applied by `harness-runs/scratch/t11_mutate.py` through `scripts/scratch-run.sh`, run against the whole file, and reverted. No case needed a regression-guard entry.
