### Task 2 — Add `cli/test/commit-on-branch-target-check.test.mjs`: the commit wrapper's refusals, hooks pin and protected set

**Goal:** Prove, against a hand-built fixture, that the main checkout's `commit-on-branch.sh` refuses everything its siblings refuse before its first git call, and decides protection from the main checkout's configuration alone. Those refusals are the guarantee that lets Task 4 run it outside the sandbox.

**Depends on:** Task 1, which rebuilt `cli/templates/scripts/commit-on-branch.sh` to this contract:

- usage `commit-on-branch.sh [--repo <repo-dir>] <path>... -- <subject> [<body-line>...]`;
- exits 0 / 1 / 2 / 3, as committed / error or refusal / protected branch / nothing to commit;
- every new refusal is one stderr line beginning `commit-on-branch.sh: refusing to commit: `;
- the main checkout is placed from the script's own location (`hr_wrapper_main_of`), and the target must be that checkout or a worktree it lists (`hr_wrapper_target_check_var`);
- the record's `config.worktree` may hold only the `core.hooksPath` `setup-worktree.sh` writes (`hr_worktree_config_check_var`);
- `core.hooksPath` is pinned to `<main>/<githooksDir>` or `<main>/.git/hooks` (`hr_pinned_hooks_path`);
- protection is judged from `<main>/harness.config.json` only.

This task asserts that contract and changes no script. The commit mechanics — the exit-0 and exit-3 paths, index sync, no commit hook, records rewritten after the checks — are **Task 3's** file, so neither suite duplicates the other.

### Targets

- `cli/test/commit-on-branch-target-check.test.mjs` (new)

**Work:**

- [ ] **Header first** (`.claude/context/conventions.md` → `## The testing bar`: *"A test file opens with the rule it exists to enforce"*). State the rule: the main checkout's commit wrapper writes nothing, and runs no git in the target, unless the target is the main checkout its own file sits in, or a worktree that main repository lists, and that worktree's `config.worktree` holds nothing but `setup-worktree.sh`'s `core.hooksPath`. The protected set is the main checkout's, never the target's. Every refusal exits 1 (2 for a protected branch) and leaves the target's refs, index and files byte-identical.
- [ ] **The fixture, built by hand rather than by `init`,** following `cli/test/wrapper-target-check.test.mjs`'s `CONFIG` and its two-repository layout. Build:
  - a main checkout carrying `harness.config.json`, with the three templates `commit-on-branch.sh`, `push-branch.sh` and `refresh-branch.sh` plus `lib/` copied from `cli/templates/scripts` into its scripts directory;
  - a linked worktree on a working branch, with its `config.worktree` set as `setup-worktree.sh` sets it;
  - a scratch repository outside both.

  Use `runGit` and `runBash` from `cli/test/helpers/fixture.mjs`. Everything goes under the system temp directory and is torn down in process. Nothing is created in this checkout (`.claude/context/conventions.md` → `## The testing bar`). Set `user.name` and `user.email` in the main repository's configuration, because the commit is built from it.
- [ ] **Refusal cases, each asserting the bytes on disk and not only the message** (`.claude/context/cli.md` → *"A refusal is asserted on the bytes on disk"*). Snapshot the target's `refs/heads/<branch>`, its index (`git ls-files -s` and a hash of the index file), and `git status --porcelain` before and after each call:
  - (a) a scratch repository as `--repo`, refused before git runs there: its `.git/config` sets `core.fsmonitor` to a marker command, and the marker is never created;
  - (b) a worktree whose `.git` pointer was rewritten to the scratch repository;
  - (c) a worktree whose record's `commondir` was rewritten;
  - (d) a `commondir` planted in the main `.git`, so the script cannot place its main checkout;
  - (e) a `config.worktree` carrying `core.fsmonitor`: refused, and the message names the key and never its value;
  - (f) a `config.worktree` whose `core.hooksPath` is not the one `setup-worktree.sh` writes;
  - (g) a branch whose name starts with `-`.
- [ ] **Protection comes from the main checkout.**
  - (h) The worktree is on a branch the main configuration protects, but its own committed `harness.config.json` drops it. The result is exit 2 and nothing staged.
  - (i) The main checkout's `harness.config.json` is truncated to invalid JSON. The result is exit 1 and `HEAD` unchanged, whatever the worktree's copy says.
  - (j) The **positive control** for this suite: the main checkout itself as the target, on an unprotected branch, commits (exit 0). It proves the refusals above are attributable to their conditions.
- [ ] **The hooks pin.** (k) A `pre-commit` and a `post-index-change` hook that each write a marker are placed in the worktree's own `githooks` directory, the one its `config.worktree` names. A committing call from the main copy creates neither marker. Run one case each against the pinned `<main>/<githooksDir>` and against a `core.hooksPath` naming a directory outside both accepted ones, which is refused with exit 1.

**Verification:**

- `npm test --workspace cli -- test/commit-on-branch-target-check.test.mjs`, from the repository root, as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status (`.claude/context/conventions.md` → `## The testing bar`). Every case passes, and `# fail 0`.
- Mutate once by hand, then revert: comment out the `hr_wrapper_target_check_var` call in the fixture's copy of the script. Cases (a)–(c) must then fail, which shows they test the check and not something incidental.

- **Deviations from plan:**
  - The mutation check edited `cli/templates/scripts/commit-on-branch.sh` itself (the fixture copies it per case), then `git checkout --` reverted it; the tree was clean afterwards. Commenting out the whole `if ! hr_wrapper_target_check_var …; then … fi` block trips `set -u` on `HR_TARGET_GITDIR` and fails 11 of 12 cases, which proves nothing about (a)–(c). The applied mutation instead kept the call and dropped its refusal (`hr_wrapper_target_check_var "$main_top" "$top_nogit" || : ; if false; then`). Result under `npm test --workspace cli -- test/commit-on-branch-target-check.test.mjs`: `# tests 12`, `# pass 9`, `# fail 3`, with exactly (a), (b) and (c) failing. After the revert: `# tests 12`, `# pass 12`, `# fail 0`, exit 0.
  - Case (k) is split into two tests: (k) uses the pinned `<main>/githooks` and commits (exit 0, no marker), and (k2) uses a foreign `core.hooksPath` and is refused (exit 1, target byte-identical, no marker).
