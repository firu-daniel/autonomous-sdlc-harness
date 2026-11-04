### 2. FR7's architecture-gate clause cannot be reached by the planning park observation (xvi) drops

**File:** `docs/sandbox-verification.md` (`## 10. …`, row FR7): "the architecture gate still passes on the index's quoted failure lines". Also `docs/development.md` (**(xvi) The full-run leg…** → the **FR7** bullet, and **The drop.**): "so the task-plan writer parks".

**The problem.** FR7 has two clauses:

1. The answered park resumes in answer mode.
2. "if the round's `test_run_logs/…log` is not in the restored bundle, the architecture gate still passes on the index's quoted failure lines rather than returning a blocker".

Clause 2 belongs only to a run-gates (test-fix) park. In `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round`, the **Pending an answer** arm is "an answered `fixable: 0` park. Resume at **G.2 for this round, in answer mode**" and binds `<log>` to `<state_dir>/test_run_logs/…/<gate_key>_round_<gate_round>.log`. The stand-in rule appears only in `plugin/agents/architecture-reviewer.md` → `## Invocation contract`, row `prompt_path`, case (c), the test log: "if unreadable while `story_path` carries a `Park answer consumed:` line, its quoted failure lines stand in, no blocker".

Observation (xvi) parks differently. **The drop.** has the maintainer drop "a small task that leaves one decision undecided — a limit it names without setting — so the task-plan writer parks". That is a planning park. It has no gate round, no `test_run_logs` log and no test-fix index, and the architecture reviewer's case (c) never runs on it.

So clause 2 of FR7 is never exercised by the leg the row says takes it. Under the round's own **Reading a result.** rules, a row graded on a step that did not run is `not run`, never a pass. Yet nothing in either document tells the maintainer that this clause will not be reached. A maintainer would grade FR7 as a pass after a planning park.

**Fix.** Make the record say plainly which half the full-run leg takes. Do not change the round's steps here; whether to add a leg that forces a test-fix park is a separate question, returned with this review.

1. In `docs/sandbox-verification.md` §10, row FR7, **Expected** cell, append:

   ```
   The full-run leg's park is a planning park, which reaches neither a gate round nor the architecture gate's test-log case, so the second clause is recorded `not run` unless the run also parks at run gates with `fixable: 0` and is answered (`plugin/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round`; `plugin/agents/architecture-reviewer.md` → `## Invocation contract`, `prompt_path` (c)).
   ```

2. In `docs/development.md` (xvi), at the end of the **FR7** bullet (after "logs `wrote answer_<n>.md for <branch>`."), append the same sentence.

These are documentation edits only, so no test runs for this fix.
