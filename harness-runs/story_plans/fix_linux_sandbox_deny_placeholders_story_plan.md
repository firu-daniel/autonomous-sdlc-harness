# Story: An unattended run that works under the Linux sandbox, and survives a killed session

## Context

On Linux, Claude Code enforces a `sandbox.filesystem.denyWrite` entry for a path that does not exist by mounting a placeholder there (`docs/sandbox-verification.md` → §5 F9; measured 2026-10-29, Claude Code 2.1.312, bubblewrap 0.8.0, Debian 12 in Gate 15's container). Inside a sandboxed call the run copy's `.git/commondir` reads as `/dev/null`, so every git call in the run copy exits 128. The clone's `.git/config.worktree` is left on disk as a real empty file, and the wrappers then refuse that clone. A session killed mid-call leaves every absent entry behind as a read-only empty file, `<main>/<scriptsDir>/.git` among them, and that one file makes every wrapper refuse every run. macOS is not affected: Seatbelt creates nothing.

**The route this plan takes, and why.** The task prompt names three routes. No single one of them works, so the plan combines them, path class by path class.

- **The three run-copy `.git` trust files are dropped from `denyWrite` on a bubblewrap host (Linux, WSL2) only, and their `Edit` deny rules stay.** These are `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`, exactly the files `hr_clone_target_check_var`'s condition 3 refuses.
  - **Why not protect the containing directory?** It cannot keep this protection. All three sit in a run copy's `.git` or `objects/info`. Protecting `.git` as a whole closes the clone to its own sandboxed git (`docs/sandbox-verification.md` CL4). Git also creates lock files directly in `.git`, so no allow-list of children reopens it.
  - **What protection remains.** The protection then rests on three things:
    - the wrappers' clone check, unchanged (CS12–CS14);
    - a new launch check: the watcher runs `hr_run_copy_check_var` on a clone before every launch and resume on a bubblewrap host;
    - the clone's `.git/config` staying protected, so a `config.worktree` is inert without a `commondir`.
  - **What a session can still do.** It can plant one of the three files mid-session. Sandboxed git in that copy then follows the planted `commondir`, inside the sandbox only. The next unsandboxed reader refuses the copy: a wrapper, the exit sync, or the next launch, which comes before Claude Code's own startup git.
  - **The goal bullet this does not meet.** Bullet 2 asks that a sandboxed write to each of these three paths stay refused. That is not met on Linux, and keeping it needs a Claude Code change. Task 7 writes the upstream report. Task 9 writes the harness's interim position.
  - **The user accepted this.** Clarification `harness-runs/clarifications/fix_linux_sandbox_deny_placeholders/question_1.md` Q2 was answered **(a)** in `answer_1.md`: accept the Linux-only drop with the compensating checks above. The residual is a sandboxed Bash command in a Linux run copy writing `commondir` or `config.worktree`, which that session's later sandboxed git calls follow before any wrapper or launch check runs. macOS is unchanged.
- **Every other absent entry keeps its `denyWrite` entry.** These are `.mcp.json`, `.claude/settings.local.json` and `.git/hooks` in the run copy, and `.mcp.json`, `.claude/settings.local.json` and a `.git` at each `scriptsDir` level in the main checkout. Each guards something that runs outside the sandbox, and no wrapper check would replace it. Inside a call each of their placeholders reads as `/dev/null`. Git tolerates that, apart from listing `?? .mcp.json`, which is stated as a residual. The harm is what a killed session leaves behind, and the recovery route handles that.
- **Leftovers are recovered outside the sandbox, on a bubblewrap host, before the first reader that a leftover breaks.**
  - **The manifest (Task 4).** At each spawn the watcher writes a manifest. It lists every exact `denyWrite` path of the per-run copy, plus Claude Code's own `.mcp.json` in each `--add-dir` root, that is absent at that moment. It lives beside the per-run profile, outside every write root.
  - **The sweep (Task 2).** The watcher removes a listed path only when it is a regular file, not a symbolic link, 0 bytes, carrying no write permission bit, and owned by the watcher's own user. It does so only when no other run of the repository is live. A file with content is never removed, so a planted `commondir` with content is still refused.
  - **Where it runs (Task 11).** The readers a leftover breaks mostly come before `spawn_engine`, so the sweep runs ahead of each of them:
    - at each pass start, before the stall watchdog, the resumes and the inbox loop;
    - in the stall watchdog, after the `kill -9`'d tree has exited and before the recovery's `hr_run_copy_check_var`;
    - in `process_inbox_file`, before `create-worktree.sh` or the review path's copy check;
    - at the head of `spawn_engine`, before the launch check.
  - **At the watcher's own start (Task 11).** A leftover `<main>/<scriptsDir>/.git` makes `hr_main_repo` fail, so a watcher restarted after a crash or reboot would refuse to start. When that happens, the watcher locates the main checkout without git and checks the registry there for a live run. If none is live, it sweeps that repository's manifests and retries. A file no manifest listed, or one met while a run is live, still stops the start. Task 9 documents the manual remedy for that.
  - **What the gate does not see.** The no-other-run gate counts the watcher's own runs only. A person's own sandboxed session in the main checkout is not counted. That residual is derived, not measured, and Task 9 states it.
  - **Job mode, covered by the user-review fix round.** A job's run copy is its main checkout, and its base profile names that checkout's absent `.mcp.json`, `.claude/settings.local.json` and `<scriptsDir>/.git` by exact path. The user-review fix round (`harness-runs/user_reviews/fix_linux_sandbox_deny_placeholders_fix_plan.md`) extends the recovery to it.
    - **The manifest.** A job has no machine state directory, so it writes its manifest under `$RUNNER_TEMP` (`hr_job_absent_file`).
    - **Where the sweep runs.** At the head of each spawn; in the stall watchdog's KILL tier, before the copy check and the reset; at `run_job`'s exit; and in the workflow's `Sweep the sandbox placeholders` step before `Push the branch`, for a watcher a cancel or a step timeout killed with its session.
    - **What stays local.** The launch check and the cap. Job mode renders no per-run copy and omits none of the trio, and the job's whole `.git` is an existing `denyWrite` directory, so no placeholder is mounted there; a job runs one run.
    - **What it rests on.** It is derived, not measured: a job-mode-shaped session is `docs/sandbox-verification.md` CS6, owed. `docs/cli.md` §6's **Job mode** item states it.
- **On a bubblewrap host the watcher runs at most one run per repository at a time.**
  - **The exposure.** Every run's profile names the same main-checkout paths. By #94008's mechanism, bubblewrap `creat()`s each placeholder on the real filesystem for the length of a call. So with `MAX_PARALLEL_RUNS` above 1, run B's wrapper can find run A's in-flight `<main>/<scriptsDir>/.git` and refuse. A sweep run during another run's call could also unlink a placeholder that call is mounting.
  - **The evidence.** Phase C (two sessions, twelve calls) did not reproduce #94008's race, which does not rule it out. The wrapper exposure is derived from the mechanism, not measured.
  - **The fix.** The plan closes both cases by clamping the cap to 1 there, logged. `status` and the `machine-footprint` row print the clamped value (Task 4). That clamp is part of the interim position.

**Why `config.worktree` differs from the others.** The prompt asks why `config.worktree` became a real file and was never cleaned up, when the other absent entries were `/dev/null` placeholders that were cleaned up. The code this branch reads does not show the cause, so the cause is recorded as **unknown** (Task 8). The measurement does show how it differs, and only that is stated:

- it was `-rw-r--r--`, where bubblewrap's leftovers were `-r--r--r--`;
- inside the sandbox it was mounted read-only over itself, the treatment of a path that existed when the mounts were built;
- its mtime was the session's own start.

So something other than the bubblewrap placeholder path created it before the sandbox's mounts. The harness's own code does not write it for a clone: `setup-worktree.sh` → `hooks_config_write` writes a `config.worktree` only for a worktree (`config --worktree` for a plain worktree, `config --file "$target_gitdir/config.worktree"` for a `--target` worktree), and for a `--target` clone it writes the clone's own `.git/config` (`config --file "$target_gitdir/config"`). So no harness code path writes a clone's `.git/config.worktree`.

**Nothing Linux is claimed from a stub.** No Linux claim this branch writes rests on anything but a recorded container measurement. The 2026-10-29 measurements are recorded as taken, with their versions (Task 8). The change's own effect is shipped as **owed** rows. The maintainer re-takes them in Gate 15's container with the in-tree check script (Task 6), on this branch's head, before merge. The probe legs F9 blocked are re-taken on a record branch of their own, not on this one. Until that re-take, `docs/` states the route's Linux effect as predicted, never as observed.

**Cross-task names.** Every task that consumes one of these restates its contract.

- `COPY_GIT_PATHS[].bubblewrapDenyWrite` (Task 1), mirrored as the third column of the watcher's `RUN_PROFILE_COPY_GIT_PATHS`, spelled `deny` or `omit` (Task 4).
- The library's `hr_placeholder_host_probe_var`, `hr_run_profile_absent_file`, `hr_placeholder_manifest_write`, `hr_placeholder_leftover_var` (the one home of the leftover test, setting `HR_PLACEHOLDER_REASON`) and `hr_placeholder_sweep_var`, which calls it (Task 2).
- The `tick` option `placeholderHost` (Task 3).
- The watcher's `effective_max_parallel_runs` / `RUN_CAP` and its `spawn_engine` placeholder-host block (Task 4), and `placeholder_sweep_pass`, `placeholder_start_recover` and `running_count`'s optional excluded branch, with the library's `hr_registry_live_count` and `hr_main_checkout_past_leftovers_nogit` (Task 11).
- The library's `hr_job_absent_file` and `hr_job_absent_files`, and the watcher's `job-sweep` subcommand (user-review fix round).
- `scripts/sandbox-absent-path-check.sh` (Task 6) and `docs/sandbox-placeholder-upstream-report.md` (Task 7).

**Top risks:** The likeliest failure is that the route does not stop `config.worktree` from appearing. If Claude Code creates it on its own account rather than because of the profile's entry, dropping the entry changes nothing. Task 6's check script therefore inspects the trio whether or not the profile names them. Task 8 records the decision rule that reads that result as a proposal to the maintainer. The second risk is a sweep that deletes a file a person or the project made. Task 2 guards it with five tests that must all hold, a manifest written before the session, and the no-other-run-live gate. Task 2's and Task 11's suites each assert a refusal to remove. A sweep placed after the reader it protects is the related failure: Task 11's suite covers each such reader with a case, namely a stall-watchdog resume, a fresh launch, and a watcher start with a recorded leftover. The third risk is silent macOS drift. Every new behaviour is gated on `hr_placeholder_host_probe_var`, and Task 3 defaults that seam to "not a placeholder host" in every pass that runs `tick` — the helper's `tick` and the three suites that build their own pass script (`watcher-stall-reset-payloads`, `watcher-stall-host-sleep`, `watcher-keep-awake`) — so Linux CI keeps today's results. Task 4 asserts that a non-placeholder host's per-run copy is byte-identical to today's.

**Manual setup required:**

- **Re-take the absent-path check, by hand, before merge.** Task 6 ships the script. The maintainer runs it in Gate 15's container (`docs/development.md` → *A Linux run, in a local container*) on this branch's head and records the result in the owed AP rows Task 8 adds. The commands are in Task 9's Gate 15 addition.
- **File the upstream report.** The maintainer files Task 7's `docs/sandbox-placeholder-upstream-report.md` on anthropics/claude-code.
- **Re-take the blocked probe legs, on a record branch.** After merge, the maintainer re-takes T3, SR1, SR2, CS3, CS4, CL5, R1–R4, C2, K2, CW4, CS15 and CS12 on Linux, on a record branch of their own.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`:** the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers only. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_linux_sandbox_deny_placeholders/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, with the catch-all layer last. Task 11 was split out of Task 4 in revision round 1, and it ships right after Task 4, so the entry number and the task number differ from that point on.

1. [x] **Task 1** — Mark the three run-copy `.git` trust files `bubblewrapDenyWrite: false` and state the Linux placeholder finding in the profile's `_README` and `doctor`'s note _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Add the run library's placeholder-host seam, absent-path manifest and leftover sweep, and delete the manifest with its per-run profile _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Default the placeholder-host seam to off in every watcher test pass, with a `placeholderHost` option to turn it on _(layer: cli)_ _(points: 10)_
4. [x] **Task 4** — On a bubblewrap host, omit the trio from the per-run copy, check the run copy and write the manifest at every spawn, and cap the watcher at one run _(layer: cli)_ _(points: 20)_
5. [x] **Task 11** — Sweep recorded leftovers ahead of every reader that a leftover breaks, including the watcher's own start _(layer: cli)_ _(points: 20)_
6. [x] **Task 5** — Refresh the self-adopted outer-loop scripts from their templates _(layer: general)_ _(points: 5)_
7. [x] **Task 6** — Ship the absent-path check as `scripts/sandbox-absent-path-check.sh`, with the trio and a sweep phase _(layer: general)_ _(points: 15)_
8. [x] **Task 7** — Write the upstream report for anthropics/claude-code _(layer: general)_ _(points: 10)_
9. [x] **Task 8** — Record the absent-path check, the route and the owed re-take in `docs/sandbox-verification.md` _(layer: general)_ _(points: 20)_
10. [x] **Task 9** — Bring `docs/cli.md`'s and `docs/watcher.md`'s Linux statements into line, state the interim position, and add the check to Gate 15 _(layer: general)_ _(points: 20)_
11. [x] **Task 10** — Re-render the notes-app profile's write-protection `_README` line _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt's *Also in scope*:

> - `doctor`'s `profile-write-protection` check and its Linux note. Today it says only that how *"the Linux sandbox treats a sandbox.filesystem.denyWrite entry containing * is unverified"*. Bring it into line with what the plan measures.
> - `docs/cli.md`'s Linux statements on the same point.
> - The §5 F9 row's follow-up cell.

`doctor`'s check is source code: Task 1 owns it and it needs no register row. The register covers the plan's corpus targets.

**Derivation entry — corpus files (command).** Re-run it verbatim from the checkout root:

`git grep -lE 'Linux sandbox treats|Linux sandbox may skip|Linux may skip|blocked: F9|§5 F9|\| F9 \|' -- docs plugin README.md ARCHITECTURE.md examples/notes-app/README.md examples/notes-app/.claude/settings.autonomous.json cli/templates/claude cli/templates/scripts/README.md`

**Plan targets the command does not reach** carry the evidence *plan target*.

**Closure invariant:** every file the command prints appears as at least one row below, and so does every corpus file a task creates or edits.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/sandbox-verification.md` → §0 *The targeted check (2026-10-29)* and what follows it, §5 F9's follow-up cell, §6's Linux point, §8 `CS1 (Linux)`, and a new owed AP table | — | command entry | `change` | Task 8 |
| 2 | `docs/sandbox-verification.md` → §8's `blocked: F9` rows other than `CS1 (Linux)` | — | command entry | `no-change` | they are re-taken on a record branch of their own, not on this one (task prompt, *Constraints*) |
| 3 | `docs/cli.md` → §6's protected-set paragraph, *"Each run adds its own copy's paths by exact path, in a per-run profile."*, residual 2 and a new residual | — | command entry | `change` | Task 9 |
| 4 | `docs/watcher.md` → `### The per-run profile` bullet *"the run copy's own protected surface"* | — | command entry | `change` | Task 9 |
| 5 | `cli/templates/claude/settings.autonomous.json` → the `_README` line *"TWO RESIDUALS, STATED RATHER THAN HIDDEN"* | template | command entry | `no-change` | both claims stay true: no glob entry is measured or changed by this branch, and the trio's glob protection is still relied on on macOS only |
| 6 | `examples/notes-app/.claude/settings.autonomous.json` → the `_README` line *"TWO RESIDUALS, STATED RATHER THAN HIDDEN"* | notes-app rendering | command entry | `no-change` | it is row 5's rendering, and row 5 does not change |
| 7 | `examples/notes-app/.claude/settings.autonomous.json` → the `_README` line *"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT"* | notes-app rendering | command entry | `change` | Task 10 (rendered by Task 1's `applyWriteProtection`) |
| 8 | `examples/notes-app/README.md` → the paragraph *"The one edit the kept artifacts carry, and where it landed."* | — | plan target | `change` | Task 10 |
| 9 | `docs/development.md` → Gate 15, *A Linux run, in a local container* | — | plan target | `change` | Task 9 |
| 10 | `docs/sandbox-placeholder-upstream-report.md` (new) | — | plan target | `change` | Task 7 |
