### Task 2 — Add the probe's preflight refusals and the `shasum` guard over the main checkout's three files

**Goal:** The probe refuses to start, having created nothing, unless every check below passes. Before it creates anything, it records a `shasum` of three main-checkout files. Every exit path compares them again and fails loudly if any changed.

**Depends on:** Task 1, which dispatches `preflight` and `run` to `sp_preflight`. It also defines the exit codes this task uses: `2` refusal, `3` protected file changed. This task defines `sp_preflight`, `sp_snapshot_take` and `sp_snapshot_check`. Task 4's teardown calls `sp_snapshot_check` last on every exit path, and this task does not write that call.

### Targets

- `scripts/lib/sandbox-probe/preflight.sh` (new). It opens with `#!/usr/bin/env bash` and a `# preflight.sh — …` header, and sets no shell option (no `set`, no `shopt`): the entry point owns `set -u` (Task 1; `.claude/context/conventions.md` → `## Shell assets`, *"A sourced library sets no shell options at all"*).

**Work:**

- [ ] **`sp_preflight` refuses, in this order**, each with one stderr line `sandbox-probe: refusing to start: <reason>` and exit 2:
  1. **The probe's own checkout is not the main checkout.** Use the same predicate `scripts/create-worktree.sh` refuses on before it does anything. Read its opening refusal and call the library function it calls (`scripts/lib/harness-run-lib.sh`, sourced from `<root>/scripts/lib/`); never re-derive it. The result sets `SP_MAIN`.
  2. **Not macOS.** Read `uname -s` (`Darwin`), with `SANDBOX_PROBE_UNAME` overriding it for the test suite only, as the header states. The reason names sandbox3b as the owner of the Linux legs.
  3. **The main checkout is not on the default branch.** The default branch is read through the run library's own reader of `defaultBranch` and kept in `SP_DEFAULT_BRANCH`. The check is `git -C <main> symbolic-ref --short HEAD`.
  4. **The watcher has a run in flight.** Source `<main>/scripts/autonomous-watcher.sh status >/dev/null` in a child `bash -c` and call its `running_count`. This is the form `cli/test/watcher-run-profile.test.mjs` → `watcherCall` uses. A non-zero count refuses, naming it.
  5. **The profile `doctor` grades is not the live one.**
     - Run `node <main>/cli/dist/cli.js doctor`, with `SANDBOX_PROBE_DOCTOR` overriding the command for the test suite only. A missing `cli/dist/cli.js` refuses, naming `npm run build`.
     - Ignore doctor's exit status, which other checks may set. Instead require a `PASS` line for each of `profile-sandbox`, `profile-write-protection`, `profile-main-anchor` and `sandbox-prerequisites`. Quote the first line that is not `PASS`.
     - Separately, require the watcher's `SETTINGS_PROFILE`, read in step 4's child shell, to equal `<main>/.claude/settings.autonomous.json`, the file doctor grades.
  6. **The agent CLI does not resolve on PATH.** It is `claude`, or `SANDBOX_PROBE_AGENT_CLI`, which the watcher's `${HARNESS_AGENT_CLI:-claude}` precedent shows. Then set `SP_VERSION` from one `<agent cli> --version`.
- [ ] **`sp_snapshot_take`** runs right after check 1 and before doctor. It writes `shasum -a 256` of `<main>/harness.config.json`, `<main>/.git/config` and `<main>/.claude/settings.autonomous.json` to a file under a fresh `mktemp -d "${TMPDIR:-/tmp}/sandbox-probe.XXXXXX"` directory. That directory becomes `SP_TMP`, the probe's only temp area; `sp_teardown` (Task 4) removes it.
  - A missing file is recorded as missing, not refused.
  - The explicit `mktemp` template follows the F2 lesson recorded in `docs/sandbox-verification.md` §5.
- [ ] **`sp_snapshot_check`** re-hashes the three files. On any difference it prints `sandbox-probe: FAILED: <path> changed during the probe` for each changed file, to stderr, and sets exit 3. **`preflight` alone ends with it**, so a run of `preflight` is a full refusal pass plus the guard, with nothing created.
- [ ] **Header block in the file.** It states:
  - the order of the refusals, and that each comes before anything is created;
  - the three test-only environment seams (`SANDBOX_PROBE_UNAME`, `SANDBOX_PROBE_DOCTOR`, `SANDBOX_PROBE_AGENT_CLI`), and that an empty value means the default;
  - that the probe never edits `<main>/.claude/settings.autonomous.json`.

**Verification:**

- `bash scripts/sandbox-probe.sh preflight` from this run copy exits 2 at check 1, naming the probe's checkout as not the main checkout. No `sandbox-probe.*` directory is left under `${TMPDIR:-/tmp}`: the refusal comes before the snapshot.
- Read the checks against `scripts/create-worktree.sh`'s own refusal. The predicate is called, not copied.
- The refusal tests are Task 14's; this file names no test run.
