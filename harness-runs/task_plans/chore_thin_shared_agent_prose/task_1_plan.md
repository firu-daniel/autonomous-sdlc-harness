### Task 1 — Thin `## The test-run rule` in `unit_loop_core.md`, keeping every rule and the citer roster

**Goal:** Shorten the one shared instruction section that agents from six families read on every dispatch — `plugin/instructions/unit_loop_core.md` → `## The test-run rule` — to direct rules stated once, with every rule an agent or an orchestrator acts on still present.

**Why this section and no other.** The story index `## Context` records the settlement: of the shared instruction and sample files the task prompt lists, this is the only section that agents from more than one family read (11 agents: `architecture-reviewer`, `business-parity-reviewer`, `branch-reviewer`, `review-plan-reviewer`, `skeptic-reviewer`, `layer-implementer`, `layer-reviewer`, `task-plan-writer`, `task-plan-reviewer`, `test-fix-plan-writer`, `user-review-fix-plan-writer`). The orchestration cores also read it (`plan_orchestration_instructions_core.md` → `## Phase G — Run gates` runs the suite it reserves), so no rule may go.

**Where this task stops.** This task edits only the six numbered points of that section. It does **not** touch the heading, the `**Who may cite this.**` roster, the closing paragraph under the roster, or any other section of `unit_loop_core.md`; and it edits no agent definition — the agents that cite this heading point at it and restate none of it, so nothing on their side changes.

### Targets

- `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1–6.

**Work:**

- [ ] Replace points 1–6 (from the line beginning `1. **No unit runs` through the end of point 6, which ends `and its return ends its dispatch, not the session.`) with exactly the text below. Leave the blank line and `**Who may cite this.**` that follow it untouched.

```markdown
1. **No unit runs `<test_cmd>`, a gate script it runs, or a test file the unit did not create or edit — except a row `G.4` unit, which may run the test file(s) its finding names, through `<test_file_cmd>` only.** The full suite and the whole-tree `<typecheck_cmd>` run once per Run gates round, through its wrapper, at `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates`; the suite runs nowhere else in the flow. A targeted test the unit did not write is excluded too. The row-`G.4` exception covers **only** that row and **only** the file(s) the finding names — never `<test_cmd>`, a gate script or any other test file.
2. **A unit runs `<typecheck_cmd>`** as written, with no path argument: the whole tree. Where `commands.typecheck` is `<none>`, it runs nothing for that gate and reports it not run.
   - **Every reported failure lies outside the unit's change** — it names no file the unit created or edited and no symbol it defined or changed: an **evidence downgrade**, not a blocker. Phase G's whole-tree run verifies it.
   - **A failure the unit's change caused** is the unit's to fix; one it cannot fix is a transient blocker.
   - **A path-narrowed run**, where the configured line accepts paths, is supplementary evidence, labelled as narrowed, never reported as the whole-tree result.

   `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → **An evidence downgrade is recorded, in every mode.** owns how the downgrade is recorded.
3. **A unit that creates or edits a test file runs only those files, through `<test_file_cmd>`.** Where no document states one, or the stated command is refused, the unit skips the run, records the skip in its return, and raises no blocker. The same skip applies to point 1's row-`G.4` run.
4. **No plan asks for a test run.** No `**Verification:**` bullet, finding fix or sub-step names `<test_cmd>`, a gate script, or a test file the unit neither creates nor edits; naming the unit's own new or edited test file is allowed, subject to (3). This binds every writer of a plan a unit loop walks — the task plan; the business-parity, architecture, code-review and skeptic findings; the user-review fix plan; the test fix plan — and every reviewer of one raises a breach as a **Must Fix**.
5. **`<typecheck_cmd>` is not a test run.**
6. **A unit's run stays in the foreground.** Run `<typecheck_cmd>` and `<test_file_cmd>` each as one foreground command whose output returns to you — never redirected to a file, piped, backgrounded or wrapped in a `cd`, a refusal included. A refusal takes its own route: point 3's skip for a test file; for `<typecheck_cmd>`, the refused-call fallback of `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → `## Resolved values`. When the tool layer moves a run to the background itself, do not collect it: no `Monitor` and no `sleep` (`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates` forbids both by name), and no loop that reads its output for a completion line. Record the run in your return as moved to the background — not run, never a pass — raise no blocker, and continue.
```

- [ ] Check the replacement against the rule inventory below before saving — each line names a rule the old text states and where the new text keeps it. If any one has no home in the new text, restore it in the shortest form rather than drop it:
  - the three run prohibitions (`<test_cmd>`, a gate script, a file the unit did not write) and the row-`G.4` exception's two limits — point 1;
  - Phase G as the only place the suite runs — point 1, whose "nowhere else" names the suite as its subject; point 1 places no limit on the per-unit whole-tree `<typecheck_cmd>` run that point 2 requires;
  - typecheck as the whole tree, the `<none>` case, and the three failure arms — point 2;
  - the pointer to `layer-implementer.md` → **An evidence downgrade is recorded, in every mode.** — point 2;
  - the own-test-file exception, the skip on no command or a refused one, and the skip's reach to the `G.4` run — point 3;
  - the no-plan-asks rule, its seven bound writers and the reviewers' Must Fix — point 4;
  - typecheck is not a test run — point 5;
  - foreground only; no redirect, pipe, background or `cd`; the two refusal routes; no `Monitor`, no `sleep`, no completion-line loop; record as not run — point 6.
- [ ] What the new text deliberately drops is rationale no reader acts on: point 1's *why* a targeted test is excluded and why the `G.4` exception does not breach it; point 3's and point 6's "Phase G runs that test / the suite anyway"; and point 6's closing sentence on run duration. Drop nothing else.

**Verification:**

- `git diff -- plugin/instructions/unit_loop_core.md` touches only lines between `## The test-run rule` and `**Who may cite this.**` — the heading, the roster and every other section are byte-identical.
- The anchors the section cites survive in it: `git grep -n -F -e '## Phase G — Run gates' -e '### G.1 Run the gates' -e '**An evidence downgrade is recorded, in every mode.**' -- plugin/instructions/unit_loop_core.md` still lists a line inside `## The test-run rule` for each of the three. Each cited anchor still exists in its target file: `git grep -n -F -e '### G.1 Run the gates' -- plugin/instructions/plan_orchestration_instructions_core.md` and `git grep -n -F -e '**An evidence downgrade is recorded, in every mode.**' -- plugin/agents/layer-implementer.md` each print a line.
- The section is shorter: since no other section changes, `wc -w plugin/instructions/unit_loop_core.md` is lower after the edit than before it (9430 words at `b7ebf1f0`; the section itself measured 732 words there, per the story index's `## Up-front word counts`).
- Every rule in the inventory above is found in the new text by reading it point by point, and none was moved into another section.
