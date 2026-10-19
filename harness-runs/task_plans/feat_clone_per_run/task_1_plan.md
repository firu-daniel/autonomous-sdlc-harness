### Task 1 — Add the clone trust check to the run library: the `.git/config` allow-list contract, a non-creating registry read, and the clone arm of `hr_wrapper_target_check_var` and `hr_wrapper_branch_var`

**Goal:** Teach the library's one target check to accept a run copy that is a `git clone --shared` of the main checkout, on exactly the conditions below, and to refuse anything else. It must write nothing, reading the registry included. The main-checkout and worktree arms keep every decision and every refusal sentence byte-for-byte.

**Where this task stops.** It adds checks and readers only. Syncing refs between a clone and the main checkout is **Task 2's**, creating and removing a clone is **Task 3's**, and every caller's use of the new arm is **Tasks 7, 9 and 11's**. The suite for this contract is **Task 4's**. Task 3's creator writes a clone's `.git/config` from `hr_clone_config_spec` below, so the check and the creator cannot drift.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the git-free section (`hr_wrapper_target_check_var`, `hr_wrapper_branch_var` and new functions beside them) and the RUN REGISTRY section (`hr_registry_peek`).

**Work:**

- [ ] **`hr_registry_peek <file> <branch> <key>`**, in the RUN REGISTRY section. It prints `.runs[<branch>][<key>]` (nothing for an absent or null key) and returns 0. It returns 1, printing nothing, when `<file>` is not a readable regular file, or when `jq` fails or finds no `.runs[<branch>]`. It **never calls `hr_registry_init`, never takes the lock, and never creates the file or its directory**: `hr_registry_get` and `hr_registry_branches` both create an absent registry, which a check must not do (task prompt goal 2: *"A check must not write: reading the registry must not create it."*). Each value reaches `jq` as `--arg`, as `hr_registry_get` does.
- [ ] **The allow-list, one contract in one place.**
  - `hr_clone_config_spec <main> <top>` prints one line per allowed key, `<lowercase key><TAB><rule>`, where `<rule>` is `=<exact value>` or `bool` (`true` or `false`). The set:
    - `core.repositoryformatversion` `=0` — required;
    - `core.bare` `=false` — required;
    - `core.logallrefupdates` `=true`;
    - `core.filemode`, `core.ignorecase`, `core.precomposeunicode`, `core.symlinks` — each `bool`;
    - `remote.origin.url` `=<the value <main>/.git/config names>` — required when the main checkout names one, read with `git -C / config --file <main>/.git/config --get remote.origin.url`, and omitted otherwise;
    - `remote.origin.fetch` `=+refs/heads/*:refs/remotes/origin/*` — required;
    - `core.hookspath` `=<top>/<githooksDir>`, with `githooksDir` read from the **main** checkout's `harness.config.json` (`hr_githooks_dir <main>`), never the clone's.
  - `hr_clone_config_check_var <main> <top>` reads `<top>/.git/config` exactly as `hr_worktree_config_check_var` reads its file: `git -C / config --file <f> --null --list`, one call, the trailing `hr-status=` record carrying git's exit status, key names compared case-insensitively. It returns 0 only when every key is in the spec, appears once, and passes its rule, and every required key is present.
  - Otherwise it returns 1 with `HR_CLONE_CONFIG_REFUSAL` set to one sentence naming each offending, duplicated or missing key and **never a value**. A file git cannot parse is refused, and so is a file that is absent, not a regular file, or a symbolic link.
  - Write a header comment on the pair stating that `hr_clone_create_var` (Task 3) writes exactly this set and that `setup-worktree.sh --target` (Task 11) adds only `core.hooksPath`.
- [ ] **The clone arm of `hr_wrapper_target_check_var <main> <target>`.**
  - **Two new globals.** It now also sets `HR_TARGET_KIND`, which is `main`, `worktree` or `clone`, and `HR_TARGET_BRANCH`, set on the clone arm only and empty otherwise. The main and worktree arms set `HR_TARGET_KIND` and change nothing else.
  - **Which arm.** The clone arm is taken only when `<target>/.git` is a real directory, not a symbolic link. A symbolic-link `.git`, and every pointer-file case, keep today's code path and sentences.
  - **The conditions, in order.** Each failure sets `HR_TARGET_REFUSAL` to one sentence and returns 1. A sentence names the failed condition and the key or file, never a file's contents:
    1. **The registry records this clone.** Read `<target>/.git/HEAD` git-free: one line `ref: refs/heads/<branch>`. The registry is `hr_state_path <main> autonomous_logs/registry.json`, from the **main** checkout's configuration. `hr_registry_peek` must give `copy_kind` = `clone` for that branch, and a `worktree` that is canonically `<target>`. When this fails — including a detached or unreadable `HEAD`, or no registry file — the refusal is **today's sentence with a clause appended**: `'<target>' is neither the main checkout <main> nor a worktree it lists: its .git is not a regular pointer file, and the run registry records no clone of <main> at that path`. `cli/test/wrapper-target-check.test.mjs`, `commit-on-branch-target-check.test.mjs` and `cleanup-worktree-record.test.mjs` match the unchanged prefix, and must pass unedited.
    2. **The path is the derived one.** `<target>` equals `hr_worktree_dir <main> <branch>`, compared canonically.
    3. **No planted file.** `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates` are each absent, and absent as symbolic links too. `.git/objects` and `.git/objects/info` are each real directories.
    4. **The alternates borrow from the main checkout only.** `.git/objects/info/alternates` is a regular file, not a symbolic link, holding exactly one line that equals `<main>/.git/objects` canonically.
    5. **The config is on the allow-list.** `hr_clone_config_check_var <main> <target>` passes. On failure, its sentence becomes the refusal.
  - **What it sets on success.** `HR_TARGET_GITDIR` = `<target>/.git` canonical, `HR_TARGET_KIND` = `clone`, `HR_TARGET_BRANCH` = the branch from condition 1.
  - **Its header.** Extend the function's header comment with the clone arm, and with why condition 3 is load-bearing: the runtime leaves `objects/info/`, `info/` and new top-level `.git` files sandbox-writable (`docs/sandbox-verification.md`, Task 14's row CL5).
