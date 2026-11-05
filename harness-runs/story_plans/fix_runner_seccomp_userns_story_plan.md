# Story: Sandboxed Bash runs again on Ubuntu 26.04 runners — the install step disables `bwrap-userns-restrict`, verifies, and `doctor` and the watcher check bwrap's nested user namespace

## Context

In the Gate 12 sandbox series round 13 (2026-11-05), every sandboxed Bash call failed on `ubuntu-latest`, which now runs Ubuntu 26.04. The error was `apply-seccomp: write /proc/self/setgroups (nested userns is capability-restricted; caller must provide CAP_SYS_ADMIN): Permission denied`. This happened in the probe (run `41980588326`) and in the harness job's own session (run `41981613528`). The cause comes from the task prompt's measurements. Ubuntu 26.04 ships and loads `/etc/apparmor.d/bwrap-userns-restrict`. That file's `bwrap` profile stacks every child under `unpriv_bwrap`, which carries `audit deny capability`. The install step's own profile is also named `bwrap`, and the stock one wins. The fix the prompt measured (9 of 9 on three runners) is four commands: `mkdir -p` the disable directory, symlink the stock profile into it, unload the stock profile with `apparmor_parser -R`, and load ours with `apparmor_parser -r`. After that, bwrap's child is unconfined and the sandbox's own refusals still hold. The prompt also measured that `doctor` reported `PASS sandbox-prerequisites` on the runner where nothing could run, because it judges from files.

This branch lands that fix in three places, which together form one behaviour:

- **The remote job.** `Install the sandbox prerequisites` in `cli/templates/github/workflows/harness-run.yml`, with its byte-for-byte copy in `scripts/sandbox-probe-runner.yml`. When the stock profile exists, the step runs the four commands and writes and loads our profile. Then, on Linux, it **always** runs `bwrap --unshare-user --dev-bind / / -- unshare -U -r true`. On failure it fails with an `::error::`, so the job stops before `Run the harness`. On success it prints one plain line.
- **`doctor`.** Its `sandbox-prerequisites` check becomes behavioural on Linux and WSL2. It runs the same nested check and FAILs, in both modes, when that check fails. The file-based AppArmor reading becomes context, not the verdict.
- **The local watcher.** The user answered clarification park 1 with option (a): before a fresh local launch on Linux, the watcher runs the same check and refuses the launch, pointing to `npx autonomous-sdlc-harness doctor`. A resumed local session is not judged, which is that answer's scope. Task 8 states it in the docs. Task 9 refreshes this repository's self-adopted `scripts/lib/harness-run-lib.sh` and `scripts/autonomous-watcher.sh` from the templates Task 5 changes, so this checkout's own watcher runs the check too.

A job whose install step fails still runs its bundle-saving and reporting steps, and its separate `collect` job. The job has started, so `remote-run.sh`'s `run_not_started_var` answers `started` and `collect` passes through its ordinary stops, never its `not_started` arm. The run's one notification is `continue`'s no-`status.json` arm: one `failed` naming the run URL, and no dispatch; `deliver` sends nothing. A failed `Preflight with doctor` already takes this path. Task 3 asserts it on the template.

**One owner, three readers.** The new values are declared once in `cli/src/doctor/sandboxPrerequisites.ts` (Task 2), following the rule that module exists to enforce: every other copy is a declared mirror held equal by a test. The values are the stock profile's path, the disable directory, the four-command remedy, the load command that replaces `systemctl reload apparmor`, and the nested check's argument vector. Task 3's step, Task 4's `doctor` probe and Task 5's shell mirror each read them from there. **`doctor` never changes a system.** It reports, names the remedy, and on a local machine says that disabling Ubuntu's restriction weakens a desktop's hardening and that the trade-off is the user's. The install step is the only place the remedy is applied, and only on a runner the job owns.

