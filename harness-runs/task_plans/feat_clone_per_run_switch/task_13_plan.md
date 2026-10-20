### Task 13 — Render a per-run profile at every launch, refuse to launch on one that fails the check, and sync in at every run exit, in the watcher

**Goal:** Change `autonomous-watcher.sh` in three ways.
- Outside job mode it never passes the base profile to a session. At every local `spawn_engine` (fresh launch, park resume, pause resume) it renders a **per-run copy**: the base profile with that run's own exact entries appended to `sandbox.filesystem.denyWrite` and `permissions.deny`, and to nothing else. The copy is written outside every sandbox-writable and file-tool-writable root, and passed as the one `--settings` file. Claude Code's `--help` (2.1.304) lists a single `--settings <file-or-json>`, not marked repeatable.
- **In job mode it renders nothing and writes nothing under the machine lane.** It runs the same launch check on the base profile and passes the base profile, unchanged, as `--settings`. Two contracts settle this:
  - `autonomous-watcher.sh` → header *JOB MODE*: *"OFF: the inbox pass, the cleanup sweep, the live-log window, and the machine lane (both halves)."* `hr_run_profile_file` prints a path under the lane directory, so a job-mode render would break that contract, and the directory would not outlive a hosted job anyway.
  - The job copy would add nothing. In a job the copy is the main checkout itself, so it has no run-copy surface to re-root and no clone `.git` paths. The job's fresh checkout has no other linked worktree, so it has no other pointers either. A per-run copy there would equal the base byte for byte.
- Before launching, in every mode, it checks the file it is about to pass, and refuses the launch when the check fails.
- At every run exit it syncs a clone in, so the main checkout's branch shows what the run committed.

**Depends on:**
- **Task 1**, for:
  - the clone-first `hr_copy_sync_in_var` reached through `hr_run_copy_check_var`;
  - the existing `hr_run_protected_rel_paths <main>`, which prints the copy-surface paths relative to a run copy, one per line;
  - the new `hr_run_profile_file <repo slug> <branch>`, which prints `<lane dir>/run-profiles/<slug>/<sanitized branch>.json`, creating nothing, and returns `1` printing nothing when the lane directory cannot anchor. It is the per-run profile's one path owner.
- **Task 5**, which declares, in its module headers, every statement this file mirrors (exporting the two not yet exported):
  - `COPY_GIT_PATHS`:
    - `.git/config` — `file`;
    - `.git/hooks` — `directory`;
    - `.git/objects/info/alternates` — `file`;
    - `.git/commondir` — `entry`;
    - `.git/config.worktree` — `entry`;
    - `.git/objects/info/http-alternates` — `entry`.
  - `SANDBOX_OPT_OUT_MARKER`: `THE SANDBOX IS OFF BY THIS REPOSITORY'S OWN CHOICE`.
  - The sandbox clause's values, declared in `sandboxProfile.ts`'s header beside the marker: `shippedSandboxSettings()` (already exported) for `sandbox.enabled`, `sandbox.failIfUnavailable` and `sandbox.allowUnsandboxedCommands`, and `applySandbox`'s opt-out shape (`enabled` `false`, `failIfUnavailable` `false`, `allowUnsandboxedCommands` unchanged).

  - `fileToolDenyRules` (already exported) gives each kind its rules: `file` → `Edit(/<p>)` and `Write(/<p>)`; `directory` → the same on `<p>/**`; `entry` → both forms of each tool, `Edit(/<p>)`, `Edit(/<p>/**)`, `Write(/<p>)`, `Write(/<p>/**)`.
- **Task 7**, which makes every new copy a clone with `copy_kind` `clone` in the registry. A record carrying no `copy_kind` is a legacy linked worktree.

**Where this task stops.** It changes no generator, writes nothing into a repository, and leaves the launch line's other flags unchanged, including the plugin loading and the two `--add-dir`s. Its suite is Task 14. The payload suites are Tasks 15–17, and the migration suite is Task 18. The job-mode suite, `cli/test/watcher-remote-job.test.mjs`, is Task 26's: it keeps `--settings` equal to the base profile's path and the lane untouched, and adds the job-mode launch-check refusal.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`

