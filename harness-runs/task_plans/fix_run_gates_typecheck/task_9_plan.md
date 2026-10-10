### Task 9 — The supervised flows' single wrapper run names both gates

**Goal:** The three supervised flows run `run-test-suite.sh` once, with the labels `task_supervised` / `review_<n>_supervised`, and cite G.1's wait mechanism. Make each say that this one run covers the whole-tree type check as well as the test suite, so that a supervised `pass` means the same thing as an autonomous one. The labels, the wait mechanism and the branches on the verdict line do not change.

**Depends on:** Task 1, under which `bash <scripts_dir>/run-test-suite.sh <label>` runs `commands.typecheck` (whole tree, no path argument) and then `commands.test`, each once. The test runs even when the typecheck failed. It prints `pass` only when both pass (a typecheck of `<none>` is recorded not run and never fails the run), otherwise `fail <log>` or `pending`, and `--wait <label>` is unchanged. These flows read only that line, as now. The decision that the supervised flows get the same behaviour is the story index's. No supervised step is added or removed.

### Targets

- `plugin/instructions/code_review_instructions.md`: the clean-pass statistics step's "**Run the gates**" sub-step.
- `plugin/instructions/code_review_fixes_instructions.md`: the final statistics step's "**Run the gates**" step.
- `plugin/instructions/user_review_fixes_instructions.md`: the "**Run the gates**" step.

**Work:**

- [ ] In each of the three files, change the justification "because the implementers this … dispatched ran no suite" so that it says two things. First, the implementers ran no suite, and their own whole-tree `<typecheck_cmd>` runs do not gate the flow, because a failure outside a unit's change is recorded as an evidence downgrade rather than fixed or blocked on (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, cited as it is now). Second, the one wrapper run below runs both gates, the whole-tree type check and then the suite, over the finished tree, and its verdict is the one that counts. **Do not** write that the implementers ran no type check: under Task 6 every unit still runs `<typecheck_cmd>` as written, with no path argument, over the whole tree, in every mode, and `## The test-run rule` point 2 is rewritten to say so.
- [ ] In each file's `fail <log>` branch, keep "Tell the user the gates failed, name `<log>`, and stop". Add that the log's per-gate sections show whether the type check, the suite or both failed, for the user to read.
- [ ] Change nothing else: not the labels, the `--wait` bullet citing `### G.1 Run the gates`, "No `Monitor` and no `sleep`", nor the no-line case.

**Verification:**

- `git grep -n 'ran no suite' -- plugin/instructions/code_review_instructions.md plugin/instructions/code_review_fixes_instructions.md plugin/instructions/user_review_fixes_instructions.md` prints, in each file, the rewritten justification. Read at each hit, the sentence carrying "ran no suite" does not claim the implementers ran no type check; it says their whole-tree type-check runs do not gate the flow (a failure outside a unit's change is a recorded downgrade) and that the wrapper run covers both gates over the finished tree.
- `git grep -nE 'no (whole-tree )?type check' -- <the same three files>` prints no line attributing "no type check" to the implementers.
- `git grep -n 'run-test-suite.sh' -- <the same three files>` still shows the labels `task_supervised` and `review_<n>_supervised`, unchanged.
- All three files remain on `## The test-run rule`'s roster and only point at it.

**Deviations from plan:** The Work bullet names the implementers' "whole-tree `<typecheck_cmd>` runs". None of the three files declares `<typecheck_cmd>` in its `## Resolved values` table, and `.claude/context/plugin.md` → `## The sections an asset carries` requires every token to be declared there. So the text reads "their own whole-tree type-check runs", which is the Verification bullet's own wording, and no token row was added.
