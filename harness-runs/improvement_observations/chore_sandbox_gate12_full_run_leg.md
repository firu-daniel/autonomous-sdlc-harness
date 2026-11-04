## layer-implementer reported "no tree guard selected" on docs edits the `**/*.md` guard covers
- **category:** agent-contract
- **evidence:** `harness.config.json` → `treeGuards` carries `{ "test": "test/no-container-home-paths.test.mjs", "covers": "**/*.md" }`. Four of this run's 13 `layer-implementer` returns each edited a `docs/*.md` file yet reported no guard: Task 3 (`docs/remote-execution.md`, return: "no tree guard applies to a docs-only change"), code-review Finding 5 (`docs/development.md`, "no tree guard was selected"), code-review Finding 3 (`docs/development.md`, "Tree guards: none selected"), skeptic Finding 2 (`docs/development.md`, "no tree guard was selected"). The other nine returns ran that same guard for an identical change shape (e.g. Task 1, Task 4, code-review Finding 1).
- **cost this run:** the guard did not run per-unit on 4 units; Phase G round 1 (`task_round_1`) passed, so nothing shipped unverified.
- **hypothesis:** (guess) the implementer treats a prose-only change as exempt from `unit_loop_core.md` → `## The test-run rule` point 7.

## An implementer's scratch probe stayed in the run copy because its delete was refused
- **category:** tooling-gap
- **evidence:** the Task 2 `layer-implementer` return: "Left behind: a probe at `harness-runs/scratch/task2_fr_readfrom_check.py`. It is git-ignored and not committed; my attempt to delete it was refused." The Task 3 return likewise reports a shell edit to tick sub-step bullets "was refused under don't-ask mode".
- **cost this run:** one untracked, git-ignored file left in the run copy; no tracked-tree effect.
