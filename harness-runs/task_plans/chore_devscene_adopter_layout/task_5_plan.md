### Task 5 — Rename in the run library, watcher and restart-watcher templates and the watcher test helper

**Goal:** Make the shared run library and the watcher an adopter receives read `devscene.config.json`. They default `stateDir` to `devscene` and `scriptsDir` to `devscene-scripts`, and they match the `devscene pause <branch>` run title. The watcher test helper changes in the same task, so the written watcher can still be launched against a fixture `init` wrote.

**Depends on:** Task 1. `init` now writes `devscene.config.json` with `stateDir` `devscene/` and puts the scripts under `devscene-scripts/`. The helper below runs `init` and must read what it wrote.

**Why the helper is here.** `cli/test/helpers/watcher.mjs` runs `init` and then opens `join(dir, 'harness.config.json')`. Its `STATE_DIR` is `'sdlc-harness'`. Every suite that launches the watcher goes through it, the tree guard over `cli/templates/scripts/**` among them. A run library and watcher that read the new name, paired with a helper that writes the old one, cannot launch. So the three change together.

**Where this task stops.**
- `remote-run.sh` and the workflow templates, which title the runs this watcher matches, are Task 6's. The other script templates are Tasks 7 and 8's.
- The watcher suites themselves are Task 24's.
- This repository's adopted copies `scripts/lib/harness-run-lib.sh`, `scripts/autonomous-watcher.sh` and `scripts/restart-watcher.sh` are no task's. The maintainer copies these templates over them after the run (Task 35 → `## Cutover record`; `## Context` says why).

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` (file name kept)
- `cli/templates/scripts/autonomous-watcher.sh`
- `cli/templates/scripts/restart-watcher.sh`
- `cli/test/helpers/watcher.mjs`

**Work:**

- [ ] `harness-run-lib.sh`: apply row 1 of `## Context`'s spelling table everywhere, the config-path builders (`f="${root%/}/harness.config.json"` and kin), the `git cat-file blob "$commit:harness.config.json"` read and its temp file name included. Change `hr_config_dir "${1-}" stateDir "sdlc-harness"` to `"devscene"` and `hr_config_dir "${1-}" scriptsDir "scripts"` to `"devscene-scripts"` (rows 2 and 14), with the comment above them. Apply rows 2 and 3 to the REPRO comments (`devscene-scripts`, `devscene/`), and row 12 to any run-title literal.
- [ ] `autonomous-watcher.sh`: apply rows 1, 2, 11 and 12 everywhere: every refusal and log message naming the config file, every REPRO line (`"$d/devscene/…"`, `"stateDir":"devscene/"`, `> "$d/devscene.config.json"`), the `Run DevScene` step mention, the `devscene pause feat_x` / `devscene pause <branch>` comments and the `log "job: a 'devscene pause $branch' run …"` message. Leave `MACHINE_REGISTRY_FILENAME`, `ENGINE_COMMAND_*` and every `HARNESS_*` name unchanged.
- [ ] `restart-watcher.sh`: apply rows 1 and 2.
- [ ] `helpers/watcher.mjs`: `STATE_DIR = 'devscene'`, the config path `join(dir, 'devscene.config.json')`, and rows 1 and 2 in its comments.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|Run the harness|harness (run|pause|stop)( [^a-z ]|[^ a-z]| [a-z]+_)|scriptsDir "scripts"' -- cli/templates/scripts/lib/harness-run-lib.sh cli/templates/scripts/autonomous-watcher.sh cli/templates/scripts/restart-watcher.sh cli/test/helpers/watcher.mjs` prints nothing.
- `bash -n` on each of the three shell templates exits 0.
- `git grep -n 'harness-state' -- cli/templates/scripts/lib/harness-run-lib.sh` still prints its `STATE_ARTIFACT_NAME` mirror, a kept name.
