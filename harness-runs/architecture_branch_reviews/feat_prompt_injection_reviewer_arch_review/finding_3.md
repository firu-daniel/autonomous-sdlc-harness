### 3. `branch-start-docs-autonomous.md` restates rules the screen step owns

**Severity:** Must Fix

**Site:** `plugin/commands/branch-start-docs-autonomous.md`, in its list of what this engine does not have:

- the **No flow-progress ledger.** bullet, in the clause this branch added: *"and the prompt-injection screen keeps no record here: it re-screens the checklist at every launch."*
- the **No clarification channel.** bullet, in the sentences this branch added, from *"The prompt-injection screen's `UNSAFE` stop and its fail-closed halt are the one exception: each writes its park file in the clarification-channel format, which the watcher classifies as `parked` for every engine, …"* through *"They park rather than log because a log line would end the run with nothing a person could act on."*

**Problem.** `plugin/instructions/prompt_injection_screen.md` declares itself *"the one statement of when and how an engine runs the screen"* (heading: *"(canonical, single source of truth)"*). It owns both of the rules above:

- `## The steps` step 5: *"The docs engine records nothing. It has no ledger, and its own checkbox flips change the checklist's bytes, so it re-screens the checklist at every launch."*
- `## The steps` step 0: *"This holds in the docs engine too, whose own missing-input route only logs a blocker: a screen halt that only logged would end the run with nothing a person could act on."*

Its roster rule says *"A citer **points and never restates**"*. `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` says *"A policy file is activated by pointer and never restated … a citer that paraphrases it becomes a second owner. The same rule governs every shared module here."* The lessons ledger (`harness-runs/lessons.md` → `## Agent prose`) has the same force: *"State a new behaviour once, in the section that decides it, and cite it from everywhere else."*

The command now carries a second copy of the module's docs-engine behaviour, including the reason for it and the downstream surfaces it reaches. If the module changes, this copy will drift from it. The command does need to stop saying it *"never parks"* without qualification. But a pointer to the owning section is enough to make that exception visible.

**Fix.** In `plugin/commands/branch-start-docs-autonomous.md`:

1. In the **No flow-progress ledger.** bullet, replace the added clause with a pointer: *"…**are** the resume ledger (see the orchestration file); the prompt-injection screen keeps none here either (`${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## The steps` step 5)."*
2. In the **No clarification channel.** bullet, replace everything after *"it never parks to ask a human."* with one pointer sentence: *"The one exception is the prompt-injection screen, which parks on `UNSAFE` and on a fail-closed halt (`${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## The steps` steps 0 and 6)."* Remove the *"which the watcher classifies …"* clause and the *"They park rather than log because …"* sentence.

Leave the **Prompt-injection screen — after step 4 and before step 5.** paragraph unchanged. It is the activating pointer and states only where the step runs.
