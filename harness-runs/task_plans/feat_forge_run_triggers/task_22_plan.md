### Task 22 — Document the new verbs, the trigger workflow and the `forge` check in `docs/cli.md` and `docs/watcher.md`

**Goal:** Bring the CLI's document of record, and the watcher document's scripts table, level with what `init`, `doctor` and the outer-loop scripts now do (scope register rows 49 and 50):

- `init` writes `harness-trigger.yml` under one condition, with its own re-run contract;
- `doctor` gains the `forge` check, and `--check-github` asks about the trigger;
- `create-worktree.sh` gains `--no-bootstrap`;
- `remote-run.sh` gains `start`, `trigger` and `adopt`.

**Depends on:**

- Task 13: the generator's condition, the re-run table row, and the absence of any new `.gitignore` line;
- Tasks 14 and 15: the `forge` check's grades and the `--check-github` additions;
- Task 5: `--no-bootstrap`;
- Tasks 6, 7, 8 and 10: the new verbs, each described in `remote-run.sh`'s own header, which this document cites rather than restates;
- Task 20, whose `docs/github-issue-trigger.md` these rows point at.

**Where this task stops.** It describes and cites. Every behaviour it names is stated normatively in the module or script header that owns it; this document summarises and points. The remote run's design is `docs/remote-execution.md`'s (Task 21), and the trigger's is `docs/github-issue-trigger.md`'s (Task 20).

### Targets

- `docs/cli.md` — `## 2. \`init\``, `## 3. The re-run contract` and `## 7. \`doctor\``.
- `docs/watcher.md` — the scripts table's `create-worktree.sh` and `remote-run.sh` rows.

**Work:**

- [ ] **`docs/cli.md` → `## 2.`**: where `init`'s description names the two workflows it writes under `execution.target` `github-actions`, add the third. `harness-trigger.yml` is written when `forge` is also `github`, and the closing report then names the trigger label and `gh label create`. Point at `docs/github-issue-trigger.md`.
- [ ] **`docs/cli.md` → `## 3.`**: add a table row after `harness-resume.yml`'s: `.github/workflows/harness-trigger.yml` (written only when `forge` is `github` and `execution.target` is `github-actions`) | create-if-absent | copied verbatim with no pin; `--upgrade-workflows` leaves it, because it calls the scripts on the default branch and shares their `--force` route. The row for *".gitignore's `.bak` lines for the two workflows"* stays true as written, since this branch adds no ignore line. Leave it, and add one clause to the new row saying why the file needs none: no upgrade ever `.bak`s it.
- [ ] **`docs/cli.md` → `## 7.`**:
  - The check table gains a `forge` row, placed after `remote-github` as `CHECKS` orders them: *the configured forge, and what starts a run from it*.
  - A bullet beside the `remote-execution` / `remote-github` bullet states its grades: `pass` naming *not yet decided* when the key is absent; `pass` for `none` and `gitlab`; `warn` for `github` with remote execution off, the trigger workflow absent, or the workflow not on `origin/<defaultBranch>`. It never fails, and it is the key's reporter (`ARCHITECTURE.md` → `## 8.`).
  - The `remote-github` bullet gains the two `--check-github` questions asked only when the trigger applies: whether GitHub knows `harness-trigger.yml`, and whether the trigger label exists.
- [ ] **`docs/watcher.md`**, the scripts table:
  - the `create-worktree.sh` row adds that `--no-bootstrap` cuts and pushes without the hand-off to `setup-worktree.sh`, for `remote-run.sh start` in a trigger job;
  - the `remote-run.sh` row's verb list adds `start`, `trigger` and `adopt`, placed with the side each runs on. `trigger` and `start` run in the trigger job; `adopt` runs locally, on a command's request, never from the watcher's tick.

  The *agent-invocable* column is unchanged for both rows.

**Verification:**

- `grep -n "harness-trigger.yml" docs/cli.md` shows the `## 2.` sentence and the `## 3.` row.
- `grep -n "| \`forge\` |" docs/cli.md` shows one table row.
- `git grep -n "no-bootstrap\|adopt" -- docs/watcher.md` shows the two amended rows.
