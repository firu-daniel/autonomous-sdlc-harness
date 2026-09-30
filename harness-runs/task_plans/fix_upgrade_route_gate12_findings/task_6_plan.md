### Task 6 — Bring `docs/cli.md`, the Gate 12 round 4 record and Gate 12 observation (xii) in line with the fixes

**Goal:** Update the CLI reference so it describes what `init --upgrade-workflows`, `doctor`'s version warning and the managed `.gitignore` block do after this branch. Correct the one sentence of the Gate 12 round 4 record that this branch makes untrue: "All six are carried to a follow-up fix." Correct Gate 12 observation (xii)'s commit instruction, which this branch makes incomplete.

**Depends on:** Tasks 1, 2 and 3, whose behaviour these rows describe:

- **Task 1:** `doctor`'s version warning now carries the in-flight sentence, which ends `(docs/remote-execution.md, section 7, Upgrading)`, and joins its push step without a doubled full stop. Its move route now says to commit the paths the upgrade's printed `git add` names, not the two workflows.
- **Task 2:** the managed block now ignores `.github/workflows/harness-run.yml.bak`, `.github/workflows/harness-resume.yml.bak` and `.claude/settings.autonomous.json.bak`, ungated and by exact path. Every other `--force` `.bak` stays visible.
- **Task 3:** an upgrade that replaced the run workflow prints its own steps. Those are `git status --short`, a `git add` naming the workflows plus any merged shared file, `git commit -m "Upgrade the harness workflows to <version>"`, the scope refresh, the `--no-verify` push and the in-flight sentence. It no longer prints the first-setup block.

**Where this task stops.** The adopter-facing route itself, meaning the in-flight explanation and the commands to move a run, is **Task 5's**, in `docs/remote-execution.md` → `### Upgrading`. The rows here point there rather than restate it. The round 4 record is a dated document of record. Only its closing disposition sentence changes; the legs and the numbered findings stay exactly as recorded (`.claude/context/conventions.md` → `## Documents of record`). Observation (xii) is not part of that record: it is the standing gate procedure the next round follows, so its commit instruction is edited like any procedure.

**Why (xii) changes.** The next Gate 12 run starts from a scratch repository adopted with the previous release, so its managed `.gitignore` block lacks Task 2's three `.bak` lines. The `init --upgrade-workflows` step in (xii) merges them in, which changes a tracked file. (xii) today says "Commit the two workflows and push them with `--no-verify`". Followed as written, it leaves `.gitignore` uncommitted, and the next job then fails its `Generate the job's permission profile` step on `init … changed tracked files`. That is the very pass criterion (xii) states ("passes the version check and runs").

**How this task's implementer reads the conventions.** This is the catch-all layer, so read `.claude/context/conventions.md` plus `.claude/context/cli.md` and `.claude/context/plugin.md`.

### Targets

- `docs/cli.md`: the `## 2.` flag table's `--upgrade-workflows` row, the `## 3.` re-run table's `.gitignore` rows, and the `remote-execution` / `remote-github` bullet of `doctor`'s check descriptions.
- `docs/development.md`: Gate 12 → **Round 4**, the sentence "All six are carried to a follow-up fix."; and Gate 12 observation **(xii)**, the sentence after the `init --upgrade-workflows` command block that begins "Commit the two workflows and push them with `--no-verify`, as *Setup* does".

**Work:**

- [x] `docs/cli.md` `--upgrade-workflows` row: replace "The run names each replaced file with `git diff --no-index <path>.bak <path>` to compare it by." with a sentence covering the new report. The run still names each replaced file with that diff command. It then prints the upgrade's own commit route instead of the first-setup steps, with `git add` naming the workflows and any shared file the run merged into, and commit message `Upgrade the harness workflows to <version>`. It says a run already in flight keeps its version. Also say that the managed `.gitignore` block ignores both `.bak` files. Keep the row's closing pointer to `remote-execution.md` → `### Upgrading`.
- [x] `docs/cli.md` `## 3.` re-run table: add a row beside the `.gitignore`'s `<stateDir>/docs_index/` line row, in its shape: `` `.gitignore`'s `.bak` lines for the two workflows and the permission profile `` | merge-lines, in the same managed block | a reason cell saying these are the copies `--upgrade-workflows` and `--force` take. The workflow copies are named in the upgrade's diff commands, and the profile copy carries machine paths. Every other `.bak` a forced run takes is deliberately left visible.
- [x] `docs/cli.md` `doctor` bullet ("`remote-execution` and `remote-github` both pass where …"): after "Its text names both ways out — …", add that it also says a run already in flight keeps the version it started with, pointing at [`remote-execution.md`](remote-execution.md) → `### Upgrading`.
- [x] `docs/development.md` Round 4: replace "All six are carried to a follow-up fix." with a disposition that stays true:
  - Findings 1, 3, 4, 5 and 6 are fixed by the follow-up.
  - For finding 1 the fix is documentation plus a sentence in the upgrade report and the warning, because a run keeping its version is intended.
  - Finding 2 is not carried, because no repository carries a workflow rendered before the pinned install (remote execution has no adopters).

  Name no release number: the fix's release is not cut yet.
- [x] `docs/development.md` observation (xii): replace "Commit the two workflows and push them with `--no-verify`, as *Setup* does," with "Commit the paths the upgrade's printed `git add` names, which include `.gitignore` when the upgrade merged the managed block's new lines into it, and push them with `--no-verify`, as *Setup* does,". Keep the rest of that sentence ("then let the watcher dispatch the task again") and every other sentence of (xii), including its pass criteria and its `claude plugin list --json` record line, byte-identical.

**Verification:**

- Re-run derivation entries A and C from the story index's `## Scope register` verbatim. Every site marked `change` for Task 6 (rows 6, 9, 17, 18 and 30) reads true against Tasks 1 to 3's behaviour as their per-task files state it. The rows marked `no-change` in these two files are unedited.
- `git diff docs/development.md` touches only two sentences: the Round 4 disposition sentence and (xii)'s commit sentence. The Round 4 legs, its numbered findings and its leading paragraph are byte-identical, and so is the rest of (xii).
- Walk (xii) as the next Gate 12 round would, against Task 3's per-task file: from a repository whose `.gitignore` block lacks Task 2's lines, the paths (xii) now says to commit are exactly the ones Task 3's printed `git add` names, `.gitignore` included.
- Every command a changed row names (`Upgrade the harness workflows to <version>`, `git diff --no-index <path>.bak <path>`) is spelled exactly as Task 3 prints it.
