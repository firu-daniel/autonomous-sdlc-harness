### Task 16 — Adopt runs started on GitHub before the four syncing commands sync

**Goal:** Make a trigger-started run workable from the local commands for a maintainer who also has a local setup (acceptance 5). The four commands that already sync a remote record before acting — `/autonomous-sdlc-harness:branch-answer`, `branch-resume`, `branch-pause` and `branch-user-review` — first run `remote-run.sh adopt` once. A run started on GitHub then has a record and a mirror by the time they build their candidate set, and each command's existing *"Remote records sync first"* step brings it level. From there an adopted run is an ordinary remote record: an answer, a `RESUME` or a `PAUSE` written into its mirror is relayed by the local watcher, exactly as for a remote run dropped locally.

**Depends on:** Task 10's `remote-run.sh adopt [--repo <root>]`. Its outputs and exit codes are:

- it prints `remote-run.sh: adopted <branch> (<url>)` per adopted branch, or `remote-run.sh: nothing to adopt`;
- 0 on success, 2 when `execution.target` is not `github-actions` (nothing written), 3 when the listing failed (nothing written), and 4 when at least one branch could not be adopted (the others were).

**Where this task stops.** It adds one step and amends the scope fences of four command files. It does not touch `branch-status`, whose read-only listing is Task 17's, and it changes nothing about how any command writes its marker or answer file. A remote-only maintainer runs none of these commands. Their route is the GitHub one Task 21 documents.

### Targets

- `plugin/commands/branch-answer.md`
- `plugin/commands/branch-resume.md`
- `plugin/commands/branch-pause.md`
- `plugin/commands/branch-user-review.md`

**Work:**

- [ ] **The new sub-step**, placed in each file's step 2 directly before its existing **Remote records sync first.** bullet, in the same bullet form and with identical wording in all four:

  **Runs started on GitHub are adopted first.** Before syncing, run `bash <scripts_dir>/remote-run.sh adopt` once. It writes a record and a mirror for every `harness run <branch>` run on GitHub whose branch is live, unprotected and unknown to the registry, then syncs each one. Handle its exit status as follows:
  - exit 0: report each `adopted <branch>` line it printed, and nothing when it printed `nothing to adopt`;
  - exit 2: remote execution is off, so say nothing;
  - exit 3 or 4: report its message and carry on with the registry as it stands.

  Never guess about a branch it did not adopt. An adopted run is an ordinary remote record from here on, and the sync below includes it.
- [ ] **The scope fences.** Each file's closing or scope sentence *"The only script it invokes is `<scripts_dir>/remote-run.sh sync`, for a remote record"* becomes *"The only scripts it invokes are `<scripts_dir>/remote-run.sh adopt`, once, and `<scripts_dir>/remote-run.sh sync`, for a remote record"*. The rest of each fence (what it must NOT modify) is unchanged. In `branch-pause.md`, the sentence that names `remote-run.sh stop` without running it is unchanged.
- [ ] **`## Resolved values`**: in each file's `<scripts_dir>` row, the clause naming the `sync` verb gains the `adopt` verb, for the same step.
- [ ] **The prefix case.** In `branch-answer.md`, `branch-resume.md` and `branch-pause.md`, where a `<branch>:` prefix names a branch the registry does not hold after the adopt step, the command reports that no run of that name is known locally or on GitHub and stops. The adopt step is what makes a trigger-started branch known, so the command never writes a file for an unknown branch. `branch-user-review.md` keeps its own candidate rule unchanged.

**Verification:**

- `grep -c "Runs started on GitHub are adopted first" plugin/commands/branch-answer.md plugin/commands/branch-resume.md plugin/commands/branch-pause.md plugin/commands/branch-user-review.md` prints `1` for each file.
- `grep -n "The only script it invokes is" plugin/commands/branch-answer.md plugin/commands/branch-resume.md plugin/commands/branch-pause.md plugin/commands/branch-user-review.md` prints nothing.
- `grep -n "remote-run.sh adopt" plugin/commands/branch-status.md` prints nothing: the never-sync command does not adopt. Task 17 later adds only the read-only `adopt --list` there.
