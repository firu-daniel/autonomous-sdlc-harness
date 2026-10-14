## Task-prompt goal 4 needs a conventions-document edit no run may make
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/plugin.md` gives no standard for writing agent prose, while this branch rewrote every cross-family block in `plugin/agents/` to one standard and the task prompt's goal 4 asks for that standard to be written into that document. The `branch-reviewer` (Phase B) raised the same gap as a `## Questions` item.
- **cost this run:** goal 4 is unmet on the branch; the standard lives only in `harness-runs/story_plans/chore_thin_shared_agent_prose_story_plan.md` → `## Context`. It owes a follow-up restatement: a hand edit adding a `## Writing agent prose` section after `## The sections an asset carries`, or a supervised `/autonomous-sdlc-harness:harness-analyze plugin` re-run.

## Row A's commit_prefix rule and the repository's commit-message policy disagree
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` (main checkout) → `## Substitution table`, row `A`'s `commit_prefix rule` maps a `chore_` branch to `chore`, so every Task commit on this branch was dispatched with `commit_prefix: chore`. The Task 3 `committer` return noted that `.claude/context/conventions.md` → `## Commit-message policy` assigns story-task commits the prefix `none`. Commits 4b52a87f, 84258333, 08b9e9b8, a73c5529, 68439520, c0268049, 688890d9, 33dda5a6, 7b920ab1, b56193a4 and 0106e409 carry `chore:`; the fix-row commits ab8f3908, 796b1304 and 2fa9eabe, dispatched by designation, carry none.
- **cost this run:** eleven story-task commits carry a prefix the repository's policy reserves for run artifacts.

## A unit skipped the whole-tree type check its rule requires
- **category:** agent-contract
- **evidence:** the Task 11 `layer-implementer` return reported `<typecheck_cmd>: not run`, reasoning that the unit changed only a markdown run artifact; `plugin/instructions/unit_loop_core.md` (main checkout) → `## The test-run rule` point 2 says a unit runs `<typecheck_cmd>`, with `<none>` as the only stated exemption.
- **cost this run:** none measurable — Phase G's round-1 whole-tree type check passed.

## Index-only commit
- **category:** optimization
- **evidence:** `git log --format='%h %s' dev..HEAD` — Task 11, 0106e409, staged set "word counts recorded in the story index" (subject `chore: Mark Task 11 done — word counts recorded in the story index`).
- **cost this run:** one unit's commit landed no work file; its work was the story index itself.
