### Task 9 — Bring `docs/cli.md`'s and `docs/watcher.md`'s Linux statements into line, state the interim position, and add the check to Gate 15

**Goal:** Bring the adopter-facing account of the unattended profile in line with this branch's route. State the harness's interim position on Linux once, in `docs/cli.md` §6: what an adopter can and cannot run there until Claude Code changes. Have `docs/watcher.md` and Gate 15 cite it rather than restate it.

**Depends on:**

- **Task 4's** behaviour: on a host where `hr_placeholder_host_probe_var` answers `1` (Linux, WSL2), outside job mode, the watcher:
  - renders a clone's per-run copy without exact `denyWrite` entries for `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`, keeping their `Edit` rules;
  - in `spawn_engine`, runs `hr_run_copy_check_var` on a clone, refusing with `the run copy failed its trust check before launch: <reason>`;
  - writes the next manifest beside the per-run profile, as `<sanitized branch>.absent`;
  - clamps `MAX_PARALLEL_RUNS` to 1, logging `bubblewrap host: at most one live run per repository …`. `status` prints the clamped value on its `tunables:` line and adds a `cap: 1 (MAX_PARALLEL_RUNS=<n> clamped on a bubblewrap host; docs/cli.md §6)` line, and the `machine-footprint` row's own-repository cap shows 1.
- **Task 11's** behaviour, on the same hosts and outside job mode. The watcher sweeps recorded leftovers only when no other run of the repository is live, logging `placeholder sweep: removed <path>` / `kept <path>: <reason>` / `skipped, <n> run(s) of this repository live`, at these points:
  - **at each pass start**, ahead of the stall watchdog, the resumes and the inbox launch. This one is quiet when it skips;
  - **after a stall-watchdog kill**, once the killed tree has exited and before the recovery's copy check;
  - **before an inbox launch** creates, recreates or reuses a working copy;
  - **at the head of `spawn_engine`**, before the launch check.
- **Task 11's start-up recovery.** When the watcher cannot place its main checkout through git, it walks up from its own directory to the first real `.git` directory, without git. If no run is live there, it sweeps that repository's manifests, then retries. This is how a watcher restarted after a crash or reboot, with a leftover `<main>/<scriptsDir>/.git` on disk, starts. It logs `placeholder sweep at start: removed <n> path(s)`, with one stderr line per path. On any host, it removes only what a manifest listed.
- **Task 6's** script, `scripts/sandbox-absent-path-check.sh`, with `run`, `sweep`, `after-teardown` and `report`, output under `${SBX_ABSENT_OUT:-${TMPDIR:-/tmp}/sbx-absent-path}`.
- **Task 7's** `docs/sandbox-placeholder-upstream-report.md`.
- **Task 8's** AP1–AP5 rows and §0 *The absent-path check (2026-10-29)*.

**How this task's implementer reads the conventions.** This is a catch-all task, so read every configured layer's conventions document. The ledger binds two rules here. Every command an adopter is meant to run sits in a fenced block, one command per line. A new behaviour is stated once, in the section that decides it, and cited from everywhere else.

### Targets

- `docs/cli.md` → §6
- `docs/watcher.md` → `### The per-run profile`, and the section documenting `MAX_PARALLEL_RUNS`
- `docs/development.md` → Gate 15, *A Linux run, in a local container*

**Work:**

- [ ] `docs/cli.md` §6, the protected-set paragraph and the per-run profile paragraph:
  - After the sentence on the six run-copy `.git` paths, add that on a host sandboxed by bubblewrap those three take their `Edit` rules but no `denyWrite` entry. Give the reason, citing `docs/sandbox-verification.md` §0 *The absent-path check* and §5 F9: Claude Code enforces an exact entry for an absent path by mounting a placeholder there, which reads as `/dev/null` to git.
  - Say what protects them instead: the launch check and the wrappers' clone check.
  - The bullet *"on a clone, the six `.git` paths above at the clone's exact path"* gains *"(three of them on a bubblewrap host)"*. The paragraph that bullet belongs to gains one sentence on the manifest and where it lives.
