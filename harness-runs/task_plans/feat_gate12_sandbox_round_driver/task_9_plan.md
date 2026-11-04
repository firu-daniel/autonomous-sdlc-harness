### Task 9 — Add `teardown.sh`: delete the recorded branches and confirm the default branch

**Goal:** `teardown --repo <slug>` deletes every branch the state file records, locally and on origin, and nothing else. It confirms that the repository's GitHub default branch is the recorded one. Resetting the repository to its seed stays round step 10, by hand, and the repository is never deleted.

**Depends on:**
- Task 2: `g12_preflight`, `G12_ROOT`, `G12_REPO`, `g12_state_get` and `g12_state_update`. The state's `branches[]` items carry `name`, `row`, `arm` and `commit`. `other_branch` names step 8's branch, and `default_branch` the recorded default.
- Task 5: `variables.<NAME>.restored`.
- Task 1: `g12_refuse` and `g12_exit_raise`. Exit 5 means *a removal left something, named on stderr*.

### Targets

- `scripts/lib/gate12-sandbox-round/teardown.sh` (new).

**Work:**

- [ ] `g12_teardown_cmd` handles each recorded name, in `branches[]` plus `other_branch`:
  - When `git ls-remote --heads origin <name>` lists it, delete it with `git -C "$G12_ROOT" push --no-verify origin --delete <name>`, the form round step 8 gives.
  - Delete the local ref with `git update-ref -d refs/heads/<name>`, only when it exists.
  - Remove the name from the state as soon as both are gone.
  - A failure keeps the name in the state, prints the command that finishes it by hand, and raises 5.
  - A branch **not** in the state is never touched, whatever its name looks like (`harness-runs/lessons.md` → *"never removes one it did not create"*).
- [ ] Confirm `gh repo view "$G12_REPO" --json defaultBranchRef --jq .defaultBranchRef.name` equals `default_branch`, when one is recorded. A mismatch prints the `gh repo edit "$G12_REPO" --default-branch <recorded>` command and raises 5, without changing it.
  - A recorded variable whose `restored` is `false` likewise prints its restore command and raises 5.
- [ ] Leave `runs[]`, `tokens` and the downloaded evidence under `<stateDir>/scratch/gate12-sandbox-round/` in place. They are what `grade` re-reads, and the step-10 reset to the seed removes them. Print one last line, `teardown: <n> branch(es) deleted; default branch <name> confirmed`.
- [ ] `#!/usr/bin/env bash` on the first line (`.claude/context/conventions.md` → `## Shell assets`), then a header: what it deletes, what it never deletes, and why it confirms rather than restores.

**Verification:**

- On a fixture whose origin holds two recorded branches and one unrecorded `gate12_x` branch, `teardown` deletes the two and leaves `gate12_x`, and the state's `branches[]` is empty.
- A stub reporting a different default branch exits 5 naming the restore command.
- `commands.typecheck` passes.
