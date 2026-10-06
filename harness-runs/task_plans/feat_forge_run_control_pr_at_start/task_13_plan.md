### Task 13 — Plugin flow documents: the pull request opens at start, and the ledger's ids have a shell reader

**Goal:** Bring the two plugin documents that state these facts up to date with what Tasks 2, 4 and 6 ship. `plugin/docs/AUTONOMOUS_FLOW.md` still says the run's GitHub workflow opens its draft pull request *after the run has pushed*, through `deliver`. And the ledger template's owner, `plugin/instructions/autonomous_pause_and_ledger.md`, must name the shell function that now reads its entry ids, so that renaming an id is an edit in both places.

**Depends on:** Task 2, which adds `hr_ledger_phases` to `<scripts_dir>/lib/harness-run-lib.sh`. It maps the task engine's ids to four phases as `P1 P2 P3` / `A` / `A1.5g A1.5f A2g A2f Bg Bm C C2g C2m C2f E G` / `D`, and the user-review engine's as `R1 R2` / `R3` / `R4 RG` / `R5`, read off both templates' header lines (`(engine: task)`, `(engine: user_review, round <n>)`). Also Task 4, which adds the job-side `remote-run.sh open` verb, run by `harness-run.yml`'s `Open the draft pull request` step before the harness step. `deliver` then marks the pull request ready and opens one only when none is open (Task 6).

**Where this task stops.** These two files only. The flow itself still never opens or pushes a pull request: the `**Every run ends at "branch ready for review."**` paragraph and the `## Out of scope in this release` bullet stay true and are not edited (story-index scope register rows 16 and 17). No ledger id, heading or template line changes. This task adds a pointer, not a rule.

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md` — the opening paragraph's sentence *"Where the forge coupling is on, the run's GitHub workflow opens a draft pull request after the run has pushed"*, and `## The wiring table`'s *Remote execution* row (*"its `deliver` verb, a step of `harness-run.yml` after the push, opens the draft pull request"*).
- `plugin/instructions/autonomous_pause_and_ledger.md` — `### 1.3 Templates (fixed — the driving fork lays this down verbatim, substituting `<branch>`)`.

**Work:**

- [ ] `AUTONOMOUS_FLOW.md`, the opening paragraph: *Where the forge coupling is on, the run's GitHub workflow opens a draft pull request when the run's job starts and marks it ready for review when the run completes — that workflow is neither the flow nor an entry point.* Keep the clause that the workflow is neither the flow nor an entry point.
- [ ] `AUTONOMOUS_FLOW.md`, the *Remote execution* row: replace the `deliver` clause with *its `open` verb, a step of `harness-run.yml` before the harness step, opens the draft pull request; its `deliver` verb, after the push, marks it ready and posts `completed` on it and on the source issue*. The rest of the row stays as it is. Cite the format of record as the row already does (`docs/github-run-control.md`), repo-relative and never as a `${CLAUDE_PLUGIN_ROOT}` path, since it lies outside the plugin (`.claude/context/plugin.md` → `## Citation`).
- [ ] `autonomous_pause_and_ledger.md` → `### 1.3`: after the two templates, add one short paragraph. The entry ids and the two header forms above are also read by a shell function, `<scripts_dir>/lib/harness-run-lib.sh` → `hr_ledger_phases`, which maps them to the four phases a GitHub run's progress comment shows. Renaming, adding or removing an id here is therefore an edit to that function in the same change. `<scripts_dir>` is already declared in this file's `## Resolved values`, so no token is added. Quote no id list in the paragraph, because the templates above are the list.

**Verification:**

- Grep `plugin/docs/AUTONOMOUS_FLOW.md` for `after the run has pushed` and for `` `deliver` verb, a step of `harness-run.yml` after the push, opens `` and find neither.
- Grep `plugin/instructions/autonomous_pause_and_ledger.md` for `hr_ledger_phases` and find exactly the new paragraph, inside `### 1.3`.
- Read `git diff HEAD -- plugin/docs/AUTONOMOUS_FLOW.md` before committing, and confirm that no hunk falls inside the `**Every run ends at "branch ready for review."**` paragraph or the `## Out of scope in this release` section.
