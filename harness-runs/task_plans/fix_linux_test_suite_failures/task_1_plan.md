### Task 1 — Make the fixture environment refuse, on every host, what Linux refuses: a guessed git identity and an oversized single argument

**Goal:** Fix group 2 (`Author identity unknown`) at its root: the fixture's bare `origin` has no commit identity. Make `cli/test/helpers/fixture.mjs` reproduce on macOS two refusals that only Linux enforces today:

- git refuses to guess an identity;
- the kernel refuses any single argument or environment string over 131072 bytes.

With these two refusals in place, the five Linux failures' classes fail on a macOS run too, and a new test that repeats one of them is caught on macOS.

**Verdict to record (group 2): a test assumption.** State it in `seedOrigin`'s doc comment.

- The two failing commits in `cli/test/remote-start.test.mjs` both run inside the fixture's bare `origin`:
  - *"a feat_x already on origin exits 4 and sends no workflow run"* runs `f.git(f.origin, ['commit-tree', …])`;
  - *"a push of the prompt commit after origin/feat_x moved exits 4, names the commit and leaves nothing local"* runs the `post-receive` hook's `git commit-tree`.
- `seedOrigin` never gave that repository a name or an email. `ISOLATED_ENV` points `GIT_CONFIG_GLOBAL` at `/dev/null`, so git falls back to guessing an identity from the host name. The guess works on macOS, where host names carry a domain. It fails in a container (`probe@b6e01aa5ca60.(none)`).
- No shipped script is at fault.

**Where this task stops.**

- This task does **not** edit `remote-start.test.mjs`. Seeding the origin's identity fixes both cases at their source.
- It does **not** edit the two group-1 tests. Task 2 does, and it relies on the guard this task adds.
- The two group-1 tests fail on macOS from this task's commit until Task 2's commit. That is intended: it shows the guard does what it is for.
- It does not touch the sweep (Task 3) or any document (Task 4).

### Targets

- `cli/test/helpers/isolated-gitconfig` (new). The per-user git configuration every fixture subprocess reads. Its name has no leading dot on purpose (the self-containment gate).
- `cli/test/helpers/fixture.mjs`: `ISOLATED_ENV`, `seedOrigin`, `run`, `runBounded`, the module header's numbered choices, and `ISOLATED_ENV`'s doc comment.
- `cli/test/init.test.mjs`: only the doc comments of `COMMIT_IDENTITY` and `NO_COMMIT_IDENTITY`, which restate the `/dev/null` fact this task changes.
- `cli/test/fixture-isolation.test.mjs` (new). The accompanying test for the three behaviours above.

**Work:**

- [ ] **`isolated-gitconfig`.** Write a git configuration file that sets exactly `[user] useConfigOnly = true` and nothing else: no name, no email, and no other key, so it decides nothing a test observes beyond refusing a guessed identity. Open the file with a `#` comment line saying what it is for and who reads it (`fixture.mjs` → `ISOLATED_ENV`). Git reads `#` lines as comments.
- [ ] **`ISOLATED_ENV` and the module header.**
  - Set `GIT_CONFIG_GLOBAL` to the absolute path of `isolated-gitconfig`, resolved from `import.meta.dirname` the way `PACKAGE_ROOT` is resolved. Leave `GIT_CONFIG_SYSTEM` and `GIT_CONFIG_NOSYSTEM` as they are.
  - Rewrite choice 3 in the module header and `ISOLATED_ENV`'s doc comment. They must say that the per-user file is now that checked-in file, and why: with no identity in any configuration file, git otherwise guesses one from the host name, so the same commit passes on a host whose name carries a domain and fails on one whose name does not.
  - Say why a file and not `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_0`, the form `init.test.mjs` → `NO_COMMIT_IDENTITY` uses. The wrappers under test drop `GIT_CONFIG_COUNT` and `GIT_CONFIG_PARAMETERS` through `hr_git_env_drop`, and several tests pass their own `GIT_CONFIG_COUNT`. An environment-borne key would collide with both.
  - State the residual this does not close. `hr_git_env_drop` also unsets `GIT_CONFIG_GLOBAL`, so a git call a wrapper makes after that drop reads the host's own `~/.gitconfig`. Such a call is outside this isolation, as it already was.
  - In the same edit, update the doc comments of `init.test.mjs` → `COMMIT_IDENTITY` and `NO_COMMIT_IDENTITY`, which say the configuration files are `/dev/null`. Change no code in that file.