**Work:**

- [ ] **`run_profile_entries <copy> <kind>`**, new, printing one entry per line as a path plus its kind. Every path is exact; none is a glob.
  - **The run copy's surface:** each `hr_run_protected_rel_paths "$MAIN_REPO"` line re-rooted at `<copy>`, as `entry`, so both the path and everything under it are denied whatever it turns out to be.
  - **On a clone:** each `COPY_GIT_PATHS` row re-rooted at `<copy>`, with its own kind. This is a mirror; declare it in the function's comment as Task 5's module header declares it.
  - **On a legacy worktree:** `<copy>/.git` as `file`.
  - **For both kinds:** the `.git` pointer of every **other** linked worktree `git -C "$MAIN_REPO" worktree list --porcelain` reports (main checkout excluded) as `file`. The base profile no longer carries the sibling-glob `.git` entry, and the profile's own `Edit` / `Write` allow on the sibling glob would otherwise reach those pointers.
  - It is never called in job mode (see `spawn_engine` below).

  Refuse an entry carrying a quote or a `*`. This is the watcher's own rule, stated in the function's comment as such, not a copy of the generator's refused set: every path it emits is a run copy, a configured path or a `git worktree list` path, and a quote would break the `jq` argument while a `*` would turn an exact entry into a glob.
- [ ] **`run_profile_render <branch> <copy> <kind>`**, new. It writes the path `hr_run_profile_file "$HARNESS_REPO_SLUG" <branch>` prints (Task 1), never joining that path itself, through `mktemp` in that file's directory and `mv`, with the directory `mkdir -p`ed at mode `700`.
  - The content is `jq` over `$SETTINGS_PROFILE`: each entry's path appended to `.sandbox.filesystem.denyWrite`, and its `Edit` / `Write` rules appended to `.permissions.deny`, each only when not already present. Nothing else changes, `_README` included.
  - The kind → rule map is a mirror of `cli/src/generators/writeProtection.ts` → `fileToolDenyRules`, exactly as quoted under **Depends on:** Task 5, `entry` giving all four rules. Declare it in the function's comment as a mirror, naming its owner and the suite that holds it equal (Task 14), as Task 5's module header declares it.
  - `hr_run_profile_file` returning `1` (an unresolvable lane directory), or any failed step, is a refusal.
  - The file is re-rendered at every spawn, so a resume always gets one derived from the current base profile.
- [ ] **`run_profile_check <file>`**, new. It compares `<file>` against `$SETTINGS_PROFILE`. In job mode `<file>` **is** `$SETTINGS_PROFILE`, so the appended set is empty and the comparison below holds trivially. The parse and sandbox clauses are what the job gets. It returns `0`, or `1` with one sentence in a global, when:
  - the base or the per-run file does not parse as exactly one JSON object;
  - the sandbox clause fails. It is a **declared mirror of `cli/src/generators/sandboxProfile.ts`**, never a value of its own, and it has two shapes:
    - **No `_README` line begins with the `SANDBOX_OPT_OUT_MARKER` mirror:** `.sandbox.enabled`, `.sandbox.failIfUnavailable` and `.sandbox.allowUnsandboxedCommands` must equal `shippedSandboxSettings()`' values for `sandbox.enabled`, `sandbox.failIfUnavailable` and `sandbox.allowUnsandboxedCommands` (the shipped template's `true`, `true`, `false` today, read off `GRADED_SETTINGS`' template entries).
    - **A `_README` line begins with the marker:** the profile must carry the shape `applySandbox` writes under an opt-out — `.sandbox.enabled` `false`, `.sandbox.failIfUnavailable` `false`, and `.sandbox.allowUnsandboxedCommands` still the shipped `false`, which `applySandbox` leaves untouched.

    Declare the clause in the function's comment as a mirror — its owners `shippedSandboxSettings` (the three strict values) and `applySandbox`'s opt-out branch (the opt-out shape), both in `sandboxProfile.ts`, and the suite that holds it equal, `cli/test/watcher-run-profile.test.mjs` (Task 14) — as Task 5's `sandboxProfile.ts` header declares it. An empty `--settings` file starts an unsandboxed session with no error (`docs/sandbox-verification.md` §6);
  - removing exactly the appended entries from the two arrays does not give back the base profile, compared as JSON with `jq`;
  - any appended entry is not a string.

  Because a settings file that fails Claude Code's validation is silently ignored under `-p` (2.1.304 `--help`), this reduces the per-run copy's validity to the base profile's. The base is graded by `doctor`'s profile checks, and an invalid base is the residual `docs/cli.md` §6 states (Task 22).
