`feat_clone_per_run` lays the ground for giving every autonomous run its own self-contained git repository, a `git clone --shared` of the main checkout, instead of a linked worktree that shares the main checkout's `.git`. This branch teaches the shell library and the three excluded wrappers to **recognise, trust, sync with, create and remove** such a clone, and proves every one of those paths by fixture. **Every real run still gets a linked worktree when this branch merges.** Nothing outside the tests creates a clone yet, so no flow, profile or plugin reader changes behaviour.

It starts from a `dev` that carries `fix_sandbox_worktree_record_writes` (`sandbox1e`). Read what that branch measured and shipped in `docs/sandbox-verification.md` before designing anything.

**Why.** Two sandbox problems come from the linked-worktree layout.
- **The record write** (`docs/sandbox-verification.md` → the ordinary-git and full-flow rows). Sandboxed git cannot write the worktree's record, `<main>/.git/worktrees/<name>/`, so the run's ordinary git depends on excluded wrappers writing into a directory outside its own copy.
- **The shared object store** (`docs/cli.md` §6 → the residuals list). The sandbox can write `<main>/.git/objects`, and git does not re-hash loose objects it already has, so a run can substitute an object that the main checkout and every other run then trust.

A per-run clone removes both, provided objects reach the main checkout only through a fetch, which verifies what it receives. The closest stated rationale for today's layout argues for *a separate checkout per run*, which a clone also gives: `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_main_repo`'s "WHY THE MAIN CHECKOUT IS A SEPARATE ANCHOR" comment.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The anchors were true at `bf4c1925`. Re-verify each one before planning on it.

## What depends on the shared `.git` today, and which of it this branch reaches

This branch reaches only the unsandboxed side: the library, the excluded wrappers and the watcher family's git. Each dependency below gains a **clone arm beside its worktree arm**. The worktree arm stays byte-for-byte, because every real run keeps using it until the layout switch.

1. **The unsandboxed wrappers trust only a worktree the main checkout lists.** `hr_wrapper_target_check_var` accepts a target only if it is the main checkout, or a copy whose `.git` pointer leads into `<main>/.git/worktrees` with a matching `commondir` and `gitdir`. A clone is exactly the "scratch repository" that check refuses (`docs/sandbox-verification.md` row C1). This is used by:
   - `push-branch.sh`, which runs its git calls in the main checkout and pushes `refs/heads/<branch>` from the main checkout's refs;
   - `refresh-branch.sh`;
   - `commit-on-branch.sh`;
   - `setup-worktree.sh --target`;
   - `hr_run_copy_check_var`.
