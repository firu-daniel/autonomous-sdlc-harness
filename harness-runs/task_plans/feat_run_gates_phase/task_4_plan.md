### Task 4 — Ask adopters for their single-file test command in the conventions skeletons, re-word the scratch mutation-revert sentences, and add `run-test-suite.sh` to the adopter-facing outer-loop rosters

**Goal:** Give an adopter's `/autonomous-sdlc-harness:harness-analyze` run a prompt to record the one fact the test-run rule's exception needs: the command that runs a single test file on its own, or that there is none. Also correct the three adopter-facing sentences that justify reverting a mutation check by pointing at a per-unit suite run, and bring the adopter-facing and package-facing enumerations of the outer-loop scripts into step with Task 1's new `run-test-suite.sh` — `agentInvocable: true`, run by the orchestrating session once per Run gates phase, printing only `pass` or `fail <log path>`.

**Where this layer stops.** This task changes only what a future adopter receives. The rule that consumes the fact is Task 5's `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, and the implementer that reads it is Task 6. That rule looks for the statement in the dispatched layer's conventions document or in the catch-all layer's, so both skeleton kinds get the prompt. This repository's own conventions documents are not targets of this or any task: their missing statement is raised in the writer's `## Corpus staleness` return. Task 20 mirrors the scratch README and `scratch-run.sh` into this repository.

### Targets

- `cli/templates/claude/context/conventions.md` → `**What belongs here**`.
- `cli/templates/claude/context/layer.md` → `**What belongs here**`.
- `cli/templates/state-dir/scratch/README.md`.
- `cli/templates/scripts/scratch-run.sh` (the header comment only).
- `cli/templates/scripts/README.md`.
- `cli/README.md` → the paragraph beginning *"TypeScript in `src/` compiles with `tsc` to `dist/`"* (its outer-loop enumeration).
- `cli/templates/claude/settings.autonomous.json` → the `_comment` string beginning *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME THREE WAYS"*.

**Work:**

- [ ] **The two conventions skeletons.**
  - In `conventions.md`, the bullet *"Logging, error handling, and the testing bar a change clears before it counts as done."* gains a clause: the one command that runs a single test file on its own, or the statement that this project has none. The clause adds that the harness runs the full test command once per Run gates phase, never per change, so a unit that wrote a test runs only that file, through this command.
  - In `layer.md`, the bullet *"What "done" means here: the tests to write, the checks to run, the bar a review holds the change to."* gains the same clause scoped to this layer.
  - Add the suggestion that where the test wrapper's line accepts a path, `bash <scriptsDir>/test.sh <file>` is the command to name, because it is already allow-listed. Name no stack's runner.
  - Keep `<!-- harness:unfilled -->` and the rest of each file untouched. Both edits are **What belongs here** items, which `plugin/agents/conventions-writer.md` answers item by item.
- [ ] `state-dir/scratch/README.md`: the sentence *"a mutation check is **reverted before the task's own verification runs**: the point of one is a suite that fails, and the committer has to see that suite clean"* now gives this reason instead: the Run gates phase runs the full suite over the committed tree, so a mutation left in place fails it. Keep the first half of the sentence unchanged.
- [ ] `scratch-run.sh`: the header lines *"a MUTATION CHECK is REVERTED before the task's own verification runs, because the committer will see that suite and it has to be clean."* take the same reason in the file's comment style. Change no executable line. The byte-for-byte copy test in `cli/test/outer-loop-scripts.test.mjs` compares against this template, so it follows automatically.
- [ ] `scripts/README.md`: in the *"The other family in this directory is not generated."* paragraph, add `run-test-suite.sh` to the enumerated outer-loop set, followed by one sentence in the style of the flow-walker sentence: the orchestrating session runs it once per Run gates phase; it runs the configured test command, writes the output to a per-round log under `<state_dir>/test_run_logs/` and prints only `pass` or `fail <log path>`. This is adopter-facing prose, so name no command the adopter runs.
- [ ] **The two other outer-loop rosters.**
  - `cli/README.md`: in the outer-loop shell-assets enumeration (*"… the scratch runner, the flow walker (`flow-walker.sh`) and its gate library (`lib/flow-walker-gates.sh`), the docs-retrieval server launcher and the library they share"*), add the test-suite runner (`run-test-suite.sh`) after the flow walker and its gate library.
  - `settings.autonomous.json`'s comment string: *"the flow walker `flow-walker.sh` is the one the orchestrating session runs"* becomes a statement that the orchestrating session runs two of them — the flow walker `flow-walker.sh` and the test-suite runner `run-test-suite.sh` — and *"they sit on the unattended commit or planning path"* becomes the unattended commit, planning or gate-run path. Change only that string's wording, keep it one JSON string, and leave every other key untouched.

**Verification:**

- `grep -n "single test file\|one test file" cli/templates/claude/context/conventions.md cli/templates/claude/context/layer.md` shows the new clause in both skeletons, and `grep -c "harness:unfilled" cli/templates/claude/context/conventions.md cli/templates/claude/context/layer.md` still reports the marker in each.
- `grep -rn "committer has to see that suite\|committer will see that suite" cli/templates` prints nothing.
- `grep -n "run-test-suite.sh" cli/README.md cli/templates/claude/settings.autonomous.json cli/templates/scripts/README.md` shows the new mention in each, and `grep -n "is the one the orchestrating session runs\|commit or planning path" cli/templates/claude/settings.autonomous.json` prints nothing.
- `node -e "JSON.parse(require('fs').readFileSync('cli/templates/claude/settings.autonomous.json','utf8'))"` exits 0 — the template still parses as JSON (it carries `{{scriptsDir}}` only inside strings).
- `bash scripts/typecheck.sh` passes. No executable line changed, so no test file is edited or run by this unit.
