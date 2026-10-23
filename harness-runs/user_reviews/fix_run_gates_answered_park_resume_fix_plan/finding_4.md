### 4. **The Phase G answer lookup.** is nearly duplicated in both implementation forks and is mostly rationale

**Files:**
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` (`## Mode contract — bindings`: the `<park_answer_lookup>` row, and the paragraph opening `**The Phase G answer lookup.**` under ``### `<escalate>` — the clarification reroute``)
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` (`## Mode contract — bindings`: the `<park_answer_lookup>` row, and the paragraph opening `**The Phase G answer lookup.**` under ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute``)

**Problem.** Both forks carry a roughly 140-word **The Phase G answer lookup.** paragraph that differs between them by about one clause. Most of it is not something the orchestrator acts on:

- "The row searches `answered/` too because the committed index's `Park answer consumed:` line records consumption, not where the pair sits, and the watcher archives every pair present at launch …". This explains why. The lookup command itself already searches both directories, and the archive behaviour belongs to the clarification channel's Consume-then-archive bullet (finding 3 keeps the fact there).
- "the orchestrator passes the paths on and never opens the files". The core's `### G.2` owns this.
- In the task fork, "in the format … `## Clarification channel — file format (canonical, single source of truth)` owns". The headless bullet just above it already cites the canonical format.

Each `<park_answer_lookup>` row also points to the paragraph for "Why both directories". After the trim, that pointer refers to text that no longer exists.

Facts the paragraph must keep, because the orchestrator acts on them or a test checks them:
- the three origin strings, since case (c) of `cli/test/run-gates-park-answer.test.mjs` needs `Phase G test-fix-plan-writer` inside the task fork's ``### `<escalate>` — the clarification reroute``;
- which parks name the index (the `<test_fix_plan_path>` the row greps for), cited to the core's anchor;
- the manual / interactive edge case: no files, so the lookup finds nothing.

The two forks may not cite each other (`.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`, and rule (2)), so each keeps its own copy, worded identically except for the word "cited".

**Fix.**

- [ ] In `plan_orchestration_instructions_autonomous.md`, replace the whole **The Phase G answer lookup.** paragraph with:
  `**The Phase G answer lookup.** A Phase G park's question file names an origin that opens `Phase G` — `Phase G gates`, `Phase G test-fix-plan-writer` or `Phase G architecture-reviewer gate` — and, for the parks `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` → **Which Phase G answers G.0 consumes.** names, the index's repo-relative `<test_fix_plan_path>`, the string the `<park_answer_lookup>` row greps for. The **manual / interactive** entry point writes no files, so the lookup finds nothing there and G.0 behaves as it does with no park.`
- [ ] In `user_review_fixes_instructions_autonomous.md`, replace its **The Phase G answer lookup.** paragraph with the same text, writing `the cited ${CLAUDE_PLUGIN_ROOT}/…` (in backticks as above) for the core path, which is how this fork cites the core everywhere else.
- [ ] In both forks' `<park_answer_lookup>` row, replace `Why both directories, and which park's file names the index: **The Phase G answer lookup.**` with `Which park's file names the index: **The Phase G answer lookup.**`. Leave the rest of the row as it is. The `grep -rlF --include='question_*.md' '<test_fix_plan_path>' <state_dir>/clarifications/<branch>/` command is checked byte-for-byte by test case (d), and "it searches the branch's directory and its `answered/` archive in one pass" is the fact the row states.
- [ ] Keep byte-identical: the `**The Phase G answer lookup.**` lead, which both rows and the review fork's headless bullet cite, and the anchor `→ **Which Phase G answers G.0 consumes.**`.
