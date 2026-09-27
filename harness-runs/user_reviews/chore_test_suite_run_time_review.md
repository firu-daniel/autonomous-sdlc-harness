# User review — chore_test_suite_run_time

## 1. The gate-4 host figures were measured on a machine other sessions were loading, so they overstate the gain

`docs/development.md` → Gate 4 → **Run time, measured.** records the host row from runs taken inside the headless run, while other sessions were running their own test suites and processes on the same machine (the paragraph itself notes a 1-minute load of 20.86 before the before run). Those figures read as roughly 2× faster for `npm test` (376–494 s → 209–217 s). On a free machine the gain is about a third.

I re-measured both sides outside any headless session, with no other heavy process running, one run each, the before right after the after, from the branch worktree with the branch's own wrapper:

```
bash scripts/measure-suite.sh --runs 1
bash scripts/measure-suite.sh --ref fe17b4e2293f --runs 1
```

Host: Darwin arm64, `os.availableParallelism()` 10, Node v22.23.2, git 2.50.1 (Apple Git-155). 1-minute load average 2.47 before the after run, 2.25 before the before run. Measured 2026-09-26. The script's own `measure-suite:` lines:

```
measure-suite: host cpus=10 ref=19417ce9a6c1 npm-test run 1/1: 117.83 s, exit 0
measure-suite: host cpus=10 ref=19417ce9a6c1 run-gates run 1/1: 135.32 s, exit 1
  run-gates: 1 failed, 19 passed
measure-suite: host cpus=10 ref=fe17b4e2293f npm-test run 1/1: 170.48 s, exit 0
measure-suite: host cpus=10 ref=fe17b4e2293f run-gates run 1/1: 208.22 s, exit 1
  run-gates: 1 failed, 19 passed
    - 11 docs-retrieval relevance floor
```

`19417ce9a6c1` was the branch's `HEAD` at the time (`chore: Flow progress D for chore_test_suite_run_time`).

Replace the host row with these figures: `npm test` 170 s → 118 s (−31%), `run-gates.sh` 208 s → 135 s (−35%). Update the provenance around it to match: the date, the Node version (the record says v20.19.5; these were taken on v22.23.2), the `--runs 1` commands, and the after column's commit — say it was measured at the branch's `HEAD` rather than naming a branch-only SHA, which the squash merge drops (the code review's Finding 1). Replace the "Read the host row as a range, not a point…" paragraph's load explanation with the reason below. Keep the "nothing was lost" test-count evidence as it is.

**One run per side is deliberate; do not re-measure and do not require three runs.** Record why in the document: a measurement taken inside a harness session is unstable and unpredictable, because other sessions can be running their own tests and other processes on the same machine at the same time, and the session that runs the measurement adds to the load itself. So the recorded figures are taken by hand, outside any headless session, on a machine with no other heavy process running — and repeating them inside a run would not make them more trustworthy. Align Task 7's acceptance wording (three consecutive runs) in the plan artifacts with this if it is quoted anywhere in the document of record.

The one failing gate on both sides is the same and pre-exists the branch: `11 docs-retrieval relevance floor`, because the machine-wide retrieval runtime does not match the local version. It is not a finding on this branch and needs no change here.
