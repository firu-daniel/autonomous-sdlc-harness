# Architecture review — iteration 0

## Must Fix

1. **The exec-form decision of record and its measured findings start in `plugin/hooks/README.md`, and `docs/development.md` is only allowed to copy them.** Offending files: `task_1_plan.md` (Work → the "Establish the exec-form question before writing the reason" sub-step, and the README bullet's third sub-item "why shell form was kept over exec form, stating what the previous sub-step established and what it could not settle") and `task_2_plan.md` (Work → the §3 bullet's third sub-item "Source that reasoning **only** from the durable bullet Task 1 wrote in `plugin/hooks/README.md` … do not invent a finding about exec form that the README text does not carry"). Rule violated: `.claude/context/conventions.md` → `### Where a new responsibility goes`, the row "a measured fact or a decision of record | `docs/`, and nowhere else", and the sentence below that table: "A responsibility that already has a home does not get a second one."

   The plan makes the `plugin` layer the owner of this fact. Task 1 establishes, from the installed CLI, how exec form handles stdin, whether the exit and output contract still holds, which Claude Code versions accept exec form, and what it could not settle. It writes those findings and the resulting decision into the plugin README. Task 2 (`general`, the layer that owns `docs/`) is not allowed to establish the exec-form question itself. It may only restate the README. That makes the README the only real home of a decision of record, and the `docs/development.md` §3 copy becomes a derived copy. The README's own `## Registration, and why it lives here rather than in generated settings` section describes the reverse arrangement: its facts are "recorded alongside the rest of the packaging contract in `docs/development.md` §3", and its bullets are short copies of what §3 owns. The story index calls the two sites "one fact in two copies". The plan still has the copy lead and the owner follow.

   **Fix:**
   - In `task_2_plan.md`: move the "Establish the exec-form question" work into Task 2's validator probe step or into a separate Work bullet. That covers reading `claude --version`, `claude plugin validate --help`, the warning text and the shipped hooks documentation for stdin, the exit and output contract, and version acceptance. Replace the §3 sub-item "Source that reasoning **only** from the durable bullet Task 1 wrote…" with: record the chosen form, why shell form was kept over exec form, and what this task established and could not settle about exec form. Task 2 is now the source of all of it.
   - In `task_1_plan.md`: remove the exec-form establishment sub-step. The README bullet's third sub-item then covers only the short rule-level reason already stated in the story `## Context` (shell form changes only word boundaries, works whether the runtime or the shell expands the token, and needs no field beyond `matcher` / `type` / `command`). It also points to `docs/development.md` → `## 3. Manifest facts a contributor must not rediscover` for the exec-form findings and the measured message, the way the section's opening sentence already does.
   - In the story index `## Context` (the sentence "Task 1 still establishes, from the installed CLI and its documentation, what exec form would change…"): update it to name Task 2. Also change Task 2's Verification byte-identity check so it covers the quoted **form** across all three files, not reasoning copied from the README.

## Should Fix

None.

## Nice to Have

None.
