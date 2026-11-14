### Task 11 — State in `plan_review_rounds.md` that a round's gates are independent and run as one set

**Goal:** Give the shared round module the one rule the fan-out needs from every plan reviewer, stated once where all of them already read: never open another gate's round file of the round under review — under a fan-out it may still be being written — because a round's gates review the same revision as one set.

**Where this task stops.** This is the only plugin-agent-facing change of the branch, and it adds a prohibition, not a new read: no gate reads another gate's file of the same round today (verified for this plan against the plan-review modes of `plugin/agents/task-plan-reviewer.md`, `plugin/agents/architecture-reviewer.md` and `plugin/agents/business-parity-reviewer.md`), and `## Converging mode` item 4 reads the **previous** round's, through the revision note. No agent definition is edited. The module is read on every reviewer dispatch, so under `.claude/context/plugin.md` → `## Writing agent prose` (*"a change that adds no behaviour never raises its up-front word count"*) this task adds the one behaviour-bearing sentence and nothing else — no rationale paragraph and no restatement of the writer's listing order, which **Tasks 12 and 15** state in the cores, where no reviewer reads it. How a loop dispatches the set is those cores'.

### Targets

- `plugin/instructions/plan_review_rounds.md` → `## The round file`.

**Work:**

- [ ] `## The round file`: after its opening paragraph, add one sentence: a round's gates review the same plan revision as one set, dispatched together, so never open another gate's round file of the round under review — it may still be being written; `## Converging mode` item 4 reads only the previous round's.

**Verification:**

- `grep -n "one set" plugin/instructions/plan_review_rounds.md` shows the one new sentence under `## The round file`.
- `git diff --numstat plugin/instructions/plan_review_rounds.md` shows one or two added lines and none removed; no heading changed, so `## Who may cite this`'s roster needs no edit.
