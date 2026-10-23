### 1. The `WHY NOT A SIGNAL` header credits the `pgrep` refusal to the 2.1.309 measurement, which never ran `pgrep`

**File:** `cli/templates/scripts/run-test-suite.sh`, the header paragraph that opens "# WHY NOT A SIGNAL. Measured 2026-10-23, Claude Code 2.1.309, macOS, headless". The quoted wrong clause is "# `pgrep` could not read the process list (`pgrep: Cannot get process list`,". The same bytes are in this checkout's self-adopted copy, `scripts/run-test-suite.sh`, which must stay byte-identical to the template.

**The problem.** The paragraph presents one measurement: "Measured 2026-10-23, Claude Code 2.1.309, macOS, headless sandboxed session under the live profile". It lists five results under it, and the fifth is "`pgrep` could not read the process list (`pgrep: Cannot get process list`, exit 3)". That session, session `A` of `sbx2-probes.sh`, never ran `pgrep`.

- The probe script's `killcheck.sh` helper runs only `kill -0` and `ps -p`.
- Session `A`'s capture (`A.stream.jsonl` under `<home>/Work/harness-sandbox-tests/sbx2-results-20261023-083639/`) has `kill: (68252)`, `kill: (70347)` and `ps -p exit=126` lines, and no `pgrep`.
- The `pgrep` failure comes from a different source: `feat_unattended_sandbox_preflight`'s sandboxed gate runs of `cli/test/test-timeout.test.mjs` (`harness-runs/test_fix_plans/feat_unattended_sandbox_preflight_task_round_1/finding_3.md`, "sysmon request failed with error: sysmond service not found"). This branch's own document of record gets that right. `docs/sandbox-verification.md` → row WF1 puts it under the 2.1.308 run that prompted the branch: "In that run `pgrep` → `sysmon request failed …`".

This header ships to every adopter, and it is the script's statement of why the old check failed (task prompt, goal 2). `.claude/context/conventions.md` → `## Documents of record` requires that *"A measured fact states what was measured, the command and the exact message, so a later version that behaves differently is detectable"*. A maintainer who re-runs the 2.1.309 probe to check whether a later Claude Code version still refuses `pgrep` finds no `pgrep` probe there. They cannot tell whether the header is wrong or the probe is missing. The header and the document of record now also disagree about where the fact came from.

No consumer decision turns on this, because the design conclusion stands on the `kill -0` and `ps -p` results alone. That is why it is Should Fix.

**Fix.** In both `cli/templates/scripts/run-test-suite.sh` and `scripts/run-test-suite.sh`, replace these four header lines:

```bash
# refused even within one call (`/bin/ps: Operation not permitted`, exit 126);
# `pgrep` could not read the process list (`pgrep: Cannot get process list`,
# exit 3). So no signal or process-table check can tell a later call whether a
# run is alive, and this script sends no signal and lists no process.
```

with:

```bash
# refused even within one call (`/bin/ps: Operation not permitted`, exit 126).
# Observed separately, not in that session, by a sandboxed run of a test that
# reads the process list: `pgrep` could not read it (`pgrep: Cannot get process
# list`, exit 3). So no signal or process-table check can tell a later call
# whether a run is alive, and this script sends no signal and lists no process.
```

Leave every other header line unchanged. Then confirm that the two copies are identical with `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh`. This is a comment-only change, so it runs no test. The `cmp` check is not a test run, and the suite runs in the Run gates phase.
