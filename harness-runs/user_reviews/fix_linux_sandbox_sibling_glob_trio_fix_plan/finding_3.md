### 3. The clone trust check refuses the empty `config.worktree` Claude Code creates at every session start, so a Linux run copy is refused from its first session

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_clone_target_check_var`) — "for name in commondir config.worktree objects/info/http-alternates; do", and its header's condition 3, "`.git/commondir`, `.git/config.worktree` and"
**Also:**
- `cli/templates/scripts/commit-on-branch.sh`, `cli/templates/scripts/push-branch.sh` and `cli/templates/scripts/refresh-branch.sh`, each header's paragraph **A CLONE IS A TARGET TOO**: "Those conditions already refuse a `config.worktree`";
- `cli/templates/scripts/autonomous-watcher.sh` (`spawn_engine`): "The launch check: the render omits a clone's commondir, config.worktree";
- `cli/src/generators/writeProtection.ts` (`CopyGitPath.bubblewrapDenyWrite` doc and `applyWriteProtection`'s `_README`), and `cli/src/doctor/checks.ts` (`profile-write-protection`): "refuses a run copy carrying one";
- the self-adopted copies under `scripts/`.

**What is wrong.** This was checked against the current tree. `hr_clone_target_check_var` condition 3 refuses a clone when `.git/commondir`, `.git/config.worktree` or `.git/objects/info/http-alternates` exists at all, in any shape. Every caller goes through it:
- `hr_wrapper_target_check_var`, which is every wrapper's target check;
- `hr_run_copy_check_var`, and so `spawn_engine`'s placeholder-host launch check, the watcher's resume, reset and review paths, `create-worktree.sh` and `remote-run.sh`.

Both 2026-10-30 sessions show the clone's `config.worktree` created at session A's start as a real `regular empty file, 0 B, -rw-r--r--`, whether or not any profile rule names it. Session 2 removed every rule naming it, and it still appeared. So no profile change removes it, and today a Linux run copy is refused from its first session (AP3: `hr_run_copy_check_var` exits 1).

**Fix: accept exactly one inert shape, nothing more.** This is the user's constraint *"The trust checks are weakened only as item 3 states."*

1. **In `hr_clone_target_check_var`, replace the single loop with three arms.**
   - **`commondir`.** Refuse it if it exists in any shape (`-e` or `-L`), empty included, with the current sentence. An empty `commondir` breaks git itself: in AP3, `git status` exited 128 outside the sandbox.
   - **`config.worktree` and `objects/info/http-alternates`.** Accept each only when it is absent, or a regular file that is not a symbolic link and is 0 bytes: `[ -f "$p" ] && [ ! -L "$p" ] && [ ! -s "$p" ]`. A character device such as the `/dev/null` placeholder fails `-f`. A file with content, a symbolic link (even one to an empty file) and any non-regular file are refused. Keep the refusal sentence "… exists, and a clone the harness made has none" for those shapes, or a sentence starting the same way, so the payload suites' `plantedFile` regexes (`cli/test/watcher-review-drop-payloads.test.mjs`, `cli/test/watcher-stall-reset-payloads.test.mjs`) still match. If you change it, change those regexes in the same commit.
   - **The extra condition for `config.worktree`.** When the file is present, refuse unless `extensions.worktreeConfig` is not true in the clone's `.git/config`. Use the library's existing pinned form (`git -C / config --file "$gd/config" …`, as `hr_clone_config_spec` reads `extensions.objectformat`), with `--bool --get extensions.worktreeConfig`. Fail closed:
     - exit 1 (key absent) accepts;
     - exit 0 with the value `false` accepts;
     - exit 0 with any other value refuses;
     - any other exit refuses.

     Git reads `config.worktree` only when that repository-format setting is on, and `.git/config` stays write-protected and held to an allow-list by condition 5 (`hr_clone_config_check_var`).
2. **Rewrite condition 3 in the function's header**, and the "Condition 3 is load-bearing" paragraph, to state the new rule and why it is safe:
   - `config.worktree` is inert while the extension is off;
   - `http-alternates` is read only by a client fetching **from** this repository over the dumb HTTP protocol, and local git never reads it;
   - an empty file of either kind carries nothing.

   Also state why the change is needed: something no profile entry controls creates `config.worktree` at every session start (both 2026-10-30 sessions). Its cause stays open in `docs/sandbox-placeholder-upstream-report.md`.
3. **The other checks.** Every check that tests these three paths applies the same rule through this one function. Grep `cli/templates/scripts` for `config.worktree` and `http-alternates` to confirm nothing else tests the clone's three paths. Do not touch `hr_wrapper_main_of` / `hr_run_main_set_var`: they test a **main** checkout's `commondir`, which stays refused. Then update each caller's comment so it says why:
   - The three wrapper headers' **A CLONE IS A TARGET TOO** sentence, "Those conditions already refuse a `config.worktree` and hold `.git/config` to an allow-list, so `hr_worktree_config_check_var` is skipped on that arm alone". It becomes: those conditions accept only an empty, regular `config.worktree` with `extensions.worktreeConfig` off, which git never reads, and hold `.git/config` to an allow-list…
   - `spawn_engine`'s launch-check comment: a planted `commondir`, or a non-empty or non-regular `config.worktree` or `http-alternates`, is refused there.
   - `writeProtection.ts` and `doctor`: the clause "refuses a run copy carrying one" becomes "refuses a run copy carrying a `commondir`, or a `config.worktree` or `http-alternates` that is not an empty regular file". Change both strings in step with each other.
4. **Tests.** Edit or create only the files you run. The condition-3 fixtures go in `cli/test/clone-trust-check.test.mjs`, the suite that owns `hr_clone_target_check_var`'s rule: its header states it ("its `.git` holds no file that redirects git"), its case `(h) A planted commondir, config.worktree or http-alternates is refused` is the existing pin for condition 3, and `cli/test/clone-create-remove.test.mjs`'s header names it as the owner of the check's refusals. Do **not** put them in `cli/test/wrapper-clone-arm.test.mjs`, whose header states a different rule (how the three wrappers act on a registered clone) and points elsewhere for the trust check; this finding does not edit that file.
   - **Header.** Read the suite's header first, then extend its rule statement to name the one accepted shape: a `.git/config.worktree` or `.git/objects/info/http-alternates` that is a regular file, 0 bytes and not a symbolic link, and for `config.worktree` only while `extensions.worktreeConfig` is off. Every other shape, and any `commondir`, is still refused. Add the FIFO note there too (see the non-regular bullet below).
   - **Case `(h)`.** Keep its content-bearing plants and its `<path> exists` regex unchanged. Its title stays accurate, since a planted file with content is still refused, so change it only if your wording of the accepted shape makes it inaccurate.
   - **New fixtures**, beside case `(h)`, built with the suite's own `fixture` and `assertRefused` helpers (accepted cases assert the check passes, as case `(a)` does):
     - an empty regular `config.worktree` is accepted;
     - an empty regular `http-alternates` is accepted;
     - `config.worktree` with content is refused;
     - `http-alternates` with content is refused;
     - a symbolic link to an empty file at each path is refused;
     - a non-regular file at each path is refused. A character device needs `mknod`, which an unprivileged test cannot run, so use a FIFO (`mkfifo`): it fails `-f` exactly as the `/dev/null` placeholder does. A symbolic link to `/dev/null` belongs to the symlink arm, not this one;
     - an empty `config.worktree` is refused when `extensions.worktreeConfig` is `true` in `.git/config`. That key is also off the allow-list, so assert on the condition-3 sentence, which must come first;
     - an empty `commondir` is refused.

   In `cli/test/watcher-placeholder-host.test.mjs`, add one case: a clone carrying an empty 0644 `.git/config.worktree` passes the placeholder-host launch check and is launched.

   Step 3 changes two adopter-facing strings, and each is pinned by an existing fixture case, so extend both:
   - `cli/test/profile.test.mjs` → the write-protection `_README` assertions on `protectionLine` (the line starting `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN`): assert the new clause literally, that the watcher refuses a run copy carrying a `commondir`, or a `config.worktree` or `http-alternates` that is not an empty regular file. Keep the assertions Finding 1 added matching.
   - `cli/test/doctor-profile-sandbox.test.mjs` → case `'(a) passes on a freshly generated profile, stating the Linux residual'`: assert the same clause literally in the `profile-write-protection` pass message. Keep the assertions Finding 1 added matching.

   Run each edited file alone: `npm test --workspace cli -- test/<name>.test.mjs`, for `clone-trust-check`, `watcher-placeholder-host`, `profile` and `doctor-profile-sandbox` (plus either payload suite whose `plantedFile` regex you changed in step 1).
5. **The self-adopted copies.** Copy each changed template onto its root twin byte for byte and `cmp` each pair: `scripts/lib/harness-run-lib.sh`, `scripts/commit-on-branch.sh`, `scripts/push-branch.sh`, `scripts/refresh-branch.sh` and `scripts/autonomous-watcher.sh`.

macOS is unaffected in behaviour. A clone there never carries these files, and the accepted shape is the same on every host. The fixtures run on either host.
