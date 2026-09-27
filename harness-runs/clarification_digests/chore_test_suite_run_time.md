## question_1 — How to obtain the restricted-core (remote-runner) before/after figures with no container runtime on the measuring machine
- **raised by:** Phase A (task implementation), `layer-implementer` on **Task 7** — "Measure the before and after, prove nothing was lost, and record both in `docs/development.md` gate 4" (`harness-runs/task_plans/chore_test_suite_run_time/task_7_plan.md`)
- **asked:** Q1 — acceptance item 1 requires `npm test` and `bash scripts/run-gates.sh` figures before and after, measured (not estimated) on this machine **and** restricted to the modelled remote-runner core count (4, with 2 alongside). macOS cannot restrict a process tree to fewer cores, so the plan measures inside a container; none is installed (`which docker colima orb podman` finds nothing, and `bash scripts/measure-suite.sh --cpus 4` exits 3 as designed). Options:
  - **(a) Install a runtime, then resume.** Install and start Docker Desktop, colima or OrbStack.
    - Give its VM at least 4 CPUs (colima defaults to 2).
    - Give it network access, so it can pull `node:20-bookworm` and run `apt-get` and `npm ci`.
    - Share the macOS temp directory (`$TMPDIR`, under `/var/folders`) with the VM. Colima shares only `$HOME` by default.
    - Also confirm that an unattended run is allowed to call `docker info` / `docker run`. Then answer "(a) ready", and the run re-dispatches Task 7 unchanged.
  - **(b) Host-only figures now, restricted figures later.** Task 7 measures on the 10-core host only and records the result. It states plainly that the 2- and 4-core figures are not yet measured, and names the command to run them (`bash scripts/measure-suite.sh --cpus 4`). Acceptance 1 stays open for you to close later.
  - **(c) Another way to restrict cores** that you name, for example a Linux machine or a GitHub Actions runner you run by hand. Paste its figures into your answer, and Task 7 records them as measured by you.

  Also noted for awareness (no decision needed): during Tasks 1 and 4, two full-suite runs each had unidentified gate-4 failures, 1 of 790 and 2 of 791, which passed on re-run.
- **answered:** Q1: (b) host-only now — measure on the 10-core host only, record that the 2- and 4-core figures are not yet measured, name `bash scripts/measure-suite.sh --cpus 4` as the command to run them, and leave acceptance item 1 open.
- **carries beyond this branch:** acceptance item 1 of this branch's task prompt remains open: the 4- and 2-core `npm test` / `run-gates.sh` figures are owed, to be taken with `bash scripts/measure-suite.sh --cpus 4` (and `--cpus 2`) once a docker-compatible runtime is available; until then `docs/development.md` gate 4 records them as not yet measured.
