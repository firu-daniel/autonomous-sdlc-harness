### Task 11 — Give `setup-worktree.sh --target` its clone arm, and add `cli/test/setup-worktree-clone-target.test.mjs`

**Goal:** When `setup-worktree.sh --target <dir>` runs as the main checkout's copy and `<dir>` is a registered clone, put the hooks path into **the clone's own `.git/config`** and write **nothing** to the main checkout's shared configuration. Today's target arm sets `extensions.worktreeConfig` in the main checkout and writes the record's `config.worktree`. The worktree arm and the no-target behaviour stay unchanged.

**Depends on:** Task 1, whose `hr_wrapper_target_check_var <main> <target>` clone arm sets `HR_TARGET_KIND=clone` and `HR_TARGET_GITDIR=<clone>/.git` when:

- the registry records the clone;
- it sits at its derived path;
- its `.git` holds no `commondir`, `config.worktree` or `objects/info/http-alternates`;
- its alternates name `<main>/.git/objects` only;
- `hr_clone_config_check_var <main> <clone>` passes.

That allow-list (`hr_clone_config_spec <main> <top>`) admits `core.hookspath` only as `=<top>/<githooksDir>`, with `githooksDir` read from the **main** checkout's `harness.config.json`. This task writes exactly that value, so the check still accepts the clone afterwards.

Clones for the suite come from Task 3's `hr_clone_create_var <main> <branch> <start>`. `create-worktree.sh` does not call `setup-worktree.sh` on a clone, and this task does not make it.

**Where this task stops.** It changes the target arm's hooks write only. The `.env` and QA-credential links, the `commands.depInstall` / `commands.build` runs and every configured value already come from the main checkout on the target arm. They behave the same for a clone and are left as they are.

### Targets

- `cli/templates/scripts/setup-worktree.sh`
- `cli/test/setup-worktree-clone-target.test.mjs` (new)

**Work:**

- [ ] **The clone arm in `hooks_config_write`.**
  - When `target_mode` is 1 and `HR_TARGET_KIND` is `clone` (captured beside `target_gitdir` right after the target check), write `git -C / config --file "$target_gitdir/config" core.hooksPath "$hooks_dir"`, which loads no repository's configuration. Do **not** run the `extensions.worktreeConfig` write against `$main_repo`.
  - On `worktree`, keep the existing two commands byte-for-byte. The no-target arm is untouched.
  - The success and failure messages are unchanged.
- [ ] **The header.** Add one paragraph to `setup-worktree.sh`'s header:
  - a clone target takes `core.hooksPath` in its own `.git/config`, at the value the library's clone allow-list admits;
  - nothing is written to the main checkout's configuration;
  - nothing creates a clone yet.
- [ ] **The suite's header and fixture.** The header states the rule:
  - `setup-worktree.sh --target`, run as the main checkout's copy, writes a clone's hooks path into that clone's own configuration and nothing into the main checkout's;
  - a clone so configured is still trusted;
  - an unregistered directory is refused before anything is written.

  The fixture is built under the system temp directory and torn down in process:
  - a main checkout carrying `harness.config.json` with a `githooks/pre-push`, and `commands.depInstall` and `commands.build` unset, so no command runs;
  - its scripts directory holding `setup-worktree.sh` and `lib/` copied from `cli/templates/scripts`;
  - a clone from `hr_clone_create_var`.
- [ ] **Cases.**
  - (a) `bash <main>/<scripts>/setup-worktree.sh --target <clone>` exits 0 with `pre-push hook installed (core.hooksPath -> <clone>/githooks)`. The main checkout's `.git/config` is **byte-identical** before and after: it gains no `extensions.worktreeConfig` and no `core.hooksPath`. `git -C / config --file <clone>/.git/config --get core.hooksPath` is `<clone>/githooks`. Sourcing the library, `hr_wrapper_target_check_var <main> <clone>` still sets `HR_TARGET_KIND=clone`.
  - (b) A scratch repository at another branch's derived path with no registry record: exit 1 with `— refusing to bootstrap`, and its `.git/config` unchanged.
  - (c) The worktree control: a linked worktree given as `--target` still gets `extensions.worktreeConfig` in the main checkout and `core.hooksPath` in its record's `config.worktree`, exactly as today.

**Verification:**

- `bash -n cli/templates/scripts/setup-worktree.sh` exits 0, and `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0.
- `npm test --workspace cli -- test/setup-worktree-clone-target.test.mjs`, from the repository root, as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status. Every case passes, and `# fail 0`.
- `git diff --stat cli/test/` shows no existing suite edited. `create-worktree.test.mjs`, which drives the worktree target arm, runs at Run gates and must pass unedited.
