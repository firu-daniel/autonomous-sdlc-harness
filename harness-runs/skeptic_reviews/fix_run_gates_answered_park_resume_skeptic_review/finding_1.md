### 1. In a GitHub Actions answer resume, the answer-mode architecture gate gets a log path that does not exist and returns `blocker:`

**Site anchor (fix target):** `plugin/agents/architecture-reviewer.md` → the `## Invocation contract` key table, the `prompt_path` row: "Where the caller supplies one: the original prompt under".

**Where the defect starts:**
- `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` → step 4, the **Pending an answer** arm: "Bind `<log>` to the path the wrapper writes for this round's label".
- `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.2 Write and review the test fix plan` → **The architecture gate.**, whose dispatch block passes `prompt_path: <log>`.

**Problem.** G.0's new pending-answer arm binds `<log>` to `<state_dir>/test_run_logs/<sanitized branch>/<gate_key>_round_<gate_round>.log` and never checks that the file exists. Answer mode then dispatches `test-fix-plan-writer` and, when the answer converts an entry into a fix, the architecture gate with `prompt_path: <log>`.

That log is machine-local and gitignored (`.gitignore`: `harness-runs/test_run_logs/*`). A remote run never carries it from one job to the next. `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_remote_bundle_write` builds the `harness-state` bundle from five sources and nothing else:
- `remote_status.json`;
- `clarifications/<branch>`;
- the pause file;
- the walker state;
- the `autonomous_logs/<branch>.log` run log.

It then adds the planning drafts `hr_remote_planning_paths` lists: `story_plans/…`, `task_plans/…`, `ui_test_plans/…`, and the `task_plan_reviews/`, `business_parity_reviews/`, `architecture_reviews/` and `ui_test_plan_reviews/` folders. `test_run_logs/` is not among them.

The autonomous fork runs on GitHub Actions: `plan_orchestration_instructions_autonomous.md` → `## Override K — remote-job QA skip (autonomous fork only)` exists for that case. An answer resume there is `remote-run.sh restore <branch> --resume answer`, which restores the clarifications and writes `answer_<n>.md`. The committed and pushed round index comes with the job's checkout. So G.0 finds the park pending, takes the new arm and binds `<log>` to a path with no file behind it.

The branch planned for this, but only on the planner's side. `plugin/agents/test-fix-plan-writer.md` → `## Read on demand (no auto-loaded context)` → **A cited path you cannot read is a finding, not a fallback.** gained: *"In answer mode only, an unreadable `<log_path>` is instead noted in `## Context`; the index's quoted failure lines stand in for it."* So the planner goes on and converts the authorised entry. The architecture reviewer, which reads the same log, got no matching exception:
- its sub-case (c) reads "plus the log at `prompt_path`";
- its rule says: *"If a conventions document, the ledger or any file your dispatch names cannot be read, return a `blocker:` line naming the path and the refusal **in place of** the verdict line."*

**Runtime symptom.** In a remote answer resume where the answer authorises a fix (the case the branch was built for: the observed answer chose "change both tests in this branch"), the gate returns `blocker:` instead of a verdict. G.2 parses only `verdict: PASS` / `verdict: FAIL`, so the round halts or parks before G.3 commits the revision. The committed index still has no marker, so every later resume reaches the same G.0 arm and the same blocker. The watcher's park-loop guard eventually holds the run. The answer is never acted on, and the gates are never re-run on the fixes.

A local run reuses the same run copy, where the log survives, so this does not happen there. That is why no local trace shows it.

**Fix.** Give the architecture reviewer the same answer-mode exception the planner already has, in its `prompt_path` row. The edit must not raise the definition's word count (`.claude/context/plugin.md` → `## Writing agent prose`: *"A change to an agent definition never raises its up-front word count"*). In `plugin/agents/architecture-reviewer.md`, replace the whole `prompt_path` table row:

```
| `prompt_path` | Where the caller supplies one: the original prompt under `<state_dir>/task_prompts/` in (a), the active user-review file under `<state_dir>/user_reviews/` in (b), and in (c) the machine-local test log the plan was written from, read as the requirement. |
```

with:

```
| `prompt_path` | Requirement, if supplied: (a) original prompt under `<state_dir>/task_prompts/`; (b) active user-review file under `<state_dir>/user_reviews/`; (c) test log — if unreadable while `story_path` carries a `Park answer consumed:` line, its quoted failure lines stand in, no blocker. |
```

Both rows are 40 words. Change nothing else in the file. Then confirm with `wc -w plugin/agents/architecture-reviewer.md` that the count is no higher than 4095, its value before the edit.

The marker is a reliable answer-mode signal for the reviewer. Only `test-fix-plan-writer` writes `Park answer consumed:`, and only under the clause (`## Process` step 7). Its `## Quality checks before returning` requires the line in answer mode, so every answer-mode index the gate reviews carries it, and no other index does.

- [ ] Replace the row as above.
- [ ] Run `wc -w` on the file and confirm the count is no higher than 4095.