- [ ] **`seedOrigin`.** After `git init --bare`, give the bare repository the same identity `seedRepository` gives the fixture: `user.email` `fixture@example.invalid` and `user.name` `Harness Fixture`. Each fixture's `origin` is a copy of this one, so every copy and every hook running in it carries that identity.
  - Extend the function's doc comment to say that a commit can happen in the origin (a test's own `commit-tree`, a `post-receive` hook), and that the origin therefore carries the fixture's identity.
  - Record the group-2 verdict there.
- [ ] **The single-string bound — a new numbered choice 7 in the module header.** Add one shared check that `run` and `runBounded` both call before they spawn.
  - **What it checks:** the caller-supplied `args` and the caller-supplied `env` overrides. It does not check `process.env`, which is the host's.
  - **When it refuses:** for each argument, when `Buffer.byteLength(arg) + 1 > 131072`; for each override, when `Buffer.byteLength(`${name}=${value}`) + 1 > 131072`.
  - **How it refuses:** with a rejected promise, never a thrown error and never a spawn. The message names the argument's index, or the variable's name; its byte length; the bound; and that Linux enforces it per string (`MAX_ARG_STRLEN`) where macOS does not. This follows choice 4: a call that cannot be spawned rejects.
  - **Why 131072:** it is `MAX_ARG_STRLEN` on a kernel with 4 KiB pages, which is the smallest it gets. A kernel with larger pages allows more, so 131072 is the bound every Linux host enforces. Say so in the choice's text, and update the header's choice count.
- [ ] **`fixture-isolation.test.mjs`.** Open the file with the rule it enforces: *a fixture subprocess is refused, on every host, what a Linux host refuses.* Add three cases:
  - **The origin has its own identity.** In a `createFixture()` fixture's origin, `git commit-tree` of the empty tree succeeds, and its author line names `Harness Fixture <fixture@example.invalid>`.
  - **Git never guesses an identity.** In a fresh `git init` repository under `os.tmpdir()`, with no `user.*` set, a `runBash` that first unsets `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, `GIT_COMMITTER_EMAIL` and `EMAIL` and then runs `git commit-tree` exits non-zero. Its stderr matches git's own `auto-detection is disabled` refusal. Tear the repository down in process.
  - **The single-string bound.**
    - A `runBash` argument of 131071 bytes resolves, and one of 131072 bytes rejects with the message above.
    - An override whose `NAME=value` is 131072 bytes rejects, naming `NAME`.
    - No process is spawned for either rejection. Assert it with a marker file the command would have written.

**Verification:**

- `fixture-isolation.test.mjs` passes on this macOS host. Its "git never guesses an identity" case shows the checked-in file is in effect. Without the file, that case would pass on a host whose name has no domain and fail on one whose name has one.
- `init.test.mjs` passes. This task changes only its comments, but it is a test file the task edits.
- `isolated-gitconfig` is byte-unchanged after those runs: `git diff --exit-code -- cli/test/helpers/isolated-gitconfig` exits 0. No code path under test writes the global configuration (`git config --global` occurs nowhere under `cli/src`, `cli/templates`, `plugin/hooks` or `plugin/scripts`). This check confirms that.
- The doc comment on `seedOrigin` and choice 3 both name group 2 as a test assumption, with the measured message `fatal: unable to auto-detect email address (got 'probe@b6e01aa5ca60.(none)')`.

**Deviations from plan:**

- The `isolated-gitconfig` byte-unchanged check: `git diff --exit-code -- cli/test/helpers/isolated-gitconfig` exited 0, but the file is still untracked in this unit, so the diff has no tracked baseline to compare against and the 0 exit is vacuous. What the evidence actually is: the file's content was read back after the `fixture-isolation.test.mjs` and `init.test.mjs` runs and matched what was written (the comment line, `[user]`, `useConfigOnly = true`). Once committed, the same command becomes a real check.
- The single-string bound's two rejection cases also go through `runBash`'s bounded form (`{ timeoutMs }`), so `runBounded`'s copy of the check is covered as well as `run`'s. The plan asked only for the plain form.
