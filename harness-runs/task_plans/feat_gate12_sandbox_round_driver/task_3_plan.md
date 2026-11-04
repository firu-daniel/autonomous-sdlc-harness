### Task 3 — Add `plant.sh`: the plumbing branch builder, the dispatch, the run-ID lookup and the `plant` subcommand

**Goal:** Build each throwaway branch by plumbing from the GitHub default branch's tip, push it, dispatch its job through the Gate 12 repository's own `remote-run.sh`, and record the branch and the run ID. This is round step 7's mechanics. What each branch carries is Task 4's.

**Depends on:** Task 1 and Task 2.
- From Task 1: `g12_refuse`, `g12_exit_raise`, `g12_row_field` (field 3 is the route: `full-run` | `plant` | `reads-SB2` | `default-branch` | `hand`; the `plant` rows are JS1, JS4, SB2 and RJ2, and SB4 alone is `reads-SB2` with arms `-`), `g12_row_arms <row>`, and `G12_ROWS_SELECTED` (the `--row` values, empty meaning every `plant`-route row).
- **This task owns `g12_branch_push <row> <arm> <branch> <commit>`** (Work below). Task 5 calls it for the JS3 branch, so the JS3 branch reaches `branches[]` and `teardown` (Task 9) deletes it.
- From Task 2: `G12_ROOT`, `G12_REPO`, `G12_STATE_DIR`, `G12_SCRIPTS_DIR`, `G12_GITHUB_DEFAULT`, `g12_state_init`, `g12_state_get` and `g12_state_update`.
- **This task does not decide any branch's content.** It calls `g12_plant_files <row> <arm> <branch> <dir>`, which Task 4 defines. That function writes, under `<dir>`, a manifest `<dir>/manifest` of `<mode>\t<repo-relative path>\t<file under dir>` lines, and a task prompt `<dir>/task_prompt.md`. It returns non-zero to refuse.

### Targets

- `scripts/lib/gate12-sandbox-round/plant.sh` (new).

**Work:**

