### 1. `docs/remote-execution.md`'s lead still says the real-job check is "not yet run", while the paragraph under it now records FR5, JS1 and JS4 passing

**File:** `docs/remote-execution.md`, the bullet whose bold lead is "**The check on a real GitHub job is a post-release follow-up, not yet run.**"

**Problem.** The story index's `## Scope register` row 52 puts this paragraph in scope, and Task 8 rewrote its closing sentence. That sentence used to read *"It is taken, still not yet run"*. It now records the results:

> the honest arm is FR5, in observation (xvi), **pass** (round 15, 2026-11-05); the payload arms are JS1 and JS4, in the round's step 7, JS1 **pass** (round 14, 2026-11-05) and JS4 **pass** with the documented residual (round 14, 2026-11-05); the stalled-watchdog arm is JS3, in step 8, the default-branch leg, **not run** in rounds 14 and 15 (F16, #273); and its negative arm JS3N is read from the source, not taken by a job.

The bold lead of the same bullet was left as it was, and it still says the check is *"not yet run"*. So the bullet now contradicts itself. A reader who scans the bold leads, which is how this document's bullets are read, comes away thinking the job-surface refusal has never been checked on a real GitHub job. Three of its four arms have run and passed on one.

**Proof:**
- `docs/sandbox-verification.md`, row FR5: *"pass (round 15, 2026-11-05)"*.
- Row JS1: *"pass (round 14, 2026-11-05)"*.
- Row JS4: *"pass, with the documented residual (round 14, 2026-11-05)"*.
- Row JS3: *"not run (rounds 14 and 15): F16, #273"*.
- A whole-tree `git grep -F "post-release follow-up"`, excluding `harness-runs/`, finds this line alone. No other file cites the lead, so it can be reworded.

**Fix:** in `docs/remote-execution.md`, replace

```
- **The check on a real GitHub job is a post-release follow-up, not yet run.**
```

with

```
- **The check on a real GitHub job is a post-release follow-up, taken in Gate 12's sandbox series round.**
```

Change nothing else in the bullet. The numbered steps and the closing sentence stay as they are. This is a prose-only edit to a `docs/` file, so it owes no test run.
