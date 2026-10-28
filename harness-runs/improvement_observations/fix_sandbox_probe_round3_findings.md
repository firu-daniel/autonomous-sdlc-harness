## The plan writer reported corpus staleness: `scripts/lib/sandbox-probe/` is an undescribed layer
- **category:** tooling-gap
- **evidence:** the `task-plan-writer`'s first return (planning iteration 0) carried a `## Corpus staleness` section with one `undescribed-layer` entry: `scripts/lib/sandbox-probe/`, the probe's shell libraries (session launcher, judge, controls and one file per leg), where all of this branch's probe work landed. Only the catch-all `general` row covers it, and `.claude/context/conventions.md` → `## The layers` names `schemas/`, `docs/`, `examples/` and `evals/` for `general` but not `scripts/`.
- **cost this run:** none on this branch; the debt is owed as a supervised remedy — run `/autonomous-sdlc-harness:harness-analyze` in a session in this repository, answering `skip` for every document already filled (never `--yes`), then apply the profile with `npx autonomous-sdlc-harness config set layers`.

## The plan's hand-run `bash -c` checks were refused at the permission layer in five units
- **category:** tooling-gap
- **evidence:** the `layer-implementer` returns for Tasks 2, 3, 4, 5 and 6 each report that the task plan's by-hand verification — a `bash -c` sourcing `scripts/lib/sandbox-probe/*.sh` and calling one grading function from a temp directory — was refused at the permission layer ("don't ask mode"). Tasks 2–5 re-ran the same check as a probe through `bash scripts/scratch-run.sh harness-runs/scratch/<file>.{py,mjs}`; Task 6 ran no hand check at all and recorded it as an evidence downgrade (its `sp__cs8b_grade` pass/fail checks and "writes nothing outside `SP_TMP`" rest on reading the code).
- **cost this run:** five units' verification ran through a substitute route or not at all; Task 6's grading was first exercised by Task 11's suite.
- **hypothesis:** the planner prescribes a `bash -c` form the unattended profile never grants.

## Scratch-file cleanup with `rm` was refused, leaving probe files behind in three units
- **category:** tooling-gap
- **evidence:** the `layer-implementer` returns for Tasks 3, 4 and 5 report that `rm` of their own probe files was refused, leaving `harness-runs/scratch/task3_probe.py`, `harness-runs/scratch/task4_pc_refusal.sh` and `harness-runs/scratch/n4_grade_probe.py` on disk (git-ignored, not committed). Tasks 9 and 11 also report a Bash heredoc write of fixtures refused, worked around with the file-write tool; the `branch-reviewer` (Phase B) reports `python3` and `awk` read-only column checks refused by the sandbox, so it verified the amended `docs/sandbox-verification.md` rows from a word-level diff instead.
- **cost this run:** stray scratch files left in the run copy; the branch review could not mechanically confirm cell boundaries of 19 amended table rows.

## Two units mis-ran the tree-guard step of the test-run rule
- **category:** agent-contract
- **evidence:** the Task 8 `layer-implementer` return says "Tree guards: none selected" although its one changed path, `cli/test/sandbox-probe-remote-legs.test.mjs`, matches the `cli/test/**/*.mjs` `covers` glob of the `test/main-anchor-isolation.test.mjs` guard in `harness.config.json` (Tasks 7, 9, 10, 11 selected and ran that guard for the same glob). The Phase C Item 2 (code-review Finding 3) implementer return says it piped the guard run through `tail`, against point 6's foreground/no-pipe rule, so that result rests on printed counts rather than the exit status.
- **cost this run:** one guard run skipped and one run's exit status unobserved at unit level; the Phase G round-1 gates passed, so neither surfaced as a defect.

## The configured `defaultBranch` has no local ref in the run copy
- **category:** shared-state
- **evidence:** `harness.config.json` sets `defaultBranch` to `dev`; the `branch-reviewer` (Phase B), the `skeptic-reviewer` (Phase C2) and the `statistics-plan-writer` (Phase D) each report that `dev` does not exist locally in this run copy, so each diffed against `origin/dev` instead (the statistics file's `## Notes` records it). The orchestrator's own Phase-D `git log … <default_branch>..HEAD` was likewise issued against `origin/dev`.
- **cost this run:** three agents each re-derived the base and fell back independently; no wrong result observed.
