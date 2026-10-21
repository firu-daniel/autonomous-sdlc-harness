## The plan reported two layers that only the catch-all row covers
- **category:** tooling-gap
- **evidence:** the `task-plan-writer` return's `## Corpus staleness` section carried two `undescribed-layer` entries: `scripts/` (this repository's own scripts — `init`'s byte-for-byte copies of the outer-loop scripts plus the hand-written `run-gates.sh`, `publish-main.sh`, `release.sh`) and `docs/` (developer documents and documents of record such as `docs/sandbox-verification.md`); both are covered only by the `general` row at path `.` in `harness.config.json`.
- **cost this run:** each owes the supervised remedy in the writer's own spelling — a `/autonomous-sdlc-harness:harness-analyze` run in a session in this repository, answered `skip` for every already-filled document (not the `--yes` spelling), with any profile change applied through `npx autonomous-sdlc-harness config set layers`; `doctor`'s `layer-drift` check reports the same directories.

## Row A's branch-name commit_prefix rule was refused by the committer under this repository's commit policy
- **category:** agent-contract
- **evidence:** the Phase-A `[A · Task 1 · commit] → committer` dispatch (#2) carried `commit_prefix: fix`, derived from `plugin/instructions/unit_loop_core.md` → `## Substitution table` row `A`'s `commit_prefix rule` (`fix_` → `fix`); the committer returned `error: commit_prefix `fix` is not a legal value`, citing `.claude/context/conventions.md` → `## Commit-message policy` (a story task takes prefix `none`). The dispatch was redone as #3 with `commit_prefix: none` and landed as `9c4b7880`.
- **cost this run:** one wasted committer dispatch.
- **hypothesis:** row `A`'s rule derives the prefix itself, where the fix rows defer to the committer's contract.

## A multi-layer finding's first layer returned a blocker for the half owned by the next layer
- **category:** agent-contract
- **evidence:** `[C · Item 1 · cli · iter 0] → layer-implementer` (#12) for code-review Finding 4, tagged `_(layer: cli, general)_` in `harness-runs/code_reviews/fix_run_gates_sandbox_tmpdir_code_review.md`, returned an unmarked `blocker:` saying the identical reflow in `scripts/remote-run.sh` is outside the `cli` path scope; it was re-dispatched as #13 with a `context_notes:` line naming the `general` layer that follows in the same unit (recorded in `harness-runs/dispatch_additions/fix_run_gates_sandbox_tmpdir.md`), then #14 did the `general` half.
- **cost this run:** one wasted implementer dispatch; the escalation the unit loop prescribes for an unmarked blocker was not taken (ask-vs-assume: low-stakes, assumed and proceeded).

## The branch-reviewer's Pass-0 grep sweep did not run
- **category:** tooling-gap
- **evidence:** the Phase-B `branch-reviewer` return (#9) stated: "the grep half did not run, because the sweep table in the branch-reviewer definition has no regexes filled in. That is a configuration gap, not a clean result."
- **cost this run:** Pass 0's grep sweep contributed nothing to the code review.

## Implemented-solution reviewers were given a diff base with no local ref
- **category:** silent-failure
- **evidence:** Phases A2 and B dispatched with `diff_base: dev` (the core's `<default_branch>`); the `branch-reviewer` return (#9) reported "this checkout has no local `dev` branch, so I diffed against `origin/dev`"; the Phase-D `statistics-plan-writer` return (#23) likewise reported `git log dev..HEAD` failed and it used `origin/dev..HEAD`.
- **cost this run:** none observed — the reviewer recovered on its own; a reviewer that did not would have diffed against nothing.