2. **The trusted config and hooks live in `<main>/.git`, which the sandbox cannot write** (`cli/src/generators/writeProtection.ts`). A worktree has no config of its own beyond `config.worktree`, which `hr_worktree_config_check_var` holds to one key and `hr_pinned_hooks_path` pins. A clone's `.git/config`, `.git/hooks` and `objects/info/alternates` sit inside the run's own copy, so unsandboxed code must not trust any of them without checking.
3. **The watcher's git calls read the run through the main repository** (`docs/watcher.md` → `### Where the family runs git in a run's copy, and under what pins`).
   - `hr_run_copy_git` runs with `GIT_DIR=<main>/.git` and the record's index.
   - `hr_run_copy_check_var` reads the tip from `worktrees/<name>/HEAD`.
   - `hr_run_main_set_var` refuses any `.git` holding a `commondir`.
   - The fast-forward, the watchdog's reset and the surface check all depend on this.
4. **The run's commits are visible in the main checkout immediately**, because the ref store is shared. A clone's are not until something moves the main checkout's ref.
5. **Git's one-branch-one-checkout rule** is a free collision guard today. A clone does not get it.
6. **Bootstrap writes into the main checkout's shared config.** `setup-worktree.sh` sets `extensions.worktreeConfig` and a per-worktree `core.hooksPath`.

## Verified git facts (these come from git's own documentation; re-check against the installed git's man pages)

- **`git clone --shared` (`-s`)** sets up `.git/objects/info/alternates` to borrow the source's objects instead of copying them. git warns that objects the source later prunes, after the clone stops being able to reach them through the source's refs, can corrupt the clone.
- **`git clone --local`** (the default for a path source) hardlinks the object files. A hardlinked file is the same inode as the main checkout's copy, so an in-place overwrite inside the clone changes the main checkout's object. **Do not use it**; `--no-hardlinks` or `--shared` avoid it.
- **A fetch into the main checkout from the clone** receives a pack that `index-pack` hashes as it indexes it, so an object whose content does not match its name is rejected. That is the property that closes the object-substitution residual.
- **Observed with git 2.50.1 during an earlier planning pass; re-check before relying on it:** a `--shared --no-checkout --template=` clone is written at `core.repositoryformatversion=0` even when the source is at `1`, and it carries no `extensions.*` key even when the source carries `extensions.worktreeConfig=true`.
- **Unresolved, to measure by test:**
  - which of the clone's own config keys a local-transport fetch *from* the clone honours. `git-upload-pack` runs in the clone, and git restricts some `uploadpack.*` keys to protected (system/global) configuration;
  - whether any filter, hook or fsmonitor in the clone runs during that fetch, or during any other git call unsandboxed code makes on the clone.

## The goal

1. **Record the measurement that gates the whole series.** The maintainer took it by hand on 2026-10-19, before this branch launched, because a sandboxed run cannot start the headless session it needs. Write it into `docs/sandbox-verification.md` as rows, under that file's `## 0. Method` conventions: one row per probe, the commands verbatim, and the stamp below.

   **Setup.**
   - **Stamp:** Claude Code 2.1.303, git 2.50.1 (Apple Git-155), macOS, arm64.
   - **Clone:** `git clone --shared` of the main checkout, made from an ordinary terminal at `<work_root>/autonomous-sdlc-harness-sbx_clone_probe`, inside the profile's sibling glob.
   - **Launch:** `## 0. Method`'s launch line, cwd = the clone, `--add-dir <clone> --add-dir <main>/harness-runs`, with `--allowedTools` for `git switch`, `dd`, `mv` and `git config` where a call needed it.
   - **Calls:** one exact call each:
     - `git add <file>`
     - `git commit -m "<subject>"`
     - `git fetch origin` (the clone's origin is the main checkout's path)
     - `git stash push`, then `git stash pop`
     - `git switch -c <x>`
   - **Controls:** `dd` creating a new file in `<clone>/.git` and in `<main>/.git`, and a zero-byte `dd … conv=notrunc` open of `<clone>/.git/config`.

   **Results.**
   - **Probe 1, the real profile as `sandbox1e` left it, with the clone on `dev`:**
     - every git write was refused with `Operation not permitted`: `<clone>/.git/index.lock`, `.git/FETCH_HEAD`, `could not write index`, and the `refs/heads/<x>.lock` for `switch`;
     - the new-file control in `<clone>/.git` was refused;
     - the one in `<main>/.git` was **written**;
     - `git commit` was refused by `git-commit-branch-guard.sh` because the clone was on a protected branch, before it reached the sandbox. That is a setup error, not a finding.
   - **Probe 2, a scratch profile with only the sandbox `denyWrite` entry `<work_root>/autonomous-sdlc-harness-*/.git` removed, with the clone on a non-protected branch:** every git write was refused exactly as in probe 1, `git commit` included, and so was the `<clone>/.git/config` open.
   - **Probe 3, the same scratch profile, one `git add` with `--debug-file`, once with cwd = the clone and once with cwd = the main checkout:**
     - refused in the clone;
     - **succeeded** in the main checkout.
   - **Probe 4, probe 2's scratch profile with the permission pair `Edit(//<work_root>/autonomous-sdlc-harness-*/.git)` / `Write(…)` also removed:**
     - **every git call succeeded:** add, commit (`9ea0349b`), fetch, stash push and pop with the change restored, and `switch -c`;
     - the new-file controls in `<clone>/.git` and `<main>/.git` were both written;
     - the zero-byte open of `<clone>/.git/config` was **still refused**, with no remaining profile entry naming that path.
   - **Probe 5, probe 4's scratch profile; every write inert** (a zero-byte `dd … conv=notrunc`, an empty non-executable marker, or a key git never reads):
     - **refused** with `Operation not permitted`:
       - a new file in `<clone>/.git/hooks/`;
       - opening the existing `hooks/pre-commit.sample`;
       - opening `objects/info/alternates`;
       - `git config sbx.probe true` (`could not lock config file .git/config`);
     - **written:**
       - a new file in `objects/info/`, which is where an `http-alternates` would go;
       - a new file in `info/`;
       - a new file directly in `.git`, which is where a planted `commondir` or `config.worktree` would go.

     Two renames of byte-identical copies back onto `config` and onto a hook sample were refused at the **permission layer** (`… denied because Claude Code is running in don't ask mode`, with no profile rule naming `mv`). They never reached the sandbox, so a rename onto a protected path is **unmeasured**. A first probe-5 session made no call at all: its model declined a sequence that installed a hook and redirected `core.hooksPath`, which is why every probe-5 write is inert.

   **What the rows settle.**
   - Sandboxed ordinary git works in a clone. What closed it in probes 1–3 was the profile's own sibling-glob `.git` rules, written for a worktree's `.git` pointer file.
   - An `Edit(…)` **permission deny rule alone** closes that path to sandboxed commands, not only to the file tools.
   - The runtime itself refuses sandboxed writes to the cwd repository's `.git/config`, `.git/hooks/` and `objects/info/alternates`.
   - It leaves the rest of that `.git` open, `objects/info/`, `info/` and new top-level files included. So the clone arm's refusal of `commondir`, `objects/info/http-alternates` and any other planted file is load-bearing, and not a redundant check.

   This branch changes no profile entry; the switch branch does.
