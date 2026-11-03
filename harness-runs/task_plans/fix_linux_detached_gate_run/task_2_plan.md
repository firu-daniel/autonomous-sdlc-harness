### Task 2 — Add the `launch-sandboxed-gates.sh` template, which re-sandboxes the gate worker under its own `bwrap`, and a path-list placeholder sweep in the run library

**Goal:** Ship the launcher the story index's `## Context` describes, the ruling's route 1 (`harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md`, Q2). Its main-checkout copy is run outside Claude Code's sandbox through an excluded command. Before it detaches anything, it does four things:

- it checks its target as the git wrappers do;
- it reads only trusted inputs for every decision;
- it runs no byte of the target outside a sandbox;
- it starts the gate worker under a `bwrap` sandbox of its own, which has no network, writes only to the target, keeps the session profile's protected paths read-only and masks the base profile's credentials.

**Depends on:** Task 1. `bash <target>/<scripts_dir>/run-test-suite.sh --no-detach <label>` does two things:

- it prints `pending` and exits 3 when a run of `<label>` is live;
- otherwise it creates the lane directory, removes a stale `.verdict`, claims `.running` (its namespace PID; its mtime is the heartbeat, refreshed every second) and runs both gates in its own process. It then writes `.verdict`, under `<target>/<stateDir>/test_run_logs/<sanitized branch>/<label>.*`.

**Where this layer stops.**

