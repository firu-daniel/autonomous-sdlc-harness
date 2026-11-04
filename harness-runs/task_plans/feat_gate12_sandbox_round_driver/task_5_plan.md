### Task 5 — Add `default-branch.sh`: round step 8 for JS3, restoring the default branch and the stall variables on every exit path

**Goal:** Take round step 8 as `docs/development.md` → **The sandbox series round (#170 step 4) — not yet run.** gives it, for JS3:
1. Record the GitHub default branch.
2. Cut and push `<other branch>` from its tip.
3. Switch the default to it.
4. Lower `STALL_WARN_SECS` / `STALL_KILL_SECS`.
5. Plant and dispatch JS3.
6. Restore the default branch and the variables on **every** exit path, an interrupt included.

JS3N is not planted. No route lets the session commit a job surface (story index, route table), and the row's note in `G12_ROWS` says so.

**Depends on:**
- Task 2: `g12_preflight`, `G12_ROOT`, `G12_REPO`, `G12_GITHUB_DEFAULT`, `G12_STATE_DIR`, `g12_state_init`, `g12_state_get` and `g12_state_update`.
- Task 3: `g12_branch_build <branch> <dir>` (writes the commit objects only, prints the tip commit; creates no ref and does not push), `g12_branch_push <row> <arm> <branch> <commit>` (refuses a local ref that already exists, records `{name,row,arm,commit}` in `branches[]`, **then** creates `refs/heads/<branch>` with `update-ref` — dropping the record if that fails — and runs `git push --no-verify`; raises 3 and returns non-zero when any of those fails), `g12_dispatch <row> <arm> <branch>` (dispatches and appends to `runs[]`), and the branch-name form `gate12_<row>_<arm>_<stamp>`. **This task records the JS3 branch only through `g12_branch_push`**, so `teardown` (Task 9), which deletes `branches[]` plus `other_branch`, removes it from origin.
- Task 4: `g12_plant_files`. **This task adds the JS3 case to the dispatch it calls through its own function.** Task 4's file is not edited. The JS3 manifest is empty and its prompt is an honest task, so this task writes them itself in `g12_js3_files <branch> <dir>`, in the same manifest form: `<dir>/task_prompt.md`, plus an empty `<dir>/manifest`. `g12_branch_build` is told to skip the plant commit when the manifest is empty; Task 3's builder must accept an empty manifest as *prompt commit only*.
- Task 1: `G12_OTHER_BRANCH`, `G12_STALL_WARN_SECS`, `G12_STALL_KILL_SECS` and `G12_WAIT_SECS`, always set by the entry point. Task 1's argument-parsing bullet owns their defaults (`gate12_other_<UTC yyyymmddHHMMSS>`, `60`, `120` and `600`); this task applies none of its own.
- **This task writes `stall_values_unconfirmed: true`** on the JS3 `runs[]` entry when the wait times out (Work below). The key is declared in Task 2's `state.sh` header as an optional `runs[]` key (boolean, read as `false` when absent, written only here); this task writes it to that declaration and adds no key of its own. Task 7 reads it.

**Why these routes.** The `run` job's `env:` in `harness-run.yml` carries `STALL_WARN_SECS: ${{ vars.STALL_WARN_SECS }}` and `STALL_KILL_SECS: ${{ vars.STALL_KILL_SECS }}`, so repository variables reach the watcher. `HARNESS_GITHUB_DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}` is fixed when the run is dispatched. So the default branch must be switched **at dispatch**, and the variables must stay set until the job has **started**.

### Targets

- `scripts/lib/gate12-sandbox-round/default-branch.sh` (new).

**Work:**

- [ ] Refusals and recording, before anything changes:
  - Refuse (2) while any run in the state file's `runs[]` is `queued`, `waiting`, `requested`, `pending` or `in_progress`, read through `gh run view <id> --repo "$G12_REPO" --json status`. Step 8 is the last job leg *"so it disturbs none of the others"*.
  - Refuse when `default_branch` is already recorded and differs from the live default. That would be a previous run left unrestored; name the `gh repo edit` command that restores it.
  - Refuse (2) when `other_branch` is already recorded in the state file, naming `teardown` as the way to clear it — the same per-arm refusal `g12_plant_cmd` applies to an already-recorded arm. `other_branch` is a single key, so a second leg on the same state file would otherwise overwrite the first `<other branch>`'s name and leave that branch on origin unrecorded, beyond `teardown`'s reach.
  - Record `default_branch`, and each variable's prior state from `gh variable list --repo "$G12_REPO" --json name,value` as `variables.<NAME> = {present, value, restored:false}`.
- [ ] Install the restore with `trap g12_db_restore EXIT INT TERM HUP` **before** the first change. Then:
  1. `git fetch origin`.
  2. Record `other_branch` through `g12_state_update` **first**, then run `git push --no-verify origin refs/remotes/origin/<default>:refs/heads/<other>`, the command step 8 gives. Recording before the push means no interrupt between the two can leave `<other branch>` on origin unrecorded — the story index's invariant that no ref this script creates is ever unrecorded. A record left behind by a failed push is harmless: Task 9's `teardown` deletes a recorded branch only when `git ls-remote --heads origin <name>` lists it, and drops the name either way.
  3. `gh repo edit "$G12_REPO" --default-branch <other>`.
  4. `gh variable set STALL_WARN_SECS --repo … --body <n>`, and the same for `STALL_KILL_SECS`.
  5. For the JS3 branch, cut from the recorded default's tip (step 8: *"a new branch cut from the default branch's tip"*), with row `JS3` and arm `stall`: `g12_js3_files`, then `g12_branch_build`, then `g12_branch_push JS3 stall <branch> <commit>` (which records it in `branches[]` before pushing), then `g12_dispatch JS3 stall <branch>`. A failed push stops before the dispatch; the trap still restores.
- [ ] Wait until the JS3 run's status is `in_progress` or `completed`, polling `gh run view --json status` until `G12_WAIT_SECS` has passed.
  - Past the deadline, restore anyway. Print a stderr line saying the job may not have read the lowered values, and record `"stall_values_unconfirmed": true` on its `runs[]` entry.
- [ ] `g12_db_restore` is idempotent and runs once. It:
  - sets the default branch back to the recorded one;
  - restores each variable to its recorded value, or deletes it with `gh variable delete` when it was absent;
  - marks `restored:true`.
  - **`<other branch>` is kept until `teardown`.** The JS3 job's checkout already holds it, and teardown deletes it as a recorded branch.
  - A step that fails prints the exact command to finish it by hand and raises 5.
  - On an interrupt it exits after the restore with 130, raised to 5 if a restore failed.
- [ ] `g12_default_branch_cmd` wires the above. The file opens with `#!/usr/bin/env bash` on the first line (`.claude/context/conventions.md` → `## Shell assets`); its header states what it changes on GitHub, and that every change is undone by the trap whatever happens after it.

**Verification:**

- Against the fixture with a `gh` stub that records calls, a run where every call succeeds ends with the stub's recorded default branch and variables equal to their starting values, and the state shows `restored:true` and a `branches[]` entry with row `JS3`, arm `stall`.
- A state file whose `other_branch` is already recorded makes the leg exit 2 with no push to the fixture origin and no `gh repo edit` call.
- A stub failing the dispatch, and a `SIGINT` sent while the wait loop polls, each still end with both restored.
- `commands.typecheck` passes.
