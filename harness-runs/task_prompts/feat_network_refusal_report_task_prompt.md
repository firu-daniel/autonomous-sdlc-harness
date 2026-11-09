`feat_network_refusal_report` tells the maintainer when a run tried to reach the network and was refused, so a test or a command calling an unintended domain is noticed instead of passing unseen.

The run profile, `settings.autonomous.json`, sets `sandbox.network.strictAllowlist: true`, and its `allowedDomains` holds only what `harness.config.json`'s `sandbox.allowedDomains` lists, plus `127.0.0.1` when the interactive-test phase's browser wiring applies (`expectedSandbox` in `cli/src/generators/sandboxProfile.ts`). By default the list is empty, so a sandboxed call reaches no domain (`docs/sandbox-verification.md` N1, N5). A refusal is visible only inside the run's raw stream, and nothing surfaces it to the maintainer: the only code that recognises a refusal string today is the sandbox probe's judge.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `docs/sandbox-verification.md`, the rows that record a refusal string, and the refusal shapes a session sees:
  - **N1** (§4, and its Linux and runner rows in §8 and §9): `CONNECT tunnel failed, response 403` (as `curl: (56)` on macOS and Linux, as `curl: (7)` on the runner) and `<sandbox_violations> … (host is not on the allow list)`.
  - **N5**: the Bash tool's own refusal of the parameter, `<tool_use_error>allowed_domains cannot widen network access …`.
  - **CS3**: `sandbox proxy: <host>:<port>: 403 host is not on the allow list`, an SSH fetch through the proxy.
  - **P1**: `This proxy requires authentication`.
  - N3 and N4 record **no** refusal string and are not shapes to match: N3 is §5 F8, a macOS loopback call that reached its listener; N4's sandboxed connect ended `curl: (7) Failed to connect …`, indistinguishable by its text from an unreachable host.
- `scripts/lib/sandbox-probe/judge.sh` → its layer table (`sp_layer_of`), which already classifies these strings by layer, and its fixtures under `cli/test/fixtures/sandbox-probe/` (`network-violations.jsonl`, `n5-refused.jsonl`, `cs3-fetch-refused.jsonl`).
- The run's raw stream, `<log>.stream.jsonl`, and `run-analytics.sh`, which already reads it and renders `run-analytics.md` (`cli/templates/scripts/autonomous-watcher.sh` header, `cli/templates/scripts/run-analytics.sh` header).
- `cli/templates/scripts/launch-sandboxed-gates.sh` header → `NO NETWORK`: on a bubblewrap host the gates run under `--unshare-all`, in a network namespace of their own with no route out.
- `plugin/commands/branch-status.md`.

## The goal

1. **From the session stream, a reliable report.** Every refused network call in a run's sessions is listed with the session, the tool call's command, the host and port where the refusal names them, and the refusal line. It is shown in `/autonomous-sdlc-harness:branch-status` and in the run's `run-analytics.md`. A run with none says so.
2. **From the gate logs, a best-effort section, labelled as such.** A refused connection inside a test usually shows up as an error in that test's output, and the test runner's output names the failing test or file. What the error looks like depends on where the gates ran: through the sandbox's proxy it is the proxy's 403; under the bubblewrap gate launcher, which gives the gates no network at all, it is a plain connect error such as `ECONNREFUSED` or `ENETUNREACH`, with no refusal string. The report lists matches as *possible network attempts* with the test file where the log names one. It states its blind spots: a test that catches the error and passes leaves no trace, a plain connect error cannot be told apart from an unreachable host, and on macOS Seatbelt's own violation records go to the system log, not to the test output.
3. The report is read-only and changes no verdict.

## Constraints

- No new permission in any profile.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
- Fixtures cover each refusal shape listed above. **No measured result is invented.**
