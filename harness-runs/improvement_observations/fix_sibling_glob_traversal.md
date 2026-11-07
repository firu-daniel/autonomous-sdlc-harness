## Implementers' `rm` of their own scratch files is refused, so scratch probes accumulate in the run copy
- **category:** tooling-gap
- **evidence:** four `layer-implementer` returns in this run reported their `rm` of a scratch file refused by the permission layer and the file left on disk: Task 1 (`harness-runs/scratch/path-anchored-arms-red.tap`), Task 2 (`harness-runs/scratch/task2-arms-probe.mjs`), Task 4 (`harness-runs/scratch/sgt_hash.mjs`, `harness-runs/scratch/sgt_hash.prev.json`), and skeptic-review Finding 1's general-layer dispatch (`harness-runs/scratch/m46_probe.py`). All are gitignored.
- **cost this run:** none to the branch's commits; scratch files left on disk for a human to delete by hand.

## The run copy has no local `dev` ref, so every `<default_branch>..HEAD` read fails and agents fall back to `origin/dev`
- **category:** tooling-gap
- **evidence:** at Phase D, `git log --format='%h %s%n%b' --name-only dev..HEAD` exited 128 with `fatal: ambiguous argument 'dev..HEAD': unknown revision or path not in the working tree.`; re-issued against `origin/dev..HEAD`. The `statistics-plan-writer` return (`git log dev..HEAD` failed, searched `origin/dev..HEAD`), the `branch-reviewer` return (no local `dev`, diffed against `origin/dev`) and the C2.2 `review-plan-reviewer` return (compared against `origin/dev`) each reported the same fallback. The A2.1 `architecture-reviewer` dispatch was given `diff_base: dev`.
- **cost this run:** every diff-range read took a fallback base; each agent improvised it independently.

## Task 1's red run redirected test output to a file because the foreground output was truncated
- **category:** agent-contract
- **evidence:** the Task 1 `layer-implementer` return states the first plain `npm test --workspace cli -- test/path-anchored-arms.test.mjs` run's output "was cut off before every per-case result was shown", so it re-ran the suite with a reporter writing to `harness-runs/scratch/path-anchored-arms-red.tap`, which it recorded as a breach of the test-run rule's "never redirected to a file" clause (`harness-runs/task_plans/fix_sibling_glob_traversal/task_1_plan.md`, deviation note).
- **cost this run:** the suite ran twice instead of once; the recorded RED ONCE counts come from the redirected run.

## The branch reviewer could not run anything beyond read-only `git`, so its Must Fix was derived, not measured
- **category:** tooling-gap
- **evidence:** the Phase B `branch-reviewer` return: "I couldn't confirm it by running anything, because this session refused any command beyond read-only `git`. I derived it from the matcher's source and zsh's documented glob syntax." The finding (`harness-runs/code_reviews/fix_sibling_glob_traversal_code_review/finding_1.md`) was later measured by the Phase C cli-layer implementer (`m44`/`m45` printed `allow` on the unfixed guards).
- **cost this run:** a Must Fix shipped to the fix loop unmeasured; the measurement happened one phase later.

## Convergence churn: the task plan needed 3 review rounds
- **category:** optimization
- **evidence:** `harness-runs/task_plan_reviews/fix_sibling_glob_traversal/` holds `review_0.md`, `review_1.md`, `review_2.md` (the architecture and business-parity plan-review folders hold none; the fourth task-plan-reviewer dispatch passed and wrote no file). By finding heading: round 0 — 9 findings (5 Must Fix, 4 Should Fix), all net-new; round 1 — 1 net-new, 0 re-raised; round 2 — 1 net-new, 0 re-raised.
- **cost this run:** 3 extra writer + architecture-reviewer + task-plan-reviewer revisions (9 dispatches) before PASS.

## Index-only commits: three task commits staged no work file
- **category:** optimization
- **evidence:** `c2fd6729` (Task 4), `db6c3596` (Task 5), `d723b0b7` (Task 6), each subject `fix: Mark Task <K> done — index flip and task <K> plan deviation notes`; staged set: the story index and the task's own plan file only (their work lives in gitignored `harness-runs/scratch/`).
- **cost this run:** three commits whose only record of the task's measurement work is the deviation note in the task file.
