`feat_sandbox_probe_linux_legs` extends the sandbox probe and its hand-run gate (Gate 15) so a person can measure the unattended sandbox **on Linux, in a local container**, and adds the legs only Linux can answer. It does not take the measurements.

This is the first of three branches that split the former sandbox3b:

- **sandbox3b1** (this one): the Linux legs in a local container, on the clone layout the probe already measures.
- **sandbox3b2** (`feat_sandbox_probe_job_mode`, #194): a probe mode that cuts no clone, and the GitHub-hosted runner legs that need it.
- **sandbox3b3** (`chore_sandbox_gate12_full_run_leg`, #195): the full run on the real job, after a release.

It starts from a `dev` that carries sandbox3a (#182), the three macOS probe runs and their records (#186, #189, #193), and the three rounds of probe fixes (#188, #190, #192).

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## Read first

The macOS evidence is not restated here. It lives in `docs/sandbox-verification.md`, and this branch reads it there:

- §0 *The probe's first run*, *second run* and *third run*: what was run, on which tree and version, and where the evidence is.
- The rows of §2–§4, with their latest result: each is the **macOS baseline** a Linux leg compares against.
- §5 F7 and F8, the two findings the macOS probe made.
- §5 *The probe's own defects*, **PD1–PD19**: every one is a rule for the Linux legs (*What the macOS runs taught*, below).
- §6: what no Linux host has measured.
- Gate 15 in `docs/development.md` → `## 5. Verifying a change`: the probe, its result-line format, its legs, its kept evidence.

**A macOS result is a baseline, never the Linux expectation by default.** Each Linux leg that has a macOS counterpart states that row's macOS result beside its own expected result, so the record can say *same* or *different* rather than re-argue it. Three expectations must not be copied:

- **TD4's expectation is TD3's, not TD2's.** TD3 is the unsandboxed GNU coreutils result: bare `mktemp` and `mktemp -d` honour `TMPDIR`, and `mktemp -t harness-gates` fails with `too few X's`.
- **CS7's `Edit` protection on macOS rests on `dontAsk` and the absence of an allow rule, not on a deny rule** (run 3, §6 *Also observed*). Do not assume a deny rule on Linux either.
- **N4 is graded by comparison.** Since #192 the probe issues N4's call unsandboxed from its own shell and grades a different outcome as a refusal. macOS run 3: session `curl: (7) … after 0 ms`, control `curl: (28) Connection timed out after 5006 milliseconds`, `pass`, no refusal string.

## What is owed on Linux

From `docs/sandbox-verification.md` §6 and the series' checks files (`~/Work/future task prompts/harness/sandbox tests/`):

- How the Linux sandbox treats a `denyWrite` entry containing `*`; the `failIfUnavailable` startup refusal; the ordinary-git check; §5 TD4 and T3.
- `feat_clone_per_run` §4: CL5 on Linux (whether the runtime refuses a sandboxed write to a clone's `.git/config`, `.git/hooks/` and `objects/info/alternates`; `docs/cli.md` §6 residual 1, item 3 says "Linux is unmeasured"), RG1–RG3, and the clone suites' fetch pins on Linux git.
- `feat_unattended_sandbox_preflight` rows A–E: `doctor`'s `sandbox-prerequisites` with neither package, one, both, the AppArmor answer, a non-root caller, and a taken opt-out; and the watcher's launch refusal on a host that lacks a package.
- `fix_run_gates_background_run_handling`: whether `nohup … &` with `disown` survives the session's exit under bubblewrap (BG2's Linux counterpart, BG9), and `hr_lane_mtime`'s GNU `stat -c %Y` arm, sandboxed (WF5).
- F8 (N3), N4 and F7 (CS8): none can be carried to Linux by inference.

## Verified facts (2026-10-24)

Checked against `https://code.claude.com/docs/en/sandboxing` (S) and the sandbox-runtime README (SR, `https://github.com/anthropics/sandbox-runtime`):

- **Linux and WSL2 use bubblewrap.** "The command runs in a separate network namespace that has no connection to your network"; SR: all traffic goes through proxies on Unix sockets bind-mounted into the sandbox. `git` over SSH works once the host is allowed on port 22 (S).
- **Every Linux write deny is a read-only bind mount**, protecting a path only in the mount namespace it was made in. So seccomp refuses `unshare`, `clone` with namespace flags, `setns`, `mount`, `umount2` and `pivot_root`. `allowNestedUserNamespaces` lifts that, and with it `denyWrite` (SR).
- **Ubuntu 24.04+** enables `kernel.apparmor_restrict_unprivileged_userns`, which strips the capabilities bubblewrap's namespace needs (SR).
- **A root caller** needs `CAP_SETFCAP` in its bounding set; Docker grants it by default, `capsh --drop=cap_setfcap` removes it (SR).
- **In an unprivileged container** bubblewrap cannot mount a fresh `/proc`; `enableWeakerNestedSandbox` bind-mounts the container's own instead (S).

## The probe's preflight on Linux

`scripts/lib/sandbox-probe/preflight.sh`, the header's `THE REFUSALS, IN ORDER.`, has seven refusals. On this branch:

- **Refusal 2** (`uname -s` is not `Darwin`) gives way to the Linux legs. Its deferral, "the Linux legs are owed under roadmap item 21 (docs/development.md §6)", is spelled in four places that change together: `scripts/sandbox-probe.sh`'s header, refusal 2's message in `preflight.sh`, `cli/test/sandbox-probe-shell.test.mjs`, and Gate 15's **The rows this probe does not take, named so the list is complete.**
- **Refusal 6** stops `run` on a host that lacks `bubblewrap` or `socat`. So the *refusal* leg below cannot be a leg of `run`: it is a separate subcommand with its own narrower preflight, or a hand step in the gate. The plan chooses, and must not weaken refusal 6 for the other legs.
- **Refusal 5** lists the remote the sweep fetches, so the container's checkout must reach its origin.
- **Refusal 4** can refuse falsely when a finished run's saved `pid` has been reused by another process (§5 PD19, open). A fresh container registry is unlikely to hit it; the gate says how to tell.

## What the macOS runs taught

Read §5 PD1–PD19 as rules. The ones a Linux leg most easily repeats:

- **A permission-layer refusal is not a result** (PD9, PD17). Every call under test needs its own literal `--allowedTools` rule, including a second call in the same session; a refusal at the permission layer is `not run`. Resolve any `${…}` value in a call of its own and pass it as a literal (PD3).
- **The judge's refusal strings are macOS's** (PD2's class). `sp__layer` (`judge.sh`) files a call under the sandbox layer only on `Operation not permitted`; the write-protection leg passes a rename only on that text; the gates and `mktemp` legs grep for `mkstemp failed`. A write into a bubblewrap read-only bind mount is expected to fail with `Read-only file system` (EROFS), and a network refusal inside the namespace may not print `<sandbox_violations>`.
- **A failed call's message is lost** (PD18, open). `sp__layer`'s `ran` arm takes the tool result's first line, which is the Bash tool's `Exit code <n>` header, so the refusal text after it never reaches the evidence. On Linux this would hide exactly the strings the bullet above needs. **Fix PD18 on this branch**, with fixtures, before adding the Linux strings.
- **An `Edit` needs a successful `Read` first** (PD16), or the tool's own refusal looks like protection.
- **`~` is not expanded after `of=`**; print and paste absolute paths (HP1).
- **The guard and the sweep** (PD14): a branch merged during the run can still trip the `shasum` guard.
- **Record the stamp.** No macOS run recorded the git and OS versions or the probe's exit status. A Linux run records `uname -a`, the distribution, `bwrap --version`, the `socat` version, `git --version`, `claude --version`, `kernel.apparmor_restrict_unprivileged_userns`, whether the caller is root, and the exit status.

**Build on what #182, #188, #190 and #192 shipped:** evidence keeping for non-passing legs; `sp_launch_args` as the one source of launch flags (extend it, do not fork it); the parity script's printed launch lines and requests; the positive-control rule (`session.sh`); T2 through `run-test-suite.sh`; the N3 listener (`python3 -m http.server`, so the image needs `python3`); N4's unsandboxed control (`legs-network.sh`); and CS8 (b)'s call into the watcher's own `run_profile_check` in a child `bash -c` (`legs-settings.sh`).

## The goal

1. **A container recipe**, in the gate: an image on this machine's colima VM with node at or above the CLI's `engines` floor, the checkout, `bubblewrap`, `socat`, `python3` and a signed-in Claude Code. **Placing Claude Code's credentials inside the container is the maintainer's decision, made when they run the gate.** The recipe says plainly what it places there and how it is removed afterwards.
2. **The judge on Linux.** PD18 fixed, then the Linux refusal strings added to `sp__layer`, the write-protection leg and the `mktemp` and gates legs, each with a fixture. Where a string cannot be known before the first Linux run, the leg prints `not run` naming the unrecognised text rather than `fail`, and the gate says the strings are taken from the first run's kept evidence.
3. **sandbox3a's legs in the container**, where they apply, plus:
   - **glob `denyWrite`:** a sandboxed write to a path only a `*` entry in the base profile covers. Record whether it is refused, and whether the answer depends on the path existing when the sandbox starts.
   - **the clone's `.git`:** CL5 and RG1–RG3 on Linux.
   - **mktemp and gates:** TD4 (expected from TD3) and T3, which runs as T2 does, through `run-test-suite.sh`.
   - **detached run:** `nohup … </dev/null >/dev/null 2>&1 &` plus `disown` outlives the call and the session (BG9), and `.running`'s mtime advances through `stat -c %Y` (WF5).
   - **loopback (F8, N3):** N3 against the probe's own listener in two forms, each graded by the listener's token: `http://127.0.0.1:<port>/…` and `http://localhost:<port>/…`. Record which path each call took: the names of the session's proxy variables with each proxy's host and port only (a proxy URL can carry credentials), and a second call of each form with `--noproxy '*'`. S and SR lead one to expect a host-loopback listener to be unreachable; **that is to be measured, not asserted.** Take N3 on its scratch profile as generated (`allowedDomains: []`, `allowLocalBinding: true`) and again with `127.0.0.1` added, the shape `LOOPBACK_ALLOWED_HOST` in `cli/src/generators/sandboxProfile.ts` produces when the interactive-test phase applies. Record whether listing the IP changes either form, and whether a listener started by a sandboxed call is reachable from outside the sandbox (the interactive-test shape).
   - **link-local (N4):** as on macOS, by comparison with the unsandboxed control.
   - **invalid profile (F7, CS8):** (a) recorded as on macOS; (b) graded, the watcher's `run_profile_check` refusing the invalid scratch copy. Then, with the *refusal* leg, the same invalid profile on a host with `bubblewrap` absent: if the file is ignored as on macOS, `failIfUnavailable` is never read and the session may start unsandboxed with no startup refusal. Record which.
   - **refusal:** with `bubblewrap` or `socat` missing, Claude Code's own startup refusal under `failIfUnavailable`, quoted; the watcher's launch refusal, which archives the drop as failed and cuts no clone; and `doctor`'s `sandbox-prerequisites` rows A–E.
   - **headless parity (HP1):** the parity checklist in the container, if a terminal there allows interactive sessions.
4. **The gate and the record.** Gate 15 gains these legs, each with its expected result and macOS baseline. `docs/sandbox-verification.md` gains a row for each (a new row id where none exists), marked *not yet measured*.

## Constraints

- **No measured result is invented.** Every row this branch adds says *not yet measured*.
- **Do not set `allowNestedUserNamespaces` or `enableWeakerNestedSandbox`** in any profile the probe measures, unless a leg shows that nothing else runs; then the leg says so and states what stops holding.
- **No profile, generator, wrapper, guard or watcher behaviour changes.** A defect becomes a follow-up task prompt, F7 and F8 included; `LOOPBACK_ALLOWED_HOST` stays as it is.
- **The macOS legs keep working.** Every probe change leaves the macOS legs' verdicts on the recorded evidence unchanged; fixtures under `cli/test/` show it. No test launches `claude`.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.

