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

**Deviations from plan:**
- The last line has two more tails than the plan's one form. When no `default_branch` is recorded there is nothing to confirm against, so it reads `default branch <live> unchanged (none recorded)`. On a mismatch it reads `default branch <live> not confirmed (recorded <name>)`.
- A recorded name that equals the live GitHub default or the recorded `default_branch` is not deleted. It stays in the state, and teardown raises 5 and says to restore the default branch first. GitHub refuses to delete its default branch, and the other branch is the live default exactly when the default-branch leg's restore failed. The default is read before any deletion for this reason, and a failed `gh repo view` deletes nothing and raises 3.
- An absent state file is not created. Teardown reports that nothing is recorded, prints the live default with the `none recorded` tail, deletes nothing, and exits 0.
- Evidence downgrade: `bash scripts/typecheck.sh` printed `PASS: typecheck` and `check-shell-parse: 121 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`. That parse check covers git-listed files only, and `teardown.sh` is untracked until it is committed. A direct `/bin/bash -n` on the file was refused by the tool layer. The parse claim rests on the probe below, which sourced the file and ran `g12_teardown_cmd` under `/bin/bash` 3.2 through the real entry point. The Run gates phase's parse gate covers it once it is committed.
- Verification evidence: `bash scripts/scratch-run.sh harness-runs/scratch/task9_teardown_probe.py <repo_root> /bin/bash` ended with `ALL CASES AS EXPECTED`. (A) A fixture had two recorded branches and a recorded `other_branch` on origin and locally, plus an unrecorded `gate12_x`. The probe exited 0, left origin heads `gate12_x, main`, left `branches[]` empty and `other_branch` null, and kept `runs[]` and `tokens`. The last line was `teardown: 3 branch(es) deleted; default branch main confirmed`. (B) A stub reporting default `gate12_other_probe` made the probe exit 5, and stderr carried `gh repo edit o/n --default-branch main`. The live-default branch was kept. (C) Variables recorded `restored: false` made the probe exit 5 and print the `gh variable set …` / `gh variable delete …` commands. (D) With no state file the probe exited 0 and deleted nothing. The gh stub refuses `repo edit` and `variable set/delete`, and none was called.
