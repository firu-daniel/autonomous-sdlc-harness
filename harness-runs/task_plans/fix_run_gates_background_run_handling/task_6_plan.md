### Task 6 — Correct `autonomous_pause_and_ledger.md` §2.5's teardown account to the three measured cases

**Goal:** Replace §2.5's unmeasured claim *"A headless `claude -p` session is torn down when the turn ends: the process exits, any pending monitor dies with it, and nothing re-invokes the run."* with the three cases measured on Claude Code 2.1.309, each carrying its version. Keep the rule against ending the turn to wait out a backoff. Keep the `rc=0` → `completed` account for the nothing-pending case, now citing its measurement.

**Depends on:** nothing earlier on this branch. **Cited by:** Task 4's G.1, which cites this paragraph by its opening sentence, and Task 7's five fork clauses, which point here for what a pending task or `Monitor` changes. Both rely on the opening sentence *"A backoff is not a resumption mechanism, and neither is a `Monitor`."* staying byte-identical.

**Citations this task writes and does not verify.** Rows BG1, BG5, BG6, BG7, BG8 and BG9 of `docs/sandbox-verification.md` are created by Task 11, with the contents the story index's `## Context` table fixes. Cite them by those ids and do not open the document.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md`: §2.5, the paragraph opening *"⚠️ **A backoff is not a resumption mechanism, and neither is a `Monitor`.**"*

**Work:**

- [ ] Keep the paragraph's opening sentence and its instruction byte-identical: do not schedule a `Monitor`, do not sleep for minutes, and above all do not end the turn intending to continue once the backoff elapses. Replace the teardown sentence with the three measured cases, measured on Claude Code 2.1.309, macOS, headless, sandboxed:
  - **nothing pending:** the process exits `rc=0` right after the turn ends (`docs/sandbox-verification.md` → BG1);
  - **a background Bash task pending:** the process stays alive, is woken when the task completes, runs one more turn and then exits `rc=0` (BG5);
  - **a `Monitor` pending:** the same, woken when the Monitor's stream ends (BG6).

  Add that the Linux sandbox was not measured (BG9), and that an unattended run on Claude Code 2.1.308 matched the background-task case (`docs/sandbox-verification.md` → BG7). Cite that run by its row and version only: never write its branch name into this file, because `plugin/` ships to every adopter and no adopter's branch name is ever a literal there (`.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`; `.claude/context/plugin.md` → `## What this layer is`). The branch name belongs to Task 11's row BG7 in `docs/` alone.
- [ ] Keep the account that follows, now attached to the nothing-pending case: that exit is `rc=0` with no `PAUSE_ACK`, `classify_run_exit` stamps `completed` and fires a success notification, and `/autonomous-sdlc-harness:branch-resume` and the watcher's `resume_paused_runs` refuse to touch it. Then state why a pending task or `Monitor` is still no resumption mechanism:
  - the wake-up is observed behaviour of one CLI version, not a contract the flow relies on;
  - a session waiting silently gives the stall watchdog no output, so a silence longer than `STALL_KILL_SECS` (default 2700 s, `<scripts_dir>/autonomous-watcher.sh` → `STALL_KILL_SECS`) is exposed to a kill-and-resume;
  - the STOP and PAUSE checks do not run while the session sleeps.

  End on the existing conclusion that writing `PAUSE_ACK` and ending the session is the only durable way to survive an outage.
- [ ] Note that the watchdog's busy-CPU guard (`STALL_BUSY_CPU_PCT`) has not been measured on a silent session (BG8). Write it as one clause in the stall-watchdog reason above, with no inferred figure.

**Verification:**

- `grep -nE 'torn down when the turn ends|any pending\s*$|monitor dies with it' plugin/instructions/autonomous_pause_and_ledger.md` prints nothing.
- `grep -c 'A backoff is not a resumption mechanism, and neither is a \`Monitor\`.' plugin/instructions/autonomous_pause_and_ledger.md` prints `1`.
- Every CLI-behaviour sentence in the rewritten paragraph names `2.1.309` (or `2.1.308` for the run) or cites a BG row that does. Read the paragraph once for it.
- The cited ids ⊆ {BG1, BG5, BG6, BG7, BG8, BG9}: check `grep -oE 'BG[0-9]+' plugin/instructions/autonomous_pause_and_ledger.md`.
- No run branch name entered the plugin file: `grep -n 'feat_unattended_sandbox_preflight' plugin/instructions/autonomous_pause_and_ledger.md` prints nothing.
- No other section of the file changed: `git diff -- plugin/instructions/autonomous_pause_and_ledger.md` touches only that paragraph's lines.
