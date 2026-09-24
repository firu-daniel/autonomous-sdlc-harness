### 1. A saved walk at the UI writer's first dispatch is used with the story index deleted, so a printed-again `ledger: P1` marks a plan that does not exist as converged

**File:** `plugin/instructions/task_plan_writing_instructions_core.md` → `## The walker — routing is its, judgement is yours` → the paragraph after the **Continuing a saved walk.** bullets, the sentence beginning "A saved walk is **unusable**, whatever `current` printed, when the artifact its pending action works on is absent"

**The problem.** The sentence states a general rule: a saved walk is unusable "when the artifact its pending action works on is absent". It then lists those artifacts:

> the story index, for `business_parity_review`, `architecture_review`, `plan_review` and a `plan_writer` whose `prompt:` is `revision`; the UI-test index, for `ui_review` and a `ui_writer` whose `prompt:` is `revision`; and the `arg.findings_file` of any revision.

A `ui_writer` whose `prompt:` is `initial` has no entry, so no existence check applies to it. That dispatch works on the story index. Its block in `## UI-test-plan write loop` → `### 1. Spawn `ui-tests-plan-writer`` → "First iteration prompt" reads:

> `Inputs: task prompt <state_dir>/task_prompts/<branch>_task_prompt.md, story index <state_dir>/story_plans/<branch>_story_plan.md, per-task files <state_dir>/task_plans/<branch>/`

**Why it is reachable.** This is the case the task prompt's `## Establish, do not assume` names: *"an operator deleted the draft plan by hand, but the state is still past `plan_writer`"*. The story index claims it is covered: *"That catches a draft deleted by hand after the walk had moved past `plan_writer`."*

The walker gives exactly this pending action at the step past the task-plan loop. `plan_review` → `PASS` carries `"ledger": "P1"` and routes to `ui_writer`, and `follow_edge` → `arrive` → `render_dispatch` prints:

```
action: dispatch
node: ui_writer
agent: ui-tests-plan-writer
prompt: initial
ledger: P1
heartbeat: …
```

`cli/test/flow-walker-resume.test.mjs` → case `(3)` pins that output: `uiWriter(0, undefined, [['ledger', 'P1']])`. The failing sequence:

1. The last session ended after the walker printed that action but before the fork flipped `P1`. The branch handles this window on purpose.
2. The operator then deletes `<state_dir>/story_plans/<branch>_story_plan.md` by hand.
3. On re-entry, `current` prints the action above. The core's unusable test checks nothing for a `ui_writer` `initial`, so the walk is usable.
4. The autonomous fork's `## Override 2 — resumability` → **Saved walk first.** third bullet applies: `P1` is `[ ]`, the node is `ui_writer`, and the action carries `ledger: P1`. So it says: *"re-apply it as Override 5 states, then continue."* The fork flips `P1` to `[x]` and commits and pushes the ledger, even though no story index exists.
5. The UI writer is dispatched without its input.

On every later re-entry, the ledger says the task-plan loop converged. Override 2(b) (*"`P1` is `[x]` … Skip the task-plan write loop"*) is taken ahead of (c) (*"No story index exists"*), so the plan is never rewritten. The durable record, which the task prompt requires to stay the only one, now reports a plan that does not exist. Implementation proceeds on it.

Before this branch, the same state (`P1` `[ ]`, no story index) reached case (c) and ran fresh.

**Fix.** In that sentence, add `ui_writer` on its `initial` prompt to the story-index list. Replace:

> the story index, for `business_parity_review`, `architecture_review`, `plan_review` and a `plan_writer` whose `prompt:` is `revision`;

with:

> the story index, for `business_parity_review`, `architecture_review`, `plan_review`, a `plan_writer` whose `prompt:` is `revision` and a `ui_writer` whose `prompt:` is `initial`;

Leave the rest of the sentence unchanged, including the UI-test-index clause and the `arg.findings_file` clause, and leave the rest of the paragraph unchanged too.

With this change, step 3 above finds the walk unusable. The core treats it "exactly as exit 1". The fork then falls through to (a), (b), (d) and (c) with `P1` `[ ]` and no story index. That reaches (c), and the loop runs fresh. The `ledger: P1` line is never re-applied, because the **Saved walk first.** bullets only run on a walk the core would continue.

No other file needs to change:
- `docs/flow-graph-walker.md` → `### Item 3a` states only the general rule ("the artifact its pending action works on").
- The autonomous fork applies the core's test by reference.
- No test asserts the list.
