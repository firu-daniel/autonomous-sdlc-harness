`feat_sandbox_probe_job_mode` gives the sandbox probe a mode that measures **the checkout it runs in, under the base profile a `harness-run.yml` job builds**, instead of a cut probe clone under a per-run profile. It adds the legs a **GitHub-hosted runner** must answer, and a workflow that runs them. It does not take the measurements.

This is the second of three branches that split the former sandbox3b:

- **sandbox3b1** (`feat_sandbox_probe_linux_legs`, #166, merged as #198): the Linux legs in a local container.
- **sandbox3b2** (this one).
- **sandbox3b3** (`chore_sandbox_gate12_full_run_leg`, #195): the full run on the real job, after a release.

It starts from a `dev` that carries sandbox3b1 and what followed it. **Read these first**, in `docs/sandbox-verification.md`, as this branch's Linux baseline:

- §8 *The Linux legs*, filled by the first Linux container run (2026-10-29, #213), and §0's stamp lines for it.
- §5 **F9**, a Linux placeholder for an absent `denyWrite` path that broke git in the run copy, fixed by #217 and #224, with the absent-path re-take AP1–AP5 (2026-10-30, #222).
- §5 **F10**: on Linux, a `nohup` + `disown` process does not outlive its sandboxed call (BG9).
- §5 **PD1–PD23**, the probe's own defects. PD20–PD23 came from the container run.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## Why a clone-less mode

The probe (`scripts/sandbox-probe.sh`, Gate 15 in `docs/development.md` → `## 5. Verifying a change`) always measures the local clone layout: it cuts a probe clone (`sp_setup` in `scripts/lib/sandbox-probe/session.sh`, through `create-worktree.sh`), renders that clone's per-run profile, and launches sessions against it. A job runs one run in the job's own checkout, "where the main checkout and the run copy are the same directory" (`docs/remote-execution.md`), on the base profile the job generates, and no clone is cut. Four differences the mode must reproduce rather than approximate:

- **The launch line.** In job mode the watcher adds one `--add-dir` per `permissions.additionalDirectories` entry of the base profile, after the two fixed ones (`cli/templates/scripts/autonomous-watcher.sh`, the launch-line comment's `JOB MODE ONLY` tail). `sp_launch_args` sets only the two fixed entries. Extend it; do not fork it.
- **The profile check.** In job mode `run_profile_check` checks the base profile itself, with no copy and no appended entries (its header: "In job mode <file> is $SETTINGS_PROFILE, no <copy> is passed"). No per-run profile is rendered.
- **The preflight.** The job's preflight is `doctor --remote-job`, under which `sandbox-prerequisites`, `profile-paths`, `plugin-permissions` and `profile-tracked` fail where a plain `doctor` warns (`docs/remote-execution.md` → **The permission profile.**). In job mode the watcher turns off the cleanup sweep, so the probe's refusals 4 and 5 and refusal 6's `SETTINGS_PROFILE` half, which assume a local watcher, do not apply; the mode states its own preflight.
- **The placeholder sweep.** On Linux the base profile's `denyWrite` entries for absent paths leave placeholders in the job's checkout (F9), and the job removes them after the run with its `Sweep the sandbox placeholders` step (`autonomous-watcher.sh job-sweep`, added by #217). The mode runs the same sweep after its legs, and a leg that reads the checkout's git state says whether it ran before or after it.

**Which legs carry over.** The clone-only rows do not: CS*, CL5 and the wrappers' clone arm. The network, write-protection, wrappers-over-HTTPS and credentials legs do. §2 CS6, *a job-mode-shaped session* (a fresh `git clone` outside the sibling glob, the base profile, `git add` refused under `<job>/.git`, the commit landing through the wrapper), is this layout's own row and a hand row today: the mode takes it. L1 is unreachable on the clone layout (§3 L1); the plan checks whether it becomes reachable here, where the target is the checkout itself, and takes it only if so.

## The runner legs

`fix_run_job_credential_exposure` (sandbox4, #144) needs two answers from a GitHub-hosted runner. The sandbox-runtime README says "every sandbox this library starts has its own PID namespace and a fresh `/proc`" (checked 2026-10-24); nothing the docs say covers no-new-privileges. **Measure both; do not cite the README as the result.**

- **PID namespace:** from a sandboxed call, whether `/proc/$PPID/environ` is readable, and whether `ls /proc` lists processes outside the call's own tree. Use a canary variable the workflow sets in the parent environment and never print a real secret: check for the canary by a count or an exit status, as S4 checks presence with `printenv <name> >/dev/null`, never by printing the file.
- **no-new-privileges:** `sudo -n true` from a sandboxed call, beside a `sudo -n true` control in the workflow's own unsandboxed step, and `NoNewPrivs` from `/proc/self/status`. GitHub documents that "The Linux and macOS virtual machines both run using passwordless `sudo`" (`docs.github.com` → *GitHub-hosted runners reference*, checked 2026-11-01), so the control is expected to succeed. If it does not, the leg is `not run`, not a pass.
- **the install step:** what `harness-run.yml`'s `Install the sandbox prerequisites` step installs, and `doctor`'s `sandbox-prerequisites` passing after it. Neither `bubblewrap` nor `socat` is listed in the Ubuntu 24.04 or 26.04 runner image's software list (`actions/runner-images`, images `20261026.354.1` and `20261026.180.1`, checked 2026-11-01), so the step is expected to install both. **This is PD20's restricted case.** Record `kernel.apparmor_restrict_unprivileged_userns` before the step, whether the step wrote `/etc/apparmor.d/bwrap`, and whether `bwrap` then starts as the runner user. The container run set that sysctl to `0` on the VM (§0); the runner must not. The images' documentation does not state the sysctl's value, so the leg measures it.
- **the job layout's own row:** CS6, in the clone-less mode, on the base profile the job builds.
- **link-local (N4):** GitHub-hosted runners are Azure VMs, and Azure's Instance Metadata Service listens at `169.254.169.254`. It refuses a request without the `Metadata: true` header with HTTP 400 (`Required metadata header not specified`), so **any HTTP status line counts as an answer**, 400 included. Whether a hosted runner can reach the service at all is not documented. The workflow's unsandboxed step tries it first, without the `Metadata` header, and records the status line only, never a body. If it answered, a response to the sandboxed call is a `fail`. If it did not, N4 is graded as on macOS since #192, by comparison with the unsandboxed control.
- **loopback:** N3 and the `loopback` leg's LB1–LB5, as sandbox3b1 takes them, in both the `127.0.0.1` and `localhost` forms, with and without `127.0.0.1` listed. This is the runner half of the F8 decision in #170 (*Loopback (F8), a decision after step 3*). The container found the host listener unreachable (§8, LB1–LB4), so F8 has only been seen on macOS so far.
- **detached processes (F10):** BG9, in BG2's shape, recorded on the runner. A job's gate run detaches in that shape (F6), so whether it outlives its call on the runner matters to every job. In the container BG9 failed (§5 F10).
- **the macOS legs that apply:** network, write protection, wrappers over HTTPS, credentials. S1 and S2 need a `~/.ssh/config` to tell a refusal from an absence (PD21): the workflow creates a placeholder before the run.

**Do not repeat what the earlier runs taught** (`docs/sandbox-verification.md` §5 PD1–PD23). For these legs above all: spell every call with literal values (resolve the PID in a call of its own, PD3); give each call under test its own exact `--allowedTools` rule (PD17); and a `sudo` or `/proc` read refused at the permission layer measures neither leg and is `not run` (PD9). A refusal whose text the judge's Linux layer table does not know prints `not run` (PD23); add the shapes the container run met before the runner run.

## The workflow

The branch provides a workflow file the person commits **by hand** to the Gate 12 repository, `firu-daniel/harness-gate12`; this repository cannot host its own remote runs (`docs/development.md` → **This repository cannot host its own remote runs.**). It installs the sandbox prerequisites as the job does, builds the profile the way the job does, signs in with the `CLAUDE_CODE_OAUTH_TOKEN` secret the repository already holds, and runs the probe in the clone-less mode.

**The runner.** The job runs on `${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}`; the workflow uses the same expression, so it measures the runner a job would get. `ubuntu-latest` is moving from Ubuntu 24.04 to Ubuntu 26.04 between 2026-10-19 and 2026-11-19 (`actions/runner-images#14748`), with kernels `6.17.0-1022-azure` and `7.0.0-1012-azure`. So the workflow records the image it ran on (`ImageOS`, `ImageVersion`, `uname -r` and the `bwrap --version` it installed) in its evidence, and every runner row carries that stamp. `firu-daniel/harness-gate12` is private, so it gets the 2-vCPU runner.

**Where the probe comes from.** The probe is a repository-only tool. It is not in `cli/templates/`, so npm does not carry it, and `scripts/publish-main.sh` removes `scripts/` from `main` and from every release tag. The workflow therefore checks out this public repository at a commit it takes as an input, beside the adopted checkout, and runs the probe from there against the adopted checkout. Its evidence names that commit.

**The release.** A job clones the marketplace repository at the release tag `autonomous-sdlc-harness--v<version>` and runs `init` and `doctor` from npm at `HARNESS_CLI_VERSION` (`docs/remote-execution.md` → `### Upgrading`). The last release, 0.6.7, predates the whole sandbox series: its `harness-run.yml` has neither `Install the sandbox prerequisites` nor `Sweep the sandbox placeholders`. So the runner legs are taken at the release #170 step 4 cuts from a `dev` carrying this branch and #195, through `bash scripts/release.sh <version>` (`docs/development.md` → `## 7. Releasing`), and the gate says so. Issue #170 step 4 takes them in its one Gate 12 round.

**The evidence.** `firu-daniel/harness-gate12` is private (the maintainer, 2026-10-27). The workflow uploads the probe's kept evidence directory as a workflow artifact with a short retention the plan names. That also covers PD22's lost evidence. The kept streams can quote what a session read, so the canary design must keep any real secret out of them, and the workflow decides what leaves the runner.

## The goal

1. The clone-less mode, with its own preflight, launch line, profile check and placeholder sweep as above, and fixtures under `cli/test/` driving it. No test launches `claude`.
2. The runner legs, each with its expected result and, where one exists, its macOS and container baseline beside it.
3. The workflow file, and the gate's instructions for committing it to the Gate 12 repository, running it, and reading the uploaded evidence.
4. **The Linux runner's results get their own section with a stable heading** in `docs/sandbox-verification.md`, because sandbox3c (#167) writes it up and sandbox4 (#144) cites it for its in-job routes. Name that heading in the gate. Every row in it says *not yet measured*.

## Constraints

- **No measured result is invented.**
- **The workflow never runs in this repository.**
- **Do not set `allowNestedUserNamespaces` or `enableWeakerNestedSandbox`** in any profile the probe measures, unless a leg shows that nothing else runs; then the leg says so.
- **No profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour changes.** A defect becomes a follow-up task prompt.
- **The macOS and container legs keep working**, with their verdicts on the recorded evidence unchanged; fixtures show it.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.

