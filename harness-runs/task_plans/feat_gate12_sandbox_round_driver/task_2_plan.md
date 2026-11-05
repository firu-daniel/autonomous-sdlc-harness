### Task 2 — Add `preflight.sh` and `state.sh`: the refusals, the Gate 12 configuration read and the atomic state file

**Goal:** Refuse to run anywhere but an adopted Gate 12 repository named explicitly, resolve that repository's own configuration, and own the one state file every other subcommand reads and writes.

**Depends on:** Task 1. It provides the following from `scripts/lib/gate12-sandbox-round/core.sh`:
- `g12_refuse <text>`;
- `g12_exit_raise <code>`;
- the globals `G12_REPO` (`<owner>/<name>`, from `--repo`) and the script's own root.

Exit 2 is *a preflight refusal, nothing created*. Exit 3 is *a `gh` or `git` call failed*.

Task 1's entry point runs each `--repo` subcommand in this order: `g12_need g12_preflight`, then `g12_preflight` — stopping on its non-zero return with the accumulated code — and only then `g12_need <subcommand fn>` and the call. So this task's exit-2 check below holds before Task 6's `g12_grade_cmd` exists: the refusal stops the run before that function is looked for.

### Targets

- `scripts/lib/gate12-sandbox-round/preflight.sh` (new).
- `scripts/lib/gate12-sandbox-round/state.sh` (new).

**Work:**

- [ ] `preflight.sh` → `g12_preflight`. It returns non-zero after a `g12_refuse` line naming the cause, and creates nothing on any refusal. It checks, in this order:
  1. `git`, `gh` and `jq` are on `PATH`.
  2. The working directory is inside a git checkout. Its top level comes from a bare `git rev-parse --show-toplevel`, held in `G12_ROOT`, and it is **not** the script's own repository top level. That refuses this repository and any copy that carries the script.
  3. `G12_ROOT/harness.config.json` exists and parses. **Not adopted** is a refusal.
  4. The raw `git -C "$G12_ROOT" config --get remote.origin.url` names a GitHub repository, in the `https://github.com/<o>/<n>(.git)` or `git@github.com:<o>/<n>(.git)` form, whose `<o>/<n>` equals `G12_REPO` case-insensitively. The raw config value is used, not `git remote get-url`, so the slug is the one the operator wrote.
  5. After a `git fetch origin`, the GitHub default branch — `gh repo view "$G12_REPO" --json defaultBranchRef --jq .defaultBranchRef.name` into `G12_GITHUB_DEFAULT` — carries `.github/workflows/harness-run.yml`, read through `git show origin/<default>:.github/workflows/harness-run.yml`, and that file contains the step name `Install the sandbox prerequisites`. The refusal names the version gap, as `docs/development.md` round step 5 does.
  - A failed `gh` or `git` call here raises 3. A refusal raises 2.
- [ ] `preflight.sh` → the configuration read:
  - Set `G12_STATE_DIR` from `.stateDir`, defaulting to `sdlc-harness`.
  - Set `G12_SCRIPTS_DIR` from `.scriptsDir`, defaulting to `scripts`.
  - Set `G12_CONFIG_DEFAULT` from `.defaultBranch`.
  - Strip a trailing `/` from each.
  - Refuse a value carrying `..` or a leading `/`.
- [ ] `state.sh`:
  - `g12_scratch_dir` prints `$G12_ROOT/$G12_STATE_DIR/scratch/gate12-sandbox-round` — the one derivation of the scratch root. `g12_state_path` prints `$(g12_scratch_dir)/state.json`, and Task 6's `runs.sh` builds its `runs/<id>/…` and `evidence/<row>.log` paths on `g12_scratch_dir` too, never repeating the literal.
  - `g12_state_init` creates the directory and an initial `{"schema":1,"repo":…,"default_branch":null,"branches":[],"runs":[],"tokens":{},"other_branch":null,"variables":{}}` only when the file is absent.
  - `g12_state_get <jq filter>` reads the file.
  - `g12_state_update <jq program> [jq args...]` writes through a `mktemp` file in the same directory, then `mv`, and refuses a state file whose `repo` is not `G12_REPO`.
  - Define the key shapes in a header comment: `branches[]` items carry `name`, `row`, `arm` and `commit`; `runs[]` items carry `row`, `arm`, `branch`, `run_id` and `dispatched_at`, plus the optional `stall_values_unconfirmed` (boolean; read as `false` when absent; written only by the default-branch leg, Task 5, on the JS3 entry when its wait for the run to start times out); `tokens` is keyed by row; `variables` is keyed by name, each with `present`, `value` and `restored`.
- [ ] Both files open with `#!/usr/bin/env bash` on the first line (`.claude/context/conventions.md` → `## Shell assets`), then a header stating what each owns, the sourced-library rule (no shell option set), the Bash 3.2 floor, and that the state file is in the Gate 12 repository's `<stateDir>/scratch/`, which that repository's managed ignore block ignores by its contents.

**Verification:**

- From a throwaway directory that is not a git checkout, `grade --repo a/b` exits 2 naming the checkout refusal, and nothing is written.
- `commands.typecheck` passes over the two new files.
