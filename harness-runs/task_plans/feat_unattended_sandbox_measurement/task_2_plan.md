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

**Deviations from plan:**

- **Check 1 adds an alternates refusal after create-worktree.sh's predicate.** That predicate (`hr_repo_root`, `hr_main_repo`, `hr_wrapper_main_of` compared canonically, then `hr_run_main_set_var`) is called as `create-worktree.sh` calls it, but it **accepts a `git clone --shared` run copy as a main checkout**: in this run copy, measured with `bash scripts/scratch-run.sh harness-runs/scratch/sp_pf_probe.py <root>` (first version), `hr_main_repo` and `hr_wrapper_main_of` both answered the run copy itself and `hr_run_main_set_var` returned 0. The plan's own Verification (exit 2 at check 1 from this run copy) therefore needs a second condition: a checkout whose `.git/objects/info/alternates` exists is refused as a run copy. A linked worktree is still refused by the predicate itself.
- **`sp_snapshot_check` reads an in-memory copy (`SP_SNAPSHOT`)**, not only `SP_TMP/snapshot.tsv`: Task 4's teardown removes `SP_TMP` before it calls the check last, so a check that read the file would find nothing. The file is still written as the plan states.
- **A refusal after the snapshot runs `sp_snapshot_check` and removes `SP_TMP` before returning 2**, so every refusal leaves nothing behind and the guard runs on that exit path too (exit 3 outranks 2 when a file changed).
- **New `sp_snapshot_release`, and a three-line edit to `scripts/sandbox-probe.sh`'s `preflight` branch calling it (under `declare -F`) after `sp_snapshot_check`.** `preflight` alone runs no teardown, so without it every passing `preflight` left a `sandbox-probe.*` directory. It removes the snapshot file by name and the directory with `rmdir` — no recursive removal (`.claude/context/conventions.md` → `## Shell assets`); anything left is named with exit 5.
- **`SANDBOX_PROBE_DOCTOR` is a command line run by `bash -c` in `<main>`**; the plan does not say whether it is a path or a command. Doctor's stdout and stderr are read together, because its `WARN`/`FAIL` lines go to stderr prefixed `! ` / `!! `.
- **Check 4 reads the watcher from the probe's own scripts directory** (which check 1 has established is `<main>`'s), so a non-default `scriptsDir` is honoured rather than a literal `scripts/`.
- **The snapshot refuses when an existing file cannot be hashed** (`shasum` absent or failing), rather than recording a value two unreadable reads would compare equal on.
- **Verification evidence.** `bash <root>/scripts/sandbox-probe.sh preflight` from this run copy exited 2 with `sandbox-probe: refusing to start: the probe's checkout '<root>' is not the main checkout: it borrows objects through .git/objects/info/alternates, …`; the scratch probe found no `sandbox-probe.*` under `TMPDIR` before or after. The second version of `harness-runs/scratch/sp_pf_probe.py`, in throwaway repositories under `TMPDIR`: the guard printed `FAILED: <path> changed during the probe` and returned 3 (`SP_EXIT=3`) for each of the three files, 0 unchanged, with a missing `settings.autonomous.json` recorded as `missing`; through a copy of `scripts/` in a fixture, `SANDBOX_PROBE_UNAME=Linux`, a doctor stub printing `! WARN  profile-write-protection …`, an unresolvable agent CLI, a branch off `dev`, and a `git worktree add` copy each exited 2 with its reason; every seam passing exited 0; no `sandbox-probe.*` left. The non-zero `running_count` arm was not exercised (Task 14 owns the refusal tests). `/bin/bash -n` on the file passed; the `set`/`shopt` grep the Task 1 plan uses finds nothing in it.