- [ ] **The clone arm of `hr_wrapper_branch_var <main> <gitdir>`.**
  - When `HR_TARGET_KIND` is `clone` and `<gitdir>` equals `HR_TARGET_GITDIR`, it takes `HR_TARGET_BRANCH` and **never re-reads `HEAD`**, keeping the "read once" rule. It validates the name with `git -C <main> check-ref-format refs/heads/<branch>` under the existing rules: a name starting with `-` is returned, not refused.
  - Any other `<gitdir>` that is neither `<main>/.git` nor under `<main>/.git/worktrees/` still returns 1, as today.
  - Add `hr_copy_kind <main> <gitdir>`. It prints `main` for `<main>/.git`, `worktree` for a path directly under `<main>/.git/worktrees/`, and `clone` otherwise. It is purely lexical, and its header states that it is called only on a gitdir a target check has already accepted. Tasks 2, 7 and 9 use it to pick an arm.
- [ ] **Floors and header.**
  - Every git invocation added is available at git 2.23, and nothing uses a bash 4 construct (no `declare -A`, `${v,,}` or `mapfile`).
  - The JURISDICTION paragraph of the library's file header gains one sentence: the clone arm reads the main checkout's registry and configuration, plus the clone's `HEAD`, `objects/info/alternates`, `.git/config` and the absence of the three planted files, once each.

**Verification:**

- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0.
- `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0. This task changes no TypeScript, so it is the whole-tree run the unit loop owes, not evidence for the shell.
- A by-hand probe under the system temp directory, never in this checkout: source the library, run `hr_registry_peek` against a path that does not exist, and confirm the file is still absent afterwards.
- `git diff cli/templates/scripts/lib/harness-run-lib.sh` shows the worktree arm's existing lines of `hr_wrapper_target_check_var` unchanged except the added `HR_TARGET_KIND` assignment, and every existing refusal sentence byte-identical. Read the diff to confirm.
- **Deviations from plan:**
  - Key names in `hr_clone_config_check_var` fold the section and variable names and compare the subsection exactly, as git does, so `remote.ORIGIN.url` is refused rather than taken for `remote.origin.url`. Strictly stronger than folding the whole name.
  - The required-key set (`core.repositoryformatversion`, `core.bare`, `remote.origin.fetch`, plus `remote.origin.url` when the spec lists it) is held in the check and stated in the pair's header, because the plan's `<key><TAB><rule>` line format carries no required marker. Task 3's creator must write every required key.
  - The clone arm is a separate function, `hr_clone_target_check_var`, called from `hr_wrapper_target_check_var` when `<target>/.git` is a real directory; this keeps the worktree arm's lines unchanged apart from the `HR_TARGET_KIND` assignments.
  - The three suites the plan says must pass unedited (`cli/test/wrapper-target-check.test.mjs`, `commit-on-branch-target-check.test.mjs`, `cleanup-worktree-record.test.mjs`) were not run: this unit edited none of them, so per the test-run rule their run is deferred to the Run gates phase. The probe below exercised the appended-clause refusal sentence's unchanged prefix.
  - The by-hand probe ran through `bash scripts/scratch-run.sh harness-runs/scratch/task1_clone_probe.mjs <lib>`, with every fixture built and removed under the system temp directory. It covered: `hr_registry_peek` on an absent path returns 1 and leaves the file and its directory absent; the clone check run with no registry leaves the registry absent; a `git clone --shared` clone with a config written from `hr_clone_config_spec` is accepted (kind `clone`, branch, gitdir), and `hr_wrapper_branch_var` and `hr_copy_kind` answer correctly for it; refusals for a wrong `core.hooksPath` (no value named), an extra key, a duplicated key, a missing required key, a `remote.ORIGIN.url`, each planted file (a dangling symlink included), a two-line or foreign `alternates`, a `copy_kind` of `worktree`, a non-derived path, and a detached HEAD. Every case passed.
