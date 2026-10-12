### Task 20 — Correct the unlisted-call statements in the plan and task-plan instruction cores and forks

**Goal:** The plan-orchestration and task-plan-writing cores and their autonomous forks justify their commit and command rules by saying the forbidden form *"stalls a headless run"*. Under the `dontAsk` mode the generated profile now ships, that form is **refused at once**. Rewrite each consequence clause minimally. The rule it supports stays byte-for-byte apart from that clause. These are scope register rows 115–118.

**Depends on:**

- Task 15 — the default mode and the story's canonical restatement. State the default only, and do not add the `acceptEdits` override clause.
- Task 8 — it edits `plan_orchestration_instructions_autonomous.md` (Override E's push line) and `task_plan_writing_instructions_autonomous.md` (Overrides 3–4's push lines, its `## Resolved values`) first. This task edits none of the lines Task 8 wrote.

**Where this task stops.** The review-fix forks, the docs fork and the three commands are **Task 21's**. A core and its fork each state their own sentence (`.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`), so each is edited in its own file, with no new cross-citation.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md` — 40, 99, 119, 145, 199.
- `plugin/instructions/plan_orchestration_instructions_core.md` — 120, 430.
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` — 93, 132, 159.
- `plugin/instructions/task_plan_writing_instructions_core.md` — 129.

**Work:**

- [ ] `plan_orchestration_instructions_autonomous.md`:
  - 40 *"a raw type-checker, test-runner or package-manager invocation stalls or trips the protected-branch commit guard headless"* → is refused or trips …;
  - 99 *"`Bash(git push:*)` **`ask`** entry, which is evaluated before any `allow` and which an unattended run cannot answer"* → and which an unattended run's mode refuses;
  - 119 *"is what stalls a headless run on the `Bash(git commit:*)` branch-guard"* → is what the branch guard's `ask` gets refused on;
  - 145 *"the run **stalls on a permission prompt it cannot answer headlessly**"* → the command is refused;
  - 199 *"so a bare `rm` stalls rather than being refused"* → is refused.
- [ ] `plan_orchestration_instructions_core.md`:
  - 120 *"falls through to the permission profile — where an unattended run **stalls** on a prompt it cannot answer"* → where an unattended run refuses it;
  - 430 *"is refused or falls through to a prompt whatever the allow list says … so in an unattended run the literal spelling does not merely read wrong, it stalls the phase"* → it is refused and the phase loses that step.
- [ ] `task_plan_writing_instructions_autonomous.md`: 93 and 132, the same branch-guard sentence as above; 159 *"the run **stalls on a permission prompt it cannot answer headlessly**"*.
- [ ] `task_plan_writing_instructions_core.md` 129: the same sentence as the plan core's 120.

  Wherever a sentence continues *"— the commit silently does not land"*, keep *does not land*. Replace *silently* with a clause saying the refusal is the only sign.

**Verification:**

- Re-run derivation entry G's two commands with `-n` in place of `-l` and the four targets as the pathspec. Every remaining hit must be a sentence this file does not list, and must meet none of entry G's `change` criteria. Expect none.
- Task 8's lines are untouched: `git grep -n -F '<MAIN_REPO>/<scripts_dir>/push-branch.sh' -- plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/task_plan_writing_instructions_autonomous.md` hits the same lines before and after this task.
- Code blocks are byte-identical: `git diff` shows changes only in prose lines.
