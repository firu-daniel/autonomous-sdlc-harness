`feat_clone_per_run_switch` switches every **new** autonomous run to its own self-contained `git clone --shared` of the main checkout instead of a linked worktree, and then write-denies the main checkout's whole `.git` to sandboxed commands. It is the last of three branches:

- `feat_clone_per_run` taught the library, the excluded wrappers and the watcher's git family to trust, sync with, create and remove a clone;
- `feat_clone_per_run_anchor` gave every plugin reader a main-checkout anchor that holds inside a clone.

This branch turns the layout on.

It starts from a `dev` that carries both. Read `docs/watcher.md` §2, `docs/cli.md` §6 and §7, and `docs/sandbox-verification.md` before designing anything. In particular, read the measured rows `feat_clone_per_run` recorded for sandboxed git in a clone (probes 1–5, 2026-10-19). Three of their findings bind this design:

- **Sandboxed ordinary git works in a clone at the sibling path** (add, commit, fetch, stash, switch), **but only once the profile's sibling-glob `.git` rules are gone.** The generated profile denies `<work_root>/<repo>-*/.git` twice, as a sandbox `denyWrite` entry and as an `Edit`/`Write` permission pair. Both were written for a worktree's `.git` pointer file, and on a clone they match the whole git directory.
- **An `Edit(…)` permission deny rule alone closes its path to sandboxed commands**, not only to the file tools. So "move the glob `.git` entry to the file-tool side" does **not** keep a clone's `.git` open. A legacy worktree's pointer file still needs protecting, so settle how.
- **What the runtime protects by itself, and what it leaves open.** Measured with Claude Code 2.1.303 on macOS:
  - **refused:** sandboxed writes to the cwd repository's `.git/config`, `.git/hooks/` and `objects/info/alternates`;
  - **left open:** new files in `objects/info/` (where `http-alternates` goes), in `info/` (where `attributes` and `exclude` go) and directly in `.git` (where `commondir` and `config.worktree` go);
  - **renames, measured 2026-10-20 (Claude Code 2.1.304, macOS):**
    - **A direct `mv` never reaches the sandbox.** It was refused at the permission layer even with `Bash(mv:*)` and `Bash(cp:*)` allowed. A `mv` onto `registry.json` hit the registry's `Edit`/`Write` deny rules, which the permission layer applies to `mv`'s destination. `cp`/`mv` into a clone's `.git` were refused (`… running in don't ask mode`) even under a scratch profile with no `.git` rule.
    - **The indirect route was refused by the sandbox itself.** A helper script, allowed as one exact `bash <helper>` call, staged a new file in a writable spot and renamed it onto `<clone>/.git/config`, `<clone>/.git/hooks/pre-commit.sample` and `<clone>/.git/objects/info/alternates`. All three gave `Operation not permitted`, with the inodes unchanged.
    - **The same holds for the registry and its directory.** The same indirect rename onto `<main>/harness-runs/autonomous_logs/registry.json` gave `Operation not permitted`, and so did a direct `mv` of the whole `autonomous_logs/` aside.

    So the runtime's protection of those three clone paths, and the exact-path `denyWrite` entry on the registry, both hold against a rename as well as a write.

  The per-run protection covers what the runtime leaves open, or the unsandboxed code that reads the clone refuses it. A test or row proves each one. A protection the runtime already gives is still restated in the profile where the profile can carry it, so it does not rest on an undocumented default.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** Re-verify each one in the merged code before planning on it.

## The goal

1. **Every new run copy is a clone.**
   - **`create-worktree.sh`, in all three modes** (default, `--no-bootstrap`, `--existing`), creates clones through the library's creation and bootstraps them through the main checkout's `setup-worktree.sh --target`. It removes everything it created on every failure exit after the branch exists, the branch included, and nothing it did not create (`harness-runs/lessons.md`). Its deliberate refusals keep their messages.
   - **`remote-run.sh start` and `review`** cut and remove clones through the library.
   - **`harness-run.yml`'s `run` job:** find whether it cuts a copy at all, and give it the same layout or state why not, verified by test over the rendered template. The real GitHub job is a post-release follow-up.
2. **Protect each run's own trust surface.** The sandbox must not be able to write a clone's `.git/config`, `.git/hooks` or `objects/info/alternates`.
   - Prefer exact per-run paths over globs (`docs/cli.md` §6, residual 2: Linux skips `*` entries).
   - Claude Code's `--help` lists a single `--settings <file-or-json>`, and repeating it is undocumented. Re-checked on 2.1.304 on 2026-10-20: still one `--settings <file-or-json>`, not marked repeatable (unlike `--plugin-url`, which says "repeatable"). Settle how the watcher gives each run its exact paths. One candidate is a per-run copy of the profile, rendered outside every sandbox-writable and file-tool-writable root.
   - The watcher refuses to launch on a rendered profile whose `sandbox.enabled` is not `true` (`docs/sandbox-verification.md` §6: an empty `--settings` file starts an unsandboxed session).
   - **`sandbox.enabled: true` alone is not enough.** The same 2.1.304 `--help`, under `-p`, says: "Settings files that fail validation are silently ignored in this mode (no error dialog is shown)." So a rendered profile that reads `enabled: true` but fails schema validation anywhere else would start an unsandboxed session. Settle what the watcher checks before launching on a per-run profile, and add a row that launches on a deliberately invalid one.
   - Keep `doctor`'s profile checks grading whatever this produces.
3. **Write-deny the main checkout's whole `.git`.** Once fetches are the only route for objects, replace the per-file `.git` entries with the whole directory. A sibling-glob `.git` entry that covered a clone's whole `.git` would close the clone to its own sandboxed git, so settle how the glob entry changes.
   - **Settle the remote job explicitly.** A job-mode session's cwd **is** the main checkout. The plan must either:
     - keep that session's `.git` writable for sandboxed `git add`, `git stash` and `git checkout -- <file>`; or
     - state, from a read of the flows, which sandboxed git writes a job session issues and why each is harmless or rerouted.

     Add a manual row for a job-mode-shaped session either way.
   - The generated profile's `_README` sentences describing the protected set stay true.
4. **Replace what git gave for free.**
   - **One-branch-one-checkout:** the library's one-live-copy rule backs `create-worktree.sh`'s and `--existing`'s refusals and `branch-prompt.md`'s collision guard.
   - **Branch visibility:** the main checkout's ref is updated at every point the flows push or checkpoint, so a user reviewing from the main checkout sees what they see today. The docs say where it can lag.
   - **Cleanup:** `cleanup-merged-worktrees.sh` finds run copies from the registry, not from `git worktree list`, and removes a clone through the library. Its `--dry-run` decides by the same rule.
   - **Alternates lifetime:** settle in the plan whether a long-parked run's clone is dissociated, or how the main checkout's `gc` is otherwise kept from pruning what a clone borrows. Dissociating copies the whole history.
   - **One shared ref was one compare-and-swap.** In a worktree, a wrapper's compare-and-swap lands on the very ref the run commits to, so a concurrent commit is caught and nothing moves. On a clone there are two refs. Today every operation moves the main checkout's ref first and then syncs out to the clone (`hr_commit_paths_var`, `hr_run_fast_forward_var`, `refresh-branch.sh`, and `push-branch.sh`'s `origin/<branch>` mirror). The main checkout's compare-and-swap cannot see a commit made in the clone after sync-in. The wrapper's commit lands, sync-out's own compare-and-swap refuses to overwrite the clone's commit, and the two copies are left diverged: every later sync-in refuses.
     - Move the clone's ref **first**, by compare-and-swap against the tip sync-in read, then the main checkout's. If the main checkout's swap fails, roll the clone's ref back by compare-and-swap. This puts the guard on the ref other writers touch.
     - This changes the order `feat_clone_per_run`'s goal 3 set ("sync out after a ref moves"). Restate the sync model in the library's *THE CLONE ARM'S SYNC* header, `docs/watcher.md` §2 and `docs/cli.md` §6.
     - Test it with a fixture that commits in the clone between sync-in and the main checkout's update, for each of the four operations above. Expect the operation to refuse with nothing moved on either side.
   - **A failed sync-out must not strand the clone.** Today, if sync-out fails for any other reason (a lock, a disk error, a tampered config), the clone is left strictly behind the main checkout. Nothing re-runs the sync, so every later commit, push and refresh on that clone refuses until a person moves its ref by hand.
     - With the clone-first order, such a failure leaves the clone unchanged or ahead, and the next sync-in fast-forwards the main checkout.
     - For any path that still moves the main checkout's ref first, sync-in heals a clone that is strictly behind: it fast-forwards the clone's ref to the main checkout's by compare-and-swap, then proceeds. A diverged clone still refuses.
     - Test both: a forced sync-out failure followed by an ordinary wrapper call that succeeds; and a diverged clone that is still refused.
5. **Migration.** A run that is parked or paused in a linked worktree when this lands must still resume, commit and finish, and be swept by the cleanup. Support both layouts until no worktree run is left, or migrate one on resume. State which in the plan and test it, with a manual step for the maintainer.
6. **Move the existing suites.** Every suite that runs `create-worktree.sh`, the watcher's payload paths or the remote verbs moves to the clone layout. A worktree-only plant moves to the clone's equivalent, or stays covered by a migration case. No assertion is left that can no longer fail.
7. **Docs of record.**
   - `docs/watcher.md` §2.
   - `docs/cli.md` §6 and §7: remove the object-substitution residual and the record-race residuals this branch closes; add any it opens, the alternates residual among them.
   - `docs/sandbox-verification.md`'s owed rows: the per-run protection, `<main>/.git` refused as a whole, the three wrappers on a real clone, a legacy worktree run's commit, the job-mode session and the full flow.
   - The owed re-run notes in `docs/outer-loop-verification.md` and `docs/guard-verification.md`.
   - The worked example's re-rendered profile and the figures its README states.

## Constraints

- Every protection that exists today stays:
  - the wrappers' target and configuration refusals;
  - the pinned hooks;
  - the `pre-push` hook;
  - the write protection;
  - the guards.

  A dependency may be replaced, never just removed.
- Do not use `--local` hardlinks.
- Do not widen `allowWrite`. The point is to need less of it.
- Disk and time per run stay comparable to today. The object store is borrowed, not copied.
- How the run loads the plugin does not change.
- The script names, `<worktree_glob>`, the registry field `worktree` and the `doctor` check id `worktrees` stay.
- Scripts stay bash 3.2 compatible, and the existing git version floors hold.
- No test is ever aimed at this repository's own main checkout.
- `scripts/run-gates.sh` passes.

## Not in this branch

- The process-level sandbox (`sandbox5b feat_unattended_process_sandbox`).
- WSL2 support.
- Removing the worktree arm. That waits until no worktree run is left.