2. **A trust check for a clone.** Rebuild the wrappers' target check so it also accepts a run copy that is a clone, on all of these:
   - it sits at the path the run registry records for the branch its `HEAD` names;
   - that path is the derived `hr_worktree_dir <main> <branch>`;
   - its `.git` is a real directory, with no `commondir` and no `objects/info/http-alternates`;
   - its `objects/info/alternates` names exactly `<main>/.git/objects`;
   - its `.git/config` holds only an allow-listed set of keys and values, which the plan states as one contract between this check and the creating code.

   Anything else is refused, and the refusal names the key and never its value. A check must not write: reading the registry must not create it.
3. **Objects reach the main checkout only by fetch.** Every unsandboxed operation on a clone follows one model:
   - **sync in:** the main checkout fetches the clone's `refs/heads/<branch>` into its own refs;
   - **operate:** the existing operation runs in the main checkout, under the main checkout's config, unchanged;
   - **sync out:** after a ref moves, the clone's ref is set to match.

   For a worktree or the main checkout, sync-in and sync-out are no-ops. The fetch runs with the same pins the watcher family already applies to a run's copy (hooks off, no fsmonitor, no filters), settled by measuring the unresolved points above **by test**. A substituted object must be rejected. A sync-in must refuse when the main checkout itself has `<branch>` checked out.
4. **The three excluded wrappers gain their clone arm.** `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` work against a clone through the model above. Their exit contracts and stdout lines are unchanged, and every refusal they make today still fires on both arms. That includes `hr_worktree_config_check_var` on the main-checkout and worktree paths.
5. **The watcher's git family gains its clone arm.** `hr_run_copy_git`, `hr_run_copy_check_var`, `hr_run_main_set_var`, the fast-forward, the watchdog reset and the surface check each work on a clone's own git dir. They keep pins equivalent to today's and are re-checked against `docs/watcher.md` §2's list.
6. **Creating and removing a clone, in the library only.**
   - **Create:** clone `--shared`, never `--local` hardlinks. Make the clone's `origin` and remote-tracking refs mean what they mean in a worktree today. Record the copy in the registry at creation, before any check reads it. Refuse a second live run copy for the same branch, which replaces one-branch-one-checkout.
   - **Remove:** guarded. Never the main checkout, never a path off the derived one, never through a `.git` that is a symbolic link. Removal stays possible for a registered clone whose config check fails, so a tampered copy can still be cleaned up.
   - **Failure:** a creation that fails part-way removes everything it created, copy and branch alike, and nothing it did not.

   `create-worktree.sh` does **not** call this yet.
7. **`setup-worktree.sh --target` gains a clone arm.** The hooks path goes into the clone's own `.git/config`, and nothing is written to the main checkout's shared config. Its no-target behaviour is unchanged.
8. **Protect the run registry.** Once the trust check reads it, a sandboxed write to the registry could aim unsandboxed code at a forged copy. Write-protect the registry file on both sides, sandbox and file tools, by exact path rather than a glob. First confirm that no sandboxed process writes it. Then add an owed `docs/sandbox-verification.md` row: a sandboxed `mv <sibling> registry.json` is also refused, because the library itself writes the registry by `mktemp` plus `mv`. Keep `doctor`'s profile checks grading the new entry.
9. **Docs of record.**
   - `docs/watcher.md` §2: the family's git on both arms.
   - `docs/cli.md`'s description of the wrappers' target check.
   - The owed rows above in `docs/sandbox-verification.md`.
   - The clone arm is described as present and tested, and created by nothing yet.

## Constraints

- Every protection that exists today stays:
  - the wrappers' target and configuration refusals;
  - the pinned hooks;
  - the `pre-push` hook;
  - the write protection;
  - the guards.

  A dependency from the list above may be given a clone arm, never just removed.
- The worktree arm of every check, wrapper and family function keeps its behaviour byte-for-byte, and the existing suites that exercise it keep passing unedited where they can.
- Do not use `--local` hardlinks.
- Do not widen `allowWrite`.
- Disk and time per copy stay comparable to a worktree. The object store is borrowed, not copied.
- Scripts stay bash 3.2 compatible, and the existing git version floors hold. Check that every git flag this branch relies on is available at them.
- No test is ever aimed at this repository's own main checkout or registry.
- `scripts/run-gates.sh` passes.

## Not in this branch

- **The main-checkout anchor and the "run copy" wording.** That covers `HARNESS_MAIN_REPO`, the plugin's `<MAIN_REPO>` readers, the `AUTONOMOUS_STOP` checks and the QA-lock helpers. It is the next branch.
- **The layout switch.** That covers:
  - `create-worktree.sh`, the watcher's launch and `remote-run.sh` cutting clones;
  - the per-run profile and the whole-`<main>/.git` write denial;
  - cleanup from the registry, and migration.

  It is the branch after that.
- The process-level sandbox (`sandbox5b feat_unattended_process_sandbox`).
- WSL2 support.