- [ ] **`spawn_engine`:**
  - **In job mode:** run `run_profile_check "$SETTINGS_PROFILE"` and pass `$SETTINGS_PROFILE` to `--settings`, exactly as today. Never call `hr_run_profile_file` or `run_profile_render`, and create nothing under `$XDG_STATE_HOME` or the lane directory.
  - **Otherwise:** the copy's kind is the registry record's `copy_kind`, absent meaning `worktree`. Render, then check the rendered file. Pass the per-run file to `--settings` in place of `$SETTINGS_PROFILE`.
  - On a render or check refusal, log `not launching '<branch>': <reason>` and return `1`, as its other pre-launch refusals do.
  - Make every caller handle that `1` the same way: the run's record goes to `failed` with one `failed` notification naming the reason. Today some callers ignore the status. In job mode the caller is `run_job`'s launch `case`, whose `|| registry_set "$branch" status failed` arm already catches it. Make sure the job's following status write records `failed` in `remote_status.json`, naming the reason, and that nothing is launched.
  - **At run exit**, in `classify_run_exit` before it records the terminal state: when the record's `copy_kind` is `clone` and `RUN_MAIN` is set, run `hr_run_copy_check_var "$RUN_MAIN" "$worktree"`, which syncs the clone's branch into the main checkout. Log one line on a refusal, and never change the exit classification.
- [ ] **The header.**
  - Rewrite the flag string block: `--settings <per-run copy>`, with where it lives and why that is outside every writable root. In the *JOB MODE* header, add one bullet: job mode passes the base profile after the same launch check and renders no per-run copy, because the lane is off and the copy would equal the base.
  - Rewrite the anchors comment, the `SETTINGS_PROFILE` comment, which now names the base the per-run copy is derived from, and the job-mode `--add-dir` comment, which reads `additionalDirectories` from the base.
  - Rewrite every sentence still saying a run executes in a linked worktree, to say it executes in a clone, with a legacy worktree run supported until none is left.

**Verification:**

- `bash -n` under macOS `/bin/bash` (3.2) exits 0.
- By hand, in a throwaway fixture under the system temp directory with `XDG_STATE_HOME` pointed inside it, `init` run by the built CLI, and `HARNESS_AGENT_CLI` set to a stub that prints its argv. Drop a task prompt and run one `tick`. Then:
  - the stub's `--settings` argument is a file under `$XDG_STATE_HOME/autonomous-sdlc-harness/run-profiles/`;
  - `jq` over that file shows the clone's six `.git` paths in `denyWrite`;
  - after the run exits, the main checkout's `refs/heads/<branch>` equals the clone's.
- The same fixture with the base profile's `sandbox.enabled` set to `false` and no marker line: the tick logs `not launching` and the stub is never called.
- A second fixture whose `harness.config.json` carries `sandbox.optOut`, rendered by `init`: one `tick` launches the stub, so the opt-out shape `applySandbox` writes (`failIfUnavailable` `false` included) passes the check.
- `grep -n 'run_profile_render\|hr_run_profile_file' cli/templates/scripts/autonomous-watcher.sh` shows no call reachable with `JOB_MODE=1`: each call sits in the non-job branch of `spawn_engine`. The job-mode behaviour itself is asserted by Task 26's suite, not run here.
