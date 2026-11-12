### Task 17 — Rename the variables in the sandbox-probe scripts, the probe runner workflow and the arm-A eval script

**Goal:** This repository's contributor scripts read and set the renamed variables. The sandbox probe launches sessions with `DEVSCENE_MAIN_REPO`, pins `DEVSCENE_CLI_VERSION` and reads `DEVSCENE_AGENT_CLI`. The probe runner workflow reads `vars.DEVSCENE_RUNNER` and `secrets.DEVSCENE_GIT_TOKEN`. The arm-A eval reads `DEVSCENE_AGENT_CLI`.

**Depends on:** Task 2 (`MAIN_REPO_ANCHOR_VARIABLE`, `CLI_VERSION_VARIABLE`, `RUNNER_VARIABLE`, `GIT_TOKEN_SECRET` = `DEVSCENE_MAIN_REPO`, `DEVSCENE_CLI_VERSION`, `DEVSCENE_RUNNER`, `DEVSCENE_GIT_TOKEN`). Task 3 (the watcher's `${DEVSCENE_AGENT_CLI:-claude}`). Task 16 (the self-adopted watcher these probes drive).

**Where this task stops.** `HARNESS_EVAL_CORPUS_ROOT` in `run-arm-a.sh` is a kept contributor switch. `HARNESS_RETRIEVAL_CACHE` and `HARNESS_STOPPED` in `sandbox-probe-runner.yml`, and `HARNESS_REPO_SLUG` in `session.sh`, are kept or excluded. All of them stay. `cli/test/sandbox-probe-git-and-legs.test.mjs` asserts `session.sh`'s printed parity line and is Task 18's. This repository's own GitHub variables and secrets need re-creating under the new names; that is a manual step in the index.

### Targets

- `scripts/lib/sandbox-probe/legs-settings.sh`, `scripts/lib/sandbox-probe/session.sh`
- `scripts/lib/sandbox-probe/preflight.sh`
- `scripts/sandbox-absent-path-check.sh`
- `scripts/sandbox-probe-runner.yml`
- `evals/docs-retrieval/arm-a/run-arm-a.sh`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] `legs-settings.sh` and `session.sh`: `HARNESS_MAIN_REPO`.
- [ ] `preflight.sh`: `HARNESS_CLI_VERSION` and `HARNESS_AGENT_CLI`.
- [ ] `sandbox-absent-path-check.sh`: `HARNESS_MAIN_REPO`.
- [ ] `sandbox-probe-runner.yml`: `HARNESS_RUNNER`, `HARNESS_CLI_VERSION` and `HARNESS_GIT_TOKEN`.
- [ ] `run-arm-a.sh`: `HARNESS_AGENT_CLI` only.

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- scripts evals` prints nothing.
- `git grep -c 'HARNESS_EVAL_CORPUS_ROOT' -- evals/docs-retrieval/arm-a/run-arm-a.sh` is non-zero.
- `bash -n` on each edited `.sh` file exits zero.
  - **Deviations from plan:** The direct `bash -n <file>` calls were refused by the permission layer (don't-ask mode), once chained and once per file. The claim rests instead on `bash scripts/typecheck.sh`, whose `scripts/check-shell-parse.sh` step runs `bash -n -- <path>` over every `*.sh` that `git ls-files --cached --others --exclude-standard` lists, which includes all five edited scripts. It printed `check-shell-parse: 124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` and then `PASS: typecheck`.