- [ ] `docs/cli.md` §6 residuals:
  - Residual 2: keep the glob statement, which is unchanged, and correct *"so on Linux what is left is another run copy's paths"* to account for the trio's omission.
  - A new residual, **Linux placeholders**, stating the interim position once, each item marked measured (with its §0 date and versions) or derived (#94008's mechanism):
    - **Can run on Linux:** one unattended run per repository at a time, its sandboxed git in its run copy. That one is predicted and owed: AP1.
    - **Leftovers:** what a killed session leaves is removed by the watcher, outside the sandbox, at the points Task 11 places it, named here in that order:
      - at the start of each pass;
      - after a stall-watchdog kill, before its recovery;
      - before an inbox launch creates or reuses a copy;
      - before each spawn;
      - and at the watcher's own start, when a leftover `<main>/<scriptsDir>/.git` would otherwise stop it starting after a crash or reboot.

      Each removal happens only when no other run of the repository is live. The removal is owed as AP3 and AP4. A pre-change `config.worktree` is not removed (it is `0644`), so the copy is refused naming it.
    - **What the gate does not see** (derived from #94008's mechanism, not measured): the sweep's no-other-run gate counts only the watcher's own runs. A person's own sandboxed Claude Code session in the main checkout mounts placeholders at the same main-checkout paths. A sweep during one of its calls can unlink a placeholder that call is mounting, and that session's in-flight `<main>/<scriptsDir>/.git` can make a run's wrapper refuse. Do not run a sandboxed interactive session in the main checkout while the watcher runs.
    - **Cannot rely on:**
      - the sandbox refusing a write to the trio, since a planted one is refused at launch and by the wrappers instead, while sandboxed git follows a planted `commondir` inside the sandbox until then;
      - concurrent runs of one repository;
      - a clean `git status` inside a sandboxed call, which lists `?? .mcp.json`;
      - a wrapper call issued in parallel with a sandboxed call of the same session, which can meet an in-flight placeholder (derived, not measured).
    - **Job mode** (derived from the measured *"Absent, in the main checkout"* row's mechanism and from the code, not measured in a job; a job-mode-shaped session is CS6, owed). Write it as these four points, in this order:
      - **What the job's profile names.** A job's run copy is its own checkout, which is also its main checkout (`autonomous-watcher.sh` → the header's `JOB MODE`). The job generates its base profile for that checkout's path with `init --plugin-root-entries` (`docs/remote-execution.md` → **The permission profile.**). So the base names that checkout's `.mcp.json`, `.claude/settings.local.json` and a `.git` at each `<scriptsDir>` level as exact `denyWrite` paths, and all of them are absent in a fresh checkout. These are the main-checkout entries of §0's *"Absent, in the main checkout"* row.
      - **What a stall kill leaves.** Job mode runs only on Linux GitHub-hosted runners, under bubblewrap. Its stall watchdog kills with `-9` and resumes inside the same job. By the measured mechanism, that kill leaves each of those paths behind as a read-only empty file. This branch's sweep, launch check and start-up recovery do not run in job mode (Task 4, Task 11). So the leftover `<checkout>/<scriptsDir>/.git` stays for the rest of that job. `hr_wrapper_main_of` then refuses, and so `commit-on-branch.sh` in the resumed session and the job's post-session `push-branch.sh` step refuse with *"cannot place this script in a main checkout"*. Before writing it, the implementer greps `cli/templates/scripts` for `hr_wrapper_main_of` and names every other wrapper the job runs after the session that places itself the same way (for example `remote-run.sh`'s), stating only what the code shows.
      - **The remedy.** Start the run again in a new job, whose fresh checkout carries no leftover (`docs/remote-execution.md` names the resume route; cite it, do not restate it). Work the killed job committed but never pushed does not reach the new job. Say that this is the effect of the refusal, not a guess: the push step refused. Do not add a fenced `rm` remedy here, because a runner's checkout is not reachable once the job has ended.
      - **What lifts it.** Either the upstream fix in `docs/sandbox-placeholder-upstream-report.md`, or a later change that extends the manifest and sweep to job mode. That change is not on this branch, and the index's `## Context` lists this as a goal case the route does not meet.
    - **Lifting it:** what would lift each item is `docs/sandbox-placeholder-upstream-report.md`'s asks.
- [ ] `docs/cli.md` §6, the same new residual: the manual remedy for a leftover the sweep keeps, or for one at the watcher's start when a run was live or no manifest listed it (the watcher then refuses to start with *"is not inside a git repository — refusing to start"*), as a fenced block. One `ls -l <path>` to read it, then one `rm -- <path>` per path the refusal names. Give the exact refusal texts that send an adopter there: *"is a clone, but <gd>/config.worktree exists, and a clone the harness made has none"* and *"cannot place this script in a main checkout"*.
- [ ] `docs/watcher.md`:
  - `### The per-run profile`: the bullet on the run copy's protected surface, and the clone bullet, each gain a clause for the bubblewrap omission.
  - Add a short paragraph naming the sweep's five trigger points (pass start, after a stall-watchdog kill, before an inbox launch, at the head of `spawn_engine`, and the watcher's start), the launch check, the manifest file and their log lines, citing `docs/cli.md` §6 for why.
  - Where `MAX_PARALLEL_RUNS` is documented: the clamp to 1 on a bubblewrap host and its log line, cited to the same residual.
  - The sentence *"`autonomous-watcher.sh status` is the one exception, on its own row only, where it prints the value it actually resolved."* stays true, because `status` prints the clamped value. Add after it that on a bubblewrap host that value is 1 and a `cap: 1 (MAX_PARALLEL_RUNS=<n> clamped …)` line says so.
- [ ] `docs/development.md` Gate 15, *A Linux run, in a local container*:
  - Add a step taking the absent-path check after `run --leg headless-parity` holds its clone, as a fenced block of the three commands, run as the non-root user:
    - `bash scripts/sandbox-absent-path-check.sh run`
    - `bash scripts/sandbox-absent-path-check.sh sweep`
    - `bash scripts/sandbox-absent-path-check.sh report`
  - Plus `after-teardown`, once the probe has torn down.
  - Say that its result fills `docs/sandbox-verification.md` AP1–AP5.

**Verification:**

- `grep -n 'bubblewrap' docs/cli.md docs/watcher.md` shows the new statements in §6's paragraphs, the new residual and the two watcher sections. Every other mention in `docs/watcher.md` cites `docs/cli.md` §6 rather than restating the interim position.
- Every command the edits introduce sits on its own line in a fenced block: `grep -n 'sandbox-absent-path-check.sh' docs/development.md docs/cli.md` shows none inside a prose line.
- No sentence states a Linux result of the route as observed: each one cites an AP row as owed, or a §0 measurement with its date and versions.
- `grep -n 'not measured\|no exact run-copy entries' docs/cli.md` finds no sentence saying a job's base profile carries no exact entries for its own checkout. The **Job mode** item names `.mcp.json`, `.claude/settings.local.json` and `<scriptsDir>/.git`, marks itself derived, cites CS6 as owed, and names the remedy and what lifts it.
