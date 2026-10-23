### 1. The wrapper header promises one run per label and watchdog survival, but this branch recorded a heartbeat that stops with no signal sent

**File:** `cli/templates/scripts/run-test-suite.sh` (header comment) — "RESIDUALS OF THE DETACHED SHAPE", "ONE RUN PER LABEL." and "No signal was refused by the sandbox."; and its byte-identical self-adopted copy `scripts/run-test-suite.sh`, same anchors.

**Problem.** The header is where a reader learns what the wrapper guarantees, and `.claude/context/cli.md` → `## What "done" means here` makes it binding: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit."* This branch's header says:

- `ONE RUN PER LABEL.` — *"the worker has been reparented away from them, so it survives, and the resumed session's run form for the same label collects it rather than starting a second run."*
- `SIGNALS.` — it attributes each heartbeat stop it saw to the signal under test (KILL: "the heartbeat did not reliably stop"; INT: "in 2 of 7 runs the heartbeat stopped within 3 s while the worker and gate ran on").
- `RESIDUALS OF THE DETACHED SHAPE.` — it names a never-exiting gate and a late-claiming worker, and calls the run form re-issued inside the start-up gap "The one unguarded case".

This branch's own Task 2 measured something the header does not mention. `harness-runs/task_plans/fix_run_gates_background_run_handling/task_2_plan.md` → **Deviations from plan:** says that, sandboxed and against the template `init` wrote, `.running`'s heartbeat went stale while the worker and the gate were both alive in 2 of 14 holder-shape runs. One of those 2 runs sent **no signal at all** (*"`.running`'s age was 3.1 s at 2 s after start and still rising, and `--wait` refused"*). No `.running.stop.<pid>` file ever appeared, so the reader had not seen end of file. The note concludes: *"the 2-of-7 INT and 6-of-8 KILL heartbeat observations in the wrapper's `SIGNALS` paragraph are probably not caused by those signals. The stall happens without any signal,"* and *"a live run's label can read free after `STALE_SECONDS`, and a re-issued run form would then start a second worker."* The same stall made the suite's case `a run form killed with its session leaves the worker running, and a re-issued run form collects it` fail in 1 of 3 sandboxed runs. `docs/sandbox-verification.md` records the observation in the paragraph after row BG10 (*"a worker heartbeat that stopped refreshing while the worker and its gate were alive, once with no signal sent"*). The wrapper header, which a maintainer debugging a `no run in flight` refusal reads first, still states the guarantees without it.

So "the one unguarded case" is false, and the ONE RUN PER LABEL and watchdog-survival sentences hold only while the heartbeat refreshes. A maintainer who reads the header and sees `--wait` refuse `no run in flight` for a run that is still going would look for a dead worker or a signal. Neither is the cause.

**Fix.** Amend the header in both copies identically. `scripts/run-test-suite.sh`, which Task 9 brought level with the template, must stay byte-identical to it. Edit only below line 22, so the marker block at lines 18–22, which `docs/work-report-research/test-fix-plan-writer.md` cites by line, does not move.

1. In `ONE RUN PER LABEL.`, change the closing clause *"so it survives, and the resumed session's run form for the same label collects it rather than starting a second run."* to:

   ```
   # so it survives, and the resumed session's run form for the same label
   # collects it rather than starting a second run — while its heartbeat stays
   # fresh (RESIDUALS OF THE DETACHED SHAPE).
   ```

2. In `RESIDUALS OF THE DETACHED SHAPE.`, replace *"The one unguarded case is a run form re-issued INSIDE the gap"* with *"Another unguarded case is a run form re-issued INSIDE the gap"*. After that paragraph's last sentence (*"…it is recorded, not handled."*), append:

   ```
   #
   # A heartbeat can also stop with NO signal sent: in a sandboxed macOS fixture
   # (2026-10-23) `.running`'s mtime stopped advancing while the worker and its
   # gate were both alive, and no `.running.stop.<pid>` file appeared, so the
   # reader had not seen end of file; the cause was not established
   # (`docs/sandbox-verification.md` → the paragraph after row BG10). The label
   # then reads free after STALE_SECONDS while the run still runs: `--wait`
   # refuses `no run in flight`, and a run form issued then starts a second
   # worker that races the first for `.running`. Row BG10 is the measurement
   # that would show it on a real run.
   ```

3. In `SIGNALS.`, directly after *"No signal was refused by the sandbox."*, add one comment line: `# A heartbeat stop below may not be the signal's doing: one was also seen with no signal sent (RESIDUALS OF THE DETACHED SHAPE).`

These are comment-only edits. Verify with `bash -n` on both files and `cmp` of the two copies. No test file is created or edited, so no test runs; the suite runs in the Run gates phase.
