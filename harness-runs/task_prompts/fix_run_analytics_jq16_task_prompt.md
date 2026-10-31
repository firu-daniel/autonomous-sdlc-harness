`fix_run_analytics_jq16` makes run analytics work on jq 1.6, which the harness supports, and brings the notes-app fixture's profile back in line with what `init` now generates for `run-analytics.sh`. Both came in with run analytics (`c573db24`, `ce42229e`), and both were found while #212 (`fix_linux_sandbox_deny_placeholders`) was verified.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## 1. Run analytics fails on jq 1.6

**Measured (2026-10-30).** The CLI test suite was run on Linux in Gate 15's container (`docs/development.md`, *A Linux run, in a local container*): Debian 12 (`node:22-bookworm`), with `jq` from Debian's own package (`apt-get install -y jq`), on `dev` at `1a41540c`. Every failure in that run except five tests (filed as sandbox3b1e) is this one error:

```
run-analytics: lib/run-analytics-report.jq rollup failed: jq: error: syntax error, unexpected label, expecting IDENT (Unix shell quoting issues?) at <top-level>, line 233:
```

Line 233 of `lib/run-analytics-report.jq` is:

```jq
def latency_row($label): [$label, .count, (.p50_ms | fmt_dur), (.p90_ms | fmt_dur),
```

In jq 1.6, `label` is a keyword (`label $name | … break $name`), so `$label` does not parse as a variable name. jq 1.7 accepts it. On macOS the suite passes because Homebrew's jq is 1.7 or newer (this machine has `jq-1.8.2`).

**Why it matters.** `doctor` declares a **jq 1.5** floor (`cli/src/doctor/checks.ts`, the `jq` check, `JQ_MIN_MAJOR`/`JQ_MIN_MINOR`). Debian 12 and Ubuntu 22.04 ship jq 1.6. On such a host every run's analytics fail. The watcher logs `run analytics: '<branch>' not recorded (exit 1)` and the run otherwise completes, so the loss is quiet. It also breaks the job-mode path that commits the session's analytics on the run's branch.

**The failing tests**, all with this error:

- `run-analytics-tokens.test.mjs`: *token and tool-time figures over a transcript-backed and a transcript-less session*; *E: a record from before token accounting …*; *F: a total input with any null component renders —…*; *B: with an empty claude home …*.
- `run-analytics.test.mjs`: *metrics: each value equals the one computed by hand …*, with its subtests *a suspend file* and *none*; *suspend overlay …*; *an incomplete last session waits …*; *idempotence …*; *refusal: a corrupt run-analytics.json …*; *redaction …*.
- `watcher-remote-job.test.mjs`: *run analytics: a job commits the session's record on its branch and leaves the push to the workflow*.
- `watcher-run-analytics.test.mjs`: *a launch commits run-analytics.json then run-analytics.md on the branch …*; *a push origin refuses after the commits is one watcher-log line …*.
- *the session's analytics are committed and pushed on the run's branch, and a failing step changes no outcome*.

**For the plan to verify, not constraints:**

- Rename the parameter (for example `$name` or `$row_label`) in `lib/run-analytics-report.jq`, in its template under `cli/templates/scripts/lib/` and in the self-adopted copy under `scripts/lib/`.
- Then check both jq programs (`run-analytics-report.jq` and `run-analytics.jq`) for any other construct newer than the declared 1.5 floor, not only this keyword.
- If the repository has, or can cheaply gain, a way to run the jq programs under an older jq in its tests, use it, so the floor is enforced rather than assumed. Say what it costs if not.
- If it does, run the other jq programs through it as well, not only the analytics ones. `fix_linux_sandbox_sibling_glob_trio` (#224) added jq in places where a failure is not quiet:
  - `plugin/hooks/git-trust-file-guard.sh` parses every `Edit`, `Write` and `NotebookEdit` call's payload with one `jq` program. It refuses the call when `jq` exits non-zero, so a construct a 1.6 `jq` rejects would refuse every file-tool call in every session that loads the plugin. Its header claims the 1.5 floor.
  - The watcher's per-run profile render (`autonomous-watcher.sh` → `run_profile_glob_drops`, `run_profile_edit_drops` and the render that applies them) and the trust-check helpers in `lib/harness-run-lib.sh`. A render failure refuses the launch.

  A read of those programs on 2026-10-31 found only 1.5 constructs (every `if` with an `else`, `endswith`, slicing, `@sh`, `--slurpfile`). That is a reading, not a run under jq 1.6.

## 2. The notes-app fixture lacks the `run-analytics.sh` entries

`init` now generates write protection for the main checkout's `scripts/run-analytics.sh`: a `sandbox.filesystem.denyWrite` path, an `Edit(//…/scripts/run-analytics.sh)` deny rule, and a segment in the `WHAT RUNS OUTSIDE THE SANDBOX` `_README` line (*"…/scripts/run-analytics.sh - the run watcher, the remote job or a person runs the main checkout's run-analytics.sh outside the sandbox;"*). `examples/notes-app/.claude/settings.autonomous.json` carries none of the three.

Found by #212's Task 10. It rendered the fixture with the built CLI (`node cli/dist/cli.js init --non-interactive --no-analyze --force --quiet`) over a `git archive HEAD:examples/notes-app` copy, and compared the result. Its record is `harness-runs/task_plans/fix_linux_sandbox_deny_placeholders/task_10_plan.md` → *Deviations from plan* on that branch.

**For the plan to verify:** re-render the fixture the same way, take the `run-analytics.sh` entries and their `_README` segment, and check for any other difference between the render and the fixture. Change nothing else. Then update the count and description `examples/notes-app/README.md` keeps for that file.

**Expected differences beyond `run-analytics.sh`.** Since this prompt was written, `fix_linux_sandbox_sibling_glob_trio` (#224) has changed the generated profile's `_README` text without re-rendering the fixture. Three lines changed:
- the write-protection line (*"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT: …"*, from `cli/src/generators/writeProtection.ts` → `applyWriteProtection`);
- *"THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING: …"*;
- *"TWO RESIDUALS, STATED RATHER THAN HIDDEN: …"*, both from `cli/templates/claude/settings.autonomous.json`.

#224 changed no entry. Take those three lines from the render as well, and record them in the README's re-render record next to the `run-analytics.sh` additions. Any other difference is still reported rather than taken.

**A known obstacle.** An unattended run cannot write under `examples/notes-app/.claude/`. The tool layer's `.claude/**` guard refused #212's Task 10 and its review's Finding 2 twice each, in `dontAsk` mode. If the run is refused again, it records the edit as a one-paste operator remedy, as #212 did, rather than skipping it.

## Constraints

- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
- The fixture's other entries change only where the render differs, and the README says what changed.
- The jq fix is shown on jq 1.6 itself, either through the older-jq route above or by `npm test --workspace cli` in Gate 15's container on this branch's head before merge. `docs/development.md` → *The absent-path check, by hand* describes how: clone the branch, then `git checkout -B dev`.
