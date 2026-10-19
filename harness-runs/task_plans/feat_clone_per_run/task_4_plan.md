### Task 4 — Add `cli/test/clone-trust-check.test.mjs`: every acceptance condition and every refusal of the clone arm

**Goal:** Prove, against a throwaway fixture, that the library's target check accepts a clone **only** on the five conditions of the task prompt's goal 2, that it refuses every planted or forged variant while naming keys and never their values, and that reading the registry writes nothing.

**Depends on:** Task 1, which adds these to `cli/templates/scripts/lib/harness-run-lib.sh`:

- **`hr_wrapper_target_check_var <main> <target>`** gains a clone arm. It is taken when `<target>/.git` is a real directory. It sets `HR_TARGET_KIND` (`main` / `worktree` / `clone`), `HR_TARGET_GITDIR` (`<target>/.git`) and `HR_TARGET_BRANCH`, and accepts only when all of these hold:
  1. the registry at `hr_state_path <main> autonomous_logs/registry.json` records `copy_kind=clone` and `worktree=<target>` for the branch `<target>/.git/HEAD` names. Failing this gives today's sentence with a clause appended: `… is neither the main checkout <main> nor a worktree it lists: its .git is not a regular pointer file, and the run registry records no clone of <main> at that path`;
  2. `<target>` is `hr_worktree_dir <main> <branch>`;
  3. `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` are each absent, and `.git/objects` and `.git/objects/info` are real directories;
  4. `.git/objects/info/alternates` is a regular file holding exactly one line, `<main>/.git/objects`;
  5. `hr_clone_config_check_var <main> <target>` passes.
- **`hr_clone_config_spec <main> <top>`** prints the allow-list:
  - `core.repositoryformatversion=0` and `core.bare=false`, both required;
  - `core.logallrefupdates=true`;
  - `core.filemode`, `core.ignorecase`, `core.precomposeunicode` and `core.symlinks`, each `bool`;
  - `remote.origin.url=<main's own>`, required when the main checkout names one;
  - `remote.origin.fetch=+refs/heads/*:refs/remotes/origin/*`, required;
  - `core.hookspath=<top>/<main's githooksDir>`.

  The check refuses any key off that list, a duplicate, or a missing required key, naming the key and never the value.
- **`hr_wrapper_branch_var`'s clone arm** returns `HR_TARGET_BRANCH` and never re-reads `HEAD`.
- **`hr_registry_peek <file> <branch> <key>`** never creates the file.

It also depends on Task 3's `hr_clone_create_var <main> <branch> <start>`, which sets `HR_CLONE_DIR`. That is the creating code half of the one contract, so this suite's positive case is a clone it made.

**Where this task stops.** Creation's own invariants, its rollback and the removal guard are **Task 6's**. Sync is **Task 5's**. The wrappers' use of this check is **Task 8's**. This task changes no script.

### Targets

- `cli/test/clone-trust-check.test.mjs` (new)

**Work:**

- [ ] **Header first** (`.claude/context/conventions.md` → `## The testing bar`: *"A test file opens with the rule it exists to enforce"*). State the rule:
  - an unsandboxed wrapper runs git in a clone only when the run registry records that clone at the branch's derived path, its `.git` holds no file that redirects git, its alternates borrow from the main checkout alone, and its configuration is on the one allow-list its creator writes;
  - anything else is refused, naming a key and never a value;
  - the check writes nothing.

  Name the measurement the planted-file cases rest on: Task 14's row CL5, where the runtime leaves new top-level `.git` files and `objects/info/` sandbox-writable.
- [ ] **The fixture, built under the system temp directory and torn down in process.**
  - A main checkout carrying a hand-written `harness.config.json`, following `cli/test/wrapper-target-check.test.mjs`'s `CONFIG` with its state directory's `autonomous_logs/` made, and a local bare origin.
  - The library sourced from `cli/templates/scripts/lib/harness-run-lib.sh`, through `runBash` from `cli/test/helpers/fixture.mjs` (`. "$1"; …`). Each call prints the globals it sets, so a case asserts `HR_TARGET_KIND`, `HR_TARGET_GITDIR`, `HR_TARGET_BRANCH` and the refusal.
  - The clone made by `hr_clone_create_var` at `hr_worktree_dir <main> <branch>`, inside the same temp tree.
  - Nothing is created in this checkout, and nothing is aimed at its registry.
- [ ] **Acceptance and the arms' separation.**
  - (a) The created clone is accepted: `HR_TARGET_KIND=clone`, `HR_TARGET_GITDIR=<clone>/.git`, `HR_TARGET_BRANCH=<branch>`, and `hr_wrapper_branch_var` returns that branch.
  - (a2) The clone stays accepted after `core.hooksPath=<clone>/<githooksDir>` is added to its `.git/config`, which is the one key setup adds.
  - (b) The main checkout itself gives `HR_TARGET_KIND=main`, and a linked worktree gives `worktree`, with today's behaviour.
  - (c) **"A check must not write":** with no registry file, the check refuses, and the registry file **and** its lock are still absent afterwards. Repeat the same through `hr_registry_peek` alone.
- [ ] **Refusals, each asserting the bytes on disk as well as the message** (`.claude/context/cli.md` → *"A refusal is asserted on the bytes on disk"*). Snapshot the main checkout's `git for-each-ref` output and its registry file before and after each case, and assert both are unchanged:
  - (d) **a scratch repository** at the derived path with no registry record. Its message matches `/is neither the main checkout .* nor a worktree it lists: its \.git is not a regular pointer file/`;
  - (e) a record whose `copy_kind` is absent, or whose `worktree` names another path;
  - (f) a clone moved off the derived path, with the registry updated to follow it;
  - (g) a `HEAD` rewritten to another branch the registry also records, but at a different path;
  - (h) planted files, one case each: `.git/commondir`, `.git/config.worktree`, `.git/objects/info/http-alternates`;
  - (i) `alternates` naming a second directory, naming another repository's objects, or replaced by a symbolic link to a file with the right content; and `.git/objects/info` replaced by a symbolic link;
  - (j) `<clone>/.git` replaced by a symbolic link to a real `.git` directory, refused through today's pointer-file path.
- [ ] **The config allow-list, each case refused and the refusal naming the key, never its value.** Use a distinctive value such as a marker path, and assert it is absent from the message:
  - (k) an off-list key, one case each: `core.fsmonitor`, `core.sshCommand`, `uploadpack.packObjectsHook`, `extensions.worktreeConfig`, `include.path`;
  - (l) an allowed key with a wrong value: `core.repositoryformatversion=1`, `remote.origin.url` naming another remote, `core.hooksPath` naming a directory other than `<clone>/<githooksDir>`;
  - (m) a duplicated allowed key;
  - (n) a missing required key;
  - (o) a `.git/config` git cannot parse.

  Close with the mutual-consistency case:
  - (p) every line `hr_clone_config_spec` prints for the fixture is satisfied by the created clone's config, and every key the created clone's config holds has a line in it. This is the contract the task prompt calls one statement between the check and the creating code.

**Verification:**

- `npm test --workspace cli -- test/clone-trust-check.test.mjs`, from the repository root, as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status (`.claude/context/conventions.md` → `## The testing bar`). Every case passes, and `# fail 0`.
- Mutate once by hand, then revert, with `git diff` clean afterwards. In the library, drop condition 4's alternates comparison. Case (i) must then fail. The other cases still pass, which shows (i) tests that condition and not something incidental. Record the counts observed in the per-task deviation notes.