**What this branch must not do** (task-prompt constraints): no `allowNestedUserNamespaces`, no `enableWeakerNestedSandbox`, no `sandbox.enabled: false`, no new `excludedCommands` entry, and no sysctl change. macOS and the Gate 15 local Linux container keep their verdicts. A taken `sandbox.optOut` keeps passing `doctor` as not required. For the same reason, the install step's failing arm reads the opt-out through the run library's own `hr_sandbox_opted_out` and only warns for an opted-out repository. The Bash floor is 3.2 for every script. **No runner result is invented:** the fixed step's first runner result is owed to the Gate 12 redo after the next release, and Task 7 records it as owed.

**Two short, named windows where one test file is red, by design of the per-layer split.** No task in either window runs the file, and Phase G's full run comes after both close.

- Task 2 retires `APPARMOR_RELOAD_COMMAND`, so `cli/test/workflow-sandbox-install.test.mjs` cannot import it until Task 3 replaces that import.
- Task 3 changes the template's install step, so the probe runner's byte-for-byte copy case is red until Task 6 copies the new body.

Task 1 lands the probe-runner test's extension first, while that file is still green, for this reason.

**Top risks:**

- **The job could still start a session that cannot run Bash.** This happens if any step between the install step and `Run the harness` carried a status function, or the install step were `continue-on-error`. Task 3 asserts both on the template and Task 1 on the probe runner. Task 3 also proves that the verification runs on the step's early `The sandbox prerequisites are present.` path, not only after an install.
- **Turning `doctor` behavioural could make this repository's own suite spawn a real `bwrap`.** Inside a sandboxed Linux gate run, that nested check fails by design. Task 4 adds an env-var seam that `ISOLATED_ENV` sets to `off`, in the shape of the keep-awake lock probe's. Every verdict is graded through `assessSandboxHost`'s facts by Task 2, and the check's grade and message for each, in both modes, through Task 4's pure `gradeSandboxPrerequisites`, so no test needs a real `bwrap` or a particular host.
- **The Gate 15 container's verdict could change unseen.** The nested check has not been taken there. Task 7 records the container expectation as owed to the next Gate 15 Linux run, not as a result.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom.

- **Only the committing role flips a marker to `[x]`.** In every flow that dispatches one, that is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself.
- **No implementer edits this section.** No implementer changes a marker, or any other line of this section, in an index a run is iterating.
- **Other `[ ]` markers are informational.** `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are progress markers for the implementer only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_runner_seccomp_userns/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, in the configured layer order `cli`, then `general`, with the catch-all `general` layer last.

1. [x] **Task 1** — Hold the probe runner to stopping before its session when the install step fails _(layer: cli)_ _(points: 5)_
2. [ ] **Task 2** — Declare the stock-profile remedy, the load command and the nested user-namespace check in `sandboxPrerequisites.ts`, and assess them _(layer: cli)_ _(points: 20)_
3. [ ] **Task 3** — Make `Install the sandbox prerequisites` disable `bwrap-userns-restrict`, load our profile, always verify, and fail before the session _(layer: cli)_ _(points: 20)_
4. [ ] **Task 4** — Make `doctor`'s `sandbox-prerequisites` check run the nested check and FAIL when it fails _(layer: cli)_ _(points: 20)_
5. [ ] **Task 5** — Refuse a fresh local launch when bwrap's nested user-namespace check fails, in the run library's mirror _(layer: cli)_ _(points: 20)_
6. [ ] **Task 6** — Copy the new install step into `scripts/sandbox-probe-runner.yml`, and correct IS3's write rule comment _(layer: general)_ _(points: 10)_
7. [ ] **Task 7** — Record the round-13 cause and the fix in `docs/sandbox-verification.md` §9, and restate the rows the fix changes _(layer: general)_ _(points: 20)_
8. [ ] **Task 8** — Describe the step, the check and the watcher's refusal as they now behave in `docs/cli.md`, `docs/remote-execution.md` and `docs/watcher.md` _(layer: general)_ _(points: 20)_
9. [ ] **Task 9** — Refresh the self-adopted run library and watcher from their templates _(layer: general)_ _(points: 5)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/sandbox-verification.md` §9: the cause, with the run ids and readings above, and the fix, with the runner result owed to the Gate 12 redo. **No measured result is invented.**"* and *"`docs/remote-execution.md` and `docs/cli.md`: describe the step and the check as they now behave, including the hardening trade-off on a local Ubuntu 26.04 machine."* The register reads these together with the prompt's *"What to read first"* anchors: `docs/remote-execution.md`, *"where it describes the install step"*, and `docs/cli.md`, *"where it describes the doctor check"*.

