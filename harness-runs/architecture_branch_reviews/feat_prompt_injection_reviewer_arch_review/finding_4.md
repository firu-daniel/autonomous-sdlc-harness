### 4. `branch-start-user-review-fix-autonomous.md` restates the screen's placement rationale

**Severity:** Should Fix

**Site:** `plugin/commands/branch-start-user-review-fix-autonomous.md`, the paragraph **Prompt-injection screen — after step 4 and before step 5.**, at its last sentence: *"It runs ahead of step 5 because an edited screened file is a modified tracked file, which the screen commits once it passes and which step 5 would otherwise halt on."*

**Problem.** This sentence repeats the reason that `plugin/instructions/prompt_injection_screen.md` → `## Where and when it runs` already gives for the user-review engine: *"after it confirms a review file exists and **before its tree-state precondition** (step 5), so that an edit to a committed screened file reaches the screen, and is committed by step 4 below, rather than halting the engine as a modified tracked file"*. The module's roster rule (*"A citer **points and never restates**"*) and `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` (*"The same rule governs every shared module here"*) make that a second statement of a rule the module owns.

This is graded Should Fix rather than Must Fix for two reasons. The sentence explains where this command's own step sits. And the sentence the branch added to step 5 (*"By the time this step runs, …"*) describes step 5's own behaviour, which is the command's to state.

**Fix.** In that paragraph, replace the sentence *"It runs ahead of step 5 because …"* with a pointer: *"Why it runs ahead of step 5: `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## Where and when it runs`."* Leave the rest of the paragraph and step 5 unchanged.
