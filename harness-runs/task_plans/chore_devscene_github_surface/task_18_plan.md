### Task 18 — Respell the Gate 12 sandbox-round library

**Goal:** Make the not-yet-run Gate 12 sandbox round look for the run workflow under its new name. It drives a sandbox repository that `init` adopted, and `init` now writes `.github/workflows/devscene-run.yml`.

**Depends on:** Task 2, the template `cli/templates/github/workflows/devscene-run.yml`. Its `run` job's step names, including `Install the sandbox prerequisites`, and its `run-name: harness ${{ inputs.action }} ${{ inputs.branch }}` are unchanged. Task 1's `WORKFLOW_RUN_FILE = 'devscene-run.yml'`.

**Where this task stops.** It changes the workflow file name and nothing else. The display-title match on `harness <action> <branch>` in `plant.sh` stays, because the `run-name` is not renamed (`## Context` → *What keeps its current spelling*). The suites that run this library (`cli/test/gate12-sandbox-round-*.test.mjs`, `cli/test/helpers/gate12-round.mjs`) are Task 19's. The round's written procedure in `docs/development.md` is Task 21's.

### Targets

- `scripts/lib/gate12-sandbox-round/default-branch.sh`
- `scripts/lib/gate12-sandbox-round/grade-full-run.sh`
- `scripts/lib/gate12-sandbox-round/grade-plant.sh`
- `scripts/lib/gate12-sandbox-round/grade-state.sh`
- `scripts/lib/gate12-sandbox-round/plant.sh`
- `scripts/lib/gate12-sandbox-round/preflight.sh`
- `scripts/lib/gate12-sandbox-round/runs.sh`

**Work:**

- [ ] Change every `gh run list --repo "$G12_REPO" --workflow harness-run.yml …` call, and every refusal or lookup string that echoes it, to `--workflow devscene-run.yml`. These are in `default-branch.sh`, `grade-full-run.sh`, `grade-state.sh` and `plant.sh`.
- [ ] `preflight.sh`: change the read of `origin/$G12_GITHUB_DEFAULT:.github/workflows/harness-run.yml` to `…/devscene-run.yml`. Change the two messages that name it, the `git show … failed` refusal and the *"has no step Install the sandbox prerequisites"* refusal, and the header comment's path.
- [ ] Respell every remaining comment that names `harness-run.yml`: the `default-branch.sh` header notes, `grade-plant.sh`'s *"from cli/templates/github/workflows/devscene-run.yml"* and its job-files note, `plant.sh`'s *"The title is devscene-run.yml's run-name, `harness <action> <branch>`"*, and `runs.sh`'s job-name note.
- [ ] Leave every `harness <action> <branch>` display-title match, every `HARNESS_*` name and every `sdlc-harness` `stateDir` path unchanged.

**Verification:**

- `grep -rnE "harness-(trigger|run|control|resume)\.yml" scripts/lib/gate12-sandbox-round` prints nothing.
- `grep -rn "devscene-run.yml" scripts/lib/gate12-sandbox-round` lists a line in each of the seven targets.
- `grep -n "displayTitle\|harness <action> <branch>" scripts/lib/gate12-sandbox-round/plant.sh` still shows the run-name match.
- `bash -n` exits 0 on each of the seven targets.