- The row that ships this template, and with it the base profile's excluded entry, allow forms and write protection, is **Task 3's**. A row arrives after its template, never before (`OUTER_LOOP_SCRIPTS`' ordering rule).
- The end-to-end launcher suite is **Task 4's**.
- Phase G issuing the launcher is **Tasks 5–6's**.
- The documents are **Tasks 16–17's**.
- The watcher does not change.

### Targets

- `cli/templates/scripts/launch-sandboxed-gates.sh` (new).
- `cli/templates/scripts/lib/harness-run-lib.sh`:
  - a new `hr_placeholder_sweep_paths_var`, with `hr_placeholder_sweep_var` delegating to it;
  - the header's `JURISDICTION` paragraph, which gains the launcher;
  - `hr_placeholder_leftover_var`'s *"Its callers:"* sentence.
- `cli/test/placeholder-sweep-lib.test.mjs`: one new case for the path-list function.

**The interface later tasks rely on.** State it in the launcher's header, with an exit map, so a reader of the script finds it.

- `launch-sandboxed-gates.sh <target> <label>` prints one stdout line:
  - `in-session` with exit 4: not a bubblewrap host, or the base profile's `.sandbox.enabled` is `false`;
  - `pending` with exit 3: a run of `<label>` is live, or this call's run claimed `.running` or wrote `.verdict` at or after this call's start second;
  - or a refusal, exit 2: one stderr line `launch-sandboxed-gates.sh: <reason>`, nothing on stdout.
- `launch-sandboxed-gates.sh --supervise <target> <label>` is the detached supervisor. Issued directly, it only runs the same sandboxed gate run in the caller's foreground, so it needs no guard of its own. Say so in the header.

**Work:**

- [ ] **Checks, in this order, every one before anything is started.** Follow `commit-on-branch.sh`'s shape for the first steps. Use `set -uo pipefail`, never `-e`.
  1. Resolve the script directory from `${BASH_SOURCE[0]}`, source `lib/harness-run-lib.sh` beside it, and drop the inherited git environment with `hr_git_env_drop`.
  2. Validate the argument count and form, and the label against `run-test-suite.sh`'s `^[A-Za-z0-9][A-Za-z0-9._-]*$`, declared in the header as a mirror.
  3. Place the main checkout with `hr_wrapper_main_of "$script_dir"`.
  4. `hr_placeholder_host_probe_var`. When `HR_PLACEHOLDER_HOST` is not `1`, print `in-session` and exit 4.
  5. Read `<main>/.claude/settings.autonomous.json` with `jq`, the path the watcher's `SETTINGS_PROFILE` defaults to, declared as a mirror. If it does not parse, refuse. When `.sandbox.enabled` is `false`, print `in-session` and exit 4.
  6. `hr_wrapper_target_check_var <main> <target>`. Refuse with its `HR_TARGET_REFUSAL`.
  7. `hr_wrapper_branch_var <main> "$HR_TARGET_GITDIR"`. Refuse on failure, or on a branch starting with `-`.
  8. Choose the session's profile. When `HR_TARGET_KIND` is `main`, it is the base. Otherwise it is `hr_run_profile_file "$(hr_repo_slug <main>)" <branch>`, which must be a regular, non-link, readable file parsing as one JSON object. Else refuse: `no per-run profile for '<branch>' at <path>: the gate sandbox takes its protected paths from the session's own profile`.
  9. Read the lane:
     - `scripts_dir` from `hr_scripts_dir <main>`, the trusted copy;
     - the target's `stateDir` from `hr_state_dir <target>`, read as data and never executed;
     - the lane directory `<target>/<stateDir>/test_run_logs/<hr_sanitize_branch branch>`, whose canonical form must lie under the canonical `<target>/`, refused otherwise.

     Compose the lane in one place, from a header-declared `LOG_SUBDIR='test_run_logs'` and one `log_dir=` assignment, and declare both in the header as a **mirror** of `run-test-suite.sh` → `LOG_SUBDIR` and `log_dir="$state_dir/$LOG_SUBDIR/$safe_branch"`, beside the `LABEL_PATTERN` (check 2) and `STALE_SECONDS` (check 10) mirror declarations. The declaration names the branch source the two must agree on: the worker takes its branch from `hr_current_branch "$root"`, the launcher from `hr_wrapper_branch_var` (check 7), and both pass it through `hr_sanitize_branch`. It also states the consequence of a drift: the launcher's `pending` answer and its "did not start" refusal read this path, so a mismatch refuses every sandboxed round while the gates run. Never spell `test_run_logs` anywhere else in the launcher.
  10. **The live check.** If `<label>.running` exists and `hr_lane_mtime` gives an age of at most `STALE_SECONDS`, 30, print `pending` and exit 3. `STALE_SECONDS` is declared a mirror of `run-test-suite.sh`'s.
  11. `bwrap="$(command -v bwrap)"` must be an absolute path to an executable file. Else refuse: `bwrap is not on PATH, so the gate run cannot be sandboxed on this bubblewrap host, and Run gates do not run here unsandboxed (docs/cli.md §6)`.
  12. **The preflight**, `"$bwrap" --ro-bind / / --dev /dev --unshare-all --proc /proc true`, with stderr captured. A non-zero exit refuses: `bwrap cannot start a sandbox here: <its first stderr line>; on a host whose kernel.apparmor_restrict_unprivileged_userns is 1, unprivileged user namespaces need an AppArmor profile for bwrap (docs/cli.md §6)`.

  The header states why the launcher reads no environment variable for a trust decision: an assignment prefix on an excluded call could set one, as the watcher's header says of `HARNESS_MAIN_REPO`. It also states why `hr_pinned_hooks_path` and `hr_worktree_config_check_var` are not called: the launcher runs no git command in or for the target.
- [ ] **The argument vector**, built into one array by one function, `lsg_bwrap_args_var <target> <label> <scripts_dir> <profile> <base>`. The function sets `LSG_ARGS`, plus `LSG_PLACEHOLDERS`, a newline-joined list of the placeholder paths. Build it in this order:
  1. `--new-session --unshare-all --die-with-parent --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --bind <target> <target>`.
  2. For each string of `<profile>`'s `.sandbox.filesystem.denyWrite` that is absolute, carries no `*` and lies strictly under `<target>/`, in file order:
     - `--ro-bind <p> <p>` when it exists, symbolic links included;
     - `--ro-bind /dev/null <p>` when it is absent and its parent directory exists, the path added to `LSG_PLACEHOLDERS`;
     - when the parent is absent, refuse: `cannot protect '<p>' in the gate sandbox: its parent directory is absent`.
  3. For each `<base>` `.sandbox.credentials.files[].path`, with a leading `~/` read as `$HOME/`: a directory gives `--tmpfs <p>`, a regular file `--ro-bind /dev/null <p>`, and an absent path nothing. When the path's canonical form differs, mask the canonical form too.
  4. `--unsetenv <name>` for each `<base>` `.sandbox.credentials.envVars[].name`, then `--unsetenv RUN_TEST_SUITE_WORKER`.
  5. `--setenv TMPDIR /tmp --chdir <target> -- bash <target>/<scripts_dir>/run-test-suite.sh --no-detach <label>`. A `.` `scripts_dir` gives `<target>/run-test-suite.sh`.

  Never add `--share-net`. The header lists the vector and argues each part against the ruling's requirements:
  - no network;
  - writes only to the target;
  - no write to a path the session itself cannot write;
  - no read of a denied credential;
  - every session-written byte only inside it.
- [ ] **Start, supervise, wait.**
  - **The start.** Record `t0="$(date +%s)"`. Create `errfile` with `mktemp "${TMPDIR:-/tmp}/launch-sandboxed-gates.XXXXXX"`, the form `cli/test/shipped-scripts-mktemp.test.mjs` requires. Start the supervisor with `nohup [<setsid>] bash "$script_dir/launch-sandboxed-gates.sh" --supervise <target> <label> </dev/null >/dev/null 2>"$errfile" &`, then `disown`. `<setsid>` is `command -v setsid` when that resolves to an absolute path; otherwise the word is left out.
  - **The supervisor** (`--supervise`) re-runs checks 1–9 and 11, never the live check or the preflight. It builds the vector, runs `"$bwrap" "${LSG_ARGS[@]}"` in the foreground, then calls `hr_placeholder_sweep_paths_var` on `LSG_PLACEHOLDERS`, and exits with `bwrap`'s status. It prints nothing on stdout.
  - **The wait.** Poll each second for at most `STALE_SECONDS`.
    - If `<label>.verdict` exists with an mtime of at least `t0`, or `<label>.running` exists with an mtime of at least `t0`, read through `hr_lane_mtime`: remove `errfile`, print `pending` and exit 3.
    - If the supervisor's PID no longer answers `kill -0`, which is its own child, and neither file is there: refuse `the sandboxed gate run of <label> did not start: <errfile's first line, or 'no message'>`.
    - When the window runs out: refuse `the sandboxed gate run of <label> did not start within <STALE_SECONDS>s`.

    Remove `errfile` on every exit path.
  - The header's exit map, the usage lines, and a `# Used by` line naming the Phase G binding `<gate_launcher>` (`plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates`) are cited as text.
- [ ] **The run library.** Add `hr_placeholder_sweep_paths_var <path>...`. For each argument naming a path that exists (`-e` or `-L`), it applies `hr_placeholder_leftover_var` and removes the path with a non-recursive `rm -f` only on `0`, then sets `HR_PLACEHOLDER_REMOVED` and `HR_PLACEHOLDER_KEPT` exactly as `hr_placeholder_sweep_var` does. It always returns 0.
  - Rewrite `hr_placeholder_sweep_var` so that it reads its manifests as today and hands their lines to the new function, so the per-path rule has one home. Its own contract is byte-for-byte the same, its `1` for no readable manifest included.
  - Name the launcher in the header's `JURISDICTION` paragraph, beside the three wrappers, as a main-checkout script the profile runs unsandboxed that passes the MAIN checkout.
  - Name the new function in `hr_placeholder_leftover_var`'s *"Its callers:"* sentence.
- [ ] **The library case.** In `cli/test/placeholder-sweep-lib.test.mjs`, add a case for `hr_placeholder_sweep_paths_var`, in the file's existing style:
  - a 0-byte, mode-0444, own-user regular file is removed;
  - a 1-byte file, a writable empty file, a symbolic link to an empty read-only file, and an absent path are left as they are;
  - `HR_PLACEHOLDER_KEPT` names each kept one with its reason.

  Every existing case stays unchanged and must still pass, which shows the delegation kept `hr_placeholder_sweep_var`'s contract.

**Verification:**

- `cli/test/placeholder-sweep-lib.test.mjs` passes, through the single-file command `.claude/context/conventions.md` → `## The testing bar` gives.
- `bash scripts/typecheck.sh` passes. Its shell-parse gate covers the new template under the Bash 3.2 floor.
- Read the launcher top to bottom. Outside the `bwrap` argument vector, no line executes, sources or `eval`s a path under `<target>`, and it reads the target only as data: its git records through the target check, its `harness.config.json` through `hr_state_dir`, and its lane files through `-f`, `-e` and `hr_lane_mtime`. Nothing reads `HARNESS_MAIN_REPO` or any other `HARNESS_*` variable.
- `git grep -n -e 'share-net' -- cli/templates/scripts/launch-sandboxed-gates.sh` hits only lines that begin with `#`.
- `git grep -n -e 'test_run_logs' -- cli/templates/scripts/launch-sandboxed-gates.sh` hits only the `LOG_SUBDIR=` assignment and lines that begin with `#`; the header's mirror declarations name `LABEL_PATTERN`, `STALE_SECONDS` and the `LOG_SUBDIR` / `log_dir` lane layout.
