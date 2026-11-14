`fix_gate_worker_sandbox_start` makes Phase G's gate run start again inside an unattended session's sandbox on macOS. Since Claude Code 2.1.323, every local autonomous run parks at Phase G round 1, because the detached gate worker never starts.

> ⚠️ **Find every anchor in this prompt by its quoted text or symbol name, never by line number.** Verify every claim marked *verify* before planning on it.

## What was observed (feat_converging_plan_reviews, 2026-11-13 and 2026-11-14)

- **In the session.** `bash <main>/scripts/launch-sandboxed-gates.sh <run copy> task_round_1` printed `in-session` (exit 4, normal on macOS). The run form `bash scripts/run-test-suite.sh task_round_1` then exited 2 with `run-test-suite.sh: the detached run of task_round_1 did not start`. No `.running`, `.verdict`, `.commit` or log file was written, and the host showed no CPU load, so the worker never ran. This happened in two sessions: one on Claude Code 2.1.323, one on 2.1.325.
- **Before the update.** The 12 runs before it, all on 2.1.322, got `pending` / exit 3 from the same command: the worker started.
- **Outside the sandbox.** The same run form, issued from a main session outside the sandbox in the same run copy, printed `pending` within a second. The worker detached to pid 1 and ran every gate to a verdict.
- **Other new symptoms in that run's sessions:** `mktemp: mkdtemp failed on /var/folders/…/T/…: Operation not permitted` (no earlier run had it), and implementers reporting refused `mktemp -d`, `git init`, `cp` and `rm`.

## Candidate causes from the Claude Code changelog (2.1.323 and 2.1.325)

None of these is confirmed; *verify* each against a probe before acting on it.
- **Symlinks:** the Bash sandbox now ignores write access granted through a symlink in a writable folder that leads elsewhere.
- **macOS process visibility:** `lsof` and similar tools may show less about processes a command did not start.
- **Settings:** sandboxed Bash follows the normal permission flow unless `sandbox.autoAllowBashIfSandboxed: true`, and sandboxed writes to `.claude` settings, skills, agents, commands and hooks in added directories are refused.

## The goal

1. **Find the cause with a probe.** Run the run form inside a session launched with this repository's generated `.claude/settings.autonomous.json` on the current Claude Code version. Capture the worker's own stderr, which `scripts/run-test-suite.sh` sends to `/dev/null` today. Record the probe, the version and the finding in `docs/`. A probe that needs a launch the session cannot make is written as a script the user runs.
2. **Fix it so the gates run inside the sandbox again.** Gates and tests stay sandboxed or do not run. Running them outside the sandbox is not a fix: `sandbox.excludedCommands` stays limited to fixed, write-protected main-checkout scripts.
3. **Make a worker that dies before claiming `.running` leave its reason behind** in the lane directory, so the next refusal is diagnosable from the files. Silence is what made this failure cost two parks.

## Constraints

- `scripts/run-gates.sh` passes.
- Every wire string a caller matches stays byte-identical unless the same branch changes the caller (`pending`, `in-session`, `did not start`, the exit codes).