- [ ] `g12_branch_build <branch> <dir>` builds two commits on `origin/$G12_GITHUB_DEFAULT`, as `docs/sandbox-verification.md` row JS1 names the plumbing (`hash-object` / `update-index` / `commit-tree` here; the closing `update-ref` is `g12_branch_push`'s, below), with a temporary index from `mktemp` under `TMPDIR` (`GIT_INDEX_FILE`):
  - The first commit places the task prompt at `$G12_STATE_DIR/task_prompts/<branch>_task_prompt.md`, with subject `chore: add task prompt for <branch>`.
  - The second commit places each manifest line with `git hash-object -w` and `git update-index --add --cacheinfo <mode>,<sha>,<path>`. Mode `120000` takes the blob as the link target. The subject is `chore: Plant <row> <arm> for Gate 12`.
  - **An empty manifest builds the prompt commit only.** Task 5's JS3 branch is honest and depends on this.
  - It writes objects only — **no ref** — and prints the tip commit on stdout, the `<commit>` `g12_branch_push` takes. It neither creates `refs/heads/<branch>` nor pushes: the ref is `g12_branch_push`'s, after the name is recorded, so an exit between the two can never leave a ref this script created unrecorded (`harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path, success and failure alike, and never removes one it did not create."*). Unreferenced objects are left to `git gc`.
  - The temporary index file is removed on every exit path, with `rm -f` of that one file and no recursion.
  - The checkout's own index, `HEAD` and working tree are never touched.
- [ ] `g12_branch_push <row> <arm> <branch> <commit>` — the one producer of a `branches[]` entry, called by `g12_plant_cmd` here and by Task 5 for the JS3 branch:
  - First refuse (raise 3, return non-zero, record nothing) when `git -C "$G12_ROOT" show-ref --verify --quiet refs/heads/<branch>` finds the ref already present: it is not this run's, and recording it would let `teardown` delete a ref it did not create.
  - Record `{name:<branch>,row,arm,commit}` in `branches[]` through `g12_state_update`. A failed recording raises 3 and returns non-zero with nothing else created.
  - **Only then** create the local ref with `git -C "$G12_ROOT" update-ref refs/heads/<branch> <commit> ""` (the empty old value refuses an existing ref). If `update-ref` fails, remove the entry just recorded through `g12_state_update`, raise 3 and return non-zero, so the state never names a ref that was not created here.
  - So both the ref and the push happen after the name is recorded, and a failed push still leaves the name for `teardown`.
  - Push with `git -C "$G12_ROOT" push --no-verify origin refs/heads/<branch>:refs/heads/<branch>`. This is the operator's deliberate push, as the round's own commands push.
  - A failed push raises 3 and returns non-zero; the caller stops for that branch and does not dispatch it.
- [ ] `g12_dispatch <row> <arm> <branch>`:
  - Run `bash "$G12_ROOT/$G12_SCRIPTS_DIR/remote-run.sh" dispatch <branch> --engine task` from `G12_ROOT`. That file is the one place the run workflow's dispatch is composed (`cli/templates/scripts/remote-run.sh`, header).
  - Then find the run ID with `gh run list --repo "$G12_REPO" --workflow harness-run.yml --branch <branch> --json databaseId,createdAt,displayTitle --limit 20`. Take the newest run whose `displayTitle` is `harness run <branch>`; the run title is a wire (`harness-run.yml` → `run-name`).
  - Retry the lookup at most `G12_RUN_LOOKUP_TRIES` times, `G12_RUN_LOOKUP_DELAY_SECS` apart. These default to 10 and 3, are read from the environment as a test seam, and are named in the header.
  - Append `{row,arm,branch,run_id,dispatched_at}` to `runs[]`.
  - Running out of tries records `run_id: null` and raises 3, naming the branch and the `gh run list` command to find it by hand (`harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded"*).
- [ ] `g12_plant_cmd`:
  - Call `g12_state_init`.
  - For each selected `plant`-route row (JS1, JS4, SB2, RJ2) and each of its arms, refuse an arm whose row and arm `branches[]` already records, naming `teardown`.
  - Otherwise name the branch `gate12_<row lower-case>_<arm>_<UTC yyyymmddHHMMSS>`, call `g12_plant_files` into a `mktemp -d` directory, then `g12_branch_build`, `g12_branch_push` and `g12_dispatch`.
  - Remove the temp directory's files by name, then `rmdir` it.
  - Print one stdout line per arm: `planted <row> <arm> <branch> run <id>`.
  - Only route `plant` rows are planted. SB4's route is `reads-SB2` (Task 1), so `--row SB4` prints its note — it reads SB2's job — and plants nothing. Any other non-`plant` row named by `--row` is printed the same way, as not this subcommand's.
- [ ] `#!/usr/bin/env bash` on the first line (`.claude/context/conventions.md` → `## Shell assets`), then a header: what it changes (local refs `refs/heads/gate12_*`, the branches on origin, the state file), and that it deletes nothing; `teardown` does.

**Verification:**

- **Without Task 4.** In a throwaway fixture repository under the system temp directory (bare origin, a checkout run from the fixture's root whose origin URL names the slug and whose seed commit carries `harness.config.json`, a `.github/workflows/harness-run.yml` with the `Install the sandbox prerequisites` step and a stub `<scriptsDir>/remote-run.sh` that logs its argv to a file outside the checkout and exits 0, and a `.gitignore` holding the one line `<stateDir>/scratch/*` — the scratch contents rule `init`'s managed block renders (`{{scratchGlob}}`), so the state file under `<stateDir>/scratch/gate12-sandbox-round/` is ignored as in an adopted repository — and a stub `gh` on `PATH` answering `repo view` with the default branch and `run list … --branch <b>` with one run titled `harness run <b>`), an ad hoc `bash` snippet — nothing committed — sources `core.sh`, `preflight.sh`, `state.sh` and `plant.sh`, sets `G12_REPO` to the slug, runs `g12_preflight` and `g12_state_init`, writes a hand-written `task_prompt.md` and a one-line `manifest` into a `mktemp -d` directory, then calls `g12_branch_build`, `g12_branch_push JS1 settings <branch> <commit>` and `g12_dispatch JS1 settings <branch>`. Check:
  - the pushed branch on the bare origin is the prompt commit plus one plant commit on the seed tip, the plant commit's `git diff-tree --no-commit-id -r` listing exactly the manifest's path and mode;
  - an empty `manifest` instead builds the prompt commit only;
  - the stub `remote-run.sh` log holds `dispatch <branch> --engine task`;
  - the state file's `branches[]` and `runs[]` each hold the branch, `runs[]` with the stub's run ID;
  - the fixture checkout's `git status --porcelain` and `HEAD` are unchanged;
  - after `g12_branch_build` alone, `git show-ref --verify refs/heads/<branch>` finds no ref; after `g12_branch_push` it does, and `branches[]` already held the name;
  - a `g12_branch_push` for a branch whose local ref was created beforehand by hand returns non-zero and leaves `branches[]` without that name.
- The `plant --row JS1` end-to-end check is Task 4's, because it needs Task 4's `g12_plant_files`.
- `commands.typecheck` passes.
