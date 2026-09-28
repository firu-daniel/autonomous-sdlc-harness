# Architecture review — iteration 0

## Must Fix

1. **`architecture-reviewer` gains two Must Fix checks whose rule source is not in its `## Read first` list, and its `## Scope boundary` still says only architecture violations are Must Fix.** The problem is in `task_8_plan.md`. Rule source: `.claude/context/plugin.md` → `## The sections an asset carries`, the `## Read first` bullet: *"`## Read first` is where an agent names the input it must load before acting, and states that an unreadable one is reported rather than worked around"*.
   Task 8 adds two new Must Fix raises to `plugin/agents/architecture-reviewer.md`:
   - the **No plan asks for a test run** check under `## What to check (the architecture checks)`;
   - the sub-case (c) raise on a quoted checkout-root or home-directory path.

   The task justifies the first one by saying its source, `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, *"satisfies 'Never flag something no rule-source file says.'"* That claim does not hold against the file as it stands. `## Process` step 1 says *"Read the rule-source files above"*, and "above" is the `## Read first` list. That list is the conventions documents, `<docs_root>`, the search tool and `<state_dir>/lessons.md`. `unit_loop_core.md` is not on it, and Task 8's **Work** does not add it. The machine-path raise has no rule-source file at all. The prompt (`prompt_path`) and `lessons.md` do not state it. `.claude/context/conventions.md` → `## The testing bar` states the self-containment gate, but that is this repository's rule, not a rule the adopter-agnostic agent can cite.

   The agent's own `## Scope boundary` also ends with *"**Only architecture violations are Must Fix.**"* Task 8 leaves that sentence unchanged. After the task lands, the agent would therefore contradict itself about what may block.
   **Fix:** In `task_8_plan.md` → **Work**, add a bullet with three edits:
   - Add `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` to `## Read first`, as a rule source, under the existing unreadable-path → `blocker:` rule.
   - Give the sub-case (c) machine-path raise a citable source. Either point it at the test fix plan writer's contract, which Task 7 defines, and add that file to `## Read first` for sub-case (c), or have Task 5 state it inside `## The test-run rule`'s neighbourhood and point at that.
   - Amend `## Scope boundary`'s closing sentence so the test-run and machine-path checks are named as Must Fix alongside architecture violations. Parity and styling issues stay Should Fix.

   Add matching **Verification** bullets:
   - `grep -n "unit_loop_core.md" plugin/agents/architecture-reviewer.md` shows a hit inside `## Read first`.
   - `grep -n "Only architecture violations are Must Fix" plugin/agents/architecture-reviewer.md` prints nothing, or prints the amended sentence.

2. **`business-parity-reviewer` gains a Must Fix check whose rule source is not in its `## Read first` list, and its `## Scope boundary` still says only parity violations are Must Fix.** The problem is in `task_16_plan.md`, the `business-parity-reviewer.md` work bullet. Rule source: `.claude/context/plugin.md` → `## The sections an asset carries`, the `## Read first` bullet.
   Task 16 adds a test-run check to `## What to check (the parity checks)` and makes it a **Must Fix** in plan-review mode. That section opens with *"**Never flag something no rule source says.**"* `## Process` step 1 reads the rule sources from `## Read first`, which lists the conventions documents, `<reference_impl>`, `<docs_root>` and the search tool. `unit_loop_core.md` is not on it. The agent's `## Scope boundary` ends with *"**Only parity violations are Must Fix.**"* As planned, the new bullet is either barred by the agent's own scope rule or ungrounded by its own source rule.
   **Fix:** In `task_16_plan.md` → the `business-parity-reviewer.md` bullet, add two edits:
   - Add `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` to `## Read first`.
   - Amend `## Scope boundary`'s closing sentence so a test-run request is named as a Must Fix beside parity violations.

   Add a **Verification** bullet: `grep -n "Only parity violations are Must Fix" plugin/agents/business-parity-reviewer.md` prints nothing, or prints the amended sentence, and `unit_loop_core.md` appears inside `## Read first`.

## Should Fix

1. **`task_1_plan.md`: the `OuterLoopScript.agentInvocable` doc comment in `cli/src/generators/outerLoopScripts.ts` goes stale.** That doc comment lists the `true` rows. The list is *"the git wrappers …, the scratch runner … and the flow walker the orchestrating session steps a flow with"*. The module header's opening line also enumerates the set. Task 1 adds a fourth kind of `true` row, `run-test-suite.sh`, but plans only the row and its inline comment. `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit."* Add a Work bullet to name the test-suite runner in both enumerations, and a grep in **Verification**.

2. **`task_9_plan.md` → G.3: the test fix plan's commit reuses the fixed subject `chore: add code review for <branch>`.** This is a commit-policy point, not an architecture one, and it follows the E.2 and C2.3 precedent. Noted only so that the owner of the commit policy (`.claude/context/conventions.md` → `## Commit-message policy`) decides it knowingly. A later reader of the history will see a "code review" commit that is actually a test fix plan.

## Nice to Have

- None.