**Derivation entry 1 — durable prose naming the install step, the check, the AppArmor pieces, the runner-install leg or the step's not-yet-run status (command).** Re-run verbatim from the checkout root:
`git grep -l -E 'Install the sandbox prerequisites|sandbox-prerequisites|apparmor_restrict_unprivileged_userns|/etc/apparmor\.d/bwrap|systemctl reload apparmor|runner-install|has not yet run on GitHub' -- '*.md' ':!harness-runs/**'`
Every path it prints appears in at least one row below. A file with several sites carries one row per anchor.

**Derivation entry 2 — the record's rows the check, the step and the watcher's launch probe are graded by (command).** It reaches §8's `doctor` rows (DP) and its `refusal` rows (RF), which grade the watcher's launch-time prerequisite probe and its `tick` refusal; §9's runner-install rows (IS); and every row of any section whose text names `Install the sandbox prerequisites` (§10's FR2). Re-run verbatim from the checkout root:
`grep -nE '^\| (DP[0-9]+|IS[0-9]+|RF[0-9]+) \||^\| [A-Z]+[0-9]+ \|.*Install the sandbox prerequisites' docs/sandbox-verification.md`
Every row id it prints appears as a row below.

**Closure invariant:** every site either derivation entry reaches appears as a row below.

| # | Site (path + symbol or quoted anchor, or standing-artifact row id) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `ROADMAP.md` → the `` `doctor` sandbox checks `` row (*"the remote job's step that installs the prerequisites before its preflight (not yet run on GitHub)"*) | — | entry 1, `sandbox-prerequisites` | `no-change` | A roadmap row's shipped status. Its *"not yet run"* clause was already overtaken by round 13, before this branch. The prompt gives confirmation on a runner to the Gate 12 redo, whose record restates the row with a runner result this branch does not have. |
| 2 | `docs/cli.md` §6 → *"On Ubuntu 24.04 and later, `kernel.apparmor_restrict_unprivileged_userns` is `1`"*, the fenced `sudo systemctl reload apparmor` block, and the paragraph *"`doctor` reports all of this under `sandbox-prerequisites`"* | — | entry 1, `apparmor_restrict_unprivileged_userns`, `systemctl reload apparmor` | `change` | Task 8 |
| 3 | `docs/cli.md` §7 → the `profile-sandbox` bullet's *"the watcher refuses a fresh local launch on a definite missing piece (§6)"* | — | entry 1, `sandbox-prerequisites` | `change` | Task 8 |
| 4 | `docs/cli.md` §7 → the bullet *"**`sandbox-prerequisites` is a warning without `--remote-job` and a failure under it**"* | — | entry 1, `sandbox-prerequisites` | `change` | Task 8 |
| 5 | `docs/cli.md` §7 → the **`--remote-job`** paragraph (*"An uncertain AppArmor answer also stays a warning"*, *"`sandbox-prerequisites` reads local files and this process's `PATH`"*) | — | entry 1, `sandbox-prerequisites` | `change` | Task 8 |
| 6 | `docs/cli.md` → the gate launcher's *"**Where it cannot run.**"* bullet (*"names `kernel.apparmor_restrict_unprivileged_userns`"*) | — | entry 1, `apparmor_restrict_unprivileged_userns` | `no-change` | It describes the gate launcher's own `bwrap` refusal, which this branch does not change. |
| 7 | `docs/cli.md` §7 → the `doctor` introduction's list of checks `--remote-job` turns into failures, and the check table's `sandbox-prerequisites` row | — | entry 1, `sandbox-prerequisites` | `no-change` | List membership and the check's title are unchanged. |
| 8 | `docs/config.md` §5 → `sandbox.optOut` (*"from `doctor`'s `sandbox-prerequisites` check, which passes as not required"*) | — | entry 1, `sandbox-prerequisites` | `no-change` | Still true: a taken opt-out passes the check and exempts the launch, the new refusal included (Tasks 4 and 5 keep both). |
| 9 | `docs/development.md` → the **FR2** bullet's *"Source: the install step prints `The sandbox prerequisites are present.` when it installs nothing, and a `::warning::` line for each thing it could not install"* | — | entry 1, `Install the sandbox prerequisites` | `change` | Task 7 |
| 10 | `docs/development.md` → the FR2 table row, the `sandbox2` step-6 bullet, and the three *"0.6.7 … has neither `Install the sandbox prerequisites` nor `Sweep the sandbox placeholders`"* sentences | — | entry 1, `Install the sandbox prerequisites` | `no-change` | They name the step and the version that lacks it, and both are still true. |
| 11 | `docs/development.md` → **Gate 15** (its preflight's *"passes … `sandbox-prerequisites`"*, the legs table's `runner-install` row, and the `runner-install` bullet of the leg list) | — | entry 1, `sandbox-prerequisites`, `runner-install` | `no-change` | IS1–IS4's grading code is unchanged, and Task 6 corrects only `legs-runner.sh`'s comment. The preflight still requires the check to pass. |
| 12 | `docs/development.md` → *A Linux run, in a local container* and **DP1–DP7, by hand** | — | entry 1, `apparmor_restrict_unprivileged_userns`, `sandbox-prerequisites` | `no-change` | The procedure is unchanged. What DP1 and DP5 now expect lives in the record's rows (rows 20 and 24), not in the procedure. |
| 13 | `docs/development.md` §6 → roadmap row 20 (*"the install step **has not yet run on GitHub**"*) | — | entry 1, `has not yet run on GitHub` | `no-change` | A roadmap row's shipped record, kept for the reason row 1 gives. |
| 14 | `docs/remote-execution.md` §4 → **The permission profile.** (*"under `--remote-job`, `sandbox-prerequisites` fails on a definite missing piece unless `sandbox.optOut` is taken"*) | — | entry 1, `sandbox-prerequisites` | `change` | Task 8 |
| 15 | `docs/remote-execution.md` §8 → **The job installs them.** | — | entry 1, `Install the sandbox prerequisites`, `apparmor_restrict_unprivileged_userns`, `/etc/apparmor.d/bwrap` | `change` | Task 8 |
| 16 | `docs/remote-execution.md` §8 → **The step has not yet run on GitHub.** | — | entry 1, `has not yet run on GitHub` | `change` | Task 8 |
| 17 | `docs/sandbox-placeholder-upstream-report.md` → its stamp's *"`kernel.apparmor_restrict_unprivileged_userns: 0`"* | — | entry 1, `apparmor_restrict_unprivileged_userns` | `no-change` | A report's own measured reading on its own date. |
| 18 | `docs/sandbox-verification.md` §9 → the lead paragraphs before the row table (a new round-13 cause-and-fix block) | — | entry 1, `runner-install`, `apparmor_restrict_unprivileged_userns` | `change` | Task 7 |
| 19 | `docs/sandbox-verification.md` §0 → *"Off Linux the Linux-only legs (… `runner-install` …) were skipped"* | — | entry 1, `runner-install` | `no-change` | A past run's record. |
| 20 | `docs/sandbox-verification.md` §8 → row DP1 | — | entry 2 | `change` | Task 7. Its *Expected* cell gains the nested check, and its 2026-10-29 observation stays as recorded. |
| 21 | `docs/sandbox-verification.md` §8 → row DP2 | — | entry 2 | `no-change` | `bwrap` absent: the nested check does not run, so the missing-piece grade is unchanged. |
| 22 | `docs/sandbox-verification.md` §8 → row DP3 | — | entry 2 | `no-change` | `socat` absent: the missing-piece grade is unchanged. A failing nested check would add a FAIL, which DP1's restated expectation covers. |
| 23 | `docs/sandbox-verification.md` §8 → row DP4 | — | entry 2 | `no-change` | Neither package: the nested check does not run. |
| 24 | `docs/sandbox-verification.md` §8 → row DP5 | — | entry 2 | `change` | Task 7. The uncertain AppArmor answer warns only where the nested check did not run, and is otherwise context. |
| 25 | `docs/sandbox-verification.md` §8 → row DP6 | — | entry 2 | `no-change` | Each user's `PATH` is graded as before. The nested check follows the same `PATH`. |
| 26 | `docs/sandbox-verification.md` §8 → row DP7 | — | entry 2 | `no-change` | A taken opt-out probes nothing (Task 4). |
| 27 | `docs/sandbox-verification.md` §9 → row IS1 | — | entry 2 | `no-change` | The sysctl reading is unchanged. |
| 28 | `docs/sandbox-verification.md` §9 → row IS2 | — | entry 2 | `no-change` | The package install is unchanged. |
| 29 | `docs/sandbox-verification.md` §9 → row IS3 | — | entry 2 | `change` | Task 7. The step now also writes the profile when `bwrap-userns-restrict` exists. |
| 30 | `docs/sandbox-verification.md` §9 → row IS4 | — | entry 2 | `no-change` | Its expectation (bwrap starts, and `sandbox-prerequisites` passes) still holds. That pass now includes the nested check, which Task 7's §9 block says. |
| 31 | `docs/sandbox-verification.md` §8 → row RF1 | — | entry 2 | `no-change` | It grades Claude Code's own startup refusal under `failIfUnavailable` with `bwrap` or `socat` absent. This branch changes neither that refusal nor the profile that sets it. |
| 32 | `docs/sandbox-verification.md` §8 → row RF2 | — | entry 2 | `no-change` | With `bwrap` absent the nested check does not run (Task 5 gates it on `bwrap` and `unshare` resolving), so the refusal still names the missing package. With `socat` absent the status is already 1 and the refusal still names `socat`; a failing nested check only appends its own sentence, which the row's *"refuses, naming the missing package"* still holds over. The new nested-refusal arm is graded by no existing row, and its container result is owed to the next Gate 15 Linux run, as Task 7's DP1 restatement says. |
| 33 | `docs/sandbox-verification.md` §8 → row RF3 | — | entry 2 | `no-change` | It grades a session on CS8's invalid profile, which no surface of this branch touches. |
| 34 | `docs/sandbox-verification.md` §8 → row RF4 | — | entry 2 | `no-change` | It is taken with `bwrap` absent, so the watcher's probe never runs the nested check and the `tick` refusal's message (*"this machine cannot sandbox an unattended run"*) and its archive and registry effects are unchanged (Task 5 changes no code line of `autonomous-watcher.sh`). |
| 35 | `docs/sandbox-verification.md` §10 → row FR2 | — | entry 2 | `change` | Task 7. Its *Expected* cell gains, prefixed *"Since `fix_runner_seccomp_userns`:"*, that the step's nested user-namespace check passes and prints its success line before `Preflight with doctor` runs, and that a failed check stops the job at the step with one `::error::`, which is a `fail` for this row. Its *Observed* and *Verdict* cells stay `not yet measured`. |
| 36 | `docs/watcher.md` §1 step 3 → *"the host check — whether this machine can start the sandbox the run needs, judged against the table `doctor` grades as `sandbox-prerequisites`"*, *"a definite missing piece archives the drop as `failed_<ts>_<name>`"* and *"A resume and job mode are not judged here; the profile's `failIfUnavailable` covers them"* | — | entry 1, `sandbox-prerequisites` | `change` | Task 8. The host check now also runs the nested check on Linux and WSL2, and a failed check archives the drop the same way. `failIfUnavailable` does not cover a failed nested check: the install step and `doctor --remote-job` cover a job, and a resumed local session is not judged. |
