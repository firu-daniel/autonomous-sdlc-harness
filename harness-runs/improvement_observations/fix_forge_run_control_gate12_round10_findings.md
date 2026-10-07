## `bash -n` syntax check on an edited shell template needed approval in the unattended run
- **category:** tooling-gap
- **evidence:** Phase A, Task 1 (`layer-implementer`, layer `cli`) reported in its return: "the separate `bash -n` call needed approval, so it was not run." The task's file was `cli/templates/scripts/remote-run.sh`; the plan's verification named a `bash -n` parse check of it. The implementer relied on the new suite `cli/test/remote-control-needs-agent.test.mjs` executing the script instead.
- **cost this run:** the planned standalone parse check of `remote-run.sh` did not run; parse correctness rests on the suite run and on Phase G.

## `gh run view --help` / `gh help run view` refused in the unattended run
- **category:** tooling-gap
- **evidence:** Phase A, Task 4 (`layer-implementer`, layer `general`) reported in its return: "`gh run view --help` and `gh help run view` were both refused (approval required). So it is not confirmed that `jobs` is a `--json` field." The command it was verifying, `gh run view <run id> --repo <owner>/<scratch-repo> --json jobs --jq '.jobs[].steps[] | [.name, .conclusion] | @tsv'`, now appears in `docs/development.md` Gate 12 (xiv) leg (j) and (xv) legs (d) and (d′). The deviation is recorded in `harness-runs/task_plans/fix_forge_run_control_gate12_round10_findings/task_4_plan.md`.
- **cost this run:** a documented operator command shipped with its `--json jobs` field unverified; the implementer flagged it for a manual check before Gate 12 round 11.
