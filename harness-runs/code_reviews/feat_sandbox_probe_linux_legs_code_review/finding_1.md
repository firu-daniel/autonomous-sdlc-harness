### 1. BG9's worker lasts 20 s, so a session that runs on for 19 s or more after the start call can never grade BG9

**File:** `scripts/lib/sandbox-probe/legs-detached.sh` (`SP_BG9_SECONDS`), "SP_BG9_SECONDS=20"

**Severity:** Should Fix. **Layer:** general.

The detached worker runs `SP_BG9_SECONDS` iterations, each a `touch` of `sbx_bg9.beat` and a `sleep 1`. So its last beat lands about `SP_BG9_SECONDS - 1` seconds after the start call, which is the session's first Bash call. `sp__bg9_grade` passes BG9 only when that beat is later than the session's end (`[ "$fin" = 1 ] && [ "$last" -gt "$end" ]`). It fails BG9 only when no done marker was written and the beat is at or before the end plus one second.

After the start call, the session still has to:

- take one model turn to issue the control `dd` and read its result;
- take a final model turn;
- exit the agent CLI.

`end` is taken only after `sp_session` returns. If those steps take 19 s or more, the worker finishes before the session ends. That gives `fin=1` with `last <= end`, which matches neither the pass branch nor the fail branch, so BG9 prints `not run` ("neither outlived nor died with the session"). The question the leg exists for, whether a `nohup … & disown` process outlives the session, then goes unanswered. The same thing happens if the sandbox kills the worker at the session's end: it had already finished, so the run cannot tell the two cases apart.

The sibling bound in this branch is sized for this. `legs-loopback.sh` → `LB5'S BOUND` sets `SP_LB5_SECONDS=60` because *"the bound covers a session of up to about 40 s"*. BG9 has no such margin, and neither its header nor its task plan argues why 20 s is enough. A Linux run is a hand-run container gate, so a structural `not run` costs a full repeat.

WF5 is unaffected: it reads iterations 2 and 5 only.

**Fix.** In `scripts/lib/sandbox-probe/legs-detached.sh`:

- [ ] Change `SP_BG9_SECONDS=20` to `SP_BG9_SECONDS=60`. The outside poll is already bounded by `SP_BG9_SECONDS + 10`, so it now waits at most 70 s after the session.
- [ ] In the header, right after the line `# The probe polls from outside for sbx_bg9.done for at most SP_BG9_SECONDS + 10 seconds after the session.`, add:

  ```
  # SP_BG9_SECONDS is 60, LB5's bound: BG9 can pass only when the session ends within about 59 s of the
  # start call, and a longer session reads `not run`, never `pass` or `fail`.
  ```

No suite reads `SP_BG9_SECONDS`. `cli/test/sandbox-probe-detached-loopback-legs.test.mjs` passes the session end, last beat and done values to `sp__bg9_grade` explicitly. The fix edits no test file, so it runs no test. The type check (`commands.typecheck`) parses the shell, and the full suite runs in the Run gates phase.
