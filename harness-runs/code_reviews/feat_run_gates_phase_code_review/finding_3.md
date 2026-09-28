### 3. Three test-run-rule paraphrases forbid every test run, contradicting the rule's own-test-file allowance

**Severity:** Should Fix

**Site anchors**

- `plugin/agents/task-plan-writer.md` → `## Process`, the per-task file bullet (b) listing *"a **`**Verification:**`** bullet list (what to test and how — never a test run, per `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`)"*.
- `plugin/agents/branch-reviewer.md`: the standalone line *"A finding's fix suggestion asks for no test run, per `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`."*, directly after the paragraph opening **"Every finding must be implementable as written"**.
- `plugin/agents/skeptic-reviewer.md`: the identical line, directly after the same paragraph.
- `plugin/agents/user-review-fix-plan-writer.md` → the **Per-finding files** paragraph: *"the concrete fix suggestion (often the exact code snippet or precise rename), which names no test run, per …"*

**Problem**

`plugin/instructions/unit_loop_core.md` → `## The test-run rule` is the rule's single owner, and its roster requires every citer to *"point and never restate"*. Its point 4 says:

> *"No plan asks for a test run. A `**Verification:**` bullet, a finding's fix and a sub-step never name `<test_cmd>`, a gate script, or a test file the unit neither creates nor edits. Naming the unit's own new or edited test file is allowed, conditioned on (3)."*

The four sites above restate that rule as a blanket ban: *"never a test run"*, *"asks for no test run"*, *"names no test run"*. The restatement has already drifted. It drops the rule's one allowance, so a writer following its own file cannot plan the rule's permitted verification of a test file the unit creates or edits.

These writers' and reviewers' own quality-check and Must Fix bullets elsewhere on this branch do state the allowance correctly. For example, task-plan-reviewer says *"A bullet running the task's own new or edited test file is not a finding"*. So the same agent reads two different versions of the rule.

**Fix**

Make each site scope the ban to what the rule forbids, by pointer, without restating the forbidden classes.

- [ ] `task-plan-writer.md`: replace *"(what to test and how — never a test run, per `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`)"* with *"(what to test and how — never a test run that `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` forbids)"*.
- [ ] `branch-reviewer.md` and `skeptic-reviewer.md`: replace the line with *"A finding's fix suggestion asks for no test run that `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` forbids."*
- [ ] `user-review-fix-plan-writer.md`: replace *"which names no test run, per `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`"* with *"which names no test run that `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` forbids"*.
- [ ] Re-run `grep -rn "no test run\|never a test run" plugin`. Every remaining hit must carry the "that … forbids" scoping or sit inside `unit_loop_core.md` itself.
