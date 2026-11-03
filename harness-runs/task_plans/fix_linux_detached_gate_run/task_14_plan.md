### Task 14 — Test the PD25–PD28 fixes against fixtures, and pin that PD28's shape stays out of the judge's Linux table

**Goal:** Each of the four probe-defect fixes gets a fixture in the probe's tests, as the task prompt requires (*"Each fix gets a fixture in the probe's tests"*). PD28's decision is pinned by a judge case, so the shape cannot enter the Linux table without a deliberate edit. The decision is that the evidence cannot decide whether `File exists` is a sandbox refusal.

**Depends on:** Task 11, which changed the probe as follows.

- **PD25** (`legs-planted-files.sh`). `sp__pf_inert_worktree_config <path> <clone>` accepts exactly the trust check's inert shape (`hr_run_copy_check_var`). It returns 0 only when `<path>` is a regular file, not a symbolic link, of 0 bytes, and `git -C / config --file <clone>/.git/config --bool --get extensions.worktreeConfig` exits 1 (absent) or exits 0 printing `false`. Every other outcome returns 1, an unparseable value included. On Linux only, `sp__pf_row` plants over such a `config.worktree`.
- **PD26** (`legs-settings.sh`). `sp__cs8b_check`'s child shell requires and calls `hr_placeholder_host_probe_var` after sourcing the watcher and before `run_profile_check`. When that function is undefined, the shell prints `<watcher> defines no hr_placeholder_host_probe_var` and exits 2.
- **PD27** (`legs-refresh.sh`). `sp__rf_bootstrap_read <path>` returns 0 for a basename of `package.json`, `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock` or `pnpm-lock.yaml`, at any depth. `sp__rf_pick_conflict` skips such a path.
- **PD28** (`legs-protection.sh`).
  - `sp__git_cl5_grade <stream> <command> [<before> <inside> <after>]` appends `; .git/config.lock read: before the session <before>, inside the session <inside>, after it <after>` to its evidence only when the `git config` result carries `File exists`. Its verdict logic is unchanged.
  - `sp__git_lock_reading <path>` prints `absent`, or the whole first line of `ls -ld -- <path>`.
  - `SP__LINUX_SANDBOX_STRINGS` in `judge.sh` is unchanged.

This task changes no probe file.

### Targets

- `cli/test/sandbox-probe-planted-legs.test.mjs`: PD25. Add `legs-planted-files.sh` to the libraries a PD25 case sources.
- `cli/test/sandbox-probe-invalid-profile.test.mjs` and `cli/test/fixtures/sandbox-probe/cs8b-watcher-stub.sh`: PD26.
- `cli/test/sandbox-probe-remote-legs.test.mjs`: PD27. It already sources `legs-refresh.sh`.
- `cli/test/sandbox-probe-protection-legs.test.mjs`, `cli/test/sandbox-probe-judge.test.mjs`, and the new `cli/test/fixtures/sandbox-probe/cl5-file-exists.jsonl`: PD28.

**Work:**

- [ ] **PD25.** Use a case-owned `mkdtemp` git repository, with `git init` inside it.
  - `sp__pf_inert_worktree_config` returns 0 for an empty regular `.git/config.worktree`, with `extensions.worktreeConfig` absent, and again with it set to `false`.
  - It returns 1 for each of these:
    - a 1-byte file;
    - a symbolic link to an empty file;
    - a directory;
    - an empty file whose `extensions.worktreeConfig` is not held off (set to `true`);
    - an empty file whose `extensions.worktreeConfig` is unparseable as a boolean (`maybe`).
  - Extend the file's header rule with PD25's sentence, naming `hr_run_copy_check_var` as the shape it mirrors.
- [ ] **PD26.**
  - **The stub.** Give `cs8b-watcher-stub.sh` an `hr_placeholder_host_probe_var` that sets `HR_PLACEHOLDER_HOST` from `CS8B_STUB_HOST`, defaulting to `0`. Make its `run_profile_check` refuse with `CS8B_STUB_REFUSAL` when `CS8B_STUB_WANT_HOST` is set and differs from `HR_PLACEHOLDER_HOST`. Keep its existing `CS8B_STUB_RC` behaviour, and keep its stdout and stderr lines.
  - **The cases.**
    - With `CS8B_STUB_HOST=1` and `CS8B_STUB_WANT_HOST=1`, `sp__cs8b_check` returns `0|`, which proves the host answer was taken before the check.
    - A second stub variant, written by the case into its temporary directory, has no `hr_placeholder_host_probe_var`. The check returns rc `2`, and the refusal names `defines no hr_placeholder_host_probe_var`.
  - Every existing case keeps its assertions.
- [ ] **PD27.** `sp__rf_bootstrap_read` returns 0 for `cli/package.json`, `package-lock.json` and `a/b/yarn.lock`, and 1 for `README.md`, `package.json.bak` and `cli/src/package.ts`. Then a `sp__rf_pick_conflict` case:
  - **The repository.** A case-owned repository whose tip commit modifies `cli/package.json` and then `docs/a.md`, each with a replaced line.
  - **The setup.** `SP_MAIN` and `SP__RF_TIP` are set, and `hr_run_protected_rel_paths` is defined in the `bash -c` as a stub printing nothing.
  - **The assertion.** `SP__RF_C_FILE` is `docs/a.md`.
- [ ] **PD28.**
  - **The fixture.** `cl5-file-exists.jsonl`, in the shape of the existing `cl5-sandbox.jsonl`. Its `git config sbx.probe true` result is `Exit code 255` / `error: could not lock config file .git/config: File exists`.
  - **`sandbox-probe-protection-legs.test.mjs`,** with `SP_PLATFORM=linux`.
    - `sp__git_cl5_grade` on that fixture with three reading arguments gives `not run`, and the evidence ends with the `.git/config.lock read: …` clause carrying all three readings verbatim.
    - The same call on `cl5-sandbox.jsonl` (`Operation not permitted`) carries no such clause.
    - `sp__git_lock_reading` prints `absent` for a missing path. For an empty regular file it prints one line that begins with `-` and ends with that file's path. For a dangling symbolic link it prints one line that begins with `l`.
  - **`sandbox-probe-judge.test.mjs`.** One case states the decision: on Linux the fixture's `File exists` line is not a known sandbox refusal, so the judge files it as it files an unknown refusal today. It also asserts that `sp__linux_refusal_names` prints exactly today's three strings, `Read-only file system, Permission denied, Device or resource busy`. The case's comment cites `docs/sandbox-verification.md` §5 PD28: kept out until a run's readings decide it.

**Verification:**

- The test files this task edits pass, each through the single-file command `.claude/context/conventions.md` → `## The testing bar` gives: `cli/test/sandbox-probe-planted-legs.test.mjs`, `cli/test/sandbox-probe-invalid-profile.test.mjs`, `cli/test/sandbox-probe-remote-legs.test.mjs`, `cli/test/sandbox-probe-protection-legs.test.mjs` and `cli/test/sandbox-probe-judge.test.mjs`.
- `jq -c . cli/test/fixtures/sandbox-probe/cl5-file-exists.jsonl` parses every line.
- No case starts a session, a watcher or a network call. Every repository a case builds lives under `os.tmpdir()` and is removed in process.
